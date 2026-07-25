// Admins sometimes paste links without a scheme (e.g. "meet.google.com/xxx").
// Used as-is in an <a href>, that's a relative path — the browser resolves it
// against our own origin instead of opening the external site.
export function ensureHttpUrl(url) {
  if (!url) return url;

  const trimmed = String(url).trim();

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
