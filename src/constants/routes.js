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

  championRegistration: "/champions/register",
  championActivate: "/champions/activate",
  championHome: "/champions",
  championMyProfile: "/champions/profile",
  championFGDs: "/champions/fgds",
  championClassroom: "/champions/classroom",
  championProjects: "/champions/projects",
  champions: "/admin/champions",
  championProfile: "/admin/champions/:championId",
  selectionCommittee: "/admin/champions/selection-committee",
  selectionFGDs: "/admin/participants/selection/fgds",
  selectionCohortFGDs: "/admin/participants/selection/fgds/:cohortId",
  selectionFGDDetails: "/admin/participants/selection/fgds/details/:fgdId",

  participants: "/admin/participants",
  projects: "/admin/projects",
  reports: "/admin/reports",
  settings: "/admin/settings",
};