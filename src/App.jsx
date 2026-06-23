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
import { AlertProvider } from "./context/AlertContext";
import { ROUTES } from "./constants/routes";

export default function App() {
  return (
    <AlertProvider>
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.login} element={<Login />} />
          <Route path={ROUTES.admin} element={<Admin />} />
          <Route path={ROUTES.cohorts} element={<AllCohorts />} />
          <Route path={ROUTES.createCohort} element={<CreateCohort />} />
          <Route path={ROUTES.editCohort} element={<EditCohort />} />
          <Route path="/admin/cohorts/:id" element={<CohortDetails />} />
          <Route path={ROUTES.forms} element={<AllForms />} />
          <Route path={ROUTES.createForm} element={<CreateForm />} />
          <Route path="/admin/forms/:id/builder" element={<FormBuilder />} />
          <Route path="/form/:slug" element={<PublicForm />} />
        </Routes>
      </BrowserRouter>
    </AlertProvider>
  );
}