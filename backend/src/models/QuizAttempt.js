const mongoose = require("mongoose");

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    skills: { type: [String], default: [] },
    quizName: { type: String, default: "Skill Quiz" },
    // the randomized question set provided to the candidate for this attempt
    questionSet: { type: Array, default: [] },
    totalMarks: { type: Number, default: 0 },
    obtainedMarks: { type: Number, default: 0 },
    percent: { type: Number },
    qualified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["started", "submitted", "cancelled"],
      default: "started",
    },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    // store summary of answers (small footprint)
    answersSummary: { type: Object },
    // checkpoint for autosave (answers, statuses, position, timeLeft)
    checkpoint: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
