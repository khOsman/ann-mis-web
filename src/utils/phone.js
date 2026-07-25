// Bangladesh phone numbers show up in the MIS in a few raw shapes depending
// on where they were entered (public registration, Google Form import,
// champion registration): "+8801XXXXXXXXX", "8801XXXXXXXXX", "01XXXXXXXXX",
// or occasionally missing the leading 0 entirely. Display everywhere as the
// "+880" form without mutating what's actually stored.
export const formatBDPhone = (rawPhone) => {
  const raw = String(rawPhone || "").trim();
  if (!raw) return "";

  const cleaned = raw.replace(/[\s-]/g, "");

  if (cleaned.startsWith("+880")) return cleaned;
  if (cleaned.startsWith("880")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+880${cleaned.slice(1)}`;

  // A bare 10-digit local number (no leading 0, no country code) is missing
  // just the leading 0 — seen in a few older FGD-denormalized records.
  if (/^\d{10}$/.test(cleaned)) return `+880${cleaned}`;

  return raw;
};
