const express = require("express");
const router = express.Router();
const jobsCtrl = require("../controllers/jobs.controller");
const auth = require("../middleware/auth.middleware");
const { resumeUpload } = require("../utils/Upload");

// User's own applications (must precede /:id)
router.get("/my/applications", auth, jobsCtrl.getMyApplications);
// Check single job application status
router.get("/:id/application", auth, jobsCtrl.getMyApplicationForJob);

// Public job listings
router.get("/", jobsCtrl.listPublicJobs);
// Public job detail
router.get("/:id", jobsCtrl.getPublicJob);
// Apply to a job (authenticated). Optional resume upload (field name: 'resume')
router.post(
  "/:id/apply",
  auth,
  resumeUpload.single("resume"),
  jobsCtrl.applyToJob,
);

module.exports = router;
