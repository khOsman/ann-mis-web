import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForms, useFormFields, useFGDsByCohort, useParticipants } from "../../hooks";
import { ROUTES } from "../../constants/routes";
import { ENROLLMENT_STATUS, GRADUATION_STATUS } from "../../constants/status";
import { exportCSV, exportExcel, exportFormFieldsPDF } from "../../services/exportService";
import { formatBDPhone } from "../../utils/phone";

const PARTICIPANT_COLUMNS = [
  { key: "participant_code", label: "Participant Code" },
  { key: "name", label: "Name" },
  { key: "gender", label: "Gender" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "institution", label: "Institution" },
];

const ParticipantTable = ({ participants, loading, sourceLabel }) => {
  const displayParticipants = useMemo(
    () => participants.map((p) => ({ ...p, phone: formatBDPhone(p.phone) })),
    [participants]
  );

  return (
  <div>
    {loading ? (
      <p className="text-sm text-gray-500 py-4">Loading participants...</p>
    ) : displayParticipants.length === 0 ? (
      <p className="text-sm text-gray-500 py-4">No participants found.</p>
    ) : (
      <>
        <div className="flex justify-end gap-2 mb-3">
          <button
            type="button"
            onClick={() =>
              exportCSV({ rows: displayParticipants, columns: PARTICIPANT_COLUMNS, sourceLabel })
            }
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() =>
              exportExcel({ rows: displayParticipants, columns: PARTICIPANT_COLUMNS, sourceLabel })
            }
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
          >
            Export Excel
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                {PARTICIPANT_COLUMNS.map((col) => (
                  <th key={col.key} className="text-left p-3">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayParticipants.map((participant) => (
                <tr key={participant.id} className="border-t border-gray-100">
                  {PARTICIPANT_COLUMNS.map((col) => (
                    <td key={col.key} className="p-3 text-gray-700">
                      {participant[col.key] || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )}
  </div>
  );
};

const RegistrationFormSection = ({ cohort }) => {
  const { data: allForms, loading: loadingForms } = useForms();
  const cohortForms = useMemo(
    () => allForms.filter((form) => form.cohort_id === cohort.id),
    [allForms, cohort.id]
  );
  const [expandedFormId, setExpandedFormId] = useState(null);

  if (loadingForms) {
    return <p className="text-sm text-gray-500 py-4">Loading forms...</p>;
  }

  if (cohortForms.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4">
        No registration form has been created for this cohort yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {cohortForms.map((form) => (
        <FormRow
          key={form.id}
          form={form}
          cohort={cohort}
          expanded={expandedFormId === form.id}
          onToggle={() =>
            setExpandedFormId((prev) => (prev === form.id ? null : form.id))
          }
        />
      ))}
    </div>
  );
};

const FormRow = ({ form, cohort, expanded, onToggle }) => {
  const { data: fields, loading: loadingFields } = useFormFields(
    expanded ? form.id : null
  );

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="font-semibold text-[var(--ann-text-dark)]">
            {form.form_title || "Untitled Form"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {form.status || "-"} • {form.total_responses || 0} response(s)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loadingFields}
            onClick={() =>
              exportFormFieldsPDF({
                formTitle: form.form_title,
                cohortName: cohort.cohort_name,
                cohortCode: cohort.cohort_code,
                fields,
              })
            }
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export PDF
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="px-3 py-2 rounded-lg bg-[var(--ann-pink)] text-white text-xs font-semibold hover:opacity-90"
          >
            {expanded ? "Hide Questions" : "View Questions"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50/50">
          {loadingFields ? (
            <p className="text-sm text-gray-500">Loading questions...</p>
          ) : fields.length === 0 ? (
            <p className="text-sm text-gray-500">This form has no questions.</p>
          ) : (
            <ol className="space-y-3 list-decimal list-inside">
              {fields.map((field) => (
                <li key={field.id} className="text-sm">
                  <span className="font-semibold text-[var(--ann-text-dark)]">
                    {field.label_en || field.label}
                    {field.label_bn ? ` / ${field.label_bn}` : ""}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    ({field.field_type})
                  </span>
                  {field.options?.length > 0 && (
                    <ul className="list-disc list-inside text-xs text-gray-500 mt-1 ml-4">
                      {field.options.map((option) => (
                        <li key={option}>{option}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
};

const FGDsSection = ({ cohort }) => {
  const navigate = useNavigate();
  const { data: fgds, loading } = useFGDsByCohort(cohort.id);

  if (loading) {
    return <p className="text-sm text-gray-500 py-4">Loading FGDs...</p>;
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={() =>
            navigate(ROUTES.selectionCohortFGDs.replace(":cohortId", cohort.id))
          }
          className="px-4 py-2 rounded-lg bg-[var(--ann-pink)] text-white text-xs font-semibold hover:opacity-90"
        >
          Manage FGDs
        </button>
      </div>

      {fgds.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">
          No FGDs have been generated for this cohort yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left p-3">FGD Code</th>
                <th className="text-left p-3">Name</th>
                <th className="text-center p-3">Participants</th>
                <th className="text-center p-3">Status</th>
                <th className="text-center p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {fgds.map((fgd) => (
                <tr key={fgd.id} className="border-t border-gray-100">
                  <td className="p-3 font-semibold">{fgd.fgd_code}</td>
                  <td className="p-3">{fgd.fgd_name}</td>
                  <td className="p-3 text-center">{fgd.total_participants || 0}</td>
                  <td className="p-3 text-center">{fgd.status || "-"}</td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          ROUTES.selectionFGDDetails.replace(":fgdId", fgd.id)
                        )
                      }
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const JOURNEY_ITEMS = [
  { key: "registration_form", label: "Registration Form" },
  { key: "registered", label: "Registered Participants" },
  { key: "fgds", label: "FGDs" },
  { key: "enrolled", label: "Enrolled" },
  { key: "graduate", label: "Graduate" },
  { key: "project", label: "Projects", comingSoon: true },
];

export default function CohortJourney({ cohort }) {
  const [activeSection, setActiveSection] = useState(null);

  const { data: allParticipants, loading: loadingParticipants } = useParticipants();
  const cohortParticipants = useMemo(
    () => allParticipants.filter((p) => p.cohort_id === cohort.id),
    [allParticipants, cohort.id]
  );
  const enrolledParticipants = useMemo(
    () =>
      cohortParticipants.filter(
        (p) => p.enrollment_status === ENROLLMENT_STATUS.ENROLLED
      ),
    [cohortParticipants]
  );
  const graduatedParticipants = useMemo(
    () =>
      cohortParticipants.filter(
        (p) => p.graduation_status === GRADUATION_STATUS.GRADUATED
      ),
    [cohortParticipants]
  );

  const toggleSection = (key) => {
    setActiveSection((prev) => (prev === key ? null : key));
  };

  return (
    <div className="bg-white rounded-2xl border p-6">
      <h3 className="text-lg font-bold mb-5">Cohort Journey</h3>

      <div className="grid md:grid-cols-3 xl:grid-cols-6 gap-4">
        {JOURNEY_ITEMS.map((item) =>
          item.comingSoon ? (
            <div
              key={item.key}
              title="Coming soon"
              className="border rounded-xl p-4 text-left text-gray-400 bg-gray-50 cursor-not-allowed"
            >
              {item.label}
              <span className="block text-xs mt-1">Coming soon</span>
            </div>
          ) : (
            <button
              key={item.key}
              onClick={() => toggleSection(item.key)}
              className={`border rounded-xl p-4 text-left hover:border-[var(--ann-pink)] ${
                activeSection === item.key
                  ? "border-[var(--ann-pink)] bg-pink-50/50"
                  : ""
              }`}
            >
              {item.label}
            </button>
          )
        )}
      </div>

      {activeSection && (
        <div className="mt-5 border-t border-gray-100 pt-5">
          {activeSection === "registration_form" && (
            <RegistrationFormSection cohort={cohort} />
          )}

          {activeSection === "registered" && (
            <ParticipantTable
              participants={cohortParticipants}
              loading={loadingParticipants}
              sourceLabel={`${cohort.cohort_code}_Registered_Participants`}
            />
          )}

          {activeSection === "fgds" && <FGDsSection cohort={cohort} />}

          {activeSection === "enrolled" && (
            <ParticipantTable
              participants={enrolledParticipants}
              loading={loadingParticipants}
              sourceLabel={`${cohort.cohort_code}_Enrolled_Participants`}
            />
          )}

          {activeSection === "graduate" && (
            <ParticipantTable
              participants={graduatedParticipants}
              loading={loadingParticipants}
              sourceLabel={`${cohort.cohort_code}_Graduated_Participants`}
            />
          )}
        </div>
      )}
    </div>
  );
}
