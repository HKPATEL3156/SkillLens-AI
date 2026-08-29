import React from "react";
import { Route, Routes } from "react-router-dom";
import DashboardLayout from "../layouts/Dashboardlayout";
import DashboardHome from "../pages/Dashboard";
import MyProfile from "../pages/Myprofile";
import MyAcademics from "../pages/Myacademics";
import MyCareer from "../pages/Mycareer";
import SkillLensCoach from "../pages/Skilllenscoach";
import Jobs from "../pages/Jobs";
import JobDetail from "../pages/JobDetail";
import QuizPage from "../pages/QuizPage";
import MyActivity from "../pages/Myactivity";
import Settings from "../pages/Settings";

const DashboardRoutes = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="profile" element={<MyProfile />} />
        <Route path="academics" element={<MyAcademics />} />
        <Route path="career" element={<MyCareer />} />
        <Route path="coach" element={<SkillLensCoach />} />
        <Route path="coach/quiz" element={<QuizPage />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="activity" element={<MyActivity />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
};

export default DashboardRoutes;