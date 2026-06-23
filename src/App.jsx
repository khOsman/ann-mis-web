import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import CreateCohort from "./pages/cohorts/CreateCohort";
import AllCohorts from "./pages/cohorts/AllCohorts";
import EditCohort from "./pages/cohorts/EditCohort";
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
        </Routes>
      </BrowserRouter>
    </AlertProvider>
  );
}