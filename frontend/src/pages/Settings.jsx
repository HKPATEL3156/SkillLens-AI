import React, { useEffect, useState } from "react";
import { getProfile, patchProfile, changePassword, deleteAccount } from "../services/api";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/default-avatar.svg";
import { 
  FiUser, FiMail, FiLock, FiLogOut, FiTrash2, 
  FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle 
} from "react-icons/fi";

const backendBase = import.meta?.env?.VITE_API_BASE || "http://localhost:5000";
const resolveAsset = (p) => {
  if (!p) return "";
  if (p.startsWith("/uploads") || p.startsWith("uploads")) return backendBase + (p.startsWith("/") ? p : `/${p}`);
  return p;
};

const Settings = () => {
  const [profile, setProfile] = useState({ name: "", email: "", username: "", dob: "", profilePhoto: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [password, setPassword] = useState({ old: "", new: "" });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const nav = useNavigate();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const res = await getProfile();
      const u = res.data?.user || res.data || {};
      const name = u.fullName || (u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : (u.name || u.username || ''));
      const dob = u.dob ? (u.dob.substring ? u.dob.substring(0,10) : u.dob) : "";
      const photo = resolveAsset(u.profilePhoto || u.profileImage || "");
      setProfile({ name, email: u.email || "", username: u.username || "", dob, profilePhoto: photo });
    } catch (e) {
      setError('Failed to load profile');
    } finally { setLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    try {
      if (!password.old || !password.new) return setError('Please enter both old and new passwords');
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password.new)) return setError('New password does not meet security requirements');
      const resp = await changePassword({ old: password.old, new: password.new });
      setSuccess(resp?.data?.message || 'Password updated successfully'); 
      setPassword({ old: '', new: '' });
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to change password');
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    if (!newEmail || !newEmail.includes('@')) return setError('Enter a valid email');
    try {
      const res = await patchProfile({ email: newEmail });
      const u = res.data?.user || res.data || {};
      setProfile(prev => ({ ...prev, email: u.email || newEmail }));
      setSuccess('Email updated successfully'); setNewEmail('');
    } catch (err) { setError('Failed to update email'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('This action is permanent. Are you sure?')) return;
    try {
      await deleteAccount(); localStorage.removeItem('token'); nav('/login');
    } catch (err) { setError('Failed to delete account'); }
  };

  const handleLogout = () => { localStorage.removeItem('token'); window.location.replace('/login'); };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
          Account Settings
        </h1>

        {/* Notifications */}
        {(error || success) && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${error ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
            {error ? <FiAlertCircle className="shrink-0" /> : <FiCheckCircle className="shrink-0" />}
            <span className="text-sm font-bold">{error || success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Profile Overview Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center">
              <div className="relative inline-block mb-4">
                <img 
                  src={profile.profilePhoto || defaultAvatar} 
                  alt="avatar" 
                  className="w-32 h-32 rounded-3xl object-cover ring-4 ring-white shadow-lg mx-auto" 
                />
              </div>
              <h2 className="text-xl font-black text-slate-900 truncate">{profile.name}</h2>
              <p className="text-sm font-medium text-slate-400 mb-6">@{profile.username}</p>
              
              <div className="space-y-3 text-left bg-slate-50 p-4 rounded-2xl">
                <div className="flex items-center gap-3 text-slate-600">
                  <FiMail className="text-indigo-500" />
                  <span className="text-xs font-bold truncate">{profile.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <FiUser className="text-indigo-500" />
                  <span className="text-xs font-bold">{profile.dob || 'DOB Not Set'}</span>
                </div>
              </div>

              <button 
                onClick={handleLogout}
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-sm font-black transition-all shadow-md"
              >
                <FiLogOut /> Logout Session
              </button>
            </div>
          </div>

          {/* Settings Actions Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Email Form */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <FiMail className="text-indigo-500" /> Login Email
              </h3>
              <form onSubmit={handleEmailChange} className="flex flex-col sm:flex-row gap-3">
                <input 
                  value={newEmail} 
                  onChange={e => setNewEmail(e.target.value)} 
                  placeholder="Enter new email address" 
                  className="flex-grow bg-slate-50 border-transparent border focus:border-indigo-500 focus:bg-white p-4 rounded-xl outline-none transition-all font-medium text-slate-700" 
                />
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-black transition-all">
                  Update
                </button>
              </form>
            </div>

            {/* Password Form */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <FiLock className="text-indigo-500" /> Security Credentials
              </h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <input 
                      type={showOld ? 'text' : 'password'} 
                      placeholder="Current Password" 
                      value={password.old} 
                      onChange={e => setPassword({ ...password, old: e.target.value })} 
                      className="w-full bg-slate-50 border-transparent border focus:border-indigo-500 focus:bg-white p-4 rounded-xl outline-none font-medium text-slate-700" 
                    />
                    <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      {showOld ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type={showNew ? 'text' : 'password'} 
                      placeholder="New Secure Password" 
                      value={password.new} 
                      onChange={e => setPassword({ ...password, new: e.target.value })} 
                      className="w-full bg-slate-50 border-transparent border focus:border-indigo-500 focus:bg-white p-4 rounded-xl outline-none font-medium text-slate-700" 
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      {showNew ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-indigo-50 rounded-2xl text-[11px] text-indigo-700 font-bold leading-relaxed">
                  Requirement: Minimum 8 characters, at least one uppercase letter, one number, and one special symbol (@$!%*?&).
                </div>
                <div className="flex justify-end">
                  <button className="w-full sm:w-auto bg-slate-900 hover:bg-emerald-600 text-white px-10 py-4 rounded-xl font-black transition-all">
                    Update Password
                  </button>
                </div>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 rounded-3xl p-8 border border-red-100 shadow-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <h3 className="text-lg font-black text-red-700 flex items-center gap-2 justify-center md:justify-start">
                    <FiTrash2 /> Terminate Account
                  </h3>
                  <p className="text-sm font-medium text-red-600 mt-1">Once you delete your account, there is no going back. Please be certain.</p>
                </div>
                <button 
                  onClick={handleDelete}
                  className="bg-white hover:bg-red-600 text-red-600 hover:text-white border-2 border-red-200 px-8 py-3 rounded-xl font-black transition-all whitespace-nowrap"
                >
                  Delete Forever
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;