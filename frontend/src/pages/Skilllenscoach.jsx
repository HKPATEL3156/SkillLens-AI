
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api, { getQuestions, startQuiz, submitQuiz, getQuizAttempts, saveQualifiedSkills } from "../services/api";

const Step = ({ idx, title, open, onToggle, locked, children }) => (
  <div className={`group rounded-3xl mb-6 transition-all duration-300 bg-white border border-slate-100 ${open ? 'ring-2 ring-blue-100 shadow-2xl scale-[1.01]' : 'hover:shadow-lg'}`} style={{ overflow: 'hidden' }}>
    <button
      className={`w-full flex items-center justify-between px-6 py-4 focus:outline-none ${locked ? 'opacity-80' : ''}`}
      onClick={locked ? undefined : onToggle}
      aria-expanded={open}
    >
      <div className="flex items-center gap-5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-extrabold transition-all ${locked ? 'bg-slate-100 text-slate-400' : open ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-xl transform -rotate-2' : 'bg-slate-100 text-slate-700 group-hover:bg-indigo-50'}`}>{idx}</div>
        <div className="font-extrabold text-lg text-slate-900">{title}</div>
      </div>
      <div className="flex items-center gap-3">
        {locked ? <span className="text-sm text-slate-400 uppercase tracking-wider">Locked</span> : <span className={`text-2xl transition-colors ${open ? 'text-indigo-600' : 'text-slate-300'}`}>{open ? '−' : '+'}</span>}
      </div>
    </button>
    {open && !locked && (
      <div className="px-6 pb-6 pt-3 animate-fadein">
        <div className="h-px bg-slate-100 mb-6 w-full" />
        {children}
      </div>
    )}
  </div>
);

