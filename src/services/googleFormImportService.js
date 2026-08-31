import * as XLSX from "xlsx";
import {
  collection,
  doc,
  getDocs,
  increment,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS } from "../constants/collections";
import { createCohort, createForm, createParticipant } from "../entities";
import { REGISTRATION_STATUS } from "../constants/status";
import { normalizeSlug, isSlugAvailable } from "./formService";
import {
  getAnswerValueByKeywords,
  normalizeGender,
  calculateAge,
} from "./publicRegistrationService";

// ---------------------------------------------------------------------------
// File parsing
// ---------------------------------------------------------------------------

export const parseWorkbookFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("A CSV or XLSX file is required."));
      return;
    }

    const isCsv = /\.csv$/i.test(file.name) || file.type === "text/csv";
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Failed to read the file."));

    reader.onload = (event) => {
      try {
        let workbook;

        if (isCsv) {
          // A raw CSV carries no charset metadata the way XLSX's internal
          // XML does — letting XLSX guess the byte encoding of the array
          // buffer mangles non-Latin scripts (Bengali becomes "à¦...à¦"
          // mojibake). Decode explicitly as UTF-8 text first instead.
          let text = new TextDecoder("utf-8").decode(event.target.result);
          if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM if present
          workbook = XLSX.read(text, { type: "string" });
        } else {
          const data = new Uint8Array(event.target.result);
          workbook = XLSX.read(data, { type: "array" });
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const headerRow =
          XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" })[0] || [];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });

        // Keep each header's exact original text (not trimmed) — XLSX's
        // sheet_to_json() uses row 1's raw cell text as every data row's
        // object keys, and several of this form's real headers carry
        // leading/trailing whitespace. Trimming here would make row[header]
        // lookups miss for those columns everywhere downstream, silently
        // losing that column's data for every row.
        const headers = headerRow.map((h) => String(h)).filter((h) => h.trim());

        if (headers.length === 0 || rows.length === 0) {
          reject(new Error("No data found in the uploaded file."));
          return;
        }

        resolve({ headers, rows });
      } catch (error) {
        reject(new Error(error.message || "Failed to parse the file."));
      }
    };

    reader.readAsArrayBuffer(file);
  });
};

// ---------------------------------------------------------------------------
// Bilingual header splitting
// ---------------------------------------------------------------------------

const BENGALI_CHAR = /[ঀ-৿]/g;
const LATIN_CHAR = /[A-Za-z]/g;

const countMatches = (text, pattern) => (String(text).match(pattern) || []).length;

// Headers look like "<বাংলা> / <English>", sometimes split across a line
// break. Inline slashes with no adjacent whitespace ("টি/গুলো", "play/(s)")
// must NOT be treated as the language separator — only a "/" with
// whitespace on at least one side counts.
export const splitBilingualLabel = (rawHeader) => {
  const header = String(rawHeader || "").trim();
  if (!header) return { label_en: "", label_bn: "" };

  let splitIndex = -1;

  for (let i = 0; i < header.length; i += 1) {
    if (header[i] !== "/") continue;

    const before = header[i - 1];
    const after = header[i + 1];
    const beforeIsSpace = before === undefined || /\s/.test(before);
    const afterIsSpace = after === undefined || /\s/.test(after);

    if (beforeIsSpace || afterIsSpace) {
      splitIndex = i;
      break;
    }
  }

  if (splitIndex === -1) {
    return countMatches(header, BENGALI_CHAR) > 0
      ? { label_en: "", label_bn: header }
      : { label_en: header, label_bn: "" };
  }

  const left = header.slice(0, splitIndex).trim();
  const right = header.slice(splitIndex + 1).trim();

  const leftIsBengali = countMatches(left, BENGALI_CHAR) >= countMatches(left, LATIN_CHAR);
  const rightIsBengali = countMatches(right, BENGALI_CHAR) >= countMatches(right, LATIN_CHAR);

  if (leftIsBengali && !rightIsBengali) return { label_bn: left, label_en: right };
  if (!leftIsBengali && rightIsBengali) return { label_bn: right, label_en: left };

  // Ambiguous (both/neither look Bengali) — keep the original left-to-right order.
  return { label_bn: left, label_en: right };
};

// ---------------------------------------------------------------------------
// Field-type inference (scanned across every row for a column, not guessed
// from a single sample)
// ---------------------------------------------------------------------------

const looksLikeDate = (value) => {
  const text = String(value || "").trim();
  if (!text || !/[/-]/.test(text)) return false;
  const parsed = new Date(text);
  return !Number.isNaN(parsed.getTime());
};

