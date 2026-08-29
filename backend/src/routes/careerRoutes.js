const axios = require("axios"); // for ml api call

const express = require("express"); // import express
const router = express.Router(); // create router
const Career = require("../models/Career"); // import career model
const Activity = require("../models/Activity"); // import activity model
const User = require("../models/User");
const auth = require("../middleware/auth.middleware"); // auth middleware
const { resumeUpload } = require("../utils/Upload"); // multer config
const path = require("path"); // path module
const fs = require("fs"); // file system
const { processResumeUpload } = require("../utils/resumeParserHelper");

// all routes require auth
router.use(auth);

// -----------------------------
// GET current user career data
// -----------------------------
router.get("/me", async (req, res) => {
  try {
    // Prefer Career document, but fallback to User profile data if not present
    const data = await Career.findOne({ userId: req.user.id });
    if (data) return res.json(data);
    const user = await User.findById(req.user.id).select(
      "skills experience education preferredRole expectedSalary fullName email mobileNumber",
    );
    if (!user)
      return res.status(404).json({ message: "No career/profile found" });
    return res.json({
      userId: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.mobileNumber,
      education: user.education || [],
      experience: user.experience || [],
      skills: user.skills || [],
      resumeUrl: user.resumeFilePath || undefined,
      careerGoal: user.careerGoal || undefined,
      preferredRole: user.preferredRole || undefined,
      expectedSalary: user.expectedSalary || undefined,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching career data",
      error: err.message,
    });
  }
});

// -----------------------------
// CREATE or UPDATE career data
// -----------------------------
router.post("/me", async (req, res) => {
  try {
    const update = { ...req.body, userId: req.user.id };

    // Save into Career collection
    const data = await Career.findOneAndUpdate(
      { userId: req.user.id },
      update,
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
    );

    // Also synchronize important fields into User profile so both views stay consistent
    const userUpdates = {};
    if (Array.isArray(req.body.skills)) userUpdates.skills = req.body.skills;
    if (Array.isArray(req.body.experience))
      userUpdates.experience = req.body.experience;
    if (Array.isArray(req.body.education))
      userUpdates.education = req.body.education;
    if (req.body.preferredRole !== undefined)
      userUpdates.preferredRole = req.body.preferredRole;
    if (req.body.expectedSalary !== undefined)
      userUpdates.expectedSalary = req.body.expectedSalary;

    if (Object.keys(userUpdates).length) {
      await User.findByIdAndUpdate(req.user.id, { $set: userUpdates });
      // log activity for profile sync
      await Activity.create({
        userId: req.user.id,
        type: "career_sync",
        message: "Career updated and synced to profile",
      }).catch(() => { });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: "Error saving career data",
      error: err.message,
    });
  }
});

// multer single file
const pdfUpload = resumeUpload.single("file");

// -----------------------------
// UPLOAD RESUME (with ML integration and robust error handling)
// -----------------------------
router.post("/upload-resume", (req, res, next) => {
  pdfUpload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ error: err.message || "Upload error" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!allowed.includes(req.file.mimetype)) {
      return res.status(400).json({ error: "Only PDF and DOCX files allowed" });
    }

    try {
      const userId = req.user.id || req.user._id;
      const result = await processResumeUpload(userId, req.file);

      // Fetch the updated career record to return
      const data = await Career.findOne({ userId });

      res.json({
        message: result.message,
        resumeUrl: data.resumeUrl,
        resume_data: data.resume_data,
        skills: data.skills,
      });
    } catch (mlError) {
      console.error("ML resume parsing in careerRoutes failed:", mlError.message);
      return res.status(502).json({
        error: "ML service error",
        details: mlError.message,
      });
    }
  });
});

