import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CompanyLayout from '../layouts/CompanyLayout';
import CompanyDashboard from '../pages/CompanyDashboard';
import CompanyProfile from '../pages/CompanyProfile';
import CompanySettings from '../pages/CompanySettings';
import CompanyActivity from '../pages/CompanyActivity';
import CompanyJobs from '../pages/CompanyJobs';
import CompanyNotifications from '../pages/CompanyNotifications';
import JobDetails from '../pages/JobDetails';
import JobForm from '../pages/JobForm';
import JobRecruit from '../pages/JobRecruit';

const CompanyRoutes = () => (
  <Routes>
    <Route path="/" element={<CompanyLayout />}>
      <Route index element={<CompanyDashboard />} />
      <Route path="profile" element={<CompanyProfile />} />
      <Route path="jobs" element={<CompanyJobs />} />
      <Route path="jobs/new" element={<JobForm />} />
      <Route path="jobs/:id" element={<JobDetails />} />
      <Route path="jobs/:id/recruit" element={<JobRecruit />} />
      <Route path="jobs/:id/edit" element={<JobForm />} />
      <Route path="activity" element={<CompanyActivity />} />
      <Route path="notifications" element={<CompanyNotifications />} />
      <Route path="settings" element={<CompanySettings />} />
    </Route>
  </Routes>
);

export default CompanyRoutes;
