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

  // Consecutive FGDs sharing the same date get one merged cell (a day can
  // hold several FGDs at different times, or just one) — matches the
  // reference roster sheet's layout instead of repeating the date per column.
  const dateGroups = useMemo(() => {
    const groups = [];

    sortedFgds.forEach((fgd) => {
      const last = groups[groups.length - 1];

      if (last && last.date === fgd.session_date) {
        last.fgds.push(fgd);
      } else {
        groups.push({ date: fgd.session_date, fgds: [fgd] });
      }
    });

    return groups;
  }, [sortedFgds]);

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
            <div className="bg-[var(--ann-purple)] text-center py-3 font-bold text-lg text-white">
              Amra Notun Network &quot;Changemakers&quot; Training
            </div>
            <div className="bg-[var(--ann-pink)] text-center py-2 font-semibold text-white">
              {cohort?.cohort_name} ({cohort?.cohort_code})
            </div>
            <div className="bg-white text-center py-2 font-semibold text-[var(--ann-text-dark)] border-b border-gray-300">
              FGD Roster Sheet
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr>
                    <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left sticky left-0 z-10">
                      Session
                    </th>
                    {sortedFgds.map((fgd) => (
                      <th
                        key={fgd.id}
                        className="border border-gray-300 bg-[var(--ann-pink)] text-white px-4 py-2 whitespace-nowrap"
                      >
                        {fgd.fgd_code}
                      </th>
                    ))}
                  </tr>

                  <tr>
                    <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left sticky left-0 z-10">
                      Date
                    </th>
                    {dateGroups.map((group) => (
                      <td
                        key={group.fgds[0].id}
                        colSpan={group.fgds.length}
                        className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap"
                      >
                        {group.date || "Not set"}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left sticky left-0 z-10">
                      Time
                    </th>
                    {sortedFgds.map((fgd) => (
                      <td
                        key={fgd.id}
                        className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap"
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
                          className="border border-gray-300 bg-gray-50 px-3 py-2 text-left align-top sticky left-0 z-10"
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
                            className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap"
                          >
                            {member ? (
                              <span className={isMe ? "font-bold text-[var(--ann-pink)]" : ""}>
                                {member.name}
                                {isMe && " (You)"}
                              </span>
                            ) : isNextOpenSlot && !alreadyBooked ? (
                              <button
                                type="button"
                                disabled={bookingFgdId === fgd.id}
                                onClick={() => handleBook(fgd.id)}
                                className="px-3 py-1.5 rounded-lg bg-[var(--ann-purple)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
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
