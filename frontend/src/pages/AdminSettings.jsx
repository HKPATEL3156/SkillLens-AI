import React, { useEffect, useState, useRef } from 'react';
import { FiUpload, FiSave, FiTrash2, FiX, FiSettings, FiUser, FiLock, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { adminGetSettings, adminGetProfile, adminUpdateProfile, adminChangePassword, uploadProfilePhoto } from '../services/api';

const AdminSettings = () => {
  const [settings, setSettings] = useState([]);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pw, setPw] = useState({ oldPassword: '', newPassword: '' });

  useEffect(() => {
    let mounted = true;
    Promise.all([adminGetSettings(), adminGetProfile()])
      .then(([s, p]) => {
        if (!mounted) return;
        setSettings(s.data.settings || []);
        setProfile(p.data.profile || p.data || {});
      })
      .catch(() => { })
      .finally(() => { if (mounted) setLoading(false); });
    return () => mounted = false;
  }, []);

  const [photoFile, setPhotoFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [notify, setNotify] = useState({ message: '', type: 'success' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const originalProfileRef = useRef(null);

  const resolveAsset = (p) => {
    if (!p) return '';
    const base = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
    if (p.startsWith('/uploads') || p.startsWith('uploads')) return `${base}${p.startsWith('/') ? p : '/' + p}`;
    return p;
  };

  const handlePhotoChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setPhotoFile(f);
  };

  const uploadPhoto = async () => {
    if (!photoFile) return setNotify({ message: 'Select a photo to upload', type: 'error' });
    if (photoFile.size > 5 * 1024 * 1024) {
      return setNotify({ message: 'Photo too large (max 5MB)', type: 'error' });
    }
    setUploadingPhoto(true);
    try {
      await uploadProfilePhoto(photoFile);
      const r = await adminGetProfile();
      const newProfile = r.data.profile || r.data || {};
      setProfile(newProfile);
      originalProfileRef.current = { ...newProfile };
      setPhotoFile(null);
      setPhotoPreview(null);
      setNotify({ message: 'Profile photo updated', type: 'success' });
    } catch (err) {
      setNotify({ message: 'Upload failed', type: 'error' });
    }
    setUploadingPhoto(false);
  };

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const payload = { fullName: profile.fullName, mobileNumber: profile.mobileNumber, primaryLocation: profile.primaryLocation };
      await adminUpdateProfile(payload);
      const r = await adminGetProfile();
      const updated = r.data.profile || r.data || {};
      setProfile(updated);
      originalProfileRef.current = { ...updated };
      setNotify({ message: 'Profile updated successfully', type: 'success' });
    } catch (err) {
      setNotify({ message: 'Error updating profile', type: 'error' });
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!pw.newPassword) return setNotify({ message: 'New password required', type: 'error' });
    setPwSaving(true);
    try {
      await adminChangePassword(pw);
      setPw({ oldPassword: '', newPassword: '' });
      setNotify({ message: 'Password changed successfully', type: 'success' });
    } catch (e) {
      setNotify({ message: 'Password change failed', type: 'error' });
    }
    setPwSaving(false);
  };

  const isDirty = () => {
    const orig = originalProfileRef.current || {};
    return (
      (orig.fullName || '') !== (profile.fullName || '') ||
      (orig.mobileNumber || '') !== (profile.mobileNumber || '') ||
      (orig.primaryLocation || '') !== (profile.primaryLocation || '')
    );
  };

  const handleRemovePhoto = async () => {
    setConfirmOpen(false);
    setSaving(true);
    try {
      await adminUpdateProfile({ profileImage: '' });
      const r = await adminGetProfile();
      const updated = r.data.profile || r.data || {};
      setProfile(updated);
      originalProfileRef.current = { ...updated };
      setNotify({ message: 'Profile photo removed', type: 'success' });
    } catch (err) {
      setNotify({ message: 'Failed to remove photo', type: 'error' });
    }
    setSaving(false);
  };

  useEffect(() => {
    if (!photoFile) { setPhotoPreview(null); return; }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  useEffect(() => {
    if (!notify.message) return;
    const id = setTimeout(() => setNotify({ message: '', type: 'success' }), 3500);
    return () => clearTimeout(id);
  }, [notify]);

  useEffect(() => {
    if (profile && !originalProfileRef.current) originalProfileRef.current = { ...profile };
  }, [profile]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] animate-pulse">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Accessing System Core...</p>
    </div>
  );

  const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-700";
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Dynamic Notification */}
      {notify.message && (
        <div className={`fixed right-6 top-24 z-[100] px-6 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-300 border ${notify.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
          <div className="flex items-center gap-3">
            {notify.type === 'error' ? <FiAlertCircle /> : <FiCheck />}
            <div className="text-xs font-black uppercase tracking-wider">{notify.message}</div>
            <button onClick={() => setNotify({ message: '', type: 'success' })} className="ml-2 opacity-50 hover:opacity-100 transition-opacity"><FiX /></button>
          </div>
        </div>
      )}

      {/* Confirmation Backdrop */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setConfirmOpen(false)}></div>
          <div className="relative bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <h4 className="text-xl font-black text-slate-800 mb-2 leading-tight">Remove Asset?</h4>
            <p className="text-sm text-slate-500 font-medium mb-8">Are you sure you want to remove your profile photo? This modification is permanent and affects global visibility.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmOpen(false)} className="flex-1 px-6 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={handleRemovePhoto} className="flex-1 px-6 py-3 rounded-xl bg-rose-600 text-white font-black hover:bg-rose-700 transition-all shadow-lg shadow-rose-100">Confirm Removal</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-10">
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Preferences</h2>
        <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-[0.2em]">Platform Integrity & Identity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: SYSTEM SETTINGS */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
            <FiSettings className="absolute right-[-10px] bottom-[-10px] text-white/5 w-32 h-32 group-hover:scale-110 transition-transform" />
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-8 flex items-center gap-2">
              <FiSettings /> System Environment
            </h3>
            {settings.length === 0 ? (
              <div className="text-xs font-bold text-slate-500 uppercase tracking-tighter italic">No variables defined</div>
            ) : (
              <div className="space-y-6 relative z-10">
                {settings.map((s) => (
                  <div key={s._id} className="pb-4 border-b border-white/5 last:border-0 group/item">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover/item:text-indigo-400 transition-colors">{s.key}</div>
                    <div className="text-sm font-black text-indigo-100 truncate">{String(s.value)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: PROFILE & AUTH */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* PROFILE CARD */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
              <FiUser className="text-indigo-600" /> Administrative Identity
            </h3>
            
            <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
              <div className="relative group shrink-0">
                <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl bg-slate-50">
                  {photoPreview ? (
                    <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                  ) : profile.profileImage ? (
                    <img src={resolveAsset(profile.profileImage)} alt="admin" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-black text-slate-200">
                      {(profile.fullName || profile.username || 'A').charAt(0)}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-xl shadow-lg border-2 border-white">
                  <FiUpload size={14} />
                </div>
              </div>

              <div className="flex-1 space-y-4 text-center md:text-left">
                <div>
                   <h4 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1">Upload New Asset</h4>
                   <p className="text-xs font-medium text-slate-400">Sync global avatar with directory. Max 5MB.</p>
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <label className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-600 cursor-pointer hover:bg-slate-100 transition-all">
                    Choose Media
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                  <button onClick={uploadPhoto} disabled={uploadingPhoto || !photoFile} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50">
                    {uploadingPhoto ? 'Pushing...' : 'Upload Asset'}
                  </button>
                  <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-slate-600 transition-all shadow-sm"><FiX /></button>
                  {profile.profileImage && (
                    <button onClick={() => setConfirmOpen(true)} className="p-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"><FiTrash2 /></button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className={labelClass}>Designated Full Name</label>
                <input value={profile.fullName || ''} onChange={e => setProfile({ ...profile, fullName: e.target.value })} className={inputClass} placeholder="Enter designation name" />
              </div>
              <div>
                <label className={labelClass}>Authorized Mobile</label>
                <input value={profile.mobileNumber || ''} onChange={e => setProfile({ ...profile, mobileNumber: e.target.value })} className={inputClass} placeholder="+1 000 000 0000" />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Primary Operating Region</label>
                <input value={profile.primaryLocation || ''} onChange={e => setProfile({ ...profile, primaryLocation: e.target.value })} className={inputClass} placeholder="Global Headquarters" />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-slate-50">
              <button onClick={handleProfileSave} disabled={saving || !isDirty()} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
                {saving ? 'Synchronizing...' : <><FiSave /> Sync Identity</>}
              </button>
              <button onClick={() => { setProfile({ ...originalProfileRef.current }); setPhotoFile(null); setPhotoPreview(null); }} disabled={!isDirty()} className="px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl font-bold hover:bg-slate-50 transition-all disabled:opacity-30">Discard Changes</button>
            </div>
          </div>

          {/* PASSWORD CARD */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
              <FiLock className="text-indigo-600" /> Encryption & Security
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className={labelClass}>Current Cipher</label>
                <input type="password" value={pw.oldPassword} onChange={e => setPw({ ...pw, oldPassword: e.target.value })} className={inputClass} placeholder="••••••••" />
              </div>
              <div>
                <label className={labelClass}>New Cipher Key</label>
                <input type="password" value={pw.newPassword} onChange={e => setPw({ ...pw, newPassword: e.target.value })} className={inputClass} placeholder="••••••••" />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-6 border-t border-slate-50">
              <button onClick={handleChangePassword} disabled={pwSaving || !pw.newPassword} className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95 disabled:opacity-50">
                {pwSaving ? 'Updating...' : 'Update Encryption'}
              </button>
              <button onClick={() => setPw({ oldPassword: '', newPassword: '' })} className="px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm">Clear Keys</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;