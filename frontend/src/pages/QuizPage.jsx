import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getQuestions, saveQuizCheckpoint, submitQuiz, getProfile } from "../services/api";

// Helpers: create an initials SVG data URL for fallback avatar
function initialsAvatarDataUrl(name, size = 128) {
	const initials = (name || 'C')
		.split(' ')
		.map((s) => s[0] || '')
		.slice(0, 2)
		.join('')
		.toUpperCase();

	// Pick a muted professional background color from a small palette
	const colors = ['#4F46E5', '#0F172A', '#1E293B', '#0EA5A4', '#4338CA', '#064E3B'];
	let hash = 0;
	for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
	const bg = colors[Math.abs(hash) % colors.length];
	const fg = '#FFFFFF';

	const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><rect width='100%' height='100%' fill='${bg}' rx='16' ry='16'/><text x='50%' y='50%' dy='.36em' text-anchor='middle' font-family='Inter, Roboto, Arial, sans-serif' font-size='${Math.floor(
		size / 2
	)}' fill='${fg}'>${initials}</text></svg>`;
	return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function normalizePhotoString(photo) {
	if (!photo) return null;
	if (typeof photo !== 'string') return null;
	// already a data URL
	if (photo.startsWith('data:')) return photo;
	// looks like base64 without data prefix (common in some APIs)
	const base64Regex = /^[A-Za-z0-9+/=\n\r]+$/;
	if (photo.length > 100 && base64Regex.test(photo.replace(/\s+/g, ''))) {
		// assume png
		return `data:image/png;base64,${photo.replace(/\s+/g, '')}`;
	}
	// relative path -> absolute
	if (photo.startsWith('/')) {
		try {
			return window.location.origin + photo;
		} catch (e) {
			return photo;
		}
	}
	return photo; // likely absolute URL
}

function formatTime(seconds) {
	const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
	const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
	const s = String(seconds % 60).padStart(2, "0");
	return `${h}:${m}:${s}`;
}

function arraysEqual(a = [], b = []) {
	if (a.length !== b.length) return false;
	const aa = [...a].sort();
	const bb = [...b].sort();
	return aa.every((v, i) => v === bb[i]);
}

