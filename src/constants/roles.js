export const USER_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  VIEWER: "viewer",
  YOUTH_COORDINATOR: "youth_coordinator",
  PROGRAMME_HEAD: "programme_head",
  PENDING: "pending",
};

export const USER_STATUSES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
};

export const DEFAULT_PERMISSIONS = {
  dashboard: false,
  cohorts: false,
  forms: false,
  participants: false,
  selection: false,
  champions: false,
  enrollment: false,
  graduation: false,
  projects: false,
  reports: false,
  users: false,
  database: false,
  manualEntry: false,
  cohortRequest: false,
  cohortApproval: false,
};

export const ROLE_PERMISSIONS = {
  super_admin: {
    dashboard: true,
    cohorts: true,
    forms: true,
    participants: true,
    selection: true,
    champions: true,
    enrollment: true,
    graduation: true,
    projects: true,
    reports: true,
    users: true,
    database: true,
    manualEntry: true,
    cohortRequest: true,
    cohortApproval: true,
  },

  admin: {
    dashboard: true,
    cohorts: true,
    forms: true,
    participants: true,
    selection: true,
    champions: true,
    enrollment: true,
    graduation: true,
    projects: true,
    reports: true,
    users: false,
    database: true,
    manualEntry: true,
    cohortRequest: true,
    cohortApproval: false,
  },

  viewer: {
    dashboard: true,
    cohorts: true,
    forms: true,
    participants: true,
    selection: true,
    champions: true,
    enrollment: true,
    graduation: true,
    projects: true,
    reports: true,
    users: false,
    database: false,
    manualEntry: false,
    cohortRequest: false,
    cohortApproval: false,
  },

  // Same read-only footprint as viewer, plus the ability to manually key in
  // a participant's registration data on an active cohort (e.g. someone
  // registered on paper) — see AddParticipant.jsx / manualEntry permission.
  youth_coordinator: {
    dashboard: true,
    cohorts: true,
    forms: true,
    participants: true,
    selection: true,
    champions: true,
    enrollment: true,
    graduation: true,
    projects: true,
    reports: true,
    users: false,
    database: false,
    manualEntry: true,
    cohortRequest: true,
    cohortApproval: false,
  },

  // Same read-only footprint as viewer, plus the authority to decide cohort
  // approval requests (approve, request changes, reject) — see
  // CohortApprovals.jsx / cohortApproval permission.
  programme_head: {
    dashboard: true,
    cohorts: true,
    forms: true,
    participants: true,
    selection: true,
    champions: true,
    enrollment: true,
    graduation: true,
    projects: true,
    reports: true,
    users: false,
    database: false,
    manualEntry: false,
    cohortRequest: false,
    cohortApproval: true,
  },

  pending: {
    ...DEFAULT_PERMISSIONS,
  },
};

export const getPermissionsByRole = (role) => {
  return ROLE_PERMISSIONS[role] || DEFAULT_PERMISSIONS;
};