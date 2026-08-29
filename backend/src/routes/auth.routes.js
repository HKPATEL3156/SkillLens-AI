const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Activity = require("../models/Activity");
const {
  registerValidation,
  loginValidation,
} = require("../middleware/validators");
const { validationResult } = require("express-validator");
const auth = require("../middleware/auth.middleware");
const path = require("path");
const multer = require("multer");
const router = express.Router();

// --- PUBLIC ROUTES (no auth required) ---

// Signup
router.post("/signup", registerValidation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const {
    name,
    email,
    password,
    username,
    dob,
    qualification,
    phone,
    address,
    gender,
    bio,
  } = req.body;
  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }
    // If username is provided, check if it exists
    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ error: "Username already exists" });
      }
    }
    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      fullName: name,
      email,
      password: hashedPassword,
      // Only set username if provided
      ...(username && { username }),
      dob,
      qualification,
      phone,
      address,
      gender,
      bio,
    });
    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    next(err);
  }
});

// Development helper: set initial password for accounts that have no password.
// IMPORTANT: This is intentionally guarded by an environment flag to avoid misuse in production.
router.post("/set-password", async (req, res, next) => {
  try {
    if (process.env.ALLOW_INSECURE_SET_PASSWORD !== "true") {
      return res.status(403).json({ error: "Not allowed" });
    }
    const { email, newPassword } = req.body;
    if (!email || !newPassword)
      return res
        .status(400)
        .json({ error: "Email and newPassword are required" });
    // basic password strength check
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword))
      return res.status(400).json({
        error:
          "Password must be at least 8 chars, include uppercase, number and special char",
      });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.password)
      return res
        .status(400)
        .json({ error: "Password already set for this account" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password set successfully" });
  } catch (err) {
    next(err);
  }
});

// Login
router.post("/login", loginValidation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password } = req.body;
  try {
    // Try users first
    let user = await User.findOne({ email }).select("+password");
    // If user not found, try company (recruiter)
    if (!user) {
      const Company = require("../models/Company");
      const company = await Company.findOne({
        $or: [{ company_email: email }, { username: email }],
      }).select("+password");
      if (!company) return res.status(404).json({ error: "User not found" });
      // Recruiter login rules
      if (company.status !== "approved" || !company.is_verified) {
        return res
          .status(403)
          .json({ error: "Your company is not approved yet" });
      }
      if (!company.password)
        return res.status(400).json({ error: "Account has no password set" });
      const match = await bcrypt.compare(password, company.password);
      if (!match) return res.status(401).json({ error: "Invalid credentials" });
      if (!process.env.JWT_SECRET)
        return res
          .status(500)
          .json({ error: "Server authentication misconfigured" });
      const tokenPayload = { id: company._id, role: "recruiter" };
      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      return res.status(200).json({ token, role: "recruiter" });
    }

    // user account
    if (!user.password) {
      console.error(
        `Login attempt for user ${email} but no password is set on account`,
      );
      return res
        .status(400)
        .json({
          error: "Account has no password set. Please reset your password.",
        });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });
    if (!process.env.JWT_SECRET)
      return res
        .status(500)
        .json({ error: "Server authentication misconfigured" });
    const tokenPayload = { id: user._id, role: user.role || "user" };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({ token, role: user.role || "user" });
  } catch (err) {
    next(err);
  }
});

// --- PROTECTED ROUTES (require auth) ---
router.use(auth);

// Get current user profile
router.get("/profile", async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// Multer storage for profile photo (req.user is now available)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../uploads/profile-photos"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, req.user._id + "_" + Date.now() + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

// Get user activity log
router.get("/activity/me", async (req, res, next) => {
  try {
    const userId = req.user._id;
    const activities = await Activity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(activities);
  } catch (err) {
    next(err);
  }
});

// Compatibility wrapper: accept legacy frontend uploads to /api/auth/profile/photo
const profileCtrl = require("../controllers/profile.controller");
router.post("/profile/photo", upload.single("profilePhoto"), (req, res, next) =>
  profileCtrl.uploadProfileImage(req, res, next),
);

// Change Password
router.post("/change-password", async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { old, new: newPassword } = req.body;
    if (!old || !newPassword)
      return res
        .status(400)
        .json({ error: "Both old and new password are required" });
    const user = await User.findById(userId).select("+password");
    if (!user) return res.status(404).json({ error: "User not found" });
    const isMatch = await bcrypt.compare(old, user.password);
    if (!isMatch)
      return res.status(401).json({ error: "Old password is incorrect" });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
});

// Note: profile-related endpoints (profile, profile photo, resume, skills)
// have been moved to dedicated routes at /api/profile to keep code organized.

module.exports = router;
