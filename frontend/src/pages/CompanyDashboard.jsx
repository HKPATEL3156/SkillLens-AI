import React, { useEffect, useState } from 'react';
import { companyGetProfile, companyDashboard, companyGetApplicants } from '../services/api';
import { FiUsers, FiFileText, FiCheckCircle, FiXCircle, FiTrendingUp, FiPlus, FiArrowRight } from 'react-icons/fi';

const CompanyDashboard = () => {
  const [jobsCount, setJobsCount] = useState(0);
  const [profile, setProfile] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({ jobsByMonth: [], appsByMonth: [] });
  const [jobPerformance, setJobPerformance] = useState([]);
  const [counts, setCounts] = useState({ totalJobs: 0, totalApplicants: 0, shortlisted: 0, rejected: 0 });
  const [applicantsModal, setApplicantsModal] = useState({ open: false, jobId: null, applicants: [], loading: false });

  const openApplicants = async (jobId) => {
    if (!jobId) return;
    setApplicantsModal({ open: true, jobId, applicants: [], loading: true });
    try {
      const resp = await companyGetApplicants(jobId);
      const list = (resp && resp.data && (resp.data.applicants || resp.data)) || [];
      setApplicantsModal({ open: true, jobId, applicants: list, loading: false });
    } catch (e) {
      setApplicantsModal({ open: true, jobId, applicants: [], loading: false });
    }
  };

  useEffect(() => {
    let mounted = true;
    Promise.all([companyDashboard(), companyGetProfile()])
      .then(([dashRes, profRes]) => {
        if (!mounted) return;
        const data = (dashRes && dashRes.data) || {};
        setCounts(data.counts || {});
        setJobsCount((data.counts && data.counts.totalJobs) || 0);
        setProfile((profRes && (profRes.data || profRes.data.profile || profRes.data.company)) || null);
        setActivities(data.recentApplications || []);
        setAnalytics(data.analytics || { jobsByMonth: [], appsByMonth: [] });
        setJobPerformance(data.jobPerformance || []);
      }).catch(() => { }).finally(() => { if (mounted) setLoading(false); });
    return () => mounted = false;
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 font-medium">Loading Dashboard Data...</p>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      {/* Top Header Section */}
      <div className="bg-white border-b border-slate-200 mb-8 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Hiring Overview</h1>
            <p className="text-slate-500 text-sm font-medium">Welcome back, {profile?.company_name || 'Recruiter'}</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/company/jobs" className="px-4 py-2 text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-semibold text-sm shadow-sm">
              Manage Listings
            </a>
            <a href="/company/jobs/create" className="px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2 font-semibold text-sm">
              <FiPlus /> Post New Job
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Jobs Posted', value: counts.totalJobs, icon: FiFileText, color: 'indigo' },
            { label: 'Total Applicants', value: counts.totalApplicants, icon: FiUsers, color: 'emerald' },
            { label: 'Shortlisted', value: counts.shortlisted, icon: FiCheckCircle, color: 'amber' },
            { label: 'Rejected', value: counts.rejected, icon: FiXCircle, color: 'rose' }
          ].map((card, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-5">
              <div className={`p-4 bg-${card.color}-50 rounded-2xl text-${card.color}-600`}>
                <card.icon size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl font-black text-slate-800">{card.value || 0}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Distribution & Main Chart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Distribution Bar (Full Width within Grid Column) */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FiTrendingUp className="text-indigo-500" /> Pipeline Funnel Distribution
              </h3>
            </div>
            <ApplicationDistribution counts={counts} />
          </div>

          {/* Monthly Analytics */}
          <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6">Jobs vs Apps (Monthly)</h3>
            <div className="space-y-10">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase mb-4 tracking-widest">Postings</p>
                <MiniBarChart series={analytics.jobsByMonth || []} color="indigo" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase mb-4 tracking-widest">Applications</p>
                <MiniBarChart series={analytics.appsByMonth || analytics.applicationsTrend || []} color="emerald" />
              </div>
            </div>
          </div>

          {/* Top Job Performance */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800">Job Performance</h3>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-tighter">Engagement Ranking</span>
            </div>
            <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              <ul className="space-y-4">
                {jobPerformance.slice(0, 8).map((j, idx) => (
                  <li key={j.jobId || idx} className="group flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-400">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{j.title || j.job?.title || 'Untitled Role'}</div>
                        <div className="text-xs font-medium text-slate-400 flex items-center gap-2 mt-0.5">
                          <FiUsers className="text-indigo-400" /> {j.applications} candidates interested
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openApplicants(j.jobId || (j.job && j.job._id))} className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-indigo-700 transition-all">
                        View List
                      </button>
                      <a href={`/company/jobs/${j.jobId || (j.job && j.job._id)}`} className="p-1.5 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-slate-600">
                        <FiArrowRight size={16} />
                      </a>
                    </div>
                  </li>
                ))}
                {jobPerformance.length === 0 && (
                  <div className="text-center py-10">
                    <FiFileText size={40} className="mx-auto text-slate-200 mb-2" />
                    <p className="text-slate-400 text-sm">No active jobs found.</p>
                  </div>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Applicants Modal */}
      {applicantsModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-all animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Job Applicants</h3>
                <p className="text-xs text-slate-500 font-bold uppercase mt-0.5 tracking-widest">Candidate Pool</p>
              </div>
              <button 
                onClick={() => setApplicantsModal({ open: false, jobId: null, applicants: [], loading: false })} 
                className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all"
              >
                <FiXCircle size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {applicantsModal.loading ? (
                <div className="flex flex-col items-center py-20 animate-pulse">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="mt-4 text-slate-400 text-sm font-bold uppercase tracking-widest">Fetching candidates...</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Applied Date</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {applicantsModal.applicants.map((a, i) => (
                      <tr key={a._id || i} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs">
                              {(a.user?.fullName?.[0] || a.user?.name?.[0] || '?').toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-700 text-sm">{a.user?.fullName || a.user?.name || a.applicantName || '—'}</span>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-slate-500 font-medium">{a.user?.email || a.email || '—'}</td>
                        <td className="py-4 text-xs font-bold text-slate-400 uppercase">
                          {a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td className="py-4 text-right">
                          <a className="px-4 py-2 bg-white border border-slate-200 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all" href={a.resumeUrl || a.resume || '#'} target="_blank" rel="noreferrer">
                            Download PDF
                          </a>
                        </td>
                      </tr>
                    ))}
                    {applicantsModal.applicants.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                          <FiUsers size={48} className="mx-auto text-slate-200 mb-4" />
                          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No candidates found for this role</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyDashboard;

function MiniBarChart({ series, color = "indigo" }){
  const months = Array.from({length:12}).map((_,i)=>{
    const d = new Date(); d.setMonth(d.getMonth()- (11 - i));
    return `${d.getFullYear()}-${d.getMonth()+1}`;
  });
  const map = {};
  (series||[]).forEach(s=>{
    const y = s._id && s._id.year; const m = s._id && s._id.month;
    if (y && m) map[`${y}-${m}`] = s.count;
  });
  const values = months.map(k=> map[k] || 0);
  const max = Math.max(1, ...values);
  
  const barColors = {
    indigo: "bg-indigo-500 hover:bg-indigo-600",
    emerald: "bg-emerald-500 hover:bg-emerald-600"
  };

  return (
    <div className="flex items-end h-32 gap-1.5 px-1 group">
      {values.map((v,i)=> (
        <div key={i} className="flex-1 flex flex-col justify-end h-full" title={`${months[i]}: ${v}`}>
          <div 
            style={{height: `${(v/max)*100}%`}} 
            className={`${barColors[color] || barColors.indigo} rounded-t-lg transition-all duration-300 relative group/bar`}
          >
            {v > 0 && (
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-700 opacity-0 group-hover/bar:opacity-100 transition-opacity">
                {v}
              </span>
            )}
          </div>
          <div className="text-[10px] font-black text-slate-300 text-center mt-2 uppercase tracking-tighter">
            {new Date(months[i]).toLocaleString('default',{month:'short'})}
          </div>
        </div>
      ))}
    </div>
  );
}

function ApplicationDistribution({ counts }){
  const total = counts.totalApplicants || 0;
  const shortlisted = counts.shortlisted || 0;
  const rejected = counts.rejected || 0;
  const others = Math.max(0, total - shortlisted - rejected);
  const safePct = (n) => (total === 0 ? 0 : Math.round((n / total) * 100));

  return (
    <div className="flex flex-col md:flex-row items-center gap-8">
      <div className="flex-1 w-full">
        <div className="h-6 bg-slate-100 rounded-full flex overflow-hidden shadow-inner border border-slate-200">
          <div style={{ width: `${safePct(shortlisted)}%` }} className="bg-amber-400 transition-all duration-500" title="Shortlisted" />
          <div style={{ width: `${safePct(rejected)}%` }} className="bg-rose-400 transition-all duration-500" title="Rejected" />
          <div style={{ width: `${safePct(others)}%` }} className="bg-indigo-400 transition-all duration-500" title="Applied" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs font-black text-slate-500 mt-6 uppercase tracking-widest">
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-amber-400 rounded-full shadow-sm"/> Shortlisted <span className="text-slate-800 ml-auto">{shortlisted}</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-rose-400 rounded-full shadow-sm"/> Rejected <span className="text-slate-800 ml-auto">{rejected}</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-indigo-400 rounded-full shadow-sm"/> Applied <span className="text-slate-800 ml-auto">{others}</span></div>
        </div>
      </div>
      <div className="w-full md:w-64 p-6 bg-slate-900 rounded-[2rem] text-white flex flex-col justify-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <FiUsers size={80} />
        </div>
        <div className="relative z-10">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pool</div>
            <div className="text-4xl font-black mb-4">{total} <span className="text-sm text-slate-500">Users</span></div>
            <a href="/company/applicants" className="text-xs font-bold text-indigo-400 hover:text-white flex items-center gap-2 transition-colors">
              Manage Candidates <FiArrowRight />
            </a>
        </div>
      </div>
    </div>
  );
}