import React, { useEffect, useState } from 'react';
import { companyGetProfile, companyUpdateProfile } from '../services/api';
import { FiPhone, FiMapPin, FiBell, FiShield, FiCheckCircle } from 'react-icons/fi';

const CompanySettings = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    companyGetProfile().then(r => { 
      if (!mounted) return; 
      setProfile(r.data || r.data.profile || r.data.company); 
    }).catch(() => { }).finally(() => { 
      if (mounted) setLoading(false); 
    });
    return () => mounted = false;
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (profile.phone && String(profile.phone).length < 7) { 
        alert('Phone number seems invalid'); 
        setSaving(false); 
        return; 
      }
      const prefs = profile.notificationPreferences || { email: true, sms: false, push: true };
      await companyUpdateProfile({ 
        phone: profile.phone, 
        address: profile.address, 
        city: profile.city, 
        state: profile.state, 
        notificationPreferences: prefs 
      });
      alert('Settings saved');
    } catch (e) { alert('Save failed'); }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );
  if (!profile) return (
    <div className="text-center py-20 text-slate-400 font-bold">NO SETTINGS DATA FOUND</div>
  );

  const inputClass = "w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all bg-slate-50/50 text-sm font-medium";
  const labelClass = "block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <FiShield className="text-indigo-600" /> Account Settings
          </h2>
          <p className="text-slate-500 font-medium">Manage your contact information and system preferences.</p>
        </div>
        <button 
          disabled={saving} 
          onClick={handleSave} 
          className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? 'Syncing...' : <><FiCheckCircle /> Save Changes</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Contact & Address Section */}
        <div className="lg:col-span-7 bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
            <FiMapPin className="text-indigo-500" /> General Info
          </h3>
          
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Phone Number</label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className={inputClass} value={profile.phone || ''} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Office Address</label>
              <div className="relative">
                <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className={inputClass} value={profile.address || ''} onChange={e => setProfile({ ...profile, address: e.target.value })} placeholder="123 Business Ave, Suite 100" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>City</label>
                <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-slate-50/50 text-sm font-medium" value={profile.city || ''} onChange={e => setProfile({ ...profile, city: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>State</label>
                <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-slate-50/50 text-sm font-medium" value={profile.state || ''} onChange={e => setProfile({ ...profile, state: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="lg:col-span-5 bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-200">
          <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-8 flex items-center gap-2">
            <FiBell /> Notifications
          </h3>
          
          <div className="space-y-4">
            {['email', 'sms', 'push'].map((k) => {
              const enabled = (profile.notificationPreferences && profile.notificationPreferences[k]) || false;
              return (
                <div key={k} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 group transition-all hover:bg-slate-800">
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-widest">{k} Alerts</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{enabled ? 'Active' : 'Disabled'}</span>
                  </div>
                  
                  <button 
                    onClick={() => setProfile({
                      ...profile, 
                      notificationPreferences: {
                        ...(profile.notificationPreferences || {}), 
                        [k]: !enabled
                      }
                    })} 
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${enabled ? 'bg-indigo-500' : 'bg-slate-700'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              );
            })}
          </div>
          
          <div className="mt-8 p-4 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 text-center">
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-tighter">
              Notifications keep your team updated on new applicants and status changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanySettings;