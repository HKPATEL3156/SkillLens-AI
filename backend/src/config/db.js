// import mongoose
const mongoose = require("mongoose");

// async function to connect database
const connectdb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("mongodb connected");
  } catch (err) {
    console.error("mongodb connection failed");
    process.exit(1);
  }
};

// export function
module.exports = connectdb;