const looksLikeSmallNumber = (value) => /^\d{1,3}$/.test(String(value || "").trim());

const MULTISELECT_ATOMIC_OPTION_CAP = 15;

export const inferFieldType = (header, values) => {
  const nonEmpty = values.map((v) => String(v || "").trim()).filter(Boolean);

  if (nonEmpty.length === 0) return { field_type: "text", options: [] };

  const headerLower = header.toLowerCase();

  if (/email|ইমেইল/.test(headerLower)) return { field_type: "email", options: [] };
  if (/phone|mobile|whatsapp|hotline|মোবাইল|ফোন|হোয়াটসআপ/.test(headerLower)) {
    return { field_type: "phone", options: [] };
  }

  const dateRatio = nonEmpty.filter(looksLikeDate).length / nonEmpty.length;
  if (dateRatio >= 0.6) return { field_type: "date", options: [] };

  const numberRatio = nonEmpty.filter(looksLikeSmallNumber).length / nonEmpty.length;
  if (numberRatio >= 0.6) return { field_type: "number", options: [] };

  const distinct = Array.from(new Set(nonEmpty));

  // Scanned across the whole file, a handful of distinct answers is already
  // a reliable single-select signal — option text length doesn't matter
  // (Google Forms radio/dropdown options can legitimately run long).
  if (distinct.length <= 8) {
    return { field_type: "radio", options: distinct };
  }

  // Google Forms checkbox (multi-select) questions export selected options
  // joined with ", " per row, so distinct *combinations* look unbounded even
  // though the underlying option set is small. Detect this by splitting on
  // commas and checking the atomic option count instead of the raw values.
  const anyMultiValue = nonEmpty.some((v) => v.includes(","));

  if (anyMultiValue) {
    const atomicOptions = new Set();
    nonEmpty.forEach((v) =>
      v
        .split(",")
        .map((piece) => piece.trim())
        .filter(Boolean)
        .forEach((piece) => atomicOptions.add(piece))
    );

    if (atomicOptions.size <= MULTISELECT_ATOMIC_OPTION_CAP) {
      return { field_type: "checkbox", options: Array.from(atomicOptions) };
    }
  }

  const maxLen = Math.max(...nonEmpty.map((v) => v.length));
  const avgLen = nonEmpty.reduce((sum, v) => sum + v.length, 0) / nonEmpty.length;

  if (maxLen > 150 || avgLen > 80) return { field_type: "textarea", options: [] };

  return { field_type: "text", options: [] };
};

// ---------------------------------------------------------------------------
// Column analysis
// ---------------------------------------------------------------------------

const METADATA_HEADERS = ["cohort", "timestamp"];

const findHeader = (headers, name) =>
  headers.find((h) => h.trim().toLowerCase() === name);

export const analyzeColumns = (headers, rows) => {
  return headers
    .filter((h) => !METADATA_HEADERS.includes(h.trim().toLowerCase()))
    .map((header, index) => {
      const { label_en, label_bn } = splitBilingualLabel(header);
      const values = rows.map((row) => row[header]);
      const { field_type, options } = inferFieldType(header, values);

      return {
        header,
        label: label_en || label_bn,
        label_en,
        label_bn,
        field_type,
        options,
        order: index + 1,
      };
    });
};

// ---------------------------------------------------------------------------
// Cohort code normalization ("Rajshahi-26" -> "Raj-26")
// ---------------------------------------------------------------------------

const DIVISION_ABBREVIATIONS = {
  dhaka: "Dha",
  chattogram: "Ctg",
  chittagong: "Ctg",
  rajshahi: "Raj",
  khulna: "Khu",
  barishal: "Bar",
  barisal: "Bar",
  sylhet: "Syl",
  rangpur: "Ran",
  mymensingh: "Mym",
};

const abbreviateFallback = (name) => {
  const letters = name.trim().slice(0, 3);
  if (!letters) return "GEN";
  return letters.charAt(0).toUpperCase() + letters.slice(1).toLowerCase();
};

