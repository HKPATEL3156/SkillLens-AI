import React, { useEffect, useState, useMemo } from "react";
import { adminDashboard, adminReports } from "../services/api";
import { FiUsers, FiBriefcase, FiFileText, FiTrendingUp, FiDownload, FiCopy, FiPieChart } from "react-icons/fi";

const KPI = ({ label, value, icon: Icon, color }) => (
  <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-5 group hover:translate-y-[-2px] transition-all">
    <div className={`p-4 rounded-2xl bg-${color}-50 text-${color}-600 group-hover:scale-110 transition-transform`}>
      <Icon size={24} />
    </div>
    <div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-2xl font-black text-slate-800">{value}</div>
    </div>
  </div>
);

function Sparkline({ values = [], height = 60, width = 180 }){
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  const points = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M 0 ${height} L ${points} L ${width} ${height} Z`} fill="url(#gradient)" />
      <polyline fill="none" stroke="#6366f1" strokeWidth="2.5" points={points} strokeLinecap="round" strokeLinejoin="round" />
      {values.length > 0 && (
        <circle cx={width} cy={height - ((values[values.length-1] - min) / range) * height} r="4" fill="#6366f1" />
      )}
    </svg>
  );
}

function HorizontalBars({ items = [] }){
  const max = Math.max(1, ...(items.map(i=>i.count||0)));
  return (
    <div className="space-y-4">
      {items.map((it, idx)=> (
        <div key={idx} className="group">
          <div className="flex justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-600 truncate max-w-[180px]">{it._id}</span>
            <span className="text-indigo-600">{it.count}</span>
          </div>
          <div className="flex-1 bg-slate-50 rounded-full h-2 overflow-hidden border border-slate-100">
            <div 
              style={{ width: `${Math.round(((it.count||0)/max)*100)}%` }} 
              className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-1000" 
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([adminDashboard(), adminReports()])
      .then(([dash, reps]) => {
        if (!mounted) return;
        setData(dash.data || {});
        setReports(reps.data || {});
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => (mounted = false);
  }, []);

  const usersSeries = useMemo(()=>{
    const arr = (data && data.analytics && data.analytics.usersGrowth) || [];
    const sorted = arr.slice().sort((a,b)=> {
      const A = (a._id && (a._id.year*100 + a._id.month))||0;
      const B = (b._id && (b._id.year*100 + b._id.month))||0;
      return A-B;
    });
    return sorted.map(s=>s.count || 0);
  }, [data]);

  const jobsSeries = useMemo(()=>{
    const arr = (data && data.analytics && data.analytics.jobsGrowth) || [];
    const sorted = arr.slice().sort((a,b)=> {
      const A = (a._id && (a._id.year*100 + a._id.month))||0;
      const B = (b._id && (b._id.year*100 + b._id.month))||0;
      return A-B;
    });
    return sorted.map(s=>s.count || 0);
  }, [data]);

  const appsSeries = useMemo(()=>{
    const arr = (data && data.analytics && data.analytics.applicationsTrend) || [];
    const sorted = arr.slice().sort((a,b)=> {
      const A = (a._id && (a._id.year*100 + a._id.month))||0;
      const B = (b._id && (b._id.year*100 + b._id.month))||0;
      return A-B;
    });
    return sorted.map(s=>s.count || 0);
  }, [data]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Synchronizing Engine...</p>
    </div>
  );

  const counts = (data && data.counts) || {};
  const analytics = (data && data.analytics) || {};
  const topSkills = analytics.topSkills || [];
  const topRoles = analytics.topRoles || [];

  return (
    <div className="min-h-screen bg-[#FBFDFF] pb-20 px-4 md:px-8">
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto pt-10 mb-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Command Center</h1>
            <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-widest">Global Platform Intelligence</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => { navigator.clipboard?.writeText(JSON.stringify({ data, reports }, null, 2)); alert('System State Copied'); }} 
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              <FiCopy /> Raw Data
            </button>
            <a 
              href="/api/admin/reports" 
              target="_blank" 
              rel="noreferrer" 
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
            >
              <FiDownload /> Export Reports
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* KPI GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <KPI label="Platform Users" value={(counts.totalUsers ?? 0).toLocaleString()} icon={FiUsers} color="indigo" />
          <KPI label="Active Recruiters" value={(counts.totalRecruiters ?? 0).toLocaleString()} icon={FiBriefcase} color="blue" />
          <KPI label="Total Job Posts" value={(counts.totalJobs ?? 0).toLocaleString()} icon={FiFileText} color="emerald" />
          <KPI label="Job Applications" value={(counts.totalApplications ?? 0).toLocaleString()} icon={FiTrendingUp} color="amber" />
        </div>

        {/* GROWTH CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'User Acquisition', series: usersSeries, icon: FiUsers },
            { label: 'Market Listings', series: jobsSeries, icon: FiBriefcase },
            { label: 'Application Volume', series: appsSeries, icon: FiTrendingUp }
          ].map((chart, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden group">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <chart.icon className="text-slate-300" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{chart.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-800 leading-none">{chart.series.length ? chart.series[chart.series.length-1] : 0}</div>
                  <div className="text-[9px] font-bold text-emerald-500 uppercase mt-1 tracking-tighter">Current Period</div>
                </div>
              </div>
              <div className="px-1">
                <Sparkline values={chart.series} />
              </div>
            </div>
          ))}
        </div>

        {/* TOP DEMAND SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/30">
            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3 leading-none">
              <span className="w-2 h-6 bg-indigo-600 rounded-full"></span> Top Skills Demand
            </h3>
            {topSkills.length === 0 ? <div className="py-10 text-center text-slate-300 italic">Insufficient Data Profile</div> : <HorizontalBars items={topSkills.slice(0,8)} />}
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/30">
            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3 leading-none">
              <span className="w-2 h-6 bg-blue-600 rounded-full"></span> High-Traffic Roles
            </h3>
            {topRoles.length === 0 ? <div className="py-10 text-center text-slate-300 italic">Insufficient Data Profile</div> : <HorizontalBars items={topRoles.slice(0,8)} />}
          </div>
        </div>

        {/* FOOTER REPORTS */}
        {reports && (
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <FiPieChart className="absolute right-[-20px] bottom-[-20px] text-white/5 w-64 h-64 group-hover:scale-110 transition-transform" />
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 mb-10">platform_audit_v2.0</h3>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
              <div className="lg:col-span-3">
                <div className="mb-6">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Active Accounts</div>
                  <div className="text-4xl font-black text-indigo-100">{reports.activeUsers ?? 0}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Dormant Accounts</div>
                  <div className="text-4xl font-black text-slate-500">{reports.inactiveUsers ?? 0}</div>
                </div>
              </div>

              <div className="lg:col-span-9 bg-white/5 backdrop-blur-md rounded-[2rem] p-8 border border-white/10">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Market Leaders (by Postings)</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                  {(reports.topCompanies || []).slice(0,6).map((c, i)=> (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 group cursor-default">
                      <div className="truncate font-bold text-slate-300 group-hover:text-white transition-colors">{c.company?.company_name || 'Anonymous Org'}</div>
                      <div className="flex items-center gap-3">
                         <div className="text-xs font-black text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-lg border border-indigo-400/20">{c.jobs} Jobs</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;