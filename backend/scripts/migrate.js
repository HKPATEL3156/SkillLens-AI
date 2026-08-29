const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Import all models to register their schemas
const User = require("../src/models/User");
const Career = require("../src/models/Career");
const Resume = require("../src/models/Resume");
const Quiz = require("../src/models/Quiz");
const Question = require("../src/models/Question");
const QuestionOption = require("../src/models/QuestionOption");
const MLExecution = require("../src/models/MLExecution");
const Activity = require("../src/models/Activity");
const Job = require("../src/models/Job");
const Notification = require("../src/models/Notification");
const SelectedSkills = require("../src/models/SelectedSkills");
const QuizAttempt = require("../src/models/QuizAttempt");

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not found in environment variables.");
    process.exit(1);
  }

  console.log("Connecting to database for migrations...");
  try {
    await mongoose.connect(uri);
    console.log("Connected successfully. Running migrations & syncing indexes...");

    const models = [
      User,
      Career,
      Resume,
      Quiz,
      Question,
      QuestionOption,
      MLExecution,
      Activity,
      Job,
      Notification,
      SelectedSkills,
      QuizAttempt,
    ];

    for (const model of models) {
      console.log(`Syncing indexes for ${model.modelName}...`);
      await model.syncIndexes();
    }

    console.log("Database migrations: All indexes synchronized successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

run();
