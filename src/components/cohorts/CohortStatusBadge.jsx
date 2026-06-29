import { COHORT_STATUS } from "../../constants/status";

export default function CohortStatusBadge({ status }) {
  const currentStatus = status || COHORT_STATUS.DRAFT;

  const getStatusBadgeClass = () => {
    switch (currentStatus) {
      case COHORT_STATUS.ACTIVE:
        return "bg-green-50 text-green-700 border-green-200";

      case COHORT_STATUS.CLOSED:
        return "bg-gray-100 text-gray-700 border-gray-200";

      case COHORT_STATUS.ARCHIVED:
        return "bg-red-50 text-red-700 border-red-200";

      case COHORT_STATUS.DRAFT:
      default:
        return "bg-pink-50 text-[var(--ann-pink)] border-pink-100";
    }
  };

  return (
    <span
      className={`px-3 py-1 rounded-full border text-xs font-semibold ${getStatusBadgeClass()}`}
    >
      {currentStatus}
    </span>
  );
}