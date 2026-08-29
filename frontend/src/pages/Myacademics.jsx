import React, { useEffect, useState } from "react";
import { FiBook, FiPlus, FiTrash2, FiUploadCloud, FiFileText, FiCheckCircle, FiAlertCircle, FiDownload, FiMapPin } from "react-icons/fi";
import {
  getProfile,
  patchProfile,
  uploadEducationResult,
} from "../services/api";

const backendBase = import.meta?.env?.VITE_API_BASE || "http://localhost:5000";

// --- MODERN DESIGN TOKENS ---
const baseInput = "w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 font-medium text-slate-700 placeholder:text-slate-400";
const buttonPrimary = "bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2";
const cardClass = "bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 transition-all hover:shadow-md relative overflow-hidden";

const resolveAsset = (p) => {
  if (!p) return "";
  if (p.startsWith("/uploads") || p.startsWith("uploads")) return backendBase + (p.startsWith("/") ? p : `/${p}`);
  return p;
};

const MyAcademics = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [educationFiles, setEducationFiles] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getProfile();
      const u = res.data?.user || res.data;
      setProfile(u || { education: [] });
    } catch (e) {
      setMessage('Failed to load profile'); setMessageType('error');
    } finally { setLoading(false); }
  };

  const handleFile = (eduIndex, file) => setEducationFiles(prev => ({ ...prev, [eduIndex]: file }));

  const doUpload = async (eduIndex) => {
    const file = educationFiles[eduIndex];
    if (!file) { setMessage('Select a file to upload'); setMessageType('error'); return; }
    try {
      setMessage('Syncing document...'); setMessageType('');
      const res = await uploadEducationResult(file, eduIndex);
      const fp = res?.data?.resultFilePath || res?.data?.filePath || res?.data?.path;
      if (fp) {
        setProfile(prev => ({ ...prev, education: (prev.education||[]).map((ed, i) => i === eduIndex ? { ...ed, resultFilePath: fp } : ed) }));
      }
      setMessage('Document uploaded successfully'); setMessageType('success');
      setEducationFiles(prev => { const n = { ...prev }; delete n[eduIndex]; return n; });
    } catch (err) {
      setMessage('Upload failed'); setMessageType('error');
    }
  };

  const addEducation = () => {
    setProfile(prev => ({ ...prev, education: [...(prev.education||[]), { level: '', institution: '', startYear: '', endYear: '', cgpa: '', semesterWise: [], resultFilePath: '' }] }));
  };

  const removeEducation = (idx) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    setProfile(prev => ({ ...prev, education: (prev.education||[]).filter((_, i) => i !== idx) }));
    setEducationFiles(prev => { const n = { ...prev }; delete n[idx]; return n; });
  };

  const setField = (idx, key, val) => setProfile(prev => ({ ...prev, education: (prev.education||[]).map((ed, i) => i === idx ? { ...ed, [key]: val } : ed) }));

  const validate = () => {
    const errs = {};
    (profile.education || []).forEach((ed, i) => {
      if (!ed.level || String(ed.level).trim() === '') errs[`education.${i}.level`] = 'Required';
      if (!ed.institution || String(ed.institution).trim() === '') errs[`education.${i}.institution`] = 'Required';
      if (!ed.resultFilePath || String(ed.resultFilePath).trim() === '') errs[`education.${i}.resultFilePath`] = 'Transcript missing';
    });
    return errs;
  };

  const saveAll = async () => {
    setErrors({});
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); setMessage('Please fill required fields'); setMessageType('error'); return; }
    try {
      const payload = { education: profile.education };
      const res = await patchProfile(payload);
      const u = res.data?.user || res.data;
      if (u) setProfile(u);
      setMessage('Academic profile synchronized'); setMessageType('success');
      try { window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { __updatedAt: Date.now(), ...(u||{}) } })); } catch(e) {}
    } catch (err) {
      setMessage('Save failed'); setMessageType('error');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-pulse text-indigo-600 font-bold tracking-widest uppercase text-xs">Loading Academics...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="max-w-6xl mx-auto">
        
        {/* --- PAGE HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              My Academics <FiBook className="text-indigo-600" size={32} />
            </h1>
            <p className="text-slate-500 font-medium mt-2">Verified degrees and official academic transcripts.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={addEducation} className="bg-white border border-slate-200 text-slate-700 font-bold px-6 py-3 rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
              <FiPlus /> Add Record
            </button>
            <button onClick={saveAll} className={buttonPrimary}>
              <FiCheckCircle /> Save All
            </button>
          </div>
        </div>

        {/* --- NOTIFICATIONS --- */}
        {message && (
          <div className={`p-4 mb-8 rounded-2xl flex items-center gap-3 border animate-in fade-in slide-in-from-top-2 ${
            messageType === 'error' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
          }`}>
            {messageType === 'error' ? <FiAlertCircle /> : <FiCheckCircle />}
            <span className="text-sm font-bold uppercase tracking-tight">{message}</span>
          </div>
        )}

        {/* --- EDUCATION GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {(profile.education || []).map((ed, i) => (
            <div key={i} className={cardClass}>
              {/* Decorative Accent */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600" />
              
              <div className="flex items-start justify-between mb-8">
                <div className="flex-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg">
                    {ed.level || 'Academic Entry'}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-3 leading-tight truncate pr-4">
                    {ed.institution || 'Institution Name'}
                  </h3>
                </div>
                <button 
                  onClick={() => removeEducation(i)} 
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  title="Remove record"
                >
                  <FiTrash2 size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1.5 ml-1 block">Degree Level</label>
                    <input 
                      className={`${baseInput} ${errors[`education.${i}.level`] ? 'border-rose-300' : ''}`}
                      placeholder="e.g. Bachelor of Engineering" 
                      value={ed.level || ''} 
                      onChange={e => setField(i, 'level', e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1.5 ml-1 block">Institution</label>
                    <input 
                      className={`${baseInput} ${errors[`education.${i}.institution`] ? 'border-rose-300' : ''}`}
                      placeholder="e.g. University Name" 
                      value={ed.institution || ''} 
                      onChange={e => setField(i, 'institution', e.target.value)} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1.5 ml-1 block">Start Year</label>
                    <input className={baseInput} placeholder="2020" value={ed.startYear || ''} onChange={e => setField(i, 'startYear', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1.5 ml-1 block">End Year</label>
                    <input className={baseInput} placeholder="2024" value={ed.endYear || ''} onChange={e => setField(i, 'endYear', e.target.value)} />
                  </div>
                </div>

                {/* --- TRANSCRIPT SECTION --- */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-4 block underline decoration-indigo-200 underline-offset-4">Transcript & Certification</label>
                  
                  <div className={`p-6 rounded-2xl border-2 border-dashed transition-all ${
                    ed.resultFilePath ? 'bg-emerald-50/50 border-emerald-200' : 
                    errors[`education.${i}.resultFilePath`] ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex flex-col items-center gap-3 text-center">
                      {ed.resultFilePath ? (
                        <FiCheckCircle className="text-emerald-500" size={28} />
                      ) : (
                        <FiUploadCloud className="text-slate-300" size={28} />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate max-w-[200px]">
                          {educationFiles[i]?.name || (ed.resultFilePath ? ed.resultFilePath.split('/').pop() : 'No transcript detected')}
                        </p>
                        {errors[`education.${i}.resultFilePath`] && (
                          <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase">Transcript Required</p>
                        )}
                      </div>

                      <div className="flex flex-wrap justify-center gap-2 mt-2">
                        <label className="cursor-pointer bg-white border border-slate-200 px-4 py-2 rounded-xl text-[11px] font-black uppercase text-slate-600 hover:border-indigo-400 transition-all">
                          Select File
                          <input type="file" accept=".pdf,image/*" className="hidden" onChange={e => handleFile(i, e.target.files?.[0] || null)} />
                        </label>
                        <button 
                          onClick={() => doUpload(i)} 
                          className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[11px] font-black uppercase shadow-md active:scale-95 transition-all"
                        >
                          Upload
                        </button>
                        {ed.resultFilePath && (
                          <a 
                            href={resolveAsset(ed.resultFilePath)} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-[11px] font-black uppercase hover:bg-indigo-200"
                          >
                            <FiDownload className="inline mr-1" /> View
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* --- EMPTY STATE --- */}
          {(profile.education || []).length === 0 && (
            <div className="lg:col-span-2 py-20 text-center border-4 border-dashed border-slate-200 rounded-[3rem] bg-white">
              <FiBook className="mx-auto text-slate-200 mb-4" size={64} />
              <h3 className="text-slate-400 font-black uppercase tracking-widest">No Academic Records</h3>
              <p className="text-slate-300 font-medium text-sm mt-2">Click "+ Add Education" to build your profile.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAcademics;