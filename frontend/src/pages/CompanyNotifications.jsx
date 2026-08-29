import React, { useEffect, useState } from 'react';
import { companyGetNotifications, companyMarkNotificationRead } from '../services/api';

const CompanyNotifications = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = async (p=1)=>{
    setLoading(true);
    try{
      const res = await companyGetNotifications({ page: p, limit: 50 });
      setNotes(res.data.notifications || []);
    }catch(e){ console.error(e); }
    setLoading(false);
  };

  useEffect(()=>{ load(); }, []);

  const markRead = async (id)=>{
    try{
      await companyMarkNotificationRead(id);
      setNotes((n)=>n.map(x=> x._id===id? {...x, isRead:true}: x));
    }catch(e){ console.error(e); }
  };

  const markAllRead = async ()=>{
    try{
      await Promise.all(notes.filter(n=>!n.isRead).map(n=> companyMarkNotificationRead(n._id)));
      setNotes((n)=>n.map(x=> ({...x, isRead:true})));
    }catch(e){ console.error(e); }
  };

  if (loading) return <div>Loading notifications...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Notifications</h2>
      <div className="bg-white rounded shadow p-4">
        <div className="flex justify-end mb-3">
          <button onClick={markAllRead} disabled={!notes.some(n=>!n.isRead)} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">Mark all read</button>
        </div>
        {notes.length===0 ? <div className="text-sm text-gray-500">No notifications</div> : (
          <ul className="space-y-2">
            {notes.map(n=> (
              <li key={n._id} className={`p-2 rounded ${n.isRead? 'bg-gray-50':'bg-yellow-50'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-800">{n.message}</div>
                    <div className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                  <div>
                    {!n.isRead && <button onClick={()=>markRead(n._id)} className="px-2 py-1 bg-blue-600 text-white rounded">Mark read</button>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default CompanyNotifications;
