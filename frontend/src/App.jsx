import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./components/Register";
import DashboardRoutes from "./routes/Dashboardroutes";
import AdminRoutes from "./routes/AdminRoutes";
import CompanyRoutes from "./routes/CompanyRoutes";
import QuizPage from "./pages/QuizPage";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import DashboardLayout from "./layouts/Dashboardlayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Exam route - standalone full-screen page (no dashboard layout) */}
        <Route path="/exam" element={<QuizPage />} />
        <Route path="/exam/:attemptId" element={<QuizPage />} />

        {/* Admin Routes */}
        <Route path="/admin/*" element={<AdminRoutes />} />
        {/* Company / Recruiter Routes */}
        <Route path="/company/*" element={<CompanyRoutes />} />
        {/* Dashboard Routes */}
        <Route path="/jobs" element={<DashboardLayout />}>
          <Route index element={<Jobs />} />
          <Route path=":id" element={<JobDetail />} />
        </Route>
        <Route path="/*" element={<DashboardRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;