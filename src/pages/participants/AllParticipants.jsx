import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import AdminLayout from "../../layouts/AdminLayout";
import PageContainer from "../../layouts/PageContainer";
import { useAlert } from "../../context/AlertContext";

export default function AllParticipants() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchParticipants = async () => {
    setLoading(true);

    try {
      const q = query(
        collection(db, "participants"),
        orderBy("submitted_at", "desc")
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      setParticipants(data);
    } catch (error) {
      console.error("Failed to fetch participants:", error);
      showAlert("error", error.message || "Failed to load participants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  const filteredParticipants = useMemo(() => {
    const keyword = search.toLowerCase();

    return participants.filter((participant) => {
      return (
        participant.participant_code?.toLowerCase().includes(keyword) ||
        participant.name?.toLowerCase().includes(keyword) ||
        participant.email?.toLowerCase().includes(keyword) ||
        participant.phone?.toLowerCase().includes(keyword) ||
        participant.cohort_name?.toLowerCase().includes(keyword) ||
        participant.cohort_code?.toLowerCase().includes(keyword)
      );
    });
  }, [participants, search]);

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "-";

    return timestamp.toDate().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <AdminLayout
      title="Participants"
      subtitle="View and manage ANN participants"
    >
      <PageContainer className="py-6 lg:py-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                Participant List
              </h3>
              <p className="text-sm text-gray-500">
                Registered participants from public registration forms.
              </p>
            </div>
          </div>

          <div className="mb-5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search participant code, name, email, phone, cohort..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-[#F9FAFB] text-gray-500">
                <tr>
                  <th className="text-left p-4">Participant Code</th>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Phone</th>
                  <th className="text-left p-4">Cohort</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Submitted At</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-gray-500">
                      Loading participants...
                    </td>
                  </tr>
                ) : filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-gray-500">
                      No participant found.
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((participant) => (
                    <tr
                      key={participant.id}
                      className="border-t border-gray-100"
                    >

                      <td className="p-4">
                        <span className="font-mono text-xs font-bold text-[var(--ann-purple)]">
                          {participant.participant_code || "-"}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-[var(--ann-text-dark)]">
                        {participant.name || "-"}
                      </td>

                      <td className="p-4 text-gray-600">
                        {participant.email || "-"}
                      </td>

                      <td className="p-4 text-gray-600">
                        {participant.phone || "-"}
                      </td>

                      <td className="p-4 text-gray-600">
                        <div>{participant.cohort_name || "-"}</div>
                        <div className="text-xs text-gray-400">
                          {participant.cohort_code || "-"}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full bg-pink-50 text-[var(--ann-pink)] text-xs font-semibold">
                          {participant.registration_status || "Registered"}
                        </span>
                      </td>

                      <td className="p-4 text-gray-600">
                        {formatDate(participant.submitted_at)}
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() =>
                            navigate(`/admin/participants/${participant.id}`)
                          }
                          className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] text-xs font-semibold"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageContainer>
    </AdminLayout>
  );
}