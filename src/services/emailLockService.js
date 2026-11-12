import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS } from "../constants/collections";

// "One email, one registration per cohort" is enforced with a small
// lock document per (cohort, email) in `registration_emails`, written in the
// same transaction as the registration itself (publicRegistrationService.js).
// A transaction is the only way to make the check race-safe — two people
// submitting the same email at the same moment can't both pass — and it
// avoids opening `participants` to anonymous reads, which a query-based
// "does this email exist?" check would need.
//
// The document ID is a SHA-256 hash of cohort + normalized email, so no
// plain email address is stored there; the document itself only records the
// cohort and when it was created.

const BATCH_SIZE = 450; // stay under Firestore's 500-operation batch cap

export class DuplicateEmailError extends Error {
  constructor(message = "This email address is already registered for this cohort.") {
    super(message);
    this.name = "DuplicateEmailError";
    this.code = "duplicate-email";
  }
}

export const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

// Returns null when there is nothing to lock (no email, or no cohort), or
// when the browser has no Web Crypto (only plain-http, non-localhost pages) —
// in which case registration simply proceeds without the uniqueness check
// rather than failing outright.
export const emailLockId = async (cohortId, email) => {
  const normalized = normalizeEmail(email);

  if (!cohortId || !normalized) return null;

  const subtle = globalThis.crypto?.subtle;

  if (!subtle) {
    console.warn("Web Crypto unavailable; skipping the unique-email check.");
    return null;
  }

  const bytes = new TextEncoder().encode(`${cohortId}:${normalized}`);
  const digest = await subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const emailLockRef = (lockId) =>
  doc(db, COLLECTIONS.REGISTRATION_EMAILS, lockId);

export const buildEmailLockData = (cohortId) => ({
  cohort_id: cohortId,
  created_at: serverTimestamp(),
});

// Fast "is this email already registered for this cohort?" lookup: one
// document read by ID (the hashed lock), not a query or collection scan, so
// it costs a single read however many registrations exist. Returns false
// when the check can't be made (no email, no Web Crypto, or a read error) —
// the registration transaction remains the real, race-safe guard.
export const isEmailRegistered = async (cohortId, email) => {
  try {
    const lockId = await emailLockId(cohortId, email);

    if (!lockId) return false;

    const snapshot = await getDoc(emailLockRef(lockId));

    return snapshot.exists();
  } catch (error) {
    console.warn("Email availability check failed:", error);
    return false;
  }
};

const commitInChunks = async (operations) => {
  for (let i = 0; i < operations.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    operations.slice(i, i + BATCH_SIZE).forEach((apply) => apply(batch));
    await batch.commit();
  }
};

const fetchCohortParticipants = async (cohortId) => {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.PARTICIPANTS), where("cohort_id", "==", cohortId))
  );

  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
};

// Registers every existing participant's email for a cohort. Needed once for
// registrations made before the check existed, and again after any bulk
// import (which writes participants directly instead of going through the
// public form). Safe to run repeatedly — it only writes lock documents.
// Reports emails that more than one participant already holds, since those
// are legacy duplicates the new check couldn't have prevented.
export const rebuildEmailLocksForCohort = async (cohortId) => {
  if (!cohortId) return { indexed: 0, duplicateEmails: 0, withoutEmail: 0 };

  const participants = await fetchCohortParticipants(cohortId);
  const counts = new Map();
  let withoutEmail = 0;

  participants.forEach((participant) => {
    const email = normalizeEmail(participant.email);

    if (!email) {
      withoutEmail += 1;
      return;
    }

    counts.set(email, (counts.get(email) || 0) + 1);
  });

  const operations = [];

  for (const email of counts.keys()) {
    const lockId = await emailLockId(cohortId, email);

    if (lockId) {
      operations.push((batch) =>
        batch.set(emailLockRef(lockId), buildEmailLockData(cohortId))
      );
    }
  }

  await commitInChunks(operations);

  return {
    indexed: operations.length,
    duplicateEmails: [...counts.values()].filter((count) => count > 1).length,
    withoutEmail,
  };
};

// Call after participants have been deleted. Frees an email for
// re-registration only when no participant left in that cohort still holds
// it (a duplicate removal keeps the original, so its email stays locked).
export const releaseEmailLocksForRemoved = async (cohortId, removedParticipants) => {
  if (!cohortId || !removedParticipants?.length) return 0;

  const remaining = await fetchCohortParticipants(cohortId);
  const stillUsed = new Set(remaining.map((p) => normalizeEmail(p.email)).filter(Boolean));

  const emailsToFree = new Set(
    removedParticipants
      .map((p) => normalizeEmail(p.email))
      .filter((email) => email && !stillUsed.has(email))
  );

  const operations = [];

  for (const email of emailsToFree) {
    const lockId = await emailLockId(cohortId, email);

    if (lockId) operations.push((batch) => batch.delete(emailLockRef(lockId)));
  }

  await commitInChunks(operations);

  return operations.length;
};

// For "wipe all cohort data": every lock for the cohort goes with it.
export const deleteAllEmailLocksForCohort = async (cohortId) => {
  if (!cohortId) return 0;

  const snapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.REGISTRATION_EMAILS),
      where("cohort_id", "==", cohortId)
    )
  );

  await commitInChunks(
    snapshot.docs.map((item) => (batch) => batch.delete(item.ref))
  );

  return snapshot.size;
};