// -----------------------------
// UPLOAD RESULT
// -----------------------------
router.post("/upload-result", (req, res) => {
  pdfUpload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({
        message: err.message || "Upload error",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({
        message: "Only PDF files allowed",
      });
    }

    try {
      const resultUrl = req.file.path.replace(/\\/g, "/");

      const data = await Career.findOneAndUpdate(
        { userId: req.user.id },
        { resultUrl },
        { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
      );

      // log activity
      await Activity.create({
        userId: req.user.id,
        type: "result_upload",
        message: "Result uploaded",
      });
      // also sync resultUrl into user.education[0] if possible (best-effort)
      try {
        const user = await User.findById(req.user.id);
        if (
          user &&
          Array.isArray(user.education) &&
          user.education.length > 0
        ) {
          // attach to first education entry when career result uploaded (best-effort)
          user.education[0].resultFilePath = `/uploads/resumes/${req.file.filename}`;
          await user.save();
        }
      } catch (e) { }

      res.json({
        message: "Result uploaded successfully",
        resultUrl: data.resultUrl,
      });
    } catch (err) {
      res.status(500).json({
        message: "Error saving result",
        error: err.message,
      });
    }
  });
});

// -----------------------------
// DOWNLOAD RESUME
// -----------------------------
router.get("/download-resume", async (req, res) => {
  try {
    const data = await Career.findOne({ userId: req.user.id }, "resumeUrl");

    if (!data || !data.resumeUrl) {
      return res.status(404).json({
        message: "No resume found for the user",
      });
    }

    const filePath = path.join(__dirname, "../../", data.resumeUrl);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "Resume file not found",
      });
    }

    res.download(filePath, path.basename(filePath));
  } catch (err) {
    res.status(500).json({
      message: "Error downloading resume",
      error: err.message,
    });
  }
});

// -----------------------------
// DOWNLOAD RESULT
// -----------------------------
router.get("/download-result", async (req, res) => {
  try {
    const data = await Career.findOne({ userId: req.user.id }, "resultUrl");

    if (!data || !data.resultUrl) {
      return res.status(404).json({
        message: "No result found for the user",
      });
    }

    const filePath = path.join(__dirname, "../../", data.resultUrl);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "Result file not found",
      });
    }

    res.download(filePath, path.basename(filePath));
  } catch (err) {
    res.status(500).json({
      message: "Error downloading result",
      error: err.message,
    });
  }
});

// -----------------------------
// GET EXTRACTED SKILLS
// -----------------------------
router.get("/skills", async (req, res) => {
  try {
    const data = await Career.findOne(
      { userId: req.user.id },
      "extractedSkills",
    );

    if (!data) {
      return res.status(404).json({
        message: "Career profile not found",
      });
    }

    res.json({
      skills: data.extractedSkills || [],
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching skills",
      error: err.message,
    });
  }
});

