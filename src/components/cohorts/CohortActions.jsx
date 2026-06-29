export default function CohortActions({ cohort, onView, onEdit, onArchive }) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => onView(cohort)}
        className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] text-xs font-semibold"
      >
        View
      </button>

      <button
        type="button"
        onClick={() => onEdit(cohort)}
        className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)] text-xs font-semibold"
      >
        Edit
      </button>

      <button
        type="button"
        onClick={() => onArchive(cohort)}
        className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
      >
        Archive
      </button>
    </div>
  );
}