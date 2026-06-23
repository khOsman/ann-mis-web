import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-[var(--ann-pink)] hover:opacity-90";

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-gray-100">
        <div className="flex items-start gap-4 p-6">
          <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="text-red-600" size={22} />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              {title}
            </h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              {message}
            </p>
          </div>

          <button onClick={onCancel} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-white text-sm font-semibold ${confirmClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}