import React from "react";
import { NavLink } from "react-router-dom";
import { FaUsers, FaBuilding, FaBriefcase, FaCheckCircle, FaChartBar, FaCog } from "react-icons/fa";

const AdminSidebar = ({ isOpen }) => {
  return (
    <aside className={`bg-blue-900 text-white h-screen pt-16 flex-shrink-0 transition-all duration-300 shadow-lg ${isOpen ? 'w-64' : 'w-16'}`}>
      <nav className="flex flex-col space-y-4 p-4">
        <NavLink to="/admin" className={({ isActive }) => `flex items-center p-2 rounded hover:bg-blue-800 ${isActive ? 'bg-blue-800' : ''}`}>
          <FaChartBar className="text-xl" />
          {isOpen && <span className="ml-4">Dashboard</span>}
        </NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => `flex items-center p-2 rounded hover:bg-blue-800 ${isActive ? 'bg-blue-800' : ''}`}>
          <FaUsers className="text-xl" />
          {isOpen && <span className="ml-4">Users</span>}
        </NavLink>
        <NavLink to="/admin/recruiters" className={({ isActive }) => `flex items-center p-2 rounded hover:bg-blue-800 ${isActive ? 'bg-blue-800' : ''}`}>
          <FaBuilding className="text-xl" />
          {isOpen && <span className="ml-4">Recruiters</span>}
        </NavLink>
        <NavLink to="/admin/jobs" className={({ isActive }) => `flex items-center p-2 rounded hover:bg-blue-800 ${isActive ? 'bg-blue-800' : ''}`}>
          <FaBriefcase className="text-xl" />
          {isOpen && <span className="ml-4">Jobs</span>}
        </NavLink>
        <NavLink to="/admin/approvals" className={({ isActive }) => `flex items-center p-2 rounded hover:bg-blue-800 ${isActive ? 'bg-blue-800' : ''}`}>
          <FaCheckCircle className="text-xl" />
          {isOpen && <span className="ml-4">Approvals</span>}
        </NavLink>
        <NavLink to="/admin/reports" className={({ isActive }) => `flex items-center p-2 rounded hover:bg-blue-800 ${isActive ? 'bg-blue-800' : ''}`}>
          <FaChartBar className="text-xl" />
          {isOpen && <span className="ml-4">Reports</span>}
        </NavLink>
        <NavLink to="/admin/settings" className={({ isActive }) => `flex items-center p-2 rounded hover:bg-blue-800 ${isActive ? 'bg-blue-800' : ''}`}>
          <FaCog className="text-xl" />
          {isOpen && <span className="ml-4">Settings</span>}
        </NavLink>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
