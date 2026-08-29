const mongoose = require("mongoose");
const QuizAttempt = require("../src/models/QuizAttempt");

// Replace with your actual MongoDB URI
const MONGO_URI =
  "mongodb+srv://hkpatel:hk123456@hk.ooffpcl.mongodb.net/sgp6?retryWrites=true&w=majority";

async function main() {
  try {
    await mongoose.connect(MONGO_URI); // No options needed for Mongoose v6+
    await QuizAttempt.deleteMany({});
    console.log("All quiz attempts deleted successfully.");
  } catch (err) {
    console.error("Error deleting quiz attempts:", err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
