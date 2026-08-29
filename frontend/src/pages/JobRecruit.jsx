import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  companyGetJob,
  companyGetApplicants,
  companyUpdateApplicationStatus,
} from '../services/api';
import CandidateProfile from '../components/CandidateProfile';
import { FiSearch, FiDownload, FiArrowLeft, FiPieChart, FiUserCheck, FiUserX, FiTarget, FiExternalLink } from 'react-icons/fi';

export default function JobRecruit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);

  const [applicants, setApplicants] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [appLoading, setAppLoading] = useState(false);
  const [q, setQ] = useState('');

  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await companyGetJob(id);
        const data = (res && res.data) || {};
        if (!mounted) return;
        setJob(data.job || null);
        setMetrics(data.metrics || {});
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, [id]);

  useEffect(() => { loadApplicants(1); }, [id, q]);

  const loadApplicants = async (p = 1) => {
    setAppLoading(true);
    try {
      const res = await companyGetApplicants(id, { page: p, limit: 20, q });
      const data = res.data || {};
      setApplicants(data.applicants || []);
      setTotal(data.total || 0);
      setPage(data.page || p);
    } catch (err) {
      console.error(err);
      setApplicants([]);
    } finally {
      setAppLoading(false);
    }
  };

  const changeStage = async (appId, stage) => {
    try {
      await companyUpdateApplicationStatus(appId, { pipelineStage: stage });
      loadApplicants(page);
    } catch (e) {
      console.error(e);
      alert('Failed to update status');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <div className="text-slate-400 font-black uppercase tracking-widest text-xs">Syncing Job Data...</div>
    </div>
  );

  if (!job) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-slate-500 font-bold bg-white p-8 rounded-3xl shadow-sm border border-slate-100">Job not found.</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFDFF] py-10 px-4 md:px-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation & Title */}
        <div className="mb-8">
            <button onClick={() => navigate('/company/jobs')} className="group flex items-center gap-2 text-xs font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors tracking-widest mb-4">
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> List View
            </button>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">{job.title}</h1>
                <p className="text-sm font-bold text-indigo-600 flex items-center gap-2 italic">
                   Recruitment Pipeline <span className="w-1 h-1 bg-slate-300 rounded-full"></span> {job.companyId?.company_name || 'Hiring Manager'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                 <button onClick={() => navigate(`/company/jobs/${id}/edit`)} className="px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm">Modify Role</button>
              </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT: JOB OVERVIEW & METRICS */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: 'Pool', value: metrics.totalApplicants, icon: FiPieChart, color: 'indigo' },
                { label: 'Shortlist', value: metrics.shortlisted, icon: FiUserCheck, color: 'emerald' },
                { label: 'Dropoff', value: metrics.rejected, icon: FiUserX, color: 'rose' }
              ].map((m, i) => (
                <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</div>
                    <div className={`text-2xl font-black text-slate-800`}>{m.value || 0}</div>
                  </div>
                  <div className={`p-3 bg-${m.color}-50 text-${m.color}-600 rounded-2xl group-hover:scale-110 transition-transform`}>
                    <m.icon size={18} />
                  </div>
                </div>
              ))}
            </div>

            {/* Role Summary Card */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FiTarget className="text-indigo-500" /> Specs
              </h3>
              <div className="space-y-4">
                <div className="pb-4 border-b border-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Required Experience</p>
                  <p className="text-sm font-bold text-slate-700">{job.experience_required?.min_exp}-{job.experience_required?.max_exp} Years</p>
                </div>
                <div className="pb-4 border-b border-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Application Deadline</p>
                  <p className="text-sm font-bold text-slate-700">{job.application_deadline ? new Date(job.application_deadline).toLocaleDateString() : 'N/A'}</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-4">
                  {job.job_description_text || job.responsibilities || 'No additional summary.'}
                </p>
                {job.documents?.job_description_pdf && (
                  <a href={job.documents.job_description_pdf} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                    View PDF <FiExternalLink />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: APPLICANT MANAGEMENT */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Table Controller */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  value={q} 
                  onChange={e => setQ(e.target.value)} 
                  placeholder="Filter pool by name, email, or skill..." 
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-semibold" 
                />
              </div>
              <div className="text-[10px] font-black text-slate-300 uppercase tracking-tighter pr-4 hidden md:block">
                Showing {applicants.length} Listings
              </div>
            </div>

            {/* Applicant Table Container */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="py-5 px-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                      <th className="py-5 px-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">SkillLens Data</th>
                      <th className="py-5 px-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Timeline</th>
                      <th className="py-5 px-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Pipeline</th>
                      <th className="py-5 px-6 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {appLoading ? (
                      <tr><td colSpan={5} className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest animate-pulse">Fetching records...</td></tr>
                    ) : applicants.length === 0 ? (
                      <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold">No applications match your current filters.</td></tr>
                    ) : (
                      applicants.map(a => (
                        <tr key={a._id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="py-5 px-6">
                            <div className="font-bold text-slate-800 leading-none mb-1 group-hover:text-indigo-600 transition-colors">{(a.userId && a.userId.fullName) || (a.user && a.user.fullName) || 'Candidate'}</div>
                            <div className="text-[11px] font-medium text-slate-400 italic">{(a.userId && a.userId.email) || (a.user && a.user.email) || ''}</div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex flex-col gap-2">
                               <div className="flex flex-wrap gap-1">
                                {(a.skills || []).slice(0,3).map((s, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-slate-100 rounded-md text-[9px] font-black uppercase text-slate-500 border border-slate-200/50">{s}</span>
                                ))}
                               </div>
                               <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                    {(a.lastResult && a.lastResult.avg_skill_score) ? `${a.lastResult.avg_skill_score}%` : `${a.quizScore || 0}%`}
                                  </span>
                                  {a.lastResult?.academic_score && <span className="text-[10px] font-bold text-slate-400">A:{a.lastResult.academic_score}%</span>}
                               </div>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="text-xs font-bold text-slate-500">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}</div>
                          </td>
                          <td className="py-5 px-6">
                            <select 
                              value={a.pipelineStage} 
                              onChange={e => changeStage(a._id, e.target.value)} 
                              className={`text-[10px] font-black uppercase border-none rounded-xl px-3 py-1.5 outline-none shadow-sm cursor-pointer transition-all ${
                                a.pipelineStage === 'selected' ? 'bg-emerald-50 text-emerald-600' :
                                a.pipelineStage === 'rejected' ? 'bg-rose-50 text-rose-600' : 
                                'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <option value="applied">applied</option>
                              <option value="shortlisted">shortlisted</option>
                              <option value="interview">interview</option>
                              <option value="selected">selected</option>
                              <option value="rejected">rejected</option>
                            </select>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <a className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm" href={a.resumePath || (a.userId && a.userId.resumePath) || '#'} target="_blank" rel="noreferrer" title="Get CV">
                                <FiDownload />
                              </a>
                              <button onClick={() => setSelectedCandidate({ id: (a.userId && a.userId._id) || (a.user && a.user._id), jobId: id })} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-slate-200">
                                Profile
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination UI */}
              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Showing {applicants.length} / {total} Total
                </div>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => loadApplicants(page - 1)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs hover:bg-slate-50 disabled:opacity-30 transition-all">Prev</button>
                  <button disabled={applicants.length < 20} onClick={() => loadApplicants(page + 1)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs hover:bg-slate-50 disabled:opacity-30 transition-all">Next</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {selectedCandidate && (
          <CandidateProfile userId={selectedCandidate.id} jobId={selectedCandidate.jobId} onClose={() => setSelectedCandidate(null)} />
        )}

      </div>
    </div>
  );
}