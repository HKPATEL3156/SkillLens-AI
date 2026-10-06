const mongoose = require("mongoose");

const resumeATSSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resumeFileName: { type: String, default: "Resume" },
    resumeFilePath: { type: String },
    fileHash: { type: String, index: true },
    targetJobRole: { type: String, default: "Software Developer / Engineer" },
    atsScore: { type: Number, required: true },
    scoreBreakdown: { type: Object, default: {} },
    resumeCompleteness: { type: Object, default: {} },
    skillsAnalysis: { type: Object, default: {} },
    jobRoleMatch: { type: Object, default: {} },
    contentQuality: { type: Object, default: {} },
    experienceAnalysis: { type: Object, default: {} },
    projectAnalysis: { type: Object, default: {} },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    improvementSuggestions: { type: [String], default: [] },
    overallFeedback: { type: String, default: "" },
    rawOutput: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ResumeATS", resumeATSSchema);
