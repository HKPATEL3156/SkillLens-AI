
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import defaultAvatar from "../assets/default-avatar.svg";


const Dheader = ({ toggleSidebar, title, profilePath, homePath }) => {
  const [openMenu, setOpenMenu] = useState(null);
  const [user, setUser] = useState({ name: "", profilePhoto: "", role: 'user' });
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
    // listen for profile updates from profile page
    const onProfile = (e) => {
      const data = e?.detail || {};
      // prefer common fields, then company documents.logo for recruiters
      const raw = data.profileImage || data.profilePhoto || (data.documents && data.documents.logo) || data.logo || "";
      const resolved = resolveAsset(raw);
      const ts = data.__updatedAt || Date.now();
      const shouldBust = raw && (raw.startsWith('/uploads') || raw.startsWith('uploads') || (resolved && resolved.includes('/uploads')));
      const withTs = resolved && shouldBust ? (resolved.includes('?') ? `${resolved}&t=${ts}` : `${resolved}?t=${ts}`) : resolved || "";
      setUser({
        name: data.company_name || data.fullName || data.name || data.username || "",
        profilePhoto: withTs,
        role: data.role || (data.documents ? 'recruiter' : 'user'),
      });
    };
    window.addEventListener('profileUpdated', onProfile);
    return () => window.removeEventListener('profileUpdated', onProfile);
    // eslint-disable-next-line
  }, []);

  const resolveAsset = (p) => {
    if (!p) return p;
    const base = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
    // Accept both leading slash and non-leading 'uploads' paths
    if (p.startsWith('/uploads') || p.startsWith('uploads')) return `${base}${p.startsWith('/') ? p : '/' + p}`;
    return p;
  };

  const fetchUser = async () => {
    try {
      const res = await api.get("/profile/me");
      const data = res.data || {};
      // prefer company logo for recruiters (Company.documents.logo)
      const raw = data.profileImage || data.profilePhoto || (data.documents && data.documents.logo) || data.logo || "";
      const r = resolveAsset(raw);
      const shouldBust = raw && (raw.startsWith('/uploads') || raw.startsWith('uploads') || (r && r.includes('/uploads')));
      const profilePhoto = r && shouldBust ? (r.includes('?') ? `${r}&t=${Date.now()}` : `${r}?t=${Date.now()}`) : (r || "");
      setUser({
        name: data.company_name || data.fullName || data.name || data.username || "",
        profilePhoto,
        role: data.role || (data.documents ? 'recruiter' : 'user'),
      });
    } catch {
      setUser({ name: "", profilePhoto: "", role: 'user' });
    }
  };

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-blue-600 text-white h-16 flex items-center justify-between px-6 shadow-md z-50">
      
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="text-white text-2xl focus:outline-none"
        >
          ☰
        </button>

        <Link to={homePath || "/dashboard"} className="flex items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl shadow-lg">
              <i className="fas fa-brain text-white text-xl"></i>
            </div>

            <span className="text-white text-3xl font-extrabold tracking-wide">
              {title ? title : (<><span>SkillLens</span> <span className="text-yellow-400">AI</span></>)}
            </span>
          </div>
        </Link>
        {user && user.role === 'admin' && (
          <Link to="/admin" className="ml-6 px-3 py-1 bg-yellow-400 text-black rounded-md font-semibold text-sm hover:opacity-90">
            Admin Panel
          </Link>
        )}
      </div>

      {/* Right Section */}
      <div ref={menuRef} className="flex items-center space-x-6 relative">

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => toggleMenu("notification")}
            className="text-white text-xl hover:text-yellow-300 transition duration-200"
          >
            🔔
          </button>

          {openMenu === "notification" && (
            <div className="absolute right-0 mt-3 w-56 bg-white text-black rounded-xl shadow-xl border py-3 px-4 animate-fadeIn">
              <p className="text-sm text-gray-600">
                No new notifications
              </p>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="relative">
          <button
            onClick={() => toggleMenu("settings")}
            className="text-white text-xl hover:text-yellow-300 transition duration-200"
          >
            ⚙️
          </button>

          {openMenu === "settings" && (
            <div className="absolute right-0 mt-3 w-48 bg-white text-black rounded-xl shadow-xl border py-2">
              <Link
                to={
                  user && user.role === 'admin'
                    ? '/admin/settings'
                    : user && (user.role === 'recruiter' || user.role === 'company')
                    ? '/company/settings'
                    : '/dashboard/settings'
                }
                className="block px-4 py-2 text-sm hover:bg-gray-100 transition duration-200"
              >
                Settings
              </Link>
            </div>
          )}
        </div>

        {/* Account Menu */}
        <div className="relative">
          <button
            onClick={() => toggleMenu("account")}
            className="flex items-center space-x-2 hover:text-yellow-300 transition duration-200"
          >
            {(() => {
              // use square logo for recruiters to avoid circular cropping
              const isCompany = user && (user.role === 'recruiter' || user.role === 'company');
              const imgClass = isCompany
                ? 'w-10 h-10 rounded-md border-2 border-white object-contain bg-white p-1'
                : 'w-9 h-9 rounded-full border-2 border-white object-cover bg-white';
              return (
                <img
                  src={user.profilePhoto || defaultAvatar}
                  alt={isCompany ? (user.name || 'Company') : 'Profile'}
                  className={imgClass}
                />
              );
            })()}
            <span className="hidden md:block font-medium">
              {user.name || "My Profile"}
            </span>
          </button>

          {openMenu === "account" && (
            <div className="absolute right-0 mt-3 w-52 bg-white text-black rounded-xl shadow-xl border py-2">
              <button
                onClick={() => {
                  setOpenMenu(null);
                  // prefer explicit profilePath prop when provided (e.g., /company/profile)
                  if (profilePath) navigate(profilePath);
                  else if (user.role === 'admin') navigate('/admin/settings');
                  else if (user.role === 'recruiter' || user.role === 'company') navigate('/company/profile');
                  else navigate('/dashboard/profile');
                }}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition duration-200"
              >
                My Profile
              </button>

              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition duration-200"
              >
                Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Dheader;
