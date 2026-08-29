const mongoose = require("mongoose");

const questionOptionSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
      index: true,
    },
    key: { type: String, required: true }, // 'A', 'B', 'C', 'D'
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuestionOption", questionOptionSchema);
