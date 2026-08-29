import React, { useEffect, useState, useRef } from "react";
import defaultAvatar from "../assets/default-avatar.svg";
import {
  getProfile,
  patchProfile,
  uploadProfilePhoto,
  uploadResume,
  uploadResult,
  uploadEducationResult,
  getCareer,
  uploadCareerResume,
  downloadCareerResume,
} from "../services/api";

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
  experience: [],
  education: [],
  projects: [],
  achievements: [],
  activities: [],
};

// Base URL for backend (set via Vite env VITE_API_BASE), fallback to localhost backend
const backendBase = import.meta?.env?.VITE_API_BASE || "http://localhost:5000";

// Design tokens (visual-only): vibrant, modern, real-world product feel
const baseInput = "w-full border border-gray-200 rounded-xl px-4 py-3 bg-white/90 focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-shadow";
const buttonPrimary = "bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold px-5 py-2 rounded-full shadow-lg hover:opacity-95 transition transform hover:-translate-y-0.5";
const buttonSecondary = "bg-white border border-gray-200 text-indigo-700 font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition";
const smallButtonPrimary = "bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-3 py-2 rounded-lg shadow-sm hover:opacity-95 transition";
const dangerButton = "bg-red-600 text-white px-3 py-1 rounded-lg shadow-sm hover:brightness-95 transition";
const cardClass = "bg-white rounded-2xl p-6 shadow-2xl border border-gray-100";
  // Small TagInput component for languages, skills, technologies (visual polish only)
  const TagInput = ({ values = [], onChange, placeholder, errorKey }) => {
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
      <div>
        <div className="flex flex-wrap gap-2 mb-3">
          {(values || []).map((v, i) => (
            <div key={`${v}-${i}`} className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 px-3 py-1 rounded-full text-sm shadow-sm">
              <span className="font-medium">{v}</span>
              <button onClick={() => remove(i)} className="text-indigo-500 bg-white rounded-full w-6 h-6 flex items-center justify-center">×</button>
            </div>
          ))}
        </div>
        <input data-err={errorKey} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} placeholder={placeholder} className={baseInput} />
        <div className="text-xs text-gray-400 mt-1">Press Enter or comma to add</div>
      </div>
    );
  };

// Reusable small field wrapper to keep layout consistent (kept inside single file)
const Field = ({ label, help, children, className = "", required = false }) => (
  <div className={`profile-field ${className}`}>
    <label className="block text-sm font-semibold text-indigo-700 uppercase tracking-wide">{label}{required && <span className="required-star text-red-500"> *</span>}</label>
    <div className="mt-2">{children}</div>
    {help && <div className="text-xs text-gray-500 mt-2">{help}</div>}
  </div>
);

