import React, { useEffect, useState } from 'react';
import { companyGetCandidate, companyUpdateApplicationStatus } from '../services/api';
import { FiX, FiUser, FiMail, FiMapPin, FiBriefcase, FiDownload, FiAward, FiFileText, FiTrendingUp } from 'react-icons/fi';

export default function CandidateProfile({ userId, jobId, onClose }){
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await companyGetCandidate(userId, jobId);
      setData(res.data || null);
    } catch (e) {
      console.error(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchData();
  }, [userId, jobId]);

  const toUrl = (p) => {
    if (!p) return null;
    return String(p).replace(/\\\\/g, '/').replace(/\\/g, '/');
  };

  const percentFor = (q) => {
    if (!q) return 0;
    if (typeof q.percent === 'number') return Math.round(q.percent);
    if (typeof q.obtainedMarks === 'number' && typeof q.totalMarks === 'number' && q.totalMarks > 0)
      return Math.round((q.obtainedMarks / q.totalMarks) * 100);
    if (typeof q.obtainedMarks === 'number') return Math.round(q.obtainedMarks);
    return 0;
  };

  const getAppScore = (app) => {
    if (!app) return { value: null, source: null };
    if (typeof app.computedScore === 'number' && app.computedScore > 0) return { value: Math.round(app.computedScore), source: 'computed' };
    if (typeof app.quizScore === 'number' && app.quizScore > 0) return { value: Math.round(app.quizScore), source: 'application' };
    if (data && typeof data.bestQuizPercent === 'number' && data.bestQuizPercent > 0) return { value: Math.round(data.bestQuizPercent), source: 'best_attempt' };
    return { value: null, source: null };
  };

  const updateApplication = async (appId, payload) => {
    if (!appId) return;
    if (!confirm('Update application status?')) return;
    setUpdating(true);
    try {
      await companyUpdateApplicationStatus(appId, payload);
      await fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to update application');
    } finally {
      setUpdating(false);
    }
  };

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-6xl w-full h-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header Section */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
               <FiUser size={24} />
             </div>
             <div>
               <h3 className="text-xl font-black text-slate-800 tracking-tight">Candidate Profile</h3>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Talent Verification</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all hover:bg-rose-50">
            <FiX size={20} />
          </button>
        </div>

        {/* Content Area - SCROLLABLE */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#FBFDFF]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 animate-pulse py-20">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-bold uppercase tracking-widest text-xs">Syncing Talent Data...</p>
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 lg:grid-cols-12">
              
              {/* LEFT SIDEBAR - FIXED-ISH INFO */}
              <div className="lg:col-span-4 p-8 border-r border-slate-100 lg:sticky lg:top-0 h-fit bg-white">
                <div className="text-center md:text-left">
                  <h1 className="text-3xl font-black text-slate-900 leading-none">{data.user?.fullName || '—'}</h1>
                  <p className="flex items-center justify-center md:justify-start gap-2 text-indigo-600 font-bold mt-2 text-sm">
                    <FiMail size={14}/> {data.user?.email}
                  </p>
                </div>

                <div className="mt-8 space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5"><FiBriefcase /> Key Details</div>
                    <div className="space-y-3">
                       <div>
                         <span className="text-xs text-slate-500 block">Experience Level</span>
                         <span className="text-sm font-bold text-slate-800">{data.user?.experienceLevel || 'Entry Level'}</span>
                       </div>
                       <div>
                         <span className="text-xs text-slate-500 block">Primary Location</span>
                         <span className="text-sm font-bold text-slate-800 flex items-center gap-1"><FiMapPin className="text-indigo-400"/> {data.user?.primaryLocation || '—'}</span>
                       </div>
                    </div>
                  </div>

                  {/* Career Scores Badges */}
                  {(() => {
                    const last = (data.career?.careerResults?.length) ? data.career.careerResults[data.career.careerResults.length - 1] : null;
                    const acad = last?.academic_score ?? data.career?.academic_score;
                    const avg = last?.avg_skill_score ?? data.career?.avg_skill_score;
                    if (acad !== undefined || avg !== undefined) {
                      return (
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
                            <span className="text-[9px] font-black text-emerald-600 uppercase block mb-1">Academic</span>
                            <span className="text-2xl font-black text-emerald-700">{acad ?? 0}%</span>
                          </div>
                          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-center">
                            <span className="text-[9px] font-black text-indigo-600 uppercase block mb-1">Avg Skill</span>
                            <span className="text-2xl font-black text-indigo-700">{avg ?? 0}%</span>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* Qualified Skills */}
                <div className="mt-8">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <FiAward className="text-amber-500" /> Endorsed Skills
                   </h4>
                   {data.career?.qualifiedSkills?.length ? (
                     <div className="flex flex-wrap gap-2">
                       {data.career.qualifiedSkills.map(qs => (
                         <div key={qs.skill} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                           <span className="text-xs font-bold text-slate-700">{qs.skill}</span>
                           <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 rounded-lg">{qs.bestScore}%</span>
                         </div>
                       ))}
                     </div>
                   ) : <p className="text-xs italic text-slate-400">Assessment required.</p>}
                </div>
              </div>

              {/* RIGHT CONTENT - SCROLLING AREA */}
              <div className="lg:col-span-8 p-8">
                
                {/* MATCHING SCORE IF PRESENT */}
                {typeof data.matchingScore === 'number' && (
                  <div className="mb-8 p-6 bg-gradient-to-r from-slate-900 to-indigo-900 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                    <FiTrendingUp className="absolute right-[-10px] bottom-[-10px] text-white/5 w-32 h-32 group-hover:scale-110 transition-transform" />
                    <div className="relative z-10">
                      <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">SkillLens AI Matching</p>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="text-5xl font-black">{data.matchingScore}%</div>
                        <div className="text-sm font-medium text-slate-400 max-w-[200px]">Compatibility with the current job requirements.</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* RESUME SECTION */}
                <section className="mb-10">
                   <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                      <h4 className="font-black text-slate-800 flex items-center gap-2 uppercase text-xs tracking-tighter italic">📄 Documentation</h4>
                      { (data.career?.resumeUrl || data.user?.resumeFilePath) && (
                        <a 
                          className="flex items-center gap-2 text-[11px] font-black uppercase text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                          href={data.career?.resumeUrl || toUrl(data.user?.resumeFilePath)} 
                          target="_blank" rel="noreferrer"
                        >
                          <FiDownload /> Access Resume
                        </a>
                      )}
                   </div>
                   {!data.career?.resumeUrl && !data.user?.resumeFilePath && <p className="text-sm text-slate-400">Candidate has not uploaded a resume.</p>}
                </section>

                {/* APPLICATIONS GRID */}
                <section className="mb-10">
                   <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2 uppercase text-xs tracking-tighter italic">🚀 Pipeline Management</h4>
                   <div className="grid gap-4">
                     { (data.applications || []).length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 font-bold">No active applications</div>
                     ) : (
                       (data.applications || []).map(app => {
                         const score = getAppScore(app);
                         return (
                           <div key={app._id} className="group bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                             <div>
                               <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                               <div className="flex items-center gap-3">
                                 <span className="text-sm font-bold text-slate-800">Recruitment Score</span>
                                 <span className="px-3 py-1 bg-slate-900 text-white text-xs font-black rounded-lg">{score.value !== null ? `${score.value}%` : 'N/A'}</span>
                                 <span className="text-[10px] font-bold text-slate-400 italic capitalize">{score.source?.replace('_',' ')}</span>
                               </div>
                             </div>
                             
                             <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0">
                               <div className="flex flex-col items-end">
                                 <select 
                                   value={app.pipelineStage || 'applied'} 
                                   onChange={e => updateApplication(app._id, { pipelineStage: e.target.value })} 
                                   className="bg-slate-50 border-none px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-tighter text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                                 >
                                   <option value="applied">Applied</option>
                                   <option value="shortlisted">Shortlisted</option>
                                   <option value="interview">In Interview</option>
                                   <option value="selected">Selected</option>
                                   <option value="rejected">Rejected</option>
                                 </select>
                                 <span className="text-[9px] font-bold text-emerald-500 mt-1 uppercase mr-2">{app.status}</span>
                               </div>
                             </div>
                           </div>
                         );
                       })
                     )}
                   </div>
                </section>

                {/* QUIZ ATTEMPTS */}
                <section className="mb-10">
                   <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2 uppercase text-xs tracking-tighter italic">🏆 Qualified Assessments</h4>
                   <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {((data.quizAttempts || []).filter(a => a.qualified || percentFor(a) >= 70)).length === 0 ? (
                        <p className="text-sm italic text-slate-400">No qualified quiz records.</p>
                      ) : (
                        (data.quizAttempts || []).filter(a => a.qualified || percentFor(a) >= 70).map(q => (
                          <div key={q._id} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
                            <div className="flex items-start justify-between">
                               <div>
                                 <div className="font-black text-slate-800 tracking-tight">{q.quizName || 'Technical Quiz'}</div>
                                 <p className="text-xs text-slate-400 font-medium mt-1 uppercase">{q.submittedAt ? new Date(q.submittedAt).toLocaleString() : 'Recent'}</p>
                                 <div className="mt-3 flex flex-wrap gap-1.5">
                                   {(q.skills || []).map((sk, i) => (
                                     <span key={i} className="px-2 py-0.5 rounded-lg bg-slate-50 text-[10px] font-bold text-slate-600 uppercase border border-slate-100">{sk}</span>
                                   ))}
                                 </div>
                               </div>
                               <div className="text-right">
                                  <div className="text-2xl font-black text-indigo-600">{percentFor(q)}%</div>
                                  <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Verified</div>
                               </div>
                            </div>
                          </div>
                        ))
                      )}
                   </div>
                </section>

                {/* EDUCATION SECTION */}
                <section className="pb-10">
                   <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2 uppercase text-xs tracking-tighter italic">🎓 Educational History</h4>
                   <div className="space-y-4">
                     {(data.user?.education || data.career?.education || []).map((ed, idx) => (
                       <div key={idx} className="flex gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                          <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
                            <FiFileText className="text-slate-400" />
                          </div>
                          <div>
                             <h5 className="font-black text-slate-800 tracking-tight leading-none">{ed.level || ed.degree || 'Degree'}</h5>
                             <p className="text-xs font-bold text-slate-500 mt-1">{ed.institution || ed.fieldOfStudy} {ed.cgpa ? ` • CGPA ${ed.cgpa}` : ''}</p>
                             {ed.resultFilePath && (
                               <a className="inline-block text-[11px] font-black text-indigo-600 uppercase mt-2 hover:underline" href={toUrl(ed.resultFilePath)} target="_blank" rel="noreferrer">
                                 View Transcripts
                               </a>
                             )}
                          </div>
                       </div>
                     ))}
                   </div>
                </section>

              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">No Profile Found</div>
          )}
        </div>
      </div>
    </div>
  );
}