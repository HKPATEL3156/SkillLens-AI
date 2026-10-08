import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Profile APIs
export const getProfile = () => api.get("/profile/me");
export const patchProfile = (data) => api.patch("/profile", data);
export const uploadProfilePhoto = (file) => {
  const formData = new FormData();
  formData.append("profileImage", file);
  return api.post("/profile/photo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const uploadResume = (file) => {
  const formData = new FormData();
  formData.append("resume", file);
  return api.post("/profile/resume", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const uploadEducationResult = (file, educationIndex) => {
  const formData = new FormData();
  formData.append("file", file);
  if (educationIndex !== undefined && educationIndex !== null)
    formData.append("educationIndex", String(educationIndex));
  return api.post("/profile/education/result", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Career (legacy) APIs kept for compatibility
export const getCareer = () => api.get("/career/me");
export const updateCareer = (data) => api.post("/career/me", data);
export const uploadCareerResume = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/career/upload-resume", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const uploadResult = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/career/upload-result", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const downloadCareerResume = () =>
  api.get("/career/download-resume", { responseType: "blob" });
export const downloadResult = () =>
  api.get("/career/download-result", { responseType: "blob" });

// Backwards-compatible aliases used by some pages
export const downloadResume = () =>
  api.get("/career/download-resume", { responseType: "blob" });

// Career eligibility and evaluated skills APIs
export const getEligibility = () => api.get("/career/eligibility");
export const saveQualifiedSkills = (skills) =>
  api.post("/career/save-qualified", { skills });
export const saveRoleForCareer = (role) =>
  api.post("/career/save-role", { role });

// Quiz endpoints
export const getQuestions = (attemptId) =>
  api.get(`/quiz/questions${attemptId ? `?attemptId=${attemptId}` : ""}`);
export const startQuiz = (data) => api.post("/quiz/start", data);
export const submitQuiz = (data) => api.post("/quiz/submit", data);
export const saveQuizCheckpoint = (data) => api.post("/quiz/save", data);
export const getQuizAttempts = () => api.get("/quiz/attempts");
export const getQuizAttemptById = (id) => api.get(`/quiz/attempts/${id}`);
export const generateQuiz = (data) => api.post("/quiz/generate", data);
export const getGenerateStatus = (jobId) =>
  api.get(`/quiz/generate/status?jobId=${jobId}`);
export const getGenerateLogs = (jobId) =>
  api.get(`/quiz/generate/logs?jobId=${jobId}`);
export const getPaperStatus = () => api.get("/quiz/paper-status");

// Resume ATS & Review endpoints
export const getCurrentResumeATS = () => api.get("/ats/current");
export const analyzeResumeATS = (data) => api.post("/ats/analyze", data);
export const getATSHistory = () => api.get("/ats/history");
export const getATSAnalysisById = (id) => api.get(`/ats/analysis/${id}`);
export const uploadAndAnalyzeResumeATS = (formData) =>
  api.post("/ats/upload-analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// AI Mock Interview endpoints
export const getMockInterviews = () => api.get("/interview/list");
export const getInterviewStats = () => api.get("/interview/stats");
export const getMockInterviewById = (id) => api.get(`/interview/${id}`);
export const startMockInterview = (data) => api.post("/interview/start", data);
export const saveInterviewAnswer = (id, data) => api.post(`/interview/${id}/answer`, data);
export const finishMockInterview = (id, data) => api.post(`/interview/${id}/finish`, data);
export const deleteMockInterview = (id) => api.delete(`/interview/${id}`);

export const changePassword = (data) => api.post("/auth/change-password", data);
export const deleteAccount = () => api.delete("/auth/delete-account");

export default api;

// --- Admin APIs ---
export const adminDashboard = () => api.get("/admin/dashboard");
export const adminListUsers = (params) => api.get("/admin/users", { params });
export const adminGetUser = (id) => api.get(`/admin/user/${id}`);
export const adminUpdateUser = (id, data) => api.put(`/admin/user/${id}`, data);
export const adminDeleteUser = (id) => api.delete(`/admin/user/${id}`);
export const adminBlockUser = (id, action) =>
  api.patch(`/admin/user/${id}/block`, { action });

export const adminListCompanies = (params) =>
  api.get("/admin/companies", { params });
export const adminGetCompany = (id) => api.get(`/admin/company/${id}`);
export const adminUpdateCompany = (id, data) =>
  api.put(`/admin/company/${id}`, data);
export const adminDeleteCompany = (id) => api.delete(`/admin/company/${id}`);
export const adminBlockCompany = (id, action) =>
  api.patch(`/admin/company/${id}/block`, { action });
export const adminApproveCompany = (id) =>
  api.put(`/admin/company/${id}/approve`);
export const adminRejectCompany = (id) =>
  api.put(`/admin/company/${id}/reject`);

export const adminListJobs = (params) => api.get("/admin/jobs", { params });
export const adminGetJob = (id) => api.get(`/admin/job/${id}`);
export const adminDeleteJob = (id) => api.delete(`/admin/job/${id}`);
export const adminUpdateJob = (id, data) => api.put(`/admin/job/${id}`, data);

export const adminReports = (params) => api.get("/admin/reports", { params });

export const adminCreate = (data) => api.post("/admin/create", data);
export const adminChangePassword = (data) => api.put("/admin/password", data);
export const adminGetSettings = () => api.get("/admin/settings");

export const adminGetProfile = () => api.get("/admin/profile");
export const adminUpdateProfile = (data) => api.put("/admin/profile", data);

// --- Company / Recruiter APIs ---
// Company profile & activity use the profile and activity routes which support recruiter via auth middleware
export const companyGetProfile = () => api.get("/profile/me");
export const companyUpdateProfile = (data) => api.patch("/profile", data);
export const companyGetActivity = () => api.get("/activity/me");

// Recruiter-specific endpoints
export const companyDashboard = () => api.get("/recruiter/dashboard");
export const companyGetApplicants = (jobId, params) =>
  api.get(`/recruiter/job/${jobId}/applicants`, { params });
export const companyUploadDocuments = (formData) =>
  api.post(`/recruiter/company/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const companyUpdateApplicationStatus = (id, data) =>
  api.patch(`/recruiter/application/${id}/status`, data);
export const companyGetNotifications = (params) =>
  api.get(`/recruiter/notifications`, { params });
export const companyMarkNotificationRead = (id) =>
  api.patch(`/recruiter/notifications/${id}/read`);
export const companyGetRecruiterActivity = (limit) =>
  api.get(`/recruiter/activity`, { params: { limit } });
export const companyGetCandidate = (id, jobId) =>
  api.get(`/recruiter/candidate/${id}`, { params: { jobId } });

// Recruiter job endpoints
export const companyListJobs = (params) =>
  api.get("/recruiter/jobs", { params });
export const companyCreateJob = (data) => api.post("/recruiter/jobs", data);
export const companyUpdateJob = (id, data) =>
  api.put(`/recruiter/jobs/${id}`, data);
export const companyDeleteJob = (id) => api.delete(`/recruiter/jobs/${id}`);
export const companyGetJob = (id) => api.get(`/recruiter/jobs/${id}`);

// Multipart endpoints that accept PDFs
export const companyCreateJobMultipart = (formData) =>
  api.post(`/recruiter/job`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const companyUpdateJobMultipart = (id, formData) =>
  api.put(`/recruiter/job/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Public user-facing job APIs
export const listPublicJobs = (params) => api.get("/jobs", { params });
export const getPublicJob = (id) => api.get(`/jobs/${id}`);
export const applyToJob = (id, formData) =>
  api.post(`/jobs/${id}/apply`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const getMyApplications = () => api.get("/jobs/my/applications");
export const getMyApplicationForJob = (id) => api.get(`/jobs/${id}/application`);

