import React, { useEffect, useState } from 'react';
import {
  adminListUsers,
  adminDeleteUser,
  adminBlockUser,
  adminGetUser,
  adminUpdateUser,
} from '../services/api';
import { FiSearch, FiRefreshCw, FiDownload, FiUser, FiTrash2, FiShield, FiExternalLink, FiCopy, FiCode, FiX } from 'react-icons/fi';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [showJson, setShowJson] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetch = async (p = 1, query = '') => {
    setLoading(true);
    try {
      const res = await adminListUsers({ page: p, limit: 20, q: query });
      const all = res.data.users || [];
      // exclude system admin accounts from the UI listing
      const filtered = all.filter(u => ((u.role || '').toLowerCase() !== 'admin'));
      const adminCountInPage = all.length - filtered.length;
      const totalFromServer = res.data.total || all.length;
      const adjustedTotal = Math.max(0, totalFromServer - adminCountInPage);
      setUsers(filtered);
      setTotal(adjustedTotal);
      setPage(res.data.page || p);
    } catch (err) {
      console.error(err);
      alert('Failed to load users');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(1, q); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetch(1, q);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      await adminDeleteUser(id);
      fetch(page, q);
      alert('User deleted');
    } catch (err) { alert('Delete failed'); }
  };

  const handleBlock = async (id, isBlocked) => {
    try {
      await adminBlockUser(id, isBlocked ? 'unblock' : 'block');
      fetch(page, q);
    } catch (err) { alert('Action failed'); }
  };

  const viewUser = async (id) => {
    try {
      const res = await adminGetUser(id);
      const user = res.data.user;
      if ((user.role || '').toLowerCase() === 'admin') {
        // Prevent opening/manipulating the main admin account from this UI
        alert('This is a system admin account and is not shown or editable here.');
        return;
      }
      setSelected(user);
    } catch (err) { alert('Unable to load user'); }
  };

  const resolveAsset = (p) => {
    if (!p) return null;
    if (p.startsWith('http') || p.startsWith('//')) return p;
    const base = import.meta.env.VITE_API_BASE || '';
    if (p.startsWith('/')) return `${base}${p}`;
    return `${base}/${p}`;
  };

  const exportCSV = (rows) => {
    if (!rows || rows.length === 0) { alert('No users to export'); return; }
    const cols = ['_id', 'fullName', 'email', 'role', 'status', 'createdAt'];
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
    a.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = (obj, name = 'users.json') => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSelected = async (overrides = {}) => {
    if (!selected) return;
    setSaving(true);
    try {
      const payload = { ...selected, ...overrides };
      const data = { role: payload.role, status: payload.status };
      await adminUpdateUser(selected._id, data);
      alert('Saved');
      fetch(page, q);
      const res = await adminGetUser(selected._id);
      setSelected(res.data.user);
    } catch (err) {
      console.error(err);
      alert('Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row items-center justify-between mb-8 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <FiUser className="text-indigo-600" /> Identity Management
          </h2>
          <p className="text-slate-500 font-medium">Verify, moderate, and export global platform users.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <form onSubmit={handleSearch} className="relative flex-1 lg:flex-none">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              placeholder="Search by name/email..." 
              value={q} 
              onChange={e => setQ(e.target.value)} 
              className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all w-full lg:w-64 bg-white" 
            />
          </form>
          
          <button onClick={() => fetch(1, q)} className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-indigo-600 transition-all shadow-sm">
            <FiRefreshCw />
          </button>
          
          <button onClick={() => exportCSV(users)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-50 transition-all">
            <FiDownload /> CSV
          </button>
          
          <button onClick={() => downloadJSON(users, 'users.json')} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-black transition-all shadow-lg shadow-slate-200">
            <FiCode /> JSON
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      {loading ? (
        <div className="py-20 text-center animate-pulse font-black text-slate-300 uppercase tracking-widest text-xs">Synchronizing User Records...</div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="py-5 px-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Candidate / Recruiter</th>
                  <th className="py-5 px-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Email Identity</th>
                  <th className="py-5 px-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Permission</th>
                  <th className="py-5 px-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Lifecycle</th>
                  <th className="py-5 px-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Registration</th>
                  <th className="py-5 px-6 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-slate-400 font-bold">No user profiles found matching your search.</td>
                  </tr>
                )}
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {u.profileImage ? (
                            <img src={resolveAsset(u.profileImage)} alt="avatar" className="w-10 h-10 rounded-2xl object-cover border-2 border-white shadow-sm" />
                          ) : (
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 font-black">
                              {(u.fullName || u.username || 'U').charAt(0)}
                            </div>
                          )}
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${u.status === 'blocked' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{u.fullName || '—'}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{u.username || 'anonymous'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6 text-slate-500 font-medium">{u.email}</td>
                    <td className="py-5 px-6">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${u.role === 'admin' ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`text-xs font-bold ${u.status === 'blocked' ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-slate-400 text-xs font-bold italic">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => viewUser(u._id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="View Profile">
                          <FiExternalLink size={18} />
                        </button>
                        <button onClick={() => handleBlock(u._id, u.status !== 'active')} className={`p-2 rounded-xl transition-all ${u.status === 'blocked' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'}`} title={u.status === 'blocked' ? 'Unblock' : 'Restrict Access'}>
                          <FiShield size={18} />
                        </button>
                        <button onClick={() => handleDelete(u._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Delete Account">
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
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{total} Total Profiles</div>
            <div className="flex items-center gap-4">
              <button disabled={page <= 1} onClick={() => fetch(page - 1, q)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm">Prev</button>
              <div className="text-xs font-black text-slate-500 uppercase tracking-tighter">Page {page} / {Math.max(1, Math.ceil(total / 20))}</div>
              <button disabled={users.length < 20} onClick={() => fetch(page + 1, q)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm">Next</button>
            </div>
          </div>
        </div>
      )}

      {/* USER DETAIL DRAWER/MODAL */}
      {selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelected(null)}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl flex flex-col h-full max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-6">
                {selected.profileImage ? (
                  <img src={resolveAsset(selected.profileImage)} alt="avatar" className="w-16 h-16 rounded-[1.5rem] object-cover border-4 border-slate-50 shadow-sm" />
                ) : (
                  <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center text-indigo-500 text-2xl font-black">
                    {(selected.fullName || selected.username || 'U').charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-2">{selected.fullName || 'No Name'}</h3>
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
                    <span className="flex items-center gap-1"><FiUser size={14}/> {selected.username}</span>
                    <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                    <span className="text-indigo-600 lowercase">{selected.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                 <button onClick={() => { navigator.clipboard?.writeText(selected._id || ''); alert('ID Copied'); }} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all" title="Copy Internal ID">
                   <FiCopy />
                 </button>
                 <button onClick={() => setShowJson(s => !s)} className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${showJson ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-500'}`}>
                   {showJson ? 'Profile' : 'Raw Data'}
                 </button>
                 <button onClick={() => setSelected(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all">
                   <FiX size={20} />
                 </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-10 bg-[#FBFDFF] custom-scrollbar">
              {showJson ? (
                <div className="bg-slate-900 rounded-3xl p-6 shadow-inner relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5 text-white pointer-events-none font-black text-8xl">JSON</div>
                   <pre className="text-indigo-300 text-sm font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">{JSON.stringify(selected, null, 2)}</pre>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  {/* Sidebar Stats */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Account Analytics</p>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                           <span className="text-xs font-bold text-slate-500">Tier</span>
                           <span className="text-xs font-black text-slate-800 uppercase tracking-tighter">{selected.accountType || 'Standard'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                           <span className="text-xs font-bold text-slate-500">Status</span>
                           <span className={`text-xs font-black uppercase tracking-tighter ${selected.status === 'blocked' ? 'text-rose-500' : 'text-emerald-500'}`}>{selected.status || 'Active'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                           <span className="text-xs font-bold text-slate-500">Category</span>
                           <span className="text-xs font-black text-slate-800">{selected.category || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                       <FiShield className="absolute right-[-10px] bottom-[-10px] text-white/5 w-24 h-24" />
                       <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 relative z-10">System Role</p>
                       <div className="text-3xl font-black relative z-10 capitalize">{selected.role}</div>
                    </div>
                  </div>

                  {/* Deep Info */}
                  <div className="lg:col-span-8 space-y-8">
                    {/* Professional Headline */}
                    <div className="bg-indigo-600/5 p-6 rounded-3xl border border-indigo-100 italic text-indigo-900 text-lg font-medium leading-snug">
                       "{selected.headline || 'Candidate has not provided a headline yet.'}"
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-2">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile Verified</p>
                         <p className="text-sm font-bold text-slate-700">{selected.mobileNumber || 'Not provided'}</p>
                       </div>
                       <div className="space-y-2">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Home Region</p>
                         <p className="text-sm font-bold text-slate-700 uppercase">{selected.primaryLocation || 'Global'}</p>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Bio</p>
                       <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">{selected.bio || 'Detailed bio remains unconfigured for this profile.'}</p>
                    </div>

                    {/* Skill Badges */}
                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Skill Inventory</p>
                       <div className="flex flex-wrap gap-2">
                         { (selected.skills || []).length > 0 ? selected.skills.map((s, idx) => (
                           <span key={idx} className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-black text-slate-700 shadow-sm">{s}</span>
                         )) : <span className="text-slate-300 italic text-sm">No skills attributed</span>}
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-10 py-6 border-t border-slate-100 bg-white flex items-center justify-between sticky bottom-0">
               <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">System Index: {selected._id}</div>
               <div className="flex gap-4">
                  {selected.resumeFilePath && (
                    <a href={selected.resumeFilePath} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-all">
                      <FiDownload /> Resume
                    </a>
                  )}
                  <button onClick={() => setSelected(null)} className="px-8 py-3 bg-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                    Exit View
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;