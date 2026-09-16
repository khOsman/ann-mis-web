export const USER_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  VIEWER: "viewer",
  YOUTH_COORDINATOR: "youth_coordinator",
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
  },

  pending: {
    ...DEFAULT_PERMISSIONS,
  },
};

export const getPermissionsByRole = (role) => {
  return ROLE_PERMISSIONS[role] || DEFAULT_PERMISSIONS;
};