export default function QuizPage() {
	const navigate = useNavigate();
	const [questions, setQuestions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [current, setCurrent] = useState(0);
	const [answers, setAnswers] = useState({}); // { qid: [optionKeys] }
	const [marked, setMarked] = useState(new Set());
	const [visited, setVisited] = useState(new Set());
	const [attemptId, setAttemptId] = useState(null);

	// instruction flow
	const [showInstructions, setShowInstructions] = useState(true);
	const [acknowledged, setAcknowledged] = useState(false);
	const [testingMode, setTestingMode] = useState(false);

	// timer
	const [timeLeft, setTimeLeft] = useState(null); // seconds
	const [running, setRunning] = useState(false);

	const [user, setUser] = useState({ name: "Candidate", photo: "/profile.png" });
	const [submitted, setSubmitted] = useState(false);
	const [warningsUsed, setWarningsUsed] = useState(0);
	const [cheatingDetected, setCheatingDetected] = useState(false);
	const [showWarningModal, setShowWarningModal] = useState(false);
	const [warningRemaining, setWarningRemaining] = useState(3);
	const [warningReason, setWarningReason] = useState('');
	const [interfaceLocked, setInterfaceLocked] = useState(false);
	const [showTerminatedModal, setShowTerminatedModal] = useState(false);
	const lastViolationRef = useRef(0);
	const [showExitModal, setShowExitModal] = useState(false);
	const [showSubmitModal, setShowSubmitModal] = useState(false);

	const questionScrollRef = useRef(null);

	// get attemptId from query string
	useEffect(() => {
		const qs = new URLSearchParams(window.location.search);
		const a = qs.get("attemptId");
		if (a) setAttemptId(a);
	}, []);

	// fetch questions and user
	useEffect(() => {
		const load = async () => {
			setLoading(true);
			try {
				const resp = await getQuestions(attemptId);
				const qs = resp.data.questions || [];
				setQuestions(qs);
			} catch (e) {
				console.error(e);
				setQuestions([]);
			}
			// Fetch profile with robust fallbacks for field names
			try {
				const prof = await getProfile();
				if (prof && prof.data) {
					const p = prof.data;
					const name = p.name || p.fullName || p.displayName || p.email || "Candidate";
					let photoRaw = p.profileImage || p.photo || p.avatar || p.image || p.profilePicture || p.picture || p.photoUrl || null;
					let photo = normalizePhotoString(photoRaw) || null;
					if (!photo) {
						// use initials SVG data URL
						photo = initialsAvatarDataUrl(name, 128);
					}
					setUser({ name, photo });
				}
			} catch (e) {
				// fallback: derive initials avatar
				setUser((u) => ({ ...u, photo: initialsAvatarDataUrl(u.name || 'Candidate', 128) }));
			}
			setLoading(false);
		};
		load();
	}, [attemptId]);

	// Initialize warnings from session storage for this attempt
	useEffect(() => {
		if (!attemptId) return;
		const key = `exam_warnings_${attemptId}`;
		const stored = sessionStorage.getItem(key);
		if (stored) {
			try { const n = parseInt(stored, 10); if (!Number.isNaN(n)) setWarningsUsed(n); } catch (e) {}
		}
		return () => {};
	}, [attemptId]);

	// prevent page scroll and warn on unload
	useEffect(() => {
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		const handler = (e) => {
			e.preventDefault();
			e.returnValue = "Do not refresh or leave the exam.";
		};
		window.addEventListener("beforeunload", handler);
		return () => {
			document.body.style.overflow = prev;
			window.removeEventListener("beforeunload", handler);
		};
	}, []);


	// Anti-cheating: handlers for visibility, blur, fullscreen exit, right-click, and copy shortcuts
	useEffect(() => {
		if (!attemptId) return;
		let mounted = true;

		const recordWarnings = (reason) => {
			if (!mounted) return;
			if (!running) return; // only while exam running
			if (submitted || interfaceLocked) return;
			// debounce rapid repeated events
			const now = Date.now();
			if (now - (lastViolationRef.current || 0) < 2000) return;
			lastViolationRef.current = now;
			// increment and persist
			setWarningsUsed((prev) => {
				const next = prev + 1;
				try { sessionStorage.setItem(`exam_warnings_${attemptId}`, String(next)); } catch (e) {}
				setWarningRemaining(Math.max(0, 3 - next));
				setWarningReason(reason || 'Suspicious activity');
				// show modal for first 3 warnings
				setShowWarningModal(true);
				// if exceeded threshold -> auto submit
				if (next > 3) {
					// auto submit due to cheating
					setInterfaceLocked(true);
					setCheatingDetected(true);
					// stop timer
					setRunning(false);
					// show terminated modal after submit
					// call submit with cheating flag
					doSubmit(true, { cheatingDetected: true, submissionStatus: 'auto-submitted-cheating', warningsUsed: next }).then(() => {
						setShowTerminatedModal(true);
					}).catch(()=>{
						setShowTerminatedModal(true);
					});
				}
				return next;
			});
		};

		const onVisibilityChange = () => {
			if (document.visibilityState !== 'visible') recordWarnings('Tab switch / visibility lost');
		};
		const onBlur = () => {
			recordWarnings('Window blur / focus lost');
		};
		const onFullscreenChange = () => {
			if (!document.fullscreenElement) {
				recordWarnings('Exited fullscreen');
			}
		};
		const onContextMenu = (e) => {
			// disable right click during exam
			if (running && !submitted && !interfaceLocked) {
				e.preventDefault();
				recordWarnings('Right click');
			}
		};
		const onKeydown = (e) => {
			if (!running || submitted || interfaceLocked) return;
			const ctrl = e.ctrlKey || e.metaKey;
			if (ctrl && ['c','v','a','C','V','A'].includes(e.key)) {
				e.preventDefault();
				recordWarnings('Copy/Paste/Select All shortcut');
			}
			// F11 or ESC to exit fullscreen may be caught by fullscreenchange
		};

		document.addEventListener('visibilitychange', onVisibilityChange);
		window.addEventListener('blur', onBlur);
		document.addEventListener('fullscreenchange', onFullscreenChange);
		document.addEventListener('contextmenu', onContextMenu);
		window.addEventListener('keydown', onKeydown, true);

		// Force fullscreen at start
		try { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(()=>{}); } catch (e) {}

		return () => {
			mounted = false;
			document.removeEventListener('visibilitychange', onVisibilityChange);
			window.removeEventListener('blur', onBlur);
			document.removeEventListener('fullscreenchange', onFullscreenChange);
			document.removeEventListener('contextmenu', onContextMenu);
			window.removeEventListener('keydown', onKeydown, true);
		};
	}, [attemptId, running, submitted, interfaceLocked]);

	// Timer interval
	useEffect(() => {
		if (!running) return;
		if (timeLeft == null) return;
		if (timeLeft <= 0) {
			handleAutoSubmit();
			return;
		}
		const id = setInterval(() => {
			setTimeLeft((t) => (t ? t - 1 : 0));
		}, 1000);
		return () => clearInterval(id);
	}, [running, timeLeft]);

	// autosave to backend (debounced)
	useEffect(() => {
		if (!attemptId) return;
		const to = setTimeout(async () => {
			try {
				await saveQuizCheckpoint({ attemptId, checkpoint: { answers, marked: Array.from(marked), current, timeLeft } });
			} catch (e) {}
		}, 800);
		return () => clearTimeout(to);
	}, [answers, marked, current, timeLeft, attemptId]);

	function enterFullScreen() {
		try {
			const el = document.documentElement;
			if (el.requestFullscreen) el.requestFullscreen();
			else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
		} catch (e) {}
	}

	async function startExam() {
		// acknowledge then start timer and full-screen
		enterFullScreen();
		setShowInstructions(false);
		setRunning(true);
		setTimeLeft(60 * 60); // 1 hour
		// mark visited first question
		if (questions && questions.length > 0) {
			const q = questions[0];
			const qid = q.id ?? q.questionId ?? String(1);
			setVisited((s) => new Set(s).add(qid));
		}
	}

	function markVisited(qid) {
		setVisited((s) => new Set(s).add(qid));
	}

	function gotoQuestion(index) {
		if (index < 0 || index >= questions.length) return;
		setCurrent(index);
		const q = questions[index];
		const qid = q.id ?? q.questionId ?? String(index + 1);
		markVisited(qid);
		if (questionScrollRef.current) questionScrollRef.current.scrollTop = 0;
	}

	function nextQuestion() {
		gotoQuestion(Math.min(questions.length - 1, current + 1));
	}
	function prevQuestion() {
		gotoQuestion(Math.max(0, current - 1));
	}

	function handleSelectOption(q, key) {
		if (submitted || interfaceLocked) return;
		const qid = q.id ?? q.questionId ?? String(current + 1);
		setVisited((s) => new Set(s).add(qid));
		setAnswers((prev) => {
			const next = { ...prev };
			const isMSQ = (q.type || "MCQ").toUpperCase() === "MSQ";
			const currentSel = Array.isArray(next[qid]) ? [...next[qid]] : [];
			if (isMSQ) {
				if (currentSel.includes(key)) {
					// unselect
					next[qid] = currentSel.filter((k) => k !== key);
				} else {
					next[qid] = [...currentSel, key];
				}
			} else {
				// single select
				next[qid] = [key];
			}
			return next;
		});
	}

	function handleClearResponse(q) {
		const qid = q.id ?? q.questionId ?? String(current + 1);
		setAnswers((prev) => {
			const next = { ...prev };
			delete next[qid];
			return next;
		});
	}

	function handleMarkForReview(q) {
		const qid = q.id ?? q.questionId ?? String(current + 1);
		setMarked((prev) => {
			const s = new Set(prev);
			if (s.has(qid)) s.delete(qid);
			else s.add(qid);
			return s;
		});
		// jump to next question for quick workflow
		const next = Math.min(questions.length - 1, current + 1);
		if (next !== current) gotoQuestion(next);
	}

	async function handleAutoSubmit() {
		if (submitted) return;
		await doSubmit(true);
	}

	async function doSubmit(isAuto = false, callerOpts = {}) {
		// Clear console logs and mark submission in progress
		try { console.clear(); } catch (e) {}
		// Use a transient submitting flag to avoid prematurely locking UI
		// and to allow canceling modals without marking as submitted.
		const MARKS_PER_QUESTION = 4;
		const total = questions.length;
		const attempted = Object.keys(answers).length;
		const notAttempted = total - attempted;
		const markedForReview = marked.size;

		let totalObtained = 0;
		const resultAnswers = questions.map((q) => {
			const qid = q.id ?? q.questionId ?? String((q.index ?? 0) + 1);
			const sel = Array.isArray(answers[qid]) ? answers[qid] : [];
			const correct = Array.isArray(q.correct) ? q.correct : (q.correct ? [q.correct] : []);
			let obtained = 0;
			if (correct.length === 0) {
				obtained = 0;
			} else {
				// treat values as strings for comparison stability
				const correctSet = new Set(correct.map((c) => String(c)));
				const selSet = new Set((sel || []).map((s) => String(s)));
				// count correctly selected options
				let correctSelected = 0;
				for (const c of correctSet) if (selSet.has(c)) correctSelected++;

				// Choose marking scheme per-question (fallback to 'simple')
				const scheme = (q.marking && q.marking.scheme) || q.markingScheme || (q.partialMarking ? 'partial' : 'simple');

				// MCQ (single correct) - require exact match
				if (correctSet.size === 1) {
					const single = Array.from(correctSet)[0];
					obtained = (selSet.size === 1 && selSet.has(single)) ? MARKS_PER_QUESTION : 0;
				} else {
					// MSQ rules as requested by product:
					// - Simple (default): If any incorrect option selected -> 0
					//   Otherwise award proportion: (correctSelected / totalCorrect) * full marks
					// - Partial (optional): per-correct option share = MARKS_PER_QUESTION / totalCorrect
					//   (still zero if any incorrect option selected unless question.allowsWrongPartial true)
					const hasWrong = Array.from(selSet).some(s => !correctSet.has(s));
					if (scheme === 'partial') {
						if (hasWrong && !q.allowsWrongPartial) {
							obtained = 0;
						} else {
							obtained = (correctSelected / correctSet.size) * MARKS_PER_QUESTION;
						}
					} else {
						// 'simple' or unknown
						if (hasWrong) obtained = 0;
						else obtained = (correctSelected / correctSet.size) * MARKS_PER_QUESTION;
					}
				}
			}
			totalObtained += obtained;
			return { questionId: qid, selectedOptions: sel, obtainedMarks: Number(obtained.toFixed(2)) };
		});

		const maxMarks = total * MARKS_PER_QUESTION;
		const percentage = maxMarks > 0 ? Math.round((totalObtained / maxMarks) * 100) : 0;

		const warningsCount = (typeof window !== 'undefined' && attemptId) ? (parseInt(sessionStorage.getItem(`exam_warnings_${attemptId}`), 10) || warningsUsed) : warningsUsed;
		const payload = {
			sessionId: attemptId || "",
			totalQuestions: total,
			attempted,
			notAttempted,
			markedForReview,
			warningsUsed: warningsCount,
			cheatingDetected: false,
			submissionStatus: 'normal',
			score: Number(totalObtained.toFixed(2)),
			percentage,
			answers: resultAnswers,
		};

		// apply caller-provided overrides (internal use)
		if (callerOpts.warningsUsed !== undefined) payload.warningsUsed = callerOpts.warningsUsed;
		if (callerOpts.cheatingDetected) {
			payload.cheatingDetected = true;
			payload.submissionStatus = callerOpts.submissionStatus || 'auto-submitted-cheating';
		}

		// lock UI to prevent further interaction while submission is in progress
		setInterfaceLocked(true);
		setSubmitted(true);
		try {
			await submitQuiz({ attemptId, obtainedMarks: Number(totalObtained.toFixed(2)), totalMarks: maxMarks, status: payload.cheatingDetected ? 'auto-submitted-cheating' : 'submitted', answersSummary: payload });
		} catch (e) {
			console.error(e);
		}

		// exit fullscreen and redirect to coach dashboard showing results
		try {
			if (document.fullscreenElement) await document.exitFullscreen();
		} catch (e) {}

		// pass summary via navigation state
		navigate("/dashboard/coach", { state: { result: payload } });
	}

	if (loading) return <div className="h-screen w-screen flex items-center justify-center">Loading exam…</div>;

	if (!questions || questions.length === 0) return <div className="h-screen w-screen flex items-center justify-center">No questions available.</div>;

	const total = questions.length;
	const answeredCount = Object.keys(answers).length;

	const q = questions[current];
	const qid = q.id ?? q.questionId ?? String(current + 1);
	const selected = answers[qid] ?? [];

	return (
		<div className="h-screen w-screen overflow-hidden bg-[#e9ecef] text-gray-900 font-sans flex flex-col">
			{/* Instructions modal (first) */}
			{showInstructions && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
					<div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-gray-300 p-8 mx-4">
						<div className="border-b border-gray-200 pb-4 mb-4">
							<h2 className="text-2xl font-bold text-blue-900 uppercase tracking-wide">Candidate Instructions — Online Examination</h2>
						</div>
						
						<div className="text-sm text-gray-750 space-y-3 mb-6 max-h-[50vh] overflow-y-auto pr-2">
							<p><strong>Total Questions:</strong> {total}</p>
							<p><strong>Duration:</strong> 1 hour (the timer begins when you click "Start Exam").</p>
							<p><strong>Navigation:</strong> Use the question palette on the right to jump between questions. Use the footer controls to move to previous/next questions. Your selected answers are saved automatically.</p>
							<p><strong>Answering:</strong> MCQ = one option; MSQ = multiple options allowed. Click an option to select/unselect. Use <em>Clear</em> to remove selections.</p>
							<p><strong>Mark For Review:</strong> Use this to flag questions you want to revisit. Marked questions are not automatically submitted — they are included with your answers.</p>
							<p><strong>Autosave:</strong> Your answers are autosaved periodically. Still, avoid refreshing the page or closing the browser until you exit via the portal.</p>
							<p><strong>Prohibited Actions:</strong> Do not open multiple tabs/windows for this exam. Switching tabs or refreshing may interrupt the timer — the system may log such events.</p>
							<p><strong>Submission:</strong> When the timer ends the exam will be auto-submitted. You can also submit anytime from the footer — you'll see a confirmation with your attempt summary before final submission.</p>
							<p><strong>Support:</strong> If you face any technical issues, contact proctor/support immediately and include your session id shown in the header.</p>
						</div>

						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pt-4 border-t border-gray-200">
							<label className="flex items-center gap-3 cursor-pointer">
								<input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} className="form-checkbox h-5 w-5 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
								<span className="text-sm font-semibold text-gray-855">I have read, understood, and agree to follow the above instructions.</span>
							</label>

							<label className="flex items-center gap-3 cursor-pointer text-blue-600">
								<input type="checkbox" checked={testingMode} onChange={(e) => setTestingMode(e.target.checked)} className="form-checkbox h-5 w-5 rounded text-blue-650 border-blue-300 focus:ring-blue-500" />
								<span className="text-sm font-extrabold uppercase tracking-wider text-xs">Enable Testing Mode</span>
							</label>
						</div>

						<div className="flex justify-between items-center pt-2 border-t border-gray-100">
							<div className="text-xs text-gray-500 font-mono">Session ID: <strong>{attemptId || 'N/A'}</strong></div>
							<div className="flex justify-end gap-3">
								<button className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold transition-all" onClick={() => { navigate(-1); }}>Cancel</button>
								<button disabled={!acknowledged} onClick={startExam} className={`px-6 py-2.5 rounded-lg text-white font-bold transition-all ${acknowledged ? 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20' : 'bg-gray-300 cursor-not-allowed'}`}>Start Exam</button>
							</div>
						</div>
					</div>

					{/* Simple testing: show correct option letters (A, B, C...) */}
					{testingMode && (
						<div className="absolute bottom-4 left-4 bg-green-50 text-green-800 border border-green-200 px-4 py-2 rounded-xl text-xs font-bold shadow-sm">
							Correct ans: {(() => {
								const keys = q.options ? Object.keys(q.options) : [];
								const map = {};
								keys.forEach((k,i) => { map[k] = String.fromCharCode(65 + i); });
								const correct = Array.isArray(q.correct) ? q.correct : (q.correct ? [q.correct] : []);
								if (!correct || correct.length === 0) return 'N/A';
								return correct.map(c => map[c] ?? String(c)).join(' ');
							})()}
						</div>
					)}
				</div>
			)}

			{/* Header */}
			<header className="bg-[#0f4c81] text-white border-b border-blue-900 z-40 shadow-md">
				<div className="max-w-8xl mx-auto px-6 py-3 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<img src="/logo.png" alt="SkillLens logo" className="h-10 w-10 object-cover rounded-lg bg-white p-0.5 shadow-md" onError={(e)=>{e.currentTarget.onerror=null; e.currentTarget.src='/profile.png';}} />
						<div>
							<div className="text-xl font-bold tracking-tight">SkillLens AI Examination Portal</div>
							<div className="text-[10px] uppercase tracking-widest text-blue-200 font-semibold">Under National Testing Guidelines</div>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<div className="bg-white/10 px-4 py-1.5 rounded-lg border border-white/20 text-center">
							<span className="text-[10px] uppercase font-bold text-blue-200 block leading-none mb-1">Time Left</span>
							<span className={`font-mono font-bold text-lg tracking-wider ${timeLeft !== null && timeLeft <= 300 ? 'text-red-400 animate-pulse' : 'text-white'}`}>{formatTime(timeLeft ?? 0)}</span>
						</div>
					</div>
				</div>
			</header>

			{/* Main Section */}
			<main className="flex-1 flex overflow-hidden pt-4 pb-20">
				<div className="max-w-8xl mx-auto px-4 w-full h-full flex gap-6">
					
					{/* Left - Question Area (75%) */}
					<div className="flex-[3] flex flex-col h-full bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
						
						{/* Question Header */}
						<div className="bg-[#0f4c81]/5 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
							<div className="flex items-center gap-4">
								<span className="bg-[#0f4c81] text-white text-xs font-bold px-3 py-1.5 rounded">
									Question Type: {q.type || "MCQ"}
								</span>
								<h3 className="text-md font-bold text-gray-800">
									Question No. {current + 1} of {total}
								</h3>
							</div>
							<div className="text-xs text-gray-500 font-mono">
								Max Marks: 4.00 | Negative Marks: -1.00
							</div>
						</div>

						{/* Question Scroll area */}
						<div ref={questionScrollRef} className="flex-1 p-6 overflow-y-auto space-y-6">
							{q.scenario && (
								<div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded text-sm text-gray-800 leading-relaxed font-medium">
									{q.scenario}
								</div>
							)}

							<div className="text-base text-gray-900 leading-relaxed font-semibold">
								{q.text || q.question}
							</div>

							{q.code && (
								<pre className="bg-[#2d3748] text-[#f7fafc] rounded-xl p-4 overflow-x-auto font-mono text-sm shadow-inner border border-gray-700">
									<code>{q.code}</code>
								</pre>
							)}

							{/* Options */}
							<div className="grid gap-3.5 max-w-3xl">
								{q.options && Object.entries(q.options).map(([key, text]) => {
									const isSelected = selected.includes(key);
									const correctArr = Array.isArray(q.correct) ? q.correct : (q.correct ? [q.correct] : []);
									const isCorrect = correctArr.includes(key);
									return (
										<button 
											key={key} 
											onClick={() => handleSelectOption(q, key)} 
											className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all flex items-start gap-4 focus:outline-none ${isSelected ? 'bg-blue-50/50 border-blue-500 text-blue-900 shadow-sm' : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'}`}
										>
											<div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 font-bold shrink-0 text-sm ${isSelected ? 'bg-blue-600 border-blue-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-700'}`}>
												{key}
											</div>
											<div className="flex-1 text-sm pt-0.5 flex justify-between items-center">
												<span>{text}</span>
												{testingMode && isCorrect && (
													<span className="text-xs bg-green-100 text-green-800 border border-green-300 px-2 py-0.5 rounded font-black uppercase tracking-wider">Correct Answer</span>
												)}
											</div>
										</button>
									);
								})}
							</div>
						</div>
					</div>

					{/* Right - Profile and Question Palette (25%) */}
					<aside className="flex-[1] flex flex-col h-full bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
						
						{/* Candidate Details Card */}
						<div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
							<img 
								src={user.photo} 
								alt="profile" 
								onError={(e)=>{e.currentTarget.onerror=null; e.currentTarget.src = initialsAvatarDataUrl(user.name || 'Candidate', 128);}} 
								className="h-14 w-14 rounded border border-gray-300 object-cover shadow-sm bg-white" 
							/>
							<div className="overflow-hidden">
								<div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Candidate Name</div>
								<div className="text-sm font-bold text-gray-900 truncate">{user.name}</div>
								<div className="text-[10px] text-gray-500 font-mono mt-0.5">Session: {attemptId ? attemptId.substring(0, 12) : 'N/A'}</div>
							</div>
						</div>

						{/* Question Palette area */}
						<div className="flex-1 p-4 overflow-y-auto space-y-5">
							<div>
								<h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2 mb-3">Question Palette</h3>
								
								{/* Palette Legend */}
								<div className="grid grid-cols-2 gap-3 text-[10px] font-semibold text-gray-600 mb-5 bg-gray-50 p-3 rounded-lg border border-gray-200">
									<div className="flex items-center gap-2">
										<span className="w-6 h-6 flex items-center justify-center bg-white border border-gray-300 text-gray-700 font-bold text-xs rounded">1</span>
										<span>Unseen</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="w-6 h-6 flex items-center justify-center bg-red-500 text-white font-bold text-xs rounded-t-lg rounded-b-lg">1</span>
										<span>Not Answered</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="w-6 h-6 flex items-center justify-center bg-green-600 text-white font-bold text-xs rounded-lg">1</span>
										<span>Answered</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="w-6 h-6 flex items-center justify-center bg-indigo-600 text-white font-bold text-xs rounded-full">1</span>
										<span>Marked</span>
									</div>
									<div className="flex items-center gap-2 col-span-2">
										<span className="w-6 h-6 flex items-center justify-center bg-indigo-600 text-white font-bold text-xs rounded-full border-2 border-green-500">1</span>
										<span>Answered & Marked</span>
									</div>
								</div>

								{/* Palette Grid */}
								<div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
									{questions.map((qq, i) => {
										const id = qq.id ?? qq.questionId ?? String(i+1);
										const isAnswered = Array.isArray(answers[id]) && answers[id].length > 0;
										const isMarked = marked.has(id);
										const isVisited = visited.has(id);
										
										// Visual state classes
										let btnClass = "bg-white border-gray-300 text-gray-700 rounded";
										let extraStyle = {};

										if (isAnswered && isMarked) {
											btnClass = "bg-indigo-600 text-white rounded-full border-2 border-green-500";
										} else if (isMarked) {
											btnClass = "bg-indigo-600 text-white rounded-full";
										} else if (isAnswered) {
											btnClass = "bg-green-600 text-white rounded-lg";
										} else if (isVisited) {
											btnClass = "bg-red-500 text-white rounded-t-lg rounded-b-lg";
										}

										return (
											<button
												key={id}
												onClick={() => gotoQuestion(i)}
												className={`w-10 h-10 flex items-center justify-center text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${btnClass}`}
												style={extraStyle}
											>
												{i + 1}
											</button>
										);
									})}
								</div>
							</div>
						</div>
					</aside>
				</div>
			</main>

			{/* Exit modal */}
			{showExitModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-xs">
					<div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 border border-gray-250">
						<h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Exit Exam</h3>
						<div className="grid grid-cols-2 gap-4 text-sm mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
							<div>Attempted: <strong className="text-green-600">{Object.keys(answers).length}</strong></div>
							<div>Remaining: <strong className="text-red-500">{total - Object.keys(answers).length}</strong></div>
							<div>Marked for review: <strong className="text-indigo-600">{marked.size}</strong></div>
							<div>Visited: <strong>{visited.size}</strong></div>
						</div>
						<div className="flex justify-end gap-3">
							<button className="px-5 py-2.5 rounded-lg bg-white border border-gray-300 font-bold text-gray-700 hover:bg-gray-105" onClick={() => setShowExitModal(false)}>Cancel</button>
							<button className="px-5 py-2.5 rounded-lg bg-gray-900 text-white font-bold hover:bg-black transition-all" onClick={async () => {
								try {
									await saveQuizCheckpoint({ attemptId, checkpoint: { answers, marked: Array.from(marked), current, timeLeft } });
								} catch (e) {}
								setShowExitModal(false);
								navigate('/dashboard/coach');
							}}>Save & Exit</button>
						</div>
					</div>
				</div>
			)}

			{/* Submit modal */}
			{showSubmitModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-xs">
					<div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 border border-gray-250">
						<h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Submit Exam</h3>
						<div className="text-sm mb-6 space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
							<p>Total Questions: <strong>{total}</strong></p>
							<p>Attempted: <strong className="text-green-600">{Object.keys(answers).length}</strong></p>
							<p>Marked for review: <strong className="text-indigo-600">{marked.size}</strong></p>
							<p>Remaining: <strong className="text-red-500">{total - Object.keys(answers).length}</strong></p>
							<p className="mt-4 text-red-600 font-bold border-t pt-2">Once you submit, you will not be able to modify your answers.</p>
						</div>
						<div className="flex justify-end gap-3">
							<button className="px-5 py-2.5 rounded-lg bg-white border border-gray-300 font-bold text-gray-750 hover:bg-gray-105" onClick={() => setShowSubmitModal(false)}>Cancel</button>
							<button className="px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition-all shadow-md shadow-green-500/20" onClick={async () => {
								setShowSubmitModal(false);
								await doSubmit(false);
							}}>Confirm Submit</button>
						</div>
					</div>
				</div>
			)}

			{/* Warning modal for suspicious activity */}
			{showWarningModal && (
				<div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
					<div className="bg-white rounded-xl shadow-2xl w-full max-w-xl p-6 mx-4 border border-red-200" onClick={(e)=>e.stopPropagation()}>
						<h3 className="text-xl font-bold text-red-650 mb-2 flex items-center gap-2">⚠️ Warning – Suspicious Activity</h3>
						<p className="text-sm text-gray-700 mb-5 leading-relaxed">We detected that you left the exam screen. This violates test rules. You have <strong className="text-red-600">{warningRemaining}</strong> warnings remaining. Exceeding 3 warnings will result in auto-submission.</p>
						<div className="flex justify-end gap-3">
							<button className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold" onClick={() => { setShowWarningModal(false); }}>I will not repeat this</button>
							<button className="px-4 py-2 rounded-lg bg-red-650 hover:bg-red-700 text-white font-bold" onClick={async () => {
								setShowWarningModal(false);
								setCheatingDetected(true);
								setInterfaceLocked(true);
								setRunning(false);
								const warningsCount = parseInt(sessionStorage.getItem(`exam_warnings_${attemptId}`), 10) || warningsUsed;
								await doSubmit(false, { cheatingDetected: true, submissionStatus: 'auto-submitted-cheating', warningsUsed: warningsCount });
							}}>
								Exit Exam
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Terminated modal */}
			{showTerminatedModal && (
				<div className="fixed inset-0 z-70 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
					<div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 mx-4 border border-red-300" onClick={(e)=>e.stopPropagation()}>
						<h3 className="text-xl font-bold text-red-650 mb-2">Exam Terminated</h3>
						<p className="text-sm text-gray-700 mb-5 leading-relaxed">You have exceeded the maximum allowed tab/window violations. Your answers have been submitted automatically.</p>
						<div className="flex justify-end">
							<button className="px-5 py-2.5 rounded-lg bg-[#0f4c81] text-white font-bold hover:bg-[#0c3c66]" onClick={() => { setShowTerminatedModal(false); navigate('/dashboard/coach'); }}>View Report</button>
						</div>
					</div>
				</div>
			)}

			{/* Interaction-blocking overlay when interface is locked */}
			{interfaceLocked && !showTerminatedModal && (
				<div className="fixed inset-0 z-80 bg-black bg-opacity-30 flex items-center justify-center">
					<div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
						<div className="text-lg font-bold text-gray-900">Submitting Exam…</div>
						<div className="text-sm text-gray-600 mt-2">Your answers are being securely uploaded to the proctor node.</div>
					</div>
				</div>
			)}

			{/* Footer fixed */}
			<footer className="fixed bottom-0 left-0 right-0 bg-[#f8f9fa] border-t border-gray-300 z-40 shadow-md">
				<div className="max-w-8xl mx-auto px-6 py-3 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<button onClick={prevQuestion} disabled={current===0 || submitted || interfaceLocked} className="px-5 py-2.5 rounded-lg border border-gray-350 bg-white hover:bg-gray-100 text-gray-700 font-bold transition-all disabled:opacity-50">Previous</button>
						<button onClick={() => gotoQuestion(0)} className="px-5 py-2.5 rounded-lg border border-gray-350 bg-white hover:bg-gray-100 text-gray-700 font-bold transition-all">First</button>
					</div>

					<div className="flex items-center gap-2">
						<button onClick={() => handleClearResponse(q)} disabled={submitted || interfaceLocked} className="px-5 py-2.5 rounded-lg border border-gray-350 bg-white hover:bg-gray-100 text-gray-750 font-bold transition-all">Clear Response</button>
						<button onClick={() => handleMarkForReview(q)} disabled={submitted || interfaceLocked} className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-sm">Mark for Review & Next</button>
						<button onClick={() => gotoQuestion(Math.min(total-1, current+1))} disabled={submitted || interfaceLocked} className="px-6 py-2.5 rounded-lg bg-blue-650 hover:bg-blue-700 text-white font-extrabold transition-all shadow-sm">Save & Next</button>
					</div>

					<div className="flex items-center gap-2">
						<button onClick={() => setShowSubmitModal(true)} disabled={submitted || interfaceLocked} className="px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-extrabold transition-all shadow-sm">Submit Exam</button>
						<button onClick={() => setShowExitModal(true)} className="px-5 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-900 text-white font-bold transition-all">Exit Exam</button>
					</div>
				</div>
			</footer>
		</div>
	);
}
