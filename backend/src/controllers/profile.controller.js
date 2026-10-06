const axios = require("axios");
const path = require("path");
const User = require("../models/User");
const Career = require("../models/Career");
const bcrypt = require("bcryptjs");
const Activity = require("../models/Activity");
const { processResumeUpload } = require("../utils/resumeParserHelper");

// GET /api/profile/me
exports.getProfile = async (req, res, next) => {
  try {
    // req.user populated by auth middleware. Support recruiter (company) or normal user.
    if (req.isRecruiter) {
      const Company = require("../models/Company");
      const comp = await Company.findById(req.user._id).select("-password");
      if (!comp) return res.status(404).json({ error: "Recruiter not found" });
      return res.json(comp);
    }
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    // allow common profile fields to be updated via this PATCH endpoint
    const allowed = [
      "name",
      "email",
      "fullName",
      "bio",
      "headline",
      "primaryLocation",
      "openToWork",
      "education",
      "experience",
      // skills are managed exclusively via resume upload / extraction to enforce verified credentials
      "resumeText",
      "username",
      "firstName",
      "lastName",
      "mobileNumber",
      "birthDate",
      "gender",
      "nationality",
      "languages",
      "category",
      "address",
      "socialLinks",
      "profileImage",
      "currentStatus",
      "preferredRole",
      "employmentType",
      "experienceLevel",
      "expectedSalary",
      "projects",
      "achievements",
      "activities",
    ];

    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    // support password change if provided
    if (req.body.password) {
      update.password = await bcrypt.hash(req.body.password, 10);
    }

    // normalize gender to lowercase if provided to match schema enum
    if (update.gender) update.gender = String(update.gender).toLowerCase();

    // special handling for username: allow set/change only if not locked
    if (req.body.username !== undefined) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      // if username already exists elsewhere, block
      if (req.body.username && req.body.username !== user.username) {
        const exists = await User.findOne({ username: req.body.username });
        if (exists)
          return res.status(400).json({ error: "Username already taken" });
      }

      // If usernameLocked is true, disallow changes
      if (user.username && user.usernameLocked) {
        // ignore attempts to change username
        delete update.username;
      } else {
        // allow setting username; if user previously had a username and changes it now, lock afterwards
        update.username = req.body.username;
        update.usernameLocked = true;
      }
    }

    // Sanitize education items: ensure numeric fields and semester objects
    if (Array.isArray(update.education)) {
      update.education = update.education.map((ed) => {
        const copy = { ...ed };
        if (copy.startYear)
          copy.startYear = parseInt(copy.startYear) || undefined;
        if (copy.endYear) copy.endYear = parseInt(copy.endYear) || undefined;
        if (copy.totalSemesters)
          copy.totalSemesters = parseInt(copy.totalSemesters) || 0;
        if (copy.currentSemester)
          copy.currentSemester = parseInt(copy.currentSemester) || 0;
        if (copy.cgpa) copy.cgpa = parseFloat(copy.cgpa) || undefined;
        // semesterWise may be an array of numbers/strings or objects; normalize to {semNumber, sgpa}
        if (Array.isArray(copy.semesterWise)) {
          copy.semesterWise = copy.semesterWise.map((s, idx) => {
            if (
              s &&
              typeof s === "object" &&
              (s.sgpa !== undefined || s.semNumber !== undefined)
            ) {
              return {
                semNumber: parseInt(s.semNumber) || idx + 1,
                sgpa: parseFloat(s.sgpa) || 0,
              };
            }
            // if primitive, treat as sgpa
            const sgpa = parseFloat(s) || 0;
            return { semNumber: idx + 1, sgpa };
          });
        } else {
          copy.semesterWise = [];
        }
        return copy;
      });
    }

    // Sanitize projects, achievements and activities arrays minimally
    if (Array.isArray(update.projects)) {
      update.projects = update.projects.map((p) => {
        const copy = {
          title: p.title || "",
          description: p.description || "",
          techStack: Array.isArray(p.techStack)
            ? p.techStack.map((t) => String(t).trim()).filter(Boolean)
            : [],
        };
        if (p.githubLink) copy.githubLink = String(p.githubLink);
        if (p.liveDemoLink) copy.liveDemoLink = String(p.liveDemoLink);
        return copy;
      });
    }

    if (Array.isArray(update.achievements)) {
      update.achievements = update.achievements.map((a) => ({
        title: a.title || "",
        organization: a.organization || "",
        year: a.year ? parseInt(a.year) : undefined,
        description: a.description || "",
      }));
    }

    if (Array.isArray(update.activities)) {
      update.activities = update.activities.map((ac) => ({
        type: ac.type || "Hobby",
        title: ac.title || "",
        description: ac.description || "",
      }));
    }

    // Sanitize experience technologies to array of strings and parse dates if provided
    if (Array.isArray(update.experience)) {
      update.experience = update.experience.map((ex) => {
        const copy = { ...ex };
        if (Array.isArray(copy.technologies)) {
          copy.technologies = copy.technologies
            .map((t) => String(t).trim())
            .filter(Boolean);
        } else if (typeof copy.technologies === "string") {
          copy.technologies = copy.technologies
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        } else {
          copy.technologies = [];
        }
        // leave dates as strings (frontend sends ISO), mongoose will cast if schema expects Date
        return copy;
      });
    }

    // If this is a recruiter (company) update the Company document instead
    if (req.isRecruiter) {
      const Company = require("../models/Company");
      const allowedCompany = [
        "company_name",
        "company_email",
        "website",
        "description",
        "phone",
        "address",
        "city",
        "state",
        "country",
        "notificationPreferences",
        "socialLinks",
      ];
      const compUpdate = {};
      for (const k of allowedCompany) {
        if (req.body[k] !== undefined) compUpdate[k] = req.body[k];
      }
      const updatedCompany = await Company.findByIdAndUpdate(
        userId,
        { $set: compUpdate },
        { returnDocument: "after" },
      ).select("-password");
      if (!updatedCompany)
        return res.status(404).json({ error: "Recruiter not found" });

      await Activity.create({
        companyId: userId,
        type: "company_profile_update",
        message: "Company profile updated",
      }).catch(() => { });

      return res.json({ message: "Profile updated", company: updatedCompany });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { returnDocument: "after" },
    ).select("-password");
    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    // Log activity
    await Activity.create({
      userId,
      type: "profile_update",
      message: "Profile updated",
    }).catch(() => { });

    res.json({ message: "Profile updated", user: updatedUser });
  } catch (err) {
    next(err);
  }
};

