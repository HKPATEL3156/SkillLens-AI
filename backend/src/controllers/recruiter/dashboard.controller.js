const Job = require("../../models/Job");
const Application = require("../../models/Application");

// GET /api/recruiter/dashboard
exports.dashboard = async (req, res, next) => {
  try {
    const companyId = req.user._id;

    // list company job ids
    const jobIds = await Job.find({ companyId }).distinct("_id");

    const totalJobs = await Job.countDocuments({ companyId });
    const totalApplicants = await Application.countDocuments({
      jobId: { $in: jobIds },
    });
    const shortlisted = await Application.countDocuments({
      jobId: { $in: jobIds },
      status: "shortlisted",
    });
    const rejected = await Application.countDocuments({
      jobId: { $in: jobIds },
      status: "rejected",
    });

    // recent applications
    const recentApplications = await Application.find({
      jobId: { $in: jobIds },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "fullName email")
      .populate("jobId", "title");

    // applications per job
    const jobPerformance = await Application.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: "$jobId", applications: { $sum: 1 } } },
      {
        $lookup: {
          from: "jobs",
          localField: "_id",
          foreignField: "_id",
          as: "job",
        },
      },
      { $unwind: { path: "$job", preserveNullAndEmptyArrays: true } },
      { $project: { jobId: "$_id", title: "$job.title", applications: 1 } },
      { $sort: { applications: -1 } },
    ]);

    // monthly job posts (last 12 months)
    const jobsByMonth = await Job.aggregate([
      { $match: { companyId } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // monthly applications trend
    const appsByMonth = await Application.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({
      counts: {
        totalJobs,
        totalApplicants,
        shortlisted,
        rejected,
      },
      recentApplications,
      jobPerformance,
      analytics: {
        jobsByMonth,
        appsByMonth,
      },
    });
  } catch (err) {
    next(err);
  }
};
