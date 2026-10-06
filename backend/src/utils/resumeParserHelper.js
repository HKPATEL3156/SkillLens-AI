const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const Resume = require("../models/Resume");
const User = require("../models/User");
const Career = require("../models/Career");
const Activity = require("../models/Activity");
const { createExecution, updateExecution } = require("./mlExecutionHelper");
const { normalizeResumeData } = require("./dataNormalizer");

// Fetch ML service URL from env
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

/**
 * Extracts raw list of skills from parsed Gemini technical/soft skills structure.
 */
function extractSkillsList(parsed) {
  const technical = parsed.technical_skills || {};
  let list = [];
  if (typeof technical === "object" && !Array.isArray(technical)) {
    for (const val of Object.values(technical)) {
      if (Array.isArray(val)) {
        list.push(...val);
      } else if (typeof val === "string") {
        list.push(val);
      }
    }
  } else if (Array.isArray(technical)) {
    list.push(...technical);
  }

  if (Array.isArray(parsed.soft_skills)) {
    list.push(...parsed.soft_skills);
  }

  // Normalize case-insensitively and remove duplicates
  const seen = new Set();
  return list
    .map((s) => String(s).trim())
    .filter((s) => {
      if (!s) return false;
      const lower = s.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
}

/**
 * Synchronizes the normalized resume data into the User profile and Career collections.
 */
async function syncResumeDataToProfile(userId, resumeUrl, resumeData, skills) {
  const normalized = normalizeResumeData(resumeData);
  if (!normalized) return;

  // 1. Sync to User
  const userUpdates = {
    resumeFilePath: resumeUrl,
    resume_data: resumeData,
  };

  const personal = normalized.personal;
  if (personal.fullName) userUpdates.fullName = personal.fullName;
  if (personal.headline) userUpdates.headline = personal.headline;
  if (personal.mobileNumber) userUpdates.mobileNumber = personal.mobileNumber;
  if (personal.primaryLocation) userUpdates.primaryLocation = personal.primaryLocation;
  if (personal.bio) userUpdates.bio = personal.bio;
  if (personal.socialLinks) userUpdates.socialLinks = personal.socialLinks;
  if (normalized.languages && normalized.languages.length) {
    userUpdates.languages = normalized.languages;
  }
  if (normalized.education && normalized.education.length) {
    userUpdates.education = normalized.education;
  }
  if (normalized.experience && normalized.experience.length) {
    userUpdates.experience = normalized.experience;
  }
  if (normalized.projects && normalized.projects.length) {
    userUpdates.projects = normalized.projects;
  }
  if (normalized.achievements && normalized.achievements.length) {
    userUpdates.achievements = normalized.achievements;
  }

  if (skills && Array.isArray(skills) && skills.length) {
    userUpdates.skills = skills;
  }
  const userQuery = { $set: userUpdates };

  await User.findByIdAndUpdate(userId, userQuery);

  // 2. Sync to Career
  const careerUpdates = {
    resumeUrl: resumeUrl,
    parsedResume: resumeData,
    resume_data: resumeData,
  };

  if (personal.fullName) careerUpdates.fullName = personal.fullName;
  if (personal.mobileNumber) careerUpdates.phone = personal.mobileNumber;
  if (personal.email) careerUpdates.email = personal.email;

  if (normalized.education && normalized.education.length) {
    careerUpdates.education = normalized.education.map((edu) => ({
      institution: edu.institution,
      degree: edu.level,
      fieldOfStudy: edu.boardUniversity,
      startYear: edu.startYear ? String(edu.startYear) : "",
      endYear: edu.endYear ? String(edu.endYear) : "",
    }));
  }

  if (normalized.experience && normalized.experience.length) {
    careerUpdates.experience = normalized.experience.map((exp) => {
      const dur = `${exp.startDate ? exp.startDate.getFullYear() : ""} - ${
        exp.currentlyWorking ? "Present" : exp.endDate ? exp.endDate.getFullYear() : ""
      }`;
      return {
        company: exp.company,
        role: exp.role,
        duration: dur,
        description: exp.description,
      };
    });
  }

  if (normalized.projects && normalized.projects.length) {
    careerUpdates.projects = normalized.projects.map((proj) => ({
      title: proj.title,
      description: proj.description,
      technologies: proj.techStack,
      link: proj.githubLink || proj.liveDemoLink || "",
    }));
  }

  if (skills && Array.isArray(skills) && skills.length) {
    careerUpdates.skills = skills;
    careerUpdates.extractedSkills = skills;
  }
  const careerQuery = { $set: careerUpdates };

  await Career.findOneAndUpdate(
    { userId },
    careerQuery,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

/**
 * Main parser entrypoint orchestrating pipeline.
 */
async function processResumeUpload(userId, file) {
  const relativePath = `/uploads/resumes/${file.filename}`;
  const fsPath = file.path.replace(/\\/g, "/");

  // Compute file SHA-256 hash
  const fileBuffer = fs.readFileSync(file.path);
  const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

  // Determine highest version
  const lastResume = await Resume.findOne({ userId }).sort({ version: -1 });
  const newVersion = lastResume ? lastResume.version + 1 : 1;

  // Deactivate all previous resumes
  await Resume.updateMany({ userId }, { $set: { isActive: false } });

  // Check for duplicate resume (same user, same file hash, parsed successfully)
  const duplicate = await Resume.findOne({ userId, fileHash, status: "COMPLETED" });

  if (duplicate) {
    console.log(`[INFO] Duplicate resume detected for user ${userId}. Reusing parsed data.`);
    const newResume = await Resume.create({
      userId,
      fileName: file.originalname,
      filePath: relativePath,
      fileHash,
      version: newVersion,
      status: "COMPLETED",
      parsedData: duplicate.parsedData,
      rawOutput: duplicate.rawOutput,
      isActive: true,
    });

    // Log completed ML execution
    await createExecution({
      userId,
      entityType: "resume",
      entityId: newResume._id.toString(),
      modelName: "gemini-2.5-flash",
      modelVersion: "1.0",
      status: "COMPLETED",
      rawOutput: duplicate.rawOutput,
    });

    // Synchronize to User/Career profile
    const skills = extractSkillsList(duplicate.parsedData);
    await syncResumeDataToProfile(userId, relativePath, duplicate.parsedData, skills);

    await Activity.create({
      userId,
      type: "resume_upload",
      message: `Resume uploaded and processed from cache (v${newVersion})`,
    }).catch(() => {});

    return {
      success: true,
      resume: newResume,
      message: "Resume processed successfully (reused cached details)",
    };
  }

  // Create PENDING resume record
  const newResume = await Resume.create({
    userId,
    fileName: file.originalname,
    filePath: relativePath,
    fileHash,
    version: newVersion,
    status: "PROCESSING",
    isActive: true,
  });

  // Log ML execution as PROCESSING
  const mlExec = await createExecution({
    userId,
    entityType: "resume",
    entityId: newResume._id.toString(),
    modelName: "gemini-2.5-flash",
    modelVersion: "1.0",
    status: "PROCESSING",
  });

  try {
    console.log(`[INFO] Calling ML service for resume parsing (hash: ${fileHash}, timeout: 120s)`);
    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/extract-skills`,
      { filepath: fsPath },
      { timeout: 120000 }
    );

    const data = mlResponse.data || {};
    if (!data.success || !data.resume_data) {
      throw new Error(data.error || "ML service failed to return structured resume data.");
    }

    // Save outputs
    newResume.status = "COMPLETED";
    newResume.parsedData = data.resume_data;
    newResume.rawOutput = data;
    await newResume.save();

    await updateExecution(mlExec._id, {
      status: "COMPLETED",
      rawOutput: data,
    });

    const skills = extractSkillsList(data.resume_data);
    await syncResumeDataToProfile(userId, relativePath, data.resume_data, skills);

    await Activity.create({
      userId,
      type: "resume_upload",
      message: `Resume uploaded and parsed successfully (v${newVersion})`,
    }).catch(() => {});

    return {
      success: true,
      resume: newResume,
      message: "Resume uploaded and parsed successfully",
    };
  } catch (err) {
    const errorMsg = err.response && err.response.data && err.response.data.details
      ? err.response.data.details
      : err.message || "ML Service Error";

    console.error(`[ERR] ML resume parsing pipeline failed: ${errorMsg}`);

    newResume.status = "FAILED";
    newResume.error = errorMsg;
    await newResume.save();

    await updateExecution(mlExec._id, {
      status: "FAILED",
      error: errorMsg,
    });

    throw new Error(errorMsg);
  }
}

module.exports = {
  processResumeUpload,
  extractSkillsList,
};