// -----------------------------
// GET Eligibility / Evaluated skills summary
// Aggregates QuizAttempt (DB + local) to compute per-skill best scores
// -----------------------------
router.get("/eligibility", async (req, res) => {
  try {
    const QuizAttempt = require("../models/QuizAttempt");
    // prefer authoritative Career doc qualifiedSkills when present
    const careerDoc = await Career.findOne({ userId: req.user.id }).lean();
    if (
      careerDoc &&
      Array.isArray(careerDoc.qualifiedSkills) &&
      careerDoc.qualifiedSkills.length
    ) {
      // build authoritative entries
      const evalEntries = careerDoc.qualifiedSkills.map((e) => ({
        skill: e.skill,
        bestScore: Number(e.bestScore) || 0,
        attemptId: e.attemptId || null,
      }));
      // detect all-zero case (treat as not authoritative)
      const vals = evalEntries
        .map((x) => Number(x.bestScore) || 0)
        .filter((n) => typeof n === "number");
      const allZero = vals.length > 0 && vals.every((v) => Number(v) === 0);
      if (!allZero) {
        const avgSkillScore = vals.length
          ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) /
          100
          : null;
        const qualified = evalEntries
          .filter((e) => Number(e.bestScore) >= 70)
          .map((e) => ({ skill: e.skill, bestScore: e.bestScore }));
        // compute academic score from User profile as average across education entries
        let academicScore = null;
        try {
          const user = await User.findById(req.user.id).lean();
          if (user && Array.isArray(user.education) && user.education.length) {
            const pcts = [];
            for (const ed of user.education) {
              if (ed && typeof ed === "object") {
                if (ed.cgpa && typeof ed.cgpa === "number") {
                  const pct = ed.cgpa <= 10 ? ed.cgpa * 10 : ed.cgpa;
                  pcts.push(pct);
                } else if (
                  Array.isArray(ed.semesterWise) &&
                  ed.semesterWise.length
                ) {
                  const avg =
                    ed.semesterWise.reduce((s, ss) => s + (ss.sgpa || 0), 0) /
                    ed.semesterWise.length;
                  const pct = avg <= 10 ? avg * 10 : avg;
                  pcts.push(pct);
                }
              }
            }
            if (pcts.length) {
              const avgAll = pcts.reduce((a, b) => a + b, 0) / pcts.length;
              academicScore = Math.round((avgAll + Number.EPSILON) * 100) / 100;
            } else {
              academicScore = null;
            }
          }
        } catch (e) {
          academicScore = null;
        }

        return res.json({
          academic_score: academicScore,
          avg_skill_score: avgSkillScore,
          qualified_skills: qualified,
          evaluated_all_skills: evalEntries,
          source: "career_doc",
        });
      }
      // else fall through to aggregate attempts below
    }
    // fetch DB attempts
    const dbAttempts = await QuizAttempt.find({ userId: req.user.id }).lean();

    // load local attempts from data/attempts
    const attempts = Array.isArray(dbAttempts) ? dbAttempts.slice() : [];
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

    // helper: extract per-attempt skill scores
    function parseAttemptSkillScores(a) {
      const map = {};
      // if answersSummary has per-skill numeric values, prefer them
      try {
        const s = a.answersSummary || {};
        // direct mapping: keys that match skills and numeric values
        if (s && typeof s === "object") {
          const keys = Object.keys(s);
          for (const k of keys) {
            const v = s[k];
            if (typeof v === "number" && a.skills && a.skills.includes(k))
              map[k] = v;
          }
          // some generators store under 'perSkill' or 'skillScores'
          if (Object.keys(map).length === 0) {
            const alt = s.perSkill || s.skillScores || s.skills || {};
            if (alt && typeof alt === "object") {
              for (const k of Object.keys(alt)) {
                const v = alt[k];
                if (typeof v === "number") map[k] = v;
              }
            }
          }
        }
      } catch (e) { }

      // fallback: distribute attempt percentage across skills in attempt.skills
      if (
        Object.keys(map).length === 0 &&
        Array.isArray(a.skills) &&
        a.totalMarks
      ) {
        const percent = a.totalMarks
          ? (Number(a.obtainedMarks || 0) / a.totalMarks) * 100
          : 0;
        for (const sk of a.skills) map[sk] = Number(percent.toFixed(2));
      }

      return map;
    }

    // aggregate best scores per skill
    const best = {}; // skill -> { score, attemptId }
    for (const a of attempts) {
      const pm = parseAttemptSkillScores(a);
      for (const sk of Object.keys(pm)) {
        const sc = Number(pm[sk]);
        if (!Number.isFinite(sc)) continue;
        if (!best[sk] || sc > best[sk].score) {
          best[sk] = { score: sc, attemptId: a._id || a.attemptId || null };
        }
      }
    }

    const skillEntries = Object.keys(best).map((k) => ({
      skill: k,
      bestScore: Math.round((best[k].score + Number.EPSILON) * 100) / 100,
      attemptId: best[k].attemptId,
    }));

    // qualified skills per business rule: bestScore >= 70
    const qualified = skillEntries.filter((e) => Number(e.bestScore) >= 70);

    // avgSkillScore: prefer average of qualified skills (business requirement)
    const avgSkillScore = qualified.length
      ? Math.round(
        (qualified.reduce((s, x) => s + x.bestScore, 0) / qualified.length) *
        100,
      ) / 100
      : skillEntries.length
        ? Math.round(
          (skillEntries.reduce((s, x) => s + x.bestScore, 0) /
            skillEntries.length) *
          100,
        ) / 100
        : null;

    // academic score: derive from User.education (best CGPA -> percentage)
    let academicScore = null;
    try {
      const user = await User.findById(req.user.id).lean();
      if (user && Array.isArray(user.education) && user.education.length) {
        // pick highest cgpa or semester average
        let bestPct = null;
        for (const ed of user.education) {
          if (ed.cgpa && typeof ed.cgpa === "number") {
            const pct = ed.cgpa <= 10 ? ed.cgpa * 10 : ed.cgpa;
            bestPct = bestPct === null ? pct : Math.max(bestPct, pct);
          } else if (Array.isArray(ed.semesterWise) && ed.semesterWise.length) {
            const avg =
              ed.semesterWise.reduce((s, ss) => s + (ss.sgpa || 0), 0) /
              ed.semesterWise.length;
            const pct = avg <= 10 ? avg * 10 : avg;
            bestPct = bestPct === null ? pct : Math.max(bestPct, pct);
          }
        }
        academicScore =
          bestPct !== null
            ? Math.round((bestPct + Number.EPSILON) * 100) / 100
            : null;
      }
    } catch (e) {
      academicScore = null;
    }

    res.json({
      academic_score: academicScore,
      avg_skill_score: avgSkillScore,
      qualified_skills: qualified,
      evaluated_all_skills: skillEntries,
      source: "attempts",
    });
  } catch (err) {
    res.status(500).json({ message: "eligibility error", error: err.message });
  }
});

