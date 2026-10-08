import React, { useState } from 'react';
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
  FaPrint,
  FaRedo,
  FaStar,
  FaQuoteLeft,
  FaGraduationCap,
  FaArrowRight
} from 'react-icons/fa';

const InterviewReviewModal = ({ interview, onClose, onRetake }) => {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'breakdown' | 'questions' | 'roadmap'
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [questionFilter, setQuestionFilter] = useState('all'); // 'all' | 'technical' | 'behavioral' | 'low-score'

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

  // Toggle single question expansion
  const toggleQuestion = (idx) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Expand all / Collapse all
  const toggleAllQuestions = (expand) => {
    const next = {};
    questionReviews.forEach((_, i) => {
      next[i] = expand;
    });
    setExpandedQuestions(next);
  };

  // Score color helper
  const getScoreColor = (val) => {
    if (val >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (val >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (val >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getScoreRingColor = (val) => {
    if (val >= 80) return '#10b981';
    if (val >= 60) return '#3b82f6';
    if (val >= 40) return '#f59e0b';
    return '#f43f5e';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 md:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <FaAward className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">AI Mock Interview Review</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/20 capitalize">
                  {interview.interviewType || 'Comprehensive'}
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <span className="font-medium text-white">{interview.targetRole}</span>
                {interview.companyName && (
                  <>
                    <span>•</span>
                    <span className="text-indigo-200">{interview.companyName}</span>
                  </>
                )}
                <span>•</span>
                <span>{new Date(interview.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              title="Print Report"
              className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors hidden sm:flex items-center gap-1.5 text-xs font-medium"
            >
              <FaPrint className="w-4 h-4" />
              <span>Print</span>
            </button>
            {onRetake && (
              <button
                onClick={() => onRetake(interview)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <FaRedo className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hero Score Bar */}
        <div className="px-6 py-5 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 w-full md:w-auto">
            {/* Circular Gauge */}
            <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  strokeDasharray={`${score}, 100`}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  stroke={getScoreRingColor(score)}
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900 leading-none">{score}%</span>
                <span className="text-[10px] font-semibold uppercase text-slate-500 mt-0.5 tracking-wider">Overall</span>
              </div>
            </div>

            {/* Verdict & Meta */}
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${verdictStyle.bg}`}>
                  <VerdictIcon className="w-3.5 h-3.5" />
                  {verdict}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {questionReviews.length} Questions Evaluated
                </span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2 max-w-xl font-normal leading-relaxed">
                {evaluation.executive_summary || 'Your AI-powered mock interview evaluation is complete. Review your competency scores and tailored recommendations below.'}
              </p>
            </div>
          </div>

          {/* Quick Pillar Scores */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 w-full md:w-auto">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Technical</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">{breakdown.technical_depth ?? '-'}%</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Comms</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">{breakdown.communication_clarity ?? '-'}%</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Solving</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">{breakdown.problem_solving ?? '-'}%</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Behavior</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">{breakdown.behavioral_fit ?? '-'}%</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-center col-span-3 sm:col-span-1">
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Alignment</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">{breakdown.role_alignment ?? '-'}%</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 bg-white border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'summary', label: 'Executive Overview', icon: FaChartBar },
            { id: 'questions', label: `Question Breakdown (${questionReviews.length})`, icon: FaComments },
            { id: 'roadmap', label: 'Improvement Plan', icon: FaLightbulb }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
                  active
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/60 space-y-6">
          {/* TAB 1: EXECUTIVE SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Pillar Breakdown Bars */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FaChartBar className="text-indigo-600" />
                  Competency Pillar Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Technical Depth & Knowledge', val: breakdown.technical_depth, icon: FaCode, color: 'bg-indigo-600' },
                    { label: 'Communication & Structuring', val: breakdown.communication_clarity, icon: FaComments, color: 'bg-blue-600' },
                    { label: 'Problem Solving & Approach', val: breakdown.problem_solving, icon: FaCogs, color: 'bg-teal-600' },
                    { label: 'Behavioral Fit & Culture', val: breakdown.behavioral_fit, icon: FaUserCheck, color: 'bg-emerald-600' },
                    { label: 'Role & JD Alignment', val: breakdown.role_alignment, icon: FaBriefcase, color: 'bg-purple-600' }
                  ].map((item, i) => {
                    const ItemIcon = item.icon;
                    const val = item.val ?? 70;
                    return (
                      <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <ItemIcon className="text-slate-500" />
                            {item.label}
                          </div>
                          <span className="text-xs font-bold text-slate-900">{val}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full transition-all duration-700`}
                            style={{ width: `${Math.min(100, Math.max(0, val))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strengths & Weaknesses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Strengths */}
                <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-sm">
                  <div className="flex items-center gap-2 mb-3.5 text-emerald-700 font-bold text-sm">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <FaCheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span>Key Demonstrative Strengths</span>
                  </div>
                  <ul className="space-y-2.5">
                    {strengths.length > 0 ? (
                      strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-slate-500 italic">Clear answers provided across core questions.</li>
                    )}
                  </ul>
                </div>

                {/* Weaknesses / Growth Areas */}
                <div className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-sm">
                  <div className="flex items-center gap-2 mb-3.5 text-amber-700 font-bold text-sm">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                      <FaExclamationTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <span>Areas Requiring Focus & Refinement</span>
                  </div>
                  <ul className="space-y-2.5">
                    {weaknesses.length > 0 ? (
                      weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                          <span>{w}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-slate-500 italic">Provide deeper metric-oriented examples in answers.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Mentor Advice Banner */}
              {evaluation.mentor_advice && (
                <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-md flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center flex-shrink-0 text-indigo-300">
                    <FaGraduationCap className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>AI Career Coach Note</span>
                    </h4>
                    <p className="text-xs text-slate-200 leading-relaxed italic">
                      "{evaluation.mentor_advice}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: QUESTION-BY-QUESTION BREAKDOWN */}
          {activeTab === 'questions' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Controls bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-semibold text-slate-600">Filter:</span>
                  {['all', 'technical', 'behavioral', 'low-score'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setQuestionFilter(f)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                        questionFilter === f
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f === 'low-score' ? 'Needs Improvement' : f}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAllQuestions(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1"
                  >
                    Expand All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={() => toggleAllQuestions(false)}
                    className="text-xs text-slate-500 hover:text-slate-700 font-medium px-2 py-1"
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              {/* Question list */}
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                  No questions match the selected filter.
                </div>
              ) : (
                filteredQuestions.map((q, idx) => {
                  const isExpanded = expandedQuestions[idx] ?? (idx === 0);
                  const qScore = q.score ?? 7;
                  const qScorePct = qScore * 10;
                  const scoreBadgeStyle = getScoreColor(qScorePct);

                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-200 hover:border-indigo-200"
                    >
                      {/* Accordion header */}
                      <button
                        onClick={() => toggleQuestion(idx)}
                        className="w-full px-5 py-4 flex items-center justify-between text-left gap-4 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="flex items-start gap-3.5 flex-1">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs flex-shrink-0 mt-0.5">
                            Q{idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {q.category || 'General'}
                              </span>
                              {q.verdict && (
                                <span className="text-[10px] font-semibold text-slate-600">
                                  • {q.verdict}
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs md:text-sm font-bold text-slate-800 leading-snug">
                              {q.question_text}
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className={`px-2.5 py-1 rounded-lg text-xs font-black border ${scoreBadgeStyle}`}>
                            {qScore}/10
                          </div>
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            {isExpanded ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
                          </div>
                        </div>
                      </button>

                      {/* Accordion details */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 bg-gradient-to-b from-slate-50/40 to-white">
                          {/* Candidate Answer */}
                          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                              <FaQuoteLeft className="text-slate-400" />
                              Your Response
                            </div>
                            <p className="text-xs text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
                              {q.candidate_answer || (
                                <span className="text-slate-400 italic">No response submitted for this question.</span>
                              )}
                            </p>
                          </div>

                          {/* Strengths & Improvements */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {q.strengths && (
                              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs">
                                <div className="font-bold text-emerald-800 mb-1 flex items-center gap-1.5">
                                  <FaCheckCircle className="text-emerald-600" />
                                  What You Did Well
                                </div>
                                <p className="text-slate-700 leading-relaxed">{q.strengths}</p>
                              </div>
                            )}

                            {q.improvements && (
                              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs">
                                <div className="font-bold text-amber-800 mb-1 flex items-center gap-1.5">
                                  <FaExclamationTriangle className="text-amber-600" />
                                  Suggested Enhancement
                                </div>
                                <p className="text-slate-700 leading-relaxed">{q.improvements}</p>
                              </div>
                            )}
                          </div>

                          {/* Model Answer Blueprint */}
                          {q.ideal_answer && (
                            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200">
                              <div className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <FaLightbulb className="text-indigo-600" />
                                Ideal Response Blueprint
                              </div>
                              <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                                {q.ideal_answer}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: ACTIONABLE IMPROVEMENT ROADMAP */}
          {activeTab === 'roadmap' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <FaLightbulb className="text-amber-500" />
                  Personalized 3-Step Preparation Roadmap
                </h3>
                <p className="text-xs text-slate-500 mb-5">
                  AI-recommended targeted actions to master your next round for <span className="font-semibold text-slate-700">{interview.targetRole}</span>.
                </p>

                <div className="space-y-4">
                  {roadmap.length > 0 ? (
                    roadmap.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/30 border border-slate-200/80 flex items-start gap-4 hover:border-indigo-300 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            {step.area || `Priority Focus ${idx + 1}`}
                          </h4>
                          <p className="text-xs text-slate-700 leading-relaxed font-medium">
                            {step.action}
                          </p>
                          {step.resource && (
                            <div className="pt-1 flex items-center gap-1 text-[11px] text-indigo-600 font-semibold">
                              <span>Recommended Resource:</span>
                              <span className="text-slate-600 font-normal">{step.resource}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic">
                      Practice answering using the STAR method (Situation, Task, Action, Result) and include concrete performance metrics in your project explanations.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Interview ID: <span className="font-mono text-slate-700">{interview._id?.slice(-8) || 'N/A'}</span>
          </span>

          <div className="flex items-center gap-3">
            {onRetake && (
              <button
                onClick={() => onRetake(interview)}
                className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all border border-indigo-200 flex items-center gap-1.5"
              >
                <FaRedo className="w-3 h-3" />
                <span>Practice Another Interview</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
            >
              Close Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewReviewModal;
