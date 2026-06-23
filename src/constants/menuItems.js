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
} from "lucide-react";
import { ROUTES } from "./routes";

export const ADMIN_MENU_ITEMS = [
  { label: "Dashboard", path: ROUTES.admin, icon: LayoutDashboard },

  {
    label: "Cohorts",
    path: ROUTES.cohorts,
    icon: UsersRound,
    children: [
      { label: "Create Cohort", path: ROUTES.createCohort, icon: PlusCircle },
      { label: "All Cohorts", path: ROUTES.cohorts, icon: List },
    ],
  },

  {
  label: "Forms",
  path: ROUTES.forms,
  icon: FileText,
  children: [
    { label: "Create Form", path: ROUTES.createForm, icon: PlusCircle },
    { label: "All Forms", path: ROUTES.forms, icon: List },
  ],
  },
  { label: "Participants", path: ROUTES.participants, icon: GraduationCap },
  { label: "Projects", path: ROUTES.projects, icon: Rocket },
  { label: "Reports", path: ROUTES.reports, icon: BarChart3 },
  { label: "Settings", path: ROUTES.settings, icon: Settings },
];