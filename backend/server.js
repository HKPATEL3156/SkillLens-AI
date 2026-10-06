const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Load env variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directories exist
const resumesDir = path.join(__dirname, "uploads/resumes");
const profilePhotosDir = path.join(__dirname, "uploads/profile-photos");
if (!fs.existsSync(resumesDir)) fs.mkdirSync(resumesDir, { recursive: true });
if (!fs.existsSync(profilePhotosDir))
  fs.mkdirSync(profilePhotosDir, { recursive: true });

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Import routes
const careerRoutes = require("./src/routes/careerRoutes");
const authRoutes = require("./src/routes/auth.routes");
const profileRoutes = require("./src/routes/profile.routes");
const activityRoutes = require("./src/routes/activity.routes");
const quizRoutes = require("./src/routes/quizRoutes");
const recruiterRoutes = require("./src/routes/recruiter.routes");
const adminRoutes = require("./src/routes/admin.routes");
const mlRoutes = require("./src/routes/ml.routes");
const jobRoutes = require("./src/routes/job.routes");
const atsRoutes = require("./src/routes/atsRoutes");

// Use routes
app.use("/api/career", careerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/ats", atsRoutes);

// Swagger Documentation
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Centralized error handler
const errorHandler = require("./src/middleware/errorHandler");
app.use(errorHandler);

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully...");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

module.exports = app;
