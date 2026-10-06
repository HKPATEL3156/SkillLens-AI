import React, { useEffect, useState, useRef } from "react";
import defaultAvatar from "../assets/default-avatar.svg";
import {
  getProfile,
  patchProfile,
  uploadProfilePhoto,
  uploadResume,
  uploadEducationResult,
  downloadCareerResume,
} from "../services/api";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiGlobe,
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
  FiSave,
  FiSend,
  FiUploadCloud,
  FiDownload,
  FiFileText,
  FiTrash2,
  FiPlus,
  FiExternalLink,
  FiSearch,
  FiCpu,
  FiBriefcase,
  FiBookOpen,
  FiAward,
  FiCamera,
  FiCheck,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiShield,
  FiClock,
  FiTag,
  FiEye,
} from "react-icons/fi";
import { FaGithub, FaLinkedin, FaTwitter, FaGlobe as FaGlobeIcon } from "react-icons/fa";
import { HiOutlineSparkles } from "react-icons/hi2";

const emptyProfile = {
  username: "",
  email: "",
  registrationDate: "",
  accountType: "Student",
  profileImage: "",
  fullName: "",
  headline: "",
  primaryLocation: "",
  openToWork: false,
  bio: "",
  firstName: "",
  lastName: "",
  mobileNumber: "",
  birthDate: "",
  gender: "",
  nationality: "",
  languages: [],
  category: "Student",
  address: { flat: "", street: "", postalCode: "", city: "", taluka: "", district: "", state: "", country: "" },
  socialLinks: { github: "", linkedin: "", portfolio: "", twitter: "", other: "" },
  career: { currentStatus: "Studying", preferredRole: "", employmentType: "Full Time", experienceLevel: 0, expectedSalary: null, resumeFilePath: "", skills: [] },
  skills: [],
  experience: [],
  education: [],
  projects: [],
  achievements: [],
  activities: [],
};

const backendBase = import.meta?.env?.VITE_API_BASE || "http://localhost:5000";

const resolveAsset = (p) => {
  if (!p) return "";
  if (typeof p !== "string") return p;
  if (p.startsWith("http://") || p.startsWith("https://") || p.startsWith("blob:") || p.startsWith("data:")) return p;
  if (p.startsWith("/uploads") || p.startsWith("uploads")) {
    return `${backendBase}${p.startsWith("/") ? p : "/" + p}`;
  }
  return p;
};

// Reusable Base Link Input with attached prefix badge
const SocialLinkInput = ({ icon: Icon, prefix, value = "", onChange, placeholder }) => {
  const extractHandle = (val, pfx) => {
    if (!val) return "";
    let str = String(val).trim();
    str = str.replace(/^https?:\/\/(www\.)?/, "");
    const cleanPfx = pfx.replace(/^https?:\/\/(www\.)?/, "");
    if (str.toLowerCase().startsWith(cleanPfx.toLowerCase())) {
      str = str.slice(cleanPfx.length);
    }
    return str.replace(/^[@\/]+/, "");
  };

  const currentHandle = extractHandle(value, prefix);

  const handleInputChange = (e) => {
    const raw = e.target.value.trim();
    if (!raw) {
      onChange("");
      return;
    }
    const clean = extractHandle(raw, prefix);
    const fullUrl = prefix.endsWith("/") ? `${prefix}${clean}` : `${prefix}/${clean}`;
    onChange(clean ? fullUrl : "");
  };

  const targetLink = value
    ? value.startsWith("http")
      ? value
      : `${prefix}${currentHandle}`
    : currentHandle
      ? `${prefix}${currentHandle}`
      : "";

  return (
    <div className="flex items-center rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100/70 transition-all shadow-xs group">
      <div className="flex items-center gap-1.5 px-3.5 py-3 bg-slate-50 border-r border-slate-200 text-slate-500 rounded-l-xl select-none flex-shrink-0">
        {Icon && <Icon className="text-base text-slate-600 group-focus-within:text-indigo-600 transition-colors" />}
        <span className="text-xs font-mono font-semibold text-slate-600 tracking-tight">{prefix}</span>
      </div>
      <input
        type="text"
        value={currentHandle}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="w-full bg-transparent px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
      />
      {targetLink && (
        <a
          href={targetLink}
          target="_blank"
          rel="noreferrer"
          className="px-3.5 py-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors flex items-center gap-1 text-xs font-medium"
          title={`Open ${targetLink}`}
        >
          <FiExternalLink className="text-sm" />
          <span className="hidden sm:inline">Visit</span>
        </a>
      )}
    </div>
  );
};

