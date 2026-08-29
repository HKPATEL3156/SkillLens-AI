import React, { useEffect, useState } from 'react';
import { FiDownload, FiExternalLink, FiCheck, FiX, FiRefreshCw, FiFileText, FiGlobe, FiMail, FiShield, FiMoreHorizontal } from 'react-icons/fi';
import { adminListCompanies, adminApproveCompany, adminRejectCompany, adminGetCompany } from '../services/api';

const AdminApprovals = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [savingIds, setSavingIds] = useState({});

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await adminListCompanies({ status: 'pending', page: 1, limit: 100 });
      setPending(res.data.companies || []);
    } catch (err) { console.error(err); alert('Failed to load approvals'); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const setSaving = (id, v) => setSavingIds(s => ({ ...s, [id]: v }));

  const confirmAndApprove = async (id) => {
    if (!window.confirm('Approve this company?')) return;
    try {
      setSaving(id, true);
      await adminApproveCompany(id);
      await fetch();
      if (selected?._id === id) setSelected(null);
    } catch (e) { console.error(e); alert('Approve failed'); }
    finally { setSaving(id, false); }
  };

  const confirmAndReject = async (id) => {
    if (!window.confirm('Reject this company?')) return;
    try {
      setSaving(id, true);
      await adminRejectCompany(id);
      await fetch();
      if (selected?._id === id) setSelected(null);
    } catch (e) { console.error(e); alert('Reject failed'); }
    finally { setSaving(id, false); }
  };

  const view = async (id) => {
    try {
      const res = await adminGetCompany(id);
      setSelected(res.data.company);
    } catch (err) { console.error(err); alert('Unable to load company'); }
  };

  const resolveAsset = (p) => {
    if (!p) return null;
    if (p.startsWith('http') || p.startsWith('//')) return p;
    const base = import.meta.env.VITE_API_BASE || '';
    if (p.startsWith('/')) return `${base}${p}`;
    return `${base}/${p}`;
  };

  const exportCSV = (rows) => {
    if (!rows || rows.length === 0) { alert('No items to export'); return; }
    const cols = ['_id', 'company_name', 'company_email', 'username', 'createdAt'];
    const csv = [cols.join(',')].concat(
      rows.map(r => cols.map(c => {
        const v = (r[c] === undefined || r[c] === null) ? '' : String(r[c]);
        return '"' + v.replace(/"/g, '""') + '"';
      }).join(','))
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `approvals_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const downloadJSON = (obj, name = 'approvals.json') => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      {/* COMMAND HEADER */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <FiShield className="text-indigo-600" /> Approval Pipeline
          </h2>
          <p className="text-slate-500 font-medium">Verify credentials and grant corporate access.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button onClick={() => fetch()} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all shadow-sm" title="Refresh">
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => exportCSV(pending)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all">
            <FiDownload /> CSV
          </button>
          <button onClick={() => downloadJSON(pending)} className="flex-1 md:flex-none px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all shadow-lg shadow-slate-200">
            JSON
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse font-black text-slate-300 uppercase tracking-widest text-xs">Syncing Pending Requests...</div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {pending.length === 0 ? (
            <div className="py-20 text-center">
               <FiCheck className="mx-auto text-emerald-500 text-5xl mb-4" />
               <p className="text-slate-500 font-bold">Queue Clear. No pending approvals found.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {pending.map(c => (
                <li key={c._id} className="p-6 flex flex-col lg:flex-row items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors group">
                  <div className="flex items-center gap-5 w-full lg:w-auto">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 font-black text-xl shadow-sm group-hover:rotate-3 transition-transform">
                      {(c.company_name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-lg leading-none mb-1">{c.company_name}</div>
                      <div className="text-sm font-medium text-slate-400 flex items-center gap-1.5 lowercase">
                        <FiMail className="text-indigo-400" /> {c.company_email}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                    <button 
                      onClick={() => view(c._id)} 
                      className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all"
                    >
                      <FiExternalLink /> Dossier
                    </button>
                    <button 
                      disabled={!!savingIds[c._id]} 
                      onClick={() => confirmAndApprove(c._id)} 
                      className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95 disabled:opacity-50"
                    >
                      {savingIds[c._id] ? '...' : <><FiCheck /> Approve</>}
                    </button>
                    <button 
                      disabled={!!savingIds[c._id]} 
                      onClick={() => confirmAndReject(c._id)} 
                      className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-bold text-xs hover:bg-rose-100 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <FiX /> Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* VERIFICATION DOSSIER MODAL */}
      {selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setSelected(null)}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl flex flex-col h-full max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-2xl shadow-sm">
                   {(selected.company_name || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-2">{selected.company_name}</h3>
                  <div className="flex items-center gap-4 text-sm font-bold text-slate-400">
                    <span className="text-indigo-600 lowercase">{selected.company_email}</span>
                    {selected.website && (
                      <a href={selected.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-indigo-600 transition-colors"><FiGlobe /> Website</a>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                 <button onClick={() => downloadJSON(selected, `company_${selected._id}.json`)} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all" title="Export Schema">
                   <FiDownload />
                 </button>
                 <button onClick={() => setSelected(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all">
                   <FiX size={20} />
                 </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-10 bg-[#FBFDFF] custom-scrollbar">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                 
                 {/* Sidebar Meta */}
                 <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Corporate Identity</p>
                       <div className="space-y-4">
                          <div className="space-y-1">
                             <label className="text-[9px] font-bold text-slate-400 uppercase">Username</label>
                             <div className="text-sm font-bold text-slate-700">{selected.username || '—'}</div>
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] font-bold text-slate-400 uppercase">Request Date</label>
                             <div className="text-sm font-bold text-slate-700">{selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : 'N/A'}</div>
                          </div>
                       </div>
                    </div>
                    
                    {/* Sticky Action Card */}
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                       <FiShield className="absolute right-[-10px] bottom-[-10px] text-white/5 w-24 h-24" />
                       <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-6 relative z-10">Decision Terminal</h4>
                       <div className="space-y-3 relative z-10">
                          <button onClick={() => confirmAndApprove(selected._id)} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-emerald-500/20">
                            Authorize Access
                          </button>
                          <button onClick={() => confirmAndReject(selected._id)} className="w-full py-4 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">
                            Deny Request
                          </button>
                       </div>
                    </div>
                 </div>

                 {/* Verification Documents */}
                 <div className="lg:col-span-8 space-y-10">
                    <section>
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Organization Summary</h4>
                       <p className="bg-indigo-600/5 p-6 rounded-3xl border border-indigo-100 italic text-indigo-900 text-lg font-medium leading-relaxed line-clamp-4">
                         "{selected.description || 'No organization biography has been provided.'}"
                       </p>
                    </section>

                    <section>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Credential Evidence</h4>
                      <div className="grid gap-8">
                        {selected.documents && Object.keys(selected.documents).length > 0 ? (
                          Object.entries(selected.documents).map(([k, v]) => {
                            const href = resolveAsset(typeof v === 'string' ? v : (v?.path || ''));
                            const ext = (href?.split('.').pop() || '').toLowerCase();
                            return (
                              <div key={k} className="group">
                                 <div className="flex items-center justify-between mb-3 px-2">
                                    <span className="text-xs font-black text-slate-700 uppercase tracking-tighter flex items-center gap-2"><FiFileText className="text-indigo-500" /> {k.replace(/_/g, ' ')}</span>
                                    <div className="flex gap-4">
                                      <a className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1 hover:underline" href={href} target="_blank" rel="noreferrer"><FiExternalLink /> Expand</a>
                                      <a className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 hover:text-indigo-600 transition-colors" href={href} download><FiDownload /> Grab</a>
                                    </div>
                                 </div>
                                 <div className="bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[2.5rem] p-3 overflow-hidden shadow-inner">
                                    {ext === 'pdf' ? (
                                      <div className="h-[450px] w-full rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                                         <iframe title={k} src={href} className="w-full h-full" />
                                      </div>
                                    ) : ext.match(/png|jpg|jpeg|gif/) ? (
                                      <div className="flex justify-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                                         <img src={href} alt={k} className="max-h-[350px] object-contain rounded-xl" />
                                      </div>
                                    ) : (
                                      <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 italic font-bold text-slate-300">
                                         Attachment Format: {ext.toUpperCase()} (Manual Download Required)
                                      </div>
                                    )}
                                 </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                             <FiShield className="mx-auto text-slate-200 text-5xl mb-4" />
                             <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No verification evidence archived.</p>
                          </div>
                        )}
                      </div>
                    </section>
                 </div>
               </div>
            </div>

            {/* Sticky Footer */}
            <div className="px-10 py-6 border-t border-slate-100 bg-white flex items-center justify-between sticky bottom-0 z-20">
               <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">System Trace ID: {selected._id}</div>
               <button onClick={() => setSelected(null)} className="px-10 py-3 bg-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                 Terminate View
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApprovals;