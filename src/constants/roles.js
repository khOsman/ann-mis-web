export const USER_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  VIEWER: "viewer",
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
  enrollment: false,
  graduation: false,
  projects: false,
  reports: false,
  users: false,
};

export const ROLE_PERMISSIONS = {
  super_admin: {
    dashboard: true,
    cohorts: true,
    forms: true,
    participants: true,
    selection: true,
    enrollment: true,
    graduation: true,
    projects: true,
    reports: true,
    users: true,
  },

  admin: {
    dashboard: true,
    cohorts: true,
    forms: true,
    participants: true,
    selection: true,
    enrollment: true,
    graduation: true,
    projects: true,
    reports: true,
    users: false,
  },

  viewer: {
    dashboard: true,
    cohorts: true,
    forms: true,
    participants: true,
    selection: false,
    enrollment: false,
    graduation: false,
    projects: false,
    reports: true,
    users: false,
  },

  pending: {
    ...DEFAULT_PERMISSIONS,
  },
};

export const getPermissionsByRole = (role) => {
  return ROLE_PERMISSIONS[role] || DEFAULT_PERMISSIONS;
};