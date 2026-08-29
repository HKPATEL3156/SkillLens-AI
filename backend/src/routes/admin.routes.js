const express = require("express");
const router = express.Router();
const adminCtrl = require("../controllers/admin.controller");
const auth = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const rateLimiter = require("../middleware/rateLimiter")();

// All admin routes require auth + admin role
router.use(auth);
router.use(requireRole("admin"));
// basic rate limiting for admin panel
router.use(rateLimiter);

// Dashboard
router.get("/dashboard", adminCtrl.dashboard);

// Users
router.get("/users", adminCtrl.listUsers);
router.get("/user/:id", adminCtrl.getUser);
router.put("/user/:id", adminCtrl.updateUser);
router.delete("/user/:id", adminCtrl.deleteUser);
router.patch("/user/:id/block", adminCtrl.blockUser);

// Companies
router.get("/companies", adminCtrl.listCompanies);
router.get("/company/:id", adminCtrl.getCompany);
router.put("/company/:id", adminCtrl.updateCompany);
router.delete("/company/:id", adminCtrl.deleteCompany);
router.patch("/company/:id/block", adminCtrl.blockCompany);
router.put("/company/:id/approve", adminCtrl.approveCompany);
router.put("/company/:id/reject", adminCtrl.rejectCompany);

// Jobs
router.get("/jobs", adminCtrl.listJobs);
router.get("/job/:id", adminCtrl.getJob);
router.delete("/job/:id", adminCtrl.deleteJob);

// Reports & settings
router.get("/reports", adminCtrl.reports);
router.post("/create", adminCtrl.createAdmin);
router.put("/password", adminCtrl.changePassword);
router.get("/settings", adminCtrl.getSettings);

// Admin profile
router.get("/profile", adminCtrl.getProfile);
router.put("/profile", adminCtrl.updateProfile);

module.exports = router;
