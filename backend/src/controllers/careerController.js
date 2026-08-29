const Career = require("../models/Career");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");

// Get current user's career profile
exports.getCareer = async (req, res) => {
  try {
    const career = await Career.findOne({ userId: req.user.id });
    res.json(career);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update current user's career info
exports.saveCareer = async (req, res) => {
  try {
    const userId = req.user.id;
    const update = { ...req.body, userId };
    const career = await Career.findOneAndUpdate({ userId }, update, {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
    });
    res.json(career);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Upload resume PDF
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    if (req.file.mimetype !== "application/pdf")
      return res.status(400).json({ message: "Only PDF files allowed" });
    const resumeUrl = req.file.path.replace(/\\/g, "/");
    const data = await Career.findOneAndUpdate(
      { userId: req.user.id },
      { resumeUrl },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
    );
    res.json({
      message: "Resume uploaded successfully",
      resumeUrl: data.resumeUrl,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Upload result PDF
exports.uploadResult = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    if (req.file.mimetype !== "application/pdf")
      return res.status(400).json({ message: "Only PDF files allowed" });
    const resultUrl = req.file.path.replace(/\\/g, "/");
    const data = await Career.findOneAndUpdate(
      { userId: req.user.id },
      { resultUrl },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
    );
    res.json({
      message: "Result uploaded successfully",
      resultUrl: data.resultUrl,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Download resume PDF
exports.downloadResume = async (req, res) => {
  try {
    const data = await Career.findOne({ userId: req.user.id }, "resumeUrl");
    if (!data || !data.resumeUrl)
      return res.status(404).json({ message: "No resume found for the user" });
    const filePath = path.join(__dirname, "../../", data.resumeUrl);
    if (!fs.existsSync(filePath))
      return res.status(404).json({ message: "Resume file not found" });
    res.download(filePath, path.basename(filePath));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Download result PDF
exports.downloadResult = async (req, res) => {
  try {
    const data = await Career.findOne({ userId: req.user.id }, "resultUrl");
    if (!data || !data.resultUrl)
      return res.status(404).json({ message: "No result found for the user" });
    const filePath = path.join(__dirname, "../../", data.resultUrl);
    if (!fs.existsSync(filePath))
      return res.status(404).json({ message: "Result file not found" });
    res.download(filePath, path.basename(filePath));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// upload resume controller
// (legacy helper removed) use routes in careerRoutes.js for resume uploads
