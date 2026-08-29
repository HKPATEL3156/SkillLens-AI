import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaUserCircle, FaBriefcase, FaList, FaCog } from 'react-icons/fa';
import { companyDashboard, companyGetNotifications } from '../services/api';

const CompanySidebar = ({ isOpen }) => {
  const [counts, setCounts] = useState({ jobs: 0, applications: 0, notifications: 0 });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await companyDashboard();
        const data = res.data || {};
        if (!mounted) return;
        const countsObj = data.counts || {};
        let notifCount = 0;
        try {
          const nres = await companyGetNotifications({ limit: 1 });
          const ndata = nres.data || [];
          notifCount = Array.isArray(ndata) ? ndata.length : (ndata.total || 0);
        } catch (_) {
          notifCount = 0;
        }
        setCounts({
          jobs: countsObj.totalJobs || 0,
          applications: countsObj.totalApplicants || 0,
          notifications: notifCount,
        });
      } catch (err) {
        // silent fail — leave counts as 0 (common when not authenticated)
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const badge = (n) => (
    <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold rounded-full bg-red-600 text-white">
      {n}
    </span>
  );

  return (
    <aside className={`bg-blue-800 text-white h-screen pt-16 flex-shrink-0 transition-all duration-300 shadow-lg ${isOpen ? 'w-64' : 'w-16'}`}>
      <nav className="flex flex-col space-y-4 p-4">
        <NavLink to="/company" className={({isActive})=>`flex items-center p-2 rounded hover:bg-blue-700 ${isActive? 'bg-blue-700':''}`}>
          <div className="relative flex items-center">
            <FaTachometerAlt className="text-xl" />
            {counts.jobs ? badge(counts.jobs) : null}
            {isOpen && <span className="ml-4 flex items-center">Dashboard</span>}
          </div>
        </NavLink>
        <NavLink to="/company/profile" className={({isActive})=>`flex items-center p-2 rounded hover:bg-blue-700 ${isActive? 'bg-blue-700':''}`}>
          <div className="relative flex items-center">
            <FaUserCircle className="text-xl" />
            {isOpen && <span className="ml-4">Profile</span>}
          </div>
        </NavLink>
        <NavLink to="/company/jobs" className={({isActive})=>`flex items-center p-2 rounded hover:bg-blue-700 ${isActive? 'bg-blue-700':''}`}>
          <div className="relative flex items-center">
            <FaBriefcase className="text-xl" />
            {counts.jobs ? badge(counts.jobs) : null}
            {isOpen && <span className="ml-4 flex items-center">Jobs</span>}
          </div>
        </NavLink>
        <NavLink to="/company/activity" className={({isActive})=>`flex items-center p-2 rounded hover:bg-blue-700 ${isActive? 'bg-blue-700':''}`}>
          <div className="relative flex items-center">
            <FaList className="text-xl" />
            {counts.applications ? badge(counts.applications) : null}
            {isOpen && <span className="ml-4 flex items-center">Activity</span>}
          </div>
        </NavLink>
        <NavLink to="/company/settings" className={({isActive})=>`flex items-center p-2 rounded hover:bg-blue-700 ${isActive? 'bg-blue-700':''}`}>
          <div className="relative flex items-center">
            <FaCog className="text-xl" />
            {counts.notifications ? badge(counts.notifications) : null}
            {isOpen && <span className="ml-4 flex items-center">Settings</span>}
          </div>
        </NavLink>
      </nav>
    </aside>
  );
};

export default CompanySidebar;
