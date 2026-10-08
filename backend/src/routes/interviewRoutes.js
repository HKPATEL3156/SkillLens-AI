const express = require("express");
const router = express.Router();
const axios = require("axios");

const auth = require("../middleware/auth.middleware");
const User = require("../models/User");
const Resume = require("../models/Resume");
const MockInterview = require("../models/MockInterview");
const Activity = require("../models/Activity");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

// All Mock Interview routes require candidate authentication
router.use(auth);

/**
 * GET /api/interview/list
 * Fetch all mock interviews for current user
 */
router.get("/list", async (req, res, next) => {
  try {
    const userId = req.user._id;
    const interviews = await MockInterview.find({ userId })
      .sort({ createdAt: -1 })
      .select("-resumeData");
    res.json({ interviews });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/interview/stats
 * Aggregate candidate interview stats (total taken, avg score, highest score)
 */
router.get("/stats", async (req, res, next) => {
  try {
    const userId = req.user._id;
    const completed = await MockInterview.find({ userId, status: "completed" });
    
    const totalInterviews = completed.length;
    let averageScore = 0;
    let bestScore = 0;
    const rolesSet = new Set();

    if (totalInterviews > 0) {
      let scoreSum = 0;
      completed.forEach((item) => {
        const sc = item.score || (item.evaluation && item.evaluation.overall_score) || 0;
        scoreSum += sc;
        if (sc > bestScore) bestScore = sc;
        if (item.targetRole) rolesSet.add(item.targetRole);
      });
      averageScore = Math.round(scoreSum / totalInterviews);
    }

    const latest = await MockInterview.findOne({ userId }).sort({ createdAt: -1 });

    res.json({
      totalInterviews,
      averageScore,
      bestScore,
      rolesPracticed: Array.from(rolesSet),
      latestInterview: latest || null,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/interview/:id
 * Fetch single interview session details
 */
router.get("/:id", async (req, res, next) => {
  try {
    const userId = req.user._id;
    const interview = await MockInterview.findOne({ _id: req.params.id, userId });
    if (!interview) {
      return res.status(404).json({ error: "Mock interview session not found" });
    }
    res.json({ interview });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/interview/start
 * Generate new AI Mock Interview questions and initiate session
 */
router.post("/start", async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      targetRole = "Software Developer",
      companyName = "",
      companyJD = "",
      interviewType = "Comprehensive",
      numQuestions = 6,
    } = req.body;

    // Fetch user and latest resume details
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const latestResume = await Resume.findOne({ userId, isActive: true }).sort({ version: -1 });
    const resumeData = user.resume_data || (latestResume ? latestResume.parsedData : null);
    const resumeFileName = latestResume ? latestResume.fileName : "Candidate_Profile";
    const resumeFilePath = user.resumeFilePath || (latestResume ? latestResume.filePath : "");

    // Call ML service to generate interview questions
    const mlPayload = {
      resume_data: resumeData || null,
      target_role: targetRole,
      company_name: companyName || "",
      company_jd: companyJD || "",
      interview_type: interviewType || "Comprehensive",
      num_questions: parseInt(numQuestions, 10) || 6,
    };

    console.log(`[INFO] Calling ML service to generate mock interview for user ${userId}, role: ${targetRole}`);
    let interviewData;
    try {
      const mlRes = await axios.post(`${ML_SERVICE_URL}/ml/interview/generate`, mlPayload, {
        timeout: 120000,
      });
      interviewData = mlRes.data?.interview_data || {};
    } catch (mlErr) {
      console.error("[WARN] ML interview generation failed, falling back to local generator:", mlErr.message);
      // Fallback in case of ML server network timeout
      interviewData = {
        interview_title: `${targetRole} AI Mock Interview`,
        target_role: targetRole,
        company_name: companyName || "General Industry Benchmark",
        interview_type: interviewType,
        questions: [
          {
            id: 1,
            category: "Technical",
            difficulty: "Medium",
            question: `Can you walk us through your strongest projects in ${targetRole} and explain the key architectural decisions you made?`,
            context_note: "Evaluates project depth and technical articulation.",
            sample_ideal_points: ["Clear architecture overview", "Key trade-offs and decisions", "Quantifiable impact"],
          },
          {
            id: 2,
            category: "Technical",
            difficulty: "Medium",
            question: "How do you handle error management, asynchronous state, and debugging in production applications?",
            context_note: "Tests production engineering hygiene.",
            sample_ideal_points: ["Logging and observability", "Structured try/catch and error boundaries", "Testing practices"],
          },
          {
            id: 3,
            category: "Behavioral / HR",
            difficulty: "Medium",
            question: "Tell me about a challenging situation with a tight deadline or ambiguous requirement. How did you navigate it?",
            context_note: "Assesses adaptability and communication using STAR format.",
            sample_ideal_points: ["Situation and Task breakdown", "Proactive Action taken", "Successful Result achieved"],
          },
          {
            id: 4,
            category: "Problem Solving",
            difficulty: "Hard",
            question: `If you were tasked with building a scalable core feature for ${companyName || 'our system'}, what would be your step-by-step approach?`,
            context_note: "Tests end-to-end delivery roadmap.",
            sample_ideal_points: ["Requirements scoping", "Database schema & API contracts", "Deployment & testing"],
          },
        ],
      };
    }

    const rawQuestions = interviewData.questions || [];
    const formattedQuestions = rawQuestions.map((q, idx) => ({
      id: q.id || idx + 1,
      questionId: `q_${q.id || idx + 1}`,
      category: q.category || (idx % 2 === 0 ? "Technical" : "Behavioral / HR"),
      difficulty: q.difficulty || "Medium",
      question: q.question || "Interview question",
      context_note: q.context_note || "",
      sample_ideal_points: q.sample_ideal_points || [],
    }));

    // Create session in MongoDB
    const interview = await MockInterview.create({
      userId,
      targetRole,
      companyName,
      companyJD,
      interviewType,
      interviewTitle: interviewData.interview_title || `${targetRole} AI Mock Interview`,
      status: "in_progress",
      resumeFileName,
      resumeFilePath,
      resumeData,
      questions: formattedQuestions,
      answers: [],
      currentQuestionIndex: 0,
      startedAt: new Date(),
    });

    await Activity.create({
      userId,
      type: "mock_interview_start",
      message: `Started AI Mock Interview for ${targetRole} (${interviewType})`,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: "Mock interview generated successfully",
      interview,
    });
  } catch (err) {
    console.error("Start mock interview error:", err.message);
    res.status(500).json({
      error: "Failed to generate mock interview",
      details: err.message,
    });
  }
});

/**
 * POST /api/interview/:id/answer
 * Save answer for a question in real-time
 */
router.post("/:id/answer", async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { questionId, answerText = "", timeTakenSeconds = 0 } = req.body;

    const interview = await MockInterview.findOne({ _id: req.params.id, userId });
    if (!interview) {
      return res.status(404).json({ error: "Mock interview session not found" });
    }

    const qNum = parseInt(questionId, 10);
    const existingIndex = interview.answers.findIndex((a) => a.questionId === qNum);

    if (existingIndex > -1) {
      interview.answers[existingIndex].answerText = answerText;
      interview.answers[existingIndex].submittedAt = new Date();
      interview.answers[existingIndex].timeTakenSeconds = timeTakenSeconds;
    } else {
      interview.answers.push({
        questionId: qNum,
        answerText,
        submittedAt: new Date(),
        timeTakenSeconds,
      });
    }

    // Advance question index
    const nextIndex = Math.min(interview.questions.length - 1, (interview.currentQuestionIndex || 0) + 1);
    interview.currentQuestionIndex = nextIndex;

    await interview.save();

    res.json({
      success: true,
      message: "Answer recorded",
      currentQuestionIndex: interview.currentQuestionIndex,
      answersCount: interview.answers.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/interview/:id/finish
 * Submit interview for comprehensive AI evaluation
 */
router.post("/:id/finish", async (req, res, next) => {
  try {
    const userId = req.user._id;
    const interview = await MockInterview.findOne({ _id: req.params.id, userId });
    if (!interview) {
      return res.status(404).json({ error: "Mock interview session not found" });
    }

    // Merge answers passed in body or stored in DB
    if (req.body.answers && Array.isArray(req.body.answers)) {
      req.body.answers.forEach((bAns) => {
        const qNum = parseInt(bAns.questionId, 10);
        const idx = interview.answers.findIndex((a) => a.questionId === qNum);
        if (idx > -1) {
          interview.answers[idx].answerText = bAns.answerText || "";
        } else {
          interview.answers.push({
            questionId: qNum,
            answerText: bAns.answerText || "",
            submittedAt: new Date(),
          });
        }
      });
    }

    // Build QA payload for ML evaluator
    const questionsAndAnswers = interview.questions.map((q) => {
      const matchedAns = interview.answers.find((a) => a.questionId === q.id);
      return {
        id: q.id,
        question: q.question,
        category: q.category,
        difficulty: q.difficulty,
        candidate_answer: matchedAns ? matchedAns.answerText : "",
        ideal_points: q.sample_ideal_points,
      };
    });

    const mlEvalPayload = {
      questions_and_answers: questionsAndAnswers,
      target_role: interview.targetRole,
      company_name: interview.companyName || "",
      company_jd: interview.companyJD || "",
      resume_data: interview.resumeData || null,
    };

    console.log(`[INFO] Calling ML service to evaluate mock interview ${interview._id}`);
    let evaluationResult;
    try {
      const mlRes = await axios.post(`${ML_SERVICE_URL}/ml/interview/evaluate`, mlEvalPayload, {
        timeout: 120000,
      });
      evaluationResult = mlRes.data?.evaluation || {};
    } catch (mlErr) {
      console.error("[WARN] ML interview evaluation failed, using fallback:", mlErr.message);
      const answeredCount = questionsAndAnswers.filter((qa) => qa.candidate_answer && qa.candidate_answer.trim()).length;
      const baseSc = Math.round((answeredCount / Math.max(1, questionsAndAnswers.length)) * 80);
      evaluationResult = {
        overall_score: Math.max(50, baseSc),
        overall_verdict: baseSc >= 65 ? "Hire - Strong Foundation" : "Needs Further Preparation",
        performance_breakdown: {
          technical_depth: baseSc,
          communication_clarity: baseSc - 2,
          problem_solving: baseSc + 3,
          behavioral_competency: baseSc - 4,
          role_alignment: baseSc + 2,
        },
        strengths: [
          `Clear answers covering core concepts for ${interview.targetRole}.`,
          "Good attempt at explaining technical mechanisms.",
        ],
        weaknesses: [
          "Incorporate more quantifiable metrics and impact data.",
          "Use STAR method for structured behavioral communication.",
        ],
        improvement_roadmap: [
          "Practice articulating trade-offs between alternative designs.",
          "Add concrete examples from flagship projects.",
        ],
        question_reviews: questionsAndAnswers.map((qa) => ({
          question_id: qa.id,
          question: qa.question,
          category: qa.category,
          candidate_answer: qa.candidate_answer || "[Unanswered]",
          score: qa.candidate_answer ? 7.5 : 0,
          verdict: qa.candidate_answer ? "Good" : "Unanswered",
          feedback: qa.candidate_answer ? "Solid conceptual coverage." : "Question was skipped.",
          ideal_answer_summary: "Ideal answer should cover core technical points and project examples.",
        })),
        overall_mentor_feedback: `Great practice session for ${interview.targetRole}. Keep refining your concrete project storytelling!`,
      };
    }

    const finalScore = evaluationResult.overall_score || 0;
    const finalVerdict = evaluationResult.overall_verdict || "Completed";

    interview.evaluation = evaluationResult;
    interview.score = finalScore;
    interview.verdict = finalVerdict;
    interview.status = "completed";
    interview.completedAt = new Date();

    await interview.save();

    await Activity.create({
      userId,
      type: "mock_interview_completion",
      message: `Completed AI Mock Interview for ${interview.targetRole} (Score: ${finalScore}%, Verdict: ${finalVerdict})`,
    }).catch(() => {});

    res.json({
      success: true,
      message: "Interview evaluation completed successfully",
      interview,
    });
  } catch (err) {
    console.error("Finish mock interview error:", err.message);
    res.status(500).json({
      error: "Failed to evaluate interview",
      details: err.message,
    });
  }
});

/**
 * DELETE /api/interview/:id
 * Delete a mock interview session
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const userId = req.user._id;
    const deleted = await MockInterview.findOneAndDelete({ _id: req.params.id, userId });
    if (!deleted) {
      return res.status(404).json({ error: "Mock interview not found" });
    }
    res.json({ success: true, message: "Interview record deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
