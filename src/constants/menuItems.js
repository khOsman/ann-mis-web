import {
  LayoutDashboard,
  UsersRound,
  FileText,
  GraduationCap,
  Rocket,
  BarChart3,
  Settings,
  PlusCircle,
  List,
  Users,
  Trophy,
} from "lucide-react";
import { ROUTES } from "./routes";

export const ADMIN_MENU_ITEMS = [
  {
    label: "Dashboard",
    path: ROUTES.admin,
    icon: LayoutDashboard,
    permission: "dashboard",
  },

  {
    label: "Cohorts",
    path: ROUTES.cohorts,
    icon: UsersRound,
    permission: "cohorts",
    children: [
      {
        label: "Create Cohort",
        path: ROUTES.createCohort,
        icon: PlusCircle,
        permission: "cohorts",
      },
      {
        label: "All Cohorts",
        path: ROUTES.cohorts,
        icon: List,
        permission: "cohorts",
      },
    ],
  },

  {
    label: "Forms",
    path: ROUTES.forms,
    icon: FileText,
    permission: "forms",
    children: [
      {
        label: "Create Form",
        path: ROUTES.createForm,
        icon: PlusCircle,
        permission: "forms",
      },
      {
        label: "All Forms",
        path: ROUTES.forms,
        icon: List,
        permission: "forms",
      },
    ],
  },

  {
  label: "Participants",
  path: ROUTES.participants,
  icon: GraduationCap,
  permission: "participants",
    children: [
    {
      label: "All Participants",
      path: ROUTES.participants,
      icon: List,
      permission: "participants",
    },
    {
      label: "Selection",
      path: ROUTES.selectionFGDs,
      icon: List,
      permission: "selection",
        children: [
          {
            label: "All FGDs",
            path: ROUTES.selectionFGDs,
            icon: List,
            permission: "selection",
          },
        ],
    },
    {
      label: "Enrollment",
      path: "/admin/participants/enrollment",
      icon: List,
      permission: "enrollment",
    },
    {
      label: "Graduation",
      path: "/admin/participants/graduation",
      icon: List,
      permission: "graduation",
    },
  ],
  },

  {
    label: "Projects",
    path: ROUTES.projects,
    icon: Rocket,
    permission: "projects",
  },

  {
    label: "Reports",
    path: ROUTES.reports,
    icon: BarChart3,
    permission: "reports",
    children: [
      {
        label: "Custom Report",
        path: "/admin/reports/custom",
        icon: List,
        permission: "reports",
      },
    ],
  },

  {
    label: "Champions",
    path: ROUTES.champions,
    icon: Trophy,
    permission: "selection",
    children: [
      {
        label: "All Champions",
        path: ROUTES.champions,
        icon: List,
        permission: "selection",
      },
      {
        label: "Selection Committee",
        path: `${ROUTES.champions}?role=selection_committee`,
        icon: List,
        permission: "selection",
      },
      {
        label: "Facilitator",
        path: `${ROUTES.champions}?role=facilitator`,
        icon: List,
        permission: "selection",
      },
      {
        label: "Co-Facilitator",
        path: `${ROUTES.champions}?role=co_facilitator`,
        icon: List,
        permission: "selection",
      },
      {
        label: "Mentor",
        path: `${ROUTES.champions}?role=mentor`,
        icon: List,
        permission: "selection",
      },
      {
        label: "YCN",
        path: `${ROUTES.champions}?role=ycn`,
        icon: List,
        permission: "selection",
      },
    ],
  },

  {
    label: "Users",
    path: "/admin/users",
    icon: Users,
    permission: "users",
  },

  {
    label: "Settings",
    path: ROUTES.settings,
    icon: Settings,
    permission: "settings",
  },
];