// POST /api/profile/photo
exports.uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const userId = req.user._id;
    // If recruiter, update Company logo
    if (req.isRecruiter) {
      const Company = require("../models/Company");
      const comp = await Company.findById(userId);
      if (!comp) return res.status(404).json({ error: "Recruiter not found" });
      comp.documents = comp.documents || {};
      comp.documents.logo = `/uploads/profile-photos/${req.file.filename}`;
      await comp.save();
      await Activity.create({
        companyId: userId,
        type: "company_logo_upload",
        message: "Company logo updated",
      }).catch(() => { });
      return res.json({
        message: "Company logo updated",
        logo: comp.documents.logo,
      });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.profileImage = `/uploads/profile-photos/${req.file.filename}`;
    if (user.gender) user.gender = String(user.gender).toLowerCase();
    await user.save();

    await Activity.create({
      userId,
      type: "profile_photo_upload",
      message: "Profile photo updated",
    }).catch(() => { });

    res.json({
      message: "Profile photo updated",
      profileImage: user.profileImage,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/profile/resume
exports.uploadResume = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No resume uploaded" });

    const userId = req.user._id || req.user.id;
    const result = await processResumeUpload(userId, req.file);

    // Fetch the updated user profile to return in response
    const updatedUser = await User.findById(userId);

    res.json({
      message: result.message,
      resumeFilePath: updatedUser.resumeFilePath,
      resume_data: updatedUser.resume_data,
      skills: updatedUser.skills,
    });
  } catch (err) {
    console.error("Profile Resume upload error:", err.message);
    res.status(502).json({
      error: "ML parsing error",
      details: err.message,
    });
  }
};

// POST /api/profile/education/result
// Accepts multipart 'file' and optional body param 'educationIndex' (0-based)
exports.uploadEducationResult = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const relativePath = `/uploads/education-results/${req.file.filename}`;

    // If educationIndex provided, try attaching the result to that education entry
    let attachedIndex = null;
    if (req.body && req.body.educationIndex !== undefined) {
      const idx = parseInt(req.body.educationIndex, 10);
      if (
        !Number.isNaN(idx) &&
        Array.isArray(user.education) &&
        idx >= 0 &&
        idx < user.education.length
      ) {
        user.education[idx].resultFilePath = relativePath;
        attachedIndex = idx;
      }
    }

    // Save user whether or not we attached to a specific entry (frontend may patch later)
    await user.save();

    await Activity.create({
      userId,
      type: "education_result_upload",
      message: "Education result uploaded",
    }).catch(() => { });

    const resp = {
      message: "Education result uploaded",
      resultFilePath: relativePath,
    };
    if (attachedIndex !== null) resp.attachedIndex = attachedIndex;
    res.json(resp);
  } catch (err) {
    next(err);
  }
};

// GET /api/profile/skills
exports.getSkills = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("skills");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ skills: user.skills || [] });
  } catch (err) {
    next(err);
  }
};

// GET /api/profile/activity - list recent activity logs for the user
exports.getActivities = async (req, res, next) => {
  try {
    const logs = await Activity.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ activities: logs });
  } catch (err) {
    next(err);
  }
};
