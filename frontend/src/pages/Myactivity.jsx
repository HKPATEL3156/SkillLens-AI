import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  FiActivity, FiBell, FiCheckCircle, FiInfo, 
  FiClock, FiAlertCircle, FiRefreshCw 
} from "react-icons/fi";

const MyActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    let mounted = true;
    const fetchActivity = async () => {
      setError("");
      try {
        const res = await axios.get("/api/profile/activity", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!mounted) return;
        setActivities(res.data.activities || []);
      } catch (err) {
        if (!mounted) return;
        setError("Unable to sync recent activities");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchActivity();
    const id = setInterval(fetchActivity, 8000);
    return () => { mounted = false; clearInterval(id); };
  }, [token]);

  // Dynamic icon selector based on activity type
  const getActivityIcon = (type) => {
    const t = type?.toLowerCase() || "";
    if (t.includes("apply") || t.includes("job")) return <FiCheckCircle className="text-emerald-500" />;
    if (t.includes("quiz") || t.includes("exam")) return <FiActivity className="text-indigo-500" />;
    if (t.includes("profile") || t.includes("update")) return <FiRefreshCw className="text-amber-500" />;
    if (t.includes("error") || t.includes("fail")) return <FiAlertCircle className="text-rose-500" />;
    return <FiBell className="text-slate-400" />;
  };

  if (loading) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Fetching Feed...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            My Activity <FiBell className="text-indigo-600 animate-bounce" size={24} />
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Real-time updates of your career journey</p>
        </div>
        
        {/* Live Indicator */}
        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter">Live Feed</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-in fade-in">
          <FiInfo /> {error}
        </div>
      )}

      {/* Activity Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-slate-100 hidden sm:block"></div>

        <div className="space-y-6 relative">
          {Array.isArray(activities) && activities.length ? (
            activities.map((act) => (
              <div 
                key={act._id} 
                className="group relative flex flex-col sm:flex-row items-start gap-4 transition-all duration-300 hover:translate-x-1"
              >
                {/* Timeline Node */}
                <div className="hidden sm:flex z-10 w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm items-center justify-center text-xl shrink-0 group-hover:border-indigo-200 group-hover:shadow-md transition-all">
                  {getActivityIcon(act.type)}
                </div>

                {/* Content Card */}
                <div className="flex-1 w-full bg-white rounded-3xl p-6 border border-slate-100 shadow-sm group-hover:shadow-lg group-hover:border-indigo-100 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg w-fit">
                      {act.type || 'General'}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                      <FiClock /> {new Date(act.createdAt).toLocaleString()}
                    </div>
                  </div>
                  
                  <h3 className="text-slate-800 font-bold leading-relaxed">
                    {act.message}
                  </h3>
                  
                  {/* Decorative element for card footer */}
                  <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
                    <div className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">
                      Reference ID: {act._id?.substring(0, 8)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiActivity size={32} className="text-slate-300" />
              </div>
              <h3 className="text-slate-400 font-black uppercase tracking-widest">No Activity Yet</h3>
              <p className="text-slate-300 text-sm mt-2 font-medium">Your actions will appear here in real-time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyActivity;