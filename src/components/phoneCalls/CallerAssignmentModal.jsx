import { useMemo, useState } from "react";
import { useAlert } from "../../context/AlertContext";
import { useChampions, useUsers } from "../../hooks";
import {
  callersOf,
  eligibleChampionCallers,
  eligibleStaffCallers,
  setFgdCallers,
} from "../../services/phoneCallService";
import { CALLER_TYPE } from "../../constants/phoneCall";

const ROLE_LABEL = {
  super_admin: "Super Admin",
  admin: "Admin",
  youth_coordinator: "Youth Coordinator",
};

// Admin picks who phones the participants of one FGD: admin-side staff and
// Selection Committee members. Leaving it empty means any admin-side user can
// do the calls; naming callers restricts the call sheet to them (and admins).
export default function CallerAssignmentModal({ fgd, onClose }) {
  const { showAlert } = useAlert();
  const { data: users, loading: loadingUsers } = useUsers();
  const { data: champions, loading: loadingChampions } = useChampions();

  const [selected, setSelected] = useState(
    () => new Map(callersOf(fgd).map((caller) => [caller.id, caller]))
  );
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const options = useMemo(() => {
    const keyword = search.toLowerCase().trim();
    const all = [...eligibleStaffCallers(users), ...eligibleChampionCallers(champions)];

    // Someone already named but no longer eligible (deactivated) stays visible
    // so an admin can remove them.
    callersOf(fgd).forEach((caller) => {
      if (!all.some((option) => option.id === caller.id)) all.push({ ...caller, inactive: true });
    });

    return all
      .filter(
        (option) =>
          !keyword ||
          option.name.toLowerCase().includes(keyword) ||
          option.email.toLowerCase().includes(keyword)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, champions, search, fgd]);

  const toggle = (option) => {
    setSelected((prev) => {
      const next = new Map(prev);

      if (next.has(option.id)) next.delete(option.id);
      else {
        const { inactive, ...entry } = option; // eslint-disable-line no-unused-vars
        next.set(option.id, entry);
      }

      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const count = await setFgdCallers({ fgdId: fgd.id, callers: [...selected.values()] });

      showAlert(
        "success",
        count === 0
          ? "No callers named: any admin-side user can make the calls."
          : `${count} caller(s) assigned to ${fgd.fgd_code}.`
      );
      onClose();
    } catch (error) {
      console.error("Failed to assign callers:", error);
      showAlert("error", error.message || "Failed to assign callers.");
    } finally {
      setSaving(false);
    }
  };

  const loading = loadingUsers || loadingChampions;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
          Assign callers for {fgd.fgd_code}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          The people chosen here phone the participants of this FGD. Leave it
          empty to let any admin-side user make the calls. Admins can always
          see and use the sheet.
        </p>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="mt-4 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
        />

        {loading ? (
          <p className="text-sm text-gray-500 mt-4">Loading people...</p>
        ) : options.length === 0 ? (
          <p className="text-sm text-gray-500 mt-4">No matching people.</p>
        ) : (
          <div className="mt-4 max-h-72 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-100">
            {options.map((option) => (
              <label
                key={option.id}
                className="flex items-center gap-3 px-4 py-3 text-sm cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(option.id)}
                  onChange={() => toggle(option)}
                />
                <span className="flex-1">
                  <span className="font-semibold">{option.name}</span>
                  <span className="block text-xs text-gray-500">{option.email}</span>
                </span>
                <span className="text-xs text-gray-500">
                  {option.type === CALLER_TYPE.CHAMPION
                    ? "Selection Committee"
                    : ROLE_LABEL[option.role] || option.role}
                  {option.inactive ? " · no longer active" : ""}
                </span>
              </label>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:border-gray-400 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-[var(--ann-pink)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : `Save (${selected.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}
