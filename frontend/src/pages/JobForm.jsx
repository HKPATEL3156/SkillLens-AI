import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { companyCreateJobMultipart, companyUpdateJobMultipart, companyGetJob } from '../services/api';

const defaultForm = {
  // Basic Info
  title: '', job_role: '', job_category: '', description: '',
  // Skills (Array-based in schema)
  required_skills: '', preferred_skills: '',
  // Positions & Type
  totalPositions: 1, job_type: 'full-time', work_mode: 'onsite',
  // Location (Nested in schema)
  city: '', state: '', country: '', address: '',
  // Experience (Nested in schema)
  min_exp: 0, max_exp: 50,
  // Education (Nested in schema)
  education_degree: '', education_field: '',
  // Scoring
  minimum_skill_score: 0, skill_score_weight: 70,
  // Salary & Perks
  salary_type: 'fixed', salary_min: '', salary_max: '', currency: 'INR', perks: '',
  // Responsibilities & Benefits
  responsibilities: '', benefits: '',
  // Job description & Selection
  job_description_text: '', selection_rounds: '', interview_mode: 'online',
  // Rules
  application_deadline: '', max_applicants: '', allow_resume_upload: true,
  // Company policies (Nested in schema)
  bond_required: false, bond_duration: '', notice_period: '',
  // Visibility & Status
  job_status: 'draft', visibility: 'public'
};

const FullJobForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  
  // File states
  const [jobPdf, setJobPdf] = useState(null);
  const [policyPdf, setPolicyPdf] = useState(null);

  useEffect(() => {
    if (!id) return;
    companyGetJob(id).then(res => {
      const j = res.data.job || {};
      setForm({
        ...defaultForm,
        title: j.title || '', job_role: j.job_role || '', job_category: j.job_category || '', description: j.description || '',
        required_skills: (j.required_skills || []).join(', '), preferred_skills: (j.preferred_skills || []).join(', '),
        totalPositions: j.totalPositions || 1, job_type: j.job_type || 'full-time', work_mode: j.work_mode || 'onsite',
        city: j.location?.city || '', state: j.location?.state || '', country: j.location?.country || '', address: j.location?.address || '',
        min_exp: j.experience_required?.min_exp ?? 0, max_exp: j.experience_required?.max_exp ?? 50,
        education_degree: j.education_required?.degree || '', education_field: j.education_required?.field || '',
        minimum_skill_score: j.minimum_skill_score || 0, skill_score_weight: j.skill_score_weight || 70,
        salary_type: j.salary_type || 'fixed', salary_min: j.salary_min || '', salary_max: j.salary_max || '', currency: j.currency || 'INR', 
        perks: (j.perks || []).join(', '), responsibilities: j.responsibilities || '', benefits: (j.benefits || []).join(', '),
        job_description_text: j.job_description_text || '', selection_rounds: (j.selection_rounds || []).join(', '),
        interview_mode: j.interview_mode || 'online',
        application_deadline: j.application_deadline ? j.application_deadline.split('T')[0] : '',
        max_applicants: j.max_applicants || '', allow_resume_upload: j.allow_resume_upload !== false,
        bond_required: j.company_policy?.bond_required || false,
        bond_duration: j.company_policy?.bond_duration || '', notice_period: j.company_policy?.notice_period || '',
        job_status: j.job_status || 'draft', visibility: j.visibility || 'public',
      });
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    
    // Append all text fields
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    
    // Append files
    if (jobPdf) fd.append('job_description_pdf', jobPdf);
    if (policyPdf) fd.append('company_policy_pdf', policyPdf);

    try {
      if (id) await companyUpdateJobMultipart(id, fd);
      else await companyCreateJobMultipart(fd);
      navigate('/company/jobs');
    } catch (err) {
      alert(err.response?.data?.error || "Error processing request");
    } finally { setSaving(false); }
  };

  const cardStyle = "bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 mb-8";
  const labelStyle = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1";
  const inputStyle = "w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-700 focus:bg-white";

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-xl">BOOTING RECRUITMENT ENGINE...</div>;

  return (
    <div className="min-h-screen bg-[#FBFDFF] py-12 px-4 md:px-10">
      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-12 gap-6">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
              {id ? 'Modify Campaign' : 'Launch New Opening'}
            </h1>
            <p className="text-slate-500 font-bold mt-1 uppercase text-xs tracking-widest">Powered by SkillLens AI Matching</p>
          </div>
          <div className="flex gap-4 w-full lg:w-auto">
            <button type="button" onClick={() => navigate(-1)} className="flex-1 lg:flex-none px-8 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all">Discard</button>
            <button disabled={saving} className="flex-1 lg:flex-none px-12 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
              {saving ? 'Processing...' : 'Deploy Job Post'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* MAIN CONTENT AREA */}
          <div className="lg:col-span-8">
            
            {/* 1. CORE IDENTITY */}
            <div className={cardStyle}>
              <div className="flex items-center gap-4 mb-8">
                <span className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black">01</span>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Job Identity</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className={labelStyle}>Job Title *</label>
                  <input required className={inputStyle} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Lead Software Engineer" />
                </div>
                <div>
                  <label className={labelStyle}>Specific Role</label>
                  <input className={inputStyle} value={form.job_role} onChange={e => setForm({...form, job_role: e.target.value})} placeholder="e.g. Frontend Architect" />
                </div>
                <div>
                  <label className={labelStyle}>Job Category</label>
                  <input className={inputStyle} value={form.job_category} onChange={e => setForm({...form, job_category: e.target.value})} placeholder="e.g. IT & Fintech" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelStyle}>Brief Teaser (SEO Description)</label>
                  <textarea rows="3" className={inputStyle} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="2-3 sentences for social sharing..." />
                </div>
              </div>
            </div>

            {/* 2. SKILLS & AI SCORING */}
            <div className={cardStyle}>
              <div className="flex items-center gap-4 mb-8">
                <span className="w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center font-black">02</span>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Matching Logic</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className={labelStyle}>Mandatory Skills * (Comma separated)</label>
                  <input required className={inputStyle} value={form.required_skills} onChange={e => setForm({...form, required_skills: e.target.value})} placeholder="React, Tailwind, Node.js" />
                </div>
                <div>
                  <label className={labelStyle}>Preferred Skills</label>
                  <input className={inputStyle} value={form.preferred_skills} onChange={e => setForm({...form, preferred_skills: e.target.value})} placeholder="Docker, AWS Lambda" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={labelStyle}>Minimum Skill Score (%)</label>
                    <input type="number" className={inputStyle} value={form.minimum_skill_score} onChange={e => setForm({...form, minimum_skill_score: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelStyle}>AI Weightage (%)</label>
                    <input type="number" className={inputStyle} value={form.skill_score_weight} onChange={e => setForm({...form, skill_score_weight: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. EXPERIENCE & EDUCATION */}
            <div className={cardStyle}>
              <div className="flex items-center gap-4 mb-8">
                <span className="w-10 h-10 bg-purple-600 text-white rounded-2xl flex items-center justify-center font-black">03</span>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Qualifications</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelStyle}>Min Exp (Years)</label>
                  <input type="number" className={inputStyle} value={form.min_exp} onChange={e => setForm({...form, min_exp: e.target.value})} />
                </div>
                <div>
                  <label className={labelStyle}>Max Exp (Years)</label>
                  <input type="number" className={inputStyle} value={form.max_exp} onChange={e => setForm({...form, max_exp: e.target.value})} />
                </div>
                <div>
                  <label className={labelStyle}>Required Degree</label>
                  <input className={inputStyle} value={form.education_degree} onChange={e => setForm({...form, education_degree: e.target.value})} placeholder="B.E. / B.Tech" />
                </div>
                <div>
                  <label className={labelStyle}>Field of Study</label>
                  <input className={inputStyle} value={form.education_field} onChange={e => setForm({...form, education_field: e.target.value})} placeholder="Computer Science" />
                </div>
              </div>
            </div>

            {/* 4. RESPONSIBILITIES & SELECTION */}
            <div className={cardStyle}>
              <div className="flex items-center gap-4 mb-8">
                <span className="w-10 h-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center font-black">04</span>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Responsibilities & Process</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className={labelStyle}>Primary Responsibilities</label>
                  <textarea rows="5" className={inputStyle} value={form.responsibilities} onChange={e => setForm({...form, responsibilities: e.target.value})} placeholder="What will the candidate do on a daily basis?" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelStyle}>Selection Rounds (Comma separated)</label>
                    <input className={inputStyle} value={form.selection_rounds} onChange={e => setForm({...form, selection_rounds: e.target.value})} placeholder="Online Quiz, Technical, HR" />
                  </div>
                  <div>
                    <label className={labelStyle}>Interview Mode</label>
                    <select className={inputStyle} value={form.interview_mode} onChange={e => setForm({...form, interview_mode: e.target.value})}>
                      <option value="online">Online / Virtual</option>
                      <option value="offline">Face-to-Face</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SIDEBAR AREA */}
          <div className="lg:col-span-4">
            
            {/* LOGISTICS PANEL */}
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl mb-8">
              <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-6">Logistics & Publication</h3>
              <div className="space-y-5">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase mb-2 block">Work Arrangement</label>
                  <select className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none cursor-pointer" value={form.work_mode} onChange={e => setForm({...form, work_mode: e.target.value})}>
                    <option value="onsite">On-site</option>
                    <option value="remote">Fully Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase mb-2 block">Job Duration</label>
                  <select className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none cursor-pointer" value={form.job_type} onChange={e => setForm({...form, job_type: e.target.value})}>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="internship">Internship</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase mb-2 block">Application Deadline *</label>
                  <input required type="date" className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none" value={form.application_deadline} onChange={e => setForm({...form, application_deadline: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                   <div className="bg-slate-800 p-3 rounded-xl">
                      <label className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Status</label>
                      <select className="bg-transparent text-[10px] font-bold outline-none w-full" value={form.job_status} onChange={e => setForm({...form, job_status: e.target.value})}>
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                      </select>
                   </div>
                   <div className="bg-slate-800 p-3 rounded-xl">
                      <label className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Visibility</label>
                      <select className="bg-transparent text-[10px] font-bold outline-none w-full" value={form.visibility} onChange={e => setForm({...form, visibility: e.target.value})}>
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                   </div>
                </div>
              </div>
            </div>

            {/* LOCATION CARD */}
            <div className={cardStyle}>
              <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 uppercase text-xs tracking-tighter italic">📍 Office Location</h3>
              <div className="space-y-4">
                <input className={inputStyle} value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="City" />
                <input className={inputStyle} value={form.state} onChange={e => setForm({...form, state: e.target.value})} placeholder="State" />
                <input className={inputStyle} value={form.country} onChange={e => setForm({...form, country: e.target.value})} placeholder="Country" />
                <input className={inputStyle} value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Full Address" />
              </div>
            </div>

            {/* COMPENSATION CARD */}
            <div className={cardStyle}>
              <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 uppercase text-xs tracking-tighter italic">💰 Compensation</h3>
              <div className="space-y-4">
                <select className={inputStyle} value={form.salary_type} onChange={e => setForm({...form, salary_type: e.target.value})}>
                   <option value="fixed">Fixed CTC</option>
                   <option value="range">Salary Range</option>
                </select>
                <div className="flex gap-2">
                  <input type="number" className={inputStyle} placeholder="Min" value={form.salary_min} onChange={e => setForm({...form, salary_min: e.target.value})} />
                  <input type="number" className={inputStyle} placeholder="Max" value={form.salary_max} onChange={e => setForm({...form, salary_max: e.target.value})} />
                </div>
                <input className={inputStyle} placeholder="Perks (e.g. Stocks, Bonus)" value={form.perks} onChange={e => setForm({...form, perks: e.target.value})} />
              </div>
            </div>

            {/* FILES CARD */}
            <div className={cardStyle}>
              <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 uppercase text-xs tracking-tighter italic">📄 Official Documents</h3>
              <div className="space-y-4">
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-slate-50/50 hover:border-blue-400 transition-all cursor-pointer relative">
                  <input type="file" required={!id} className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setJobPdf(e.target.files[0])} />
                  <span className="text-[9px] font-black text-slate-400 block uppercase">Full Job Description (PDF) *</span>
                  <span className="text-xs font-bold text-blue-600 truncate block mt-2">{jobPdf?.name || 'Choose File'}</span>
                </div>
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-slate-50/50 hover:border-blue-400 transition-all cursor-pointer relative">
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setPolicyPdf(e.target.files[0])} />
                  <span className="text-[9px] font-black text-slate-400 block uppercase">Policy Document (PDF)</span>
                  <span className="text-xs font-bold text-blue-600 truncate block mt-2">{policyPdf?.name || 'Choose File'}</span>
                </div>
              </div>
            </div>

            {/* COMPANY POLICY */}
            <div className={cardStyle}>
              <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 uppercase text-xs tracking-tighter italic">⚖️ Terms & Policy</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-600 uppercase">Bond Required?</span>
                  <input type="checkbox" className="w-5 h-5 accent-blue-600" checked={form.bond_required} onChange={e => setForm({...form, bond_required: e.target.checked})} />
                </div>
                <input className={inputStyle} value={form.bond_duration} onChange={e => setForm({...form, bond_duration: e.target.value})} placeholder="Bond Duration (e.g. 1 Year)" />
                <input className={inputStyle} value={form.notice_period} onChange={e => setForm({...form, notice_period: e.target.value})} placeholder="Notice Period (e.g. 30 Days)" />
              </div>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
};

export default FullJobForm;