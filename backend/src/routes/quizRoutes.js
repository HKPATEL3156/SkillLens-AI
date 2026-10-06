const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const QuizAttempt = require("../models/QuizAttempt");
const Activity = require("../models/Activity");
const SelectedSkills = require("../models/SelectedSkills");
const os = require("os");
const DATA_DIR = path.join(__dirname, "../../data");
const SELECTED_SKILLS_FILE = path.join(DATA_DIR, "selected_skills.json");
const { spawn } = require("child_process");

// Simple in-process generation lock to serialize runs
let generationInProgress = false;
let generationPromise = null;
// jobs map: jobId -> { status: 'pending'|'completed'|'failed', startedAt, finishedAt, error }
const generationJobs = new Map();

function generateQuestionPaper(skills, timeoutMs = 120000) {
  if (generationInProgress && generationPromise) {
    // If generation already in progress, return same promise so callers wait
    return generationPromise;
  }

  generationInProgress = true;
  generationPromise = new Promise((resolve, reject) => {
    try {
      const mlPath = path.join(__dirname, "../../../ml-service");
      // build args
      const args = [
        "quiz.py",
        "--skills",
        Array.isArray(skills) ? skills.join(",") : String(skills || ""),
      ];
      const proc = spawn("python", args, { cwd: mlPath, windowsHide: true });

      let stdout = "";
      let stderr = "";
      const timer = setTimeout(() => {
        try {
          proc.kill();
        } catch (e) { }
        stderr += "\nGeneration timed out";
      }, timeoutMs);

      proc.stdout.on("data", (d) => {
        stdout += d.toString();
      });
      proc.stderr.on("data", (d) => {
        stderr += d.toString();
      });
      proc.on("error", (err) => {
        clearTimeout(timer);
        generationInProgress = false;
        generationPromise = null;
        reject(err);
      });
      proc.on("close", (code) => {
        clearTimeout(timer);
        generationInProgress = false;
        generationPromise = null;
        if (code === 0) {
          // success - resolve
          resolve({ stdout, stderr });
        } else {
          const e = new Error(`Generator exited with code ${code}: ${stderr}`);
          reject(e);
        }
      });
    } catch (ex) {
      generationInProgress = false;
      generationPromise = null;
      reject(ex);
    }
  });

  return generationPromise;
}