// -----------------------------
// Save qualified skills (push into career.qualifiedSkills)
// -----------------------------
router.post("/save-qualified", async (req, res) => {
  try {
    const { skills } = req.body; // expected [{skill, bestScore}]
    if (!Array.isArray(skills))
      return res.status(400).json({ message: "skills array required" });
    // validate payload
    const normalized = [];
    for (const s of skills) {
      if (!s || !s.skill || typeof s.skill !== "string") continue;
      const name = s.skill.trim();
      if (!name) continue;
      const best = Number.isFinite(Number(s.bestScore))
        ? Number(s.bestScore)
        : 0;
      normalized.push({ skill: name, bestScore: best, savedAt: new Date() });
    }
    if (normalized.length === 0)
      return res.status(400).json({ message: "no valid skills provided" });

    // load career doc and merge to avoid duplicates
    const career = await Career.findOne({ userId: req.user.id });
    if (!career) {
      // create new doc
      const doc = new Career({
        userId: req.user.id,
        qualifiedSkills: normalized,
      });
      await doc.save();
      return res.json({
        message: "qualified skills saved",
        qualifiedSkills: doc.qualifiedSkills,
      });
    }

    // merge: update existing entries if new bestScore is higher, otherwise add new
    const existing = career.qualifiedSkills || [];
    const map = {};
    for (const e of existing) map[String(e.skill).toLowerCase()] = e;

    for (const s of normalized) {
      const key = s.skill.toLowerCase();
      if (map[key]) {
        // update only if new bestScore is greater
        if (Number(s.bestScore) > Number(map[key].bestScore || 0)) {
          map[key].bestScore = s.bestScore;
          map[key].savedAt = s.savedAt;
        }
      } else {
        map[key] = {
          skill: s.skill,
          bestScore: s.bestScore,
          savedAt: s.savedAt,
        };
      }
    }

    // write back array
    const merged = Object.values(map).map((x) => ({
      skill: x.skill,
      bestScore: x.bestScore,
      savedAt: x.savedAt,
    }));
    career.qualifiedSkills = merged;
    await career.save();
    res.json({
      message: "qualified skills saved",
      qualifiedSkills: career.qualifiedSkills,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "save-qualified failed", error: err.message });
  }
});

