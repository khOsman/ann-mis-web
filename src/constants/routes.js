export const ROUTES = {
  login: "/",
  admin: "/admin",

  cohorts: "/admin/cohorts",
  createCohort: "/admin/cohorts/create",
  editCohort: "/admin/cohorts/:id/edit",

  forms: "/admin/forms",
  createForm: "/admin/forms/create",
  editForm: "/admin/forms/:id/edit",
  formBuilder: "/admin/forms/:id/builder",

  selectionCommitteeRegistration: "/selection-committee/register",
  selectionCommitteeMembers: "/admin/participants/selection/committee-members",
  selectionCommitteeProfile: "/admin/participants/selection/committee-members/:memberId",
  selectionFGDs: "/admin/participants/selection/fgds",
  selectionCohortFGDs: "/admin/participants/selection/fgds/:cohortId",
  selectionFGDDetails: "/admin/participants/selection/fgds/details/:fgdId",

  participants: "/admin/participants",
  projects: "/admin/projects",
  reports: "/admin/reports",
  settings: "/admin/settings",
};