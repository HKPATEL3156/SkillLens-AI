import React, { useEffect, useState } from 'react';
import { adminListJobs, adminGetJob, adminDeleteJob, adminUpdateJob } from '../services/api';
import { FiSearch, FiRefreshCw, FiDownload, FiBriefcase, FiTrash2, FiMapPin, FiExternalLink, FiCopy, FiCode, FiX, FiStar } from 'react-icons/fi';
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";

const AdminJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetch = async (p = 1, query = '') => {
    setLoading(true);
    try {
      const res = await adminListJobs({ page: p, limit: 20, q: query });
      setJobs(res.data.jobs || []);
      setTotal(res.data.total || 0);
      setPage(res.data.page || p);
    } catch (err) { console.error(err); alert('Failed to load jobs'); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  useEffect(() => {
    const t = setTimeout(() => { fetch(1, q); }, 450);
    return () => clearTimeout(t);
  }, [q]);

  const resolveAsset = (p) => {
    if (!p) return null;
    if (p.startsWith('http') || p.startsWith('//')) return p;
    const base = import.meta.env.VITE_API_BASE || '';
    if (p.startsWith('/')) return `${base}${p}`;
    return `${base}/${p}`;
  };

  const exportCSV = (rows) => {
    if (!rows || rows.length === 0) { alert('No jobs to export'); return; }
    const cols = ['_id', 'title', 'company', 'location', 'status', 'createdAt'];
    const csv = [cols.join(',')].concat(
      rows.map(r => cols.map(c => {
        let v = '';
        if (c === 'company') v = r.company?.company_name || r.companyName || '';
        else if (c === 'location') {
          if (typeof r.location === 'string') v = r.location;
          else if (r.location) v = [r.location.address, r.location.city, r.location.state, r.location.country].filter(Boolean).join(', ');
        } else v = r[c] === undefined || r[c] === null ? '' : String(r[c]);
        return '"' + v.replace(/"/g, '""') + '"';
      }).join(','))
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobs_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = (obj, name = 'jobs.json') => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSelected = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const payload = { status: selected.status };
      if (selected.featured !== undefined) payload.featured = selected.featured;
      await adminUpdateJob(selected._id, payload);
      alert('Changes synchronized successfully');
      fetch(page, q);
      const res = await adminGetJob(selected._id);
      setSelected(res.data.job);
    } catch (err) { alert('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => { 
    if (!window.confirm('Are you sure you want to permanently remove this job listing?')) return; 
    try { await adminDeleteJob(id); fetch(page, q); alert('Job deleted'); } catch (e) { alert('Delete failed'); } 
  };

  const viewJob = async (id) => {
    try {
      const res = await adminGetJob(id);
      setSelected(res.data.job);
    } catch (err) { alert('Unable to load job'); }
  };

  const handleSearch = (e) => { e?.preventDefault(); fetch(1, q); };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      {/* COMMAND HEADER */}
      <div className="flex flex-col lg:flex-row items-center justify-between mb-8 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <FiBriefcase className="text-indigo-600" /> Market Listings
          </h2>
          <p className="text-slate-500 font-medium">Moderate global job posts and verified company openings.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <form onSubmit={handleSearch} className="relative flex-1 lg:flex-none">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              placeholder="Search title, role..." 
              value={q} 
              onChange={e => setQ(e.target.value)} 
              className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all w-full lg:w-64 bg-white" 
            />
          </form>
          
          <button onClick={() => fetch(1, q)} className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-indigo-600 transition-all shadow-sm">
            <FiRefreshCw />
          </button>
          
          <button onClick={() => exportCSV(jobs)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-50 transition-all">
            <FiDownload /> CSV
          </button>
          
          <button onClick={() => downloadJSON(jobs)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-black transition-all shadow-lg shadow-slate-200">
            <FiCode /> JSON
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      {loading ? (
        <div className="py-20 text-center animate-pulse font-black text-slate-300 uppercase tracking-widest text-xs">Syncing Active Listings...</div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="py-5 px-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Opening Title</th>
                  <th className="py-5 px-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Company Identity</th>
                  <th className="py-5 px-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                  <th className="py-5 px-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Posted On</th>
                  <th className="py-5 px-6 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {jobs.length === 0 && (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold">No active job listings found.</td></tr>
                )}
                {jobs.map(j => (
                  <tr key={j._id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="py-5 px-6">
                      <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">{j.title}</div>
                      {j.featured && <span className="text-[9px] font-black text-amber-500 uppercase flex items-center gap-1 mt-1"><FiStar fill="currentColor" /> Featured</span>}
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                           {j.company && (j.company.documents?.logo || j.company.logo) ? (
                             <img src={resolveAsset(j.company.documents?.logo || j.company.logo)} alt="logo" className="w-full h-full object-contain" />
                           ) : <HiOutlineBuildingOffice2 className="text-slate-300" />}
                        </div>
                        <span className="font-medium text-slate-600">{j.company?.company_name || j.companyName || '—'}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6 text-slate-500 text-xs font-medium italic">
                      {typeof j.location === 'string' ? j.location : j.location ? [j.location.city, j.location.state].filter(Boolean).join(', ') : 'Global'}
                    </td>
                    <td className="py-5 px-6 text-slate-400 text-xs font-bold uppercase tracking-tighter">
                      {j.createdAt ? new Date(j.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => viewJob(j._id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="View Dossier">
                          <FiExternalLink size={18} />
                        </button>
                        <button onClick={() => handleDelete(j._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Purge Record">
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="p-6 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{total} Active Openings</div>
            <div className="flex gap-4 items-center">
              <button disabled={page <= 1} onClick={() => fetch(page - 1, q)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 shadow-sm transition-all">Prev</button>
              <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">Page {page} / {Math.max(1, Math.ceil(total / 20))}</span>
              <button disabled={jobs.length < 20} onClick={() => fetch(page + 1, q)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 shadow-sm transition-all">Next</button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL DRAWER */}
      {selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelected(null)}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl flex flex-col h-full max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 border-4 border-white shadow-sm">
                   <FiBriefcase size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-2">{selected.title}</h3>
                  <div className="flex items-center gap-4 text-sm font-bold text-slate-400 uppercase tracking-widest">
                    <span className="text-indigo-600">{selected.company?.company_name || 'Anonymous Org'}</span>
                    <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                    <span className="flex items-center gap-1"><FiMapPin /> {selected.location?.city || 'Remote'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                 <button onClick={() => { navigator.clipboard?.writeText(selected._id || ''); alert('Job ID Copied'); }} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all" title="Copy System ID">
                   <FiCopy />
                 </button>
                 <button onClick={() => downloadJSON(selected, `job_${selected._id}.json`)} className="p-3 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-2xl transition-all" title="Download Schema">
                   <FiCode />
                 </button>
                 <button onClick={() => setSelected(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all">
                   <FiX size={20} />
                 </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-10 bg-[#FBFDFF] custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-8">
                  <section>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Official Description</h4>
                    <div className="bg-indigo-600/5 p-8 rounded-[2rem] border border-indigo-100 text-slate-700 leading-relaxed italic whitespace-pre-wrap">
                       {selected.description || 'No job description text provided.'}
                    </div>
                  </section>

                  <section className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Registration Log</p>
                       <p className="text-sm font-bold text-slate-700">{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Last Synchronized</p>
                       <p className="text-sm font-bold text-slate-700">{selected.updatedAt ? new Date(selected.updatedAt).toLocaleString() : 'Just now'}</p>
                    </div>
                  </section>
                </div>

                <div className="lg:col-span-4 space-y-6">
                  {/* Admin Controls Panel */}
                  <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                     <FiStar className="absolute right-[-10px] bottom-[-10px] text-white/5 w-24 h-24" />
                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6 relative z-10">Moderation Panel</p>
                     
                     <div className="space-y-6 relative z-10">
                       <div className="flex flex-col gap-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter ml-1">Lifecycle Status</label>
                          <select 
                            value={selected.status || 'open'} 
                            onChange={e => setSelected(s => ({...s, status: e.target.value}))} 
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          >
                            <option value="open">Open (Public)</option>
                            <option value="closed">Closed (Archive)</option>
                            <option value="draft">Draft (Private)</option>
                          </select>
                       </div>

                       <div className="flex flex-col gap-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter ml-1">Market Placement</label>
                          <select 
                            value={selected.featured ? 'yes' : 'no'} 
                            onChange={e => setSelected(s => ({...s, featured: e.target.value === 'yes'}))} 
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          >
                            <option value="yes">Promoted Listing</option>
                            <option value="no">Standard Listing</option>
                          </select>
                       </div>

                       <button 
                         disabled={saving} 
                         onClick={handleSaveSelected} 
                         className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                       >
                         {saving ? 'SYNCHRONIZING...' : 'COMMIT CHANGES'}
                       </button>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-10 py-6 border-t border-slate-100 bg-white flex items-center justify-between sticky bottom-0 z-10">
               <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Internal Hash: {selected._id}</div>
               <button onClick={() => setSelected(null)} className="px-8 py-3 bg-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                 Terminate View
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJobs;