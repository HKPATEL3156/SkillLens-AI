import React, { useEffect, useState } from 'react';
import { companyGetRecruiterActivity } from '../services/api';
import { FiSearch, FiRefreshCw, FiDownload, FiActivity, FiClock, FiPlusCircle } from 'react-icons/fi';

const CompanyActivity = () => {
  const [acts, setActs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    setLoading(true);
    companyGetRecruiterActivity(limit)
      .then(r => setActs(r.data.activities || r.data || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [limit]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse text-slate-400">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p className="text-xs font-black uppercase tracking-widest">Loading Audit Log...</p>
    </div>
  );

  const types = Array.from(new Set(acts.map(a => a.type).filter(Boolean)));
  const filtered = acts.filter(a => {
    const matchesQuery = !query || ((a.title || '') + (a.message || '') + (a.description || '')).toLowerCase().includes(query.toLowerCase());
    const matchesType = !filterType || a.type === filterType;
    return matchesQuery && matchesType;
  });

  const exportCSV = () => {
    const rows = [['title', 'type', 'description', 'createdAt']];
    filtered.forEach(a => rows.push([a.title || a.message || '', a.type || '', (a.description || '').replace(/\n/g, ' '), a.createdAt || '']));
    const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'activity.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <FiActivity className="text-indigo-600" /> Activity Log
          </h2>
          <p className="text-slate-500 font-medium">Tracking all recruiter and system actions.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              placeholder="Search events..." 
              value={query} 
              onChange={e => setQuery(e.target.value)} 
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all w-full md:w-48 bg-white" 
            />
          </div>
          
          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)} 
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white outline-none cursor-pointer"
          >
            <option value="">All Types</option>
            {types.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>

          <button 
            onClick={() => { setLoading(true); companyGetRecruiterActivity(limit).then(r => setActs(r.data.activities || r.data || [])).finally(() => setLoading(false)); }} 
            className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
            title="Refresh Log"
          >
            <FiRefreshCw />
          </button>

          <button 
            onClick={exportCSV} 
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
          >
            <FiDownload /> Export
          </button>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
               <FiActivity className="text-slate-300 text-2xl" />
            </div>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No matching activities found</p>
          </div>
        ) : (
          <div className="space-y-0 border-l-2 border-slate-100 ml-3">
            {filtered.map((a, idx) => (
              <div key={a._id || idx} className="relative pl-10 pb-10 last:pb-0 group">
                {/* Timeline Dot */}
                <div className="absolute left-[-9px] top-1 w-4 h-4 rounded-full border-4 border-white bg-indigo-500 shadow-sm group-hover:scale-125 transition-transform"></div>
                
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-transparent group-hover:border-indigo-100 group-hover:bg-white transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                    <h4 className="text-sm font-black text-slate-800 tracking-tight">
                      {a.title || (a.message || a.type)}
                    </h4>
                    <span className="inline-block px-3 py-1 bg-white text-[10px] font-black text-slate-400 border border-slate-100 rounded-lg uppercase tracking-tighter shadow-sm">
                      {a.type || 'System'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                    {a.description || 'No additional details provided.'}
                  </p>
                  
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <FiClock className="text-indigo-400" />
                    {a.createdAt ? new Date(a.createdAt).toLocaleString('en-US', { 
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                    }) : 'Unknown date'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Trigger */}
        <div className="mt-10 pt-10 border-t border-slate-50 text-center">
          <button 
            onClick={() => setLimit((l) => l + 50)} 
            className="inline-flex items-center gap-2 px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
          >
            <FiPlusCircle /> Load Older Activities
          </button>
        </div>
      </div>
    </div>
  );
}

export default CompanyActivity;