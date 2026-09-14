const Job = require("../models/Job");

// Helper: convert stored file system paths to web-accessible '/uploads/...' paths
const normalizeDocumentPath = (p) => {
  if (!p || typeof p !== "string") return null;
  // normalize all backslashes to slashes first
  let s = String(p).replace(/\\\\/g, "/").replace(/\\/g, "/");
  // find '/uploads/' segment
  const idx = s.indexOf("/uploads/");
  if (idx !== -1) return s.slice(idx);
  // sometimes stored path includes 'backend/uploads' or similar
  const uploadsIdx = s.indexOf("uploads/");
  if (uploadsIdx !== -1) return "/" + s.slice(uploadsIdx);
  // fallback: ensure leading slash
  return s.startsWith("/") ? s : `/${s}`;
};

// Create job (multipart uploads handled in routes via multer)
exports.createJob = async (req, res, next) => {
  try {
    const companyId = req.user._id;
    const files = req.files || {};

    const body = req.body || {};
    // basic validation
    if (!body.title)
      return res.status(400).json({ error: "job_title is required" });
    if (!body.job_type)
      return res.status(400).json({ error: "job_type is required" });
    if (!body.work_mode)
      return res.status(400).json({ error: "work_mode is required" });
    if (!body.required_skills)
      return res.status(400).json({ error: "required_skills is required" });
    if (body.minimum_skill_score === undefined)
      return res.status(400).json({ error: "minimum_skill_score is required" });
    if (!body.application_deadline)
      return res
        .status(400)
        .json({ error: "application_deadline is required" });
    if (!files.job_description_pdf || !files.job_description_pdf.length)
      return res
        .status(400)
        .json({ error: "job_description_pdf PDF is required" });

    const parseList = (v) => {
      if (!v) return [];
      if (Array.isArray(v))
        return v.map((s) => String(s).trim()).filter(Boolean);
      return String(v)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    };

    const job = new Job({
      title: String(body.title).trim(),
      job_role: body.job_role || "",
      job_category: body.job_category || "",
      required_skills: parseList(body.required_skills),
      preferred_skills: parseList(body.preferred_skills),
      totalPositions: Number(body.totalPositions) || 1,
      job_type: body.job_type,
      work_mode: body.work_mode,
      location: {
        city: body.city || "",
        state: body.state || "",
        country: body.country || "",
        address: body.address || "",
      },
      experience_required: {
        min_exp: Number(body.min_exp) || 0,
        max_exp: Number(body.max_exp) || 50,
      },
      education_required: {
        degree: body.education_degree || "",
        field: body.education_field || "",
      },
      minimum_skill_score: Number(body.minimum_skill_score) || 0,
      skill_score_weight: Number(body.skill_score_weight) || 70,
      salary_type: body.salary_type || "fixed",
      salary_min: body.salary_min ? Number(body.salary_min) : undefined,
      salary_max: body.salary_max ? Number(body.salary_max) : undefined,
      currency: body.currency || "INR",
      perks: parseList(body.perks),
      job_description_text: body.job_description_text || "",
      responsibilities: body.responsibilities || "",
      benefits: parseList(body.benefits),
      selection_rounds: parseList(body.selection_rounds),
      interview_mode: body.interview_mode || undefined,
      application_deadline: body.application_deadline
        ? new Date(body.application_deadline)
        : undefined,
      max_applicants: body.max_applicants
        ? Number(body.max_applicants)
        : undefined,
      allow_resume_upload:
        body.allow_resume_upload === undefined
          ? true
          : String(body.allow_resume_upload) === "true",
      company_policy: {
        bond_required: String(body.bond_required) === "true",
        bond_duration: body.bond_duration || "",
        notice_period: body.notice_period || "",
      },
      visibility: body.visibility || "public",
      job_status: body.job_status || "draft",
      created_by: companyId,
      companyId: companyId,
    });

    job.documents = job.documents || {};
    job.documents.job_description_pdf =
      files.job_description_pdf[0].path.replace(/\\\\/g, "/");
    if (files.company_policy_pdf && files.company_policy_pdf[0])
      job.documents.company_policy_pdf =
        files.company_policy_pdf[0].path.replace(/\\\\/g, "/");

    await job.save();
    res.status(201).json({ message: "Job created", job });
  } catch (err) {
    next(err);
  }
};

