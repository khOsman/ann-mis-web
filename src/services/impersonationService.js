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

// Called from the freshly opened /session/:code tab, which isn't signed in
// yet — no auth header.
export const redeemImpersonation = async (code) => {
  return apiClient.post("/api/impersonation/redeem", { code });
};

// Starts the session and opens it in a new tab in one step, for the "Login
// as" buttons on the Users/Champions lists.
export const openImpersonationTab = async ({ targetType, targetId }) => {
  const { code } = await startImpersonation({ targetType, targetId });
  window.open(`${window.location.origin}/session/${code}`, "_blank", "noopener");
};
