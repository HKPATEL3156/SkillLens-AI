const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Middleware to authenticate user
const authenticate = require("../middleware/auth.middleware");

// Dashboard Route
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.id; // Extracted from JWT middleware
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({
      message: "Dashboard data fetched successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({ error: "Error fetching dashboard data" });
  }
});

// Profile Update Route
router.put("/profile", authenticate, async (req, res) => {
  const {
    name,
    email,
    phone,
    address,
    education,
    birthdate,
    cgpa,
    skills,
    links,
    password,
    username,
  } = req.body;

  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const updateData = {
      name,
      email,
      phone,
      address,
      education,
      birthdate,
      cgpa,
      skills,
      links,
    };

    // Handle username: allow set/change only once
    if (username !== undefined) {
      if (user.username && user.usernameLocked) {
        // ignore username changes
      } else {
        // ensure uniqueness
        if (username && username !== user.username) {
          const exists = await User.findOne({ username });
          if (exists)
            return res.status(400).json({ error: "Username already exists" });
        }
        updateData.username = username;
        updateData.usernameLocked = true; // lock after change
      }
    }

    if (password) {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({ error: "Password must be strong." });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      returnDocument: "after",
    });
    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    res.status(500).json({ error: "Error updating profile" });
  }
});

module.exports = router;
