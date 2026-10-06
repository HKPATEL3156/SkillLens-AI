const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const axios = require("axios");

const auth = require("../middleware/auth.middleware");
const User = require("../models/User");
const Resume = require("../models/Resume");
const ResumeATS = require("../models/ResumeATS");
const Activity = require("../models/Activity");
const { resumeUpload } = require("../utils/Upload");
const { processResumeUpload } = require("../utils/resumeParserHelper");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

// All ATS routes require authentication
router.use(auth);

/**
 * GET /api/ats/current
 * Fetch candidate's current resume status and latest ATS analysis
 */
router.get("/current", async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("fullName email preferredRole resumeFilePath resume_data skills");
    if (!user) return res.status(404).json({ error: "User not found" });

    // Fetch latest Resume document to get file hash
    const latestResume = await Resume.findOne({ userId, isActive: true }).sort({ version: -1 });

    // Fetch latest ATS analysis
    const latestAnalysis = await ResumeATS.findOne({ userId }).sort({ createdAt: -1 });

    res.json({
      hasResume: Boolean(user.resumeFilePath || (latestResume && latestResume.filePath)),
      resumeFilePath: user.resumeFilePath || (latestResume && latestResume.filePath) || null,
      resumeFileName: latestResume ? latestResume.fileName : (user.resumeFilePath ? path.basename(user.resumeFilePath) : null),
      fileHash: latestResume ? latestResume.fileHash : null,
      preferredRole: user.preferredRole || "Software Developer / Engineer",
      resume_data: user.resume_data || (latestResume ? latestResume.parsedData : null),
      skills: user.skills || [],
      latestAnalysis: latestAnalysis || null,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ats/analyze
 * Analyzes the candidate's existing resume. Includes duplicate detection to prevent redundant AI API calls.
 */
router.post("/analyze", async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { targetJobRole = "Software Developer / Engineer", forceReanalyze = false } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const latestResume = await Resume.findOne({ userId, isActive: true }).sort({ version: -1 });
    const resumePath = user.resumeFilePath || (latestResume && latestResume.filePath);
    const resumeData = user.resume_data || (latestResume && latestResume.parsedData);

    if (!resumePath && !resumeData) {
      return res.status(400).json({
        error: "No resume found. Please upload your resume first to analyze ATS score.",
      });
    }

    // Determine file hash for caching & duplicate detection
    let fileHash = latestResume ? latestResume.fileHash : null;
    if (!fileHash && resumePath) {
      const fullPath = path.join(__dirname, "../..", resumePath.replace(/^\//, ""));
      if (fs.existsSync(fullPath)) {
        const buffer = fs.readFileSync(fullPath);
        fileHash = crypto.createHash("sha256").update(buffer).digest("hex");
      }
    }

    const normalizedRole = (targetJobRole || user.preferredRole || "Software Developer / Engineer").trim();

    // Security & token saving check: Duplicate analysis check
    if (fileHash && !forceReanalyze) {
      const existing = await ResumeATS.findOne({
        userId,
        fileHash,
        targetJobRole: new RegExp(`^${normalizedRole}$`, "i"),
      }).sort({ createdAt: -1 });

      if (existing) {
        return res.json({
          duplicate: true,
          warning: "Identical resume has already been evaluated for this target role. You can view existing results or re-analyze.",
          analysis: existing,
        });
      }
    }

    // Resolve system file path for ML service
    let absFilePath = "";
    if (resumePath) {
      absFilePath = path.resolve(path.join(__dirname, "../..", resumePath.replace(/^\//, "")));
    }

    // Call ML Service ATS endpoint
    const mlPayload = {
      filepath: absFilePath && fs.existsSync(absFilePath) ? absFilePath : null,
      resume_data: resumeData || null,
      target_job_role: normalizedRole,
    };

    console.log(`[INFO] Calling ML ATS service for user ${userId} with target role: ${normalizedRole}`);
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/ml/resume-ats`, mlPayload, {
      timeout: 120000,
    });

    const atsResult = (mlResponse.data && mlResponse.data.ats_result) || {};
    if (!atsResult.ats_score && atsResult.ats_score !== 0) {
      return res.status(502).json({ error: "ML service failed to return structured ATS evaluation." });
    }

    const fileName = latestResume ? latestResume.fileName : (resumePath ? path.basename(resumePath) : "Candidate_Resume");

    // Save ATS analysis record to MongoDB
    const newATS = await ResumeATS.create({
      userId,
      resumeFileName: fileName,
      resumeFilePath: resumePath,
      fileHash: fileHash || `hash-${Date.now()}`,
      targetJobRole: normalizedRole,
      atsScore: atsResult.ats_score,
      scoreBreakdown: atsResult.score_breakdown || {},
      resumeCompleteness: atsResult.resume_completeness || {},
      skillsAnalysis: atsResult.skills_analysis || {},
      jobRoleMatch: atsResult.job_role_match || {},
      contentQuality: atsResult.content_quality || {},
      experienceAnalysis: atsResult.experience_analysis || {},
      projectAnalysis: atsResult.project_analysis || {},
      strengths: atsResult.strengths || [],
      weaknesses: atsResult.weaknesses || [],
      improvementSuggestions: atsResult.improvement_suggestions || [],
      overallFeedback: atsResult.overall_feedback || "",
      rawOutput: atsResult,
    });

    await Activity.create({
      userId,
      type: "resume_ats_analysis",
      message: `Completed Resume ATS & Placement Analysis (Score: ${atsResult.ats_score}%, Role: ${normalizedRole})`,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: "Resume ATS analysis generated successfully",
      analysis: newATS,
    });
  } catch (err) {
    console.error("Resume ATS evaluation error:", err.message);
    res.status(500).json({
      error: "Failed to perform ATS analysis",
      details: err.response?.data?.details || err.message,
    });
  }
});

/**
 * GET /api/ats/history
 * Fetch past resume ATS evaluations for comparison and tracking improvement
 */
router.get("/history", async (req, res, next) => {
  try {
    const userId = req.user._id;
    const history = await ResumeATS.find({ userId }).sort({ createdAt: -1 }).limit(30);
    res.json({ history });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ats/analysis/:id
 * Fetch single ATS analysis by ID
 */
router.get("/analysis/:id", async (req, res, next) => {
  try {
    const userId = req.user._id;
    const analysis = await ResumeATS.findOne({ _id: req.params.id, userId });
    if (!analysis) return res.status(404).json({ error: "ATS Analysis record not found" });
    res.json({ analysis });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ats/upload-analyze
 * Upload a new resume version and immediately perform ATS analysis
 */
router.post("/upload-analyze", resumeUpload.single("resume"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No resume file uploaded" });
    const userId = req.user._id;
    const targetJobRole = (req.body.targetJobRole || "Software Developer / Engineer").trim();

    // 1. Process and save uploaded resume
    const uploadResult = await processResumeUpload(userId, req.file);
    const resumeRecord = uploadResult.resume;

    // 2. Perform ATS analysis
    const absPath = path.resolve(req.file.path);
    const mlPayload = {
      filepath: absPath,
      resume_data: resumeRecord.parsedData || null,
      target_job_role: targetJobRole,
    };

    const mlResponse = await axios.post(`${ML_SERVICE_URL}/ml/resume-ats`, mlPayload, {
      timeout: 120000,
    });

    const atsResult = (mlResponse.data && mlResponse.data.ats_result) || {};
    const newATS = await ResumeATS.create({
      userId,
      resumeFileName: req.file.originalname,
      resumeFilePath: `/uploads/resumes/${req.file.filename}`,
      fileHash: resumeRecord.fileHash,
      targetJobRole,
      atsScore: atsResult.ats_score || 0,
      scoreBreakdown: atsResult.score_breakdown || {},
      resumeCompleteness: atsResult.resume_completeness || {},
      skillsAnalysis: atsResult.skills_analysis || {},
      jobRoleMatch: atsResult.job_role_match || {},
      contentQuality: atsResult.content_quality || {},
      experienceAnalysis: atsResult.experience_analysis || {},
      projectAnalysis: atsResult.project_analysis || {},
      strengths: atsResult.strengths || [],
      weaknesses: atsResult.weaknesses || [],
      improvementSuggestions: atsResult.improvement_suggestions || [],
      overallFeedback: atsResult.overall_feedback || "",
      rawOutput: atsResult,
    });

    await Activity.create({
      userId,
      type: "resume_ats_analysis",
      message: `Uploaded new resume and completed ATS Analysis (Score: ${newATS.atsScore}%, Role: ${targetJobRole})`,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: "New resume uploaded and ATS evaluation completed",
      analysis: newATS,
    });
  } catch (err) {
    console.error("Upload & ATS analysis error:", err.message);
    res.status(500).json({
      error: "Failed to upload and analyze resume",
      details: err.response?.data?.details || err.message,
    });
  }
});

module.exports = router;