// Cohort values in the sheet look like "<City>-<YY>" (e.g. "Rajshahi-26").
// The stored cohort_code uses the short division abbreviation ("Raj-26")
// while the original sheet value is kept as cohort_name for display. This
// is only ever a *suggestion* now — the admin reviews/edits both the name
// and the code in the preview step before anything is imported.
export const normalizeCohortCode = (rawValue) => {
  const value = String(rawValue || "").trim();
  const match = value.match(/^(.*?)[\s-]+(\d{2,4})$/);

  if (match) {
    const [, namePart, yearPart] = match;
    const key = namePart.trim().toLowerCase();
    const abbreviation = DIVISION_ABBREVIATIONS[key] || abbreviateFallback(namePart);

    return `${abbreviation}-${yearPart}`;
  }

  // No "<name>-<year>" pattern found. A value that's already short and
  // has no spaces (e.g. "DHK-C3") is probably already a decent code — keep
  // it as-is. A long free-text value (e.g. a full institution name) gets
  // abbreviated instead of being suggested whole, which is what previously
  // produced participant codes like
  // "ANN-Mawlana Bhashani Science and Technology University-0127-...".
  if (value.length <= 15 && !/\s/.test(value)) return value;

  return abbreviateFallback(value);
};

// ---------------------------------------------------------------------------
// Grouping + identity extraction
// ---------------------------------------------------------------------------

export const groupRowsByCohortValue = (headers, rows) => {
  const cohortHeader = findHeader(headers, "cohort");
  const map = new Map();

  rows.forEach((row, rowIndex) => {
    const value = String((cohortHeader ? row[cohortHeader] : "") || "").trim();
    if (!value) return;

    if (!map.has(value)) map.set(value, []);
    map.get(value).push({ ...row, __rowIndex: rowIndex });
  });

  return map;
};

const buildAnswersLikeArray = (row, fieldDefs) =>
  fieldDefs.map((field) => ({
    field_label_en: field.label_en,
    field_label_bn: field.label_bn,
    field_type: field.field_type,
    value: String(row[field.header] ?? "").trim(),
  }));

export const extractIdentity = (answersLike) => {
  const name = getAnswerValueByKeywords(answersLike, ["name", "full name", "নাম"]);
  const email = getAnswerValueByKeywords(answersLike, ["email", "e-mail", "ইমেইল"]);
  const phone = getAnswerValueByKeywords(answersLike, [
    "phone",
    "mobile",
    "contact",
    "মোবাইল",
    "ফোন",
  ]);
  const gender = normalizeGender(
    getAnswerValueByKeywords(answersLike, ["gender", "sex", "লিঙ্গ"])
  );
  const institution = getAnswerValueByKeywords(answersLike, [
    "institution",
    "প্রতিষ্ঠান",
  ]);

  const dateOfBirthAnswer = answersLike.find((a) => a.field_type === "date");
  const dateOfBirth = dateOfBirthAnswer?.value || "";

  let age = "";

  if (dateOfBirth) {
    const computed = calculateAge(dateOfBirth);
    age = Number.isFinite(computed) && computed >= 0 && computed <= 100 ? computed : "";
  } else {
    const ageText = getAnswerValueByKeywords(answersLike, ["age", "বয়স"]).trim();
    if (/^\d{1,3}$/.test(ageText)) age = Number(ageText);
  }

  return { name, email, phone, gender, institution, dateOfBirth, age };
};

// ---------------------------------------------------------------------------
// Cohort / duplicate lookups (read-only — used by the preview phase)
// ---------------------------------------------------------------------------

export const findCohortByCode = async (code) => {
  const normalized = String(code || "").trim().toLowerCase();
  if (!normalized) return null;

  const snapshot = await getDocs(collection(db, COLLECTIONS.COHORTS));
  const match = snapshot.docs.find(
    (item) => String(item.data().cohort_code || "").trim().toLowerCase() === normalized
  );

  return match ? { id: match.id, ...match.data() } : null;
};

export const getExistingParticipantEmails = async (cohortId) => {
  if (!cohortId) return new Set();

  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.PARTICIPANTS), where("cohort_id", "==", cohortId))
  );

  return new Set(
    snapshot.docs
      .map((item) => String(item.data().email || "").trim().toLowerCase())
      .filter(Boolean)
  );
};

// ---------------------------------------------------------------------------
// Preview (read-only — no writes)
// ---------------------------------------------------------------------------

