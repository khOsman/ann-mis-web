import { useMemo } from "react";

const CONFETTI_COLORS = [
  "#FF008C",
  "#2B2368",
  "#FFC83D",
  "#22C1A6",
  "#4F8CFF",
  "#FF6B6B",
  "#FFFFFF",
];

const PIECE_COUNT = 70;

// Deterministic pseudo-random in [0, 1), so the confetti layout is pure and
// stable across re-renders.
const seeded = (seed) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

// Full-screen "you're registered" celebration shown after a successful
// public registration: brand-colour gradient background, falling confetti,
// an animated check mark, and the participant's registration number. The
// motion is pure CSS (no animation library), and is switched off for
// visitors who have asked their device to reduce motion.
export default function RegistrationSuccess({
  language = "en",
  formTitle = "",
  cohortName = "",
  cohortCode = "",
  participantCode = "",
}) {
  const isBn = language === "bn";

  const pieces = useMemo(
    () =>
      Array.from({ length: PIECE_COUNT }, (_, index) => ({
        id: index,
        left: seeded(index + 1) * 100,
        size: 6 + seeded(index + 101) * 8,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        delay: seeded(index + 201) * 4,
        duration: 4 + seeded(index + 301) * 4,
        round: index % 3 === 0,
        drift: (seeded(index + 401) - 0.5) * 120,
      })),
    []
  );

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-10 bg-gradient-to-br from-[#2B2368] via-[#5B2A9C] to-[#FF008C]">
      <style>{`
        @keyframes reg-confetti-fall {
          0% { transform: translate3d(0, -12vh, 0) rotate(0deg); opacity: 0; }
          8% { opacity: 1; }
          100% { transform: translate3d(var(--drift), 112vh, 0) rotate(720deg); opacity: 0.9; }
        }
        @keyframes reg-pop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.18); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes reg-draw {
          from { stroke-dashoffset: 48; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes reg-rise {
          from { transform: translateY(18px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes reg-glow {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(1.15); opacity: 0.55; }
        }
        .reg-confetti { animation: reg-confetti-fall linear infinite; }
        .reg-pop { animation: reg-pop 0.7s cubic-bezier(0.2, 0.9, 0.3, 1.2) both; }
        .reg-check { stroke-dasharray: 48; stroke-dashoffset: 48; animation: reg-draw 0.6s ease-out 0.55s forwards; }
        .reg-rise { animation: reg-rise 0.7s ease-out both; }
        .reg-glow { animation: reg-glow 4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .reg-confetti, .reg-glow { animation: none; }
          .reg-confetti { display: none; }
          .reg-pop, .reg-rise { animation: none; }
          .reg-check { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>

      <div
        aria-hidden="true"
        className="reg-glow pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white blur-3xl"
      />
      <div
        aria-hidden="true"
        className="reg-glow pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-[#FFC83D] blur-3xl"
        style={{ animationDelay: "1.5s" }}
      />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {pieces.map((piece) => (
          <span
            key={piece.id}
            className="reg-confetti absolute top-0 block"
            style={{
              left: `${piece.left}%`,
              width: `${piece.size}px`,
              height: `${piece.round ? piece.size : piece.size * 1.6}px`,
              backgroundColor: piece.color,
              borderRadius: piece.round ? "9999px" : "2px",
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              "--drift": `${piece.drift}px`,
            }}
          />
        ))}
      </div>

      <div
        role="status"
        className="relative z-10 w-full max-w-md rounded-3xl bg-white/95 p-8 text-center shadow-2xl backdrop-blur"
      >
        <div className="reg-pop mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#22C1A6] to-[#13967F] shadow-lg">
          <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none">
            <path
              className="reg-check"
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="#fff"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1
          className="reg-rise mt-6 text-3xl font-extrabold text-[#2B2368]"
          style={{ animationDelay: "0.5s" }}
        >
          {isBn ? "অভিনন্দন! 🎉" : "Congratulations! 🎉"}
        </h1>

        <p
          className="reg-rise mt-3 text-lg font-semibold text-[#FF008C]"
          style={{ animationDelay: "0.65s" }}
        >
          {isBn
            ? "আপনার রেজিস্ট্রেশন সফলভাবে সম্পন্ন হয়েছে।"
            : "You have been registered successfully."}
        </p>

        {(formTitle || cohortName) && (
          <p
            className="reg-rise mt-3 text-sm text-gray-600"
            style={{ animationDelay: "0.8s" }}
          >
            {formTitle}
            {formTitle && cohortName ? " · " : ""}
            {cohortName}
            {cohortCode ? ` (${cohortCode})` : ""}
          </p>
        )}

        {participantCode && (
          <div
            className="reg-rise mt-6 rounded-2xl border-2 border-dashed border-[#FF008C]/40 bg-pink-50/70 p-4"
            style={{ animationDelay: "0.95s" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {isBn ? "আপনার রেজিস্ট্রেশন নম্বর" : "Your registration number"}
            </p>
            <p className="mt-1 break-all text-base sm:text-lg font-bold text-[#2B2368]">
              {participantCode}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {isBn
                ? "ভবিষ্যতে প্রয়োজনের জন্য নম্বরটি সংরক্ষণ করুন।"
                : "Please keep this number for future reference."}
            </p>
          </div>
        )}

        <p
          className="reg-rise mt-6 text-sm text-gray-500"
          style={{ animationDelay: "1.1s" }}
        >
          {isBn ? "ধন্যবাদ!" : "Thank you!"}
        </p>
      </div>
    </div>
  );
}
