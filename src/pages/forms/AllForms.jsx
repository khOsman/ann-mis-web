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
import { ROUTES } from "../../constants/routes";
import { useAlert } from "../../context/AlertContext";

export default function AllForms() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchForms = async () => {
    setLoading(true);

    try {
      const q = query(collection(db, "forms"), orderBy("created_at", "desc"));
      const snapshot = await getDocs(q);

      const data = snapshot.docs
        .map((item) => ({
          id: item.id,
          ...item.data(),
        }))
        .filter((item) => item.is_deleted !== true);

      setForms(data);
    } catch (error) {
      console.error("Failed to fetch forms:", error);
      showAlert("error", error.message || "Failed to load forms.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const filteredForms = useMemo(() => {
    return forms.filter((form) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        form.form_title?.toLowerCase().includes(keyword) ||
        form.cohort_name?.toLowerCase().includes(keyword) ||
        form.cohort_code?.toLowerCase().includes(keyword) ||
        form.public_slug?.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "All" || form.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [forms, search, statusFilter]);

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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Published":
        return "bg-green-50 text-green-700 border-green-200";
      case "Closed":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "Draft":
      default:
        return "bg-pink-50 text-[var(--ann-pink)] border-pink-100";
    }
  };

  return (
    <AdminLayout title="All Forms" subtitle="View and manage registration forms">
      <PageContainer className="py-6 lg:py-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
                Form List
              </h3>
              <p className="text-sm text-gray-500">
                Manage registration forms, public links, and responses.
              </p>
            </div>

            <button
              onClick={() => navigate(ROUTES.createForm)}
              className="bg-[var(--ann-pink)] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
            >
              + Create Form
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search form, cohort, slug..."
              className="md:col-span-2 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
            >
              <option>All</option>
              <option>Draft</option>
              <option>Published</option>
              <option>Closed</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-[#F9FAFB] text-gray-500">
                <tr>
                  <th className="text-left p-4">Form</th>
                  <th className="text-left p-4">Cohort</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Slug</th>
                  <th className="text-left p-4">Responses</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Created By</th>
                  <th className="text-left p-4">Updated</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="p-6 text-center text-gray-500">
                      Loading forms...
                    </td>
                  </tr>
                ) : filteredForms.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-6 text-center text-gray-500">
                      No form found.
                    </td>
                  </tr>
                ) : (
                  filteredForms.map((form) => (
                    <tr key={form.id} className="border-t border-gray-100">
                      <td className="p-4 font-semibold text-[var(--ann-text-dark)]">
                        <div>{form.form_title || "-"}</div>
                        <div className="text-xs text-gray-400">
                          Banner: {form.banner_type || "default"}
                        </div>
                      </td>

                      <td className="p-4 text-gray-600">
                        <div>{form.cohort_name || "-"}</div>
                        <div className="text-xs text-gray-400">
                          {form.cohort_code || "-"}
                        </div>
                      </td>

                      <td className="p-4 text-gray-600">
                        {form.form_type || "-"}
                      </td>

                      <td className="p-4 text-gray-600">
                        <code className="bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg text-xs">
                          /form/{form.public_slug || "-"}
                        </code>
                      </td>

                      <td className="p-4 text-gray-600">
                        {form.total_responses || 0}
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full border text-xs font-semibold ${getStatusBadgeClass(
                            form.status
                          )}`}
                        >
                          {form.status || "Draft"}
                        </span>
                      </td>

                      <td className="p-4 text-gray-600">
                        <div>
                          {form.created_by_name ||
                            form.created_by_email ||
                            "-"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDate(form.created_at)}
                        </div>
                      </td>

                      <td className="p-4 text-gray-600">
                        <div>
                          {form.updated_by_name ||
                            form.updated_by_email ||
                            "-"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDate(form.updated_at)}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              navigate(`/admin/forms/${form.id}/builder`)
                            }
                            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] text-xs font-semibold"
                          >
                            Builder
                          </button>

                          <button
                            onClick={() =>
                              navigate(`/form/${form.public_slug}`)
                            }
                            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] text-xs font-semibold"
                          >
                            Preview
                          </button>
                        </div>
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