export const buildImportPreview = async ({ headers, rows }) => {
  const fieldDefs = analyzeColumns(headers, rows);
  const timestampHeader = findHeader(headers, "timestamp");
  const groupsByCohort = groupRowsByCohortValue(headers, rows);

  const groups = [];

  for (const [cohortValue, groupRows] of groupsByCohort.entries()) {
    const cohortCode = normalizeCohortCode(cohortValue);
    const existingCohort = await findCohortByCode(cohortCode);
    const existingEmails = existingCohort
      ? await getExistingParticipantEmails(existingCohort.id)
      : new Set();

    const previewRows = groupRows.map((row) => {
      const answersLike = buildAnswersLikeArray(row, fieldDefs);
      const identity = extractIdentity(answersLike);
      const normalizedEmail = String(identity.email || "").trim().toLowerCase();
      const isDuplicate = normalizedEmail ? existingEmails.has(normalizedEmail) : false;

      return {
        rowIndex: row.__rowIndex,
        ...identity,
        timestampValue: timestampHeader ? row[timestampHeader] : "",
        isDuplicate,
        decision: isDuplicate ? "skip" : "import",
        rawRow: row,
      };
    });

    groups.push({
      cohortValue, // raw sheet value — stable grouping key, not shown/edited directly
      cohortName: cohortValue, // editable, defaults to the raw value
      cohortCode, // editable, defaults to the auto-suggested code
      cohortExists: !!existingCohort,
      existingCohort,
      rows: previewRows,
    });
  }

  return { fieldDefs, groups };
};

// Re-runs the existing-cohort + duplicate-email lookup for one group after
// the admin edits its Cohort Code in the preview — keeps the "New/Existing
// cohort" badge and per-row duplicate flags accurate for whatever code
// they actually end up importing with, not just the auto-suggested one.
export const recheckCohortCode = async ({ cohortCode, rows }) => {
  const existingCohort = await findCohortByCode(cohortCode);
  const existingEmails = existingCohort
    ? await getExistingParticipantEmails(existingCohort.id)
    : new Set();

  const updatedRows = rows.map((row) => {
    const normalizedEmail = String(row.email || "").trim().toLowerCase();
    const isDuplicate = normalizedEmail ? existingEmails.has(normalizedEmail) : false;

    return { ...row, isDuplicate, decision: isDuplicate ? "skip" : "import" };
  });

  return { existingCohort, rows: updatedRows };
};

// ---------------------------------------------------------------------------
// Import (writes — confirm phase)
// ---------------------------------------------------------------------------

const ROWS_PER_BATCH = 200; // 2 doc writes per row = 400 ops, under Firestore's 500 cap

const parseTimestampValue = (value) => {
  if (!value) return serverTimestamp();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? serverTimestamp() : Timestamp.fromDate(parsed);
};

