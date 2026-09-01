import { apiClient } from "./apiClient";

// Called from the admin's own authenticated tab — returns a short-lived
// one-time code, not the actual sign-in token.
export const startImpersonation = async ({ targetType, targetId }) => {
  return apiClient.post(
    "/api/impersonation/start",
    { targetType, targetId },
    { authenticated: true }
  );
};

// Called from the freshly opened /session tab, which isn't signed in yet —
// no auth header.
export const redeemImpersonation = async (code) => {
  return apiClient.post("/api/impersonation/redeem", { code });
};

const READY_TIMEOUT_MS = 8000;

// Starts the session and opens it in a new tab, handing the one-time code
// over via postMessage instead of the URL — a code that never appears in
// the address bar can't be read from browser history, a URL-scanning proxy,
// or a shoulder-surf, closing the observation window the old
// /session/:code link left open. The new tab pings this tab once its
// message listener is registered (it has no code yet at that point, so it
// can't ask for one any other way); this tab replies with the code only
// after hearing that ping — the standard postMessage handshake for exactly
// this "who's listening yet" race.
export const openImpersonationTab = async ({ targetType, targetId }) => {
  const { code } = await startImpersonation({ targetType, targetId });
  const target = window.location.origin;
  const win = window.open(`${target}/session`, "_blank");

  if (!win) {
    throw new Error("Your browser blocked the new tab. Allow pop-ups for this site and try again.");
  }

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      window.removeEventListener("message", onMessage);
      reject(new Error("The new tab didn't respond in time. Try again."));
    }, READY_TIMEOUT_MS);

    function onMessage(event) {
      if (event.source !== win || event.origin !== target) return;
      if (event.data?.type !== "impersonation-session-ready") return;

      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      win.postMessage({ type: "impersonation-code", code }, target);
      resolve();
    }

    window.addEventListener("message", onMessage);
  });
};
