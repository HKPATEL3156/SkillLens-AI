const mongoose = require("mongoose");

// dynamic semester sgpa schema
const semesterSchema = new mongoose.Schema(
  {
    semNumber: { type: Number, required: true },
    sgpa: { type: Number, required: true, min: 0, max: 10 },
  },
  { _id: false },
);

// education schema
const educationSchema = new mongoose.Schema(
  {
    level: { type: String, required: true }, // SSC, HSC, Diploma, Bachelor, Master
    institution: { type: String, required: true },
    boardUniversity: { type: String },
    startYear: { type: Number },
    endYear: { type: Number },
    completed: { type: Boolean, default: false },
    totalSemesters: { type: Number, default: 0 },
    currentSemester: { type: Number, default: 0 },
    cgpa: { type: Number, min: 0, max: 10 },
    semesterWise: { type: [semesterSchema], default: [] },
    // path to uploaded result (PDF/image) for this education entry
    resultFilePath: { type: String },
  },
  { _id: false },
);

// experience schema
const experienceSchema = new mongoose.Schema(
  {
    company: { type: String, required: true },
    role: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    currentlyWorking: { type: Boolean, default: false },
    description: { type: String },
    technologies: { type: [String], default: [] },
  },
  { _id: false },
);

// projects schema
const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    techStack: { type: [String], default: [] },
    githubLink: { type: String },
    liveDemoLink: { type: String },
  },
  { _id: false },
);

// achievements schema
const achievementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    organization: { type: String },
    year: { type: Number },
    description: { type: String },
  },
  { _id: false },
);

// activities / hobbies schema
const activitySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Hobby", "Volunteering", "Sports", "Club"] },
    title: { type: String, required: true },
    description: { type: String },
  },
  { _id: false },
);

// social links schema
const socialSchema = new mongoose.Schema(
  {
    github: { type: String },
    linkedin: { type: String },
    portfolio: { type: String },
    twitter: { type: String },
    other: { type: String },
  },
  { _id: false },
);

// main user schema
const userSchema = new mongoose.Schema(
  {
    // 1. Account Information
    // username is optional at signup. It will be unique when provided (sparse index)
    username: { type: String, unique: true, sparse: true },
    // once user sets or changes username, we lock it to prevent further edits
    usernameLocked: { type: Boolean, default: false },
    // password (hashed). Not returned by default; stored when user registers or sets password
    password: { type: String, select: false },
    email: { type: String, required: true, unique: true, lowercase: true }, // readonly
    registrationDate: { type: Date, default: Date.now, immutable: true },
    accountType: {
      type: String,
      enum: ["Student", "Working Professional"],
      default: "Student",
    },
    // role for access control (user, admin, recruiter)
    role: {
      type: String,
      enum: ["user", "admin", "recruiter"],
      default: "user",
    },

    // 2. Profile Header
    profileImage: { type: String },
    fullName: { type: String },
    headline: { type: String }, // ex: Web Developer | ML Engineer
    primaryLocation: { type: String },
    openToWork: { type: Boolean, default: false },
    bio: { type: String, maxlength: 300 },

    // 3. Personal Information
    firstName: { type: String },
    lastName: { type: String },
    mobileNumber: { type: String },
    birthDate: { type: Date },
    // store gender in lowercase for tolerant matching (accepts 'male' or 'Male')
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      lowercase: true,
    },
    nationality: { type: String },
    languages: { type: [String], default: [] },
    category: {
      type: String,
      enum: [
        "Student",
        "Working Professional",
        "Internship Seeking",
        "Freelancer",
        "Open to Opportunities",
      ],
      default: "Student",
    },

    // 4. Address Details
    address: {
      flat: String,
      street: String,
      postalCode: String,
      city: String,
      taluka: String,
      district: String,
      state: String,
      country: String,
    },

    // 5. Social Links
    socialLinks: { type: socialSchema },

    // 6. Career Information
    currentStatus: {
      type: String,
      enum: ["Studying", "Working", "Fresher"],
      default: "Studying",
    },
    // account status for admin management
    status: { type: String, enum: ["active", "blocked"], default: "active" },
    preferredRole: { type: String },
    employmentType: {
      type: String,
      enum: ["Full Time", "Part Time", "Internship", "Remote"],
    },
    experienceLevel: { type: Number, default: 0 }, // in years
    expectedSalary: { type: Number },
    resumeFilePath: { type: String },
    resume_data: { type: mongoose.Schema.Types.Mixed, default: null },
    skills: { type: [String], default: [] },

    // 7. Experience
    experience: { type: [experienceSchema], default: [] },

    // 8. Education
    education: { type: [educationSchema], default: [] },

    // 9. Projects
    projects: { type: [projectSchema], default: [] },

    // 10. Achievements
    achievements: { type: [achievementSchema], default: [] },

    // 11. Activities / Hobbies
    activities: { type: [activitySchema], default: [] },
  },
  { timestamps: true },
);

// hide sensitive fields
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
