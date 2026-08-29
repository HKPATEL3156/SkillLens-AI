const express = require("express");
const router = express.Router();
const recruiterCtrl = require("../controllers/recruiter.controller");
const { companyUpload, jobUpload } = require("../utils/Upload");
const auth = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const jobsCtrl = require("../controllers/jobs.controller");
const recruiterDashboard = require("../controllers/recruiter/dashboard.controller");
const applicationCtrl = require("../controllers/recruiter/application.controller");
const activityCtrl = require("../controllers/recruiter/activity.controller");
const notificationCtrl = require("../controllers/recruiter/notification.controller");
const candidateCtrl = require("../controllers/recruiter/candidate.controller");

// Registration: multipart fields
// fields: company_profile_pdf, registration_certificate, logo
router.post(
  "/register",
  companyUpload.fields([
    { name: "company_profile_pdf", maxCount: 1 },
    { name: "registration_certificate", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  recruiterCtrl.register,
);

// Upload company documents for existing recruiter
router.post(
  "/company/documents",
  auth,
  requireRole("recruiter"),
  companyUpload.fields([
    { name: "company_profile_pdf", maxCount: 1 },
    { name: "registration_certificate", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  recruiterCtrl.uploadDocuments,
);

// Protected recruiter job routes
// plural routes (legacy)
router.post("/jobs", auth, requireRole("recruiter"), jobsCtrl.createJob);
router.get("/jobs", auth, requireRole("recruiter"), jobsCtrl.listCompanyJobs);
router.get("/jobs/:id", auth, requireRole("recruiter"), jobsCtrl.getJob);
router.put("/jobs/:id", auth, requireRole("recruiter"), jobsCtrl.updateJob);
router.delete("/jobs/:id", auth, requireRole("recruiter"), jobsCtrl.deleteJob);

// singular routes as requested: /job - use multer for PDF uploads
router.post(
  "/job",
  auth,
  requireRole("recruiter"),
  jobUpload.fields([
    { name: "job_description_pdf", maxCount: 1 },
    { name: "company_policy_pdf", maxCount: 1 },
  ]),
  jobsCtrl.createJob,
);
router.get("/job/:id", auth, requireRole("recruiter"), jobsCtrl.getJob);
router.put(
  "/job/:id",
  auth,
  requireRole("recruiter"),
  jobUpload.fields([
    { name: "job_description_pdf", maxCount: 1 },
    { name: "company_policy_pdf", maxCount: 1 },
  ]),
  jobsCtrl.updateJob,
);
router.delete("/job/:id", auth, requireRole("recruiter"), jobsCtrl.deleteJob);

// Dashboard
router.get(
  "/dashboard",
  auth,
  requireRole("recruiter"),
  recruiterDashboard.dashboard,
);

// Applicants / applications
router.get(
  "/job/:id/applicants",
  auth,
  requireRole("recruiter"),
  applicationCtrl.listApplicants,
);
router.patch(
  "/application/:id/status",
  auth,
  requireRole("recruiter"),
  applicationCtrl.updateStatus,
);

// Activity & notifications
router.get("/activity", auth, requireRole("recruiter"), activityCtrl.list);
router.get(
  "/notifications",
  auth,
  requireRole("recruiter"),
  notificationCtrl.list,
);
router.patch(
  "/notifications/:id/read",
  auth,
  requireRole("recruiter"),
  notificationCtrl.markRead,
);

// candidate detail
router.get(
  "/candidate/:id",
  auth,
  requireRole("recruiter"),
  candidateCtrl.getCandidate,
);

module.exports = router;
