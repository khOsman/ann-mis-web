export const FGD_STATUS = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  COMPLETED: "Completed",
};

export const FGD_STATUS_OPTIONS = Object.values(FGD_STATUS);

export const FGD_ATTENDANCE_STATUS = {
  PENDING: "Pending",
  PRESENT: "Present",
  ABSENT: "Absent",
};

export const FGD_ATTENDANCE_OPTIONS = Object.values(
  FGD_ATTENDANCE_STATUS
);

// Matches the backend's FGD_ROSTER_CAP (services/fgdAssignment.js) — the
// max Selection Committee members one FGD can have.
export const FGD_ROSTER_CAP = 3;