// GET /api/recruiter/jobs with filtering and pagination
exports.listCompanyJobs = async (req, res, next) => {
  try {
    const companyId = req.user._id;
    const q = { created_by: companyId };
    if (req.query.skills) {
      const skills = String(req.query.skills)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      q.required_skills = { $all: skills };
    }
    if (req.query.minExp)
      q["experience_required.min_exp"] = { $gte: Number(req.query.minExp) };
    if (req.query.maxExp)
      q["experience_required.max_exp"] = { $lte: Number(req.query.maxExp) };
    if (req.query.salaryMin)
      q.salary_min = { $gte: Number(req.query.salaryMin) };
    if (req.query.salaryMax)
      q.salary_max = { $lte: Number(req.query.salaryMax) };

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const total = await Job.countDocuments(q);
    const jobs = await Job.find(q)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("companyId", "company_name documents.logo")
      .lean();
    res.json({ total, page, limit, jobs });
  } catch (err) {
    next(err);
  }
};

// GET single job with metrics and candidate matching
exports.getJob = async (req, res, next) => {
  try {
    const companyId = req.user._id;
    const jobId = req.params.id;
    const job = await Job.findOne({ _id: jobId, created_by: companyId }).lean();
    if (!job) return res.status(404).json({ error: "Job not found" });

    const Application = require("../models/Application");
    const totalApplicants = await Application.countDocuments({ jobId });
    const shortlisted = await Application.countDocuments({
      jobId,
      pipelineStage: "shortlisted",
    });
    const rejected = await Application.countDocuments({
      jobId,
      pipelineStage: "rejected",
    });
    const recentApplicants = await Application.find({ jobId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "fullName email skills")
      .lean();

    // Matching logic: fetch users with at least one required skill then score
    const User = require("../models/User");
    let candidateMatches = [];
    try {
      const reqSkills = Array.isArray(job.required_skills)
        ? job.required_skills.map((s) => String(s).toLowerCase())
        : [];
      const minScore = Number(job.minimum_skill_score || 0);
      const minExp = job.experience_required
        ? Number(job.experience_required.min_exp || 0)
        : 0;
      const maxExp = job.experience_required
        ? Number(job.experience_required.max_exp || 100)
        : 100;

      const users = await User.find({ skills: { $in: reqSkills } })
        .select("fullName email skills experienceLevel")
        .lean()
        .limit(1000);
      const scored = users
        .map((u) => {
          const userSkills = Array.isArray(u.skills)
            ? u.skills.map((s) => String(s).toLowerCase())
            : [];
          const overlap = reqSkills.filter((s) =>
            userSkills.includes(s),
          ).length;
          const skillPct = reqSkills.length
            ? Math.round((overlap / reqSkills.length) * 100)
            : 0;
          const exp = u.experienceLevel || 0;
          const quizScore = u.quizScore || 0; // if present on user
          const weight = Number(job.skill_score_weight || 70);
          const score = Math.round(
            skillPct * (weight / 100) + quizScore * ((100 - weight) / 100),
          );
          return { user: u, skillPct, exp, score };
        })
        .filter(
          (s) => s.score >= minScore && s.exp >= minExp && s.exp <= maxExp,
        );

      candidateMatches = scored.sort((a, b) => b.score - a.score).slice(0, 50);
    } catch (e) {
      candidateMatches = [];
    }

    // normalize document paths for private recruiter view too
    if (job.documents) {
      if (job.documents.job_description_pdf)
        job.documents.job_description_pdf = normalizeDocumentPath(
          job.documents.job_description_pdf,
        );
      if (job.documents.company_policy_pdf)
        job.documents.company_policy_pdf = normalizeDocumentPath(
          job.documents.company_policy_pdf,
        );
    }

    // normalize resumes in recentApplicants
    const normalizePath = (p) => {
      if (!p) return null;
      let s = String(p).replace(/\\/g, "/").replace(/\\/g, "/");
      const idx = s.indexOf("/uploads/");
      if (idx !== -1) return s.slice(idx);
      const uploadsIdx = s.indexOf("uploads/");
      if (uploadsIdx !== -1) return "/" + s.slice(uploadsIdx);
      return s.startsWith("/") ? s : `/${s}`;
    };
    const normalizedRecent = (recentApplicants || []).map((a) => {
      if (a.resumePath) a.resumePath = normalizePath(a.resumePath);
      if (a.userId) {
        if (a.userId.resumeFilePath)
          a.userId.resumeFilePath = normalizePath(a.userId.resumeFilePath);
        if (!a.userId.resumePath)
          a.userId.resumePath = a.userId.resumeFilePath || null;
      }
      return a;
    });

    res.json({
      job,
      metrics: { totalApplicants, shortlisted, rejected },
      recentApplicants: normalizedRecent,
      candidateMatches,
    });
  } catch (err) {
    next(err);
  }
};

// Update job (supports multipart files)
exports.updateJob = async (req, res, next) => {
  try {
    const companyId = req.user._id;
    const jobId = req.params.id;
    const files = req.files || {};
    const body = req.body || {};

    const job = await Job.findOne({ _id: jobId, created_by: companyId });
    if (!job) return res.status(404).json({ error: "Job not found" });

    // apply updates selectively
    const setIf = (k, v) => {
      if (v !== undefined) job[k] = v;
    };
    setIf("title", body.title ? String(body.title).trim() : undefined);
    setIf("job_role", body.job_role);
    if (body.required_skills)
      job.required_skills = Array.isArray(body.required_skills)
        ? body.required_skills
        : String(body.required_skills)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    if (body.preferred_skills)
      job.preferred_skills = Array.isArray(body.preferred_skills)
        ? body.preferred_skills
        : String(body.preferred_skills)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    if (body.salary_min) job.salary_min = Number(body.salary_min);
    if (body.salary_max) job.salary_max = Number(body.salary_max);
    if (body.application_deadline)
      job.application_deadline = new Date(body.application_deadline);
    if (body.job_description_text)
      job.job_description_text = body.job_description_text;
    if (body.responsibilities) job.responsibilities = body.responsibilities;
    if (body.benefits)
      job.benefits = Array.isArray(body.benefits)
        ? body.benefits
        : String(body.benefits)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    if (body.job_status) job.job_status = body.job_status;

    if (!job.documents) job.documents = {};
    if (files.job_description_pdf && files.job_description_pdf[0])
      job.documents.job_description_pdf =
        files.job_description_pdf[0].path.replace(/\\\\/g, "/");
    if (files.company_policy_pdf && files.company_policy_pdf[0])
      job.documents.company_policy_pdf =
        files.company_policy_pdf[0].path.replace(/\\\\/g, "/");

    await job.save();
    res.json({ message: "Job updated", job });
  } catch (err) {
    next(err);
  }
};

// Delete job
exports.deleteJob = async (req, res, next) => {
  try {
    const companyId = req.user._id;
    const jobId = req.params.id;
    const job = await Job.findOneAndDelete({
      _id: jobId,
      created_by: companyId,
    });
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({ message: "Job deleted" });
  } catch (err) {
    next(err);
  }
};

// Public listing for users: supports search, skills filter, pagination
exports.listPublicJobs = async (req, res, next) => {
  try {
    const q = { visibility: "public" };
    // only active (published) jobs — align with Job model values
    q.job_status = { $in: ["active"] };

    if (req.query.skills) {
      const skills = String(req.query.skills)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (skills.length) q.required_skills = { $all: skills };
    }

    if (req.query.search) {
      const s = String(req.query.search).trim();
      if (s)
        q.$or = [
          { title: { $regex: s, $options: "i" } },
          { job_description_text: { $regex: s, $options: "i" } },
          { job_role: { $regex: s, $options: "i" } },
        ];
    }
    // allow filtering specifically by role (e.g. ?role=Data%20Scientist)
    if (req.query.role) {
      const role = String(req.query.role).trim();
      if (role) {
        // append OR on job_role or title to existing $or or create new
        const roleClause = [
          { job_role: { $regex: role, $options: "i" } },
          { title: { $regex: role, $options: "i" } },
        ];
        if (q.$or) q.$or.push(...roleClause);
        else q.$or = roleClause;
      }
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const total = await Job.countDocuments(q);
    const jobs = await Job.find(q)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(
        "companyId",
        "company_name documents.logo is_verified website city state country",
      )
      .lean();

    // normalize document paths for web
    const normJobs = jobs.map((j) => {
      if (j.documents) {
        if (j.documents.job_description_pdf)
          j.documents.job_description_pdf = normalizeDocumentPath(
            j.documents.job_description_pdf,
          );
        if (j.documents.company_policy_pdf)
          j.documents.company_policy_pdf = normalizeDocumentPath(
            j.documents.company_policy_pdf,
          );
      }
      if (j.companyId && j.companyId.documents && j.companyId.documents.logo)
        j.companyId.documents.logo = normalizeDocumentPath(
          j.companyId.documents.logo,
        );
      return j;
    });

    res.json({ total, page, limit, jobs: normJobs });
  } catch (err) {
    next(err);
  }
};

// Public job detail (no company metrics)
exports.getPublicJob = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findOne({ _id: jobId, visibility: "public" })
      .populate(
        "companyId",
        "company_name documents.logo website description established_year years_of_experience total_employees city state country address is_verified company_email phone socialLinks",
      )
      .lean();
    if (!job) return res.status(404).json({ error: "Job not found" });
    // normalize document paths
    if (job.documents) {
      if (job.documents.job_description_pdf)
        job.documents.job_description_pdf = normalizeDocumentPath(
          job.documents.job_description_pdf,
        );
      if (job.documents.company_policy_pdf)
        job.documents.company_policy_pdf = normalizeDocumentPath(
          job.documents.company_policy_pdf,
        );
    }
    if (
      job.companyId &&
      job.companyId.documents &&
      job.companyId.documents.logo
    )
      job.companyId.documents.logo = normalizeDocumentPath(
        job.companyId.documents.logo,
      );

    res.json({ job });
  } catch (err) {
    next(err);
  }
};