// -----------------------------
// Compute qualified attempts (percent >= 70), save per-attempt flags, and persist qualified skills
// -----------------------------
router.post("/compute-save-qualified", async (req, res) => {
  try {
    const QuizAttempt = require("../models/QuizAttempt");
    const attempts = await QuizAttempt.find({
      userId: req.user.id,
      status: "submitted",
    }).lean();

    // compute percent and qualification per attempt
    const qualifiedAttempts = [];
    for (const a of attempts) {
      const total = Number(a.totalMarks || 100);
      const obtained = Number(a.obtainedMarks || 0);
      const pct = total ? Math.round((obtained / total) * 10000) / 100 : 0;
      const isQualified = pct >= 70;
      qualifiedAttempts.push({
        attemptId: a._id,
        percent: pct,
        qualified: isQualified,
        skills: a.skills || [],
      });
      // update attempt doc with percent/qualified
      await QuizAttempt.findByIdAndUpdate(a._id, {
        $set: { percent: pct, qualified: isQualified },
      }).catch(() => { });
    }

    // Build per-skill best scores using only qualified attempts
    const best = {}; // skill -> bestPercent
    for (const qa of qualifiedAttempts.filter((x) => x.qualified)) {
      const aDoc = attempts.find((x) => String(x._id) === String(qa.attemptId));
      const per = qa.percent;
      const skills = Array.isArray(qa.skills)
        ? qa.skills
        : (aDoc && aDoc.skills) || [];
      for (const sk of skills) {
        const key = String(sk).trim();
        if (!key) continue;
        if (!best[key] || per > best[key]) best[key] = per;
      }
    }

    // Prepare qualified skills list for saving
    const qualifiedList = Object.keys(best).map((k) => ({
      skill: k,
      bestScore: best[k],
    }));

    // persist into Career.qualifiedSkills (merge behavior similar to save-qualified)
    if (qualifiedList.length) {
      const career = await Career.findOne({ userId: req.user.id });
      const normalized = qualifiedList.map((s) => ({
        skill: s.skill,
        bestScore: Number(s.bestScore),
      }));
      if (!career) {
        const doc = new Career({
          userId: req.user.id,
          qualifiedSkills: normalized,
        });
        await doc.save();
      } else {
        const map = {};
        for (const e of career.qualifiedSkills || [])
          map[String(e.skill).toLowerCase()] = e;
        for (const s of normalized) {
          const key = s.skill.toLowerCase();
          if (map[key]) {
            if (Number(s.bestScore) > Number(map[key].bestScore || 0)) {
              map[key].bestScore = s.bestScore;
              map[key].savedAt = new Date();
            }
          } else {
            map[key] = {
              skill: s.skill,
              bestScore: s.bestScore,
              savedAt: new Date(),
            };
          }
        }
        career.qualifiedSkills = Object.values(map).map((x) => ({
          skill: x.skill,
          bestScore: x.bestScore,
          savedAt: x.savedAt,
        }));
        await career.save();
      }
    }

    return res.json({
      message: "computed and saved",
      qualifiedAttempts,
      qualifiedSkills: qualifiedList,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "compute-save-qualified failed", error: err.message });
  }
});

// -----------------------------
// Save chosen role for career (push into savedRoles)
// -----------------------------
router.post("/save-role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || typeof role !== "string")
      return res.status(400).json({ message: "role required" });
    const roleName = role.trim();
    if (!roleName) return res.status(400).json({ message: "role required" });

    const career = await Career.findOne({ userId: req.user.id });
    if (!career) {
      const doc = new Career({
        userId: req.user.id,
        savedRoles: [{ role: roleName, savedAt: new Date() }],
      });
      await doc.save();
      return res.json({ message: "role saved", savedRoles: doc.savedRoles });
    }

    const exists = (career.savedRoles || []).some(
      (r) => String(r.role).toLowerCase() === roleName.toLowerCase(),
    );
    if (exists)
      return res
        .status(200)
        .json({ message: "role already saved", savedRoles: career.savedRoles });

    career.savedRoles = career.savedRoles || [];
    career.savedRoles.push({ role: roleName, savedAt: new Date() });
    await career.save();
    res.json({ message: "role saved", savedRoles: career.savedRoles });
  } catch (err) {
    res.status(500).json({ message: "save-role failed", error: err.message });
  }
});

