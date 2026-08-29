const Application = require("../../models/Application");
const Job = require("../../models/Job");
const User = require("../../models/User");
const Activity = require("../../models/Activity");
const Notification = require("../../models/Notification");

const parsePagination = (q) => {
  const page = Math.max(1, parseInt(q.page || 1, 10));
  const limit = Math.min(200, Math.max(5, parseInt(q.limit || 20, 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/recruiter/job/:id/applicants
exports.listApplicants = async (req, res, next) => {
  try {
    const companyId = req.user._id;
    const jobId = req.params.id;
    const { page, limit, skip } = parsePagination(req.query);

    // ensure job belongs to this company
    const job = await Job.findOne({ _id: jobId, companyId });
    if (!job) return res.status(404).json({ error: "Job not found" });

    const filter = { jobId };

    // filter by skills (comma separated)
    if (req.query.skills) {
      const skills = req.query.skills.split(",").map((s) => s.trim());
      filter.skills = { $in: skills };
    }

    if (req.query.minScore) {
      filter.quizScore = { $gte: parseFloat(req.query.minScore) || 0 };
    }

    // text search on applicant name/email
    const q = req.query.q;

    // if search is provided, perform aggregation to join user fields
    if (q) {
      const pipeline = [
        { $match: filter },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $match: {
            $or: [
              { "user.fullName": new RegExp(q, "i") },
              { "user.email": new RegExp(q, "i") },
            ],
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            jobId: 1,
            resumePath: 1,
            skills: 1,
            quizScore: 1,
            pipelineStage: 1,
            status: 1,
            createdAt: 1,
            user: { _id: 1, fullName: 1, email: 1 },
          },
        },
      ];
      const rows = await Application.aggregate(pipeline);
      const totalPipeline = [
        { $match: filter },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $match: {
            $or: [
              { "user.fullName": new RegExp(q, "i") },
              { "user.email": new RegExp(q, "i") },
            ],
          },
        },
        { $count: "total" },
      ];
      const totalRes = await Application.aggregate(totalPipeline);
      const total = totalRes[0] ? totalRes[0].total : 0;
      return res.json({ total, page, limit, applicants: rows });
    }

    // simple listing without text search — use find() + populate then attach career summary
    const total = await Application.countDocuments(filter);

    const rows = await Application.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "fullName email skills resumeFilePath resumePath")
      .lean();

    // helper to normalize stored file paths to web paths
    const normalizePath = (p) => {
      if (!p) return null;
      let s = String(p).replace(/\\/g, "/").replace(/\\/g, "/");
      const idx = s.indexOf("/uploads/");
      if (idx !== -1) return s.slice(idx);
      const uploadsIdx = s.indexOf("uploads/");
      if (uploadsIdx !== -1) return "/" + s.slice(uploadsIdx);
      return s.startsWith("/") ? s : `/${s}`;
    };

    const Career = require("../../models/Career");
    const enriched = [];
    for (const r of rows) {
      const userId = r.userId && r.userId._id ? r.userId._id : r.userId;
      let career = null;
      try {
        career = await Career.findOne({ userId }).lean();
      } catch (e) {
        career = null;
      }
      // compute lastResult if career.careerResults exists
      let lastResult = null;
      if (
        career &&
        Array.isArray(career.careerResults) &&
        career.careerResults.length
      ) {
        lastResult = career.careerResults[career.careerResults.length - 1];
      }

      // normalize resume paths for frontend links
      if (r.resumePath) r.resumePath = normalizePath(r.resumePath);
      if (r.userId) {
        if (r.userId.resumeFilePath)
          r.userId.resumeFilePath = normalizePath(r.userId.resumeFilePath);
        // keep a common fallback property name used across frontend (`resumePath`)
        if (!r.userId.resumePath)
          r.userId.resumePath = r.userId.resumeFilePath || null;
      }

      enriched.push({ ...r, career, lastResult });
    }

    res.json({ total, page, limit, applicants: enriched });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/recruiter/application/:id/status
exports.updateStatus = async (req, res, next) => {
  try {
    const companyId = req.user._id;
    const appId = req.params.id;
    const { status, pipelineStage, note } = req.body;

    const application = await Application.findById(appId).populate("jobId");
    if (!application)
      return res.status(404).json({ error: "Application not found" });

    // ensure the job belongs to this company
    if (
      !application.jobId ||
      String(application.jobId.companyId) !== String(companyId)
    )
      return res
        .status(403)
        .json({ error: "Not authorized for this application" });

    const allowedStatuses = ["applied", "shortlisted", "rejected", "hired"];
    const allowedStages = [
      "applied",
      "shortlisted",
      "interview",
      "selected",
      "rejected",
    ];

    if (status && !allowedStatuses.includes(status))
      return res.status(400).json({ error: "Invalid status" });
    if (pipelineStage && !allowedStages.includes(pipelineStage))
      return res.status(400).json({ error: "Invalid pipelineStage" });

    if (status) application.status = status;
    if (pipelineStage) application.pipelineStage = pipelineStage;
    if (req.body.quizScore !== undefined)
      application.quizScore =
        Number(req.body.quizScore) || application.quizScore;

    await application.save();

    // Create activity for company
    await Activity.create({
      companyId,
      type: "application_status_change",
      message: `${status || application.status} - ${application._id}`,
      meta: { applicationId: application._id, note },
    }).catch(() => {});

    // Notify company (and optionally user)
    try {
      await Notification.create({
        companyId,
        userId: application.userId,
        message: `Application ${application._id} updated to ${application.pipelineStage || application.status}`,
        data: { applicationId: application._id },
      });
    } catch (nerr) {
      console.error("Notification create failed", nerr.message || nerr);
    }

    res.json({ message: "Application updated", application });
  } catch (err) {
    next(err);
  }
};
