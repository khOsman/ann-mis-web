import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import CreateCohort from "./pages/cohorts/CreateCohort";
import AllCohorts from "./pages/cohorts/AllCohorts";
import { ROUTES } from "./constants/routes";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.login} element={<Login />} />
        <Route path={ROUTES.admin} element={<Admin />} />
        <Route path={ROUTES.cohorts} element={<AllCohorts />} />
        <Route path={ROUTES.createCohort} element={<CreateCohort />} />
      </Routes>
    </BrowserRouter>
  );
}