// -----------------------------
// SAVE SELECTED SKILLS
// -----------------------------
router.post("/select-skills", async (req, res) => {
  try {
    const { selectedSkills } = req.body;

    const data = await Career.findOneAndUpdate(
      { userId: req.user.id },
      { selectedSkills },
      { returnDocument: "after" },
    );

    res.json({
      message: "Selected skills saved",
      selectedSkills: data.selectedSkills,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error saving selected skills",
      error: err.message,
    });
  }
});

// -----------------------------
// Skill gap analyzer (uses ml-service artifacts)
// -----------------------------
router.post("/skill-gap", async (req, res) => {
  try {
    const { role, user_skills } = req.body;
    const fs = require("fs");
    const p = require("path");
    // resolve to repo root: backend/src/routes -> ../../../ml-service
    const mapPath = p.join(
      __dirname,
      "../../../ml-service/artifacts/role_required_skills_top10.json",
    );
    let roleMap = {};
    if (fs.existsSync(mapPath)) {
      roleMap = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
    }
    const roleKey = role;
    let required = [];
    if (roleMap && roleMap[roleKey]) required = roleMap[roleKey];
    else {
      // try flexible match
      for (const k of Object.keys(roleMap)) {
        if (
          k.toLowerCase().replace(/\s+/g, "_") ===
          String(role).toLowerCase().replace(/\s+/g, "_")
        ) {
          required = roleMap[k];
          break;
        }
      }
    }
    const userSet = new Set(
      (user_skills || []).map((s) => String(s).toLowerCase()),
    );
    const missing = (required || []).filter(
      (s) => !userSet.has(String(s).toLowerCase()),
    );
    return res.json({
      missing_skills: missing,
      suggestion: missing.length ? `Acquire: ${missing.join(", ")}` : "",
    });
  } catch (err) {
    res.status(500).json({ message: "skill-gap error", error: err.message });
  }
});

// -----------------------------
// Save career analysis
// -----------------------------
router.post("/analyze", async (req, res) => {
  try {
    const {
      academic_score,
      avg_skill_score,
      qualified_skills,
      recommended_roles,
    } = req.body;
    const now = new Date();
    const entry = {
      academic_score,
      avg_skill_score,
      qualified_skills,
      recommended_roles,
      created_at: now,
    };
    // push into career.careerResults array
    const data = await Career.findOneAndUpdate(
      { userId: req.user.id },
      {
        $push: { careerResults: entry },
        $setOnInsert: { userId: req.user.id },
      },
      { returnDocument: "after", upsert: true },
    );
    res.json({ message: "Saved", entry, career: data });
  } catch (err) {
    res
      .status(500)
      .json({ message: "analyze save failed", error: err.message });
  }
});

// -----------------------------
// Submit final result report (persist academic/skill/avg and cgpas)
// -----------------------------
router.post("/submit-result", async (req, res) => {
  try {
    const { academicGrade, skillGrade, avgGrade, cgpas, submittedAt } =
      req.body;
    if (
      academicGrade === undefined ||
      skillGrade === undefined ||
      avgGrade === undefined
    ) {
      return res
        .status(400)
        .json({ message: "academicGrade, skillGrade and avgGrade required" });
    }

    const entry = {
      academicGrade,
      skillGrade,
      avgGrade,
      cgpas: Array.isArray(cgpas) ? cgpas : [],
      submittedAt: submittedAt ? new Date(submittedAt) : new Date(),
    };

    const data = await Career.findOneAndUpdate(
      { userId: req.user.id },
      {
        $push: { careerResults: entry },
        $setOnInsert: { userId: req.user.id },
      },
      { returnDocument: "after", upsert: true },
    );

    // log activity
    try {
      await Activity.create({
        userId: req.user.id,
        type: "submit_result",
        message: "Submitted career result report",
      });
    } catch (e) { }

    return res.json({ message: "result saved", entry, career: data });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "submit-result failed", error: err.message });
  }
});

module.exports = router;
