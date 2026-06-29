export default function EmptyState({ message = "No data found." }) {
  return (
    <div className="p-6 text-center text-gray-500">
      {message}
    </div>
  );
}