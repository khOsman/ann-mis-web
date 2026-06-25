import { useNavigate } from "react-router-dom";

export default function AccessStatus({
  title,
  message,
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--ann-bg)] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-200 p-8 text-center">
        <h1 className="text-2xl font-bold text-[var(--ann-purple)]">
          {title}
        </h1>

        <p className="text-gray-600 mt-4 leading-7">
          {message}
        </p>

        <button
          onClick={() => navigate("/")}
          className="mt-6 bg-[var(--ann-pink)] text-white px-5 py-3 rounded-xl font-semibold"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}