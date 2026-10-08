const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    questionId: { type: String },
    category: { type: String, default: "Technical" }, // Technical, Behavioral / HR, System Design, Problem Solving
    difficulty: { type: String, default: "Medium" }, // Easy, Medium, Hard
    question: { type: String, required: true },
    context_note: { type: String },
    sample_ideal_points: { type: [String], default: [] },
  },
  { _id: false }
);

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: Number, required: true },
    answerText: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now },
    timeTakenSeconds: { type: Number, default: 0 },
  },
  { _id: false }
);

const mockInterviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetRole: { type: String, required: true, default: "Software Developer" },
    companyName: { type: String, default: "" },
    companyJD: { type: String, default: "" },
    interviewType: {
      type: String,
      enum: ["Comprehensive", "Technical", "Behavioral"],
      default: "Comprehensive",
    },
    interviewTitle: { type: String, default: "AI Mock Interview" },
    status: {
      type: String,
      enum: ["setup", "in_progress", "completed", "abandoned"],
      default: "in_progress",
    },
    resumeFileName: { type: String },
    resumeFilePath: { type: String },
    resumeData: { type: mongoose.Schema.Types.Mixed, default: null },
    
    questions: { type: [questionSchema], default: [] },
    answers: { type: [answerSchema], default: [] },
    currentQuestionIndex: { type: Number, default: 0 },

    // Evaluation results populated upon completion
    evaluation: {
      overall_score: { type: Number },
      overall_verdict: { type: String },
      performance_breakdown: {
        technical_depth: { type: Number },
        communication_clarity: { type: Number },
        problem_solving: { type: Number },
        behavioral_competency: { type: Number },
        role_alignment: { type: Number },
      },
      strengths: { type: [String], default: [] },
      weaknesses: { type: [String], default: [] },
      improvement_roadmap: { type: [String], default: [] },
      question_reviews: { type: Array, default: [] },
      overall_mentor_feedback: { type: String },
    },
    score: { type: Number, default: 0 },
    verdict: { type: String, default: "Pending" },

    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    totalDurationSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MockInterview", mockInterviewSchema);
