const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    text: { type: String, required: true },
    code: { type: String, default: null },
    type: { type: String, enum: ["MCQ", "MSQ"], default: "MCQ" },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);
