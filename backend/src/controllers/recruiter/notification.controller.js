const Notification = require("../../models/Notification");

// GET /api/recruiter/notifications
exports.list = async (req, res, next) => {
  try {
    const companyId = req.user._id;
    const { page = 1, limit = 50 } = req.query;
    const p = Math.max(1, parseInt(page, 10));
    const l = Math.min(200, Math.max(5, parseInt(limit, 10)));
    const skip = (p - 1) * l;
    const total = await Notification.countDocuments({ companyId });
    const notifications = await Notification.find({ companyId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .lean();
    res.json({ total, page: p, limit: l, notifications });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/recruiter/notifications/:id/read
exports.markRead = async (req, res, next) => {
  try {
    const companyId = req.user._id;
    const id = req.params.id;
    const notif = await Notification.findOneAndUpdate(
      { _id: id, companyId },
      { isRead: true },
      { new: true },
    );
    if (!notif)
      return res.status(404).json({ error: "Notification not found" });
    res.json({ message: "Marked read", notification: notif });
  } catch (err) {
    next(err);
  }
};
