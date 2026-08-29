const mongoose = require("mongoose");

const selectedSkillsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    skills: { type: [String], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SelectedSkills", selectedSkillsSchema);
