// Stored as plain "HH:mm" (24-hour) from <input type="time">. Display-only
// conversion to 12-hour BDT — the stored value and the edit form are
// untouched.
export function formatTime12h(time24) {
  if (!time24) return "";

  const [hourStr, minuteStr] = String(time24).split(":");
  const hour24 = parseInt(hourStr, 10);

  if (Number.isNaN(hour24)) return time24;

  const minute = (minuteStr || "00").padStart(2, "0");
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return `${hour12}:${minute} ${period}`;
}

export function formatTimeRangeBDT(startTime24, endTime24) {
  const start = formatTime12h(startTime24);
  const end = formatTime12h(endTime24);

  if (!start && !end) return "";

  const range = start && end ? `${start} - ${end}` : start || end;

  return `${range} BDT`;
}
