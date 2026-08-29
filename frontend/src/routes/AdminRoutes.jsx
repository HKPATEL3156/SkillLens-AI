import React from "react";
import { Route, Routes } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../pages/AdminDashboard";
import AdminUsers from "../pages/AdminUsers";
import AdminRecruiters from "../pages/AdminRecruiters";
import AdminJobs from "../pages/AdminJobs";
import AdminApprovals from "../pages/AdminApprovals";
import AdminReports from "../pages/AdminReports";
import AdminSettings from "../pages/AdminSettings";
import AdminRoute from "../components/AdminRoute";

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="recruiters" element={<AdminRecruiters />} />
        <Route path="jobs" element={<AdminJobs />} />
        <Route path="approvals" element={<AdminApprovals />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
