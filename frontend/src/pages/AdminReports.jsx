import React, { useEffect, useState } from 'react';
import { FiDownload, FiBarChart2, FiRefreshCw, FiPieChart, FiTrendingUp, FiActivity, FiFileText } from 'react-icons/fi';
import { adminReports } from '../services/api';

const Sparkline = ({ values = [], color = '#6366F1', width = 140, height = 48 }) => {
  if (!values || values.length === 0) return <div style={{ width, height }} />;
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1 || 1)) * width;
    const y = height - ((v - min) / (max - min || 1)) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="2.5" points={pts} strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm" />
      <circle cx={width} cy={height - ((values[values.length-1] - min) / (max - min || 1)) * height} r="3" fill={color} />
    </svg>
  );
};

const HorizontalBars = ({ items = [], labelKey = 'label', valueKey = 'value' }) => {
  const max = items.length ? Math.max(...items.map(i => Number(i[valueKey] || 0))) : 0;
  return (
    <div className="space-y-4">
      {items.map((it, idx) => (
        <div key={idx} className="group">
          <div className="flex justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-600 truncate max-w-[180px]">{it[labelKey] || it.name || it.skill || ''}</span>
            <span className="text-indigo-600 font-black">{it[valueKey]}</span>
          </div>
          <div className="h-2 bg-slate-50 rounded-full flex-1 border border-slate-100 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-1000" 
              style={{ width: `${max ? ((it[valueKey] || 0) / max) * 100 : 0}%` }} 
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminReports = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminReports().then(r => setReports(r.data)).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const downloadJSON = (obj = reports, name = 'admin-reports.json') => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  };

  const exportArrayToCSV = (arr = [], filename = 'export.csv') => {
    if (!arr || arr.length === 0) { alert('Nothing to export'); return; }
    const keys = Array.from(arr.reduce((s, r) => { Object.keys(r || {}).forEach(k => s.add(k)); return s; }, new Set()));
    const csv = [keys.join(',')].concat(arr.map(r => keys.map(k => '"' + String((r && r[k]) || '').replace(/"/g, '""') + '"').join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] animate-pulse">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Generating Intelligence...</p>
    </div>
  );
  if (!reports) return <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">No reports available</div>;

  const safeNumber = (paths = []) => {
    for (const p of paths) { if (reports[p] !== undefined) return reports[p]; }
    return 0;
  };
  // helper to read multiple possible paths from backend payloads
  const getPathValue = (obj, path) => {
    if (!obj) return undefined;
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
  };

  const getNumber = (paths = []) => {
    for (const p of paths) {
      const v = getPathValue(reports, p);
      if (v !== undefined && v !== null) return Number(v || 0);
    }
    return 0;
  };

  const usersTotal = getNumber(['totalUsers', 'counts.totalUsers', 'counts.total_users', 'usersTotal', 'usersCount', 'users', 'kpis.users']);
  const jobsTotal = getNumber(['totalJobs', 'counts.totalJobs', 'jobsTotal', 'jobsCount', 'kpis.jobs']);
  const applicationsTotal = getNumber(['totalApplications', 'applicationsTotal', 'applicationsCount', 'kpis.applications']);
  const recruitersTotal = getNumber(['totalRecruiters', 'counts.totalRecruiters', 'recruitersTotal', 'recruitersCount', 'kpis.recruiters']);

  const usersTrend = reports.usersGrowth || reports.usersTrend || reports.analytics?.usersGrowth || [];
  const jobsTrend = reports.jobsGrowth || reports.jobsTrend || reports.analytics?.jobsGrowth || [];
  const appsTrend = reports.applicationsTrend || reports.applications || reports.analytics?.applicationsTrend || [];

  const normalizeList = (arr) => (arr || []).map(it => {
    if (!it) return { label: '', value: 0 };
    if (typeof it === 'string') return { label: it, value: 1 };
    if (typeof it === 'number') return { label: String(it), value: it };
    const label = it.label || it.name || it.skill || it.role || it._id || '';
    const value = it.value || it.count || it.total || it.score || it.tally || 0;
    return { label, value };
  }).map(x => ({ label: x.label, value: Number(x.value || 0) }));

  // Backend reports shape compatibility
  const topSkills = normalizeList(
    reports.skillDemand
      ? (reports.skillDemand || []).map(s => ({ label: s._id || s.label || s.skill, value: s.count || s.value }))
      : (reports.topSkills || reports.top_skills || reports.analytics?.topSkills || [])
  );

  const topCompanies = (reports.topCompanies || []).map((c) => ({
    label: (c.company && (c.company.company_name || c.company.username)) || String(c._id || ''),
    value: c.jobs || c.count || 0,
    raw: c,
  }));

  const mostAppliedJobs = (reports.mostAppliedJobs || []).map((j) => ({
    label: (j.job && j.job.title) || String(j._id || ''),
    value: j.applicants || j.count || 0,
    company: j.job && (j.job.companyId || j.job.company) ? (j.job.companyId?.company_name || j.job.company?.company_name || j.job.companyId || '') : '',
    raw: j,
  }));

  const topRoles = normalizeList(reports.topRoles || reports.top_roles || reports.analytics?.topRoles || []);

  const reload = async () => {
    setLoading(true);
    try {
      const r = await adminReports();
      setReports(r.data);
    } catch (err) {
      // ignore for now
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 md:px-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Market Intelligence</h2>
          <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-[0.2em]">Global Platform Reports</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button onClick={() => reload()} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-full text-sm text-slate-600 shadow-sm"><FiRefreshCw /> Refresh</button>
          <button onClick={() => downloadJSON()} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <FiDownload /> JSON
          </button>
          <button onClick={() => exportArrayToCSV(topSkills, 'top-skills.csv')} className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            Skills CSV
          </button>
          <button onClick={() => exportArrayToCSV(topCompanies, 'top-companies.csv')} className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            Companies CSV
          </button>
          <button onClick={() => exportArrayToCSV(mostAppliedJobs, 'most-applied-jobs.csv')} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">
            Jobs CSV
          </button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Total Users', val: usersTotal, trend: usersTrend, color: '#6366F1' },
          { label: 'Live Jobs', val: jobsTotal, trend: jobsTrend, color: '#10B981' },
          { label: 'Applications', val: applicationsTotal, trend: appsTrend, color: '#F59E0B' },
          { label: 'Recruiters', val: recruitersTotal, trend: reports.recruitersTrend || [], color: '#8B5CF6' }
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 group hover:translate-y-[-2px] transition-all">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</div>
            <div className="text-3xl font-black text-slate-800 mb-6 leading-none">{kpi.val.toLocaleString()}</div>
            <div className="h-12 w-full overflow-hidden">
              <Sparkline values={kpi.trend} color={kpi.color} />
            </div>
          </div>
        ))}
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/30">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 leading-none">
              <span className="w-2 h-6 bg-indigo-600 rounded-full"></span> Top Skills Demand
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{topSkills.length} Items</span>
          </div>
          {topSkills.length ? <HorizontalBars items={topSkills.slice(0,8)} /> : <div className="py-10 text-center text-slate-300 italic">No skill telemetry archived</div>}
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/30">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 leading-none">
              <span className="w-2 h-6 bg-blue-600 rounded-full"></span> High-Traffic Roles
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{topRoles.length} Items</span>
          </div>
          {topRoles.length ? <HorizontalBars items={topRoles.slice(0,8)} /> : <div className="py-10 text-center text-slate-300 italic">No role telemetry archived</div>}
        </div>
      </div>
      {/* Raw report viewer removed to declutter UI */}
      {/* COMPANIES / MOST APPLIED JOBS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-white p-8 rounded-2xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-black text-slate-800">Top Companies (by job count)</h4>
            <div className="flex items-center gap-2">
              <button onClick={() => downloadJSON(topCompanies, 'top-companies.json')} className="px-3 py-1 border rounded text-sm">JSON</button>
              <button onClick={() => exportArrayToCSV(topCompanies, 'top-companies.csv')} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">CSV</button>
            </div>
          </div>
          {topCompanies.length ? <HorizontalBars items={topCompanies.slice(0,10)} /> : <div className="py-8 text-center text-slate-400 italic">No company telemetry found</div>}
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-black text-slate-800">Most Applied Jobs</h4>
            <div className="flex items-center gap-2">
              <button onClick={() => downloadJSON(mostAppliedJobs, 'most-applied-jobs.json')} className="px-3 py-1 border rounded text-sm">JSON</button>
              <button onClick={() => exportArrayToCSV(mostAppliedJobs, 'most-applied-jobs.csv')} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">CSV</button>
            </div>
          </div>
          {mostAppliedJobs.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="pb-2">Job</th>
                    <th className="pb-2">Company</th>
                    <th className="pb-2 text-right">Applicants</th>
                  </tr>
                </thead>
                <tbody>
                  {mostAppliedJobs.slice(0,12).map((r, idx) => (
                    <tr key={idx} className="border-t"><td className="py-3 pr-4">{r.label}</td><td className="py-3 pr-4 text-slate-600">{r.company}</td><td className="py-3 text-right font-bold">{r.value}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="py-8 text-center text-slate-400 italic">No application telemetry</div>}
        </div>
      </div>
      
    </div>
  );
};

export default AdminReports;