import React, { useState, useEffect, useRef } from "react";
import {
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCpu,
  FiMic,
  FiMicOff,
  FiSave,
  FiAlertCircle,
  FiArrowRight,
  FiHelpCircle,
  FiLayers,
  FiX,
  FiCheck,
  FiAward
} from "react-icons/fi";
import { saveInterviewAnswer, finishMockInterview } from "../../services/api";

const ActiveInterviewRoom = ({
  interview,
  onSaveAnswer,
  onFinish,
  onFinishInterview,
  onExit,
}) => {
  const questions = interview?.questions || [];
  const [currentIndex, setCurrentIndex] = useState(
    interview?.currentQuestionIndex || 0
  );
  const [answersMap, setAnswersMap] = useState(() => {
    const map = {};
    if (interview?.answers && Array.isArray(interview.answers)) {
      interview.answers.forEach((a) => {
        map[a.questionId] = a.answerText || "";
      });
    }
    return map;
  });

  const [savingAnswer, setSavingAnswer] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [finishingEvaluation, setFinishingEvaluation] = useState(false);
  const [finishError, setFinishError] = useState("");

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize Session Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Initialize Speech Recognition if supported in browser
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          const currentQId = questions[currentIndex]?.id || currentIndex + 1;
          setAnswersMap((prev) => {
            const existing = prev[currentQId] || "";
            return {
              ...prev,
              [currentQId]: existing ? `${existing} ${transcript}` : transcript,
            };
          });
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [currentIndex, questions]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn("Recognition start failed:", err);
      }
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentQ = questions[currentIndex] || {};
  const currentQId = currentQ.id || currentIndex + 1;
  const currentAnswer = answersMap[currentQId] || "";

  const handleAnswerChange = (val) => {
    setAnswersMap((prev) => ({
      ...prev,
      [currentQId]: val,
    }));
  };

  const saveCurrentAnswerToBackend = async () => {
    if (!interview?._id) return;
    setSavingAnswer(true);
    try {
      if (onSaveAnswer) {
        await onSaveAnswer({
          questionId: currentQId,
          answerText: currentAnswer,
          timeTakenSeconds: timerSeconds,
        });
      } else {
        await saveInterviewAnswer(interview._id, {
          questionId: currentQId,
          answerText: currentAnswer,
          timeTakenSeconds: timerSeconds,
        });
      }
      setLastSavedTime(new Date());
    } catch (e) {
      console.warn("Save answer error:", e);
    } finally {
      setSavingAnswer(false);
    }
  };

  const handleNext = async () => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    await saveCurrentAnswerToBackend();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowFinishConfirm(true);
    }
  };

  const handlePrev = async () => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    await saveCurrentAnswerToBackend();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleJumpToQuestion = async (idx) => {
    if (idx === currentIndex) return;
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    await saveCurrentAnswerToBackend();
    setCurrentIndex(idx);
  };

  const handleFinishSubmit = async () => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setFinishingEvaluation(true);
    setFinishError("");

    const formattedAnswers = Object.entries(answersMap).map(([qid, text]) => ({
      questionId: parseInt(qid, 10),
      answerText: text,
    }));

    try {
      const res = await finishMockInterview(interview._id, {
        answers: formattedAnswers,
      });

      const completedInterview = res.data?.interview || {
        ...interview,
        answers: formattedAnswers,
        status: "completed",
      };

      if (onFinish) {
        onFinish(completedInterview);
      } else if (onFinishInterview) {
        onFinishInterview(completedInterview);
      }
    } catch (err) {
      console.error("Evaluation error:", err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Evaluation failed. Please try submitting again.";
      setFinishError(msg);
      setFinishingEvaluation(false);
    }
  };

  const answeredCount = Object.values(answersMap).filter((a) => a && a.trim()).length;
  const progressPercent = Math.round(((currentIndex + 1) / Math.max(1, questions.length)) * 100);

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 font-sans space-y-6 animate-fadeIn text-slate-900">
      
      {/* TOP ACTIVE SESSION BAR */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
              Live Mock Interview Session
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {interview?.targetRole || "Software Developer"}{" "}
            {interview?.companyName && (
              <span className="text-indigo-600 font-bold text-lg">
                @ {interview.companyName}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Focus: <strong className="text-slate-700 capitalize">{interview?.interviewType || "Comprehensive"}</strong> • Answer at your own pace and submit for AI grading
          </p>
        </div>

        {/* TIME & EXIT ACTIONS */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 bg-slate-100 text-slate-800 px-4 py-2 rounded-2xl font-mono text-sm font-bold border border-slate-200">
            <FiClock className="text-slate-500" />
            <span>{formatTimer(timerSeconds)}</span>
          </div>

          <button
            onClick={onExit}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold rounded-2xl transition"
          >
            Save & Exit
          </button>
        </div>
      </div>

      {/* QUESTION NAVIGATION CHIPS */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <FiLayers className="text-indigo-600" /> Question Navigator ({currentIndex + 1} of {questions.length})
          </span>
          <span className="text-slate-500 font-medium">
            <strong className="text-emerald-700">{answeredCount}</strong> of {questions.length} answered
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {questions.map((q, idx) => {
            const qId = q.id || idx + 1;
            const hasAnswer = Boolean(answersMap[qId]?.trim());
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={idx}
                onClick={() => handleJumpToQuestion(idx)}
                className={`flex-1 min-w-[50px] py-2 px-2.5 rounded-xl text-xs font-black transition text-center border flex items-center justify-center gap-1 ${
                  isCurrent
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                    : hasAnswer
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>Q{idx + 1}</span>
                {hasAnswer && !isCurrent && <FiCheck className="text-emerald-600" size={12} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* CURRENT QUESTION CARD */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* QUESTION HEADER TAGS */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg uppercase tracking-wider">
              {currentQ.category || "Technical & Behavioral"}
            </span>
            {currentQ.difficulty && (
              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border uppercase tracking-wider ${
                currentQ.difficulty.toLowerCase() === "hard"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : currentQ.difficulty.toLowerCase() === "medium"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}>
                {currentQ.difficulty}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            {savingAnswer ? (
              <span className="flex items-center gap-1 text-indigo-600 font-bold">
                <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                Saving answer...
              </span>
            ) : lastSavedTime ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <FiCheck size={13} /> Saved
              </span>
            ) : null}
          </div>
        </div>

        {/* QUESTION TEXT */}
        <div className="space-y-3">
          <div className="text-xs font-black uppercase tracking-wider text-slate-400">
            Question #{currentIndex + 1}
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
            {currentQ.question}
          </h3>
          {currentQ.context_note && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
              <FiHelpCircle className="text-indigo-600 mt-0.5 shrink-0" size={15} />
              <span>
                <strong className="text-slate-800">Interviewer Context:</strong> {currentQ.context_note}
              </span>
            </div>
          )}
        </div>

        {/* CANDIDATE ANSWER INPUT */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span>Your Response</span>
              <span className="text-[10px] text-slate-400 font-semibold lowercase">
                ({currentAnswer.length} characters)
              </span>
            </label>

            {/* Voice Dictation Button */}
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleRecording}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
                  isRecording
                    ? "bg-rose-500 text-white border-rose-600 animate-pulse"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                }`}
              >
                {isRecording ? (
                  <>
                    <FiMicOff size={14} /> Listening... Click to Stop
                  </>
                ) : (
                  <>
                    <FiMic size={14} className="text-indigo-600" /> Voice Dictation (Speak)
                  </>
                )}
              </button>
            )}
          </div>

          <textarea
            rows={7}
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your structured answer here. You can outline your key points, situation, actions, results, technologies, or architectural decisions..."
            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-y leading-relaxed"
          />

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tip: Structured answers (STAR method) score highest in evaluations.</span>
            <button
              onClick={saveCurrentAnswerToBackend}
              type="button"
              className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
            >
              <FiSave size={13} /> Save Draft
            </button>
          </div>
        </div>

        {/* NAVIGATION BOTTOM CONTROLS */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition"
          >
            <FiChevronLeft size={16} /> Previous
          </button>

          <div className="flex items-center gap-3">
            {currentIndex === questions.length - 1 ? (
              <button
                onClick={() => setShowFinishConfirm(true)}
                className="px-6 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center gap-2 transition active:scale-98"
              >
                <FiCheckCircle size={15} /> Finish & Evaluate Interview
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition active:scale-98"
              >
                Next Question <FiChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION / FINISH MODAL */}
      {showFinishConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scaleUp">
            
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FiAward size={26} />
            </div>

            <div>
              <h4 className="text-lg font-black text-slate-900">
                Ready to Complete Interview?
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                You have answered <strong className="text-slate-800">{answeredCount} of {questions.length}</strong> questions.
                Once submitted, our AI Evaluator will grade your answers, benchmark against role requirements, and generate your scorecard.
              </p>
            </div>

            {finishError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <FiAlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{finishError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowFinishConfirm(false)}
                disabled={finishingEvaluation}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                Continue Answering
              </button>

              <button
                onClick={handleFinishSubmit}
                disabled={finishingEvaluation}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md transition disabled:opacity-60 flex items-center gap-2"
              >
                {finishingEvaluation ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    AI Evaluating Answers...
                  </>
                ) : (
                  <>
                    <FiCheckCircle size={15} /> Confirm & Evaluate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveInterviewRoom;
