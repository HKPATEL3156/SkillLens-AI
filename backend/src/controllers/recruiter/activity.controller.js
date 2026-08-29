const Activity = require("../../models/Activity");

// GET /api/recruiter/activity
exports.list = async (req, res, next) => {
  try {
    const companyId = req.user._id;
    const limit = Math.min(200, parseInt(req.query.limit || 50, 10));
    const activities = await Activity.find({ companyId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ activities });
  } catch (err) {
    next(err);
  }
};
