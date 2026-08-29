const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    company_name: { type: String, required: true },
    company_email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    username: { type: String, required: true, unique: true },
    password: { type: String, select: false },
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    established_year: { type: Number },
    years_of_experience: { type: Number },
    total_employees: { type: Number },
    website: { type: String },
    description: { type: String },
    documents: {
      profile_pdf: { type: String },
      registration_certificate: { type: String },
      logo: { type: String },
    },
    socialLinks: {
      linkedin: { type: String },
      twitter: { type: String },
      facebook: { type: String },
      website: { type: String },
    },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
    },
    role: { type: String, default: "recruiter" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    is_verified: { type: Boolean, default: false },
    is_blocked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Company", companySchema);
