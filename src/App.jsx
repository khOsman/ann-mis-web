import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import CreateCohort from "./pages/cohorts/CreateCohort";
import AllCohorts from "./pages/cohorts/AllCohorts";
import EditCohort from "./pages/cohorts/EditCohort";
import CohortDetails from "./pages/cohorts/CohortDetails";
import AllForms from "./pages/forms/AllForms";
import CreateForm from "./pages/forms/CreateForm";
import EditForm from "./pages/forms/EditForm";
import FormBuilder from "./pages/forms/FormBuilder";
import PublicForm from "./pages/public/PublicForm";
import AllParticipants from "./pages/participants/AllParticipants";
import ParticipantProfile from "./pages/participants/ParticipantProfile";
import BulkImportParticipants from "./pages/participants/BulkImportParticipants";
import AllUsers from "./pages/users/AllUsers";
import UserProfile from "./pages/users/UserProfile";
import ReportsDashboard from "./pages/reports/ReportsDashboard";
import CustomReportBuilder from "./pages/reports/CustomReportBuilder";

import AccountPending from "./pages/system/AccountPending";
import AccountInactive from "./pages/system/AccountInactive";
import AccessDenied from "./pages/system/AccountDenied.jsx";

import ChampionRegistration from "./pages/champions/ChampionRegistration";
import ChampionActivateAccount from "./pages/champions/ChampionActivateAccount";
import ChampionHome from "./pages/champions/ChampionHome";
import ChampionProfile from "./pages/champions/ChampionProfile";
import AllChampions from "./pages/champions/AllChampions";
import SelectionCommittee from "./pages/champions/SelectionCommittee";
import ChampionMyProfile from "./pages/champions/portal/ChampionMyProfile";
import ChampionFGDs from "./pages/champions/portal/ChampionFGDs";
import ChampionFGDDetail from "./pages/champions/portal/ChampionFGDDetail";
import ChampionFGDRosters from "./pages/champions/portal/ChampionFGDRosters";
import ChampionFGDRosterDetail from "./pages/champions/portal/ChampionFGDRosterDetail";
import ChampionClassroom from "./pages/champions/portal/ChampionClassroom";
import ChampionProjects from "./pages/champions/portal/ChampionProjects";
import AllFGDs from "./pages/selection/fgd/AllFGDs";
import CohortFGDs from "./pages/selection/fgd/CohortFGDs";
import FGDDetails from "./pages/selection/fgd/FGDDetails";

import ProtectedRoute from "./routes/ProtectedRoute";

import { AlertProvider } from "./context/AlertContext";
import { ROUTES } from "./constants/routes";

export default function App() {
  return (
    <AlertProvider>
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.login} element={<Login />} />
          <Route
            path={ROUTES.championRegistration}
            element={<ChampionRegistration />}
          />

          <Route
            path={ROUTES.championActivate}
            element={<ChampionActivateAccount />}
          />

          <Route
            path={ROUTES.championHome}
            element={
              <ProtectedRoute championOnly>
                <ChampionHome />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.championMyProfile}
            element={
              <ProtectedRoute championOnly>
                <ChampionMyProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.championFGDs}
            element={
              <ProtectedRoute championOnly>
                <ChampionFGDs />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.championFGDDetail}
            element={
              <ProtectedRoute championOnly>
                <ChampionFGDDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.championFGDRosters}
            element={
              <ProtectedRoute championOnly>
                <ChampionFGDRosters />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.championFGDRosterDetail}
            element={
              <ProtectedRoute championOnly>
                <ChampionFGDRosterDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.championClassroom}
            element={
              <ProtectedRoute championOnly>
                <ChampionClassroom />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.championProjects}
            element={
              <ProtectedRoute championOnly>
                <ChampionProjects />
              </ProtectedRoute>
            }
          />


          <Route
            path={ROUTES.admin}
            element={
              <ProtectedRoute permission="dashboard">
                <Admin />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.selectionFGDs}
            element={
              <ProtectedRoute permission="selection">
                <AllFGDs />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.championProfile}
            element={
              <ProtectedRoute permission="selection">
                <ChampionProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.champions}
            element={
              <ProtectedRoute permission="selection">
                <AllChampions />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.selectionCommittee}
            element={
              <ProtectedRoute permission="selection">
                <SelectionCommittee />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.selectionFGDDetails}
            element={
              <ProtectedRoute permission="selection">
                <FGDDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.selectionCohortFGDs}
            element={
              <ProtectedRoute permission="selection">
                <CohortFGDs />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/participants/:id"
            element={
              <ProtectedRoute permission="participants">
                <ParticipantProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.cohorts}
            element={
              <ProtectedRoute permission="cohorts">
                <AllCohorts />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.createCohort}
            element={
              <ProtectedRoute permission="cohorts" adminOnly>
                <CreateCohort />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.editCohort}
            element={
              <ProtectedRoute permission="cohorts" adminOnly>
                <EditCohort />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/cohorts/:id"
            element={
              <ProtectedRoute permission="cohorts">
                <CohortDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.forms}
            element={
              <ProtectedRoute permission="forms">
                <AllForms />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.createForm}
            element={
              <ProtectedRoute permission="forms" adminOnly>
                <CreateForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/forms/:id/builder"
            element={
              <ProtectedRoute permission="forms" adminOnly>
                <FormBuilder />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.editForm}
            element={
              <ProtectedRoute permission="forms" adminOnly>
                <EditForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/participants"
            element={
              <ProtectedRoute permission="participants">
                <AllParticipants />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.bulkImportParticipants}
            element={
              <ProtectedRoute superAdminOnly>
                <BulkImportParticipants />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/participants/:id"
            element={
              <ProtectedRoute permission="participants">
                <ParticipantProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute permission="users">
                <AllUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users/:userId"
            element={
              <ProtectedRoute permission="users">
                <UserProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute permission="reports">
                <ReportsDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reports/custom"
            element={
              <ProtectedRoute permission="reports">
                <CustomReportBuilder />
              </ProtectedRoute>
            }
          />

          <Route
            path="/access-denied"
            element={
              <div className="min-h-screen flex items-center justify-center bg-[var(--ann-bg)]">
                <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md text-center shadow-sm">
                  <h1 className="text-2xl font-bold text-[var(--ann-purple)]">
                    Access Denied
                  </h1>
                  <p className="text-gray-600 mt-3">
                    You do not have permission to access this module.
                  </p>
                </div>
              </div>
            }
          />

        <Route
          path={ROUTES.selectionFGDs}
          element={
            <ProtectedRoute permission="selection">
              <AllFGDs />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.selectionCohortFGDs}
          element={
            <ProtectedRoute permission="selection">
              <CohortFGDs />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.selectionFGDDetails}
          element={
            <ProtectedRoute permission="selection">
              <FGDDetails />
            </ProtectedRoute>
          }
        />

        <Route path="/account-pending" element={<AccountPending />} />
        <Route path="/account-inactive" element={<AccountInactive />} />
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route path="/form/:slug" element={<PublicForm />} />
       

        </Routes>
      </BrowserRouter>
    </AlertProvider>
  );
}