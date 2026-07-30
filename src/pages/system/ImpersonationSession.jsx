import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  setPersistence,
  browserSessionPersistence,
  signInWithCustomToken,
} from "firebase/auth";
import { auth } from "../../firebase";
import { redeemImpersonation } from "../../services/impersonationService";
import { ROUTES } from "../../constants/routes";

export const IMPERSONATION_STORAGE_KEY = "ann_impersonation";

export default function ImpersonationSession() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const { customToken, targetType, targetName, adminName } =
          await redeemImpersonation(code);

        // Must happen before sign-in — switches this tab (and only this
        // tab, via the "impersonation"-named app in firebase.js) to
        // session-scoped persistence so it never touches the admin's own
        // signed-in state in other tabs.
        await setPersistence(auth, browserSessionPersistence);
        await signInWithCustomToken(auth, customToken);

        if (cancelled) return;

        sessionStorage.setItem(
          IMPERSONATION_STORAGE_KEY,
          JSON.stringify({ targetType, targetName, adminName })
        );

        const destination =
          targetType === "champion"
            ? ROUTES.championHome
            : targetType === "participant"
            ? ROUTES.participantHome
            : ROUTES.admin;

        navigate(destination, { replace: true });
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to start this session.");
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <div className="min-h-screen bg-[var(--ann-bg)] flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md text-center shadow-sm">
        {error ? (
          <>
            <h1 className="text-xl font-bold text-red-600">Couldn't start this session</h1>
            <p className="text-gray-600 mt-3">{error}</p>
            <p className="text-sm text-gray-400 mt-4">
              This link is single-use and expires 60 seconds after it's created.
              Go back to the admin tab and click "Login as" again.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-[var(--ann-purple)]">
              Starting session...
            </h1>
            <p className="text-gray-600 mt-3">Signing you in, one moment.</p>
          </>
        )}
      </div>
    </div>
  );
}
