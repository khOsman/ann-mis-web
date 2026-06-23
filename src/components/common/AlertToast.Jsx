import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

export default function AlertToast({ type = "info", title, message, onClose }) {
  const styles = {
    success: {
      icon: CheckCircle,
      title: title || "Success",
      border: "border-green-200",
      bg: "bg-green-50",
      text: "text-green-700",
      iconColor: "text-green-600",
    },
    error: {
      icon: XCircle,
      title: title || "Error",
      border: "border-red-200",
      bg: "bg-red-50",
      text: "text-red-700",
      iconColor: "text-red-600",
    },
    warning: {
      icon: AlertTriangle,
      title: title || "Warning",
      border: "border-yellow-200",
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      iconColor: "text-yellow-600",
    },
    info: {
      icon: Info,
      title: title || "Information",
      border: "border-purple-200",
      bg: "bg-purple-50",
      text: "text-[var(--ann-purple)]",
      iconColor: "text-[var(--ann-pink)]",
    },
  };

  const current = styles[type] || styles.info;
  const Icon = current.icon;

  return (
    <div className="fixed top-5 right-5 z-[9999] w-[360px] max-w-[calc(100vw-32px)]">
      <div
        className={`${current.bg} ${current.border} border rounded-2xl shadow-lg p-4 flex gap-3`}
      >
        <Icon className={`${current.iconColor} mt-0.5`} size={22} />

        <div className="flex-1">
          <p className={`font-bold ${current.text}`}>{current.title}</p>
          <p className="text-sm text-gray-700 mt-1">{message}</p>
        </div>

        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}