// GET /api/jobs/my/applications (authenticated applicant viewing all their applied jobs)
exports.getMyApplications = async (req, res, next) => {
  try {
    const Application = require("../models/Application");
    const userId = req.user._id;

    const applications = await Application.find({ userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "jobId",
        populate: {
          path: "companyId",
          select: "company_name documents.logo location industry",
        },
      })
      .lean();

    // normalize paths
    const normalized = applications.map((a) => {
      if (a.resumePath) a.resumePath = normalizeDocumentPath(a.resumePath);
      if (
        a.jobId &&
        a.jobId.companyId &&
        a.jobId.companyId.documents &&
        a.jobId.companyId.documents.logo
      ) {
        a.jobId.companyId.documents.logo = normalizeDocumentPath(
          a.jobId.companyId.documents.logo,
        );
      }
      return a;
    });

    res.json({ applications: normalized });
  } catch (err) {
    next(err);
  }
};

// GET /api/jobs/:id/application (authenticated applicant checking status of specific job)
exports.getMyApplicationForJob = async (req, res, next) => {
  try {
    const Application = require("../models/Application");
    const userId = req.user._id;
    const jobId = req.params.id;

    const application = await Application.findOne({ userId, jobId })
      .populate({
        path: "jobId",
        select:
          "title job_role job_type location companyId application_deadline salary_min salary_max currency",
        populate: {
          path: "companyId",
          select: "company_name documents.logo",
        },
      })
      .lean();

    if (!application) {
      return res.json({ applied: false, application: null });
    }

    if (application.resumePath) {
      application.resumePath = normalizeDocumentPath(application.resumePath);
    }
    if (
      application.jobId &&
      application.jobId.companyId &&
      application.jobId.companyId.documents &&
      application.jobId.companyId.documents.logo
    ) {
      application.jobId.companyId.documents.logo = normalizeDocumentPath(
        application.jobId.companyId.documents.logo,
      );
    }

    res.json({ applied: true, application });
  } catch (err) {
    next(err);
  }
};

