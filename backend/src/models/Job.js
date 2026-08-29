const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    // Basic fields
    title: { type: String, required: true },
    job_role: { type: String },
    job_category: { type: String },
    description: { type: String },

    // Skills
    required_skills: { type: [String], default: [] },
    preferred_skills: { type: [String], default: [] },

    // Positions & type
    totalPositions: { type: Number, default: 1 },
    job_type: {
      type: String,
      enum: ["full-time", "part-time", "internship", "contract"],
      default: "full-time",
    },
    work_mode: {
      type: String,
      enum: ["onsite", "remote", "hybrid"],
      default: "onsite",
    },

    // Location structured
    location: {
      city: String,
      state: String,
      country: String,
      address: String,
    },

    // Experience
    experience_required: {
      min_exp: { type: Number, default: 0 },
      max_exp: { type: Number, default: 50 },
    },

    // Education
    education_required: {
      degree: String,
      field: String,
    },

    // Platform-specific scoring
    minimum_skill_score: { type: Number, default: 0 },
    skill_score_weight: { type: Number, default: 70 },

    // Salary
    salary_type: { type: String, enum: ["fixed", "range"], default: "fixed" },
    salary_min: { type: Number },
    salary_max: { type: Number },
    currency: { type: String, default: "INR" },
    perks: { type: [String], default: [] },

    // Responsibilities and benefits
    responsibilities: { type: String },
    benefits: { type: [String], default: [] },

    // Job description & docs
    job_description_text: { type: String },
    documents: {
      job_description_pdf: { type: String },
      company_policy_pdf: { type: String },
    },

    // Selection process
    selection_rounds: { type: [String], default: [] },
    interview_mode: { type: String, enum: ["online", "offline", "hybrid"] },

    // Application rules
    application_deadline: { type: Date },
    max_applicants: { type: Number },
    allow_resume_upload: { type: Boolean, default: true },

    // Company policies
    company_policy: {
      bond_required: { type: Boolean, default: false },
      bond_duration: { type: String },
      notice_period: { type: String },
    },

    // Visibility & status
    job_status: {
      type: String,
      enum: ["draft", "active", "closed"],
      default: "draft",
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    // System fields
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Job", jobSchema);
