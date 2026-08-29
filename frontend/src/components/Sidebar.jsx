import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    setIsOpen(false);
    localStorage.removeItem("token");
    setTimeout(() => {
      window.location.replace("/login");
    }, 150);
  };

  return (
    <div className="flex">
      {/* Hamburger Menu */}
      <div className="bg-blue-600 text-white p-4 cursor-pointer" onClick={toggleSidebar}>
        ☰
      </div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-blue-800 text-white w-64 p-6 transition-transform transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <h2 className="text-2xl font-bold mb-8">SkillLens AI</h2>

        <ul className="space-y-4">
          <li
            className="cursor-pointer hover:bg-blue-700 p-2 rounded"
            onClick={() => navigate("/dashboard/results")}
          >
            My Results
          </li>
          <li
            className="cursor-pointer hover:bg-blue-700 p-2 rounded"
            onClick={() => navigate("/dashboard/resume")}
          >
            My Resume
          </li>
          <li
            className="cursor-pointer hover:bg-blue-700 p-2 rounded"
            onClick={() => navigate("/dashboard/career-coach")}
          >
            Student Career Coach
          </li>
          <li
            className="cursor-pointer hover:bg-blue-700 p-2 rounded"
            onClick={() => navigate("/dashboard/activity")}
          >
            My Activity
          </li>
          <li
            className="cursor-pointer hover:bg-blue-700 p-2 rounded"
            onClick={() => navigate("/dashboard/settings")}
          >
            Settings
          </li>
        </ul>

        <button
          className="mt-8 bg-red-600 hover:bg-red-700 p-2 rounded w-full"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar
