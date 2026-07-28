import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { IMPERSONATION_STORAGE_KEY } from "../../pages/system/ImpersonationSession";

export default function ImpersonationBanner() {
  const [data] = useState(() => {
    try {
      const raw = sessionStorage.getItem(IMPERSONATION_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  if (!data) return null;

  const handleEndSession = async () => {
    await signOut(auth);
    sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY);
    // Works when this tab was opened via window.open (the "Login as" flow
    // always does this); falls through to a redirect otherwise.
    window.close();
    window.location.href = "/";
  };

  return (
    <div className="bg-amber-400 text-amber-950 px-4 py-2.5 text-sm font-semibold flex flex-wrap items-center justify-center gap-2 text-center">
      <span>
        Viewing as <strong>{data.targetName || "this account"}</strong>
        {data.adminName ? ` — impersonated by ${data.adminName}` : ""}
      </span>
      <button
        type="button"
        onClick={handleEndSession}
        className="underline hover:no-underline"
      >
        End Session
      </button>
    </div>
  );
}
