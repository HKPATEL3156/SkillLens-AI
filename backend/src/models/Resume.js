const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileHash: { type: String, required: true, index: true },
    version: { type: Number, required: true, default: 1 },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
    parsedData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    rawOutput: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    error: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness of version per user
resumeSchema.index({ userId: 1, version: 1 }, { unique: true });

module.exports = mongoose.model("Resume", resumeSchema);
