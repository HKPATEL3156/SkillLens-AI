import React, { useState } from "react";
import Dheader from "../components/Dheader";
import AdminSidebar from "../components/AdminSidebar";
import Dfooter from "../components/Dfooter";
import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex flex-col h-screen">
      <Dheader toggleSidebar={toggleSidebar} title="SKILLLENS AI Admin panel" profilePath="/admin/settings" homePath="/admin" />

      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar isOpen={isSidebarOpen} />

        <main className="flex-1 overflow-y-auto p-6 bg-gray-100 transition-all duration-300 mt-16 mb-16">
          <Outlet />
        </main>
      </div>

      <Dfooter />
    </div>
  );
};

export default AdminLayout;
