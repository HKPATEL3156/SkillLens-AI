import React, { useState } from "react";
import Dheader from "../components/Dheader";
import Dsidebar from "../components/Dsidebar";
import Dfooter from "../components/Dfooter";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <Dheader toggleSidebar={toggleSidebar} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (now in-flow so it pushes content instead of overlaying) */}
        <Dsidebar isOpen={isSidebarOpen} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100 transition-all duration-300 mt-16 mb-16">
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <Dfooter />
    </div>
  );
};

export default DashboardLayout;