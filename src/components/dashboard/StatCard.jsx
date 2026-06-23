export default function StatCard({ title, value, subtitle }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="text-3xl font-extrabold text-[var(--ann-purple)] mt-2">
        {value}
      </h3>
      <p className="text-xs text-gray-400 mt-2">{subtitle}</p>
    </div>
  );
}