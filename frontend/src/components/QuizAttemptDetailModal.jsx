import React, { useState, useMemo } from "react";
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
  FiPrinter,
  FiCheck,
} from "react-icons/fi";

const QuizAttemptDetailModal = ({ attempt, onClose }) => {
  const [filter, setFilter] = useState("all"); // 'all' | 'correct' | 'incorrect' | 'unattempted'
  const [searchTerm, setSearchTerm] = useState("");

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
      if (isAttempted) {
        if (isCorrect) status = "correct";
        else if (isPartial) status = "partial";
        else status = "incorrect";
      }

      return {
        ...q,
        index: idx + 1,
        qid,
        selected,
        correct,
        status,
        obtainedMarks: userAns.obtainedMarks,
      };
    });
  }, [questionSet, userAnswersMap]);

  // Summary counts
  const totalQuestions = analyzedQuestions.length;
  const correctCount = analyzedQuestions.filter((q) => q.status === "correct").length;
  const partialCount = analyzedQuestions.filter((q) => q.status === "partial").length;
  const incorrectCount = analyzedQuestions.filter((q) => q.status === "incorrect").length;
  const unattemptedCount = analyzedQuestions.filter((q) => q.status === "unattempted").length;

  const totalMarks = attempt.totalMarks || totalQuestions * 4 || 100;
  const obtainedMarks = attempt.obtainedMarks ?? answersSummary.score ?? 0;
  const percentage =
    attempt.percent !== undefined
      ? attempt.percent
      : totalMarks > 0
      ? Math.round((obtainedMarks / totalMarks) * 100)
      : 0;
  const isQualified = percentage >= 70;

  // Filtered questions
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* MODAL HEADER (Clean White & Slate theme) */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-100 text-blue-700 border border-blue-200 rounded-2xl shadow-sm">
              <FiAward className="text-2xl" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {attempt.quizName || "Quiz Performance Review"}
                </h3>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-extrabold uppercase tracking-wider ${
                    isQualified
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}
                >
                  {isQualified ? "✓ Qualified (≥70%)" : "! Needs Improvement"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 mt-1">
                <span className="flex items-center gap-1.5">
                  <FiCalendar size={13} className="text-slate-400" />
                  {new Date(attempt.createdAt || attempt.startedAt).toLocaleString()}
                </span>
                <span className="flex items-center gap-1.5">
                  <FiLayers size={13} className="text-blue-500" />
                  Skills: <strong className="text-slate-700">{(attempt.skills || []).join(", ") || "General Evaluation"}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              title="Print Quiz Report"
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl transition text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-sm"
            >
              <FiPrinter size={15} />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2.5 bg-white hover:bg-red-50 hover:text-red-600 text-slate-500 rounded-xl transition border border-slate-200 shadow-sm"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* OVERVIEW STATS BANNER */}
        <div className="p-6 border-b border-slate-200 bg-white shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            {/* Score Card */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-700">
                Score & Grade
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-black text-blue-950">{obtainedMarks}</span>
                <span className="text-blue-600/80 font-bold text-sm">/ {totalMarks}</span>
              </div>
              <div className="mt-2 text-xs font-extrabold text-blue-700">
                {percentage}% Score
              </div>
            </div>

            {/* Total Questions */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                Questions
              </span>
              <div className="text-3xl font-black text-slate-900 mt-2">
                {totalQuestions}
              </div>
              <div className="mt-2 text-xs font-medium text-slate-500">
                Attempted: {totalQuestions - unattemptedCount}
              </div>
            </div>

            {/* Correct Answers */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                <FiCheckCircle size={13} /> Correct
              </span>
              <div className="text-3xl font-black text-emerald-800 mt-2">
                {correctCount}
              </div>
              <div className="mt-2 text-xs font-bold text-emerald-700">
                {totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}% Accuracy
              </div>
            </div>

            {/* Incorrect Answers */}
            <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 flex items-center gap-1">
                <FiXCircle size={13} /> Incorrect
              </span>
              <div className="text-3xl font-black text-rose-800 mt-2">
                {incorrectCount + partialCount}
              </div>
              <div className="mt-2 text-xs font-bold text-rose-700">
                {partialCount > 0 ? `${partialCount} Partial` : "Wrong Answers"}
              </div>
            </div>

            {/* Skipped */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                <FiHelpCircle size={13} /> Skipped
              </span>
              <div className="text-3xl font-black text-slate-700 mt-2">
                {unattemptedCount}
              </div>
              <div className="mt-2 text-xs font-medium text-slate-500">
                Unanswered
              </div>
            </div>
          </div>

          {/* FILTER & SEARCH BAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setFilter("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                  filter === "all"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All ({totalQuestions})
              </button>
              <button
                onClick={() => setFilter("correct")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap flex items-center gap-1.5 ${
                  filter === "correct"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                }`}
              >
                <FiCheckCircle size={13} /> Correct ({correctCount})
              </button>
              <button
                onClick={() => setFilter("incorrect")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap flex items-center gap-1.5 ${
                  filter === "incorrect"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                    : "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200"
                }`}
              >
                <FiXCircle size={13} /> Incorrect ({incorrectCount + partialCount})
              </button>
              <button
                onClick={() => setFilter("unattempted")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap flex items-center gap-1.5 ${
                  filter === "unattempted"
                    ? "bg-slate-700 text-white shadow-md"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <FiHelpCircle size={13} /> Skipped ({unattemptedCount})
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search in questions / answers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition"
              />
            </div>
          </div>
        </div>

        {/* QUESTIONS LIST (Clean Card Design with High Contrast) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <FiAlertCircle className="mx-auto text-4xl text-slate-400 mb-2" />
              <p className="font-bold text-slate-700">No questions found matching this filter.</p>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const options = q.options || {};
              const optKeys = Object.keys(options).sort();

              return (
                <div
                  key={q.qid}
                  className={`bg-white border rounded-2xl p-5 sm:p-6 transition shadow-sm hover:shadow-md ${
                    q.status === "correct"
                      ? "border-emerald-200"
                      : q.status === "incorrect"
                      ? "border-rose-200"
                      : "border-slate-200"
                  }`}
                >
                  {/* QUESTION TOP BAR */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center border border-blue-200">
                        {q.index}
                      </span>
                      <span className="text-xs font-extrabold text-slate-800">
                        Question {q.index} of {totalQuestions}
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {q.type || "MCQ"}
                      </span>
                      {q.difficulty && (
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            q.difficulty.toLowerCase() === "easy"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : q.difficulty.toLowerCase() === "medium"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-purple-100 text-purple-800 border border-purple-200"
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      )}
                    </div>

                    {/* STATUS BADGE */}
                    <div className="flex items-center gap-2">
                      {q.status === "correct" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold">
                          <FiCheckCircle size={14} className="text-emerald-600" /> Correct (+4.00 Marks)
                        </span>
                      )}
                      {q.status === "partial" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold">
                          <FiAlertCircle size={14} className="text-amber-600" /> Partially Correct (+{q.obtainedMarks} Marks)
                        </span>
                      )}
                      {q.status === "incorrect" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold">
                          <FiXCircle size={14} className="text-rose-600" /> Incorrect (0.00 Marks)
                        </span>
                      )}
                      {q.status === "unattempted" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold">
                          <FiHelpCircle size={14} className="text-slate-400" /> Skipped (0.00 Marks)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* QUESTION TEXT */}
                  <p className="text-slate-900 font-semibold text-sm sm:text-base leading-relaxed mb-3">
                    {q.text}
                  </p>

                  {/* CODE BLOCK IF PRESENT */}
                  {q.code && (
                    <div className="mb-4 rounded-xl bg-slate-900 text-slate-100 p-3.5 overflow-x-auto font-mono text-xs shadow-inner">
                      <pre>{q.code}</pre>
                    </div>
                  )}

                  {/* OPTIONS LIST */}
                  <div className="space-y-2 mt-4">
                    {optKeys.map((key) => {
                      const optText = options[key];
                      const isUserSelected = q.selected.includes(key);
                      const isOptionCorrect = q.correct.includes(key);

                      let containerStyle = "bg-white border-slate-200 text-slate-700 hover:bg-slate-50";
                      let badge = null;

                      if (isUserSelected && isOptionCorrect) {
                        // User chose the right answer
                        containerStyle = "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-sm";
                        badge = (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300 shrink-0">
                            <FiCheck size={13} className="text-emerald-700" /> Your Answer (Correct)
                          </span>
                        );
                      } else if (isUserSelected && !isOptionCorrect) {
                        // User chose wrong answer
                        containerStyle = "bg-rose-50 border-rose-400 text-rose-950 font-bold shadow-sm";
                        badge = (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-800 bg-rose-100 px-2.5 py-1 rounded-md border border-rose-300 shrink-0">
                            <FiX size={13} className="text-rose-700" /> Your Answer (Wrong)
                          </span>
                        );
                      } else if (!isUserSelected && isOptionCorrect) {
                        // Correct answer (not chosen by user)
                        containerStyle = "bg-emerald-50/60 border-emerald-300 text-emerald-900 font-semibold";
                        badge = (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-md border border-emerald-300 shrink-0">
                            <FiCheck size={13} className="text-emerald-700" /> Correct Answer
                          </span>
                        );
                      }

                      return (
                        <div
                          key={key}
                          className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border text-xs sm:text-sm transition ${containerStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                                isUserSelected
                                  ? isOptionCorrect
                                    ? "bg-emerald-600 text-white"
                                    : "bg-rose-600 text-white"
                                  : isOptionCorrect
                                  ? "bg-emerald-700 text-white"
                                  : "bg-slate-100 text-slate-700 border border-slate-300"
                              }`}
                            >
                              {key}
                            </span>
                            <span className="leading-snug">{optText}</span>
                          </div>
                          {badge}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs font-bold text-slate-600">
            Showing <strong className="text-slate-900">{filteredQuestions.length}</strong> of {totalQuestions} questions
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-blue-600/20 active:scale-98"
          >
            Close Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizAttemptDetailModal;