// Apply to a job (authenticated users). Accepts optional resume upload (field 'resume') or existing resumePath.
exports.applyToJob = async (req, res, next) => {
  try {
    const Application = require("../models/Application");
    const User = require("../models/User");
    const Activity = require("../models/Activity");
    const jobId = req.params.id;
    const user = req.user;

    const job = await Job.findById(jobId)
      .populate("companyId", "company_name")
      .lean();
    if (!job) return res.status(404).json({ error: "Job not found" });

    // check deadline
    if (
      job.application_deadline &&
      new Date(job.application_deadline) < new Date()
    )
      return res.status(400).json({ error: "Application deadline has passed" });

    // prevent duplicate applications
    const existing = await Application.findOne({ userId: user._id, jobId });
    if (existing) return res.status(400).json({ error: "Already applied to this job" });

    // resume handling: prefer uploaded file, fallback to req.body.resumePath, fallback to user's profile resume
    let resumePath = null;
    if (req.file && req.file.path) {
      resumePath = req.file.path.replace(/\\/g, "/");
    } else if (req.body.resumePath) {
      resumePath = req.body.resumePath;
    } else if (user && (user.resumeFilePath || user.resumePath)) {
      resumePath = user.resumeFilePath || user.resumePath;
    }

    if (!resumePath) {
      return res.status(400).json({ error: "Please upload or select a resume to continue" });
    }

    const skills = req.body.skills
      ? Array.isArray(req.body.skills)
        ? req.body.skills
        : String(req.body.skills)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : (user && user.skills) || [];

    const quizScore = Number(req.body.quizScore) || (user && user.quizScore) || 0;

    const app = new Application({
      userId: user._id,
      jobId,
      coverLetter: req.body.coverLetter || "",
      resumePath,
      skills,
      quizScore,
      status: "applied",
      pipelineStage: "applied",
    });

    await app.save();

    // Log user activity
    try {
      await Activity.create({
        userId: user._id,
        type: "job_application",
        message: `Applied for ${job.title} at ${job.companyId?.company_name || "Company"}`,
        meta: { jobId, applicationId: app._id },
      });
    } catch (e) { }

    const normalizedApp = app.toObject();
    if (normalizedApp.resumePath) {
      normalizedApp.resumePath = normalizeDocumentPath(normalizedApp.resumePath);
    }

    res.status(201).json({
      message: "Application submitted successfully",
      application: normalizedApp,
    });
  } catch (err) {
    next(err);
  }
};
