const mongoose = require("mongoose");

const mlExecutionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      index: true,
    },
    modelName: { type: String, required: true },
    modelVersion: { type: String, required: true },
    rawOutput: { type: mongoose.Schema.Types.Mixed, default: null },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
      required: true,
    },
    error: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MLExecution", mlExecutionSchema);
