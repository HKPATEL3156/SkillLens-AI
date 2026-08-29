// run: node backend/scripts/createAdmin.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../src/models/User");
require("dotenv").config({ path: "./backend/.env" });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const hash = await bcrypt.hash("Admin@sai001", 10);
  const u = new User({
    fullName: "Admin",
    email: "admin.skilllensai@gmail.com",
    password: hash,
    role: "admin",
  });
  await u.save();
  console.log("Admin created:", u._id);
  process.exit();
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
