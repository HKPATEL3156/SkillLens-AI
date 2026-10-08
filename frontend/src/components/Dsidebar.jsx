import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaUser,
  FaGraduationCap,
  FaBriefcase,
  FaChalkboardTeacher,
  FaTasks,
  FaCog,
  FaSignOutAlt,
  FaSearch,
  FaClipboardList,
  FaFileAlt,
  FaUserGraduate,
} from "react-icons/fa";

const Dsidebar = ({ isOpen }) => {
  return (
    <aside
      className={`bg-blue-800 text-white h-screen pt-16 flex-shrink-0 transition-all duration-300 shadow-lg ${isOpen ? 'w-64' : 'w-16'}`}
    >
      <nav className="flex flex-col space-y-4 p-4">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center p-2 rounded hover:bg-blue-700 ${
              isActive ? "bg-blue-700" : ""
            }`
          }
        >
          <FaTasks className="text-xl" />
          {isOpen && <span className="ml-4">Home</span>}
        </NavLink>
        <NavLink
          to="/dashboard/profile"
          className={({ isActive }) =>
            `flex items-center p-2 rounded hover:bg-blue-700 ${
              isActive ? "bg-blue-700" : ""
            }`
          }
        >
          <FaUser className="text-xl" />
          {isOpen && <span className="ml-4">My Profile</span>}
        </NavLink>
        <NavLink
          to="/dashboard/academics"
          className={({ isActive }) =>
            `flex items-center p-2 rounded hover:bg-blue-700 ${
              isActive ? "bg-blue-700" : ""
            }`
          }
        >
          <FaGraduationCap className="text-xl" />
          {isOpen && <span className="ml-4">My Academics</span>}
        </NavLink>
        <NavLink
          to="/dashboard/career"
          className={({ isActive }) =>
            `flex items-center p-2 rounded hover:bg-blue-700 ${
              isActive ? "bg-blue-700" : ""
            }`
          }
        >
          <FaBriefcase className="text-xl" />
          {isOpen && <span className="ml-4">My Career</span>}
        </NavLink>
        <NavLink
          to="/dashboard/coach"
          className={({ isActive }) =>
            `flex items-center p-2 rounded hover:bg-blue-700 ${
              isActive ? "bg-blue-700" : ""
            }`
          }
        >
          <FaChalkboardTeacher className="text-xl" />
          {isOpen && <span className="ml-4">SkillLens AI Coach</span>}
        </NavLink>
        <NavLink
          to="/dashboard/resume-ats"
          className={({ isActive }) =>
            `flex items-center p-2 rounded hover:bg-blue-700 ${
              isActive ? "bg-blue-700" : ""
            }`
          }
        >
          <FaFileAlt className="text-xl" />
          {isOpen && <span className="ml-4">Resume ATS & Review</span>}
        </NavLink>
        <NavLink
          to="/dashboard/mock-interview"
          className={({ isActive }) =>
            `flex items-center p-2 rounded hover:bg-blue-700 ${
              isActive ? "bg-blue-700" : ""
            }`
          }
        >
          <FaUserGraduate className="text-xl" />
          {isOpen && <span className="ml-4">AI Mock Interview</span>}
        </NavLink>
        <NavLink
          to="/dashboard/jobs"
          className={({ isActive }) =>
            `flex items-center p-2 rounded hover:bg-blue-700 ${
              isActive ? "bg-blue-700" : ""
            }`
          }
        >
          <FaSearch className="text-xl" />
          {isOpen && <span className="ml-4">Find Jobs</span>}
        </NavLink>
        <NavLink
          to="/dashboard/applications"
          className={({ isActive }) =>
            `flex items-center p-2 rounded hover:bg-blue-700 ${
              isActive ? "bg-blue-700" : ""
            }`
          }
        >
          <FaClipboardList className="text-xl" />
          {isOpen && <span className="ml-4">My Applications</span>}
        </NavLink>
        <NavLink
          to="/dashboard/activity"
          className={({ isActive }) =>
            `flex items-center p-2 rounded hover:bg-blue-700 ${
              isActive ? "bg-blue-700" : ""
            }`
          }
        >
          <FaTasks className="text-xl" />
          {isOpen && <span className="ml-4">My Activity</span>}
        </NavLink>
        <NavLink
          to="/dashboard/settings"
          className={({ isActive }) =>
            `flex items-center p-2 rounded hover:bg-blue-700 ${
              isActive ? "bg-blue-700" : ""
            }`
          }
        >
          <FaCog className="text-xl" />
          {isOpen && <span className="ml-4">Settings</span>}
        </NavLink>
      </nav>
    </aside>
  );
};

export default Dsidebar;