import React, { useState, useEffect, useRef } from 'react';
import {
  FaTimes,
  FaAward,
  FaCheckCircle,
  FaExclamationTriangle,
  FaLightbulb,
  FaUserCheck,
  FaComments,
  FaCode,
  FaCogs,
  FaChartBar,
  FaBriefcase,
  FaChevronDown,
  FaChevronUp,
  FaDownload,
  FaRedo,
  FaStar,
  FaQuoteLeft,
  FaGraduationCap,
  FaBuilding,
  FaCalendar,
  FaUser
} from 'react-icons/fa';
import { getProfile } from '../../services/api';
import { downloadPdfReport } from '../../utils/pdfExport';

const InterviewReviewModal = ({ interview, onClose, onRetake }) => {
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [questionFilter, setQuestionFilter] = useState('all'); // 'all' | 'technical' | 'behavioral' | 'low-score'
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const reportRef = useRef(null);

  const [candidateProfile, setCandidateProfile] = useState({
    name: "Candidate",
    email: "candidate@skilllens.ai",
    role: "Software Developer"
  });

  useEffect(() => {
    let isMounted = true;
    getProfile()
      .then((res) => {
        if (isMounted && res.data?.user) {
          const u = res.data.user;
          setCandidateProfile({
            name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || "Candidate",
            email: u.email || "candidate@skilllens.ai",
            role: u.role || u.preferredRole || "Software Developer"
          });
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  if (!interview) return null;

  const evaluation = interview.evaluation || {};
  const score = interview.score ?? evaluation.overall_score ?? 0;
  const verdict = interview.verdict || evaluation.verdict || 'Evaluation Complete';
  const breakdown = evaluation.performance_breakdown || {
    technical_depth: 75,
    communication_clarity: 70,
    problem_solving: 72,
    behavioral_fit: 78,
    role_alignment: 74
  };

  const strengths = evaluation.strengths || [];
  const weaknesses = evaluation.weaknesses || [];
  const roadmap = evaluation.actionable_roadmap || [];
  const questionReviews = evaluation.question_reviews || [];

  // Toggle single question expansion on screen
  const toggleQuestion = (idx) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const toggleAllQuestions = (expand) => {
    const next = {};
    questionReviews.forEach((_, i) => {
      next[i] = expand;
    });
    setExpandedQuestions(next);
  };

  const getScoreColor = (val) => {
    if (val >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (val >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (val >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getVerdictBadge = (v) => {
    const lower = (v || '').toLowerCase();
    if (lower.includes('hire') || lower.includes('strong') || lower.includes('ready')) {
      return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: FaUserCheck };
    }
    if (lower.includes('potential') || lower.includes('moderate')) {
      return { bg: 'bg-blue-100 text-blue-800 border-blue-300', icon: FaStar };
    }
    return { bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: FaExclamationTriangle };
  };

  const verdictStyle = getVerdictBadge(verdict);
  const VerdictIcon = verdictStyle.icon;

  const filteredQuestions = questionReviews.filter((q) => {
    if (questionFilter === 'all') return true;
    if (questionFilter === 'technical') return q.category?.toLowerCase() === 'technical';
    if (questionFilter === 'behavioral') return q.category?.toLowerCase() === 'behavioral';
    if (questionFilter === 'low-score') return (q.score || 0) < 6;
    return true;
  });

  const interviewDate = new Date(interview.createdAt || Date.now());
  const interviewIdShort = String(interview._id || interview.id || 'N/A').slice(-8).toUpperCase();
  const rollNumber = `SKL-INT-${interviewIdShort}`;

  // Direct PDF Download Handler (Contains ONLY the exact report, no background webpage)
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsDownloadingPdf(true);
    toggleAllQuestions(true);
    setQuestionFilter('all');

    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      await downloadPdfReport(
        reportRef.current,
        `SkillLens_Mock_Interview_Scorecard_${rollNumber}.pdf`
      );
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] font-sans">
        
        {/* MODAL SCREEN HEADER - ONLY 1 SINGLE PRIMARY BUTTON */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <FaAward className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">AI Mock Interview Performance Scorecard</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/20 capitalize">
                  {interview.interviewType || 'Comprehensive'}
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-white">{interview.targetRole}</span>
                {interview.companyName && (
                  <>
                    <span>•</span>
                    <span className="text-indigo-200">{interview.companyName}</span>
                  </>
                )}
                <span>•</span>
                <span>{interviewDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ONLY ONE PDF DOWNLOAD BUTTON */}
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              title="Download Official PDF Report"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-60"
            >
              {isDownloadingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating Official PDF...</span>
                </>
              ) : (
                <>
                  <FaDownload className="w-3.5 h-3.5" />
                  <span>Download PDF Scorecard</span>
                </>
              )}
            </button>
            {onRetake && (
              <button
                onClick={() => onRetake(interview)}
                disabled={isDownloadingPdf}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer disabled:opacity-50"
              >
                <FaRedo className="w-3 h-3" />
                <span>Retake</span>
              </button>
            )}
            <button
              onClick={onClose}
              disabled={isDownloadingPdf}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1 cursor-pointer disabled:opacity-50"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SCREEN INTERACTIVE CONTROLS */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-600">Filter:</span>
            {['all', 'technical', 'behavioral', 'low-score'].map((f) => (
              <button
                key={f}
                onClick={() => setQuestionFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer ${
                  questionFilter === f
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {f === 'low-score' ? 'Needs Focus (<6/10)' : f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleAllQuestions(true)}
              className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              Expand All
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => toggleAllQuestions(false)}
              className="text-xs text-slate-500 font-medium hover:underline cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* =========================================================================
            OFFICIAL SCORECARD REPORT CONTAINER (Targeted by html2pdf for export)
           ========================================================================= */}
        <div ref={reportRef} className="p-4 sm:p-8 overflow-y-auto flex-1 bg-white space-y-6 text-slate-900">
          
          {/* 1. OFFICIAL INTERVIEW ASSESSMENT HEADER (JEE/NTA OFFICIAL REPORT FORMAT) */}
          <div className="border-2 border-slate-800 rounded-2xl p-5 bg-white space-y-4 print-break-inside-avoid">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-900 text-white flex items-center justify-center font-black text-sm">
                    SKL
                  </div>
                  <h1 className="text-xl font-black text-slate-950 tracking-tight uppercase">
                    SkillLens-AI Talent Intelligence & Assessment
                  </h1>
                </div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  AI Mock Interview Evaluation Report & Candidate Performance Scorecard
                </p>
              </div>

              <div className="flex flex-col items-end text-right">
                <div className="px-3 py-1 bg-slate-100 border border-slate-400 rounded text-[10px] font-mono font-black text-slate-800 uppercase tracking-widest">
                  SESSION-ID: {rollNumber}
                </div>
                <span className="text-[10px] text-slate-500 font-bold mt-1">
                  AI Evaluated Competency Record
                </span>
              </div>
            </div>

            {/* CANDIDATE & ASSESSMENT DETAILS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-xs text-slate-900">
              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span className="font-bold text-slate-600 uppercase tracking-wider">Candidate Name:</span>
                <span className="font-black text-slate-950 text-sm">{candidateProfile.name}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span className="font-bold text-slate-600 uppercase tracking-wider">Target Job Role:</span>
                <span className="font-black text-indigo-900">{interview.targetRole}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span className="font-bold text-slate-600 uppercase tracking-wider">Targeted Company:</span>
                <span className="font-bold text-slate-900">
                  {interview.companyName || "General Market Standard Benchmarking"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span className="font-bold text-slate-600 uppercase tracking-wider">Interview Mode:</span>
                <span className="font-bold text-slate-900 capitalize">{interview.interviewType || "Comprehensive"}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span className="font-bold text-slate-600 uppercase tracking-wider">Interview Date & Time:</span>
                <span className="font-bold text-slate-900">
                  {interviewDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                  {interviewDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span className="font-bold text-slate-600 uppercase tracking-wider">Total Questions Evaluated:</span>
                <span className="font-bold text-slate-900">{questionReviews.length} Questions</span>
              </div>
            </div>

            {/* 2. EXECUTIVE SCORE & HIRING VERDICT BOX */}
            <div className="pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Overall Score */}
                <div className="p-3.5 rounded-xl border border-slate-300 bg-indigo-50/60 text-center">
                  <div className="text-[10px] font-black uppercase tracking-wider text-indigo-900">
                    Overall Interview Score
                  </div>
                  <div className="text-3xl font-black text-indigo-950 mt-1">{score}%</div>
                  <div className="text-[11px] font-bold text-indigo-700 mt-0.5">Scale: 0 - 100%</div>
                </div>

                {/* Verdict Badge */}
                <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 text-center flex flex-col justify-center items-center">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                    AI Hiring Recommendation
                  </div>
                  <div className="mt-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-black border inline-flex items-center gap-1.5 ${verdictStyle.bg}`}>
                      <VerdictIcon className="w-3.5 h-3.5" />
                      {verdict}
                    </span>
                  </div>
                </div>

                {/* Candidate Assessment Summary */}
                <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-700 flex flex-col justify-center">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                    Executive Synopsis
                  </div>
                  <p className="line-clamp-3 leading-relaxed font-medium">
                    {evaluation.executive_summary || "Candidate demonstrated solid foundational knowledge and structured communication across core technical and behavioral rounds."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. COMPETENCY PILLARS BREAKDOWN TABLE */}
          <div className="border border-slate-300 rounded-2xl p-5 bg-white space-y-3 print-break-inside-avoid">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <FaChartBar className="text-indigo-600" />
              Competency Pillar Performance Breakdown
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse border border-slate-300 text-xs">
                <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="border border-slate-300 py-2 px-3 text-left">Competency Pillar</th>
                    <th className="border border-slate-300 py-2 px-2">Score (%)</th>
                    <th className="border border-slate-300 py-2 px-3 text-left">Assessment Metric</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                  <tr>
                    <td className="border border-slate-300 py-2 px-3 text-left font-bold text-slate-900">1. Technical Depth & Architecture</td>
                    <td className="border border-slate-300 py-2 px-2 font-mono font-black text-indigo-700">{breakdown.technical_depth ?? 75}%</td>
                    <td className="border border-slate-300 py-2 px-3 text-left text-slate-600">Core domain concepts, system patterns & implementation accuracy</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 py-2 px-3 text-left font-bold text-slate-900">2. Communication & Structuring</td>
                    <td className="border border-slate-300 py-2 px-2 font-mono font-black text-indigo-700">{breakdown.communication_clarity ?? 70}%</td>
                    <td className="border border-slate-300 py-2 px-3 text-left text-slate-600">Clarity of thought, concise delivery & STAR method usage</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 py-2 px-3 text-left font-bold text-slate-900">3. Problem Solving & Approach</td>
                    <td className="border border-slate-300 py-2 px-2 font-mono font-black text-indigo-700">{breakdown.problem_solving ?? 72}%</td>
                    <td className="border border-slate-300 py-2 px-3 text-left text-slate-600">Edge-case reasoning, trade-off articulation & optimization</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 py-2 px-3 text-left font-bold text-slate-900">4. Behavioral & Culture Fit</td>
                    <td className="border border-slate-300 py-2 px-2 font-mono font-black text-indigo-700">{breakdown.behavioral_fit ?? 78}%</td>
                    <td className="border border-slate-300 py-2 px-3 text-left text-slate-600">Leadership principles, conflict management & ownership</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 py-2 px-3 text-left font-bold text-slate-900">5. Role & Company JD Alignment</td>
                    <td className="border border-slate-300 py-2 px-2 font-mono font-black text-indigo-700">{breakdown.role_alignment ?? 74}%</td>
                    <td className="border border-slate-300 py-2 px-3 text-left text-slate-600">Direct relevance to target role stack & responsibilities</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. STRENGTHS, IMPROVEMENTS & ROADMAP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print-break-inside-avoid">
            {/* Strengths */}
            <div className="border border-emerald-300 rounded-2xl p-4 bg-emerald-50/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-900">
                <FaCheckCircle className="text-emerald-600" />
                Demonstrated Candidate Strengths
              </div>
              <ul className="space-y-1.5 text-xs text-slate-800">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Growth Areas */}
            <div className="border border-amber-300 rounded-2xl p-4 bg-amber-50/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-900">
                <FaExclamationTriangle className="text-amber-600" />
                Areas for Practice & Refinement
              </div>
              <ul className="space-y-1.5 text-xs text-slate-800">
                {weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable Roadmap */}
          {roadmap.length > 0 && (
            <div className="border border-slate-300 rounded-2xl p-4 bg-slate-50/80 space-y-3 print-break-inside-avoid">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <FaLightbulb className="text-amber-500" />
                Targeted 3-Step Preparation Roadmap
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {roadmap.map((step, idx) => (
                  <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                    <div className="font-bold text-indigo-700 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">
                        {idx + 1}
                      </span>
                      <span>{step.area || `Step ${idx + 1}`}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{step.action}</p>
                    {step.resource && (
                      <div className="text-[10px] text-slate-500 italic pt-1">
                        Resource: {step.resource}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. QUESTION-BY-QUESTION RESPONSE EVALUATION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-300 pb-2">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Question-by-Question Candidate Responses & AI Blueprint
              </h2>
              <span className="text-xs font-bold text-slate-500">
                {questionReviews.length} Questions Total
              </span>
            </div>

            {/* Questions List */}
            {filteredQuestions.map((q, idx) => {
              const isExpanded = expandedQuestions[idx] ?? true;
              const qScore = q.score ?? 7;
              const qScoreBadge = getScoreColor(qScore * 10);

              return (
                <div
                  key={idx}
                  className="border border-slate-300 rounded-2xl bg-white overflow-hidden print-question-block print-break-inside-avoid shadow-sm"
                >
                  {/* Question Header */}
                  <div
                    onClick={() => toggleQuestion(idx)}
                    className="bg-slate-100 px-4 py-3 border-b border-slate-300 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-200/60 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono text-xs font-black flex items-center justify-center">
                        Q{idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-white text-indigo-800 border border-slate-300">
                            {q.category || 'General'}
                          </span>
                          {q.verdict && (
                            <span className="text-[11px] font-bold text-slate-700">• {q.verdict}</span>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                          {q.question_text}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className={`px-2.5 py-1 rounded-lg text-xs font-black border ${qScoreBadge}`}>
                        {qScore}/10
                      </div>
                      <div className="no-print text-slate-400">
                        {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                      </div>
                    </div>
                  </div>

                  {/* Question Body */}
                  {(isExpanded || true) && (
                    <div className="p-4 sm:p-5 space-y-4 bg-white border-t border-slate-100">
                      
                      {/* Candidate Transcribed Answer */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                          <FaQuoteLeft className="text-slate-400" />
                          Candidate Transcribed Response
                        </div>
                        <p className="text-slate-900 leading-relaxed font-normal whitespace-pre-wrap">
                          {q.candidate_answer || (
                            <span className="text-slate-400 italic">No response submitted for this question.</span>
                          )}
                        </p>
                      </div>

                      {/* Strengths & Improvements */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {q.strengths && (
                          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                            <strong className="text-emerald-800 block mb-0.5 font-bold">What Went Well:</strong>
                            <p className="text-slate-700 leading-relaxed">{q.strengths}</p>
                          </div>
                        )}
                        {q.improvements && (
                          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                            <strong className="text-amber-800 block mb-0.5 font-bold">Improvement Suggestion:</strong>
                            <p className="text-slate-700 leading-relaxed">{q.improvements}</p>
                          </div>
                        )}
                      </div>

                      {/* Ideal Model Blueprint */}
                      {q.ideal_answer && (
                        <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 text-xs">
                          <strong className="text-indigo-950 block mb-1 font-bold uppercase tracking-wider text-[10px]">
                            AI Ideal Response Blueprint:
                          </strong>
                          <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                            {q.ideal_answer}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* OFFICIAL FOOTER */}
          <div className="pt-6 border-t-2 border-slate-800 text-center space-y-1 print-break-inside-avoid">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              SkillLens-AI AI Interview Assessment System • Official Performance Document
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              Evaluated on {interviewDate.toLocaleString()} • Authenticated ID: {rollNumber}
            </p>
          </div>
        </div>

        {/* MODAL BOTTOM BAR */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Interview ID: <strong className="font-mono text-slate-800">{interviewIdShort}</strong> | Overall Score: <strong className="text-slate-900">{score}% ({verdict})</strong>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewReviewModal;
