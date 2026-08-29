import React, { useEffect, useState } from "react";
import { getProfile, getCareer } from "../services/api";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/default-avatar.svg";
import { 
  FiUploadCloud, FiCpu, FiUser, FiActivity, 
  FiPieChart, FiArrowRight, FiCheckCircle, FiEdit3,
  FiBriefcase, FiBookOpen, FiStar
} from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi2";

// --- HELPERS ---
const backendBase = import.meta?.env?.VITE_API_BASE || "http://localhost:5000";
const resolveAsset = (p) => {
  if (!p) return "";
  if (p.startsWith("/uploads") || p.startsWith("uploads")) return backendBase + (p.startsWith("/") ? p : `/${p}`);
  return p;
};

const formatDate = (s) => {
  if (!s) return "-";
  try { return new Date(s).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }); } catch { return s; }
};

const splitSkills = (skills = []) => {
  const tech = [], tools = [], soft = [];
  const toolKeys = ["react","next","vue","angular","docker","kubernetes","aws","azure","gcp","git","github","node","express","django","flask","sql","mongodb","redis","tailwind"];
  const softKeys = ["communication","teamwork","leadership","problem","management","collaboration","critical","adaptability"];
  
  (skills || []).forEach((s) => {
    const lower = String(s).toLowerCase();
    if (softKeys.some(k => lower.includes(k))) soft.push(s);
    else if (toolKeys.some(k => lower.includes(k))) tools.push(s);
    else tech.push(s);
  });
  return { tech, tools, soft };
};