// POST /quiz/generate -> start generation job, return jobId immediately
router.post("/generate", async (req, res) => {
  try {
    const { skills: bodySkills = [] } = req.body || {};
    const skills = Array.isArray(bodySkills)
      ? bodySkills
      : String(bodySkills || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    const jobId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    generationJobs.set(jobId, {
      status: "pending",
      startedAt: new Date().toISOString(),
      finishedAt: null,
      error: null,
      stdout: "",
      stderr: "",
      skills,
    });

    // start generation but don't block response - capture output per job
    generateQuestionPaper(skills)
      .then(({ stdout, stderr }) => {
        const job = generationJobs.get(jobId) || {};
        generationJobs.set(jobId, {
          ...job,
          status: "completed",
          finishedAt: new Date().toISOString(),
          stdout: stdout || "",
          stderr: stderr || "",
        });
      })
      .catch((err) => {
        const job = generationJobs.get(jobId) || {};
        generationJobs.set(jobId, {
          ...job,
          status: "failed",
          finishedAt: new Date().toISOString(),
          error: err.message,
          stderr: err.message || "",
        });
      });

    res.status(202).json({ jobId, status: "pending" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to start generation", details: err.message });
  }
});

// GET /quiz/generate/status?jobId= -> return job status
router.get("/generate/status", (req, res) => {
  try {
    const { jobId } = req.query;
    if (!jobId) return res.status(400).json({ error: "jobId required" });
    const job = generationJobs.get(String(jobId));
    if (!job) return res.status(404).json({ error: "job not found" });
    res.json(job);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to get job status", details: err.message });
  }
});

// GET /quiz/generate/logs?jobId=
router.get("/generate/logs", (req, res) => {
  try {
    const { jobId } = req.query;
    if (!jobId) return res.status(400).json({ error: "jobId required" });
    const job = generationJobs.get(String(jobId));
    if (!job) return res.status(404).json({ error: "job not found" });
    res.json({
      stdout: job.stdout || "",
      stderr: job.stderr || "",
      error: job.error || null,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to get job logs", details: err.message });
  }
});

// GET /quiz/paper-status -> check if questionpaper.json exists and return mtime
router.get("/paper-status", (req, res) => {
  try {
    const file = path.join(__dirname, "../../data/questionpaper.json");
    if (!fs.existsSync(file)) return res.json({ exists: false });
    const st = fs.statSync(file);
    return res.json({
      exists: true,
      mtime: st.mtime.toISOString(),
      mtimeMs: st.mtimeMs,
      size: st.size,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to check paper status", details: err.message });
  }
});

// all quiz routes require auth
router.use(auth);

// GET questions (reads backend/data/questions.json)
// GET questions
// If attemptId is provided, return the questionSet stored for that attempt.
// Otherwise, read master file and return a randomized set (not persisted).
router.get("/questions", async (req, res) => {
  try {
    const { attemptId } = req.query;
    if (attemptId) {
      // support local fallback attempts saved to data/attempts/<attemptId>.json
      if (String(attemptId).startsWith("local-")) {
        const attemptsDir = path.join(__dirname, "../../data/attempts");
        const file = path.join(attemptsDir, `${attemptId}.json`);
        if (!fs.existsSync(file))
          return res.status(404).json({ error: "Attempt not found" });
        const raw = fs.readFileSync(file, "utf8");
        const data = JSON.parse(raw);
        if (String(data.userId) !== String(req.user.id)) {
          return res.status(403).json({ error: "Forbidden: Access denied to this attempt" });
        }
        return res.json({ questions: data.questionSet || [] });
      }
      const attempt = await QuizAttempt.findById(attemptId).lean();
      if (!attempt) return res.status(404).json({ error: "Attempt not found" });
      if (String(attempt.userId) !== String(req.user.id)) {
        return res.status(403).json({ error: "Forbidden: Access denied to this attempt" });
      }
      return res.json({ questions: attempt.questionSet || [] });
    }

    const file = path.join(__dirname, "../../data/questionpaper.json");
    if (!fs.existsSync(file)) return res.json({ questions: [] });
    const raw = fs.readFileSync(file, "utf8");
    const data = JSON.parse(raw);
    let questions = Array.isArray(data) ? data : data.questions || [];
    // return randomized copy
    questions = shuffleArray(questions)
      .slice(0, 25)
      .map((q) => {
        // preserve option order as given in the master file (do NOT shuffle options)
        if (q.options && typeof q.options === "object") {
          const newOptions = {};
          for (const [k, v] of Object.entries(q.options)) newOptions[k] = v;
          return { ...q, options: newOptions };
        }
        return q;
      });
    res.json({ questions });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to load questions", details: err.message });
  }
});

// POST start quiz -> create attempt
router.post("/start", async (req, res) => {
  try {
    const { skills: bodySkills = [], quizName = "Skill Quiz" } = req.body;
    // determine skills to use: body -> SelectedSkills DB -> fallback file -> empty
    let skills =
      Array.isArray(bodySkills) && bodySkills.length ? bodySkills : null;
    if (!skills) {
      try {
        const doc = await SelectedSkills.findOne({
          userId: req.user.id,
        }).lean();
        if (doc && Array.isArray(doc.skills) && doc.skills.length)
          skills = doc.skills;
      } catch (e) {
        /* ignore DB error */
      }
    }
    if (!skills) {
      try {
        if (fs.existsSync(SELECTED_SKILLS_FILE)) {
          const raw = fs.readFileSync(SELECTED_SKILLS_FILE, "utf8");
          const data = JSON.parse(raw);
          if (Array.isArray(data) && data.length) skills = data;
          else if (data && Array.isArray(data.skills) && data.skills.length)
            skills = data.skills;
        }
      } catch (e) {
        /* ignore file read error */
      }
    }
    skills = skills || [];

    // If question paper file is not present, generate one. If it exists, skip generation.
    try {
      const paperFile = path.join(__dirname, "../../data/questionpaper.json");
      if (!fs.existsSync(paperFile)) {
        // generation may take time; run and wait here as fallback
        await generateQuestionPaper(skills);
      }
    } catch (genErr) {
      return res
        .status(500)
        .json({
          error: "Failed to generate question paper",
          details: genErr.message,
        });
    }
    // load master questions and create randomized set for this attempt
    const file = path.join(__dirname, "../../data/questionpaper.json");
    let questions = [];
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, "utf8");
      const data = JSON.parse(raw);
      questions = Array.isArray(data) ? data : data.questions || [];
    }
    const questionSet = shuffleArray(questions)
      .slice(0, 25)
      .map((q) => {
        // preserve option order (do NOT shuffle options)
        if (q.options && typeof q.options === "object") {
          const newOptions = {};
          for (const [k, v] of Object.entries(q.options)) newOptions[k] = v;
          return { ...q, options: newOptions };
        }
        return q;
      });

    // Try creating attempt in DB; if DB is unavailable, fall back to local file-based attempt
    try {
      const attempt = await QuizAttempt.create({
        userId: req.user.id,
        skills,
        quizName,
        status: "started",
        questionSet,
      });
      await Activity.create({
        userId: req.user.id,
        type: "quiz_start",
        message: `Started quiz ${quizName}`,
      }).catch(() => { });
      return res.json({ attemptId: attempt._id, startedAt: attempt.startedAt });
    } catch (dbErr) {
      // create local attempt file
      try {
        const attemptsDir = path.join(__dirname, "../../data/attempts");
        if (!fs.existsSync(attemptsDir))
          fs.mkdirSync(attemptsDir, { recursive: true });
        const localId = `local-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const localAttempt = {
          _id: localId,
          userId: req.user.id,
          skills,
          quizName,
          status: "started",
          questionSet,
          startedAt: new Date().toISOString(),
        };
        const file = path.join(attemptsDir, `${localId}.json`);
        fs.writeFileSync(file, JSON.stringify(localAttempt, null, 2), "utf8");
        return res.json({
          attemptId: localId,
          startedAt: localAttempt.startedAt,
        });
      } catch (fileErr) {
        return res
          .status(500)
          .json({
            error: "Failed to create attempt",
            details: fileErr.message,
          });
      }
    }
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to start quiz", details: err.message });
  }
});

// POST save checkpoint (autosave)
router.post("/save", async (req, res) => {
  try {
    const { attemptId, checkpoint = {} } = req.body;
    if (!attemptId)
      return res.status(400).json({ error: "attemptId required" });
    if (String(attemptId).startsWith("local-")) {
      const attemptsDir = path.join(__dirname, "../../data/attempts");
      const file = path.join(attemptsDir, `${attemptId}.json`);
      if (!fs.existsSync(file))
        return res.status(404).json({ error: "Attempt not found" });
      const raw = fs.readFileSync(file, "utf8");
      const data = JSON.parse(raw);
      // ensure user matches
      if (String(data.userId) !== String(req.user.id))
        return res.status(403).json({ error: "Forbidden" });
      data.checkpoint = checkpoint;
      fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
      return res.json({ message: "Checkpoint saved" });
    }
    const attempt = await QuizAttempt.findOneAndUpdate(
      { _id: attemptId, userId: req.user.id },
      { $set: { checkpoint } },
      { returnDocument: "after" },
    );
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    res.json({ message: "Checkpoint saved" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to save checkpoint", details: err.message });
  }
});

// POST submit quiz -> save results or cancelled
router.post("/submit", async (req, res) => {
  try {
    const {
      attemptId,
      obtainedMarks = 0,
      totalMarks = 0,
      status = "submitted",
      answersSummary = {},
    } = req.body;
    if (!attemptId)
      return res.status(400).json({ error: "attemptId required" });
    const percentVal = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;
    const qualifiedVal = percentVal >= 70;
    const update = {
      obtainedMarks,
      totalMarks,
      percent: percentVal,
      qualified: qualifiedVal,
      status,
      answersSummary,
      submittedAt: status === "submitted" ? new Date() : undefined,
    };
    const userId = req.user._id || req.user.id;
    if (String(attemptId).startsWith("local-")) {
      const attemptsDir = path.join(__dirname, "../../data/attempts");
      const file = path.join(attemptsDir, `${attemptId}.json`);
      if (!fs.existsSync(file))
        return res.status(404).json({ error: "Attempt not found" });
      const raw = fs.readFileSync(file, "utf8");
      const data = JSON.parse(raw);
      if (String(data.userId) !== String(userId))
        return res.status(403).json({ error: "Forbidden" });
      data.obtainedMarks = obtainedMarks;
      data.totalMarks = totalMarks;
      data.percent = percentVal;
      data.qualified = qualifiedVal;
      data.status = status;
      data.answersSummary = answersSummary;
      data.submittedAt =
        status === "submitted" ? new Date().toISOString() : undefined;
      fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
      await Activity.create({
        userId,
        type: status === "submitted" ? "quiz_submit" : "quiz_cancel",
        message: `Quiz ${status} (Score: ${obtainedMarks}/${totalMarks}, ${percentVal}%)`,
      }).catch(() => { });
      return res.json({ message: "Quiz saved", attempt: data });
    }
    const attempt = await QuizAttempt.findOneAndUpdate(
      { _id: attemptId, userId },
      update,
      { returnDocument: "after" },
    );
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    await Activity.create({
      userId,
      type: status === "submitted" ? "quiz_submit" : "quiz_cancel",
      message: `Quiz ${status} (Score: ${obtainedMarks}/${totalMarks}, ${percentVal}%)`,
    }).catch(() => { });
    res.json({ message: "Quiz saved", attempt });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to submit quiz", details: err.message });
  }
});

// GET attempts list for user
router.get("/attempts", async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    // append local attempts from data/attempts
    try {
      const attemptsDir = path.join(__dirname, "../../data/attempts");
      if (fs.existsSync(attemptsDir)) {
        const files = fs.readdirSync(attemptsDir);
        for (const f of files) {
          if (!f.endsWith(".json")) continue;
          const raw = fs.readFileSync(path.join(attemptsDir, f), "utf8");
          const data = JSON.parse(raw);
          if (String(data.userId) === String(req.user.id)) attempts.push(data);
        }
      }
    } catch (e) {
      // ignore file read errors
    }
    res.json({ attempts });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch attempts", details: err.message });
  }
});

// GET single attempt details
router.get("/attempts/:id", async (req, res) => {
  try {
    const attemptId = req.params.id;
    if (!attemptId) return res.status(400).json({ error: "attemptId required" });

    if (String(attemptId).startsWith("local-")) {
      const attemptsDir = path.join(__dirname, "../../data/attempts");
      const file = path.join(attemptsDir, `${attemptId}.json`);
      if (!fs.existsSync(file)) return res.status(404).json({ error: "Attempt not found" });
      const raw = fs.readFileSync(file, "utf8");
      const data = JSON.parse(raw);
      if (String(data.userId) !== String(req.user._id || req.user.id)) {
        return res.status(403).json({ error: "Forbidden: Access denied to this attempt" });
      }
      return res.json({ attempt: data });
    }

    const attempt = await QuizAttempt.findOne({
      _id: attemptId,
      userId: req.user._id || req.user.id,
    }).lean();

    if (!attempt) return res.status(404).json({ error: "Quiz attempt not found" });
    res.json({ attempt });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch attempt details", details: err.message });
  }
});

// GET selected skills for current user (strictly from DB per candidate)
router.get("/selected-skills", async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const doc = await SelectedSkills.findOne({ userId }).lean();
    if (doc && Array.isArray(doc.skills)) {
      return res.json({ skills: doc.skills });
    }
    return res.json({ skills: [] });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch selected skills", details: err.message });
  }
});

// POST save selected skills for current user (strictly DB upsert per candidate)
router.post("/selected-skills", async (req, res) => {
  try {
    const { skills } = req.body;
    if (!Array.isArray(skills))
      return res.status(400).json({ error: "skills must be an array" });

    const userId = req.user._id || req.user.id;
    const upd = await SelectedSkills.findOneAndUpdate(
      { userId },
      { $set: { skills } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return res.json({ skills: upd.skills });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to save selected skills", details: err.message });
  }
});

module.exports = router;

// utility: Fisher-Yates shuffle
function shuffleArray(arr) {
  const a = Array.isArray(arr) ? arr.slice() : [];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
