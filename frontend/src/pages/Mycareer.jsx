import React, { useState, useEffect } from "react";
import { 
  FiTarget, FiBriefcase, FiAward, FiCpu, 
  FiFileText, FiPlus, FiTrash2, FiDownload, FiUploadCloud, FiX 
} from "react-icons/fi";
import { HiOutlineLightBulb } from "react-icons/hi2";
import { getCareer, updateCareer, uploadResume, downloadResume, getProfile, patchProfile } from "../services/api";

const MyCareer = () => {
  const [form, setForm] = useState({
    careerGoal: "", preferredRole: "", expectedSalary: "",
    skills: [], certifications: [],
    workExperience: [{ company: "", role: "", startDate: "", endDate: "", duration: "", description: "", technologies: [] }],
    education: [{ institution: "", degree: "", fieldOfStudy: "", startYear: "", endYear: "" }],
    projects: [{ title: "", description: "", technologies: [], link: "" }],
    achievements: [],
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeName, setResumeName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => { fetchCareer(); }, []);

  const fetchCareer = async () => {
    setError("");
    try {
      const [careerRes, profileRes] = await Promise.allSettled([getCareer(), getProfile()]);
      const careerData = careerRes.status === 'fulfilled' ? (careerRes.value.data || {}) : {};
      const profileData = profileRes.status === 'fulfilled' ? (profileRes.value.data || {}) : {};

      const formatDateForInput = (v) => {
        if (!v) return "";
        const parsed = new Date(v);
        if (isNaN(parsed)) return "";
        return parsed.toISOString().substring(0, 10);
      };

      const mapExperience = (arr) => {
        if (!Array.isArray(arr)) return [{ company: "", role: "", startDate: "", endDate: "", duration: "", description: "", technologies: [] }];
        return arr.map((ex) => ({
          company: ex.company || ex.companyName || "",
          role: ex.role || ex.title || "",
          startDate: formatDateForInput(ex.startDate || ex.from || ex.start_date),
          endDate: formatDateForInput(ex.endDate || ex.to || ex.end_date),
          duration: ex.duration || "",
          description: ex.description || "",
          technologies: Array.isArray(ex.technologies) ? ex.technologies : (Array.isArray(ex.skills) ? ex.skills : []),
        }));
      };

      setForm({
        ...form,
        careerGoal: careerData.careerGoal || "",
        preferredRole: careerData.preferredRole || profileData.preferredRole || "",
        expectedSalary: careerData.expectedSalary || profileData.expectedSalary || "",
        skills: profileData.skills || careerData.skills || [],
        workExperience: mapExperience(profileData.experience || careerData.experience),
        education: profileData.education || careerData.education || form.education,
        projects: careerData.projects || form.projects,
        achievements: careerData.achievements || [],
      });
      setResumeName(careerData.resumeUrl?.split("/").pop() || profileData.resumeFilePath?.split("/").pop() || "");
    } catch { setError("Failed to fetch data"); }
  };

  const handleNestedChange = (index, field, value, key) => {
    const updatedArray = [...form[key]];
    updatedArray[index][field] = value;
    setForm({ ...form, [key]: updatedArray });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      const careerPayload = { ...form, experience: form.workExperience.map(we => ({
        company: we.company, role: we.role, duration: we.duration, description: we.description
      }))};
      await updateCareer(careerPayload);
      await patchProfile({ 
        skills: form.skills, 
        experience: form.workExperience, 
        education: form.education,
        preferredRole: form.preferredRole,
        expectedSalary: form.expectedSalary
      });
      setSuccess("Profile synchronized successfully");
    } catch { setError("Update failed"); }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) return setError("Select a file first");
    try {
      const res = await uploadResume(resumeFile);
      const newSkills = res?.data?.skills || [];
      const newResumeUrl = res?.data?.resumeFilePath || "";
      setForm(prev => ({
        ...prev,
        skills: newSkills.length > 0 ? newSkills : prev.skills,
      }));
      if (newResumeUrl) setResumeName(newResumeUrl.split("/").pop());
      setSuccess(`Resume processed successfully! ${newSkills.length ? `${newSkills.length} skills synchronized.` : ''}`);
      setResumeFile(null);
    } catch { setError("Upload failed"); }
  };

  const handleDownloadResume = async () => {
    setError("");
    try {
      const resp = await downloadResume();
      const blob = new Blob([resp.data], { type: resp.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resumeName || 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError('Download failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans text-slate-900">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 px-8 py-4 mb-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <FiBriefcase size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-none">Career Studio</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Professional Portfolio Management</p>
            </div>
          </div>
          <button onClick={handleSubmit} className="bg-slate-900 hover:bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-xl shadow-slate-200">
            Sync Profile
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: FIXED ASIDE */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* RESUME CARD */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[5rem] -mr-10 -mt-10 opacity-50" />
            <h3 className="text-sm font-black uppercase text-slate-400 mb-6 flex items-center gap-2">
              <FiFileText className="text-indigo-600" /> Resume Sync
            </h3>
            
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center group hover:border-indigo-400 transition-all">
              <FiUploadCloud size={32} className="mx-auto text-slate-300 mb-2 group-hover:text-indigo-500 transition-colors" />
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">{resumeName || "No Resume Detected"}</p>
              
              <label className="block w-full bg-white border border-slate-200 hover:bg-slate-50 py-3 rounded-xl cursor-pointer font-bold text-sm transition-all mb-3">
                {resumeFile ? resumeFile.name : "Choose PDF"}
                <input type="file" className="hidden" onChange={e => setResumeFile(e.target.files[0])} />
              </label>
              
              <div className="flex gap-2">
                <button onClick={handleResumeUpload} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold">Process</button>
                <button onClick={handleDownloadResume} className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg text-xs font-bold">Download</button>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 leading-relaxed italic">Processing your resume automatically updates your skill ecosystem.</p>
          </div>

          {/* QUICK TARGETS */}
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <FiTarget className="text-indigo-400" /> Preferences
            </h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-tighter">Target Role</label>
                <input name="preferredRole" value={form.preferredRole} onChange={e => setForm({...form, preferredRole: e.target.value})} className="w-full bg-white/5 border-b border-white/10 py-2 outline-none focus:border-indigo-400 font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-tighter">Expected LPA</label>
                <input name="expectedSalary" value={form.expectedSalary} onChange={e => setForm({...form, expectedSalary: e.target.value})} className="w-full bg-white/5 border-b border-white/10 py-2 outline-none focus:border-indigo-400 font-bold" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MAIN FEED */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* MESSAGES */}
          {(error || success) && (
            <div className={`p-4 rounded-2xl font-bold text-sm animate-in fade-in slide-in-from-top-2 ${error ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {error || success}
            </div>
          )}

          {/* CAREER GOAL */}
          <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <HiOutlineLightBulb className="text-amber-500 text-2xl" />
              <h2 className="text-xl font-black text-slate-900">Career Narrative</h2>
            </div>
            <textarea 
              name="careerGoal" 
              value={form.careerGoal} 
              onChange={e => setForm({...form, careerGoal: e.target.value})} 
              className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-6 min-h-[120px] focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none leading-relaxed"
              placeholder="What is your professional mission?"
            />
          </section>

          {/* SKILLS */}
          <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FiCpu className="text-indigo-600 text-2xl" />
                <h2 className="text-xl font-black text-slate-900">Skill Ecosystem</h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                🛡️ Resume Verified ({form.skills?.length || 0})
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 mb-5 text-xs text-slate-600 flex items-start gap-2.5">
              <span className="text-indigo-600 text-base flex-shrink-0">🔒</span>
              <p className="leading-relaxed">
                <strong className="text-slate-800">Verified Credentials:</strong> Skills are extracted and verified directly from your uploaded resume. To add, modify, or update skills, please upload your latest resume in the <em>Resume Sync</em> card.
              </p>
            </div>

            {form.skills && form.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {form.skills.map((skill, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold border border-indigo-150/60 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    {skill}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                No skills detected yet. Upload your resume to extract skills automatically.
              </div>
            )}
          </section>

          {/* EXPERIENCE */}
          <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <FiBriefcase className="text-indigo-600 text-2xl" />
                <h2 className="text-xl font-black text-slate-900">Professional Experience</h2>
              </div>
              <button 
                onClick={() => setForm({...form, workExperience: [...form.workExperience, {company: "", role: "", startDate: "", endDate: "", description: "", technologies: []}]})}
                className="text-indigo-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all"
              >
                <FiPlus /> Add Record
              </button>
            </div>
            
            <div className="space-y-6">
              {form.workExperience.map((exp, i) => (
                <div key={i} className="group p-6 rounded-[2rem] border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-xl transition-all relative">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input placeholder="Company Name" value={exp.company} onChange={e => handleNestedChange(i, 'company', e.target.value, 'workExperience')} className="bg-transparent font-black text-lg outline-none border-b border-transparent focus:border-indigo-600" />
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 justify-end">
                      <input type="date" value={exp.startDate} onChange={e => handleNestedChange(i, 'startDate', e.target.value, 'workExperience')} className="bg-white px-2 py-1 rounded" />
                      <span>—</span>
                      <input type="date" value={exp.endDate} onChange={e => handleNestedChange(i, 'endDate', e.target.value, 'workExperience')} className="bg-white px-2 py-1 rounded" />
                    </div>
                  </div>
                  <input placeholder="Role / Title" value={exp.role} onChange={e => handleNestedChange(i, 'role', e.target.value, 'workExperience')} className="w-full bg-transparent font-bold text-indigo-600 mb-4 outline-none border-b border-transparent focus:border-indigo-600" />
                  <textarea placeholder="Job impact and responsibilities..." value={exp.description} onChange={e => handleNestedChange(i, 'description', e.target.value, 'workExperience')} className="w-full bg-white/50 border border-slate-100 rounded-xl p-4 text-sm leading-relaxed mb-4 outline-none focus:bg-white focus:border-indigo-600" />
                  
                  <div className="flex flex-wrap gap-2">
                    {exp.technologies.map((t, idx) => <span key={idx} className="bg-white px-3 py-1 rounded-lg text-[10px] font-black uppercase text-slate-500 border border-slate-100">{t}</span>)}
                  </div>
                  
                  <button onClick={() => setForm({...form, workExperience: form.workExperience.filter((_, idx) => idx !== i)})} className="absolute top-4 right-4 text-slate-200 hover:text-rose-500"><FiTrash2 /></button>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default MyCareer;