const MyProfile = () => {
  const [draft, setDraft] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [collapsed, setCollapsed] = useState({});
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(''); // 'success' | 'error'
  const photoRef = useRef();
  const [saved, setSaved] = useState(false);
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // attachments for activities/hobbies (client-side only until backend supports)
  const [activityFiles, setActivityFiles] = useState({});
  const [educationFiles, setEducationFiles] = useState({});

  useEffect(() => {
    loadProfile();
  }, []);

  // Listen for external profile updates (header / other pages) and reload profile to keep UI in sync
  useEffect(() => {
    const onProfileUpdated = (ev) => {
      try {
        // reload profile to pick up any server-side changes (uploads etc)
        loadProfile();
      } catch (e) {
        console.warn('profileUpdated handler error', e);
      }
    };
    window.addEventListener('profileUpdated', onProfileUpdated);
    return () => window.removeEventListener('profileUpdated', onProfileUpdated);
  }, []);

  // Auto-dismiss transient message (save/upload/error) after ~5.5s
  useEffect(() => {
    if (!message) return undefined;
    const t = setTimeout(() => { setMessage(''); setMessageType(''); }, 5500);
    return () => clearTimeout(t);
  }, [message]);
  // NOTE: autosave and dirty detection intentionally removed to avoid re-renders

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await getProfile();
      const raw = res.data?.user || res.data;
      // Normalize into our frontend shape; ensure `career` exists even if backend stores fields at root
      const data = { ...emptyProfile, ...raw };

      // ensure career object exists and prefer root-level career-related fields from backend
      data.career = {
        currentStatus: (raw.currentStatus || raw.currentStatus === '') ? raw.currentStatus : (data.career?.currentStatus || 'Studying'),
        preferredRole: raw.preferredRole || data.career?.preferredRole || '',
        employmentType: raw.employmentType || data.career?.employmentType || 'Full Time',
        experienceLevel: raw.experienceLevel ?? data.career?.experienceLevel ?? 0,
        expectedSalary: raw.expectedSalary ?? data.career?.expectedSalary ?? null,
        resumeFilePath: raw.resumeFilePath || raw.resume || data.career?.resumeFilePath || '',
        skills: raw.skills || data.career?.skills || [],
      };

      // Helper to attach client-side ids to server arrays (so UI add/remove works)
      const ensureIds = (arr, type = 'generic') => {
        if (!Array.isArray(arr)) return [];
        return arr.map((it, i) => {
          const id = it.id || it._id || `srv-${Date.now()}-${i}`;
          // normalize experience entries: ensure startDate/endDate strings (ISO yyyy-mm-dd)
          if (type === 'experience') {
            const pick = (obj, keys) => {
              for (const k of keys) if (obj[k] !== undefined && obj[k] !== null) return obj[k];
              return undefined;
            };
            const rawStart = pick(it, ['startDate','start_date','start','from','begin','beginDate','fromDate','start_year','startYear']);
            const rawEnd = pick(it, ['endDate','end_date','end','to','finish','endDate','end_year','endYear','toDate']);
            const toISO = (v) => {
              if (!v) return '';
              try {
                // Date instance
                if (v instanceof Date && !isNaN(v)) {
                  const y = v.getFullYear();
                  const m = String(v.getMonth() + 1).padStart(2, '0');
                  const d = String(v.getDate()).padStart(2, '0');
                  return `${y}-${m}-${d}`;
                }
                // numeric year -> convert to Jan 1
                if (typeof v === 'number' && v > 1900 && v < 3000) return `${v}-01-01`;
                // string that is parseable
                const parsed = new Date(v);
                if (!isNaN(parsed)) {
                  const y = parsed.getFullYear();
                  const m = String(parsed.getMonth() + 1).padStart(2, '0');
                  const d = String(parsed.getDate()).padStart(2, '0');
                  return `${y}-${m}-${d}`;
                }
              } catch (e) {
                return '';
              }
              return '';
            };
            const startDate = toISO(rawStart) || '';
            const endDate = toISO(rawEnd) || '';
            const technologies = Array.isArray(it.technologies) ? it.technologies : (Array.isArray(it.skills) ? it.skills : []);
            return { id, company: it.company || it.companyName || '', role: it.role || it.title || '', startDate, endDate, description: it.description || it.summary || it.duration || '', technologies };
          }
          return { id, ...it };
        });
      };

      data.experience = ensureIds(raw.experience || data.experience, 'experience');
      data.education = ensureIds(raw.education || data.education);
      data.projects = ensureIds(raw.projects || data.projects);
      data.achievements = ensureIds(raw.achievements || data.achievements);
      data.activities = ensureIds(raw.activities || data.activities);

      // Use single source-of-truth: draft (no deep clone)
      setDraft(data);
        if (data.username) {
          setSaved(true);
          setUsernameSaved(true);
        }
    } catch (err) {
      console.error("Failed to load profile", err);
      if (err?.response?.status === 401) {
          setMessage('Unauthorized — please log in'); setMessageType('error');
      } else {
          setMessage('Failed to load profile'); setMessageType('error');
      }
    }
    setLoading(false);
  };

  // Save all draft fields at once
  const saveAll = async () => {
    setErrors({});
    try {
      // validate before saving everything
      const allErrors = validateAll();
      if (Object.keys(allErrors).length > 0) {
        setErrors(allErrors);
        setMessage('Please fix validation errors before saving'); setMessageType('error');
        const firstKey = Object.keys(allErrors)[0];
        setTimeout(() => focusField(firstKey), 300);
        return;
      }
      // debug outgoing payload
      console.debug('Saving profile payload:', draft);
      // Flatten career fields to root-level so backend (which expects top-level career fields)
      // receives allowed keys like preferredRole, expectedSalary, skills, etc.
      const payloadToSend = { ...draft, ...(draft.career || {}) };
      const res = await patchProfile(payloadToSend);
      console.debug('Save response:', res?.data);
      // backend returns either the updated user (direct) or { message, user }
      const payload = res?.data?.user || res?.data;
      if (payload) setDraft(prev => mergeIntoDraft(prev, payload));
      setSaved(true);
      setSubmitted(false);
      setMessage('Saved successfully'); setMessageType('success');
      // notify other UI (navbar/header) that profile updated (includes image)
      try { window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { ...(payload || {}), __updatedAt: Date.now() } })); } catch (e) {}
      setTimeout(() => { setMessage(''); setMessageType(''); }, 2500);
    } catch (err) {
      console.error('saveAll', err);
      setMessage(err?.response?.data?.error || 'Save failed'); setMessageType('error');
    }
  };

  // Validate a single section and return an errors object keyed by field path
  const validateSection = (section) => {
    const errs = {};
    switch (section) {
      case 'header':
        if (!draft.fullName || String(draft.fullName).trim() === '') errs['fullName'] = 'Full name is required';
        break;
      case 'personal':
        if (!draft.gender || String(draft.gender).trim() === '') errs['gender'] = 'Please select gender';
        break;
      case 'career':
        if (!draft.career || !draft.career.preferredRole || String(draft.career.preferredRole).trim() === '') errs['career.preferredRole'] = 'Preferred role is required';
        break;
      case 'experience':
        (draft.experience || []).forEach((e, i) => {
          const keyId = e.id || i;
          if (!e.company || String(e.company).trim() === '') errs[`experience.${keyId}.company`] = 'Company required';
          if (!e.role || String(e.role).trim() === '') errs[`experience.${keyId}.role`] = 'Role required';
        });
        break;
      case 'education':
        (draft.education || []).forEach((ed, i) => {
          const keyId = ed.id || i;
          if (!ed.institution || String(ed.institution).trim() === '') errs[`education.${keyId}.institution`] = 'Institution required';
              if (!ed.resultFilePath || String(ed.resultFilePath || '').trim() === '') errs[`education.${keyId}.resultFilePath`] = 'Result file is required';
        });
        break;
      default:
        break;
    }
    return errs;
  };

  const validateAll = () => {
    let errs = {};
    // header
    errs = { ...errs, ...validateSection('header') };
    // personal
    errs = { ...errs, ...validateSection('personal') };
    // career
    errs = { ...errs, ...validateSection('career') };
    // experience
    errs = { ...errs, ...validateSection('experience') };
    // education
    errs = { ...errs, ...validateSection('education') };
    return errs;
  };

  // Final submit that validates all fields and persists
  const submitProfile = async () => {
    setErrors({});
    const allErrors = validateAll();
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setMessage('Please fix highlighted errors before submitting'); setMessageType('error');
      // also open the floating error panel by keeping errors state; scroll to first error
      const firstKey = Object.keys(allErrors)[0];
      setTimeout(() => focusField(firstKey), 300);
      return;
    }
    try {
      console.debug('Submitting profile payload:', draft);
      const payloadToSend = { ...draft, ...(draft.career || {}) };
      const res = await patchProfile(payloadToSend);
      console.debug('Submit response:', res?.data);
      const payload = res?.data?.user || res?.data;
      if (payload) setDraft(prev => mergeIntoDraft(prev, payload));
      setSaved(true);
      setSubmitted(true);
      setMessage('Profile submitted successfully'); setMessageType('success');
      // notify other UI (navbar/header) that profile updated
      try { window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { ...(payload || {}), __updatedAt: Date.now() } })); } catch (e) {}
      setTimeout(() => { setMessage(''); setMessageType(''); }, 3000);
    } catch (err) {
      console.error('submitProfile', err);
      setMessage(err?.response?.data?.error || 'Submit failed'); setMessageType('error');
    }
  };

  // Save only username (initial step) to lock identity before full form
  const saveUsername = async () => {
    setErrors({});
    if (!draft.username || String(draft.username).trim() === '') {
      setMessage('Enter a username before saving'); setMessageType('error');
      return;
    }
    try {
      const res = await patchProfile({ username: draft.username });
      console.debug('Save username response:', res?.data);
      const payload = res?.data?.user || res?.data;
      if (payload) setDraft(prev => mergeIntoDraft(prev, payload));
      setSaved(true);
      setUsernameSaved(true);
      setMessage('Username saved'); setMessageType('success');
      setTimeout(() => { setMessage(''); setMessageType(''); }, 2000);
    } catch (err) {
      console.error('saveUsername', err);
      setMessage(err?.response?.data?.error || 'Save failed'); setMessageType('error');
    }
  };
  const resolveAsset = (p) => {
    if (!p) return p;
    if (typeof p !== 'string') return p;
    // Accept both leading-slash and non-leading slash paths
    if (p.startsWith('/uploads') || p.startsWith('uploads')) return `${backendBase}${p.startsWith('/') ? p : '/' + p}`;
    return p;
  };

  const toggle = (section) => setCollapsed((c) => ({ ...c, [section]: !c[section] }));

  const setField = (path, value) => {
    const parts = path.split('.');
    setDraft(prev => {
      // Shallow update along the path to keep stable references
      const copy = { ...prev };
      let cur = copy;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        const next = cur[p];
        if (Array.isArray(next)) {
          cur[p] = [...next];
        } else if (next && typeof next === 'object') {
          cur[p] = { ...next };
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

  // Merge server response into our draft while preserving nested objects where possible.
  const mergeIntoDraft = (prev, serverData) => {
    const out = { ...prev };
    if (!serverData) return out;

    // If server returned a wrapper { message, user } allow passing 'user' directly
    const data = serverData.user ? serverData.user : serverData;

    for (const k of Object.keys(data || {})) {
      const v = data[k];
      // Map career-related top-level fields into our nested `career` object
      if (['currentStatus','preferredRole','employmentType','experienceLevel','expectedSalary','resumeFilePath','skills'].includes(k)) {
        out.career = { ...(out.career || {}), ...(out.career || {}), [k === 'resumeFilePath' ? 'resumeFilePath' : k]: v };
        continue;
      }

      if (v && typeof v === 'object' && !Array.isArray(v)) {
        out[k] = { ...(out[k] || {}), ...v };
      } else {
        out[k] = v;
      }
    }

    // If server returned updated profile image, ensure we show latest version (cache-bust)
    const rawProfile = data.profileImage || data.profilePhoto || null;
    if (rawProfile) {
      try {
        const resolved = resolveAsset(rawProfile);
        const ts = Date.now();
        const busted = resolved ? (resolved.includes('?') ? `${resolved}&t=${ts}` : `${resolved}?t=${ts}`) : resolved;
        out.profileImage = busted || resolved || rawProfile;
      } catch (e) {
        out.profileImage = data.profileImage || data.profilePhoto;
      }
    }

    // Ensure arrays from server have client-side ids
    const attachIds = (arr) => Array.isArray(arr) ? arr.map((it, i) => ({ id: it.id || it._id || `srv-${Date.now()}-${i}`, ...it })) : arr;
    out.experience = attachIds(out.experience);
    out.education = attachIds(out.education);
    out.projects = attachIds(out.projects);
    out.achievements = attachIds(out.achievements);
    out.activities = attachIds(out.activities);

    return out;
  };
  // per-section saves removed; use `Save All` instead

  // profile image
  const handleProfileImageChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setProfileImageFile(f);
    setProfileImagePreview(URL.createObjectURL(f));
  };
  const uploadImage = async () => {
    if (!profileImageFile) { setMessage('Select an image'); setMessageType('error'); return }
    try {
      const res = await uploadProfilePhoto(profileImageFile);
      console.debug('Upload image response:', res?.data);
      // backend returns { message, profileImage }
      const newPath = res?.data?.profileImage || (res?.data?.user && res.data.user.profileImage);
      if (newPath) {
        const busted = resolveAsset(newPath) + `?t=${Date.now()}`;
        setDraft(prev => ({ ...prev, profileImage: busted }));
      } else {
        // fallback: merge full payload when returned
        const payloadImg = res?.data?.user || res?.data;
        if (payloadImg) setDraft(prev => mergeIntoDraft(prev, payloadImg));
      }
      if (res?.data) setSaved(true);
      setSubmitted(false);
      setMessage('Profile image uploaded'); setMessageType('success');
      setProfileImageFile(null);
      setProfileImagePreview('');
      // notify other UI (navbar/header) that profile image changed — include timestamp to bust cache
      try { window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { profileImage: newPath || '', __updatedAt: Date.now() } })); } catch (e) {}
    } catch (err) {
      console.error(err);
      setMessage('Image upload failed'); setMessageType('error');
    }
  };

  // resume
  const uploadResumeFile = async () => {
    if (!resumeFile) { setMessage('Select resume file'); setMessageType('error'); return }
    try {
      const res = await uploadResume(resumeFile);
      console.debug('Upload resume response:', res?.data);
      const payload = res?.data?.user || res?.data;
      if (payload) setDraft(prev => mergeIntoDraft(prev, payload));
      if (res?.data) setSaved(true);
      setSubmitted(false);
      setMessage('Resume uploaded'); setMessageType('success');
      setResumeFile(null);
      setTimeout(() => { setMessage(''); setMessageType(''); }, 2500);
      // notify header in case server returned updated profile with new paths
      try { window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { ...(payload || {}), __updatedAt: Date.now() } })); } catch (e) {}
    } catch (err) {
      console.error(err);
      setMessage(err?.response?.data?.error || 'Resume upload failed'); setMessageType('error');
    }
  };

  const handleResumeChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setResumeFile(f);
  };

  const uploadUserResume = async (e) => {
    e?.preventDefault?.();
    await uploadResumeFile();
  };

  // Experience helpers
  const addExperience = () => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setDraft(prev => ({ ...prev, experience: [...(prev.experience||[]), { id, company: '', role: '', startDate: '', endDate: '', currentlyWorking: false, description: '', technologies: [] }] }));
    setSaved(false); setSubmitted(false);
  };
  const removeExperience = (id) => { setDraft(prev => ({ ...prev, experience: (prev.experience||[]).filter(e=>e.id!==id) })); setSaved(false); setSubmitted(false); };
  const setExperienceField = (id, key, val) => { setDraft(prev => ({ ...prev, experience: (prev.experience||[]).map(e => e.id === id ? { ...e, [key]: val } : e) })); setSaved(false); setSubmitted(false); };

  // Education helpers
  const addEducation = () => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setDraft(prev => ({ ...prev, education: [...(prev.education||[]), { id, level: '', institution: '', boardUniversity: '', startYear: '', endYear: '', completed: false, totalSemesters: 0, currentSemester: 0, cgpa: '', semesterWise: [] }] }));
    setSaved(false); setSubmitted(false);
  };
  const removeEducation = (id) => { setDraft(prev => ({ ...prev, education: (prev.education||[]).filter(e=>e.id!==id) })); setSaved(false); setSubmitted(false); };
  const setEducationField = (id, key, val) => { setDraft(prev => ({ ...prev, education: (prev.education||[]).map(e => e.id === id ? { ...e, [key]: val } : e) })); setSaved(false); setSubmitted(false); };

  const setEducationSemesters = (id, total) => setDraft(prev => {
    const education = (prev.education||[]).map(e => {
      if (e.id !== id) return e;
      const t = parseInt(total) || 0;
      const prevSem = Array.isArray(e.semesterWise) ? e.semesterWise : [];
      return { ...e, totalSemesters: t, semesterWise: Array.from({ length: t }).map((_, idx) => prevSem[idx] ?? '') };
    });
    return { ...prev, education };
  });
  const setEducationSemestersWithFlag = (id, total) => { setEducationSemesters(id, total); setSaved(false); setSubmitted(false); };

  const setEducationSGPA = (id, semIndex, value) => { setDraft(prev => ({ ...prev, education: (prev.education||[]).map(e => e.id === id ? { ...e, semesterWise: (Array.isArray(e.semesterWise)? e.semesterWise.slice() : []).map((s,idx)=> idx===semIndex ? value : s) } : e) })); setSaved(false); setSubmitted(false); };

  // Projects / achievements / activities helpers (add/remove)
  const addItem = (key, item) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const withId = { id, ...item };
    setDraft(prev => ({ ...prev, [key]: [...(prev[key]||[]), withId] }));
    setSaved(false); setSubmitted(false);
  };
  const removeItemById = (key, id) => { setDraft(prev => ({ ...prev, [key]: (prev[key]||[]).filter(i=>i.id!==id) })); setSaved(false); setSubmitted(false); };

  const setProjectField = (id, keyField, value) => { setDraft(prev => ({ ...prev, projects: (prev.projects||[]).map(p=> p.id===id ? { ...p, [keyField]: value } : p) })); setSaved(false); setSubmitted(false); };
  const setAchievementField = (id, keyField, value) => { setDraft(prev => ({ ...prev, achievements: (prev.achievements||[]).map(a=> a.id===id ? { ...a, [keyField]: value } : a) })); setSaved(false); setSubmitted(false); };
  const setActivityField = (id, keyField, value) => { setDraft(prev => ({ ...prev, activities: (prev.activities||[]).map(a=> a.id===id ? { ...a, [keyField]: value } : a) })); setSaved(false); setSubmitted(false); };

  const downloadResume = async () => {
    try {
      const res = await downloadCareerResume();
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const resumeName = draft?.career?.resumeFilePath || draft?.resumeFilePath || '';
      link.download = resumeName ? resumeName.split('/').pop() : 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setMessage('Download failed');
    }
  };

  // Activity attachments handlers (client-side): attach file to activity index
  const handleActivityFile = (activityId, file) => {
    setActivityFiles((prev) => {
      const next = { ...prev };
      if (!file) delete next[activityId];
      else next[activityId] = file;
      return next;
    });
  };

  // Focus / scroll to a field by its error key (data-err attribute)
  const focusField = (errKey) => {
    if (!errKey) return;
    try {
      const el = document.querySelector(`[data-err="${errKey}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof el.focus === 'function') el.focus();
      }
    } catch (e) {
      console.warn('focusField failed', e);
    }
  };

  // Attempt to upload activity attachments to a generic endpoint (best-effort; backend may not support)
  const uploadActivityAttachments = async () => {
    setMessage('Uploading attachments...');
    setMessageType('');
    const keys = Object.keys(activityFiles);
    if (keys.length === 0) return setMessage('No attachments selected');
    try {
      for (const k of keys) {
        const f = activityFiles[k];
        const fd = new FormData();
        fd.append('file', f);
        fd.append('meta', JSON.stringify({ type: 'activity', index: k }));
        // best-effort endpoint: /uploads/activity (may not exist)
        const resp = await fetch(`${backendBase}/uploads/activity`, { method: 'POST', body: fd });
        if (!resp.ok) {
          if (resp.status === 404) throw new Error('Upload endpoint not found on server');
          throw new Error('Upload failed');
        }
      }
      setMessage('Attachments uploaded (attempted)');
      setMessageType('success');
    } catch (err) {
      console.error('uploadActivityAttachments', err);
      setMessage(err.message || 'Attachment upload failed (server may not support activity uploads)');
      setMessageType('error');
    }
  };

  // Education: handle selecting a result file for a specific education entry
  const handleEducationFile = (educationId, file) => {
    setEducationFiles((prev) => ({ ...prev, [educationId]: file }));
  };

  const handleUploadEducationResult = async (educationId) => {
    const file = educationFiles[educationId];
    if (!file) { setMessage('Select a result file'); setMessageType('error'); return; }
    try {
      setMessage('Uploading result...'); setMessageType('');
      // map client-side education id to index for backend attachment
      const idx = (draft.education || []).findIndex((e) => e.id === educationId || String(e._id) === String(educationId));
      const res = await uploadEducationResult(file, idx >= 0 ? idx : undefined);
      // server may return updated user or just file info; try to merge
      const payload = res?.data?.user || res?.data;
      if (payload) {
        setDraft(prev => mergeIntoDraft(prev, payload));
      } else {
        // try common response shapes for file path
        const fp = res?.data?.resultFilePath || res?.data?.filePath || res?.data?.path || res?.data?.url || res?.data?.resultPath || res?.data?.result;
        if (fp) {
          // if backend attached index, prefer it
          const attachedIdx = res?.data?.attachedIndex;
          if (typeof attachedIdx === 'number' && (draft.education||[])[attachedIdx]) {
            setDraft(prev => ({ ...prev, education: (prev.education||[]).map((e, i) => i === attachedIdx ? { ...e, resultFilePath: resolveAsset(fp) + `?t=${Date.now()}` } : e) }));
          } else {
            setDraft(prev => ({ ...prev, education: (prev.education||[]).map(e => e.id === educationId ? { ...e, resultFilePath: resolveAsset(fp) + `?t=${Date.now()}` } : e) }));
          }
        }
      }
      setMessage('Result uploaded'); setMessageType('success');
      // keep educationFiles local cleared for that id
      setEducationFiles(prev => { const n = { ...prev }; delete n[educationId]; return n; });
      // notify header/profile listeners in case server returned updated profile
      try { window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { ...(payload || {}), __updatedAt: Date.now() } })); } catch (e) {}
    } catch (err) {
      console.error('uploadEducationResult', err);
      setMessage(err?.response?.data?.error || 'Upload failed'); setMessageType('error');
    }
  };

  const prettyErrorLabel = (key) => {
    if (!key) return key;
    // friendly map for common fields
    const map = {
      'fullName': 'Full name',
      'headline': 'Headline',
      'primaryLocation': 'Location',
      'bio': 'Short bio',
      'career.preferredRole': 'Preferred role',
      'career.skills': 'Skills',
    };
    if (map[key]) return map[key];
    // pattern matching for arrays like experience.<id>.company (allow hyphens and other chars in id)
    const m = key.match(/^([^\.]+)\.(.+)$/);
    if (m) {
      const section = m[1];
      const rest = m[2].replace(/\./g, ' > ');
      return `${capitalize(section)}: ${rest}`;
    }
    return capitalize(key.replace(/\./g, ' > '));
  };

  const capitalize = (s) => s && s.charAt(0).toUpperCase() + s.slice(1);

  if (loading) return <div className="p-4">Loading...</div>;
  // If username not yet saved, require user to set username first and save it
  if (!usernameSaved) {
    return (
      <div className="w-full bg-gradient-to-br from-indigo-50 to-white">
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Setup your profile username</h1>
        <div className="bg-white border rounded-lg p-4">
          <Field label="Choose a unique username" help="This will be your public handle. Save to continue.">
            <input className={`${errors['username'] ? 'border-red-500' : ''} ${baseInput}`} value={draft.username || ''} onChange={e => { setDraft(prev => ({ ...prev, username: e.target.value })); setSaved(false); setSubmitted(false); }} placeholder="username" />
            {errors['username'] && <div className="text-xs text-red-600 mt-1">{errors['username']}</div>}
            <div className="mt-3 flex gap-3">
              <button onClick={saveUsername} className={buttonPrimary}>Save Username</button>
            </div>
          </Field>
        </div>
        {message && <div className="text-sm text-green-600 mt-3">{message}</div>}
      </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-indigo-50 to-white">
      <div className="max-w-6xl mx-auto p-8 relative">
      {/* Page header - simplified, neutral */}
      <div className="mb-6 rounded-lg">
        <div className="bg-white border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500">My Profile</h1>
                  <div className="text-sm text-gray-600 mt-2">Edit your public profile — changes are saved to your account.</div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={saveAll} disabled={false} className={buttonPrimary}>Save All</button>
                  <button onClick={submitProfile} disabled={!saved || submitted} className={`${buttonSecondary} ${(!saved || submitted) ? 'opacity-50 cursor-not-allowed' : ''}`}>Submit Profile</button>
                </div>
              </div>
        </div>
      </div>
      {/* Do not lock whole form after submit — only disable Submit button.
          Users can change fields after submit (username stays immutable). */}
      

      {/* Top row: Account summary + preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Account info */}
          <section className={`${cardClass}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Account</h2>
              <div className="text-sm text-gray-500">Username is immutable</div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="min-w-0">
                <div className="text-xs text-gray-500">Username</div>
                <div className="mt-1 font-medium truncate">{draft.username || '-'}</div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-gray-500">Email</div>
                <div className="mt-1 text-gray-700 break-words">{draft.email || '-'}</div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-gray-500">Registered</div>
                <div className="mt-1 text-gray-700">{draft.registrationDate ? new Date(draft.registrationDate).toLocaleDateString() : '-'}</div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-gray-500">Account Type</div>
                <div className="mt-1 text-gray-700">{draft.accountType || '-'}</div>
              </div>
            </div>
          </section>

          {/* Profile Header */}
          <section className={`${cardClass} hover:shadow-2xl transition-shadow`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Profile Header</h2>
              <button onClick={() => toggle('header')} className="text-sm text-indigo-600">{collapsed.header ? 'Expand' : 'Collapse'}</button>
            </div>
            {!collapsed.header && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="avatar-wrap flex flex-col items-center">
                      <div className="w-40 h-40 rounded-full overflow-hidden shadow-2xl ring-4 ring-white -mb-4">
                        <img src={profileImagePreview || resolveAsset(draft.profileImage) || defaultAvatar} alt="avatar" className="w-full h-full object-cover" />
                      </div>
                  <div className="mt-6 w-full text-center">
                    <Field label="Profile photo" help="Upload a square photo (recommended 400x400). JPG/PNG accepted." className="text-center">
                          <input type="file" accept="image/*" ref={photoRef} onChange={handleProfileImageChange} />
                                <div className="flex gap-2 mt-2 justify-center">
                                  <button onClick={uploadImage} className={smallButtonPrimary}>Upload</button>
                                  <button onClick={() => { setProfileImageFile(null); setProfileImagePreview(''); }} className="bg-gray-100 px-3 py-2 rounded-md transition">Clear</button>
                                </div>
                    </Field>
                    <div className="avatar-caption text-xs text-gray-500 mt-2">Choose a square photo for best results</div>
                  </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 gap-3">
                  <Field label="Full name" help="Your display name shown on your profile." required>
                      <input data-err="fullName" disabled={submitted} className={`${errors['fullName'] ? 'border-red-500' : ''} ${baseInput}`} value={draft.fullName || ''} onChange={e => setField('fullName', e.target.value)} placeholder="e.g. Priya Sharma" />
                    {errors['fullName'] && <div className="text-xs text-red-600 mt-1">{errors['fullName']}</div>}
                  </Field>

                  <Field label="Headline" help="Short pitch (e.g. 'Frontend developer • React, TypeScript').">
                    <input data-err="headline" className={baseInput} value={draft.headline || ''} onChange={e => setField('headline', e.target.value)} placeholder="e.g. Frontend Engineer" />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Location" help="City, State or 'Remote'.">
                      <input data-err="primaryLocation" className={baseInput} value={draft.primaryLocation || ''} onChange={e => setField('primaryLocation', e.target.value)} placeholder="e.g. Mumbai, India" />
                    </Field>
                    <Field label="Open to work" help="Mark yes if you're actively looking for roles.">
                      <select className={baseInput} value={draft.openToWork ? 'yes' : 'no'} onChange={e => setField('openToWork', e.target.value === 'yes')}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </Field>
                  </div>

                  <Field label="Short bio" help="Short summary of your background and goals (recommended 40-200 characters).">
                    <textarea data-err="bio" className={`${baseInput} h-28`} rows={4} maxLength={600} value={draft.bio || ''} onChange={e => setField('bio', e.target.value)} placeholder="A concise summary about you" />
                    <div className="text-xs text-gray-400 mt-1">{(draft.bio || '').length}/600</div>
                  </Field>

                  <div className="flex justify-end"></div>
                </div>
              </div>
            )}
          </section>

          {/* Personal Info */}
          <section className={`${cardClass} hover:shadow-2xl transition-shadow`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Personal Information</h2>
              <button onClick={() => toggle('personal')} className="text-sm text-indigo-600">{collapsed.personal ? 'Expand' : 'Collapse'}</button>
            </div>
            {!collapsed.personal && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="First name" help="Given name (optional for display).">
                  <input className={baseInput} value={draft.firstName || ''} onChange={e => setField('firstName', e.target.value)} placeholder="First name" />
                </Field>
                <Field label="Last name" help="Family name or surname.">
                  <input className={baseInput} value={draft.lastName || ''} onChange={e => setField('lastName', e.target.value)} placeholder="Last name" />
                </Field>
                <Field label="Mobile" help="Include country code if relevant (e.g. +91 98765 43210).">
                  <input className={baseInput} value={draft.mobileNumber || ''} onChange={e => setField('mobileNumber', e.target.value)} placeholder="+91 98765 43210" />
                </Field>

                <Field label="Birth date" help="Optional — used only for age-based filters if enabled.">
                  <input type="date" className={baseInput} value={draft.birthDate ? draft.birthDate.substring(0, 10) : ''} onChange={e => setField('birthDate', e.target.value)} />
                </Field>
                <Field label="Gender" help="Optional — choose if you want it displayed.">
                  <select data-err="gender" className={baseInput} value={draft.gender || ''} onChange={e => setField('gender', e.target.value)}>
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <Field label="Nationality" help="Country of citizenship.">
                  <input className={baseInput} value={draft.nationality || ''} onChange={e => setField('nationality', e.target.value)} placeholder="e.g. India" />
                </Field>

                <div className="md:col-span-3">
                  <Field label="Languages" help="Add languages you speak; press Enter after each.">
                    <TagInput values={draft.languages || []} onChange={vals => setField('languages', vals)} placeholder="Add language and press Enter" />
                  </Field>
                </div>

                <Field label="Category" help="One-line category describing your current status.">
                  <select className={baseInput} value={draft.category || 'Student'} onChange={e => setField('category', e.target.value)}>
                    <option>Student</option>
                    <option>Working Professional</option>
                    <option>Internship Seeking</option>
                    <option>Freelancer</option>
                    <option>Open to Opportunities</option>
                  </select>
                </Field>

                <div className="md:col-span-3 flex justify-end"></div>
              </div>
            )}
          </section>

          {/* Address & Social combined for compactness */}
          <section className="bg-white border rounded-lg p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md font-medium mb-3">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Flat / House No" help="Optional."><input className={baseInput} value={draft.address?.flat || ''} onChange={e => setField('address.flat', e.target.value)} /></Field>
                <Field label="Street / Area" help="Optional."><input className={baseInput} value={draft.address?.street || ''} onChange={e => setField('address.street', e.target.value)} /></Field>
                <Field label="City"><input className={baseInput} value={draft.address?.city || ''} onChange={e => setField('address.city', e.target.value)} /></Field>
                <Field label="State"><input className={baseInput} value={draft.address?.state || ''} onChange={e => setField('address.state', e.target.value)} /></Field>
                <Field label="Postal Code"><input className={baseInput} value={draft.address?.postalCode || ''} onChange={e => setField('address.postalCode', e.target.value)} /></Field>
                <Field label="Country"><input className={baseInput} value={draft.address?.country || ''} onChange={e => setField('address.country', e.target.value)} /></Field>
              </div>
              <div className="flex justify-end mt-3"></div>
            </div>

            <div>
              <h3 className="text-md font-medium mb-3">Social Links</h3>
              <div className="grid grid-cols-1 gap-3">
                <Field label="GitHub" help="Username or full URL — we will normalize it."><input className={baseInput} value={draft.socialLinks?.github || ''} onChange={e => setField('socialLinks.github', e.target.value)} placeholder="github.com/username or username" /></Field>
                <Field label="LinkedIn" help="Profile handle or URL."><input className={baseInput} value={draft.socialLinks?.linkedin || ''} onChange={e => setField('socialLinks.linkedin', e.target.value)} placeholder="linkedin.com/in/yourname or yourname" /></Field>
                <Field label="Portfolio" help="Link to personal website or portfolio."><input className={baseInput} value={draft.socialLinks?.portfolio || ''} onChange={e => setField('socialLinks.portfolio', e.target.value)} placeholder="https://" /></Field>
                <Field label="Twitter / X" help="Handle or URL."><input className={baseInput} value={draft.socialLinks?.twitter || ''} onChange={e => setField('socialLinks.twitter', e.target.value)} placeholder="@handle or https://twitter.com/handle" /></Field>
                <Field label="Other" help="Any other public profile link."><input className={baseInput} value={draft.socialLinks?.other || ''} onChange={e => setField('socialLinks.other', e.target.value)} /></Field>
                <div className="flex justify-end mt-2"></div>
              </div>
            </div>
          </section>

          {/* Career */}
          <section className={`${cardClass} hover:shadow-2xl transition-shadow`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Career</h2>
              <button onClick={() => toggle('career')} className="text-sm text-indigo-600">{collapsed.career ? 'Expand' : 'Collapse'}</button>
            </div>
            {!collapsed.career && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Current status" help="Studying, Working, Fresher."><select className={baseInput} value={draft.career.currentStatus || 'Studying'} onChange={e => setField('career.currentStatus', e.target.value)}><option>Studying</option><option>Working</option><option>Fresher</option></select></Field>
                <Field label="Preferred role" help="Role you are targeting (e.g. Frontend Engineer)." required>
                  <input data-err="career.preferredRole" className="w-full border rounded-lg p-3 border-gray-200" value={draft.career.preferredRole || ''} onChange={e => setField('career.preferredRole', e.target.value)} />
                  {errors['career.preferredRole'] && <div className="text-xs text-red-600 mt-1">{errors['career.preferredRole']}</div>}
                </Field>
                <Field label="Employment Type" help="Full Time, Part Time, Internship, Remote"><select className={baseInput} value={draft.career.employmentType || 'Full Time'} onChange={e => setField('career.employmentType', e.target.value)}><option>Full Time</option><option>Part Time</option><option>Internship</option><option>Remote</option></select></Field>

                <Field label="Experience (years)" help="Number of professional years."><input type="number" min={0} className={baseInput} value={draft.career.experienceLevel || 0} onChange={e => setField('career.experienceLevel', Number(e.target.value))} /></Field>
                <Field label="Expected salary" help="Optional. Numeric value in your preferred currency."><input type="number" className={baseInput} value={draft.career.expectedSalary || ''} onChange={e => setField('career.expectedSalary', e.target.value)} /></Field>
                <Field label="Skills" help="Add skills one by one; they appear as tags.">
                  <TagInput errorKey={`career.skills`} values={draft.career?.skills || []} onChange={vals => setField('career.skills', vals)} placeholder="Add skill and press Enter" />
                  {errors['career.skills'] && <div className="text-xs text-red-600 mt-1">{errors['career.skills']}</div>}
                </Field>

                <div className="md:col-span-3">
                  <Field label="Resume" help="Upload a resume (PDF/DOC). We may extract skills automatically if available.">
                    <div className="flex items-center gap-3">
                      <input type="file" accept="application/pdf,.doc,.docx" onChange={handleResumeChange} />
                      <button onClick={uploadUserResume} className={smallButtonPrimary}>Upload Resume</button>
                      {(draft.career?.resumeFilePath || draft.resumeFilePath) && <button onClick={downloadResume} className="bg-indigo-600 text-white px-3 py-1 rounded transition hover:brightness-95">Download</button>}
                    </div>
                  </Field>
                </div>

                <div className="md:col-span-3 flex justify-end"></div>
              </div>
            )}
          </section>

          {/* Experience & Education combined for flow */}
          <section className="bg-white border rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Experience</h2><div className="flex gap-2"><button onClick={addExperience} className={smallButtonPrimary}>Add</button></div></div>
            {(draft.experience || []).map((exp) => (
              <div key={exp.id} className="experience-item mb-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Field label="Company" help="Organisation name." required>
                    <input data-err={`experience.${exp.id}.company`} className={`${errors[`experience.${exp.id}.company`] ? 'border-red-500' : ''} ${baseInput}`} value={exp.company || ''} onChange={e => setExperienceField(exp.id, 'company', e.target.value)} />
                    {errors[`experience.${exp.id}.company`] && <div className="text-xs text-red-600 mt-1">{errors[`experience.${exp.id}.company`]}</div>}
                  </Field>
                  <Field label="Role" help="Your designation." required>
                    <input data-err={`experience.${exp.id}.role`} className={`${errors[`experience.${exp.id}.role`] ? 'border-red-500' : ''} ${baseInput}`} value={exp.role || ''} onChange={e => setExperienceField(exp.id, 'role', e.target.value)} />
                    {errors[`experience.${exp.id}.role`] && <div className="text-xs text-red-600 mt-1">{errors[`experience.${exp.id}.role`]}</div>}
                  </Field>
                    <div className="experience-dates">
                      <Field label="Start"><input type="date" className={baseInput} value={exp.startDate ? exp.startDate.substring(0, 10) : ''} onChange={e => setExperienceField(exp.id, 'startDate', e.target.value)} /></Field>
                      <Field label="End" help="Leave empty if current."><input type="date" className={baseInput} value={exp.endDate ? exp.endDate.substring(0, 10) : ''} onChange={e => setExperienceField(exp.id, 'endDate', e.target.value)} /></Field>
                    </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Description" help="Brief summary of responsibilities (2-4 bullet points preferred)."><textarea className={`${baseInput} h-28`} value={exp.description || ''} onChange={e => setExperienceField(exp.id, 'description', e.target.value)} /></Field>
                  <Field label="Technologies" help="Add technologies used (press Enter after each)."><TagInput values={exp.technologies || []} onChange={vals => setExperienceField(exp.id, 'technologies', vals)} /></Field>
                </div>
                <div className="mt-3 flex justify-end"><button onClick={() => removeExperience(exp.id)} className={dangerButton}>Remove</button></div>
              </div>
            ))}
          </section>

          <section className={`${cardClass} mt-4`}> 
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Education</h2><div className="flex gap-2"><button onClick={addEducation} className={smallButtonPrimary}>Add</button></div></div>
            {(draft.education || []).map((edu) => (
              <div key={edu.id} className="border rounded p-4 mb-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Field label="Level"><select className={baseInput} value={edu.level || ''} onChange={e => setEducationField(edu.id, 'level', e.target.value)}><option value="">Select Level</option><option>SSC</option><option>HSC</option><option>Diploma</option><option>Bachelor</option><option>Master</option></select></Field>
                  <Field label="Institution" required>
                    <input data-err={`education.${edu.id}.institution`} className={`${errors[`education.${edu.id}.institution`] ? 'border-red-500' : ''} ${baseInput}`} value={edu.institution || ''} onChange={e => setEducationField(edu.id, 'institution', e.target.value)} />
                    {errors[`education.${edu.id}.institution`] && <div className="text-xs text-red-600 mt-1">{errors[`education.${edu.id}.institution`]}</div>}
                  </Field>
                  <Field label="Board / University"><input className={baseInput} value={edu.boardUniversity || ''} onChange={e => setEducationField(edu.id, 'boardUniversity', e.target.value)} /></Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3">
                  <Field label="Start year"><input className={baseInput} value={edu.startYear || ''} onChange={e => setEducationField(edu.id, 'startYear', e.target.value)} /></Field>
                  <Field label="End year"><input className={baseInput} value={edu.endYear || ''} onChange={e => setEducationField(edu.id, 'endYear', e.target.value)} /></Field>
                  <Field label="Total semesters" help="Number of semesters in the program"><input type="number" min={0} className={baseInput} value={edu.totalSemesters || 0} onChange={e => setEducationSemestersWithFlag(edu.id, e.target.value)} /></Field>
                  <Field label="Current semester"><input type="number" min={0} className={baseInput} value={edu.currentSemester || 0} onChange={e => setEducationField(edu.id, 'currentSemester', e.target.value)} /></Field>
                </div>
                <div className="mt-3"><Field label="CGPA / Percentage"><input className={baseInput} value={edu.cgpa || ''} onChange={e => setEducationField(edu.id, 'cgpa', e.target.value)} /></Field></div>
                {Array.isArray(edu.semesterWise) && edu.semesterWise.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {(() => {
                      // If currentSemester > 0, that semester is ongoing; only show SGPA inputs for completed semesters
                      const current = Number(edu.currentSemester) || 0;
                      const completedCount = current > 0 ? Math.max(0, current - 1) : (edu.totalSemesters || edu.semesterWise.length);
                      return edu.semesterWise.map((sgpa, si) => {
                        if (si >= completedCount) return null;
                        return (
                          <div key={si}><label className="text-sm">Sem {si + 1} SGPA</label><input type="number" step="0.01" min={0} max={10} className={baseInput} value={(sgpa && (sgpa.sgpa ?? sgpa)) || ''} onChange={e => setEducationSGPA(edu.id, si, e.target.value)} /></div>
                        );
                      });
                    })()}
                  </div>
                )}
                <div className="mt-3 grid grid-cols-1 gap-3">
                  <Field label="Result / Transcript" help={edu.level && (edu.level.toLowerCase().includes('diploma') || edu.level.toLowerCase().includes('college')) ? 'Upload last-semester CGPA or final result' : 'Upload result certificate (PDF)'}>
                    <div className="flex items-center gap-2">
                      <input type="file" accept="application/pdf,image/*,.doc,.docx" onChange={e => handleEducationFile(edu.id, e.target.files?.[0] || null)} />
                      <button onClick={() => handleUploadEducationResult(edu.id)} className={smallButtonPrimary}>Upload Result</button>
                      {edu.resultFilePath && (
                        <a href={resolveAsset(edu.resultFilePath)} target="_blank" rel="noreferrer" className="bg-indigo-600 text-white px-3 py-1 rounded transition hover:brightness-95">Download</a>
                      )}
                    </div>
                  </Field>
                  <div className="flex justify-end"><button onClick={() => removeEducation(edu.id)} className={dangerButton}>Remove</button></div>
                </div>
              </div>
            ))}
          </section>

          {/* Projects, Achievements */}
          <section className="bg-white border rounded-lg p-5 shadow-sm mt-4">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Projects</h2><div className="flex gap-2"><button onClick={() => addItem('projects', { title: '', description: '', techStack: [] })} className={smallButtonPrimary}>Add</button></div></div>
            {(draft.projects || []).map((p) => (
              <div key={p.id} className="border p-3 rounded mb-2">
                <Field label="Title"><input placeholder="Title" className={`${baseInput} mb-2`} value={p.title || ''} onChange={e => setProjectField(p.id, 'title', e.target.value)} /></Field>
                <Field label="Description"><textarea placeholder="Description" className={`${baseInput} mb-2 h-28`} value={p.description || ''} onChange={e => setProjectField(p.id, 'description', e.target.value)} /></Field>
              </div>
            ))}
          </section>

          <section className="bg-white border rounded-lg p-5 shadow-sm mt-4">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Achievements</h2><div className="flex gap-2"><button onClick={() => addItem('achievements', { title: '', organization: '', year: '', description: '' })} className={smallButtonPrimary}>Add</button></div></div>
            {(draft.achievements || []).map((a) => (
              <div key={a.id} className="border p-3 rounded mb-2">
                <Field label="Title"><input placeholder="Title" className={`${baseInput} mb-2`} value={a.title || ''} onChange={e => setAchievementField(a.id, 'title', e.target.value)} /></Field>
              </div>
            ))}
          </section>

          {/* Activities & Hobbies with attachment option */}
          <section className="bg-white border rounded-lg p-5 shadow-sm mt-4">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Activities & Hobbies</h2><div className="flex gap-2"><button onClick={() => addItem('activities', { title: '', description: '' })} className={smallButtonPrimary}>Add</button></div></div>
            {(draft.activities || []).map((act, idx) => (
              <div key={act.id} className="border rounded p-3 mb-3">
                <Field label={`Activity ${idx + 1} title`} help="Short title for the activity or hobby."><input placeholder="Title" className={`${baseInput} mb-2`} value={act.title || ''} onChange={e => setActivityField(act.id, 'title', e.target.value)} /></Field>
                <Field label={`Activity ${idx + 1} description`} help="Optional longer description."><textarea placeholder="Description" className={`${baseInput} mb-2 h-28`} value={act.description || ''} onChange={e => setActivityField(act.id, 'description', e.target.value)} /></Field>
                <Field label="Attach file (optional)" help="Add an image, document or proof for this activity (client-side).">
                  <input type="file" onChange={e => handleActivityFile(act.id, e.target.files?.[0] || null)} />
                  {activityFiles[act.id] && <div className="mt-2 text-sm">Selected: {activityFiles[act.id].name} <button onClick={() => handleActivityFile(act.id, null)} className="ml-2 text-red-600">Remove</button></div>}
                </Field>
              </div>
            ))}
            <div className="flex gap-3"><button onClick={uploadActivityAttachments} className={smallButtonPrimary}>Upload Attachments</button><div className="text-sm text-gray-500 self-center">Attachments are attempted to upload to the server if supported.</div></div>
          </section>

        </div>

        {/* Right column: compact preview + quick actions */}
          <aside className="hidden lg:block profile-aside">
            <section className={`${cardClass} sticky top-6 w-80 p-4`}>
                  <div className="flex flex-col items-center">
                    <div className="w-28 h-28 rounded-full overflow-hidden shadow-inner mb-3 ring-2 ring-indigo-200">
                      <img src={profileImagePreview || resolveAsset(draft.profileImage) || defaultAvatar} alt="preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-lg">{draft.fullName || 'Your Name'}</div>
                      <div className="text-sm text-gray-500 mt-1">{draft.headline || 'Your headline'}</div>
                    </div>
                  </div>
              <div className="mt-4 text-sm">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${submitted ? 'bg-yellow-100 text-yellow-800' : (saved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700')}`}>{submitted ? 'Submitted' : (saved ? 'Saved' : 'Unsaved')}</span>
              </div>
              <div className="mt-4">
                <div className="text-sm font-semibold mb-1">Quick Actions</div>
                <div className="flex flex-col gap-2">
                  <button onClick={saveAll} className={buttonPrimary}>Save</button>
                  <button onClick={submitProfile} className={buttonSecondary}>Submit</button>
                </div>
              </div>
                </section>
        </aside>
      </div>

      {/* Floating popup notification on the right to show success/error in real-time */}
      {message && (
        <div className="fixed right-6 top-20 z-50 transition-opacity duration-300 ease-in-out">
          <div className={`px-4 py-3 rounded-lg shadow-lg max-w-xs ring-1 ${messageType === 'success' ? 'bg-green-50 ring-green-200 text-green-800' : (messageType === 'error' ? 'bg-red-50 ring-red-200 text-red-800' : 'bg-gray-50 ring-gray-200 text-gray-800')}`} role="status" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm">{message}</div>
              <button onClick={() => { setMessage(''); setMessageType(''); }} className="text-xs text-gray-600 ml-2 px-2 py-1 hover:bg-gray-100 rounded">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating error panel showing detailed validation messages */}
      {Object.keys(errors || {}).length > 0 && (
        <div className="fixed right-6 top-40 z-50 max-w-sm transition-transform duration-200">
          <div className="bg-white border border-red-300 shadow-lg rounded-lg px-4 py-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-red-700">Form contains errors</div>
                <div className="text-xs text-gray-500">Click an item to jump to the field</div>
              </div>
              <div>
                <button onClick={() => setErrors({})} className="text-xs text-gray-600 px-2 py-1 hover:bg-gray-100 rounded">Dismiss</button>
              </div>
            </div>
            <ul className="mt-2 space-y-2 max-h-60 overflow-auto">
              {Object.keys(errors).map((k) => (
                <li key={k}>
                  <button onClick={() => focusField(k)} className="w-full text-left flex items-center justify-between text-sm">
                    <span className="text-red-600">{prettyErrorLabel(k)}</span>
                    <span className="text-xs text-gray-600 ml-2">{errors[k]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default MyProfile;