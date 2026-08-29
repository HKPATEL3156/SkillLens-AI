import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyListJobs, companyDeleteJob, companyGetApplicants, companyUpdateApplicationStatus } from '../services/api';
import CandidateProfile from '../components/CandidateProfile';
import { FiPlus, FiEdit2, FiUsers, FiTrash2, FiMapPin, FiSearch, FiX } from 'react-icons/fi';

const CompanyJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const [showApplicantsFor, setShowApplicantsFor] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const fetch = async (p = 1) => {
    setLoading(true);
    try {
      const res = await companyListJobs({ page: p, limit: 20 });
      const data = res.data || {};
      const jobsArr = data.jobs || (Array.isArray(data) ? data : []);
      setJobs(jobsArr);
      setTotal(data.total || jobsArr.length);
      setPage(data.page || p);
    } catch (err) { console.error(err); alert('Failed to load jobs'); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const startCreate = () => { navigate('/company/jobs/new'); };
  const startEdit = (job) => { navigate(`/company/jobs/${job._id}/edit`); };

  const renderLocation = (loc) => {
    if (!loc) return 'Remote';
    if (typeof loc === 'string') return loc;
    const parts = [];
    if (loc.city) parts.push(loc.city);
    if (loc.state) parts.push(loc.state);
    return parts.length > 0 ? parts.join(', ') : 'Remote';
  };

  const remove = async (id) => { 
    if (!confirm('Are you sure you want to delete this job listing?')) return; 
    try { await companyDeleteJob(id); fetch(page); } catch (e) { alert('Delete failed') } 
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Active Listings</h2>
          <p className="text-slate-500 font-medium">Manage your job postings and track applicant progress.</p>
        </div>
        <button 
          onClick={startCreate} 
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <FiPlus /> New Job
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20 animate-pulse text-slate-400">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="font-bold uppercase tracking-widest text-xs">Syncing Jobs...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {jobs.length === 0 ? (
            <div className="py-20 text-center">
              <FiUsers size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-500 font-bold">No jobs listed yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="p-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Job Title</th>
                    <th className="p-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                    <th className="p-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {jobs.map(j => (
                    <tr key={j._id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="p-5 font-bold text-slate-700">{j.title}</td>
                      <td className="p-5">
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium italic">
                          <FiMapPin className="text-indigo-400" /> {renderLocation(j.location)}
                        </div>
                      </td>
                      <td className="p-5 text-right flex items-center justify-end gap-2">
                        <button onClick={() => startEdit(j)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Edit Job">
                          <FiEdit2 size={18} />
                        </button>
                        <button onClick={() => navigate(`/company/jobs/${j._id}/recruit`)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition-all">
                          <FiUsers size={16} /> Applicants
                        </button>
                        <button onClick={() => remove(j._id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Delete Job">
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="p-5 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{total} Total Jobs</div>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => fetch(page - 1)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all">Prev</button>
              <button disabled={jobs.length < 20} onClick={() => fetch(page + 1)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all">Next</button>
            </div>
          </div>
        </div>
      )}

      {showApplicantsFor && (
        <ApplicantsModal job={showApplicantsFor} onClose={() => { setShowApplicantsFor(null); fetch(page); }} setSelectedCandidate={setSelectedCandidate} />
      )}
      {selectedCandidate && (
        <CandidateProfile userId={selectedCandidate.id} jobId={selectedCandidate.jobId} onClose={() => setSelectedCandidate(null)} />
      )}
    </div>
  );
}

export default CompanyJobs;

function ApplicantsModal({ job, onClose, setSelectedCandidate }) {
  const [loading, setLoading] = useState(true);
  const [applicants, setApplicants] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await companyGetApplicants(job._id, { page: p, limit: 10, q });
      setApplicants(res.data.applicants || []);
      setTotal(res.data.total || 0);
      setPage(res.data.page || p);
    } catch (err) { console.error(err); alert('Failed to load applicants'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [job._id, q]);

  const changeStatus = async (appId, stage) => {
    try {
      await companyUpdateApplicationStatus(appId, { pipelineStage: stage });
      load(page);
    } catch (e) { alert('Failed to update'); }
  };

  const stageColors = {
    applied: "bg-blue-50 text-blue-600",
    shortlisted: "bg-amber-50 text-amber-600",
    interview: "bg-purple-50 text-purple-600",
    selected: "bg-emerald-50 text-emerald-600",
    rejected: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-10">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="relative bg-white rounded-[2rem] shadow-2xl max-w-5xl w-full flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300 overflow-hidden">
        
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Applicants for {job.title}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase mt-0.5 tracking-widest">{total} Total Candidates</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 bg-slate-50/50">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              className="w-full bg-white border border-slate-200 pl-12 pr-4 py-3 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium text-sm" 
              placeholder="Filter by name or email address..." 
              value={q} 
              onChange={e => setQ(e.target.value)} 
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 pt-0">
          {loading ? (
            <div className="py-20 text-center animate-pulse font-black text-slate-300 uppercase tracking-widest text-xs">Loading Pipeline...</div>
          ) : (
            <div className="overflow-x-auto">
              {applicants.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-bold">No candidates found matching your criteria.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="pb-4 px-2">Candidate</th>
                      <th className="pb-4 px-2">Top Skills</th>
                      <th className="pb-4 px-2">AI Score</th>
                      <th className="pb-4 px-2">Status</th>
                      <th className="pb-4 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applicants.map(a => (
                      <tr key={a._id} className="hover:bg-slate-50/50 group transition-colors">
                        <td className="py-4 px-2">
                          <div className="font-bold text-slate-800">{(a.userId && a.userId.fullName) || (a.user && a.user.fullName) || 'Candidate'}</div>
                          <div className="text-[11px] font-medium text-slate-500">{(a.userId && a.userId.email) || (a.user && a.user.email)}</div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex flex-wrap gap-1">
                            {(a.skills || []).slice(0, 3).map((s, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase tracking-tighter">{s}</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{a.quizScore || 0}%</span>
                        </td>
                        <td className="py-4 px-2">
                          <select 
                            value={a.pipelineStage} 
                            onChange={e => changeStatus(a._id, e.target.value)} 
                            className={`text-xs font-black uppercase border-none rounded-lg px-2 py-1 outline-none cursor-pointer tracking-tighter ${stageColors[a.pipelineStage] || "bg-slate-100"}`}
                          >
                            <option value="applied">applied</option>
                            <option value="shortlisted">shortlisted</option>
                            <option value="interview">interview</option>
                            <option value="selected">selected</option>
                            <option value="rejected">rejected</option>
                          </select>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <button 
                            onClick={() => setSelectedCandidate({ id: (a.userId && a.userId._id) || (a.user && a.user._id), jobId: job._id })} 
                            className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-indigo-600 transition-all active:scale-95 shadow-sm"
                          >
                            Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {page} of {Math.ceil(total / 10) || 1}</div>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => load(page - 1)} className="px-3 py-1 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all">Prev</button>
            <button disabled={applicants.length < 10} onClick={() => load(page + 1)} className="px-3 py-1 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}