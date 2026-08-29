import React, { useEffect, useState } from 'react';
import { companyGetProfile, companyUpdateProfile, companyUploadDocuments, uploadProfilePhoto } from '../services/api';
import { FiUploadCloud, FiGlobe, FiMail, FiPhone, FiMapPin, FiFileText, FiCheck, FiEye } from 'react-icons/fi';

const CompanyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [companyFiles, setCompanyFiles] = useState({});
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const inputStyle = "w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-700 focus:bg-white";

  const handleSocialChange = (k) => (e) => setProfile({ ...profile, socialLinks: { ...(profile.socialLinks || {}), [k]: e.target.value } });

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
      if (!profile.company_name || !profile.company_name.trim()) { 
        alert('Company name required'); 
        setSaving(false); 
        return; 
      }
      const payload = {
        company_name: profile.company_name,
        company_email: profile.company_email,
        website: profile.website,
        description: profile.description,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        socialLinks: profile.socialLinks || {},
      };
      const res = await companyUpdateProfile(payload);
      if (res && res.data && res.data.company) setProfile(res.data.company);
      else { 
        const r = await companyGetProfile(); 
        setProfile(r.data || r.data.profile || r.data.company); 
      }
      alert('Profile updated');
    } catch (e) { alert('Update failed'); }
    setSaving(false);
  };

  const handleLogoChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setLogoFile(f);
  };

  const uploadLogo = async () => {
    if (!logoFile) return alert('Select a logo first');
    setUploadingLogo(true);
    try {
      await uploadProfilePhoto(logoFile);
      const r = await companyGetProfile();
      setProfile(r.data || r.data.profile || r.data.company);
      setLogoFile(null);
      alert('Logo uploaded');
    } catch (err) { alert('Logo upload failed'); }
    setUploadingLogo(false);
  };

  const handleCompanyFileChange = (field) => (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setCompanyFiles((c) => ({ ...c, [field]: f }));
  };

  const uploadCompanyDocs = async () => {
    const fd = new FormData();
    if (companyFiles.company_profile_pdf) fd.append('company_profile_pdf', companyFiles.company_profile_pdf);
    if (companyFiles.registration_certificate) fd.append('registration_certificate', companyFiles.registration_certificate);
    if (companyFiles.logo) fd.append('logo', companyFiles.logo);
    if (!Object.keys(companyFiles).length) return alert('Select at least one file');
    setUploadingDocs(true);
    try {
      await companyUploadDocuments(fd);
      const r = await companyGetProfile();
      setProfile(r.data || r.data.profile || r.data.company);
      setCompanyFiles({});
      alert('Documents uploaded');
    } catch (err) { alert('Upload failed'); }
    setUploadingDocs(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  const inputClass = "w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all bg-slate-50/50";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1";

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Organization Profile</h2>
          <p className="text-slate-500 font-medium">Manage your company's identity and verification documents.</p>
        </div>
        <button 
          disabled={saving} 
          onClick={handleSave} 
          className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
        >
          {saving ? 'Saving...' : <><FiCheck /> Save Changes</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Branding & Docs */}
        <div className="space-y-6">
          {/* Logo Section */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h4 className={labelClass}>Branding</h4>
            <div className="flex flex-col items-center">
              <div className="relative group w-32 h-32 mb-4">
                <div className="w-full h-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                  {profile.documents?.logo ? (
                    <img src={profile.documents.logo} alt="logo" className="w-full h-full object-contain" />
                  ) : (
                    <FiUploadCloud className="text-slate-300 text-3xl" />
                  )}
                </div>
              </div>
              <input type="file" accept="image/*" id="logo-upload" className="hidden" onChange={handleLogoChange} />
              <label htmlFor="logo-upload" className="cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-800 mb-2">
                {logoFile ? logoFile.name : "Choose New Logo"}
              </label>
              <div className="flex gap-2 w-full mt-2">
                <button 
                  disabled={uploadingLogo} 
                  onClick={uploadLogo} 
                  className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black hover:bg-emerald-100 transition-all"
                >
                  {uploadingLogo ? '...' : 'Upload'}
                </button>
                <a target="_blank" rel="noreferrer" href={`/company/${profile._id || ''}`} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-600 border border-slate-100">
                  <FiEye />
                </a>
              </div>
            </div>
          </div>

          {/* Verification Documents */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h4 className={labelClass}>Verification Docs</h4>
            <div className="space-y-4">
              {[
                { label: 'Company Profile (PDF)', field: 'company_profile_pdf', accept: 'application/pdf' },
                { label: 'Business Certificate', field: 'registration_certificate', accept: 'application/pdf' }
              ].map((doc) => (
                <div key={doc.field}>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">{doc.label}</label>
                  <input 
                    type="file" 
                    accept={doc.accept} 
                    onChange={handleCompanyFileChange(doc.field)}
                    className="text-[10px] text-slate-500 block w-full file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-slate-100 file:text-slate-600 hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>
              ))}
              <button 
                disabled={uploadingDocs} 
                onClick={uploadCompanyDocs} 
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-black transition-all shadow-lg shadow-slate-200 mt-2"
              >
                {uploadingDocs ? 'Uploading...' : 'Update Documents'}
              </button>
              {profile.documents?.profile_pdf && (
                <a href={profile.documents.profile_pdf} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-[11px] font-bold text-indigo-600 mt-2">
                  <FiFileText /> View Current Profile PDF
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Company Info Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelClass}>Company Name *</label>
                <div className="relative">
                  <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className={`${inputClass} pl-10`} value={profile.company_name || ''} onChange={e => setProfile({ ...profile, company_name: e.target.value })} />
                </div>
              </div>
              
              <div>
                <label className={labelClass}>Official Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className={`${inputClass} pl-10`} value={profile.company_email || ''} onChange={e => setProfile({ ...profile, company_email: e.target.value })} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Contact Number</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className={`${inputClass} pl-10`} value={profile.phone || ''} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Headquarters Address</label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className={`${inputClass} pl-10`} value={profile.address || ''} onChange={e => setProfile({ ...profile, address: e.target.value })} />
                </div>
              </div>

              <div>
                <label className={labelClass}>City</label>
                <input className={inputClass} value={profile.city || ''} onChange={e => setProfile({ ...profile, city: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>State</label>
                  <input className={inputClass} value={profile.state || ''} onChange={e => setProfile({ ...profile, state: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <input className={inputClass} value={profile.country || ''} onChange={e => setProfile({ ...profile, country: e.target.value })} />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Website URL</label>
                <input className={inputClass} value={profile.website || ''} placeholder="https://company.com" onChange={e => setProfile({ ...profile, website: e.target.value })} />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>About Company</label>
                <textarea rows="4" className={`${inputStyle} resize-none`} value={profile.description || ''} placeholder="Tell candidates about your company mission and culture..." onChange={e => setProfile({ ...profile, description: e.target.value })} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyProfile;