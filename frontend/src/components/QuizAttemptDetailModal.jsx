import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  FiX,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiHelpCircle,
  FiAward,
  FiSearch,
  FiCalendar,
  FiLayers,
  FiDownload,
  FiCheck,
  FiUser,
  FiMail,
  FiHash,
  FiFileText,
  FiClock,
  FiShield
} from "react-icons/fi";
import { getProfile } from "../services/api";
import { downloadPdfReport } from "../utils/pdfExport";

const QuizAttemptDetailModal = ({ attempt, onClose }) => {
  const [filter, setFilter] = useState("all"); // 'all' | 'correct' | 'incorrect' | 'unattempted'
  const [searchTerm, setSearchTerm] = useState("");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const reportRef = useRef(null);

  const [candidateProfile, setCandidateProfile] = useState({
    name: "Candidate",
    email: "candidate@skilllens.ai",
    role: "Software Developer"
  });

  // Fetch candidate profile for official scorecard headers
  useEffect(() => {
    let isMounted = true;
    getProfile()
      .then((res) => {
        if (isMounted && res.data?.user) {
          const u = res.data.user;
          setCandidateProfile({
            name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || "Candidate",
            email: u.email || "candidate@skilllens.ai",
            role: u.role || u.preferredRole || "Candidate"
          });
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  if (!attempt) return null;

  const questionSet = attempt.questionSet || [];
  const answersSummary = attempt.answersSummary || {};
  const userAnswersMap = useMemo(() => {
    const map = {};
    if (answersSummary.answers && Array.isArray(answersSummary.answers)) {
      answersSummary.answers.forEach((ans) => {
        map[String(ans.questionId)] = {
          selected: Array.isArray(ans.selectedOptions) ? ans.selectedOptions : [],
          obtainedMarks: ans.obtainedMarks ?? 0,
        };
      });
    } else if (attempt.checkpoint && attempt.checkpoint.answers) {
      Object.entries(attempt.checkpoint.answers).forEach(([qid, sel]) => {
        map[String(qid)] = {
          selected: Array.isArray(sel) ? sel : [sel],
          obtainedMarks: 0,
        };
      });
    }
    return map;
  }, [answersSummary, attempt]);

  // Analyze each question
  const analyzedQuestions = useMemo(() => {
    return questionSet.map((q, idx) => {
      const qid = String(q.id ?? q.questionId ?? idx + 1);
      const userAns = userAnswersMap[qid] || { selected: [], obtainedMarks: 0 };
      const selected = userAns.selected || [];
      const correct = Array.isArray(q.correct)
        ? q.correct.map(String)
        : q.correct
        ? [String(q.correct)]
        : [];

      const correctSet = new Set(correct);
      const selSet = new Set(selected.map(String));

      const isAttempted = selected.length > 0;
      let isCorrect = false;
      let isPartial = false;

      if (isAttempted) {
        if (correctSet.size === 1) {
          isCorrect = selSet.size === 1 && selSet.has(Array.from(correctSet)[0]);
        } else {
          // Multi-select
          const hasWrong = Array.from(selSet).some((s) => !correctSet.has(s));
          const matchCount = Array.from(selSet).filter((s) => correctSet.has(s)).length;
          if (!hasWrong && matchCount === correctSet.size) {
            isCorrect = true;
          } else if (!hasWrong && matchCount > 0) {
            isPartial = true;
          }
        }
      }

      let status = "unattempted";
      let awardedMarks = 0;
      if (isAttempted) {
        if (isCorrect) {
          status = "correct";
          awardedMarks = q.marks ?? 4;
        } else if (isPartial) {
          status = "partial";
          awardedMarks = userAns.obtainedMarks || 2;
        } else {
          status = "incorrect";
          awardedMarks = 0;
        }
      }

      return {
        ...q,
        index: idx + 1,
        qid,
        selected,
        correct,
        status,
        obtainedMarks: awardedMarks,
        maxMarks: q.marks ?? 4
      };
    });
  }, [questionSet, userAnswersMap]);

  // Summary counts
  const totalQuestions = analyzedQuestions.length;
  const correctCount = analyzedQuestions.filter((q) => q.status === "correct").length;
  const partialCount = analyzedQuestions.filter((q) => q.status === "partial").length;
  const incorrectCount = analyzedQuestions.filter((q) => q.status === "incorrect").length;
  const unattemptedCount = analyzedQuestions.filter((q) => q.status === "unattempted").length;
  const attemptedCount = totalQuestions - unattemptedCount;

  const totalMarks = attempt.totalMarks || totalQuestions * 4 || 100;
  const obtainedMarks = attempt.obtainedMarks ?? answersSummary.score ?? (correctCount * 4);
  const percentage =
    attempt.percent !== undefined
      ? attempt.percent
      : totalMarks > 0
      ? Math.round((obtainedMarks / totalMarks) * 100)
      : 0;
  const isQualified = percentage >= 70;

  // Filtered questions for interactive screen browsing
  const filteredQuestions = useMemo(() => {
    return analyzedQuestions.filter((q) => {
      if (filter === "correct" && q.status !== "correct") return false;
      if (filter === "incorrect" && q.status !== "incorrect" && q.status !== "partial") return false;
      if (filter === "unattempted" && q.status !== "unattempted") return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const textMatch = (q.text || "").toLowerCase().includes(term);
        const codeMatch = (q.code || "").toLowerCase().includes(term);
        const optionMatch = Object.values(q.options || {}).some((opt) =>
          String(opt).toLowerCase().includes(term)
        );
        return textMatch || codeMatch || optionMatch;
      }
      return true;
    });
  }, [analyzedQuestions, filter, searchTerm]);

  const attemptDate = new Date(attempt.createdAt || attempt.startedAt || Date.now());
  const attemptIdShort = String(attempt._id || attempt.id || 'N/A').slice(-8).toUpperCase();
  const rollNumber = `SKL-${attemptIdShort}`;

  // Direct PDF Download Handler (Contains ONLY the exact report, no background webpage)
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsDownloadingPdf(true);
    const prevFilter = filter;
    const prevSearch = searchTerm;
    setFilter("all");
    setSearchTerm("");

    try {
      // Allow React state update to render all questions before generating PDF
      await new Promise((resolve) => setTimeout(resolve, 200));
      await downloadPdfReport(
        reportRef.current,
        `SkillLens_Quiz_Response_Sheet_${rollNumber}.pdf`
      );
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloadingPdf(false);
      setFilter(prevFilter);
      setSearchTerm(prevSearch);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* MODAL ACTION BAR - ONLY 1 SINGLE PRIMARY BUTTON */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>Official Candidate Response Sheet & Scorecard</span>
          </div>

          <div className="flex items-center gap-2">
            {/* ONLY ONE PDF DOWNLOAD BUTTON */}
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              title="Download Official PDF Report"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition text-xs font-black flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-60"
            >
              {isDownloadingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating Official PDF...</span>
                </>
              ) : (
                <>
                  <FiDownload size={15} />
                  <span>Download PDF Response Sheet</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isDownloadingPdf}
              className="p-2 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-xl transition border border-slate-200 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* SCREEN INTERACTIVE CONTROLS */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-600 mr-1">Filter:</span>
            {[
              { id: "all", label: `All (${totalQuestions})` },
              { id: "correct", label: `Correct (${correctCount})`, color: "text-emerald-700" },
              { id: "incorrect", label: `Incorrect (${incorrectCount + partialCount})`, color: "text-rose-700" },
              { id: "unattempted", label: `Skipped (${unattemptedCount})`, color: "text-slate-600" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap cursor-pointer ${
                  filter === tab.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search question text or options..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition"
            />
          </div>
        </div>

        {/* =========================================================================
            OFFICIAL SCORECARD REPORT CONTAINER (Targeted by html2pdf for export)
           ========================================================================= */}
        <div ref={reportRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-white text-slate-900">
          
          {/* 1. OFFICIAL HEADER (JEE / NEET / NTA STANDARD) */}
          <div className="border-2 border-slate-800 rounded-2xl p-5 bg-white space-y-4 print-break-inside-avoid">
            
            {/* National Exam Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                    SKL
                  </div>
                  <h1 className="text-xl font-black text-slate-950 tracking-tight uppercase">
                    SkillLens-AI National Assessment & Evaluation
                  </h1>
                </div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Official Candidate Response Sheet & Performance Scorecard
                </p>
              </div>

              {/* Barcode / Verification Badge */}
              <div className="flex flex-col items-end text-right">
                <div className="px-3 py-1 bg-slate-100 border border-slate-400 rounded text-[10px] font-mono font-black text-slate-800 uppercase tracking-widest">
                  SEC-ID: {rollNumber}
                </div>
                <span className="text-[10px] text-slate-500 font-bold mt-1">
                  Verified Candidate Assessment Record
                </span>
              </div>
            </div>

            {/* 2. CANDIDATE & EXAMINATION INFORMATION GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-xs text-slate-900">
              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span className="font-bold text-slate-600 uppercase tracking-wider">Candidate Name:</span>
                <span className="font-black text-slate-950 text-sm">{candidateProfile.name}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span className="font-bold text-slate-600 uppercase tracking-wider">Roll No / Candidate ID:</span>
                <span className="font-mono font-black text-slate-950">{rollNumber}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span className="font-bold text-slate-600 uppercase tracking-wider">Registered Email:</span>
                <span className="font-mono font-semibold text-slate-800">{candidateProfile.email}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span className="font-bold text-slate-600 uppercase tracking-wider">Assessment / Subject:</span>
                <span className="font-bold text-slate-950">
                  {attempt.quizName || (attempt.skills || []).join(", ") || "Technical Assessment"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span className="font-bold text-slate-600 uppercase tracking-wider">Assessment Attempt ID:</span>
                <span className="font-mono font-bold text-slate-800 text-[11px]">{String(attempt._id || attempt.id || 'N/A')}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span className="font-bold text-slate-600 uppercase tracking-wider">Test Date & Time:</span>
                <span className="font-bold text-slate-900">
                  {attemptDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                  {attemptDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* 3. PERFORMANCE & MARKS SUMMARY MATRIX (JEE / NEET STYLE TABLE) */}
            <div className="pt-2">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-800 mb-2 flex items-center justify-between">
                <span>Performance & Scoring Summary</span>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    isQualified
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}
                >
                  Final Status: {isQualified ? "QUALIFIED (≥70%)" : "NOT QUALIFIED"}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse border border-slate-800 text-xs">
                  <thead className="bg-slate-100 text-slate-900 font-black border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="border border-slate-800 py-2 px-2">Total Questions</th>
                      <th className="border border-slate-800 py-2 px-2">Attempted</th>
                      <th className="border border-slate-800 py-2 px-2 bg-emerald-50 text-emerald-900">Correct (+4)</th>
                      <th className="border border-slate-800 py-2 px-2 bg-rose-50 text-rose-900">Incorrect (0)</th>
                      <th className="border border-slate-800 py-2 px-2">Skipped</th>
                      <th className="border border-slate-800 py-2 px-2">Maximum Marks</th>
                      <th className="border border-slate-800 py-2 px-2 bg-blue-50 text-blue-950 font-black">Marks Obtained</th>
                      <th className="border border-slate-800 py-2 px-2 bg-blue-100 text-blue-950 font-black">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="font-bold text-slate-900 divide-y divide-slate-800">
                    <tr>
                      <td className="border border-slate-800 py-2 px-2 font-mono text-sm">{totalQuestions}</td>
                      <td className="border border-slate-800 py-2 px-2 font-mono text-sm">{attemptedCount}</td>
                      <td className="border border-slate-800 py-2 px-2 font-mono text-sm text-emerald-700 bg-emerald-50/50">{correctCount}</td>
                      <td className="border border-slate-800 py-2 px-2 font-mono text-sm text-rose-700 bg-rose-50/50">{incorrectCount + partialCount}</td>
                      <td className="border border-slate-800 py-2 px-2 font-mono text-sm text-slate-500">{unattemptedCount}</td>
                      <td className="border border-slate-800 py-2 px-2 font-mono text-sm">{totalMarks}.00</td>
                      <td className="border border-slate-800 py-2 px-2 font-mono text-base font-black text-blue-700 bg-blue-50/70">
                        {obtainedMarks}.00
                      </td>
                      <td className="border border-slate-800 py-2 px-2 font-mono text-base font-black text-blue-900 bg-blue-100/70">
                        {percentage}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* =========================================================================
              4. QUESTION-BY-QUESTION RESPONSE SHEET (JEE / NEET / NTA FORMAT)
             ========================================================================= */}
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Candidate Responses & Evaluation Key
              </h2>
              <span className="text-xs font-bold text-slate-500">
                {totalQuestions} Questions Total
              </span>
            </div>

            {filteredQuestions.map((q) => {
              const options = q.options || {};
              const optKeys = Object.keys(options).sort();
              const chosenOptionKey = q.selected.length > 0 ? q.selected.join(", ") : null;
              const correctOptionKey = q.correct.length > 0 ? q.correct.join(", ") : "N/A";

              return (
                <div
                  key={q.qid}
                  className="border border-slate-300 rounded-2xl bg-white overflow-hidden print-question-block print-break-inside-avoid shadow-sm"
                >
                  {/* QUESTION HEADER BAR */}
                  <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-300 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white font-mono text-xs font-black">
                        Q.{q.index}
                      </span>
                      <span className="font-bold text-slate-900">Question ID: {q.qid}</span>
                      {q.type && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-300 uppercase">
                          {q.type}
                        </span>
                      )}
                      {q.difficulty && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-300 uppercase">
                          {q.difficulty}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-600 font-semibold">
                        Max Marks: <strong className="text-slate-900">+{q.maxMarks}.00</strong>
                      </span>
                      <span className="text-[11px] text-slate-600 font-semibold">
                        Marks Awarded:{" "}
                        <strong className={q.obtainedMarks > 0 ? "text-emerald-700 font-black" : "text-slate-900"}>
                          +{q.obtainedMarks}.00
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* QUESTION STATEMENT */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <p className="text-slate-950 font-bold text-xs sm:text-sm leading-relaxed">
                      {q.text}
                    </p>

                    {q.code && (
                      <div className="rounded-xl bg-slate-900 text-slate-100 p-3 overflow-x-auto font-mono text-xs shadow-inner">
                        <pre>{q.code}</pre>
                      </div>
                    )}

                    {/* OPTIONS LIST */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      {optKeys.map((key) => {
                        const optText = options[key];
                        const isChosen = q.selected.includes(key);
                        const isCorrect = q.correct.includes(key);

                        return (
                          <div
                            key={key}
                            className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition ${
                              isCorrect
                                ? "bg-emerald-50/80 border-emerald-400 font-bold text-emerald-950"
                                : isChosen
                                ? "bg-rose-50/80 border-rose-400 font-bold text-rose-950"
                                : "bg-white border-slate-200 text-slate-800"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded flex items-center justify-center font-black text-[11px] shrink-0 mt-0.5 ${
                                isCorrect
                                  ? "bg-emerald-700 text-white"
                                  : isChosen
                                  ? "bg-rose-700 text-white"
                                  : "bg-slate-200 text-slate-800"
                              }`}
                            >
                              {key}
                            </span>
                            <span className="leading-snug pt-0.5">{optText}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* =============================================================
                        NTA / JEE STYLE CANDIDATE RESPONSE STATUS BOX
                       ============================================================= */}
                    <div className="mt-4 pt-3 border-t border-slate-200 bg-slate-50/80 p-3.5 rounded-xl">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        
                        {/* Response Status */}
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</div>
                          <div className="font-extrabold mt-0.5 text-slate-900">
                            {chosenOptionKey ? "Answered" : "Not Answered"}
                          </div>
                        </div>

                        {/* Candidate's Chosen Option */}
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chosen Option (Your Ans)</div>
                          <div className="font-black mt-0.5">
                            {chosenOptionKey ? (
                              <span className={q.status === "correct" ? "text-emerald-700 font-mono" : "text-rose-700 font-mono"}>
                                Option [{chosenOptionKey}]
                              </span>
                            ) : (
                              <span className="text-slate-400 italic font-normal">--</span>
                            )}
                          </div>
                        </div>

                        {/* Correct Answer Key */}
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Correct Option (Key)</div>
                          <div className="font-black mt-0.5 text-emerald-800 font-mono">
                            Option [{correctOptionKey}]
                          </div>
                        </div>

                        {/* Marks Awarded & Outcome */}
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evaluation Outcome</div>
                          <div className="font-black mt-0.5">
                            {q.status === "correct" && (
                              <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                                <FiCheckCircle className="text-emerald-600" /> Correct (+{q.obtainedMarks}.00)
                              </span>
                            )}
                            {q.status === "incorrect" && (
                              <span className="text-rose-700 font-bold inline-flex items-center gap-1">
                                <FiXCircle className="text-rose-600" /> Incorrect (0.00)
                              </span>
                            )}
                            {q.status === "partial" && (
                              <span className="text-amber-700 font-bold inline-flex items-center gap-1">
                                <FiAlertCircle className="text-amber-600" /> Partial (+{q.obtainedMarks}.00)
                              </span>
                            )}
                            {q.status === "unattempted" && (
                              <span className="text-slate-500 font-bold inline-flex items-center gap-1">
                                <FiHelpCircle className="text-slate-400" /> Skipped (0.00)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Explanation / Solution Rationale if provided */}
                      {q.explanation && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200 text-xs text-slate-700">
                          <strong className="text-slate-900 font-bold">Solution Rationale: </strong>
                          <span>{q.explanation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* OFFICIAL FOOTER */}
          <div className="pt-6 border-t-2 border-slate-800 text-center space-y-1 print-break-inside-avoid">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              SkillLens-AI Candidate Assessment System • Official Document
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              Generated on {new Date().toLocaleString()} • Record Authentication Hash: {rollNumber}-{attemptIdShort}
            </p>
          </div>
        </div>

        {/* MODAL BOTTOM BAR */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs font-bold text-slate-600">
            Total Questions: <strong className="text-slate-900">{totalQuestions}</strong> | Total Marks: <strong className="text-slate-900">{obtainedMarks}/{totalMarks} ({percentage}%)</strong>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-md cursor-pointer"
          >
            Close Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizAttemptDetailModal;
