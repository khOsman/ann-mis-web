import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ChampionLayout from "../../../layouts/ChampionLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useAlert } from "../../../context/AlertContext";
import { useAuth } from "../../../context/AuthContext";
import { useCohort, useFGDsByCohort } from "../../../hooks";
import { bookFGDSlot } from "../../../services/championPortalService";
import { formatTimeRangeBDT } from "../../../utils/time";

const ROSTER_CAP = 3;

export default function ChampionFGDRosterDetail() {
  const { cohortId } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { appUser } = useAuth();

  const { data: cohort, loading: loadingCohort } = useCohort(cohortId);
  const { data: fgds, loading: loadingFgds } = useFGDsByCohort(cohortId);

  const [bookingFgdId, setBookingFgdId] = useState(null);

  const sortedFgds = useMemo(
    () =>
      fgds
        .filter(
          (fgd) =>
            fgd.session_date && fgd.session_start_time && fgd.session_end_time
        )
        .sort((a, b) => (a.sequence_no || 0) - (b.sequence_no || 0)),
    [fgds]
  );

  const handleBook = async (fgdId) => {
    setBookingFgdId(fgdId);

    try {
      await bookFGDSlot({ fgdId });
      showAlert("success", "Slot booked. It now shows on your Assigned FGDs.");
      // No manual refetch needed — the live FGDs listener picks up the change.
    } catch (error) {
      showAlert("error", error.message || "Failed to book this slot.");
    } finally {
      setBookingFgdId(null);
    }
  };

  const loading = loadingCohort || loadingFgds;

  return (
    <ChampionLayout
      title="FGD Roster"
      subtitle={cohort ? `${cohort.cohort_name} (${cohort.cohort_code})` : "Loading..."}
    >
      <PageContainer className="py-6 lg:py-8 space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-semibold text-[var(--ann-pink)]"
        >
          ← Back to FGD Rosters
        </button>

        {loading ? (
          <p className="text-gray-500">Loading roster...</p>
        ) : sortedFgds.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500">
            No FGDs with a schedule set (date and time) yet.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                {cohort?.cohort_name} ({cohort?.cohort_code})
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                FGD Roster Sheet • {sortedFgds.length} FGD(s) with a schedule set
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr>
                    <th className="border border-gray-100 bg-gray-50 text-gray-500 px-3 py-3 text-left sticky left-0 z-10">
                      Session
                    </th>
                    {sortedFgds.map((fgd) => (
                      <th
                        key={fgd.id}
                        className="border border-gray-100 bg-[var(--ann-purple)] text-white px-4 py-3 whitespace-nowrap font-semibold"
                      >
                        {fgd.fgd_code}
                      </th>
                    ))}
                  </tr>

                  <tr>
                    <th className="border border-gray-100 bg-gray-50 text-gray-500 px-3 py-2 text-left sticky left-0 z-10">
                      Date
                    </th>
                    {sortedFgds.map((fgd) => (
                      <td
                        key={fgd.id}
                        className="border border-gray-100 px-4 py-2 text-center whitespace-nowrap text-gray-700"
                      >
                        {fgd.session_date || "Not set"}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <th className="border border-gray-100 bg-gray-50 text-gray-500 px-3 py-2 text-left sticky left-0 z-10">
                      Time
                    </th>
                    {sortedFgds.map((fgd) => (
                      <td
                        key={fgd.id}
                        className="border border-gray-100 px-4 py-2 text-center whitespace-nowrap text-gray-700"
                      >
                        {formatTimeRangeBDT(
                          fgd.session_start_time,
                          fgd.session_end_time
                        ) || "Not set"}
                      </td>
                    ))}
                  </tr>

                  {Array.from({ length: ROSTER_CAP }).map((_, slotIndex) => (
                    <tr key={slotIndex}>
                      {slotIndex === 0 && (
                        <th
                          rowSpan={ROSTER_CAP}
                          className="border border-gray-100 bg-gray-50 text-gray-500 px-3 py-2 text-left align-top sticky left-0 z-10"
                        >
                          Name
                        </th>
                      )}
                      {sortedFgds.map((fgd) => {
                        const members = fgd.committee_members || [];
                        const member = members[slotIndex];
                        const isMe = member?.champion_id === appUser?.id;
                        const alreadyBooked = members.some(
                          (m) => m.champion_id === appUser?.id
                        );
                        const isNextOpenSlot =
                          !member &&
                          slotIndex === members.length &&
                          members.length < ROSTER_CAP;

                        return (
                          <td
                            key={fgd.id}
                            className="border border-gray-100 px-4 py-2 text-center whitespace-nowrap"
                          >
                            {member ? (
                              <span
                                className={
                                  isMe
                                    ? "font-bold text-[var(--ann-pink)]"
                                    : "text-gray-700"
                                }
                              >
                                {member.name}
                                {isMe && " (You)"}
                              </span>
                            ) : isNextOpenSlot && !alreadyBooked ? (
                              <button
                                type="button"
                                disabled={bookingFgdId === fgd.id}
                                onClick={() => handleBook(fgd.id)}
                                className="px-3 py-1.5 rounded-lg bg-[var(--ann-pink)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                              >
                                {bookingFgdId === fgd.id ? "Booking..." : "Book This Slot"}
                              </button>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </PageContainer>
    </ChampionLayout>
  );
}
