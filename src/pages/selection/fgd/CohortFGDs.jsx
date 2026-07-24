import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from "../../../firebase";
import AdminLayout from "../../../layouts/AdminLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useAlert } from "../../../context/AlertContext";
import { ROUTES } from "../../../constants/routes";
import { useCohort } from "../../../hooks";
import {
  generateFGDsForCohort,
  getFGDsByCohort,
  regenerateFGDsForCohort,
} from "../../../services/fgdService";

export default function CohortFGDs() {
  const { cohortId } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const { data: cohort, loading: cohortLoading } = useCohort(cohortId);

  const [fgds, setFgds] = useState([]);
  const [loadingFgds, setLoadingFgds] = useState(true);
  const [participantLimit, setParticipantLimit] = useState(25);
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegeneratePanel, setShowRegeneratePanel] = useState(false);
  const [regenerateLimit, setRegenerateLimit] = useState(25);

  const fetchFGDs = async () => {
    if (!cohortId) return;

    setLoadingFgds(true);

    try {
      const data = await getFGDsByCohort(cohortId);
      setFgds(data);
    } catch (error) {
      console.error("Failed to load FGDs:", error);
      showAlert("error", error.message || "Failed to load FGDs.");
    } finally {
      setLoadingFgds(false);
    }
  };

  useEffect(() => {
    fetchFGDs();
  }, [cohortId]);

  const handleGenerateFGDs = async () => {
    if (!cohort) return;

    setGenerating(true);

    try {
      const user = auth.currentUser;

      const result = await generateFGDsForCohort({
        cohort,
        participantLimit,
        createdByEmail: user?.email || "",
        createdByName: user?.displayName || "",
      });

      showAlert(
        "success",
        `${result.totalFGDs} FGDs generated for ${result.totalParticipants} participants.`
      );

      await fetchFGDs();
    } catch (error) {
      console.error("FGD generation failed:", error);
      showAlert("error", error.message || "Failed to generate FGDs.");
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateFGDs = async () => {
    if (!cohort) return;

    const confirmed = window.confirm(
      "Regenerating will permanently delete all existing FGD groups for this cohort, including any attendance, scores, and feedback already entered by the selection committee. This cannot be undone. Continue?"
    );

    if (!confirmed) return;

    setRegenerating(true);

    try {
      const user = auth.currentUser;

      const result = await regenerateFGDsForCohort({
        cohort,
        participantLimit: regenerateLimit,
        updatedByEmail: user?.email || "",
        updatedByName: user?.displayName || "",
      });

      showAlert(
        "success",
        `FGDs regenerated: ${result.totalFGDs} groups for ${result.totalParticipants} participants.`
      );

      setShowRegeneratePanel(false);
      await fetchFGDs();
    } catch (error) {
      console.error("FGD regeneration failed:", error);
      showAlert("error", error.message || "Failed to regenerate FGDs.");
    } finally {
      setRegenerating(false);
    }
  };

  const loading = cohortLoading || loadingFgds;

  return (
    <AdminLayout
      title="FGD Groups"
      subtitle="Manage FGDs for this cohort"
    >
      <PageContainer className="py-6 lg:py-8 space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
            {cohort?.cohort_name || "Cohort FGDs"}
          </h3>

          <p className="text-sm text-gray-500 mt-2">
            {cohort?.cohort_code || "-"} • Total Registered:{" "}
            {cohort?.total_registrations || 0}
          </p>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-gray-500">
            Loading FGDs...
          </div>
        ) : fgds.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Generate FGDs
            </h3>

            <p className="text-sm text-gray-500 mt-2">
              No FGDs have been generated for this cohort yet.
            </p>

            <div className="mt-5 max-w-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Participants per FGD
              </label>

              <input
                type="number"
                min="1"
                value={participantLimit}
                onChange={(e) => setParticipantLimit(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
              />
            </div>

            <button
              type="button"
              disabled={generating}
              onClick={handleGenerateFGDs}
              className="mt-5 bg-[var(--ann-pink)] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate FGDs"}
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                  Generated FGDs
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  {fgds.length} FGD group(s) generated.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowRegeneratePanel((prev) => !prev)}
                className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold"
              >
                {showRegeneratePanel ? "Cancel" : "Regenerate FGDs"}
              </button>
            </div>

            {showRegeneratePanel && (
              <div className="px-6 py-5 border-b border-gray-200 bg-red-50/50">
                <p className="text-sm text-red-700 font-semibold">
                  Warning: regenerating permanently deletes all {fgds.length} existing
                  FGD group(s), including any attendance, scores, and feedback already
                  entered. This cannot be undone.
                </p>

                <div className="mt-4 max-w-sm">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Participants per FGD
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={regenerateLimit}
                    onChange={(e) => setRegenerateLimit(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--ann-pink)]"
                  />
                </div>

                <button
                  type="button"
                  disabled={regenerating}
                  onClick={handleRegenerateFGDs}
                  className="mt-4 bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {regenerating ? "Regenerating..." : "Confirm Regenerate"}
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-6 py-4">FGD Code</th>
                    <th className="text-left px-6 py-4">Name</th>
                    <th className="text-center px-6 py-4">Participants</th>
                    <th className="text-center px-6 py-4">Present</th>
                    <th className="text-center px-6 py-4">Absent</th>
                    <th className="text-center px-6 py-4">Status</th>
                    <th className="text-center px-6 py-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {fgds.map((fgd) => (
                    <tr
                      key={fgd.id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-6 py-5 font-semibold">
                        {fgd.fgd_code}
                      </td>

                      <td className="px-6 py-5">{fgd.fgd_name}</td>

                      <td className="px-6 py-5 text-center">
                        {fgd.total_participants || 0}
                      </td>

                      <td className="px-6 py-5 text-center">
                        {fgd.total_present || 0}
                      </td>

                      <td className="px-6 py-5 text-center">
                        {fgd.total_absent || 0}
                      </td>

                      <td className="px-6 py-5 text-center">
                        {fgd.status || "-"}
                      </td>

                      <td className="px-6 py-5 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              ROUTES.selectionFGDDetails.replace(
                                ":fgdId",
                                fgd.id
                              )
                            )
                          }
                          className="px-4 py-2 rounded-xl bg-[var(--ann-pink)] text-white text-sm font-semibold hover:opacity-90"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </PageContainer>
    </AdminLayout>
  );
}