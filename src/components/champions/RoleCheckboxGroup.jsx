import { CHAMPION_ROLE_LABELS, CHAMPION_ROLE_OPTIONS } from "../../constants/champions";

// A champion can hold more than one role at once, so every role picker in
// the app (Approve, Manage Roles, the full Edit form) uses this instead of
// a single-select dropdown.
export default function RoleCheckboxGroup({ value, onChange, className = "" }) {
  const toggle = (role) => {
    if (value.includes(role)) {
      onChange(value.filter((r) => r !== role));
    } else {
      onChange([...value, role]);
    }
  };

  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-2 ${className}`}>
      {CHAMPION_ROLE_OPTIONS.map((role) => (
        <label
          key={role}
          className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={value.includes(role)}
            onChange={() => toggle(role)}
            className="rounded border-gray-300 text-[var(--ann-pink)] focus:ring-[var(--ann-pink)]"
          />
          {CHAMPION_ROLE_LABELS[role]}
        </label>
      ))}
    </div>
  );
}
