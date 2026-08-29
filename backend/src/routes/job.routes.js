const express = require("express");
const router = express.Router();
const jobsCtrl = require("../controllers/jobs.controller");
const auth = require("../middleware/auth.middleware");
const { resumeUpload } = require("../utils/Upload");

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
