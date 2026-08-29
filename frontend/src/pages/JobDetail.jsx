import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicJob, applyToJob } from "../services/api";
import {
  FaBriefcase,
  FaMapMarkerAlt,
  FaDollarSign,
  FaCalendarAlt,
  FaGraduationCap,
  FaShieldAlt,
  FaCloudUploadAlt,
  FaFileAlt,
} from "react-icons/fa";

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getPublicJob(id);
        setJob(res.data.job);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const onApply = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      alert("Please upload your resume to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("coverLetter", coverLetter);
      form.append("resume", resumeFile);
      const res = await applyToJob(id, form);
      if (res.status === 201) {
        alert("Application submitted successfully!");
        navigate('/dashboard/activity');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to apply");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse text-indigo-600 font-medium">Loading Job Details...</div>
    </div>
  );

  if (!job) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-500 text-lg">Job post not found or has been removed.</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* --- Header Section --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 bg-gray-50 border border-gray-100 flex items-center justify-center rounded-2xl overflow-hidden flex-shrink-0">
              {job.companyId?.documents?.logo ? (
                <img src={job.companyId.documents.logo} alt="logo" className="w-full h-full object-contain p-2" />
              ) : (
                <FaBriefcase className="w-10 h-10 text-gray-300" />
              )}
            </div>
            <div className="flex-grow">
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">{job.title}</h1>
              <div className="mt-2 flex flex-wrap gap-y-2 gap-x-4 text-gray-600 items-center">
                <span className="flex items-center gap-1.5 font-medium text-indigo-600">
                  {job.companyId?.company_name}
                </span>
                <span className="hidden md:block text-gray-300">|</span>
                <span className="flex items-center gap-1.5 text-sm">
                  <FaMapMarkerAlt className="w-4 h-4" /> 
                  {job.location?.city}, {job.location?.country}
                </span>
                <span className="flex items-center gap-1.5 text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium">
                  {job.job_type}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- Main Content --- */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Description */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-4">About the Role</h3>
              <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed">
                {job.job_description_text || job.responsibilities}
              </div>
              
              <div className="mt-8">
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {(job.required_skills || []).map((s, i) => (
                    <span key={i} className="px-4 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg font-medium border border-gray-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* Application Form */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Apply for this position</h3>
              <form onSubmit={onApply} className="space-y-6">
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Resume / CV <span className="text-red-500">*</span></label>
                  <div className={`relative border-2 border-dashed rounded-xl p-6 transition-colors ${resumeFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-indigo-400'}`}>
                    <input 
                      type="file" 
                      required
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setResumeFile(e.target.files[0])}
                    />
                    <div className="text-center">
                      {resumeFile ? (
                        <div className="flex flex-col items-center">
                          <FaFileAlt className="w-10 h-10 text-green-600 mb-2" />
                          <p className="text-sm font-medium text-green-700">{resumeFile.name}</p>
                          <p className="text-xs text-green-600 mt-1">Click or drag to replace</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <FaCloudUploadAlt className="w-10 h-10 text-gray-400 mb-2" />
                          <p className="text-sm font-medium text-gray-900">Upload your Resume</p>
                          <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX up to 10MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Letter</label>
                  <textarea
                    placeholder="Tell the hiring manager why you're a great fit..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="w-full border-gray-200 border rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    rows={5}
                  />
                </div>

                <button 
                  disabled={submitting} 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 disabled:bg-gray-400 disabled:transform-none"
                >
                  {submitting ? 'Processing Application...' : 'Submit Application'}
                </button>
              </form>
            </section>
          </div>

          {/* --- Sidebar Content --- */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h4 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                Job Overview
              </h4>
              <ul className="space-y-5">
                <li className="flex gap-4">
                  <FaDollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-tighter">Salary Range</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {job.salary_min ? `${job.currency || '$'} ${job.salary_min.toLocaleString()} - ${job.salary_max?.toLocaleString()}` : 'Not Disclosed'}
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <FaBriefcase className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-tighter">Experience</p>
                    <p className="text-sm font-semibold text-gray-900">{job.experience_required?.min_exp}-{job.experience_required?.max_exp} Years</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <FaGraduationCap className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-tighter">Education</p>
                    <p className="text-sm font-semibold text-gray-900">{job.education_required?.degree || 'Any Degree'}</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <FaCalendarAlt className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-tighter">Deadline</p>
                    <p className="text-sm font-semibold text-red-600">
                      {job.application_deadline ? new Date(job.application_deadline).toLocaleDateString() : 'Rolling Basis'}
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-indigo-900 rounded-xl shadow-sm p-6 text-white">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <FaShieldAlt className="w-5 h-5 text-indigo-300" />
                Company Policy
              </h4>
              <div className="space-y-3 text-sm opacity-90">
                <div className="flex justify-between border-b border-indigo-800 pb-2">
                  <span>Bond Required</span>
                  <span className="font-bold">{job.company_policy?.bond_required ? 'Yes' : 'No'}</span>
                </div>
                {job.company_policy?.bond_duration && (
                  <div className="flex justify-between border-b border-indigo-800 pb-2">
                    <span>Duration</span>
                    <span className="font-bold">{job.company_policy.bond_duration}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Notice Period</span>
                  <span className="font-bold">{job.company_policy?.notice_period || 'Standard'}</span>
                </div>
              </div>
            </div>

            {job.documents?.job_description_pdf && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                 <h4 className="font-bold text-gray-900 mb-3">Official JD</h4>
                 <a 
                   href={job.documents.job_description_pdf} 
                   target="_blank" 
                   rel="noreferrer"
                   className="flex items-center justify-center gap-2 w-full py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
                 >
                   <FaFileAlt className="w-5 h-5" />
                   View Document
                 </a>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default JobDetail;