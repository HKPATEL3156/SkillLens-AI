function extractYear(dateStr) {
  if (!dateStr) return null;
  const match = String(dateStr).match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0], 10) : null;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const cleaned = String(dateStr).trim().toLowerCase();
  if (
    cleaned.includes("present") ||
    cleaned.includes("current") ||
    cleaned.includes("now") ||
    cleaned === "null" ||
    cleaned === ""
  ) {
    return null;
  }
  const timestamp = Date.parse(dateStr);
  if (!isNaN(timestamp)) {
    return new Date(timestamp);
  }
  // Fallback: match "Month Year" or "Year"
  const yearMatch = cleaned.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[0], 10);
    const months = [
      "jan", "feb", "mar", "apr", "may", "jun",
      "jul", "aug", "sep", "oct", "nov", "dec"
    ];
    let monthIdx = 0;
    for (let i = 0; i < months.length; i++) {
      if (cleaned.includes(months[i])) {
        monthIdx = i;
        break;
      }
    }
    return new Date(year, monthIdx, 1);
  }
  return null;
}

function normalizeEducationLevel(degree) {
  if (!degree) return "Bachelor";
  const d = String(degree).toLowerCase();
  if (
    d.includes("bachelor") ||
    d.includes("b.e") ||
    d.includes("b.tech") ||
    d.includes("bca") ||
    d.includes("b.sc") ||
    d.includes("bsc") ||
    d.includes("b.com") ||
    d.includes("bba")
  ) {
    return "Bachelor";
  }
  if (
    d.includes("master") ||
    d.includes("m.tech") ||
    d.includes("m.e") ||
    d.includes("mca") ||
    d.includes("m.sc") ||
    d.includes("msc") ||
    d.includes("mba")
  ) {
    return "Master";
  }
  if (d.includes("diploma")) {
    return "Diploma";
  }
  if (
    d.includes("hsc") ||
    d.includes("12th") ||
    d.includes("higher secondary") ||
    d.includes("intermediate") ||
    d.includes("junior college")
  ) {
    return "HSC";
  }
  if (
    d.includes("ssc") ||
    d.includes("10th") ||
    d.includes("secondary") ||
    d.includes("matriculation") ||
    d.includes("high school")
  ) {
    return "SSC";
  }
  return "Bachelor"; // default fallback
}

function normalizeResumeData(parsed) {
  if (!parsed) return null;

  const personal = parsed.personal_information || {};
  const normalized = {
    personal: {
      fullName: personal.full_name || null,
      headline: personal.current_role || null,
      mobileNumber: personal.phone || null,
      email: personal.email || null,
      primaryLocation: personal.location || null,
      bio: parsed.summary ? String(parsed.summary).slice(0, 300) : null,
      socialLinks: {
        github: personal.github || "",
        linkedin: personal.linkedin || "",
        portfolio: personal.portfolio || "",
        twitter: "",
        other: Array.isArray(personal.other_links) && personal.other_links.length ? personal.other_links[0] : "",
      },
    },
    education: [],
    experience: [],
    projects: [],
    achievements: [],
    languages: Array.isArray(parsed.languages) ? parsed.languages : [],
  };

  // Map Education
  if (Array.isArray(parsed.education)) {
    normalized.education = parsed.education.map((edu) => {
      const startYear = extractYear(edu.start_date);
      const endYear = extractYear(edu.end_date);
      const completed = !!endYear && endYear <= new Date().getFullYear();
      let cgpa = null;
      if (edu.cgpa) {
        const cgpaMatch = String(edu.cgpa).match(/[+-]?\d+(\.\d+)?/);
        if (cgpaMatch) cgpa = parseFloat(cgpaMatch[0]);
      }
      return {
        level: normalizeEducationLevel(edu.degree),
        institution: edu.institution || "Unknown Institution",
        boardUniversity: edu.institution || "",
        startYear: startYear,
        endYear: endYear,
        completed: completed,
        cgpa: cgpa,
      };
    });
  }

  // Map Experience + Internships
  const rawExperience = Array.isArray(parsed.experience) ? parsed.experience : [];
  const rawInternships = Array.isArray(parsed.internships) ? parsed.internships : [];
  const combinedExp = [...rawExperience, ...rawInternships];

  normalized.experience = combinedExp.map((exp) => {
    const sDate = parseDate(exp.start_date);
    const eDate = parseDate(exp.end_date);
    const current = !eDate && (
      String(exp.end_date).toLowerCase().includes("present") ||
      String(exp.end_date).toLowerCase().includes("current") ||
      !exp.end_date
    );
    const desc = Array.isArray(exp.responsibilities)
      ? exp.responsibilities.join("\n")
      : exp.description
        ? Array.isArray(exp.description)
          ? exp.description.join("\n")
          : String(exp.description)
        : "";
    return {
      company: exp.company || "Unknown Company",
      role: exp.role || "Developer",
      startDate: sDate || new Date(),
      endDate: eDate || null,
      currentlyWorking: current,
      description: desc,
      technologies: Array.isArray(exp.technologies) ? exp.technologies : [],
    };
  });

  // Map Projects
  if (Array.isArray(parsed.projects)) {
    normalized.projects = parsed.projects.map((proj) => ({
      title: proj.project_name || "Untitled Project",
      description: proj.description || "",
      techStack: Array.isArray(proj.technologies) ? proj.technologies : [],
      githubLink: proj.github || "",
      liveDemoLink: proj.live_demo || "",
    }));
  }

  // Map Achievements
  if (Array.isArray(parsed.achievements)) {
    normalized.achievements = parsed.achievements.map((ach) => {
      if (typeof ach === "string") {
        return { title: ach, organization: "", year: null, description: "" };
      }
      return {
        title: ach.title || "Achievement",
        organization: ach.organization || "",
        year: extractYear(ach.year),
        description: ach.description || "",
      };
    });
  }

  return normalized;
}

module.exports = {
  extractYear,
  parseDate,
  normalizeEducationLevel,
  normalizeResumeData,
};
