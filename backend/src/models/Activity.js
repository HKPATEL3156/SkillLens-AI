const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    // For user activities, set userId. For company/recruiter activities, set companyId.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", index: true },
    type: { type: String, required: true }, // e.g. 'profile_update', 'resume_upload', 'job_posted'
    message: { type: String },
    meta: { type: Object },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

module.exports = mongoose.model("Activity", activitySchema);