const SkillLensCoach = () => {
  const [skills, setSkills] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [openStep, setOpenStep] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState('');
  const [starting, setStarting] = useState(false);
  const [genJobId, setGenJobId] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [career, setCareer] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [submittingReport, setSubmittingReport] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetch = async () => {
      try {
        const s = await api.get("/career/skills");
        setSkills(s.data.skills || []);
      } catch (e) { }
      try {
        const me = await api.get("/career/me");
        setCareer(me.data || null);
        if (me.data && Array.isArray(me.data.selectedSkills)) setSelected(me.data.selectedSkills || []);
      } catch (e) { }
      try {
        // load selected skills from quiz service (persisted)
        const ss = await api.get('/quiz/selected-skills');
        if (ss.data && Array.isArray(ss.data.skills)) setSelected(ss.data.skills || []);
      } catch (e) { }
      try {
        // Fetch full user profile which often contains detailed education/cgpa fields
        const p = await api.get("/profile/me");
        setProfileData(p.data || null);
      } catch (e) {
        // non-fatal
      }
      try {
        const res = await getQuizAttempts();
        setAttempts(res.data.attempts || []);
      } catch (e) { }
    };
    fetch();
  }, []);

  // (qualified skills are derived from backend eligibility or career doc)

  useEffect(() => {
    if (location.state && location.state.marks !== undefined) {
      alert(`Quiz completed: ${location.state.marks} marks`);
      // refresh attempts
      getQuizAttempts().then((r) => setAttempts(r.data.attempts || [])).catch(() => { });
      // clear state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const toggleSkill = (skill) => {
    if (selected.includes(skill)) setSelected(selected.filter((s) => s !== skill));
    else setSelected([...selected, skill]);
  };

  const saveSkills = async () => {
    try {
      setLoading(true);
      await api.post('/quiz/selected-skills', { skills: selected });
      alert("Skills saved");
    } catch (e) {
      alert("Error saving skills");
    } finally {
      setLoading(false);
    }
  };

  const resetSkills = async () => {
    try {
      setSelected([]);
      await api.post('/quiz/selected-skills', { skills: [] });
    } catch (e) { }
  };

  const handleStartQuiz = async () => {
    if (selected.length === 0) return alert("Select at least one skill first");
    if (generating || starting) return; // prevent re-entrancy
    try {
      setGenerating(true);
      setStarting(false);
      setGenMessage('Generating question paper...');
      // trigger generation job
      const genResp = await api.post('/quiz/generate', { skills: selected });
      const jobId = genResp.data.jobId;
      setGenJobId(jobId);

      // poll status until completed or failed (no fixed timeout). If status endpoint missing (404),
      // fallback to polling the presence of questionpaper.json via /quiz/paper-status.
      let status = null;
      let backoff = 1000; // start 1s
      let pollCount = 0;
      let usePaperFallback = false;
      while (true) {
        try {
          const st = await api.get(`/quiz/generate/status?jobId=${jobId}`);
          status = st.data.status;
          pollCount += 1;
          if (status === 'completed') break;
          if (status === 'failed') throw new Error(st.data.error || 'generation failed');
          // setGenMessage(`Waiting for generation: ${status} (poll ${pollCount})`);
          setGenMessage(`Waiting for start the exam (status: ${status})...`);
        } catch (statusErr) {
          // if 404, enable fallback mode to poll for the generated file
          if (statusErr.response && statusErr.response.status === 404) {
            usePaperFallback = true;
            setGenMessage('Waiting for question paper (fallback) ...');
            break;
          }
          throw statusErr;
        }
        await new Promise((r) => setTimeout(r, backoff));
        backoff = Math.min(10000, Math.round(backoff * 1.5));
      }

      // fallback: poll for paper file if needed
      if (usePaperFallback) {
        let paperBackoff = 1000;
        while (true) {
          const ps = await api.get('/quiz/paper-status');
          if (ps.data && ps.data.exists) break;
          setGenMessage(`Waiting for question paper (file not yet present) ...`);
          await new Promise((r) => setTimeout(r, paperBackoff));
          paperBackoff = Math.min(10000, Math.round(paperBackoff * 1.5));
        }
      }
      // start the quiz after generation completes
      setGenMessage('Starting quiz...');
      setStarting(true);
      const resp = await startQuiz({ skills: selected, quizName: "SkillLens Quiz" });
      const { attemptId } = resp.data;
      navigate(`/exam?attemptId=${attemptId}`);
    } catch (e) {
      console.error(e);
      // attempt to fetch logs for job
      try {
        if (genJobId) {
          const logs = await api.get(`/quiz/generate/logs?jobId=${genJobId}`);
          const out = logs.data.stdout || '';
          const err = logs.data.stderr || logs.data.error || '';
          alert(`Generation failed: ${e.message}\n\nLogs:\n${err || out || 'no logs'}`);
        } else {
          alert(`Failed to start quiz: ${e.message || 'Server error'}`);
        }
      } catch (le) {
        alert(`Failed to start quiz: ${e.message || 'Server error'}`);
      }
    } finally {
      setGenerating(false);
      setStarting(false);
      setGenMessage('');
      setGenJobId(null);
    }
  };

  // Helper: extract CGPAs and percentage equivalents from career and user profiles.
  // Properly converts 10-point CGPA scales (<= 10, multiplied by 10) and handles raw percentages (> 10).
  function extractCgpas(careerProfile, userProfile) {
    const careerEdu = careerProfile && Array.isArray(careerProfile.education) ? careerProfile.education : [];
    const userEdu = userProfile && Array.isArray(userProfile.education) ? userProfile.education : [];
    const maxLen = Math.max(careerEdu.length, userEdu.length);
    const out = [];

    for (let i = 0; i < maxLen; i++) {
      const c = careerEdu[i] || {};
      const u = userEdu[i] || {};
      const merged = { ...c, ...u };

      // direct cgpa-like fields
      const direct = merged.cgpa ?? merged.CGPA ?? merged.gpa ?? merged.grade;
      let cgpaVal = null;
      if (direct !== undefined && direct !== null && direct !== '') {
        const n = parseFloat(String(direct).replace(/[^0-9.]/g, ""));
        if (!Number.isNaN(n) && n > 0) cgpaVal = n;
      }

      // fallback: compute avg from semesterWise / semesterWise.sgpa
      if (cgpaVal === null && Array.isArray(merged.semesterWise) && merged.semesterWise.length) {
        const svals = merged.semesterWise
          .map((s) => (s && typeof s === 'object' ? (Number(s.sgpa) || 0) : parseFloat(s) || 0))
          .filter((n) => !Number.isNaN(n) && n > 0);
        if (svals.length) {
          const avg = svals.reduce((a, b) => a + b, 0) / svals.length;
          cgpaVal = Number(avg.toFixed(2));
        }
      }

      if (cgpaVal !== null) {
        const isCgpaScale = cgpaVal <= 10;
        const percentage = Math.min(100, Math.max(0, Number((isCgpaScale ? cgpaVal * 10 : cgpaVal).toFixed(2))));
        out.push({
          level: merged.level || merged.degree || merged.institution || `Education ${i + 1}`,
          cgpa: cgpaVal,
          percentage,
          isCgpaScale,
          board: merged.boardUniversity || merged.board || merged.institution || ''
        });
      }
    }

    return out;
  }

  // Calculate Academic Grade as arithmetic mean of converted percentages
  const getAcademicGrade = (cgpaList) => {
    if (!cgpaList || !cgpaList.length) return 0;
    const sum = cgpaList.reduce((acc, item) => acc + (Number(item.percentage) || 0), 0);
    return Math.min(100, Math.max(0, Number((sum / cgpaList.length).toFixed(2))));
  };

  // Submit result report: posts academic and skill grades
  const submitResultReport = async () => {
    if (submittingReport) return;
    const cgpas = extractCgpas(career, profileData);
    const academicGrade = getAcademicGrade(cgpas);

    // compute skill grade: prefer latest submitted attempt percentage, fallback to avgSkillScore
    const submittedAttempts = attempts.filter(a => a.status === 'submitted');
    let skillGrade = 0;
    if (submittedAttempts.length > 0) {
      const sorted = submittedAttempts.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const latest = sorted[0];
      skillGrade = latest.percent !== undefined
        ? Number(latest.percent)
        : (latest.totalMarks ? Math.round((Number(latest.obtainedMarks || 0) / Number(latest.totalMarks)) * 100) : Number(latest.obtainedMarks || 0));
    } else if (avgSkillScore) {
      skillGrade = Number(avgSkillScore);
    }

    const avgGrade = Number(((academicGrade + skillGrade) / 2).toFixed(2));

    const payload = {
      academicGrade,
      skillGrade,
      avgGrade,
      academic_score: academicGrade,
      avg_skill_score: skillGrade,
      cgpas,
      qualified_skills: filteredSkills || [],
      submittedAt: new Date().toISOString(),
    };

    try {
      setSubmittingReport(true);
      const res = await api.post('/career/submit-result', payload);
      alert('Result report submitted successfully!');
      if (res.data && res.data.career) {
        setCareer(res.data.career);
      } else {
        const me = await api.get('/career/me');
        setCareer(me.data || null);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to submit report: ' + (e.response?.data?.message || e.message));
    } finally {
      setSubmittingReport(false);
    }
  };

  // lock logic: step1 unlocked if skills extracted present; step2 unlocked if selectedSkills saved or selected non-empty; step3 unlocked if a submitted attempt exists; step4 unlocked if step3 and result report exists
  const step1Done = skills && skills.length > 0;
  // step2 is unlocked only after step1 is done
  const step1Locked = false;
  const step2Locked = !step1Done;

  // step3 (Result Report) unlocked only when there is at least one submitted attempt
  const hasSubmittedAttempt = attempts.some((a) => a.status === 'submitted');
  const step3Locked = !hasSubmittedAttempt;
  const step3Done = hasSubmittedAttempt;
  const step4Locked = !step3Done;

  // Career Recommendation (Step 4) state
  const [qualifiedSkills, setQualifiedSkills] = useState([]); // skills with score >= 70
  const [filteredSkills, setFilteredSkills] = useState([]); // user can remove
  const [academicScore, setAcademicScore] = useState(0);
  const [avgSkillScore, setAvgSkillScore] = useState(0);
  const [skillScores, setSkillScores] = useState({});
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [gapResults, setGapResults] = useState({}); // map roleName -> analysis result
  const [analyzingRole, setAnalyzingRole] = useState(null); // currently analyzing roleName
  const [savingAnalysis, setSavingAnalysis] = useState(false);
  const [activeGapRole, setActiveGapRole] = useState(null); // normalized role key to show in modal
  const [skillFilter, setSkillFilter] = useState('');
  // deprecated evaluatedList/selectedEvaluated removed; use qualified skills instead

  // derive academic and skill scores from profile/attempts
  useEffect(() => {
    // Prefer backend eligibility calculation for consistent business logic
    (async () => {
      try {
        // If career doc has evaluatedSkills saved, prefer that authoritative source
        if (career && Array.isArray(career.qualifiedSkills) && career.qualifiedSkills.length) {
          const evalAll = career.qualifiedSkills.map((es) => ({ skill: es.skill, bestScore: es.bestScore }));
          const scoresMap = {};
          evalAll.forEach((it) => { scoresMap[it.skill] = Number(it.bestScore) || 0; });
          // detect whether evaluated data appears to be empty (all zeros)
          const vals = Object.values(scoresMap).filter(n => typeof n === 'number');
          const allZero = vals.length > 0 && vals.every(v => Number(v) === 0);
          if (!allZero) {
            // use DB evaluated skills when they contain meaningful scores
            const sorted = evalAll.slice().sort((a, b) => (Number(b.bestScore || 0) - Number(a.bestScore || 0)));
            // qualified skills come from career.qualifiedSkills; we derive maps and UI from qualifiedSkills
            setSkillScores(scoresMap);
            const qualified = sorted.filter((e) => Number(e.bestScore) >= 70).map(e => e.skill);
            setQualifiedSkills(qualified);
            setFilteredSkills(qualified.slice());
            const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
            setAvgSkillScore(avg);
            // academic: try using career.academic if present
            if (career && career.academic_score) setAcademicScore(career.academic_score);
            else {
              const res = await api.get('/career/eligibility');
              const data = res.data || {};
              setAcademicScore(data.academic_score || 0);
            }
            return;
          }
          // else fall through to fetch eligibility (attempt-derived) below
        }
        const res = await api.get('/career/eligibility');
        const data = res.data || {};
        setAcademicScore(data.academic_score || 0);
        setAvgSkillScore(data.avg_skill_score || 0);
        const evalAll = Array.isArray(data.evaluated_all_skills) ? data.evaluated_all_skills : [];
        const scoresMap = {};
        evalAll.forEach((it) => { scoresMap[it.skill] = it.bestScore; });
        setSkillScores(scoresMap);
        const qualified = Array.isArray(data.qualified_skills) ? data.qualified_skills.map(s => typeof s === 'string' ? s : s.skill) : [];
        setQualifiedSkills(qualified);
        setFilteredSkills(qualified.slice());
      } catch (e) {
        // fallback to local derivation if backend fails
        try {
          const cgpas = extractCgpas(career, profileData);
          const academic = getAcademicGrade(cgpas);
          setAcademicScore(academic);
          const submitted = attempts.filter((a) => a.status === 'submitted');
          const skillMax = {};
          (selected || []).forEach((s) => (skillMax[s] = 0));
          for (const att of submitted) {
            let attScores = {};
            if (att.skillScores && typeof att.skillScores === 'object') attScores = att.skillScores;
            else if (att.quiz_scores && typeof att.quiz_scores === 'object') attScores = att.quiz_scores;
            else if (att.obtainedMarks !== undefined) {
              const pct = Math.round((Number(att.obtainedMarks) / (Number(att.totalMarks) || 100)) * 100);
              const attSkillsRaw = String(att.skills || '').toLowerCase();
              (selected || []).forEach((sk) => {
                const skKey = String(sk || '').toLowerCase().replace(/\s+/g, '');
                if (!skKey) return;
                if (attSkillsRaw.includes(skKey) || (att.skills && att.skills.split(',').map(x => x.trim().toLowerCase()).includes(sk.toLowerCase()))) {
                  attScores[sk] = pct;
                }
              });
            }
            Object.keys(attScores).forEach((k) => {
              const val = Number(attScores[k]) || 0;
              if (!(k in skillMax) || skillMax[k] < val) skillMax[k] = val;
            });
          }
          (selected || []).forEach((s) => { if (!(s in skillMax)) skillMax[s] = 0; });
          setSkillScores(skillMax);
          const vals = Object.values(skillMax).filter((v) => typeof v === 'number');
          const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
          setAvgSkillScore(avg);
          const qualified = Object.keys(skillMax).filter((k) => (skillMax[k] || 0) >= 70);
          setQualifiedSkills(qualified);
          setFilteredSkills(qualified);
        } catch (ee) { console.error('derive fallback error', ee); }
      }
    })();
  }, [attempts, selected, career, profileData]);

  // Helper: resolve a skill's best score from various sources
  const getSkillScore = (skillName) => {
    if (!skillName) return 0;
    if (skillScores && Object.prototype.hasOwnProperty.call(skillScores, skillName)) return skillScores[skillName];
    const keys = Object.keys(skillScores || {});
    const foundKey = keys.find((k) => String(k).toLowerCase() === String(skillName).toLowerCase());
    if (foundKey) return skillScores[foundKey];
    if (career && Array.isArray(career.qualifiedSkills)) {
      const found = career.qualifiedSkills.find((q) => String(q.skill).toLowerCase() === String(skillName).toLowerCase());
      if (found) return Number(found.bestScore) || 0;
    }
    return 0;
  };

  // Normalize a role name into a stable key for storing analysis results
  const normalizeRoleKey = (name) => String(name || "").trim().replace(/_/g, " ").replace(/\s+/g, " ").toLowerCase();

  const eligible = (Number(academicScore || 0) >= 70) && (Number(avgSkillScore || 0) >= 70);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      {(generating || starting) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-3 shadow-lg">
            <div className="animate-spin rounded-full border-4 border-t-4 border-gray-200 border-t-blue-600 h-12 w-12"></div>
            <div className="text-lg font-semibold">{genMessage || (starting ? 'Starting quiz...' : 'Generating question paper...')}</div>
            <div className="text-sm text-gray-500">Please wait — this may take up to a minute.</div>
          </div>
        </div>
      )}
      {/* Header: Premium name + info */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-8 px-8 flex flex-col md:flex-row items-center md:justify-between rounded-b-3xl shadow-lg mb-8">
        <div className="flex items-center gap-5">
          {/* Logo image: place your logo at `/public/logo.png` or adjust the path below */}
          {!logoError ? (
            <img
              src="/logo.png"
              alt="SkillLens logo"
              className="w-16 h-16 object-cover shadow-lg"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="w-16 h-16 bg-white/80 flex items-center justify-center shadow-lg" />
          )}
          <div>
            <div className="text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow">SkillLens AI Coach</div>
            <div className="text-lg text-blue-100 mt-2 font-medium">Your guided path to skill assessment and career growth</div>
          </div>
        </div>
        {/* Optional: Add user info, logo, or navigation here */}
      </div>

      <div className="max-w-5xl mx-auto px-6">
        {/* Steps */}
        <div className="mb-8">
          <Step idx={1} title="Extract Skills from Resume" open={openStep === 1} onToggle={() => setOpenStep(openStep === 1 ? null : 1)} locked={step1Locked}>
            {!step1Done ? (
              <div className="text-red-500 font-medium">No extracted skills found. Please upload your resume first.</div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <input
                    placeholder="Filter skills..."
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  <button onClick={() => {
                    const visible = skills.filter(s => s.toLowerCase().includes((skillFilter || '').trim().toLowerCase()));
                    const toAdd = visible.filter(s => !selected.includes(s));
                    if (toAdd.length) setSelected([...selected, ...toAdd]);
                  }} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm">Select Visible</button>
                  <button onClick={() => setSelected([])} className="px-3 py-2 bg-white border border-slate-200 text-sm rounded-lg">Clear</button>
                </div>

                <div className="max-h-48 overflow-y-auto pr-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {skills.filter(s => s.toLowerCase().includes((skillFilter || '').trim().toLowerCase())).map((skill, i) => {
                      const isSelected = selected.includes(skill);
                      return (
                        <button
                          key={i}
                          onClick={() => toggleSkill(skill)}
                          aria-pressed={isSelected}
                          className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-full transition-colors text-sm ${isSelected ? 'bg-indigo-600 text-white shadow' : 'bg-white border border-slate-100 hover:bg-indigo-50'}`}>
                          <span className="truncate font-semibold">{skill}</span>
                          {isSelected ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <button onClick={saveSkills} disabled={loading || selected.length === 0} className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-extrabold shadow-xl disabled:opacity-50 transition-transform active:scale-95">{loading ? 'Saving...' : 'Confirm Selection'}</button>
              <button onClick={resetSkills} className="bg-white border border-slate-200 px-5 py-3 rounded-2xl font-semibold hover:bg-slate-50">Reset Inventory</button>
            </div>
          </Step>

          <Step idx={2} title="Take Skill Quiz" open={openStep === 2} onToggle={() => setOpenStep(openStep === 2 ? null : 2)} locked={step2Locked}>
            {/* Step 2: Premium, modern design */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#059669" /></svg>
                </div>
                <div className="text-lg font-bold text-gray-800">Ready to test your skills?</div>
              </div>
              <div className="mb-3 text-sm text-gray-700">Selected skills: {selected.length > 0 ? selected.map((s, i) => <span key={i} className="text-blue-700 font-semibold mr-2">{s}</span>) : <span className="text-gray-400">None</span>}</div>
              <button onClick={handleStartQuiz} disabled={generating || starting} className={`px-6 py-2 rounded-lg font-semibold shadow mb-6 ${generating || starting ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}>Start Quiz</button>
            </div>
            {/* Quiz Attempts Table: Only in Step 2 */}
            <div className="bg-white rounded-xl shadow border border-blue-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-base font-bold text-blue-700">Your Quiz Attempts</div>
              </div>
              <div className="overflow-x-auto overflow-y-auto max-h-72">
                <table className="w-full table-auto text-sm rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-blue-50 text-blue-900">
                      <th className="p-3 font-semibold">No</th>
                      <th className="p-3 font-semibold">Date</th>
                      <th className="p-3 font-semibold">Skills</th>
                      <th className="p-3 font-semibold">Quiz</th>
                      <th className="p-3 font-semibold">Total</th>
                      <th className="p-3 font-semibold">Obtained</th>
                      <th className="p-3 font-semibold">Qualified</th>
                      <th className="p-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.length === 0 && (
                      <tr><td colSpan={7} className="p-6 text-center text-gray-400">No quiz attempts yet</td></tr>
                    )}
                    {attempts.map((a, idx) => (
                      <tr key={a._id} className="border-t hover:bg-blue-50 transition">
                        <td className="p-3 font-semibold text-center">{idx + 1}</td>
                        <td className="p-3">{new Date(a.createdAt).toLocaleString()}</td>
                        <td className="p-3">{(a.skills || []).map((s, i) => (<span key={i} className="text-blue-700 font-semibold mr-1">{s}</span>))}</td>
                        <td className="p-3">{a.quizName}</td>
                        <td className="p-3 text-center">{a.totalMarks || 100}</td>
                        <td className="p-3 text-center font-bold text-green-700">{a.obtainedMarks || 0}</td>
                        <td className="p-3 text-center">{(a.percent !== undefined ? (a.percent >= 70 ? 'Yes' : 'No') : ((a.totalMarks ? Math.round((Number(a.obtainedMarks || 0) / a.totalMarks) * 10000) / 100 : (a.obtainedMarks || 0)) >= 70 ? 'Yes' : 'No'))}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${a.status === 'submitted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{a.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Step>

          <Step idx={3} title="Result Report" open={openStep === 3} onToggle={() => setOpenStep(openStep === 3 ? null : 3)} locked={step3Locked}>
            <div className="text-sm text-gray-700 mb-4">Results combine normalized academic scores and quiz marks. Review the computed grades below and click <span className="font-semibold text-indigo-700">Submit Result Report</span> to push the final report.</div>

            {(() => {
              const cgpas = extractCgpas(career, profileData);
              const computedAcademicGrade = getAcademicGrade(cgpas);

              const subs = attempts.filter(a => a.status === 'submitted').slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              const latest = subs.length > 0 ? subs[0] : null;
              const quizScoreVal = latest
                ? (latest.percent !== undefined
                    ? Number(latest.percent)
                    : (latest.totalMarks ? Math.round((Number(latest.obtainedMarks || 0) / Number(latest.totalMarks)) * 100) : Number(latest.obtainedMarks || 0)))
                : (avgSkillScore || 0);

              const overallAvgVal = Number(((computedAcademicGrade + quizScoreVal) / 2).toFixed(2));

              // Combine any submitted results from career.careerResults with submitted quiz attempts
              const savedResults = Array.isArray(career?.careerResults) ? career.careerResults.filter(r => r && (r.academicGrade !== undefined || r.academic_score !== undefined || r.submittedAt)) : [];

              return (
                <div>
                  {/* Display education CGPAs with normalized percentage conversion */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                      <div>
                        <div className="text-base font-bold text-slate-800">Academic Records &amp; CGPAs</div>
                        <div className="text-xs text-slate-500">Converted to standardized percentage (10-pt scale &times; 10)</div>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full self-start sm:self-auto">
                        <span>Academic Avg:</span>
                        <span className="text-indigo-900">{computedAcademicGrade}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-sm">
                      {cgpas.length === 0 ? (
                        <div className="col-span-full py-4 text-center text-gray-500">No CGPA or academic data available in profile.</div>
                      ) : (
                        cgpas.map((c, i) => (
                          <div key={i} className="p-4 bg-gradient-to-br from-slate-50 to-indigo-50/20 border border-slate-200/70 rounded-xl flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div className="font-bold text-slate-800 text-sm">{c.level || `Education ${i + 1}`}</div>
                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${c.isCgpaScale ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {c.isCgpaScale ? '10-Pt CGPA' : 'Percentage'}
                                </span>
                              </div>
                              {c.board && (
                                <div className="text-xs text-slate-500 mt-1 line-clamp-1" title={c.board}>{c.board}</div>
                              )}
                            </div>

                            <div className="mt-4">
                              <div className="flex items-baseline justify-between">
                                <div className="text-2xl font-black text-indigo-600">
                                  {c.cgpa}
                                  <span className="text-xs font-normal text-slate-500 ml-1">{c.isCgpaScale ? 'CGPA' : '%'}</span>
                                </div>
                                <div className="text-sm font-bold text-slate-700">
                                  {c.percentage}%
                                </div>
                              </div>
                              <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-indigo-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(100, Math.max(0, c.percentage))}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Latest quiz marks and grade boxes with corrected titles and values */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    <div className="p-5 bg-white border border-emerald-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">Quiz Score</div>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      </div>
                      <div className="text-3xl font-black text-emerald-600 my-1">
                        {quizScoreVal}%
                      </div>
                      <div className="text-xs text-slate-500">
                        Score from skill assessment quiz
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.max(0, quizScoreVal))}%` }}></div>
                      </div>
                    </div>

                    <div className="p-5 bg-white border border-indigo-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs font-bold uppercase tracking-wider text-indigo-700">Academic Grade</div>
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                      </div>
                      <div className="text-3xl font-black text-indigo-600 my-1">
                        {computedAcademicGrade}%
                      </div>
                      <div className="text-xs text-slate-500">
                        Average of {cgpas.length} converted academic record{cgpas.length === 1 ? '' : 's'}
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.max(0, computedAcademicGrade))}%` }}></div>
                      </div>
                    </div>

                    <div className="p-5 bg-white border border-amber-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs font-bold uppercase tracking-wider text-amber-700">Overall Average Grade</div>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      </div>
                      <div className="text-3xl font-black text-amber-600 my-1">
                        {overallAvgVal}%
                      </div>
                      <div className="text-xs text-slate-500">
                        Combined Academic (50%) &amp; Quiz (50%)
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.max(0, overallAvgVal))}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="mb-6 flex items-center gap-3">
                    <button
                      onClick={submitResultReport}
                      disabled={submittingReport || cgpas.length === 0}
                      className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {submittingReport ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Submitting Report...</span>
                        </>
                      ) : (
                        <span>Submit Result Report</span>
                      )}
                    </button>
                    <span className="text-xs text-slate-500">Submitting synchronizes your verified grades with recruiter profiles.</span>
                  </div>

                  {/* Results table built from submitted reports and attempts */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-base font-bold text-slate-800">Submitted Reports</div>
                        <div className="text-xs text-slate-500">Chronological history of your evaluated performance</div>
                      </div>
                      <div className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-full text-slate-600">
                        {savedResults.length > 0 ? `${savedResults.length} Finalized` : `${subs.length} Quiz Attempt${subs.length === 1 ? '' : 's'}`}
                      </div>
                    </div>

                    <div className="overflow-x-auto max-h-72 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left bg-slate-50 text-slate-700 border-b border-slate-100">
                            <th className="p-3 font-bold">No</th>
                            <th className="p-3 font-bold">Date</th>
                            <th className="p-3 font-bold">Academic Grade</th>
                            <th className="p-3 font-bold">Skill Grade</th>
                            <th className="p-3 font-bold">Avg Grade</th>
                            <th className="p-3 font-bold text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {savedResults.length === 0 && subs.length === 0 && (
                            <tr><td colSpan={6} className="p-6 text-center text-gray-400 font-medium">No submitted reports yet</td></tr>
                          )}
                          {/* Prefer displaying finalized saved career results if available */}
                          {savedResults.length > 0 ? (
                            savedResults.slice().reverse().map((r, idx) => {
                              const rAcad = Number(r.academicGrade ?? r.academic_score ?? computedAcademicGrade).toFixed(2);
                              const rSkill = Number(r.skillGrade ?? r.avg_skill_score ?? quizScoreVal).toFixed(2);
                              const rAvg = Number(r.avgGrade ?? ((Number(rAcad) + Number(rSkill)) / 2)).toFixed(2);
                              const rDate = r.submittedAt || r.created_at || new Date();
                              return (
                                <tr key={r._id || idx} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                                  <td className="p-3 font-semibold text-slate-600">{idx + 1}</td>
                                  <td className="p-3 text-slate-700">{new Date(rDate).toLocaleString()}</td>
                                  <td className="p-3 font-bold text-indigo-600">{rAcad}%</td>
                                  <td className="p-3 font-bold text-emerald-600">{rSkill}%</td>
                                  <td className="p-3 font-bold text-amber-600">{rAvg}%</td>
                                  <td className="p-3 text-center">
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                                      submitted
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            /* Fallback to submitted attempts with accurately normalized grades */
                            subs.map((a, idx) => {
                              const attSkill = a.percent !== undefined
                                ? Number(a.percent)
                                : (a.totalMarks ? Math.round((Number(a.obtainedMarks || 0) / Number(a.totalMarks)) * 100) : Number(a.obtainedMarks || 0));
                              const attAvg = Number(((computedAcademicGrade + attSkill) / 2).toFixed(2));
                              return (
                                <tr key={a._id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                                  <td className="p-3 font-semibold text-slate-600">{idx + 1}</td>
                                  <td className="p-3 text-slate-700">{new Date(a.createdAt).toLocaleString()}</td>
                                  <td className="p-3 font-bold text-indigo-600">{computedAcademicGrade}%</td>
                                  <td className="p-3 font-bold text-emerald-600">{attSkill}%</td>
                                  <td className="p-3 font-bold text-amber-600">{attAvg}%</td>
                                  <td className="p-3 text-center">
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                                      {a.status || 'submitted'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </Step>

          <Step idx={4} title="Career Recommendation" open={openStep === 4} onToggle={() => setOpenStep(openStep === 4 ? null : 4)} locked={step4Locked}>
            <div>
              {/* Improved Eligibility Card */}
              <div className="bg-white p-6 rounded-xl shadow mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${eligible ? 'bg-green-50' : 'bg-rose-50'}`}>
                      {eligible ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      )}
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-800">{eligible ? 'Eligible for Job Opportunities' : 'Not Eligible Yet'}</div>
                      <div className="text-sm text-gray-500 mt-1">{eligible ? 'Your academic and skill performance meet the minimum criteria.' : 'Improve academics or skill scores to become eligible.'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                      <div className="text-xs text-gray-500">Academic</div>
                      <div className="text-2xl font-bold text-indigo-600">{academicScore || 'N/A'}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                      <div className="text-xs text-gray-500">Quiz Score</div>
                      <div className="text-2xl font-bold text-yellow-600">{avgSkillScore !== null && avgSkillScore !== undefined ? avgSkillScore : 'N/A'}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                      <div className="text-xs text-gray-500">Qualified Skills</div>
                      <div className="text-2xl font-bold text-green-700">{filteredSkills.length}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Qualified Skills */}
              <div className="bg-white p-4 rounded shadow mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-base font-semibold">Qualified Skills (score ≥ 70)</div>
                  <div className="text-sm text-gray-500">Showing qualified skills and marks</div>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {filteredSkills.length === 0 && <div className="text-gray-400">No qualified skills found.</div>}
                  <div className="flex flex-wrap gap-2">
                    {filteredSkills.map((s, i) => {
                      const score = getSkillScore(s) || 0;
                      return (
                        <div key={i} className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-1 rounded-full">
                          <span className="font-semibold text-sm truncate max-w-[160px]">{s}</span>
                          <span className="text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full">{score}</span>
                          <button onClick={(e) => { e.stopPropagation(); setFilteredSkills(filteredSkills.filter(x => x !== s)); }} className="text-xs text-gray-400 hover:text-gray-700 ml-1">×</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Saved Roles */}
              <div className="bg-white p-4 rounded shadow mb-4">
                <div className="text-base font-semibold mb-2">Saved Roles</div>
                {eligible ? (
                  career && Array.isArray(career.savedRoles) && career.savedRoles.length ? (
                    <div className="flex gap-2 flex-wrap">
                      {career.savedRoles.map((r, i) => (
                        <div key={i} className="px-3 py-1 bg-blue-50 rounded text-sm text-blue-800">{r.role}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">No saved roles</div>
                  )
                ) : (
                  <div className="text-sm text-gray-500">Saved roles are visible only when eligible</div>
                )}
              </div>

              {/* Analyze button */}
              <div className="mb-4">
                <button disabled={filteredSkills.length === 0 || loadingRoles} onClick={async () => {
                  setLoadingRoles(true);
                  try {
                    const payload = { skills: filteredSkills, academic_score: academicScore, avg_skill_score: avgSkillScore };
                    const res = await api.post('/ml/job-role', payload);
                    const data = res.data || {};
                    setRoles(Array.isArray(data.roles) ? data.roles : (data.roles || []));
                  } catch (e) { console.error(e); alert('Failed to analyze job roles'); } finally { setLoadingRoles(false); }
                }} className={`px-6 py-2 rounded-lg font-semibold ${loadingRoles ? 'bg-gray-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                  {loadingRoles ? 'Analyzing...' : 'Analyze Roles'}
                </button>
              </div>

              {/* Roles list: simplified cards with two actions each */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.length === 0 && (
                  <div className="text-gray-500">No roles found. Click "Analyze Roles" to get recommendations.</div>
                )}
                {roles.map((r, idx) => {
                  // r can be string or object
                  const roleName = typeof r === 'string' ? r : (r.name || r.role || r.title || 'Role');
                  // prefer backend-provided required_skills when available
                  const req = Array.isArray(r.required_skills) ? r.required_skills : (r.requiredSkills || r.required || []);
                  // normalize skill strings
                  const reqNorm = (req || []).map(s => String(s).trim()).filter(Boolean);
                  const matched = reqNorm.filter(s => filteredSkills.map(x => String(x).toLowerCase()).includes(s.toLowerCase()));
                  const missing = reqNorm.filter(s => !filteredSkills.map(x => String(x).toLowerCase()).includes(s.toLowerCase()));
                  const matchPct = reqNorm.length ? Math.round((matched.length / reqNorm.length) * 100) : (r.match_pct || r.matchPct || 0);
                  // stable key used to store/read analysis results for this role
                  const renderedRoleKey = normalizeRoleKey(roleName);

                  return (
                    <div key={idx} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                      <div className="md:grid md:grid-cols-12 gap-4 h-full items-stretch">
                        <div className="md:col-span-9 pr-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between mb-2">
                              <div className="text-lg font-semibold text-gray-800 leading-tight">{roleName.replace(/_/g, ' ')}</div>
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-gray-500">Match</div>
                                <div className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-sm">{matchPct}%</div>
                              </div>
                            </div>

                            <div className="w-full bg-gray-100 rounded h-2 overflow-hidden mb-3">
                              <div className="bg-indigo-600 h-2 transition-all" style={{ width: `${Math.min(100, Math.max(0, matchPct))}%` }} />
                            </div>

                            <div className="text-sm text-gray-700 mb-2 font-medium">Required skills:</div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                              {reqNorm.length === 0 && <div className="text-gray-400 col-span-full">—</div>}
                              {reqNorm.map((s, i) => {
                                const isMatched = matched.map(m => m.toLowerCase()).includes(s.toLowerCase());
                                return (
                                  <div key={i} className={`inline-flex items-center px-2 py-1 rounded-full text-sm ${isMatched ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'} truncate`}>
                                    {s}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="text-sm text-gray-700">
                              <div><strong>Matched:</strong> {matched.length ? matched.join(', ') : '—'}</div>
                              <div className="mt-1"><strong>Missing:</strong> {missing.length ? missing.join(', ') : '—'}</div>
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-3 flex flex-col justify-center gap-3 items-stretch">
                          <button onClick={() => navigate(`/jobs?role=${encodeURIComponent(roleName)}`)} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold bg-green-600 text-white rounded-md hover:bg-green-700 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v4a1 1 0 001 1h3l2 3h4l2-3h3a1 1 0 001-1V7M7 7V4a2 2 0 012-2h6a2 2 0 012 2v3" /></svg>
                            <span>Find Jobs</span>
                          </button>

                          <button
                            onClick={async () => {
                              const key = renderedRoleKey;
                              setAnalyzingRole(key);
                              try {
                                const g = await api.post("/career/skill-gap", { role: roleName, user_skills: filteredSkills });
                                setGapResults((prev) => ({ ...prev, [key]: { label: roleName, data: g.data || null } }));
                                // open modal to show results immediately
                                setActiveGapRole(key);
                              } catch (e) {
                                console.error(e);
                                const msg = e && e.response && e.response.data && e.response.data.message ? e.response.data.message : (e.message || 'Skill gap analysis failed');
                                alert(msg);
                              } finally {
                                setAnalyzingRole(null);
                              }
                            }}
                            disabled={analyzingRole && analyzingRole !== renderedRoleKey}
                            className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition ${analyzingRole === renderedRoleKey ? 'bg-orange-400 text-white' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
                            {analyzingRole === renderedRoleKey ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
                                <span>Analyzing...</span>
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>
                                <span>Analyze Gap</span>
                              </>
                            )}
                          </button>

                          <button onClick={async () => {
                            setSavingAnalysis(true);
                            try {
                              await api.post('/career/save-role', { role: roleName });
                              // refresh career doc to show saved roles
                              const me = await api.get('/career/me'); setCareer(me.data || null);
                              alert('Role saved');
                            } catch (e) { console.error(e); alert('Failed to save role'); }
                            setSavingAnalysis(false);
                          }} disabled={savingAnalysis} className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition ${savingAnalysis ? 'opacity-60 cursor-not-allowed' : ''}`}>
                            {savingAnalysis ? 'Saving...' : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5v14a2 2 0 002 2h10a2 2 0 002-2V5M7 7h10" /></svg>
                                <span>Save Role</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>


                    </div>
                  );
                })}
              </div>
            </div>
          </Step>
        </div>
      </div>

      {/* Skill Gap Modal (shows missing skills in a focused panel) */}
      {activeGapRole && gapResults && gapResults[activeGapRole] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setActiveGapRole(null)} />
          <div className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 p-6 z-10">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-bold">{gapResults[activeGapRole].label}</div>
                <div className="text-sm text-gray-500">Skill Gap Analysis</div>
              </div>
              <button onClick={() => setActiveGapRole(null)} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>
            <div className="mt-4">
              {(() => {
                const entry = gapResults[activeGapRole].data || {};
                const missing = Array.isArray(entry.missing_skills) ? entry.missing_skills : [];
                return (
                  <>
                    <div className="text-sm text-gray-700 mb-3">Missing skills: <span className="font-semibold">{missing.length}</span></div>
                    {missing.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {missing.map((m, i) => (
                          <div key={i} className="px-3 py-1 bg-rose-50 text-rose-800 rounded-md text-sm">{m}</div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-green-700">No missing skills — you match this role well.</div>
                    )}
                    {entry.suggestion && <div className="mt-4 text-sm text-gray-600">Suggestion: {entry.suggestion}</div>}
                  </>
                );
              })()}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setActiveGapRole(null)} className="px-4 py-2 bg-gray-100 rounded-md">Close</button>
              <button onClick={async () => {
                setSavingAnalysis(true);
                try {
                  const roleLabel = gapResults[activeGapRole].label;
                  await api.post('/career/save-role', { role: roleLabel });
                  const me = await api.get('/career/me'); setCareer(me.data || null);
                  setActiveGapRole(null);
                  alert('Role saved');
                } catch (e) { console.error(e); alert('Failed to save role'); }
                setSavingAnalysis(false);
              }} disabled={savingAnalysis} className={`px-4 py-2 rounded-md text-white ${savingAnalysis ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {savingAnalysis ? 'Saving...' : 'Save Role'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SkillLensCoach;