// Tag Input for languages & technologies
const TagInput = ({ values = [], onChange, placeholder }) => {
  const [input, setInput] = useState("");

  const add = (val) => {
    const v = String(val).trim();
    if (!v) return;
    const next = Array.from(new Set([...(values || []), v]));
    onChange(next);
    setInput("");
  };

  const remove = (idx) => {
    const next = (values || []).filter((_, i) => i !== idx);
    onChange(next);
  };

  const onKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-2.5">
        {(values || []).map((v, i) => (
          <span
            key={`${v}-${i}`}
            className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200/80 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold shadow-xs"
          >
            <span>{v}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100 rounded-full w-4 h-4 flex items-center justify-center transition-colors"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKey}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50/50 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 transition-all"
      />
      <div className="text-[11px] text-slate-400 mt-1">Press Enter or comma to add</div>
    </div>
  );
};

// Field wrapper
const Field = ({ label, help, children, required = false, className = "", error = "" }) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
      <span>
        {label}
        {required && <span className="text-rose-500 ml-1 font-black">*</span>}
      </span>
      {error && <span className="text-[11px] font-semibold text-rose-500 normal-case">{error}</span>}
    </label>
    <div>{children}</div>
    {help && !error && <p className="text-[11px] text-slate-500 leading-normal">{help}</p>}
  </div>
);

const MyProfile = () => {
  const [draft, setDraft] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [collapsed, setCollapsed] = useState({
    header: false,
    personal: false,
    links: false,
    skills: false,
    career: false,
    experience: false,
    education: false,
    projects: false,
    achievements: false,
    activities: false,
  });

  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [resumeFile, setResumeFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  const [educationFiles, setEducationFiles] = useState({});
  const [uploadingEduId, setUploadingEduId] = useState(null);
  const [activityFiles, setActivityFiles] = useState({});

  const [skillSearch, setSkillSearch] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' | 'error' | 'info'
  const [saved, setSaved] = useState(true);
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeSection, setActiveSection] = useState("all");

  const photoInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  // Safe external update listener: ignores self-triggered updates to protect in-progress user input!
  useEffect(() => {
    const onProfileUpdated = (ev) => {
      if (ev?.detail?.__source === "MyProfile") return;
      // If external components updated avatar/info and user has no unsaved changes, refresh
      if (saved) {
        loadProfile(false);
      }
    };
    window.addEventListener("profileUpdated", onProfileUpdated);
    return () => window.removeEventListener("profileUpdated", onProfileUpdated);
  }, [saved]);

  const showToast = (msg, type = "success") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 4500);
  };

  const loadProfile = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await getProfile();
      const raw = res.data?.user || res.data || {};
      const data = { ...emptyProfile, ...raw };

      data.career = {
        currentStatus: raw.currentStatus || data.career?.currentStatus || "Studying",
        preferredRole: raw.preferredRole || data.career?.preferredRole || "",
        employmentType: raw.employmentType || data.career?.employmentType || "Full Time",
        experienceLevel: raw.experienceLevel ?? data.career?.experienceLevel ?? 0,
        expectedSalary: raw.expectedSalary ?? data.career?.expectedSalary ?? null,
        resumeFilePath: raw.resumeFilePath || raw.resume || data.career?.resumeFilePath || "",
        skills: raw.skills || data.career?.skills || [],
      };

      data.skills = raw.skills || data.career?.skills || [];

      const ensureIds = (arr) => {
        if (!Array.isArray(arr)) return [];
        return arr.map((it, i) => ({
          id: it.id || it._id || `srv-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          ...it,
        }));
      };

      data.experience = ensureIds(raw.experience || data.experience);
      data.education = ensureIds(raw.education || data.education);
      data.projects = ensureIds(raw.projects || data.projects);
      data.achievements = ensureIds(raw.achievements || data.achievements);
      data.activities = ensureIds(raw.activities || data.activities);

      setDraft(data);
      if (data.username) {
        setUsernameSaved(true);
      }
      setSaved(true);
    } catch (err) {
      console.error("Failed to load profile", err);
      showToast(err?.response?.status === 401 ? "Unauthorized — please log in" : "Failed to load profile", "error");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const toggleSection = (sec) => {
    setCollapsed((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const setField = (path, value) => {
    const parts = path.split(".");
    setDraft((prev) => {
      const copy = { ...prev };
      let cur = copy;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        if (Array.isArray(cur[p])) {
          cur[p] = [...cur[p]];
        } else if (cur[p] && typeof cur[p] === "object") {
          cur[p] = { ...cur[p] };
        } else {
          cur[p] = {};
        }
        cur = cur[p];
      }
      cur[parts[parts.length - 1]] = value;
      return copy;
    });
    setSaved(false);
    setSubmitted(false);
  };

  // Profile image selection & upload
  const handleProfileImageChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setProfileImageFile(f);
    setProfileImagePreview(URL.createObjectURL(f));
  };

  const uploadImage = async () => {
    if (!profileImageFile) {
      showToast("Please choose an image file first", "error");
      return;
    }
    setUploadingPhoto(true);
    try {
      const res = await uploadProfilePhoto(profileImageFile);
      const newPath = res?.data?.profileImage || (res?.data?.user && res.data.user.profileImage);
      if (newPath) {
        const busted = resolveAsset(newPath) + `?t=${Date.now()}`;
        // Update ONLY profileImage in draft, completely preserving all unsaved form fields
        setDraft((prev) => ({ ...prev, profileImage: busted }));
      }
      setProfileImageFile(null);
      setProfileImagePreview("");
      showToast("Profile photo uploaded successfully!", "success");

      // Notify header and layout components
      try {
        window.dispatchEvent(
          new CustomEvent("profileUpdated", {
            detail: { __source: "MyProfile", profileImage: newPath || "", __updatedAt: Date.now() },
          })
        );
      } catch (e) { }
    } catch (err) {
      console.error("Photo upload error", err);
      showToast(err?.response?.data?.error || "Image upload failed", "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Resume upload: handles skill extraction, updates resume and skills WITHOUT resetting form fields
  const uploadResumeFileHandler = async (selectedFile) => {
    const targetFile = selectedFile || resumeFile;
    if (!targetFile) {
      showToast("Please select a resume file (PDF or DOC) first", "error");
      return;
    }
    setUploadingResume(true);
    try {
      const res = await uploadResume(targetFile);
      const newResume = res?.data?.resumeFilePath || res?.data?.user?.resumeFilePath;
      const newSkills = res?.data?.skills || (res?.data?.user && res.data.user.skills) || [];

      // Update resume and verified skills directly in draft WITHOUT wiping other in-progress user inputs!
      setDraft((prev) => ({
        ...prev,
        resumeFilePath: newResume || prev.resumeFilePath,
        skills: newSkills.length > 0 ? newSkills : prev.skills,
        career: {
          ...(prev.career || {}),
          resumeFilePath: newResume || prev.career?.resumeFilePath,
          skills: newSkills.length > 0 ? newSkills : prev.career?.skills || [],
        },
      }));

      setResumeFile(null);
      if (resumeInputRef.current) resumeInputRef.current.value = "";

      showToast(
        `Resume parsed successfully! ${newSkills.length} skills authenticated & synchronized.`,
        "success"
      );

      try {
        window.dispatchEvent(
          new CustomEvent("profileUpdated", {
            detail: {
              __source: "MyProfile",
              resumeFilePath: newResume,
              skills: newSkills,
              __updatedAt: Date.now(),
            },
          })
        );
      } catch (e) { }
    } catch (err) {
      console.error("Resume upload error", err);
      showToast(err?.response?.data?.error || "Resume processing failed. Please check the file.", "error");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleDownloadResume = async () => {
    try {
      const res = await downloadCareerResume();
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const resumeName = draft?.career?.resumeFilePath || draft?.resumeFilePath || "resume.pdf";
      link.download = resumeName.split("/").pop() || "resume.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      showToast("Could not download resume", "error");
    }
  };

  // Education file selection & upload (does NOT wipe form fields)
  const handleEducationFile = (educationId, file) => {
    setEducationFiles((prev) => ({ ...prev, [educationId]: file }));
  };

  const handleUploadEducationResult = async (educationId) => {
    const file = educationFiles[educationId];
    if (!file) {
      showToast("Please choose a certificate / transcript file first", "error");
      return;
    }
    setUploadingEduId(educationId);
    try {
      const idx = (draft.education || []).findIndex(
        (e) => e.id === educationId || String(e._id) === String(educationId)
      );
      const res = await uploadEducationResult(file, idx >= 0 ? idx : undefined);
      const fp =
        res?.data?.resultFilePath || res?.data?.filePath || res?.data?.path || res?.data?.url;
      const attIdx = res?.data?.attachedIndex;

      if (fp) {
        const busted = resolveAsset(fp) + `?t=${Date.now()}`;
        // Update ONLY this education entry's resultFilePath, leaving all other user inputs intact!
        setDraft((prev) => ({
          ...prev,
          education: (prev.education || []).map((e, i) =>
            e.id === educationId || i === attIdx ? { ...e, resultFilePath: busted } : e
          ),
        }));
      }

      setEducationFiles((prev) => {
        const next = { ...prev };
        delete next[educationId];
        return next;
      });

      showToast("Academic document uploaded successfully!", "success");

      try {
        window.dispatchEvent(
          new CustomEvent("profileUpdated", {
            detail: { __source: "MyProfile", __updatedAt: Date.now() },
          })
        );
      } catch (e) { }
    } catch (err) {
      console.error("Education upload error", err);
      showToast(err?.response?.data?.error || "Academic document upload failed", "error");
    } finally {
      setUploadingEduId(null);
    }
  };

  // Experience handlers
  const addExperience = () => {
    const id = `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setDraft((prev) => ({
      ...prev,
      experience: [
        ...(prev.experience || []),
        {
          id,
          company: "",
          role: "",
          startDate: "",
          endDate: "",
          currentlyWorking: false,
          description: "",
          technologies: [],
        },
      ],
    }));
    setSaved(false);
  };

  const removeExperience = (id) => {
    setDraft((prev) => ({
      ...prev,
      experience: (prev.experience || []).filter((e) => e.id !== id),
    }));
    setSaved(false);
  };

  const setExperienceField = (id, key, val) => {
    setDraft((prev) => ({
      ...prev,
      experience: (prev.experience || []).map((e) => (e.id === id ? { ...e, [key]: val } : e)),
    }));
    setSaved(false);
  };

  // Education handlers
  const addEducation = () => {
    const id = `edu-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setDraft((prev) => ({
      ...prev,
      education: [
        ...(prev.education || []),
        {
          id,
          level: "Bachelor",
          institution: "",
          boardUniversity: "",
          startYear: "",
          endYear: "",
          completed: false,
          totalSemesters: 8,
          currentSemester: 0,
          cgpa: "",
          semesterWise: [],
        },
      ],
    }));
    setSaved(false);
  };

  const removeEducation = (id) => {
    setDraft((prev) => ({
      ...prev,
      education: (prev.education || []).filter((e) => e.id !== id),
    }));
    setSaved(false);
  };

  const setEducationField = (id, key, val) => {
    setDraft((prev) => ({
      ...prev,
      education: (prev.education || []).map((e) => (e.id === id ? { ...e, [key]: val } : e)),
    }));
    setSaved(false);
  };

  const setEducationSemesters = (id, total) => {
    setDraft((prev) => {
      const education = (prev.education || []).map((e) => {
        if (e.id !== id) return e;
        const t = parseInt(total) || 0;
        const prevSem = Array.isArray(e.semesterWise) ? e.semesterWise : [];
        return {
          ...e,
          totalSemesters: t,
          semesterWise: Array.from({ length: t }).map((_, idx) => prevSem[idx] ?? ""),
        };
      });
      return { ...prev, education };
    });
    setSaved(false);
  };

  const setEducationSGPA = (id, semIndex, value) => {
    setDraft((prev) => ({
      ...prev,
      education: (prev.education || []).map((e) =>
        e.id === id
          ? {
            ...e,
            semesterWise: (Array.isArray(e.semesterWise) ? e.semesterWise.slice() : []).map((s, idx) =>
              idx === semIndex ? value : s
            ),
          }
          : e
      ),
    }));
    setSaved(false);
  };

  // Projects & Achievements
  const addItem = (key, item) => {
    const id = `${key}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setDraft((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), { id, ...item }],
    }));
    setSaved(false);
  };

  const removeItem = (key, id) => {
    setDraft((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((it) => it.id !== id),
    }));
    setSaved(false);
  };

  const setItemField = (key, id, field, val) => {
    setDraft((prev) => ({
      ...prev,
      [key]: (prev[key] || []).map((it) => (it.id === id ? { ...it, [field]: val } : it)),
    }));
    setSaved(false);
  };

  // Activity proof selection
  const handleActivityFile = (actId, file) => {
    setActivityFiles((prev) => {
      const next = { ...prev };
      if (!file) delete next[actId];
      else next[actId] = file;
      return next;
    });
  };

  // Validation
  const validateAll = () => {
    const errs = {};
    if (!draft.fullName || String(draft.fullName).trim() === "") {
      errs["fullName"] = "Full name is required";
    }
    if (!draft.gender || String(draft.gender).trim() === "") {
      errs["gender"] = "Please select your gender";
    }
    if (!draft.career?.preferredRole || String(draft.career.preferredRole).trim() === "") {
      errs["career.preferredRole"] = "Preferred role is required";
    }
    (draft.experience || []).forEach((e) => {
      if (!e.company || String(e.company).trim() === "") {
        errs[`experience.${e.id}.company`] = "Company name is required";
      }
      if (!e.role || String(e.role).trim() === "") {
        errs[`experience.${e.id}.role`] = "Designation/Role is required";
      }
    });
    (draft.education || []).forEach((ed) => {
      if (!ed.institution || String(ed.institution).trim() === "") {
        errs[`education.${ed.id}.institution`] = "Institution name is required";
      }
    });
    return errs;
  };

  const focusField = (key) => {
    if (!key) return;
    try {
      const el = document.querySelector(`[data-err="${key}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        if (typeof el.focus === "function") el.focus();
      }
    } catch (e) { }
  };

  // Save All
  const saveAll = async () => {
    setErrors({});
    const validationErrors = validateAll();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast("Please review and fix highlighted errors before saving", "error");
      const firstKey = Object.keys(validationErrors)[0];
      setTimeout(() => focusField(firstKey), 250);
      return;
    }

    try {
      const payloadToSend = { ...draft, ...(draft.career || {}) };
      const res = await patchProfile(payloadToSend);
      const payload = res?.data?.user || res?.data;
      if (payload) {
        setDraft((prev) => ({
          ...prev,
          ...payload,
          career: {
            ...(prev.career || {}),
            ...(payload.career || {}),
            preferredRole: payload.preferredRole || prev.career?.preferredRole,
            expectedSalary: payload.expectedSalary ?? prev.career?.expectedSalary,
            experienceLevel: payload.experienceLevel ?? prev.career?.experienceLevel,
            currentStatus: payload.currentStatus || prev.career?.currentStatus,
            employmentType: payload.employmentType || prev.career?.employmentType,
          },
        }));
      }
      setSaved(true);
      showToast("All changes saved successfully!", "success");

      try {
        window.dispatchEvent(
          new CustomEvent("profileUpdated", {
            detail: { __source: "MyProfile", ...(payload || {}), __updatedAt: Date.now() },
          })
        );
      } catch (e) { }
    } catch (err) {
      console.error("Save all error", err);
      showToast(err?.response?.data?.error || "Failed to save profile", "error");
    }
  };

  // Submit Profile
  const submitProfile = async () => {
    setErrors({});
    const validationErrors = validateAll();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast("Please resolve all validation errors before submitting", "error");
      const firstKey = Object.keys(validationErrors)[0];
      setTimeout(() => focusField(firstKey), 250);
      return;
    }

    try {
      const payloadToSend = { ...draft, ...(draft.career || {}) };
      const res = await patchProfile(payloadToSend);
      setSaved(true);
      setSubmitted(true);
      showToast("Profile submitted successfully to recruiters!", "success");

      try {
        window.dispatchEvent(
          new CustomEvent("profileUpdated", {
            detail: { __source: "MyProfile", ...(res?.data?.user || {}), __updatedAt: Date.now() },
          })
        );
      } catch (e) { }
    } catch (err) {
      console.error("Submit error", err);
      showToast(err?.response?.data?.error || "Profile submission failed", "error");
    }
  };

  // Initial username setup
  const saveUsername = async () => {
    if (!draft.username || String(draft.username).trim() === "") {
      showToast("Please enter a username to continue", "error");
      return;
    }
    try {
      await patchProfile({ username: draft.username });
      setUsernameSaved(true);
      setSaved(true);
      showToast("Username configured successfully!", "success");
    } catch (err) {
      console.error("Username save error", err);
      showToast(err?.response?.data?.error || "Username save failed", "error");
    }
  };

  const currentSkills = draft.skills?.length ? draft.skills : draft.career?.skills || [];
  const filteredSkills = currentSkills.filter((s) =>
    s.toLowerCase().includes(skillSearch.toLowerCase())
  );

  // Profile completion calculation
  const calcCompleteness = () => {
    let score = 0;
    if (draft.fullName) score += 15;
    if (draft.headline) score += 10;
    if (draft.bio) score += 10;
    if (draft.profileImage) score += 10;
    if (currentSkills.length > 0) score += 20;
    if (draft.career?.resumeFilePath || draft.resumeFilePath) score += 15;
    if (draft.experience?.length > 0) score += 10;
    if (draft.education?.length > 0) score += 10;
    return Math.min(score, 100);
  };
  const completeness = calcCompleteness();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-600 uppercase tracking-wider">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Initial username setup gate
  if (!usernameSaved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/60 via-slate-50 to-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-100 mb-6">
            <FiUser size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Choose your handle</h1>
          <p className="text-xs text-slate-500 mt-2 mb-6">
            Your unique username will be used for your public profile, portfolio link, and recruiter identification.
          </p>
          <div className="space-y-4 text-left">
            <Field label="Unique Username" help="Once set, your username will be permanently locked.">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">@</span>
                <input
                  type="text"
                  value={draft.username || ""}
                  onChange={(e) => setDraft((p) => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") }))}
                  placeholder="e.g. alexkumar"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100/70"
                />
              </div>
            </Field>
            <button
              type="button"
              onClick={saveUsername}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              Continue to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-24 font-sans text-slate-900">
      {/* Toast Notification Banner */}
      {message && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-bold backdrop-blur-md ${messageType === "success"
              ? "bg-emerald-50/95 border-emerald-200 text-emerald-800"
              : messageType === "error"
                ? "bg-rose-50/95 border-rose-200 text-rose-800"
                : "bg-blue-50/95 border-blue-200 text-blue-800"
              }`}
          >
            {messageType === "success" ? <FiCheckCircle className="text-lg flex-shrink-0" /> : <FiAlertCircle className="text-lg flex-shrink-0" />}
            <span>{message}</span>
            <button
              type="button"
              onClick={() => setMessage("")}
              className="text-slate-400 hover:text-slate-600 ml-2"
            >
              <FiX />
            </button>
          </div>
        </div>
      )}

      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <FiUser size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none flex items-center gap-2">
                My Profile
                {saved ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <FiCheck size={12} /> Saved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <FiClock size={12} /> Unsaved changes
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Manage your credentials, social presence, and resume-verified skills
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={saveAll}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-100 transition-all hover:shadow-lg active:scale-95 text-xs sm:text-sm"
            >
              <FiSave size={16} />
              Save All
            </button>
            <button
              type="button"
              onClick={submitProfile}
              disabled={!saved || submitted}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold border transition-all text-xs sm:text-sm ${submitted
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default"
                : !saved
                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs hover:border-slate-400"
                }`}
            >
              <FiSend size={16} />
              {submitted ? "Submitted" : "Submit Profile"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content Area (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* HERO PROFILE COVER & IDENTITY CARD */}
            <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              {/* Cover Gradient Banner */}
              <div className="h-36 sm:h-44 bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="absolute bottom-3 right-4 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-sm ${draft.openToWork
                      ? "bg-emerald-500/90 text-white"
                      : "bg-slate-900/60 text-slate-200"
                      }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${draft.openToWork ? "bg-white animate-pulse" : "bg-slate-400"}`}></span>
                    {draft.openToWork ? "Open to Work" : "Not Looking"}
                  </span>
                </div>
              </div>

              {/* Avatar & Hero Details */}
              <div className="px-6 pb-6 pt-0 relative">
                <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-6">
                  {/* Avatar with Camera Trigger */}
                  <div className="relative group">
                    <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white ring-2 ring-indigo-100 flex-shrink-0">
                      <img
                        src={profileImagePreview || resolveAsset(draft.profileImage) || defaultAvatar}
                        alt="Profile avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <label
                      htmlFor="avatar-file-input"
                      className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-110 active:scale-95 border-2 border-white"
                      title="Upload new profile photo"
                    >
                      <FiCamera size={18} />
                    </label>
                    <input
                      id="avatar-file-input"
                      type="file"
                      accept="image/*"
                      ref={photoInputRef}
                      onChange={handleProfileImageChange}
                      className="hidden"
                    />
                  </div>

                  {/* Photo Actions if Selected */}
                  {profileImageFile && (
                    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-2xl animate-in fade-in">
                      <span className="text-xs font-bold text-indigo-800 truncate max-w-[150px]">
                        {profileImageFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={uploadImage}
                        disabled={uploadingPhoto}
                        className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-indigo-700 transition"
                      >
                        {uploadingPhoto ? "Uploading..." : "Save Photo"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileImageFile(null);
                          setProfileImagePreview("");
                        }}
                        className="text-slate-400 hover:text-slate-600 text-xs px-2"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Right Header Badges */}
                  <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      <FiLock className="text-slate-500" size={12} />
                      @{draft.username || "handle"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <FiAward className="text-blue-500" size={13} />
                      {draft.category || "Student"}
                    </span>
                  </div>
                </div>

                {/* Primary Identity Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <Field label="Full Name" required error={errors["fullName"]}>
                    <input
                      type="text"
                      data-err="fullName"
                      value={draft.fullName || ""}
                      onChange={(e) => setField("fullName", e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none transition"
                    />
                  </Field>

                  <Field label="Professional Headline" help="e.g. Full-Stack Developer • React, Node.js">
                    <input
                      type="text"
                      data-err="headline"
                      value={draft.headline || ""}
                      onChange={(e) => setField("headline", e.target.value)}
                      placeholder="e.g. AI Enthusiast & Software Engineer"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none transition"
                    />
                  </Field>

                  <Field label="Primary Location" help="City, State, Country">
                    <div className="relative">
                      <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        data-err="primaryLocation"
                        value={draft.primaryLocation || ""}
                        onChange={(e) => setField("primaryLocation", e.target.value)}
                        placeholder="e.g. Bangalore, India"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none transition"
                      />
                    </div>
                  </Field>

                  <Field label="Open to Job Opportunities" help="Signal to recruiters that you are actively seeking roles">
                    <select
                      value={draft.openToWork ? "yes" : "no"}
                      onChange={(e) => setField("openToWork", e.target.value === "yes")}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none transition"
                    >
                      <option value="yes">🟢 Yes — Actively Looking</option>
                      <option value="no">⚪ No — Not Looking Right Now</option>
                    </select>
                  </Field>

                  <div className="sm:col-span-2">
                    <Field label="Summary Bio" help="Concise summary of your background, passions, and aspirations.">
                      <textarea
                        data-err="bio"
                        rows={3}
                        maxLength={600}
                        value={draft.bio || ""}
                        onChange={(e) => setField("bio", e.target.value)}
                        placeholder="Write a brief professional overview about yourself..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none transition leading-relaxed"
                      />
                      <div className="flex justify-end text-[11px] text-slate-400 mt-1">
                        {(draft.bio || "").length} / 600 characters
                      </div>
                    </Field>
                  </div>
                </div>
              </div>
            </section>

            {/* DEDICATED VERIFIED SKILLS & TECHNICAL COMPETENCIES (SPACIOUS & RESUME-VERIFIED) */}
            <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    <FiCpu size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      Verified Technical Skills
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200/80">
                        <FiShield size={12} /> {currentSkills.length} Verified
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Extracted and verified by SkillLens AI directly from your uploaded resume
                    </p>
                  </div>
                </div>

                {/* Resume Status Pill */}
                <div className="flex items-center gap-2">
                  {(draft.career?.resumeFilePath || draft.resumeFilePath) ? (
                    <button
                      type="button"
                      onClick={handleDownloadResume}
                      className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      <FiDownload size={14} className="text-indigo-600" />
                      Download Resume
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Requirement Notice / Policy Callout */}
              <div className="bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-slate-50 border border-indigo-200/70 rounded-2xl p-4 mb-6 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                  <FiLock size={15} />
                </div>
                <div className="text-xs text-slate-700 leading-relaxed">
                  <p className="font-bold text-indigo-950 mb-0.5">Credential Verification Rule:</p>
                  <p>
                    To ensure trust with hiring managers, skills cannot be added or deleted manually via free-form typing.
                    If you want to add or update your skills, <strong>please upload your updated resume below</strong>.
                    SkillLens AI parses your document and syncs your verified skill set automatically.
                  </p>
                </div>
              </div>

              {/* Skill Search Filter if many skills */}
              {currentSkills.length > 6 && (
                <div className="relative mb-5">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    placeholder={`Search through your ${currentSkills.length} verified skills...`}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                  />
                  {skillSearch && (
                    <button
                      type="button"
                      onClick={() => setSkillSearch("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}

              {/* Verified Skills Display Cloud */}
              {currentSkills.length > 0 ? (
                <div className="bg-slate-50/60 rounded-2xl border border-slate-200/60 p-5 mb-6 min-h-[140px]">
                  <div className="flex flex-wrap gap-2.5">
                    {filteredSkills.map((skill, idx) => (
                      <span
                        key={`${skill}-${idx}`}
                        className="inline-flex items-center gap-2 bg-white hover:bg-indigo-50/50 border border-slate-200/90 hover:border-indigo-300 text-slate-800 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-105"
                      >
                        <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500"></span>
                        <span>{skill}</span>
                        <FiCheck className="text-emerald-500 text-[11px]" />
                      </span>
                    ))}
                    {filteredSkills.length === 0 && (
                      <p className="text-xs text-slate-400 italic py-4">No skills match "{skillSearch}"</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 mb-6">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mx-auto mb-3">
                    <FiFileText size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No verified skills yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Upload your latest resume (PDF or DOC) below to extract and verify your technical skills.
                  </p>
                </div>
              )}

              {/* Integrated Resume Upload Box */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-xs flex-shrink-0">
                      <FiUploadCloud size={20} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Upload Resume to Update Skills
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {resumeFile ? (
                          <span className="text-indigo-600 font-semibold">{resumeFile.name} (Ready to upload)</span>
                        ) : (draft.career?.resumeFilePath || draft.resumeFilePath) ? (
                          <span>Current: <strong className="text-slate-700">{(draft.career?.resumeFilePath || draft.resumeFilePath).split("/").pop()}</strong></span>
                        ) : (
                          "Supported formats: PDF, DOC, DOCX (Max 10MB)"
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label
                      htmlFor="skill-resume-file"
                      className="flex-1 sm:flex-none text-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition shadow-xs"
                    >
                      {resumeFile ? "Change File" : "Choose Resume"}
                      <input
                        id="skill-resume-file"
                        type="file"
                        accept="application/pdf,.doc,.docx"
                        ref={resumeInputRef}
                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>

                    {resumeFile && (
                      <button
                        type="button"
                        onClick={() => uploadResumeFileHandler(resumeFile)}
                        disabled={uploadingResume}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-100 transition"
                      >
                        {uploadingResume ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Parsing Resume...</span>
                          </>
                        ) : (
                          <>
                            <HiOutlineSparkles size={14} />
                            <span>Extract & Sync Skills</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* SOCIAL & PUBLIC LINKS (WITH BASE LINK TEXT IN INPUT FIELDS) */}
            <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <FiGlobe size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Social & Public Links</h2>
                    <p className="text-xs text-slate-500">
                      The base domain is provided so you only type your username or path
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSection("links")}
                  className="text-slate-400 hover:text-slate-600 p-2"
                >
                  {collapsed.links ? <FiChevronDown size={18} /> : <FiChevronUp size={18} />}
                </button>
              </div>

              {!collapsed.links && (
                <div className="space-y-4">
                  <Field label="GitHub Profile" help="Base prefix provided. Just type your GitHub username (e.g. octocat)">
                    <SocialLinkInput
                      icon={FaGithub}
                      prefix="https://github.com/"
                      value={draft.socialLinks?.github || ""}
                      onChange={(val) => setField("socialLinks.github", val)}
                      placeholder="username"
                    />
                  </Field>

                  <Field label="LinkedIn Profile" help="Base prefix provided. Just type your LinkedIn handle (e.g. priya-sharma)">
                    <SocialLinkInput
                      icon={FaLinkedin}
                      prefix="https://linkedin.com/in/"
                      value={draft.socialLinks?.linkedin || ""}
                      onChange={(val) => setField("socialLinks.linkedin", val)}
                      placeholder="profile-handle"
                    />
                  </Field>

                  <Field label="Twitter / X" help="Base prefix provided. Just type your Twitter or X handle">
                    <SocialLinkInput
                      icon={FaTwitter}
                      prefix="https://x.com/"
                      value={draft.socialLinks?.twitter || ""}
                      onChange={(val) => setField("socialLinks.twitter", val)}
                      placeholder="handle"
                    />
                  </Field>

                  <Field label="Portfolio / Personal Site" help="Base prefix provided. Enter your domain or portfolio URL">
                    <SocialLinkInput
                      icon={FaGlobeIcon}
                      prefix="https://"
                      value={draft.socialLinks?.portfolio || ""}
                      onChange={(val) => setField("socialLinks.portfolio", val)}
                      placeholder="myportfolio.dev"
                    />
                  </Field>

                  <Field label="Other Portfolio / LeetCode / Behance" help="Any other coding profile or showcase">
                    <SocialLinkInput
                      icon={FiExternalLink}
                      prefix="https://"
                      value={draft.socialLinks?.other || ""}
                      onChange={(val) => setField("socialLinks.other", val)}
                      placeholder="leetcode.com/u/yourhandle"
                    />
                  </Field>
                </div>
              )}
            </section>

            {/* CAREER PREFERENCES & TARGETS */}
            <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <FiBriefcase size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Career & Job Preferences</h2>
                    <p className="text-xs text-slate-500">Target roles, compensation expectations, and work preferences</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSection("career")}
                  className="text-slate-400 hover:text-slate-600 p-2"
                >
                  {collapsed.career ? <FiChevronDown size={18} /> : <FiChevronUp size={18} />}
                </button>
              </div>

              {!collapsed.career && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="Target / Preferred Role" required error={errors["career.preferredRole"]}>
                    <input
                      type="text"
                      data-err="career.preferredRole"
                      value={draft.career?.preferredRole || ""}
                      onChange={(e) => setField("career.preferredRole", e.target.value)}
                      placeholder="e.g. Frontend Engineer"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none transition"
                    />
                  </Field>

                  <Field label="Current Status" help="Studying, Working, Fresher">
                    <select
                      value={draft.career?.currentStatus || "Studying"}
                      onChange={(e) => setField("career.currentStatus", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none transition"
                    >
                      <option value="Studying">Studying</option>
                      <option value="Working">Working</option>
                      <option value="Fresher">Fresher / Graduate</option>
                    </select>
                  </Field>

                  <Field label="Employment Type">
                    <select
                      value={draft.career?.employmentType || "Full Time"}
                      onChange={(e) => setField("career.employmentType", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none transition"
                    >
                      <option value="Full Time">Full Time</option>
                      <option value="Part Time">Part Time</option>
                      <option value="Internship">Internship</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </Field>

                  <Field label="Years of Experience" help="Total professional experience">
                    <input
                      type="number"
                      min={0}
                      value={draft.career?.experienceLevel ?? 0}
                      onChange={(e) => setField("career.experienceLevel", Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none transition"
                    />
                  </Field>

                  <Field label="Expected Salary / LPA" help="In INR LPA or preferred currency">
                    <input
                      type="number"
                      value={draft.career?.expectedSalary ?? ""}
                      onChange={(e) => setField("career.expectedSalary", e.target.value)}
                      placeholder="e.g. 12"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none transition"
                    />
                  </Field>
                </div>
              )}
            </section>

            {/* PERSONAL INFORMATION & DEMOGRAPHICS */}
            <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
                    <FiUser size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Personal Information</h2>
                    <p className="text-xs text-slate-500">Contact and demographic information</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSection("personal")}
                  className="text-slate-400 hover:text-slate-600 p-2"
                >
                  {collapsed.personal ? <FiChevronDown size={18} /> : <FiChevronUp size={18} />}
                </button>
              </div>

              {!collapsed.personal && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="First Name">
                    <input
                      type="text"
                      value={draft.firstName || ""}
                      onChange={(e) => setField("firstName", e.target.value)}
                      placeholder="First Name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none transition"
                    />
                  </Field>

                  <Field label="Last Name">
                    <input
                      type="text"
                      value={draft.lastName || ""}
                      onChange={(e) => setField("lastName", e.target.value)}
                      placeholder="Last Name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none transition"
                    />
                  </Field>

                  <Field label="Mobile Number">
                    <div className="relative">
                      <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={draft.mobileNumber || ""}
                        onChange={(e) => setField("mobileNumber", e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none transition"
                      />
                    </div>
                  </Field>

                  <Field label="Date of Birth">
                    <div className="relative">
                      <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="date"
                        value={draft.birthDate ? draft.birthDate.substring(0, 10) : ""}
                        onChange={(e) => setField("birthDate", e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none transition"
                      />
                    </div>
                  </Field>

                  <Field label="Gender" required error={errors["gender"]}>
                    <select
                      data-err="gender"
                      value={draft.gender || ""}
                      onChange={(e) => setField("gender", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none transition"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other / Non-binary</option>
                    </select>
                  </Field>

                  <Field label="Nationality">
                    <input
                      type="text"
                      value={draft.nationality || ""}
                      onChange={(e) => setField("nationality", e.target.value)}
                      placeholder="e.g. Indian"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none transition"
                    />
                  </Field>

                  <div className="sm:col-span-2 md:col-span-3">
                    <Field label="Languages Known" help="Add languages you speak fluently">
                      <TagInput
                        values={draft.languages || []}
                        onChange={(vals) => setField("languages", vals)}
                        placeholder="Add a language and press Enter (e.g. English, Hindi)"
                      />
                    </Field>
                  </div>
                </div>
              )}
            </section>

            {/* ADDRESS INFORMATION */}
            <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <FiMapPin size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Residential Address</h2>
                    <p className="text-xs text-slate-500">Location and mailing details</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="Flat / Building No.">
                  <input
                    type="text"
                    value={draft.address?.flat || ""}
                    onChange={(e) => setField("address.flat", e.target.value)}
                    placeholder="e.g. Flat 402"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none transition"
                  />
                </Field>
                <Field label="Street / Locality">
                  <input
                    type="text"
                    value={draft.address?.street || ""}
                    onChange={(e) => setField("address.street", e.target.value)}
                    placeholder="e.g. Main Street"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none transition"
                  />
                </Field>
                <Field label="City">
                  <input
                    type="text"
                    value={draft.address?.city || ""}
                    onChange={(e) => setField("address.city", e.target.value)}
                    placeholder="e.g. Ahmedabad"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none transition"
                  />
                </Field>
                <Field label="State">
                  <input
                    type="text"
                    value={draft.address?.state || ""}
                    onChange={(e) => setField("address.state", e.target.value)}
                    placeholder="e.g. Gujarat"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none transition"
                  />
                </Field>
                <Field label="Postal / PIN Code">
                  <input
                    type="text"
                    value={draft.address?.postalCode || ""}
                    onChange={(e) => setField("address.postalCode", e.target.value)}
                    placeholder="e.g. 380015"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none transition"
                  />
                </Field>
                <Field label="Country">
                  <input
                    type="text"
                    value={draft.address?.country || ""}
                    onChange={(e) => setField("address.country", e.target.value)}
                    placeholder="e.g. India"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none transition"
                  />
                </Field>
              </div>
            </section>

            {/* WORK EXPERIENCE */}
            <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <FiBriefcase size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Work Experience</h2>
                    <p className="text-xs text-slate-500">Internships, full-time, and contract experience</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addExperience}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
                >
                  <FiPlus size={16} /> Add Position
                </button>
              </div>

              <div className="space-y-6">
                {(draft.experience || []).map((exp, idx) => (
                  <div
                    key={exp.id || idx}
                    className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 relative group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">
                        Role #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeExperience(exp.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                        title="Remove role"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <Field label="Company Name" required error={errors[`experience.${exp.id}.company`]}>
                        <input
                          type="text"
                          data-err={`experience.${exp.id}.company`}
                          value={exp.company || ""}
                          onChange={(e) => setExperienceField(exp.id, "company", e.target.value)}
                          placeholder="e.g. Google, TCS, Startup"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none"
                        />
                      </Field>

                      <Field label="Designation / Role" required error={errors[`experience.${exp.id}.role`]}>
                        <input
                          type="text"
                          data-err={`experience.${exp.id}.role`}
                          value={exp.role || ""}
                          onChange={(e) => setExperienceField(exp.id, "role", e.target.value)}
                          placeholder="e.g. Frontend Developer Intern"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none"
                        />
                      </Field>

                      <Field label="Start Date">
                        <input
                          type="date"
                          value={exp.startDate ? exp.startDate.substring(0, 10) : ""}
                          onChange={(e) => setExperienceField(exp.id, "startDate", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none"
                        />
                      </Field>

                      <Field label="End Date" help={exp.currentlyWorking ? "Ongoing" : "Leave blank if currently working"}>
                        <input
                          type="date"
                          disabled={exp.currentlyWorking}
                          value={exp.endDate ? exp.endDate.substring(0, 10) : ""}
                          onChange={(e) => setExperienceField(exp.id, "endDate", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none disabled:opacity-50"
                        />
                      </Field>
                    </div>

                    <div className="space-y-4">
                      <Field label="Job Description & Responsibilities">
                        <textarea
                          rows={3}
                          value={exp.description || ""}
                          onChange={(e) => setExperienceField(exp.id, "description", e.target.value)}
                          placeholder="Describe your impact, tools used, and key achievements..."
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none"
                        />
                      </Field>

                      <Field label="Technologies Used">
                        <TagInput
                          values={exp.technologies || []}
                          onChange={(vals) => setExperienceField(exp.id, "technologies", vals)}
                          placeholder="Add technology and press Enter"
                        />
                      </Field>
                    </div>
                  </div>
                ))}

                {(draft.experience || []).length === 0 && (
                  <p className="text-center py-8 text-xs text-slate-400 italic">
                    No work experience added yet. Click "+ Add Position" to list your internships or jobs.
                  </p>
                )}
              </div>
            </section>

            {/* EDUCATION & ACADEMICS (WITH RESILIENT DOCUMENT UPLOADS) */}
            <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                    <FiBookOpen size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Education & Academics</h2>
                    <p className="text-xs text-slate-500">Degree, institutions, semesters, and transcripts</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addEducation}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
                >
                  <FiPlus size={16} /> Add Education
                </button>
              </div>

              <div className="space-y-6">
                {(draft.education || []).map((edu, idx) => (
                  <div
                    key={edu.id || idx}
                    className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 relative"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-black uppercase text-amber-600 tracking-wider">
                        Education #{idx + 1} ({edu.level || "Degree"})
                      </span>
                      <button
                        type="button"
                        onClick={() => removeEducation(edu.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                        title="Remove education"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <Field label="Degree / Level">
                        <select
                          value={edu.level || ""}
                          onChange={(e) => setEducationField(edu.id, "level", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 focus:border-indigo-500 outline-none"
                        >
                          <option value="Bachelor">Bachelor's Degree</option>
                          <option value="Master">Master's Degree</option>
                          <option value="Diploma">Diploma</option>
                          <option value="HSC">HSC (12th)</option>
                          <option value="SSC">SSC (10th)</option>
                          <option value="PhD">Ph.D.</option>
                        </select>
                      </Field>

                      <Field label="Institution / College" required error={errors[`education.${edu.id}.institution`]}>
                        <input
                          type="text"
                          data-err={`education.${edu.id}.institution`}
                          value={edu.institution || ""}
                          onChange={(e) => setEducationField(edu.id, "institution", e.target.value)}
                          placeholder="e.g. Stanford / IIT / University"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 focus:border-indigo-500 outline-none"
                        />
                      </Field>

                      <Field label="Board / University">
                        <input
                          type="text"
                          value={edu.boardUniversity || ""}
                          onChange={(e) => setEducationField(edu.id, "boardUniversity", e.target.value)}
                          placeholder="e.g. State Tech University"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 focus:border-indigo-500 outline-none"
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <Field label="Start Year">
                        <input
                          type="text"
                          value={edu.startYear || ""}
                          onChange={(e) => setEducationField(edu.id, "startYear", e.target.value)}
                          placeholder="2022"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 focus:border-indigo-500 outline-none"
                        />
                      </Field>
                      <Field label="End Year">
                        <input
                          type="text"
                          value={edu.endYear || ""}
                          onChange={(e) => setEducationField(edu.id, "endYear", e.target.value)}
                          placeholder="2026"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 focus:border-indigo-500 outline-none"
                        />
                      </Field>
                      <Field label="Total Semesters">
                        <input
                          type="number"
                          min={0}
                          max={12}
                          value={edu.totalSemesters || 0}
                          onChange={(e) => setEducationSemesters(edu.id, e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 focus:border-indigo-500 outline-none"
                        />
                      </Field>
                      <Field label="Current Semester">
                        <input
                          type="number"
                          min={0}
                          max={12}
                          value={edu.currentSemester || 0}
                          onChange={(e) => setEducationField(edu.id, "currentSemester", Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 focus:border-indigo-500 outline-none"
                        />
                      </Field>
                    </div>

                    <div className="mb-4">
                      <Field label="Overall CGPA / Percentage">
                        <input
                          type="text"
                          value={edu.cgpa || ""}
                          onChange={(e) => setEducationField(edu.id, "cgpa", e.target.value)}
                          placeholder="e.g. 8.75 or 85%"
                          className="w-full sm:w-1/2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 focus:border-indigo-500 outline-none"
                        />
                      </Field>
                    </div>

                    {/* Semester-wise SGPA grid */}
                    {Array.isArray(edu.semesterWise) && edu.semesterWise.length > 0 && (
                      <div className="mb-5 bg-white p-4 rounded-xl border border-slate-200/80">
                        <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                          Semester-wise SGPA
                        </h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                          {edu.semesterWise.map((sgpa, sIdx) => (
                            <div key={sIdx}>
                              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                                Sem {sIdx + 1}
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                max={10}
                                value={typeof sgpa === "object" ? sgpa.sgpa ?? "" : sgpa ?? ""}
                                onChange={(e) => setEducationSGPA(edu.id, sIdx, e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Document / Transcript Upload (Without refresh) */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <FiFileText className="text-amber-600" />
                          Academic Certificate / Transcript
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {edu.resultFilePath ? (
                            <span className="text-emerald-700 font-semibold">Document uploaded & attached</span>
                          ) : (
                            "Upload last-semester marksheet or degree certificate (PDF / Image)"
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <label
                          htmlFor={`edu-file-${edu.id}`}
                          className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition"
                        >
                          {educationFiles[edu.id] ? educationFiles[edu.id].name : "Choose File"}
                          <input
                            id={`edu-file-${edu.id}`}
                            type="file"
                            accept="application/pdf,image/*,.doc,.docx"
                            onChange={(e) => handleEducationFile(edu.id, e.target.files?.[0] || null)}
                            className="hidden"
                          />
                        </label>

                        {educationFiles[edu.id] && (
                          <button
                            type="button"
                            onClick={() => handleUploadEducationResult(edu.id)}
                            disabled={uploadingEduId === edu.id}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                          >
                            {uploadingEduId === edu.id ? "Uploading..." : "Upload Result"}
                          </button>
                        )}

                        {edu.resultFilePath && (
                          <a
                            href={resolveAsset(edu.resultFilePath)}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1"
                          >
                            <FiEye size={12} /> View File
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {(draft.education || []).length === 0 && (
                  <p className="text-center py-8 text-xs text-slate-400 italic">
                    No education records added yet. Click "+ Add Education" to add your college or schooling details.
                  </p>
                )}
              </div>
            </section>

            {/* PROJECTS, ACHIEVEMENTS & ACTIVITIES */}
            <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                    <FiAward size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Projects & Achievements</h2>
                    <p className="text-xs text-slate-500">Showcase your notable builds, awards, and extracurricular activities</p>
                  </div>
                </div>
              </div>

              {/* Projects Subsection */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <FiTag className="text-indigo-600" /> Featured Projects
                  </h3>
                  <button
                    type="button"
                    onClick={() => addItem("projects", { title: "", description: "", techStack: [] })}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    <FiPlus /> Add Project
                  </button>
                </div>
                <div className="space-y-4">
                  {(draft.projects || []).map((p) => (
                    <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <input
                          type="text"
                          value={p.title || ""}
                          onChange={(e) => setItemField("projects", p.id, "title", e.target.value)}
                          placeholder="Project Title (e.g. AI Resume Parser)"
                          className="w-full max-w-sm rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem("projects", p.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={p.description || ""}
                        onChange={(e) => setItemField("projects", p.id, "description", e.target.value)}
                        placeholder="Brief overview of problem solved, architecture, and results..."
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 leading-relaxed"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements Subsection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <FiAward className="text-amber-500" /> Honors & Achievements
                  </h3>
                  <button
                    type="button"
                    onClick={() => addItem("achievements", { title: "", organization: "", year: "", description: "" })}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    <FiPlus /> Add Honor
                  </button>
                </div>
                <div className="space-y-4">
                  {(draft.achievements || []).map((a) => (
                    <div key={a.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                      <input
                        type="text"
                        value={a.title || ""}
                        onChange={(e) => setItemField("achievements", a.id, "title", e.target.value)}
                        placeholder="Achievement (e.g. 1st Place at National Hackathon 2025)"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem("achievements", a.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Right Sticky Preview Sidebar (4 Cols) */}
          <aside className="lg:col-span-4 sticky top-24 space-y-6">
            {/* Live Profile Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-50 shadow-md ring-2 ring-indigo-200 mb-3 bg-white">
                  <img
                    src={profileImagePreview || resolveAsset(draft.profileImage) || defaultAvatar}
                    alt="Preview avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  {draft.fullName || "Your Full Name"}
                </h3>
                <p className="text-xs text-indigo-600 font-semibold mt-1">
                  {draft.headline || "Professional Headline"}
                </p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                  <FiMapPin size={11} /> {draft.primaryLocation || "Location"}
                </p>
              </div>

              {/* Profile Completeness Ring/Bar */}
              <div className="mt-5 pt-5 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                  <span className="text-slate-700">Profile Completeness</span>
                  <span className="text-indigo-600 font-mono">{completeness}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 transition-all duration-500 rounded-full"
                    style={{ width: `${completeness}%` }}
                  ></div>
                </div>
              </div>

              {/* Skills summary counter */}
              <div className="mt-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiShield className="text-indigo-600 text-sm" />
                  <span className="text-xs font-bold text-slate-800">Verified Skills</span>
                </div>
                <span className="text-xs font-extrabold text-indigo-700 font-mono bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                  {currentSkills.length}
                </span>
              </div>

              {/* Account Quick Specs */}
              <div className="mt-5 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400">Username:</span>
                  <span className="font-bold text-slate-800">@{draft.username || "-"}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[150px]">{draft.email || "-"}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
                <button
                  type="button"
                  onClick={saveAll}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-2.5 rounded-xl shadow-md shadow-indigo-100 transition-all text-xs active:scale-95"
                >
                  <FiSave size={15} /> Save All Changes
                </button>
                <button
                  type="button"
                  onClick={submitProfile}
                  disabled={!saved || submitted}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all ${submitted
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default"
                    : !saved
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
                    }`}
                >
                  <FiSend size={15} /> {submitted ? "Profile Submitted" : "Submit Profile"}
                </button>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-3xl border border-indigo-100 p-6 text-xs text-slate-600 space-y-3">
              <h4 className="font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 text-indigo-700">
                <HiOutlineSparkles /> Profile Insights
              </h4>
              <p className="leading-relaxed">
                Profiles with 10+ verified skills and updated contact links receive <strong>4.2x more interview invitations</strong> from top employers on SkillLens AI.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default MyProfile;