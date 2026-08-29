import React, { useEffect, useState } from 'react';
import {
  adminListCompanies,
  adminApproveCompany,
  adminRejectCompany,
  adminBlockCompany,
  adminDeleteCompany,
  adminGetCompany,
  adminUpdateCompany,
} from '../services/api';
import { FiSearch, FiRefreshCw, FiDownload, FiCheckCircle, FiXCircle, FiShield, FiTrash2, FiExternalLink, FiGlobe, FiPhone, FiCopy, FiCode, FiX } from 'react-icons/fi';

const AdminRecruiters = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetch = async (p = 1, query = '') => {
    setLoading(true);
    try {
      const res = await adminListCompanies({ page: p, limit: 20, q: query });
      setCompanies(res.data.companies || []);
      setTotal(res.data.total || 0);
      setPage(res.data.page || p);
    } catch (err) { console.error(err); alert('Failed to load companies'); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  useEffect(() => {
    const t = setTimeout(() => { fetch(1, q); }, 500);
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
    if (!rows || rows.length === 0) { alert('No companies to export'); return; }
    const cols = ['_id', 'company_name', 'company_email', 'status', 'is_verified', 'createdAt'];
    const csv = [cols.join(',')].concat(
      rows.map(r => cols.map(c => {
        const v = (r[c] === undefined || r[c] === null) ? '' : String(r[c]);
        return '"' + v.replace(/"/g, '""') + '"';
      }).join(','))
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `companies_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = (obj, name = 'companies.json') => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApprove = async (id) => { try { await adminApproveCompany(id); fetch(page, q); } catch (e) { alert('Approve failed') } };
  const handleReject = async (id) => { try { await adminRejectCompany(id); fetch(page, q); } catch (e) { alert('Reject failed') } };
  const handleBlock = async (id, blocked) => { try { await adminBlockCompany(id, blocked ? 'unblock' : 'block'); fetch(page, q); } catch (e) { alert('Action failed') } };
  const handleDelete = async (id) => { if (!confirm('Delete company?')) return; try { await adminDeleteCompany(id); fetch(page, q); } catch (e) { alert('Delete failed') } };

  const viewCompany = async (id) => {
    try {
      const res = await adminGetCompany(id);
      setSelected(res.data.company);
    } catch (err) { alert('Failed to load company'); }
  };

  const handleSaveSelected = async (overrides = {}) => {
    if (!selected) return;
    setSaving(true);
    try {
      const payload = { ...selected, ...overrides };
      const data = { status: payload.status, is_verified: payload.is_verified };
      await adminUpdateCompany(selected._id, data);
      alert('Saved');
      fetch(page, q);
      const res = await adminGetCompany(selected._id);
      setSelected(res.data.company);
    } catch (err) { console.error(err); alert('Save failed'); }
    setSaving(false);
  };

  const handleSearch = (e) => { e?.preventDefault(); fetch(1, q); };

  const statusColors = {
    approved: "bg-emerald-50 text-emerald-600 border-emerald-100",
    pending: "bg-amber-50 text-amber-600 border-amber-100",
    rejected: "bg-rose-50 text-rose-600 border-rose-100"
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      {/* COMMAND HEADER */}
      <div className="flex flex-col lg:flex-row items-center justify-between mb-8 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <FiShield className="text-indigo-600" /> Recruiter Oversight
          </h2>
          <p className="text-slate-500 font-medium">Verify credentials and manage corporate access.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <form onSubmit={handleSearch} className="relative flex-1 lg:flex-none">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              placeholder="Company name or email..." 
              value={q} 
              onChange={e => setQ(e.target.value)} 
              className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all w-full lg:w-64 bg-white" 
            />
          </form>
          
          <button onClick={() => fetch(1, q)} className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-indigo-600 transition-all shadow-sm">
            <FiRefreshCw />
          </button>
          
          <button onClick={() => exportCSV(companies)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-50 transition-all">
            <FiDownload /> CSV
          </button>
          
          <button onClick={() => downloadJSON(companies)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-black transition-all shadow-lg shadow-slate-200">
            <FiCode /> JSON
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      {loading ? (
        <div className="py-20 text-center animate-pulse font-black text-slate-300 uppercase tracking-widest text-xs">Syncing Corporate Registry...</div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="py-5 px-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Recruiter Identity</th>
                  <th className="py-5 px-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Email Identity</th>
                  <th className="py-5 px-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Verified</th>
                  <th className="py-5 px-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Lifecycle</th>
                  <th className="py-5 px-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Joined</th>
                  <th className="py-5 px-6 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {companies.length === 0 && (
                  <tr><td colSpan={6} className="py-20 text-center text-slate-400 font-bold">No companies match the current search criteria.</td></tr>
                )}
                {companies.map(c => (
                  <tr key={c._id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {c.documents?.logo ? (
                            <img src={resolveAsset(c.documents.logo)} alt="logo" className="w-full h-full object-contain" />
                          ) : (
                            <div className="text-xs font-black text-slate-300">{(c.company_name || 'C').charAt(0)}</div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">{c.company_name}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{c.username || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6 text-slate-500 font-medium lowercase">{c.company_email}</td>
                    <td className="py-5 px-6">
                       <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase border ${c.is_verified ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                         {c.is_verified ? 'Verified' : 'Unverified'}
                       </span>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase border ${statusColors[c.status] || "bg-slate-100 text-slate-400"}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-slate-400 text-xs font-bold italic">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => viewCompany(c._id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="View Dossier">
                          <FiExternalLink size={16} />
                        </button>
                        {c.status === 'pending' && (
                          <button onClick={() => handleApprove(c._id)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all" title="Approve">
                            <FiCheckCircle size={16} />
                          </button>
                        )}
                        <button onClick={() => handleBlock(c._id, c.is_blocked)} className={`p-2 rounded-xl transition-all ${c.is_blocked ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'}`} title={c.is_blocked ? 'Grant Access' : 'Restrict Access'}>
                          <FiShield size={16} />
                        </button>
                        <button onClick={() => handleDelete(c._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Purge Record">
                          <FiTrash2 size={16} />
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
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{total} Total Organizations</div>
            <div className="flex items-center gap-4">
              <button disabled={page <= 1} onClick={() => fetch(page - 1, q)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm">Prev</button>
              <div className="text-xs font-black text-slate-500 uppercase tracking-tighter">Page {page} / {Math.ceil(total / 20)}</div>
              <button disabled={companies.length < 20} onClick={() => fetch(page + 1, q)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm">Next</button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setSelected(null)}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl flex flex-col h-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center overflow-hidden shadow-sm">
                   {selected.documents?.logo ? (
                     <img src={resolveAsset(selected.documents.logo)} alt="logo" className="w-full h-full object-contain" />
                   ) : (
                     <div className="text-2xl font-black text-slate-200">{(selected.company_name || 'C').charAt(0)}</div>
                   )}
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
                 <button onClick={() => { navigator.clipboard?.writeText(selected._id || ''); alert('ID Copied'); }} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all" title="Copy Internal ID">
                   <FiCopy />
                 </button>
                 <button onClick={() => downloadJSON(selected, `company_${selected._id}.json`)} className="p-3 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-2xl transition-all" title="Export JSON">
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
                {/* Meta Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Credential Dossier</p>
                    <div className="space-y-5">
                      <div className="flex flex-col gap-1">
                         <span className="text-[10px] font-bold text-slate-400 uppercase">Username</span>
                         <span className="text-sm font-black text-slate-800 tracking-tight">{selected.username || '—'}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-t border-slate-50 pt-4">
                         <span className="text-[10px] font-bold text-slate-400 uppercase">Phone Verified</span>
                         <span className="text-sm font-black text-slate-800 flex items-center gap-2"><FiPhone className="text-indigo-400" /> {selected.phone || '—'}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-t border-slate-50 pt-4">
                         <span className="text-[10px] font-bold text-slate-400 uppercase">Registration Status</span>
                         <div className="mt-1 flex items-center gap-2">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${statusColors[selected.status]}`}>{selected.status}</span>
                           <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${selected.is_verified ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                             {selected.is_verified ? 'Verified' : 'Unverified'}
                           </span>
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Admin Controls Area */}
                  <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                     <FiShield className="absolute right-[-10px] bottom-[-10px] text-white/5 w-24 h-24" />
                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6 relative z-10">Admin Access Control</p>
                     
                     <div className="space-y-5 relative z-10">
                       <div className="flex flex-col gap-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Permission Level</label>
                          <select 
                            value={selected.status} 
                            onChange={e => setSelected(s => ({...s, status: e.target.value}))} 
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                       </div>
                       <div className="flex flex-col gap-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Verification Anchor</label>
                          <select 
                            value={selected.is_verified ? 'yes' : 'no'} 
                            onChange={e => setSelected(s => ({...s, is_verified: e.target.value === 'yes'}))} 
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          >
                            <option value="yes">Anchor Verified</option>
                            <option value="no">Unverified</option>
                          </select>
                       </div>
                       <button 
                         disabled={saving} 
                         onClick={()=>handleSaveSelected()} 
                         className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-indigo-600/30"
                       >
                         {saving ? 'UPDATING...' : 'SYNC CHANGES'}
                       </button>
                     </div>
                  </div>
                </div>

                {/* Dossier Content Area */}
                <div className="lg:col-span-8 space-y-10">
                  <section>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">About Organization</h4>
                    <p className="bg-indigo-600/5 p-6 rounded-3xl border border-indigo-100 italic text-indigo-900 text-lg font-medium leading-relaxed">
                       "{selected.description || 'No organization biography has been provided.'}"
                    </p>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Verification Documents</h4>
                    <div className="grid gap-8">
                      {selected.documents && Object.keys(selected.documents).filter(k => k !== 'logo').length > 0 ? (
                        Object.entries(selected.documents).filter(([k]) => k !== 'logo').map(([k, v]) => {
                          const href = resolveAsset(typeof v === 'string' ? v : (v?.path || ''));
                          const ext = (href?.split('.').pop() || '').toLowerCase();
                          return (
                            <div key={k} className="group relative">
                               <div className="flex items-center justify-between mb-2">
                                 <span className="text-xs font-black text-slate-700 uppercase">{k.replace(/_/g, ' ')}</span>
                                 <a className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-tighter flex items-center gap-1" target="_blank" rel="noreferrer" href={href}><FiExternalLink /> New Tab</a>
                               </div>
                               <div className="bg-white border-2 border-dashed border-slate-100 rounded-[2rem] p-2 overflow-hidden shadow-inner bg-slate-50/30">
                                 {ext === 'pdf' ? (
                                   <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-slate-100 bg-white">
                                      <iframe title={k} src={href} className="w-full h-full" />
                                   </div>
                                 ) : ext.match(/png|jpg|jpeg|gif/) ? (
                                   <div className="flex justify-center bg-white p-4 rounded-2xl">
                                      <img src={href} alt={k} className="max-h-[300px] object-contain" />
                                   </div>
                                 ) : (
                                   <div className="py-10 text-center">
                                      <a className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600" target="_blank" rel="noreferrer" href={href}>Review Attachment</a>
                                   </div>
                                 )}
                               </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-10 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                          <span className="text-sm font-bold text-slate-300">No verification documents archived.</span>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="px-10 py-6 border-t border-slate-100 bg-white flex items-center justify-between sticky bottom-0 z-20">
               <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Internal Index Ref: {selected._id}</div>
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

export default AdminRecruiters;