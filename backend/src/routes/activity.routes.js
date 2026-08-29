const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const Activity = require("../models/Activity");

router.use(auth);

// GET /api/activity/me
router.get("/me", async (req, res, next) => {
  try {
    const activities = await Activity.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(activities);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
