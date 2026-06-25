import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import CreateCohort from "./pages/cohorts/CreateCohort";
import AllCohorts from "./pages/cohorts/AllCohorts";
import EditCohort from "./pages/cohorts/EditCohort";
import CohortDetails from "./pages/cohorts/CohortDetails";
import AllForms from "./pages/forms/AllForms";
import CreateForm from "./pages/forms/CreateForm";
import FormBuilder from "./pages/forms/FormBuilder";
import PublicForm from "./pages/public/PublicForm";
import AllParticipants from "./pages/participants/AllParticipants";
import ParticipantProfile from "./pages/participants/ParticipantProfile";
import AllUsers from "./pages/users/AllUsers";
import UserProfile from "./pages/users/UserProfile";
import ReportsDashboard from "./pages/reports/ReportsDashboard";
import CustomReportBuilder from "./pages/reports/CustomReportBuilder";


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
            path={ROUTES.admin}
            element={
              <ProtectedRoute permission="dashboard">
                <Admin />
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
              <ProtectedRoute permission="cohorts">
                <CreateCohort />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.editCohort}
            element={
              <ProtectedRoute permission="cohorts">
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
              <ProtectedRoute permission="forms">
                <CreateForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/forms/:id/builder"
            element={
              <ProtectedRoute permission="forms">
                <FormBuilder />
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

          <Route path="/form/:slug" element={<PublicForm />} />
        </Routes>
      </BrowserRouter>
    </AlertProvider>
  );
}