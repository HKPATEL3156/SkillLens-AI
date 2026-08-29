const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const { profileUpload, resumeUpload } = require("../utils/Upload");
const profileCtrl = require("../controllers/profile.controller");
const { educationResultUpload } = require("../utils/Upload");

// All routes are protected
router.use(auth);

// Get current user's profile
router.get("/me", profileCtrl.getProfile);

// Patch update profile (partial updates only)
router.patch("/", profileCtrl.updateProfile);

// Upload profile image (field name: profileImage)
router.post(
  "/photo",
  profileUpload.single("profileImage"),
  profileCtrl.uploadProfileImage,
);

// Upload resume (field name: resume)
router.post("/resume", resumeUpload.single("resume"), profileCtrl.uploadResume);

// Upload education result -> field name: file, optional body: educationIndex
router.post(
  "/education/result",
  educationResultUpload.single("file"),
  profileCtrl.uploadEducationResult,
);

// Get skills
router.get("/skills", profileCtrl.getSkills);

// Get activity logs for current user
router.get("/activity", profileCtrl.getActivities);

module.exports = router;
