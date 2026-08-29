const Company = require("../models/Company");
const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
const QuizAttempt = require("../models/QuizAttempt");
const Setting = require("../models/Setting");
const bcrypt = require("bcryptjs");

// helpers
const parsePagination = (q) => {
  const page = Math.max(1, parseInt(q.page || 1, 10));
  const limit = Math.min(200, Math.max(5, parseInt(q.limit || 20, 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

exports.dashboard = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRecruiters = await Company.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalApplications = await Application.countDocuments();
    const pendingCompanies = await Company.countDocuments({
      status: "pending",
    });

    // monthly aggregations
    const usersGrowth = await User.aggregate([
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

    const jobsGrowth = await Job.aggregate([
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

    const applicationsTrend = await Application.aggregate([
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

    // top skills demand from jobs
    const topSkills = await Job.aggregate([
      { $unwind: "$skills" },
      { $group: { _id: "$skills", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // top job roles
    const topRoles = await Job.aggregate([
      { $group: { _id: "$title", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      counts: {
        totalUsers,
        totalRecruiters,
        totalJobs,
        totalApplications,
        pendingCompanies,
      },
      analytics: {
        usersGrowth,
        jobsGrowth,
        applicationsTrend,
        topSkills,
        topRoles,
      },
    });
  } catch (err) {
    next(err);
  }
};

// --- Users ---
exports.listUsers = async (req, res, next) => {
  try {
    const { q, startDate, endDate, status } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const filter = {};
    if (q)
      filter.$or = [
        { fullName: new RegExp(q, "i") },
        { email: new RegExp(q, "i") },
      ];
    if (status) filter.status = status;
    if (startDate || endDate) filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json({ total, page, limit, users });
  } catch (err) {
    next(err);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    const allowed = [
      "fullName",
      "primaryLocation",
      "bio",
      "mobileNumber",
      "role",
      "status",
    ];
    const payload = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) payload[k] = req.body[k];
    });
    const user = await User.findByIdAndUpdate(id, payload, {
      new: true,
    }).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User updated", user });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    next(err);
  }
};

exports.blockUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    const action = req.body.action === "unblock" ? "active" : "blocked";
    const user = await User.findByIdAndUpdate(
      id,
      { status: action },
      { new: true },
    ).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: `User ${action}`, user });
  } catch (err) {
    next(err);
  }
};

// --- Companies (extended) ---
exports.listCompanies = async (req, res, next) => {
  try {
    const { q, status } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const filter = {};
    if (q)
      filter.$or = [
        { company_name: new RegExp(q, "i") },
        { company_email: new RegExp(q, "i") },
        { username: new RegExp(q, "i") },
      ];
    if (status) filter.status = status;
    const total = await Company.countDocuments(filter);
    const companies = await Company.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json({ total, page, limit, companies });
  } catch (err) {
    next(err);
  }
};

exports.getCompany = async (req, res, next) => {
  try {
    const id = req.params.id;
    const comp = await Company.findById(id).select("-password");
    if (!comp) return res.status(404).json({ error: "Company not found" });
    res.json({ company: comp });
  } catch (err) {
    next(err);
  }
};

exports.updateCompany = async (req, res, next) => {
  try {
    const id = req.params.id;
    const allowed = [
      "company_name",
      "company_email",
      "phone",
      "address",
      "city",
      "state",
      "country",
      "established_year",
      "total_employees",
      "website",
      "description",
      "is_verified",
      "status",
    ];
    const payload = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) payload[k] = req.body[k];
    });
    const comp = await Company.findByIdAndUpdate(id, payload, {
      new: true,
    }).select("-password");
    if (!comp) return res.status(404).json({ error: "Company not found" });
    res.json({ message: "Company updated", company: comp });
  } catch (err) {
    next(err);
  }
};

exports.deleteCompany = async (req, res, next) => {
  try {
    const id = req.params.id;
    const comp = await Company.findByIdAndDelete(id);
    if (!comp) return res.status(404).json({ error: "Company not found" });
    // Optionally delete related jobs
    await Job.deleteMany({ companyId: id });
    res.json({ message: "Company deleted" });
  } catch (err) {
    next(err);
  }
};

exports.blockCompany = async (req, res, next) => {
  try {
    const id = req.params.id;
    const action = req.body.action === "unblock" ? false : true;
    const comp = await Company.findByIdAndUpdate(
      id,
      { is_blocked: action },
      { new: true },
    ).select("-password");
    if (!comp) return res.status(404).json({ error: "Company not found" });
    res.json({
      message: `Company ${action ? "blocked" : "unblocked"}`,
      company: comp,
    });
  } catch (err) {
    next(err);
  }
};

// approve/reject endpoints
exports.approveCompany = async (req, res, next) => {
  try {
    const id = req.params.id;
    const comp = await Company.findByIdAndUpdate(
      id,
      { status: "approved", is_verified: true },
      { new: true },
    );
    if (!comp) return res.status(404).json({ error: "Company not found" });
    res.json({ message: "Company approved", company: comp });
  } catch (err) {
    next(err);
  }
};

exports.rejectCompany = async (req, res, next) => {
  try {
    const id = req.params.id;
    const comp = await Company.findByIdAndUpdate(
      id,
      { status: "rejected", is_verified: false },
      { new: true },
    );
    if (!comp) return res.status(404).json({ error: "Company not found" });
    res.json({ message: "Company rejected", company: comp });
  } catch (err) {
    next(err);
  }
};

// --- Jobs ---
exports.listJobs = async (req, res, next) => {
  try {
    const { q, status, companyId } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const filter = {};
    if (q)
      filter.$or = [
        { title: new RegExp(q, "i") },
        { description: new RegExp(q, "i") },
      ];
    if (status) filter.status = status;
    if (companyId) filter.companyId = companyId;
    const total = await Job.countDocuments(filter);
    const jobs = await Job.find(filter)
      .populate("companyId", "company_name username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json({ total, page, limit, jobs });
  } catch (err) {
    next(err);
  }
};

exports.getJob = async (req, res, next) => {
  try {
    const id = req.params.id;
    const job = await Job.findById(id).populate(
      "companyId",
      "company_name username",
    );
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({ job });
  } catch (err) {
    next(err);
  }
};

exports.deleteJob = async (req, res, next) => {
  try {
    const id = req.params.id;
    const job = await Job.findByIdAndDelete(id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({ message: "Job deleted" });
  } catch (err) {
    next(err);
  }
};

// --- Reports ---
exports.reports = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRecruiters = await Company.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalApplications = await Application.countDocuments();

    const activeUsers = await User.countDocuments({ status: "active" });
    const inactiveUsers = totalUsers - activeUsers;

    const topCompanies = await Job.aggregate([
      { $group: { _id: "$companyId", jobs: { $sum: 1 } } },
      { $sort: { jobs: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "companies",
          localField: "_id",
          foreignField: "_id",
          as: "company",
        },
      },
      { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },
      {
        $project: { jobs: 1, "company.company_name": 1, "company.username": 1 },
      },
    ]);

    const mostAppliedJobs = await Application.aggregate([
      { $group: { _id: "$jobId", applicants: { $sum: 1 } } },
      { $sort: { applicants: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "jobs",
          localField: "_id",
          foreignField: "_id",
          as: "job",
        },
      },
      { $unwind: { path: "$job", preserveNullAndEmptyArrays: true } },
      { $project: { applicants: 1, "job.title": 1, "job.companyId": 1 } },
    ]);

    const skillDemand = await Job.aggregate([
      { $unwind: "$skills" },
      { $group: { _id: "$skills", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    res.json({
      totalUsers,
      totalRecruiters,
      totalJobs,
      totalApplications,
      activeUsers,
      inactiveUsers,
      topCompanies,
      mostAppliedJobs,
      skillDemand,
    });
  } catch (err) {
    next(err);
  }
};

// --- Settings / Admin creation ---
exports.createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ error: "Email already exists" });
    const hash = await bcrypt.hash(password, 10);
    const admin = new User({
      fullName: name || "Admin",
      email,
      password: hash,
      role: role || "admin",
    });
    await admin.save();
    res.json({
      message: "Admin created",
      admin: { id: admin._id, email: admin.email, role: admin.role },
    });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const adminId = req.user._id;
    const { oldPassword, newPassword } = req.body;
    if (!newPassword)
      return res.status(400).json({ error: "New password required" });
    const admin = await User.findById(adminId).select("+password");
    const valid = await bcrypt.compare(oldPassword || "", admin.password || "");
    if (!valid)
      return res.status(400).json({ error: "Old password incorrect" });
    const hash = await bcrypt.hash(newPassword, 10);
    admin.password = hash;
    await admin.save();
    res.json({ message: "Password updated" });
  } catch (err) {
    next(err);
  }
};

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await Setting.find({}).lean();
    res.json({ settings });
  } catch (err) {
    next(err);
  }
};

// --- Admin profile ---
exports.getProfile = async (req, res, next) => {
  try {
    const admin = req.user;
    res.json({ profile: admin });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const adminId = req.user._id;
    const allowed = ["fullName", "mobileNumber", "primaryLocation"];
    const payload = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) payload[k] = req.body[k];
    });
    const admin = await User.findByIdAndUpdate(adminId, payload, {
      new: true,
    }).select("-password");
    res.json({ message: "Profile updated", profile: admin });
  } catch (err) {
    next(err);
  }
};
