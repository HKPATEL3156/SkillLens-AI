import React, { useState, useEffect, useRef } from "react";
import {
  FiFileText,
  FiAward,
  FiTrendingUp,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiLayers,
  FiUploadCloud,
  FiRefreshCw,
  FiTarget,
  FiCpu,
  FiShield,
  FiDownload,
  FiClock,
  FiStar,
  FiCheck,
  FiChevronRight,
} from "react-icons/fi";
import {
  getCurrentResumeATS,
  analyzeResumeATS,
  getATSHistory,
  uploadAndAnalyzeResumeATS,
} from "../services/api";

const PRESET_ROLES = [
  "Software Developer / Engineer",
  "Full Stack Developer (MERN)",
  "Machine Learning Engineer",
  "Frontend Developer (React)",
  "Backend Developer (Node.js / Python)",
  "Data Scientist / Analyst",
  "DevOps & Cloud Engineer",
  "AI / NLP Specialist",
  "Mobile App Developer (Flutter / React Native)",
];

const ResumeATSReview = () => {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [resumeInfo, setResumeInfo] = useState(null);
  const [targetRole, setTargetRole] = useState(PRESET_ROLES[0]);
  const [customRole, setCustomRole] = useState("");
  const [activeTab, setActiveTab] = useState("analysis"); // 'analysis' | 'skills' | 'sections' | 'suggestions' | 'history'
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Duplicate Warning Modal state
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // Upload new resume state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  // Fetch initial resume status and latest analysis
  const fetchCurrentData = async () => {
    setLoading(true);
    try {
      const res = await getCurrentResumeATS();
      setResumeInfo(res.data);
      if (res.data.preferredRole) {
        setTargetRole(res.data.preferredRole);
      }
      if (res.data.latestAnalysis) {
        setCurrentAnalysis(res.data.latestAnalysis);
      }
      fetchHistory();
    } catch (err) {
      console.error("Failed to fetch resume ATS info:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await getATSHistory();
      setHistory(res.data.history || []);
    } catch (err) {
      console.error("Failed to load ATS history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentData();
  }, []);

  const effectiveRole = customRole.trim() ? customRole.trim() : targetRole;

  // Handle Start ATS Analysis
  const handleStartAnalysis = async (forceReanalyze = false) => {
    if (!resumeInfo?.hasResume) {
      setUploadModalOpen(true);
      return;
    }

    setAnalyzing(true);
    setDuplicateWarning(null);

    try {
      const res = await analyzeResumeATS({
        targetJobRole: effectiveRole,
        forceReanalyze,
      });

      if (res.data.duplicate) {
        setDuplicateWarning(res.data);
        return;
      }

      setCurrentAnalysis(res.data.analysis);
      setActiveTab("analysis");
      fetchHistory();
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to analyze resume ATS.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle upload of fresh resume
  const handleUploadAndAnalyze = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Please select a resume file (PDF or DOCX).");
      return;
    }

    setUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("resume", uploadFile);
    formData.append("targetJobRole", effectiveRole);

    try {
      const res = await uploadAndAnalyzeResumeATS(formData);
      setCurrentAnalysis(res.data.analysis);
      setUploadModalOpen(false);
      setUploadFile(null);
      await fetchCurrentData();
      setActiveTab("analysis");
    } catch (err) {
      setUploadError(err.response?.data?.details || err.response?.data?.error || err.message);
    } finally {
      setUploading(false);
    }
  };

  // Best resume calculation
  const bestAnalysis =
    history.length > 0
      ? [...history].sort((a, b) => (b.atsScore || 0) - (a.atsScore || 0))[0]
      : null;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 font-sans">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-bold text-sm">Loading Resume ATS Intelligence...</p>
      </div>
    );
  }

  const score = currentAnalysis?.atsScore ?? 0;
  const breakdown = currentAnalysis?.scoreBreakdown || {};
  const completeness = currentAnalysis?.resumeCompleteness || {};
  const skillsAnalysis = currentAnalysis?.skillsAnalysis || {};
  const jobRoleMatch = currentAnalysis?.jobRoleMatch || {};
  const contentQuality = currentAnalysis?.contentQuality || {};
  const experienceAnalysis = currentAnalysis?.experienceAnalysis || {};
  const projectAnalysis = currentAnalysis?.projectAnalysis || {};

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 font-sans space-y-8 animate-fadeIn text-slate-900">
      
      {/* HEADER HERO (Bright, clean, modern theme matching other dashboard pages) */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-xs font-black uppercase tracking-wider">
              <FiCpu /> AI Placement Engine
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Resume ATS <span className="text-blue-600">& Review Center</span>
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
              Analyze your resume against Applicant Tracking Systems (ATS) and job roles.
              Uncover keyword gaps, evaluate section quality, and follow placement-ready recommendations.
            </p>
          </div>

          {/* Active Resume Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 w-full lg:w-80 shrink-0 shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Active Resume</span>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase ${
                  resumeInfo?.hasResume
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}
              >
                {resumeInfo?.hasResume ? "✓ Uploaded" : "! Missing"}
              </span>
            </div>

            {resumeInfo?.hasResume ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-900 text-sm font-bold truncate">
                  <FiFileText className="text-blue-600 shrink-0" size={18} />
                  <span className="truncate">{resumeInfo.resumeFileName || "Candidate_Resume.pdf"}</span>
                </div>
                {resumeInfo.resumeFilePath && (
                  <a
                    href={resumeInfo.resumeFilePath}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline"
                  >
                    <FiDownload size={13} /> View / Download Document
                  </a>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-medium">No resume uploaded yet.</p>
            )}

            <button
              onClick={() => setUploadModalOpen(true)}
              className="mt-4 w-full py-2.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-200 shadow-sm"
            >
              <FiUploadCloud size={15} /> Upload / Replace Resume
            </button>
          </div>
        </div>

        {/* ROLE SELECTION & START BAR */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-8 space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Target Job Role for ATS Benchmark
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              >
                {PRESET_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Or custom title (e.g. Data Engineer)..."
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div className="md:col-span-4">
            <button
              onClick={() => handleStartAnalysis(false)}
              disabled={analyzing}
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <FiRefreshCw className="animate-spin" /> Evaluating ATS Metrics...
                </>
              ) : (
                <>
                  <FiTarget size={16} /> Start ATS & Analysis
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* DUPLICATE WARNING MODAL (Clean Light Theme) */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl border border-amber-200">
              <FiShield />
            </div>
            <h3 className="text-xl font-black text-slate-900">Saved Analysis Available</h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              This exact resume has already been evaluated for <strong className="text-blue-700">{effectiveRole}</strong>.
              Viewing the existing analysis saves your AI generation tokens and loads immediately.
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs text-slate-600 font-bold">
              <span>
                Previous Score: <strong className="text-emerald-700 text-sm">{duplicateWarning.analysis?.atsScore}%</strong>
              </span>
              <span>Date: {new Date(duplicateWarning.analysis?.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setCurrentAnalysis(duplicateWarning.analysis);
                  setDuplicateWarning(null);
                  setActiveTab("analysis");
                }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition shadow-md shadow-blue-600/20"
              >
                View Saved Analysis
              </button>
              <button
                onClick={() => handleStartAnalysis(true)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition border border-slate-200"
              >
                Re-Analyze Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL (Clean Light Theme) */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                  <FiUploadCloud size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-900">Upload Resume Draft</h3>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Upload your resume (PDF or DOCX). Our AI will parse the structure, analyze your skills, and compute your ATS placement score.
            </p>

            <form onSubmit={handleUploadAndAnalyze} className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50 hover:bg-blue-50/40 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => setUploadFile(e.target.files[0] || null)}
                  className="hidden"
                />
                <FiUploadCloud className="mx-auto text-3xl text-slate-400 group-hover:text-blue-600 mb-2 transition" />
                {uploadFile ? (
                  <p className="text-sm font-bold text-emerald-700 truncate">{uploadFile.name}</p>
                ) : (
                  <>
                    <p className="text-xs font-bold text-slate-700">Click to browse file</p>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">PDF or DOCX (Max 10MB)</p>
                  </>
                )}
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                  <FiAlertCircle /> {uploadError}
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || !uploadFile}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <FiRefreshCw className="animate-spin" /> Uploading & Processing...
                  </>
                ) : (
                  <>Upload & Start ATS Review</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TABS NAVIGATION (Clean Light Pills) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("analysis")}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === "analysis"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <FiAward size={15} /> Overview & Score Dial
        </button>
        <button
          onClick={() => setActiveTab("skills")}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === "skills"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <FiLayers size={15} /> Skills & Keyword Match
        </button>
        <button
          onClick={() => setActiveTab("sections")}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === "sections"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <FiFileText size={15} /> Section Completeness & Quality
        </button>
        <button
          onClick={() => setActiveTab("suggestions")}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === "suggestions"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <FiTrendingUp size={15} /> Placement Action Plan
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === "history"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <FiClock size={15} /> Past Versions & Comparison ({history.length})
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW & SCORE DIAL */}
      {activeTab === "analysis" && (
        <div className="space-y-8 animate-fadeIn">
          {currentAnalysis ? (
            <>
              {/* TOP SCORE CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Radial Score Gauge Card */}
                <div className="md:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
                    Overall ATS Match Score
                  </span>

                  {/* Circular Dial Visual */}
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="text-slate-100 stroke-current"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className={`stroke-current transition-all duration-1000 ease-out ${
                          score >= 80
                            ? "text-emerald-500"
                            : score >= 65
                            ? "text-blue-600"
                            : "text-amber-500"
                        }`}
                        strokeWidth="10"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * score) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-5xl font-black text-slate-900 tracking-tight">{score}</span>
                      <span className="text-xs font-bold text-slate-400 uppercase">out of 100</span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-1.5">
                    <div
                      className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                        score >= 85
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : score >= 70
                          ? "bg-blue-100 text-blue-800 border border-blue-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {score >= 85
                        ? "Placement Ready 🚀"
                        : score >= 70
                        ? "Competitive Profile 🌟"
                        : "Optimization Needed ⚡"}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Target Role: <strong className="text-slate-800">{currentAnalysis.targetJobRole}</strong>
                    </p>
                  </div>
                </div>

                {/* Score Breakdown Bars Card */}
                <div className="md:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">ATS Pillar Breakdown</h3>
                    <p className="text-xs text-slate-500 font-medium mb-6">Specific dimensions evaluated by recruitment engines.</p>

                    <div className="space-y-4">
                      {[
                        { label: "Resume Completeness", val: breakdown.resume_completeness ?? 70, col: "bg-blue-600" },
                        { label: "Skills & Keywords Match", val: breakdown.skills_and_keywords ?? 75, col: "bg-indigo-600" },
                        { label: "Job Role Alignment", val: breakdown.job_role_match ?? 70, col: "bg-purple-600" },
                        { label: "Content Quality & Impact", val: breakdown.content_quality ?? 70, col: "bg-pink-600" },
                        { label: "Project Depth & Relevance", val: breakdown.projects ?? 80, col: "bg-emerald-600" },
                        { label: "Experience / Internships", val: breakdown.experience ?? 65, col: "bg-cyan-600" },
                        { label: "ATS Machine Readability", val: breakdown.ats_friendliness ?? 90, col: "bg-teal-600" },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex justify-between text-xs font-extrabold text-slate-700 mb-1">
                            <span>{item.label}</span>
                            <span className="text-slate-900">{item.val}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.col} rounded-full transition-all duration-700`}
                              style={{ width: `${item.val}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* OVERALL FEEDBACK BANNER */}
              {currentAnalysis.overallFeedback && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shrink-0 mt-1 shadow-sm">
                      <FiStar size={22} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-base font-black text-slate-900">AI Placement Advisor Assessment</h4>
                      <p className="text-slate-700 text-sm leading-relaxed font-medium">
                        {currentAnalysis.overallFeedback}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <FiAward className="mx-auto text-5xl text-slate-300 mb-4" />
              <h3 className="text-xl font-black text-slate-800 mb-2">No ATS Analysis Run Yet</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-6 font-medium">
                Click "Start ATS & Analysis" above to generate a placement benchmark evaluation for your resume.
              </p>
              <button
                onClick={() => handleStartAnalysis(false)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Run First Analysis Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. SKILLS & KEYWORD MATCH (Clean Separated Cards) */}
      {activeTab === "skills" && currentAnalysis && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Matched Skills Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <FiCheckCircle size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Matched Skills Detected</h3>
                  <p className="text-xs text-slate-500 font-medium">Skills present in your resume matching this role</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {(skillsAnalysis.matched_skills || []).length > 0 ? (
                  skillsAnalysis.matched_skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold"
                    >
                      ✓ {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No primary skills extracted.</p>
                )}
              </div>
            </div>

            {/* Missing Skills Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                  <FiXCircle size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Missing Critical Competencies</h3>
                  <p className="text-xs text-slate-500 font-medium">High-demand skills recruiters search for {currentAnalysis.targetJobRole}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {(skillsAnalysis.missing_skills || []).length > 0 ? (
                  skillsAnalysis.missing_skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-bold"
                    >
                      + {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No major missing skills identified.</p>
                )}
              </div>
            </div>

            {/* Keywords in Resume */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                  <FiLayers size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Relevant Keywords Found</h3>
                  <p className="text-xs text-slate-500 font-medium">Keywords improving ATS indexability</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {(skillsAnalysis.relevant_keywords || []).map((kw, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-semibold"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Industry Keywords */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                  <FiTarget size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Recommended Keywords to Include</h3>
                  <p className="text-xs text-slate-500 font-medium">Add these to project & internship bullet points</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {(skillsAnalysis.missing_keywords || []).map((kw, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-purple-50 border border-purple-200 text-purple-800 rounded-xl text-xs font-semibold"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Skill Analysis text */}
          {skillsAnalysis.analysis && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-xs text-slate-700 leading-relaxed font-medium shadow-sm">
              <strong className="text-slate-900 block mb-1 text-sm font-bold">Skills Gap Evaluation Summary:</strong>
              {skillsAnalysis.analysis}
            </div>
          )}
        </div>
      )}

      {/* 3. SECTION COMPLETENESS & QUALITY */}
      {activeTab === "sections" && currentAnalysis && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Completeness Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center justify-between">
                <span>Resume Sections Completeness</span>
                <span className="text-blue-600 text-sm font-bold">{completeness.percentage || 0}%</span>
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-black text-emerald-800 block mb-1.5 uppercase tracking-wider">Present Sections:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(completeness.present_sections || []).map((sec, i) => (
                      <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200">
                        ✓ {sec.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>

                {completeness.missing_sections && completeness.missing_sections.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs font-black text-amber-800 block mb-1.5 uppercase tracking-wider">Missing / Empty Sections:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {completeness.missing_sections.map((sec, i) => (
                        <span key={i} className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-bold border border-amber-200">
                          ! {sec.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-600 font-medium pt-3 border-t border-slate-100">{completeness.analysis}</p>
            </div>

            {/* Content Quality & Formatting */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center justify-between">
                <span>Content Quality Score</span>
                <span className="text-emerald-700 text-sm font-bold">{contentQuality.score || 0}/100</span>
              </h3>
              <div className="space-y-2.5 text-xs text-slate-700 font-medium">
                <strong className="text-emerald-800 block text-xs font-black uppercase tracking-wider">Strengths:</strong>
                {(contentQuality.strengths || []).map((s, i) => (
                  <p key={i} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span> {s}
                  </p>
                ))}

                <strong className="text-amber-800 block pt-2 text-xs font-black uppercase tracking-wider">Areas to Polish:</strong>
                {(contentQuality.weaknesses || []).map((w, i) => (
                  <p key={i} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span> {w}
                  </p>
                ))}
              </div>
              <p className="text-xs text-slate-600 font-medium pt-3 border-t border-slate-100">{contentQuality.analysis}</p>
            </div>

            {/* Projects Quality */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center justify-between">
                <span>Projects Evaluation</span>
                <span className="text-indigo-600 text-sm font-bold">{projectAnalysis.score || 0}/100</span>
              </h3>
              <div className="space-y-2.5 text-xs text-slate-700 font-medium">
                {projectAnalysis.relevant_projects && (
                  <div className="mb-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 font-bold">Analyzed Projects: </span>
                    <span className="text-slate-900 font-bold">{projectAnalysis.relevant_projects.join(", ")}</span>
                  </div>
                )}
                {(projectAnalysis.strengths || []).map((s, i) => (
                  <p key={i} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span> {s}
                  </p>
                ))}
                {(projectAnalysis.weaknesses || []).map((w, i) => (
                  <p key={i} className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold">!</span> {w}
                  </p>
                ))}
              </div>
            </div>

            {/* Experience / Internships */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center justify-between">
                <span>Experience & Internships</span>
                <span className="text-cyan-700 text-sm font-bold">{experienceAnalysis.score || 0}/100</span>
              </h3>
              <div className="space-y-2.5 text-xs text-slate-700 font-medium">
                {(experienceAnalysis.strengths || []).map((s, i) => (
                  <p key={i} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span> {s}
                  </p>
                ))}
                {(experienceAnalysis.weaknesses || []).map((w, i) => (
                  <p key={i} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">!</span> {w}
                  </p>
                ))}
              </div>
              <p className="text-xs text-slate-600 font-medium pt-3 border-t border-slate-100">{experienceAnalysis.analysis}</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. PLACEMENT ACTION PLAN */}
      {activeTab === "suggestions" && currentAnalysis && (
        <div className="space-y-6 animate-fadeIn">
          {/* Actionable Suggestions */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                <FiTrendingUp size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Placement Preparation Roadmap</h3>
                <p className="text-xs text-slate-500 font-medium">Step-by-step improvements to maximize shortlisting rates</p>
              </div>
            </div>

            <div className="space-y-3">
              {(currentAnalysis.improvementSuggestions || []).map((sug, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition shadow-sm"
                >
                  <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                    {i + 1}
                  </span>
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed">{sug}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths and Weaknesses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h4 className="text-base font-black text-emerald-800 flex items-center gap-2">
                <FiCheckCircle className="text-emerald-600" /> Key Profile Strengths
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                {(currentAnalysis.strengths || []).map((st, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-emerald-600 font-bold mt-0.5">•</span>
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h4 className="text-base font-black text-amber-800 flex items-center gap-2">
                <FiAlertCircle className="text-amber-600" /> Improvement Gaps
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                {(currentAnalysis.weaknesses || []).map((wk, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-amber-600 font-bold mt-0.5">•</span>
                    <span>{wk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 5. HISTORICAL EVALUATIONS & RESUME COMPARISON */}
      {activeTab === "history" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Resume Evaluation History</h3>
                <p className="text-xs text-slate-500 font-medium">Track score improvements across resume versions</p>
              </div>

              {bestAnalysis && (
                <div className="px-4 py-2 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800 shadow-sm">
                  <FiAward className="text-emerald-600" /> Best Score: {bestAnalysis.atsScore}% ({bestAnalysis.targetJobRole})
                </div>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium">No past evaluations recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-black uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 rounded-l-xl">Version / Date</th>
                      <th className="py-3 px-4">Document Name</th>
                      <th className="py-3 px-4">Target Role</th>
                      <th className="py-3 px-4 text-center">ATS Score</th>
                      <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((item, idx) => (
                      <tr key={item._id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4 text-slate-900 font-bold">
                          #{history.length - idx} • {new Date(item.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium truncate max-w-xs">
                          {item.resumeFileName || "Resume"}
                        </td>
                        <td className="py-3.5 px-4 text-blue-700 font-bold">{item.targetJobRole}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black ${
                              item.atsScore >= 80
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : item.atsScore >= 65
                                ? "bg-blue-100 text-blue-800 border border-blue-300"
                                : "bg-amber-100 text-amber-800 border border-amber-300"
                            }`}
                          >
                            {item.atsScore}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setCurrentAnalysis(item);
                              setActiveTab("analysis");
                            }}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-xs font-bold transition border border-blue-200 shadow-sm"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeATSReview;