const createFormForCohort = async (cohort, fieldDefs) => {
  const baseSlug = normalizeSlug(`${cohort.cohort_code}-imported-registration`);
  let slug = baseSlug;
  let suffix = 2;

  while (!(await isSlugAvailable(slug))) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const formRef = doc(collection(db, COLLECTIONS.FORMS));
  const formData = createForm({
    id: formRef.id,
    form_title: `${cohort.cohort_name} — Imported Registrations`,
    cohort_id: cohort.id,
    cohort_name: cohort.cohort_name,
    cohort_code: cohort.cohort_code,
    status: "Closed",
    is_public: false,
    is_deleted: false,
    public_slug: slug,
    total_responses: 0,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  await setDoc(formRef, formData);

  const fieldRefs = fieldDefs.map((field) => ({
    field,
    ref: doc(collection(db, COLLECTIONS.FORM_FIELDS)),
  }));

  const fieldsBatch = writeBatch(db);

  fieldRefs.forEach(({ field, ref }) => {
    fieldsBatch.set(ref, {
      form_id: formRef.id,
      label: field.label,
      label_en: field.label_en,
      label_bn: field.label_bn,
      description_en: "",
      description_bn: "",
      field_type: field.field_type,
      placeholder: "",
      placeholder_en: "",
      placeholder_bn: "",
      required: true,
      validation: {
        min_age: "",
        max_age: "",
        min_value: "",
        max_value: "",
        min_length: "",
        max_length: "",
        pattern: "",
        error_message_en: "",
        error_message_bn: "",
      },
      options: field.options || [],
      order: field.order,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  });

  await fieldsBatch.commit();

  return { formRef, formData, fieldRefs };
};

const findOrCreateCohort = async (group) => {
  // Always re-checked fresh here rather than trusting the preview-time
  // `existingCohort` — the admin may have edited the Cohort Code since
  // then, and this is the value that actually ends up on every imported
  // participant record.
  const existingCohort = await findCohortByCode(group.cohortCode);

  if (existingCohort) {
    return { id: existingCohort.id, ...existingCohort, isNew: false };
  }

  const cohortRef = doc(collection(db, COLLECTIONS.COHORTS));
  const cohortData = createCohort({
    id: cohortRef.id,
    cohort_code: group.cohortCode,
    cohort_name: group.cohortName,
    status: "Active",
    total_registrations: 0,
    current_participant_sequence: 0,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  await setDoc(cohortRef, cohortData);

  return { id: cohortRef.id, ...cohortData, isNew: true };
};

export const runImport = async ({ fieldDefs, groups }) => {
  const summary = {
    cohortsCreated: [],
    cohortsReused: [],
    totalImported: 0,
    totalSkipped: 0,
  };

  for (const group of groups) {
    const rowsToImport = group.rows.filter((r) => r.decision === "import");
    summary.totalSkipped += group.rows.length - rowsToImport.length;

    if (rowsToImport.length === 0) continue;

    const cohort = await findOrCreateCohort(group);

    if (cohort.isNew) {
      summary.cohortsCreated.push(cohort.cohort_code);
    } else {
      summary.cohortsReused.push(cohort.cohort_code);
    }

    const cohortRef = doc(db, COLLECTIONS.COHORTS, cohort.id);
    const { formRef, formData, fieldRefs } = await createFormForCohort(cohort, fieldDefs);

    // Reserve a block of N sequence numbers in one transaction, instead of
    // one transaction per row — avoids collisions with concurrent live
    // registrations on the same cohort without serializing N round-trips.
    const startingSequence = await runTransaction(db, async (transaction) => {
      const cohortSnap = await transaction.get(cohortRef);
      const current = Number(cohortSnap.data()?.current_participant_sequence || 0);
      const next = current + rowsToImport.length;

      transaction.update(cohortRef, {
        current_participant_sequence: next,
        total_registrations: increment(rowsToImport.length),
        updated_at: serverTimestamp(),
      });

      return current;
    });

    for (let i = 0; i < rowsToImport.length; i += ROWS_PER_BATCH) {
      const chunk = rowsToImport.slice(i, i + ROWS_PER_BATCH);
      const batch = writeBatch(db);

      chunk.forEach((rowPreview, chunkIndex) => {
        const sequence = startingSequence + i + chunkIndex + 1;
        const unixTime = Math.floor(Date.now() / 1000);
        const participantCode = `ANN-${cohort.cohort_code}-${String(sequence).padStart(
          4,
          "0"
        )}-${unixTime}`;

        const answers = fieldRefs.map(({ field, ref }) => ({
          field_id: ref.id,
          field_label_en: field.label_en,
          field_label_bn: field.label_bn,
          field_type: field.field_type,
          value: String(rowPreview.rawRow[field.header] ?? "").trim(),
        }));

        const submittedAt = parseTimestampValue(rowPreview.timestampValue);

        const responseRef = doc(collection(db, COLLECTIONS.FORM_RESPONSES));
        const participantRef = doc(collection(db, COLLECTIONS.PARTICIPANTS));

        batch.set(responseRef, {
          form_id: formRef.id,
          form_title: formData.form_title,
          public_slug: formData.public_slug,

          cohort_id: cohort.id,
          cohort_name: cohort.cohort_name,
          cohort_code: cohort.cohort_code,

          participant_id: participantRef.id,
          participant_code: participantCode,

          search_name: (rowPreview.name || "").toLowerCase(),
          search_email: (rowPreview.email || "").toLowerCase(),
          search_phone: rowPreview.phone || "",

          name: rowPreview.name || "",
          email: rowPreview.email || "",
          phone: rowPreview.phone || "",
          gender: rowPreview.gender || "",
          date_of_birth: rowPreview.dateOfBirth || "",
          age: rowPreview.age || "",

          answers,

          submitted_at: submittedAt,
        });

        const participantData = createParticipant({
          id: participantRef.id,

          participant_code: participantCode,

          cohort_id: cohort.id,
          cohort_name: cohort.cohort_name,
          cohort_code: cohort.cohort_code,

          form_id: formRef.id,
          form_title: formData.form_title,
          response_id: responseRef.id,

          name: rowPreview.name || "",
          email: rowPreview.email || "",
          phone: rowPreview.phone || "",
          gender: rowPreview.gender || "",
          date_of_birth: rowPreview.dateOfBirth || "",
          age: rowPreview.age || "",
          institution: rowPreview.institution || "",

          search_name: (rowPreview.name || "").toLowerCase(),
          search_email: (rowPreview.email || "").toLowerCase(),
          search_phone: rowPreview.phone || "",

          registration_status: REGISTRATION_STATUS.REGISTERED,

          import_source: "Google Form Bulk Import",
          imported_at: serverTimestamp(),

          submitted_at: submittedAt,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });

        batch.set(participantRef, participantData);
      });

      await batch.commit();
    }

    await updateDoc(formRef, {
      total_responses: increment(rowsToImport.length),
      updated_at: serverTimestamp(),
    });

    summary.totalImported += rowsToImport.length;
  }

  return summary;
};
