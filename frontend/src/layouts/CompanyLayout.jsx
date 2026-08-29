import React, { useState } from 'react';
import Dheader from '../components/Dheader';
import CompanySidebar from '../components/CompanySidebar';
import Dfooter from '../components/Dfooter';
import { Outlet } from 'react-router-dom';

const CompanyLayout = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col h-screen">
      <Dheader toggleSidebar={() => setOpen(o => !o)} title="Company Portal" profilePath="/company/profile" homePath="/company" />
      <div className="flex flex-1 overflow-hidden">
        <CompanySidebar isOpen={open} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100 transition-all duration-300 mt-16 mb-16">
          <Outlet />
        </main>
      </div>
      <Dfooter />
    </div>
  );
};

export default CompanyLayout;
