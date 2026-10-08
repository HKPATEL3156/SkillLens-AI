import React, { useState, useEffect } from "react";
import {
  FiX,
  FiFileText,
  FiBriefcase,
  FiCheckCircle,
  FiTarget,
  FiCpu,
  FiUploadCloud,
  FiInfo,
  FiAlertCircle,
  FiZap
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { getProfile, getCurrentResumeATS, startMockInterview } from "../../services/api";

const MARKET_ROLES = [
  "Full Stack Developer (MERN)",
  "Frontend Developer (React)",
  "Backend Engineer (Node.js / Python)",
  "Machine Learning Engineer",
  "Data Scientist / Analyst",
  "DevOps & Cloud Engineer",
  "Software Engineer (General)",
  "Mobile App Developer (Flutter / React Native)",
];

const InterviewSetupModal = ({
  isOpen = true,
  onClose,
  onStartInterview,
  initialRole = "",
}) => {
  const [resumeInfo, setResumeInfo] = useState({
    hasResume: false,
    resumeFileName: "",
    skills: [],
    preferredRole: "",
    loading: true,
  });

  const [selectedRole, setSelectedRole] = useState(initialRole || MARKET_ROLES[0]);
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleText, setCustomRoleText] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyJD, setCompanyJD] = useState("");
  const [interviewType, setInterviewType] = useState("Comprehensive");
  const [numQuestions, setNumQuestions] = useState(6);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Automatically fetch candidate's resume and profile details
  useEffect(() => {
    let isMounted = true;
    const fetchCandidateData = async () => {
      try {
        const [profileRes, atsRes] = await Promise.allSettled([
          getProfile(),
          getCurrentResumeATS()
        ]);

        if (!isMounted) return;

        let hasResume = false;
        let resumeFileName = "Candidate_Resume.pdf";
        let skills = [];
        let preferredRole = "";

        if (profileRes.status === "fulfilled" && profileRes.value.data?.user) {
          const user = profileRes.value.data.user;
          preferredRole = user.role || user.preferredRole || "";
          if (user.resumeFilePath || user.resume_data) {
            hasResume = true;
            resumeFileName = user.resumeOriginalName || user.resumeFileName || "Candidate_Resume.pdf";
          }
          if (user.skills && Array.isArray(user.skills)) {
            skills = user.skills;
          }
        }

        if (atsRes.status === "fulfilled" && atsRes.value.data?.hasResume) {
          hasResume = true;
          if (atsRes.value.data.resumeFileName) {
            resumeFileName = atsRes.value.data.resumeFileName;
          }
          if (atsRes.value.data.analysis?.extracted_skills) {
            const extracted = atsRes.value.data.analysis.extracted_skills;
            skills = Array.from(new Set([...skills, ...extracted]));
          }
          if (atsRes.value.data.analysis?.target_role && !preferredRole) {
            preferredRole = atsRes.value.data.analysis.target_role;
          }
        }

        setResumeInfo({
          hasResume,
          resumeFileName,
          skills,
          preferredRole,
          loading: false,
        });

        if (initialRole) {
          if (MARKET_ROLES.includes(initialRole)) {
            setSelectedRole(initialRole);
            setIsCustomRole(false);
          } else {
            setIsCustomRole(true);
            setCustomRoleText(initialRole);
          }
        } else if (preferredRole) {
          if (MARKET_ROLES.includes(preferredRole)) {
            setSelectedRole(preferredRole);
          }
        }
      } catch (err) {
        console.warn("Could not load candidate profile for mock interview setup:", err);
        if (isMounted) {
          setResumeInfo((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    fetchCandidateData();
    return () => {
      isMounted = false;
    };
  }, [initialRole]);

  if (isOpen === false) return null;

  const effectiveRole = isCustomRole
    ? customRoleText.trim() || "Software Developer"
    : selectedRole;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (isCustomRole && !customRoleText.trim()) {
      setErrorMessage("Please enter a custom role title.");
      return;
    }

    setLoadingGenerate(true);

    const payload = {
      targetRole: effectiveRole,
      companyName: companyName.trim(),
      companyJD: companyJD.trim(),
      interviewType,
      numQuestions: parseInt(numQuestions, 10) || 6,
    };

    try {
      // Call backend to generate AI interview questions
      const res = await startMockInterview(payload);
      if (res.data && res.data.interview) {
        onStartInterview(res.data.interview);
      } else {
        throw new Error("Invalid response received from interview service.");
      }
    } catch (err) {
      console.error("Start mock interview error:", err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to generate mock interview. Please try again.";
      setErrorMessage(msg);
      setLoadingGenerate(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 font-sans animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <FiCpu size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                AI Mock Interview Setup
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  Interactive Simulator
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Personalized questions generated from your Resume + Target Role + Optional Company JD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loadingGenerate}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition disabled:opacity-50"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* ERROR ALERT IF OCCURRED */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800 animate-fadeIn">
              <FiAlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Error starting interview: </span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* STEP 1: RESUME AUTO-FETCH STATUS */}
          <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-2xl p-4 sm:p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-950 font-black text-sm">
                <FiFileText className="text-indigo-600" size={17} />
                <span>1. Automatically Fetched Candidate Resume</span>
              </div>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                  resumeInfo.loading
                    ? "bg-slate-100 text-slate-600 border border-slate-300"
                    : resumeInfo.hasResume
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}
              >
                {resumeInfo.loading
                  ? "Detecting Resume..."
                  : resumeInfo.hasResume
                  ? "✓ Resume Linked"
                  : "! Profile Resume Missing"}
              </span>
            </div>

            {resumeInfo.loading ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Checking your candidate profile for uploaded resume and skills...</span>
              </div>
            ) : resumeInfo.hasResume ? (
              <div className="text-xs text-slate-700 space-y-1.5">
                <p className="font-semibold text-slate-800">
                  Document: <strong className="text-indigo-950">{resumeInfo.resumeFileName || "Candidate_Resume.pdf"}</strong>
                </p>
                {resumeInfo.skills && resumeInfo.skills.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-slate-500 font-bold">Detected Profile Skills:</span>
                    {resumeInfo.skills.slice(0, 8).map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-white border border-indigo-200 text-indigo-800 rounded-md font-bold text-[11px]"
                      >
                        {s}
                      </span>
                    ))}
                    {resumeInfo.skills.length > 8 && (
                      <span className="text-slate-400 font-bold">
                        +{resumeInfo.skills.length - 8} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-600 space-y-2">
                <p>No resume is currently uploaded in your profile. Questions will be dynamically benchmarked on target role industry standards.</p>
                <Link
                  to="/dashboard/resume-ats"
                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold underline"
                >
                  <FiUploadCloud /> Upload resume now in Resume ATS
                </Link>
              </div>
            )}
          </div>

          {/* STEP 2: ROLE SELECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
                2. Select Target Role
              </label>
              <span className="text-xs text-slate-500 font-medium">Predefined, Saved, or Custom</span>
            </div>

            {/* Popular Role Chips */}
            <div className="flex flex-wrap gap-2">
              {MARKET_ROLES.map((role) => {
                const isSelected = !isCustomRole && selectedRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role);
                      setIsCustomRole(false);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {role}
                  </button>
                );
              })}

              {/* Saved Role chip if exists and not in market roles */}
              {resumeInfo?.preferredRole && !MARKET_ROLES.includes(resumeInfo.preferredRole) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole(resumeInfo.preferredRole);
                    setIsCustomRole(false);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                    !isCustomRole && selectedRole === resumeInfo.preferredRole
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100"
                  }`}
                >
                  ★ Saved: {resumeInfo.preferredRole}
                </button>
              )}

              {/* Custom Role chip */}
              <button
                type="button"
                onClick={() => setIsCustomRole(true)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                  isCustomRole
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                }`}
              >
                + Custom Role
              </button>
            </div>

            {/* Custom Role Input Box */}
            {isCustomRole && (
              <div className="pt-2 animate-fadeIn">
                <input
                  type="text"
                  required
                  placeholder="Enter your custom role title (e.g., Senior Distributed Systems Engineer)..."
                  value={customRoleText}
                  onChange={(e) => setCustomRoleText(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-bold placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* STEP 3: OPTIONAL COMPANY & JOB DESCRIPTION */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
                3. Company & Job Description (Optional)
              </label>
              <span className="text-[11px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                Tailor to specific company
              </span>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Target Company Name (e.g. Google, Microsoft, Amazon, TCS, Startup)..."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />

              <textarea
                rows={3}
                placeholder="Paste the Job Description (JD), requirements, or preferred qualifications to generate company-targeted questions..."
                value={companyJD}
                onChange={(e) => setCompanyJD(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* STEP 4: INTERVIEW MODE & LENGTH */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                Interview Focus Mode
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "Comprehensive", label: "Mix (Tech+HR)" },
                  { id: "Technical", label: "Tech Only" },
                  { id: "Behavioral", label: "HR Only" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setInterviewType(mode.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition ${
                      interviewType === mode.id
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                Questions Count
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[4, 6, 8].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setNumQuestions(count)}
                    className={`py-2 rounded-xl text-xs font-black text-center border transition ${
                      numQuestions === count
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {count} Questions
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loadingGenerate}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loadingGenerate}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition active:scale-98 disabled:opacity-60 flex items-center gap-2"
            >
              {loadingGenerate ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating AI Interview Questions...</span>
                </>
              ) : (
                <>
                  <FiZap size={15} />
                  <span>Start AI Mock Interview</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterviewSetupModal;
