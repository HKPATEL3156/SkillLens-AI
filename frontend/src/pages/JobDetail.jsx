import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getPublicJob,
  applyToJob,
  getMyApplicationForJob,
  getProfile,
} from "../services/api";
import {
  FiBriefcase,
  FiMapPin,
  FiDollarSign,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiFileText,
  FiUploadCloud,
  FiAlertCircle,
  FiArrowLeft,
  FiShield,
  FiUsers,
  FiCheck,
  FiDownload,
  FiExternalLink,
  FiAward,
  FiSend,
  FiGlobe,
  FiLock,
  FiMail,
  FiPhone,
} from "react-icons/fi";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { formatSalary } from "../utils/salary";

const backendBase = import.meta?.env?.VITE_API_BASE || "http://localhost:5000";

const resolveAsset = (p) => {
  if (!p) return null;
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  const clean = p.startsWith("/") ? p : `/${p}`;
  return `${backendBase}${clean}`;
};

const getStageBadge = (stage, status) => {
  const effective = (stage || status || "applied").toLowerCase();

  if (effective === "selected" || effective === "hired") {
    return {
      label: "Selected / Hired",
      bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
      pill: "bg-emerald-500",
      step: 4,
      desc: "Congratulations! The hiring team has accepted your application.",
    };
  }
  if (effective === "interview") {
    return {
      label: "Interview Stage",
      bg: "bg-purple-50 border-purple-200 text-purple-800",
      pill: "bg-purple-500",
      step: 3,
      desc: "You have been advanced to the interview rounds with the hiring manager.",
    };
  }
  if (effective === "shortlisted") {
    return {
      label: "Shortlisted",
      bg: "bg-indigo-50 border-indigo-200 text-indigo-800",
      pill: "bg-indigo-500",
      step: 2,
      desc: "Your profile has been shortlisted and is being reviewed by the team.",
    };
  }
  if (effective === "rejected") {
    return {
      label: "Not Selected",
      bg: "bg-rose-50 border-rose-200 text-rose-800",
      pill: "bg-rose-500",
      step: -1,
      desc: "The hiring team has moved forward with other applicants for this opening.",
    };
  }
  return {
    label: "Application Under Review",
    bg: "bg-amber-50 border-amber-200 text-amber-800",
    pill: "bg-amber-500",
    step: 1,
    desc: "Your application is successfully received and queued for recruiter review.",
  };
};

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  // Existing application if candidate already applied
  const [existingApp, setExistingApp] = useState(null);
  const [checkingApp, setCheckingApp] = useState(true);

  // Candidate pre-fetched profile data
  const [profile, setProfile] = useState(null);

  // Form states
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeMode, setResumeMode] = useState("profile"); // 'profile' or 'custom'
  const [customResumeFile, setCustomResumeFile] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [applySuccessMessage, setApplySuccessMessage] = useState("");
  const [applyErrorMessage, setApplyErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadJobAndApplicantStatus = async () => {
      setLoading(true);
      try {
        const jobRes = await getPublicJob(id);
        if (!mounted) return;
        setJob(jobRes.data.job);

        // Pre-select job required skills that match
        const req = jobRes.data.job?.required_skills || [];
        setSelectedSkills(req);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }

      // Check if user is logged in and whether they already applied
      const token = localStorage.getItem("token");
      if (token) {
        setCheckingApp(true);
        try {
          const appRes = await getMyApplicationForJob(id);
          if (mounted && appRes.data?.applied) {
            setExistingApp(appRes.data.application);
          }
        } catch (e) {
          // not applied or unauthenticated
        }

        // Fetch candidate profile to pre-fill application
        try {
          const profRes = await getProfile();
          const u = profRes.data?.user || profRes.data;
          if (mounted && u) {
            setProfile(u);
            if (!u.resumeFilePath && !u.resumePath) {
              setResumeMode("custom");
            }
          }
        } catch (e) {
          if (mounted) setResumeMode("custom");
        } finally {
          if (mounted) setCheckingApp(false);
        }
      } else {
        setCheckingApp(false);
        setResumeMode("custom");
      }
    };

    loadJobAndApplicantStatus();
    return () => {
      mounted = false;
    };
  }, [id]);

  const onApply = async (e) => {
    e.preventDefault();
    setApplyErrorMessage("");
    setApplySuccessMessage("");

    // Validate resume availability
    const hasProfileResume = Boolean(profile?.resumeFilePath || profile?.resumePath);
    if (resumeMode === "profile" && !hasProfileResume) {
      setApplyErrorMessage("No profile resume found on file. Please upload a resume.");
      setResumeMode("custom");
      return;
    }

    if (resumeMode === "custom" && !customResumeFile) {
      setApplyErrorMessage("Please select a resume file to upload.");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("coverLetter", coverLetter);

      if (selectedSkills.length) {
        selectedSkills.forEach((s) => form.append("skills", s));
      }

      if (resumeMode === "custom" && customResumeFile) {
        form.append("resume", customResumeFile);
      } else if (hasProfileResume) {
        form.append("resumePath", profile.resumeFilePath || profile.resumePath);
      }

      const res = await applyToJob(id, form);
      if (res.status === 201 || res.data?.application) {
        setApplySuccessMessage("Application submitted successfully!");
        setExistingApp(res.data.application || { createdAt: new Date() });
      }
    } catch (err) {
      console.error(err);
      setApplyErrorMessage(
        err.response?.data?.error || "Failed to submit application. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-slate-500 font-bold text-sm tracking-wide uppercase">
          Loading Job Details...
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] px-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-4">
          <FiAlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Job Opening Not Found</h2>
        <p className="text-slate-500 text-sm mb-6 text-center max-w-sm">
          This position may have expired, reached its applicant limit, or been removed.
        </p>
        <Link
          to="/jobs"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-2xl text-sm transition-all"
        >
          Explore All Available Jobs
        </Link>
      </div>
    );
  }

  const logoUrl = resolveAsset(job.companyId?.documents?.logo);
  const jdPdfUrl = resolveAsset(job.documents?.job_description_pdf);
  const companyPolicyPdfUrl = resolveAsset(job.documents?.company_policy_pdf);
  const candidateSavedResumeUrl = resolveAsset(profile?.resumeFilePath || profile?.resumePath);

  const isDeadlinePassed =
    job.application_deadline && new Date(job.application_deadline) < new Date();

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Top Breadcrumb & Navigation Header */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <FiArrowLeft /> Back to Jobs
          </button>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/applications"
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1.5"
            >
              <FiBriefcase /> My Applications
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-8">
        {/* Job Header Hero Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm mb-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start md:items-center gap-5">
              <div className="w-20 h-20 bg-slate-50 border border-slate-100 flex items-center justify-center rounded-2xl shrink-0 overflow-hidden shadow-xs">
                {logoUrl ? (
                  <img src={logoUrl} alt="Company logo" className="w-14 h-14 object-contain" />
                ) : (
                  <HiOutlineBuildingOffice2 className="text-3xl text-slate-400" />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                    {job.title}
                  </h1>
                  {job.job_type === "full-time" && (
                    <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      Full Time
                    </span>
                  )}
                  {existingApp && (
                    <span className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                      <FiCheck size={12} /> Applied
                    </span>
                  )}
                </div>

                <div className="text-indigo-600 font-bold text-base flex flex-wrap items-center gap-2 mb-3">
                  <span>{job.companyId?.company_name || "Company"}</span>
                  {job.companyId?.is_verified && (
                    <span
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"
                      title="Verified Placement Partner"
                    >
                      <FiCheckCircle size={12} /> Verified Partner
                    </span>
                  )}
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className="text-slate-500 text-sm font-medium">
                    {job.job_category || job.job_role || "Technology"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full">
                    <FiMapPin className="text-indigo-500" />
                    {typeof job.location === "object"
                      ? [job.location?.city, job.location?.state, job.location?.country]
                          .filter(Boolean)
                          .join(", ") || "Remote"
                      : job.location || "Remote"}
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full uppercase">
                    <FiBriefcase className="text-indigo-500" />
                    {job.work_mode || job.job_type || "Onsite"}
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full">
                    <FiCalendar className="text-indigo-500" /> Posted:{" "}
                    {new Date(job.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {job.application_deadline && (
                    <span
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                        isDeadlinePassed
                          ? "bg-rose-50 text-rose-600"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      <FiClock />
                      {isDeadlinePassed ? "Deadline Passed" : `Deadline: ${new Date(job.application_deadline).toLocaleDateString()}`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Summary Pill / Salary Box */}
            <div className="flex flex-col md:items-end gap-2 shrink-0 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Offered Compensation
              </div>
              <div className="text-2xl font-black text-slate-900 flex items-center md:justify-end">
                {formatSalary(job.salary_min, job.salary_max, job.currency)}
              </div>
              {job.totalPositions && (
                <div className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <FiUsers className="text-indigo-500" /> {job.totalPositions} position{job.totalPositions > 1 ? "s" : ""} available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Left Column: Job Details & Application Area (Col 1-8) */}
          <div className="lg:col-span-8 space-y-8">
            {/* === APPLICATION STATUS CARD (Shown if candidate has already applied) === */}
            {existingApp ? (
              <section className="bg-white rounded-3xl border border-indigo-100 p-6 md:p-8 shadow-lg shadow-indigo-50/50 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <FiCheckCircle size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900">
                        Your Application Status &amp; Decision
                      </h2>
                      <p className="text-xs text-slate-500">
                        Submitted on {new Date(existingApp.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {(() => {
                    const badge = getStageBadge(existingApp.pipelineStage, existingApp.status);
                    return (
                      <div className={`px-4 py-1.5 rounded-full border text-xs font-bold ${badge.bg}`}>
                        {badge.label}
                      </div>
                    );
                  })()}
                </div>

                {/* Progress Stepper */}
                {(() => {
                  const badge = getStageBadge(existingApp.pipelineStage, existingApp.status);
                  const isRejected = badge.step === -1;

                  return (
                    <div className="my-6">
                      <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-bold">
                        <div className={badge.step >= 1 ? "text-indigo-600" : "text-slate-400"}>
                          1. Applied
                        </div>
                        <div className={badge.step >= 2 ? "text-indigo-600" : "text-slate-400"}>
                          2. Shortlisted
                        </div>
                        <div className={badge.step >= 3 ? "text-purple-600" : "text-slate-400"}>
                          3. Interview
                        </div>
                        <div className={badge.step === 4 ? "text-emerald-600" : isRejected ? "text-rose-600" : "text-slate-400"}>
                          4. Decision
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                        {isRejected ? (
                          <div className="bg-rose-500 h-2 rounded-full w-full"></div>
                        ) : (
                          <div
                            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 h-2 rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(100, Math.max(25, (badge.step / 4) * 100))}%` }}
                          ></div>
                        )}
                      </div>

                      <div className="mt-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 leading-relaxed font-medium">
                        {badge.desc}
                      </div>
                    </div>
                  );
                })()}

                {/* Applied Details Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <span className="font-bold text-slate-500 block mb-1 uppercase tracking-wider text-[10px]">
                      Submitted Resume
                    </span>
                    {existingApp.resumePath ? (
                      <a
                        href={resolveAsset(existingApp.resumePath)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-bold underline text-sm"
                      >
                        <FiFileText /> View / Download Resume <FiExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-slate-500">Profile resume on record</span>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <span className="font-bold text-slate-500 block mb-1 uppercase tracking-wider text-[10px]">
                      Cover Letter Note
                    </span>
                    <p className="text-slate-700 italic line-clamp-2">
                      {existingApp.coverLetter || "No cover letter provided."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Need updates? Recruiter decisions automatically trigger updates here.
                  </span>
                  <Link
                    to="/dashboard/applications"
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    View in My Applications <FiExternalLink size={12} />
                  </Link>
                </div>
              </section>
            ) : null}

            {/* === APPLICATION FORM (Shown if candidate has NOT applied yet) === */}
            {!existingApp && (
              <section className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Apply for this Position</h2>
                    <p className="text-xs text-slate-500">
                      Your profile information has been automatically pre-fetched from your database records.
                    </p>
                  </div>
                  <div className="text-[10px] font-black uppercase px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                    Fast Track Application
                  </div>
                </div>

                {applySuccessMessage && (
                  <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <FiCheckCircle size={16} /> {applySuccessMessage}
                  </div>
                )}

                {applyErrorMessage && (
                  <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2">
                    <FiAlertCircle size={16} /> {applyErrorMessage}
                  </div>
                )}

                <form onSubmit={onApply} className="space-y-6">
                  {/* Pre-fetched Candidate Summary Banner */}
                  {profile && (
                    <div className="p-4 bg-gradient-to-br from-indigo-50/60 to-blue-50/40 rounded-2xl border border-indigo-100/80">
                      <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-2 flex items-center gap-1.5">
                        <FiCheckCircle /> Pre-filled Applicant Identity
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Full Name</span>
                          <span className="font-bold text-slate-800">
                            {profile.fullName || profile.name || "Candidate"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Email Address</span>
                          <span className="font-bold text-slate-800">{profile.email || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Phone Number</span>
                          <span className="font-bold text-slate-800">
                            {profile.mobileNumber || profile.phone || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resume Selection Block */}
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2">
                      Select Resume / CV <span className="text-rose-500">*</span>
                    </label>

                    {profile?.resumeFilePath || profile?.resumePath ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <button
                          type="button"
                          onClick={() => setResumeMode("profile")}
                          className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                            resumeMode === "profile"
                              ? "bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-100"
                              : "bg-white border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                              <FiCheckCircle /> Saved Profile Resume
                            </span>
                            {candidateSavedResumeUrl && (
                              <a
                                href={candidateSavedResumeUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] text-indigo-600 hover:underline font-bold"
                              >
                                Preview
                              </a>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 truncate font-semibold">
                            {profile.resumeFilePath?.split("/").pop() || "User_Resume.pdf"}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-2">
                            Stored in your SkillLens profile
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setResumeMode("custom")}
                          className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                            resumeMode === "custom"
                              ? "bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-100"
                              : "bg-white border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <FiUploadCloud /> Upload Custom Resume
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-semibold">
                            {customResumeFile ? customResumeFile.name : "Tailor a new file for this role"}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-2">
                            PDF, DOC, DOCX up to 10MB
                          </span>
                        </button>
                      </div>
                    ) : null}

                    {/* File Uploader Input (shown if custom resume chosen or no profile resume) */}
                    {(resumeMode === "custom" || (!profile?.resumeFilePath && !profile?.resumePath)) && (
                      <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-center transition-colors bg-slate-50/60">
                        <input
                          type="file"
                          required={resumeMode === "custom" && !customResumeFile}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setCustomResumeFile(e.target.files[0]);
                              setResumeMode("custom");
                            }
                          }}
                        />
                        <div className="flex flex-col items-center justify-center">
                          <FiUploadCloud className="w-10 h-10 text-indigo-500 mb-2" />
                          {customResumeFile ? (
                            <div>
                              <p className="text-sm font-bold text-slate-800">{customResumeFile.name}</p>
                              <p className="text-xs text-emerald-600 font-bold mt-0.5">
                                Ready to attach • Click or drag to replace
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-bold text-slate-700">
                                Click or drag your resume file here
                              </p>
                              <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX up to 10MB</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Matching Skills Verification */}
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-1.5">
                      Included Skills
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedSkills.map((s, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100"
                        >
                          <FiCheck size={12} /> {s}
                        </span>
                      ))}
                      {selectedSkills.length === 0 && (
                        <span className="text-xs text-slate-400">All applicant skills will be included.</span>
                      )}
                    </div>
                  </div>

                  {/* Cover Letter Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-bold text-slate-800">
                        Cover Letter / Pitch <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setCoverLetter(
                            `Dear Hiring Manager at ${job.companyId?.company_name || "Company"},\n\nI am excited to apply for the ${job.title} position. With my background in ${(job.required_skills || []).slice(0, 3).join(", ")}, I look forward to bringing impact to your team.`
                          )
                        }
                        className="text-[11px] font-bold text-indigo-600 hover:underline"
                      >
                        Use Smart Template
                      </button>
                    </div>
                    <textarea
                      placeholder="Highlight your experience, qualifications, and why you are excited about this position..."
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      rows={5}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting || isDeadlinePassed}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-200 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Submitting Application...</span>
                      </>
                    ) : isDeadlinePassed ? (
                      <span>Application Deadline Closed</span>
                    ) : (
                      <>
                        <span>Submit Application Now</span>
                        <FiSend />
                      </>
                    )}
                  </button>
                </form>
              </section>
            )}

            {/* === ROLE DETAILS & DESCRIPTION === */}
            <section className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-3 border-b border-slate-100 pb-3">
                  About the Role
                </h3>
                <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line font-medium">
                  {job.job_description_text || job.responsibilities || "No detailed description provided."}
                </div>
              </div>

              {job.responsibilities && job.responsibilities !== job.job_description_text && (
                <div>
                  <h4 className="text-base font-bold text-slate-900 mb-2">Key Responsibilities</h4>
                  <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line font-medium">
                    {job.responsibilities}
                  </div>
                </div>
              )}

              {/* Required & Preferred Skills */}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Required Skills &amp; Qualifications
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(job.required_skills || []).map((s, i) => (
                    <span
                      key={i}
                      className="px-3.5 py-1.5 bg-slate-100 text-slate-800 text-xs rounded-xl font-bold border border-slate-200"
                    >
                      {s}
                    </span>
                  ))}
                  {(!job.required_skills || !job.required_skills.length) && (
                    <span className="text-slate-400 text-xs">None specified</span>
                  )}
                </div>
              </div>

              {job.preferred_skills && job.preferred_skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Preferred Skills <span className="text-slate-400 font-normal text-xs">(Nice to have)</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {job.preferred_skills.map((s, i) => (
                      <span
                        key={i}
                        className="px-3.5 py-1.5 bg-indigo-50/70 text-indigo-700 text-xs rounded-xl font-bold border border-indigo-100"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Benefits and Perks */}
              {((job.benefits && job.benefits.length > 0) || (job.perks && job.perks.length > 0)) && (
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Benefits &amp; Perks
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[...(job.benefits || []), ...(job.perks || [])].map((b, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 border border-slate-100"
                      >
                        <FiCheck className="text-emerald-500 shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </section>

            {/* === CANDIDATE PLACEMENT ELIGIBILITY & BENCHMARKS === */}
            <section className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FiAward size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      Placement Eligibility &amp; Criteria
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Skill benchmarks, education requirements, and evaluation weights
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-black uppercase px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                  Cutoff Criteria
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Minimum Skill Score */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider mb-1">
                      Minimum Skill Score Cutoff
                    </span>
                    <div className="text-xl font-black text-indigo-600">
                      {job.minimum_skill_score || 0}% Benchmark
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(10, job.minimum_skill_score || 0))}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1.5 block font-medium">
                      Evaluated through SkillLens AI assessment
                    </span>
                  </div>
                </div>

                {/* Score Weightage */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider mb-1">
                      Evaluation Weightage
                    </span>
                    <div className="text-xl font-black text-slate-800">
                      {job.skill_score_weight || 70}% / {100 - (job.skill_score_weight || 70)}%
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-slate-600 font-medium space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Skill Assessment:</span>
                      <span className="font-bold text-indigo-600">{job.skill_score_weight || 70}%</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Profile &amp; Academics:</span>
                      <span className="font-bold text-slate-700">{100 - (job.skill_score_weight || 70)}%</span>
                    </div>
                  </div>
                </div>

                {/* Experience Bracket */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider mb-1">
                      Experience Requirement
                    </span>
                    <div className="text-xl font-black text-slate-800">
                      {job.experience_required?.min_exp !== undefined
                        ? `${job.experience_required.min_exp} - ${job.experience_required.max_exp || 50} Years`
                        : "Any Experience"}
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-slate-500 font-medium">
                    {job.experience_required?.min_exp === 0 ? "Freshers & early career candidates welcome" : "Prior hands-on industry experience expected"}
                  </div>
                </div>
              </div>

              {/* Education Requirement Banner */}
              {job.education_required && (job.education_required.degree || job.education_required.field) && (
                <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <FiAward size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 block">
                      Target Educational Qualification
                    </span>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      {job.education_required.degree || "Bachelor's Degree"}
                      {job.education_required.field && ` in ${job.education_required.field}`}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* === COMPANY PLACEMENT POLICY & TERMS === */}
            <section className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FiShield size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      Company Placement Policy &amp; Terms
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Employment commitments, bond conditions, and verified documents
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-auto px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-[11px] font-bold">
                  <FiCheckCircle size={14} /> Official Recruiter Policy
                </div>
              </div>

              {/* Policy Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employment Bond Card */}
                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    job.company_policy?.bond_required
                      ? "bg-amber-50/70 border-amber-200"
                      : "bg-emerald-50/70 border-emerald-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 flex items-center gap-1.5">
                      <FiLock className={job.company_policy?.bond_required ? "text-amber-600" : "text-emerald-600"} />
                      Service Agreement / Bond
                    </span>
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-full uppercase ${
                        job.company_policy?.bond_required
                          ? "bg-amber-500 text-white"
                          : "bg-emerald-600 text-white"
                      }`}
                    >
                      {job.company_policy?.bond_required ? "Bond Required" : "No Bond"}
                    </span>
                  </div>

                  <div className="text-lg font-black text-slate-900 mb-1">
                    {job.company_policy?.bond_required
                      ? `${job.company_policy.bond_duration || "1.5 Year"} Mandatory Service Bond`
                      : "Zero Bond Liability (0 Months)"}
                  </div>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {job.company_policy?.bond_required
                      ? `Selected candidates agree to serve an employment term of ${
                          job.company_policy.bond_duration || "the designated period"
                        } post onboarding and training. Please refer to the policy document for complete terms.`
                      : "No employment bond or financial penalty is required for this role. Candidates retain complete flexibility."}
                  </p>
                </div>

                {/* Notice Period Card */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 flex items-center gap-1.5">
                      <FiClock className="text-indigo-600" />
                      Notice Period
                    </span>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {job.company_policy?.notice_period || "30 Days"}
                    </span>
                  </div>

                  <div className="text-lg font-black text-slate-900 mb-1">
                    {job.company_policy?.notice_period || "30 Days"} Notice Period
                  </div>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Standard transition and knowledge transfer duration required during separation, as established in company HR policies.
                  </p>
                </div>
              </div>

              {/* Selection Process / Rounds Tracker */}
              {job.selection_rounds && job.selection_rounds.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <FiBriefcase className="text-indigo-600" />
                      Placement Selection Rounds ({job.selection_rounds.length} Stages)
                    </h4>
                    <span className="text-[11px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                      Mode: {job.interview_mode || "Online"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {job.selection_rounds.map((r, i) => (
                      <div
                        key={i}
                        className="p-4 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl border border-slate-200/80 transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center shadow-xs">
                            {i + 1}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                            Round {i + 1}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-800 leading-snug">
                          {r}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Official Placement Documents Section */}
              {(jdPdfUrl || companyPolicyPdfUrl) && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
                    <FiFileText className="text-indigo-600" />
                    Official Placement &amp; Policy Documents
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {jdPdfUrl && (
                      <a
                        href={jdPdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-2xl flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <FiFileText size={18} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-900 block">
                              Official Job Description PDF
                            </span>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              Verified Recruiter Scope &amp; Terms
                            </span>
                          </div>
                        </div>
                        <FiDownload className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      </a>
                    )}

                    {companyPolicyPdfUrl && (
                      <a
                        href={companyPolicyPdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group p-4 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-2xl flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <FiShield size={18} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 group-hover:text-purple-900 block">
                              Official Company Policy PDF
                            </span>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              Placement &amp; Service Agreement Terms
                            </span>
                          </div>
                        </div>
                        <FiDownload className="text-slate-400 group-hover:text-purple-600 transition-colors" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar Column: Job Overview & Company Policies (Col 9-12) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Overview Card */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h4 className="text-base font-black text-slate-900 mb-5 flex items-center gap-2">
                <FiBriefcase className="text-indigo-600" /> Job Overview
              </h4>

              <div className="space-y-4 text-xs font-medium">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                  <FiDollarSign className="text-indigo-500 text-base mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Offered Salary</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {formatSalary(job.salary_min, job.salary_max, job.currency)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                  <FiBriefcase className="text-indigo-500 text-base mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Experience Required</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {job.experience_required?.min_exp !== undefined
                        ? `${job.experience_required.min_exp} - ${job.experience_required.max_exp || 50} Years`
                        : "Any experience level"}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                  <FiAward className="text-indigo-500 text-base mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Education</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {job.education_required?.degree || "Any Degree"}
                      {job.education_required?.field ? ` (${job.education_required.field})` : ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                  <FiCalendar className="text-indigo-500 text-base mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Application Deadline</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {job.application_deadline
                        ? new Date(job.application_deadline).toLocaleDateString()
                        : "Rolling Basis"}
                    </span>
                  </div>
                </div>

                {job.location && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                    <FiMapPin className="text-indigo-500 text-base mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Placement Location</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {typeof job.location === "object"
                          ? [job.location.city, job.location.state, job.location.country].filter(Boolean).join(", ") || "Remote"
                          : job.location || "Remote"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Company Placement Profile Card */}
            {job.companyId && (
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                    {logoUrl ? (
                      <img src={logoUrl} alt={job.companyId.company_name} className="w-10 h-10 object-contain" />
                    ) : (
                      <HiOutlineBuildingOffice2 className="text-2xl text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-black text-slate-900 line-clamp-1">
                        {job.companyId.company_name}
                      </h4>
                      {job.companyId.is_verified && (
                        <FiCheckCircle className="text-emerald-500 shrink-0" size={14} title="Verified Recruiter" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Placement Partner
                    </span>
                  </div>
                </div>

                {job.companyId.description && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-4 font-normal">
                    {job.companyId.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {job.companyId.established_year && (
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Founded</span>
                      <span className="font-bold text-slate-800">{job.companyId.established_year}</span>
                    </div>
                  )}
                  {job.companyId.total_employees && (
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Team Size</span>
                      <span className="font-bold text-slate-800">
                        {Number(job.companyId.total_employees).toLocaleString()}+
                      </span>
                    </div>
                  )}
                  {job.companyId.city && (
                    <div className="p-2.5 bg-slate-50 rounded-xl col-span-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Headquarters</span>
                      <span className="font-bold text-slate-800">
                        {[job.companyId.city, job.companyId.state, job.companyId.country].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Placement Desk Contacts */}
                {(job.companyId.company_email || job.companyId.phone) && (
                  <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5 text-xs text-slate-600">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Placement Desk</span>
                    {job.companyId.company_email && (
                      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
                        <FiMail className="text-indigo-500 shrink-0" />
                        <span className="truncate">{job.companyId.company_email}</span>
                      </div>
                    )}
                    {job.companyId.phone && (
                      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
                        <FiPhone className="text-indigo-500 shrink-0" />
                        <span>{job.companyId.phone}</span>
                      </div>
                    )}
                  </div>
                )}

                {job.companyId.website && (
                  <a
                    href={job.companyId.website.startsWith("http") ? job.companyId.website : `https://${job.companyId.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-indigo-700 font-bold py-2.5 rounded-2xl flex items-center justify-center gap-2 text-xs transition-all"
                  >
                    <FiGlobe /> Visit Official Website <FiExternalLink size={12} />
                  </a>
                )}
              </div>
            )}

            {/* Quick Policy & Verified Documents Card */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md space-y-4">
              <h4 className="text-base font-black flex items-center gap-2">
                <FiShield className="text-indigo-400" /> Placement Policy Summary
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-white/10">
                  <span className="text-slate-400">Employment Bond</span>
                  <span className={`font-bold ${job.company_policy?.bond_required ? "text-amber-300" : "text-emerald-400"}`}>
                    {job.company_policy?.bond_required ? "Required" : "No Bond"}
                  </span>
                </div>

                {job.company_policy?.bond_duration && (
                  <div className="flex items-center justify-between py-2 border-b border-white/10">
                    <span className="text-slate-400">Bond Duration</span>
                    <span className="font-bold text-white">{job.company_policy.bond_duration}</span>
                  </div>
                )}

                <div className="flex items-center justify-between py-2 border-b border-white/10">
                  <span className="text-slate-400">Notice Period</span>
                  <span className="font-bold text-white">
                    {job.company_policy?.notice_period || "30 Days"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-400">Selection Mode</span>
                  <span className="font-bold uppercase text-white">
                    {job.interview_mode || "Online"}
                  </span>
                </div>
              </div>

              {/* Action buttons inside policy summary */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                {companyPolicyPdfUrl && (
                  <a
                    href={companyPolicyPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold py-2.5 rounded-2xl flex items-center justify-center gap-2 text-xs transition-all"
                  >
                    <FiShield className="text-indigo-400" /> Policy Document (PDF)
                  </a>
                )}
                {jdPdfUrl && (
                  <a
                    href={jdPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-2xl flex items-center justify-center gap-2 text-xs transition-all"
                  >
                    <FiDownload /> Official Job Description (PDF)
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;