const CircularProgress = ({ percent = 0, size = 120, stroke = 10 }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle r={r} cx={size/2} cy={size/2} fill="transparent" stroke="#F1F5F9" strokeWidth={stroke} />
        <circle r={r} cx={size/2} cy={size/2} fill="transparent" stroke="url(#dashboard-grad)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
        <defs>
          <linearGradient id="dashboard-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-black text-slate-800 leading-none">{Math.round(percent)}%</span>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Profile</p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [career, setCareer] = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [pRes, cRes] = await Promise.allSettled([getProfile(), getCareer()]);
        const p = pRes.status === 'fulfilled' ? (pRes.value.data?.user || pRes.value.data) : null;
        const c = cRes.status === 'fulfilled' ? (cRes.value.data || null) : null;
        if (!mounted) return;
        setProfile(p);
        setCareer(c || {});
      } catch (e) {
        console.error('dashboard load', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const userName = profile?.fullName || profile?.firstName || profile?.username || 'Candidate';
  const headline = profile?.headline || 'Candidate • Ready for opportunities';
  const avatar = resolveAsset(profile?.profileImage || profile?.profilePhoto) || defaultAvatar;

  const resumeUploaded = Boolean(career?.resumeUrl || profile?.resumeFilePath);
  const skillsCount = Array.isArray(profile?.skills) ? profile.skills.length : 0;
  const educationAdded = Array.isArray(profile?.education) && profile.education.length > 0;
  const profileDetails = Boolean(profile?.fullName && profile?.headline);
  
  const completeScore = Math.min(100, Math.round(((resumeUploaded ? 25 : 0) + (skillsCount > 0 ? 25 : 0) + (educationAdded ? 25 : 0) + (profileDetails ? 25 : 0))));
  const { tech, tools, soft } = splitSkills(profile?.skills || []);

  const freqMap = {};
  (profile?.skills || []).forEach(s => { freqMap[s] = (freqMap[s] || 0) + 1; });
  const top3 = Object.keys(freqMap).sort((a,b) => freqMap[b]-freqMap[a]).slice(0,3);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- WELCOME HERO --- */}
        <section className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-bl-[10rem] -mr-20 -mt-20 opacity-50 z-0" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                <HiOutlineSparkles className="animate-pulse" /> Welcome to your Hub
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
                Hi, {userName}! <span className="text-indigo-600">👋</span>
              </h2>
              <p className="text-slate-500 font-medium max-w-xl leading-relaxed">
                {headline}. Your AI-powered dashboard is ready to guide you to your next career milestone.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                <button onClick={() => nav('/dashboard/career')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-black transition-all shadow-xl shadow-indigo-100 flex items-center gap-2">
                  <FiUploadCloud /> Upload Resume
                </button>
                <button onClick={() => nav('/dashboard/coach')} className="bg-slate-900 hover:bg-black text-white px-8 py-3.5 rounded-2xl font-black transition-all shadow-xl shadow-slate-200 flex items-center gap-2">
                  <FiPieChart /> Open AI Coach
                </button>
              </div>
            </div>
            <div className="shrink-0">
               <div className="relative">
                  <img src={avatar} alt="avatar" className="w-40 h-40 rounded-[2.5rem] object-cover ring-[12px] ring-slate-50 shadow-2xl" />
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-3 rounded-2xl shadow-lg border-4 border-white">
                    <FiCheckCircle size={20} />
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Profile Completion */}
          <div className="lg:col-span-8 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-10">
            <CircularProgress percent={completeScore} />
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900 leading-tight">Identity Strength</h3>
                <p className="text-sm font-medium text-slate-400 mt-1">Complete your profile to unlock premium AI job matching.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Resume", done: resumeUploaded },
                  { label: "Skills", done: skillsCount > 0 },
                  { label: "Education", done: educationAdded },
                  { label: "Details", done: profileDetails },
                ].map((item, idx) => (
                  <div key={idx} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${item.done ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${item.done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      <FiCheckCircle size={12} />
                    </div>
                    <span className={`text-xs font-black uppercase tracking-widest ${item.done ? 'text-emerald-700' : 'text-slate-400'}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="lg:col-span-4 bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 flex flex-col justify-between overflow-hidden relative">
            <FiStar className="absolute -right-6 -top-6 text-white/10 w-32 h-32 rotate-12" />
            <div className="relative z-10">
               <h4 className="text-indigo-200 text-xs font-black uppercase tracking-[0.2em] mb-2">Resume Status</h4>
               <div className="text-3xl font-black">{resumeUploaded ? 'Active' : 'Pending'}</div>
               <p className="text-indigo-100/70 text-sm mt-4 font-medium">
                 {resumeUploaded ? `Last synced: ${formatDate(profile?.updatedAt)}` : 'Sync your resume to extract 20+ skill points automatically.'}
               </p>
            </div>
            <button onClick={() => nav('/career')} className="relative z-10 w-full bg-white/10 hover:bg-white/20 backdrop-blur-md py-4 rounded-2xl font-black text-sm transition-all mt-6">
              Manage Documents
            </button>
          </div>
        </div>

        {/* --- NAVIGATION TILES --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Resume Hub", sub: "Skill extraction", icon: <FiUploadCloud />, color: "bg-blue-50 text-blue-600", path: "/dashboard/career" },
            { label: "Feed", sub: "Recent actions", icon: <FiActivity />, color: "bg-emerald-50 text-emerald-600", path: "/dashboard/activity" },
            { label: "Identity", sub: "Personal info", icon: <FiUser />, color: "bg-orange-50 text-orange-600", path: "/dashboard/profile" },
            { label: "AI Coach", sub: "Expert insights", icon: <HiOutlineSparkles />, color: "bg-purple-50 text-purple-600", path: "/dashboard/coach" },
          ].map((item, i) => (
            <div key={i} onClick={() => nav(item.path)} className="group cursor-pointer bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform`}>
                {item.icon}
              </div>
              <div className="font-black text-slate-900 tracking-tight">{item.label}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.sub}</div>
            </div>
          ))}
        </div>

        {/* --- BOTTOM CONTENT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Skill Matrix */}
          <div className="lg:col-span-8 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <FiCpu className="text-indigo-600" /> Skill Inventory
              </h3>
              <button onClick={() => nav('/skills')} className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Customize Inventory</button>
            </div>

            <div className="space-y-8">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">Technical Core</p>
                <div className="flex flex-wrap gap-2">
                  {tech.length ? tech.map((s,i) => <span key={i} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold">{s}</span>) : <span className="text-slate-300 italic text-sm">None extracted</span>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Frameworks & Tools</p>
                  <div className="flex flex-wrap gap-2">
                    {tools.map((s,i) => <span key={i} className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase border border-indigo-100">{s}</span>)}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Soft Power</p>
                  <div className="flex flex-wrap gap-2">
                    {soft.map((s,i) => <span key={i} className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase border border-emerald-100">{s}</span>)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Insights Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                <HiOutlineSparkles className="text-indigo-600" /> Talent Analysis
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Market Keywords</p>
                  <div className="flex flex-wrap gap-2 italic text-sm font-bold text-slate-700">
                    {top3.length ? top3.map(s => `#${s}`).join(' ') : 'Insufficient Data'}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-4">Density Chart</p>
                  <div className="flex items-end gap-3 h-20">
                    {[60, 100, 40, 80, 50].map((h, i) => (
                      <div key={i} className="flex-1 bg-indigo-50 rounded-t-lg relative group overflow-hidden">
                        <div className="absolute bottom-0 w-full bg-indigo-600 rounded-t-lg transition-all duration-700" style={{ height: `${h}%` }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Snapshot */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
              <h3 className="text-lg font-black text-slate-900 mb-6">Experience Snippet</h3>
              <div className="space-y-4">
                {profile?.experience?.slice(0, 2).map((exp, i) => (
                  <div key={i} className="border-l-4 border-indigo-500 pl-4 py-1">
                    <div className="text-sm font-black text-slate-900">{exp.title || exp.role}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{exp.company}</div>
                  </div>
                ))}
                <button onClick={() => nav('/dashboard/profile')} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-400 hover:text-indigo-600 font-black text-xs uppercase tracking-widest rounded-xl transition-all">
                  Full Resume <FiArrowRight />
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* --- COMING SOON FOOTER --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 opacity-60 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
          <div className="bg-white p-8 rounded-[2rem] border-2 border-dashed border-slate-200">
             <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-slate-100 rounded-2xl"><FiActivity /></div>
                <h4 className="font-black tracking-tight text-slate-400 uppercase text-sm">Adaptive Quizzes</h4>
             </div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Locked: Verification Engine v2.0</p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border-2 border-dashed border-slate-200">
             <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-slate-100 rounded-2xl"><FiBriefcase /></div>
                <h4 className="font-black tracking-tight text-slate-400 uppercase text-sm">Auto-Apply Bot</h4>
             </div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Locked: ML Matchmaker v1.4</p>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Dashboard;