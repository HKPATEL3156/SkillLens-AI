import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyApplications } from "../services/api";
import {
  FiBriefcase,
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiSearch,
  FiFileText,
  FiExternalLink,
  FiCalendar,
  FiChevronRight,
  FiFilter,
  FiArrowRight,
} from "react-icons/fi";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";

const backendBase = import.meta?.env?.VITE_API_BASE || "http://localhost:5000";

const resolveAsset = (p) => {
  if (!p) return null;
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  const clean = p.startsWith("/") ? p : `/${p}`;
  return `${backendBase}${clean}`;
};

const getStageBadge = (stage, status) => {
  const effective = (stage || status || "applied").toLowerCase();

  if (effective === "selected" || effective === "hired") {
    return {
      label: "Selected / Hired",
      bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
      dot: "bg-emerald-500",
      step: 4,
      desc: "Congratulations! You have been selected for this position.",
    };
  }
  if (effective === "interview") {
    return {
      label: "Interview Scheduled",
      bg: "bg-purple-50 border-purple-200 text-purple-700",
      dot: "bg-purple-500",
      step: 3,
      desc: "The recruiter has scheduled an interview round.",
    };
  }
  if (effective === "shortlisted") {
    return {
      label: "Shortlisted",
      bg: "bg-indigo-50 border-indigo-200 text-indigo-700",
      dot: "bg-indigo-500",
      step: 2,
      desc: "Your profile passed initial screening and has been shortlisted.",
    };
  }
  if (effective === "rejected") {
    return {
      label: "Not Selected",
      bg: "bg-rose-50 border-rose-200 text-rose-700",
      dot: "bg-rose-500",
      step: -1,
      desc: "Thank you for applying. The recruiter has chosen other candidates for this role.",
    };
  }
  return {
    label: "Under Review",
    bg: "bg-amber-50 border-amber-200 text-amber-700",
    dot: "bg-amber-500",
    step: 1,
    desc: "Your application is successfully submitted and pending recruiter review.",
  };
};

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getMyApplications();
      setApplications(res.data.applications || []);
    } catch (e) {
      console.error("Failed to load applications", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = applications.filter((app) => {
    const job = app.jobId || {};
    const company = job.companyId || {};
    const titleMatch = (job.title || "").toLowerCase().includes(search.toLowerCase());
    const companyMatch = (company.company_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesSearch = !search || titleMatch || companyMatch;

    const effective = (app.pipelineStage || app.status || "applied").toLowerCase();
    if (filter === "all") return matchesSearch;
    if (filter === "review") return matchesSearch && (effective === "applied");
    if (filter === "shortlisted") return matchesSearch && (effective === "shortlisted");
    if (filter === "interview") return matchesSearch && (effective === "interview");
    if (filter === "selected") return matchesSearch && (effective === "selected" || effective === "hired");
    if (filter === "rejected") return matchesSearch && (effective === "rejected");
    return matchesSearch;
  });

  const counts = {
    total: applications.length,
    review: applications.filter((a) => (a.pipelineStage || a.status || "applied") === "applied").length,
    shortlisted: applications.filter((a) => (a.pipelineStage || a.status) === "shortlisted").length,
    interview: applications.filter((a) => (a.pipelineStage || a.status) === "interview").length,
    selected: applications.filter((a) => ["selected", "hired"].includes(a.pipelineStage || a.status)).length,
    rejected: applications.filter((a) => (a.pipelineStage || a.status) === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header Section */}
      <div className="bg-slate-900 pt-16 pb-24 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3">
                <FiBriefcase /> Application Tracker
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                My <span className="text-indigo-400">Applications</span>
              </h1>
              <p className="text-slate-400 font-medium text-sm md:text-base mt-2">
                Track status updates and direct decisions from hiring companies.
              </p>
            </div>

            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-600/30 transition-all self-start md:self-auto text-sm"
            >
              <span>Explore More Jobs</span>
              <FiArrowRight />
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Applied</div>
              <div className="text-2xl font-black text-white mt-1">{counts.total}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">Under Review</div>
              <div className="text-2xl font-black text-white mt-1">{counts.review}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">Shortlisted / Interview</div>
              <div className="text-2xl font-black text-white mt-1">{counts.shortlisted + counts.interview}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Offers / Selected</div>
              <div className="text-2xl font-black text-white mt-1">{counts.selected}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-20">
        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { key: "all", label: "All", count: counts.total },
              { key: "review", label: "Under Review", count: counts.review },
              { key: "shortlisted", label: "Shortlisted", count: counts.shortlisted },
              { key: "interview", label: "Interview", count: counts.interview },
              { key: "selected", label: "Selected", count: counts.selected },
              { key: "rejected", label: "Not Selected", count: counts.rejected },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  filter === t.key
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    filter === t.key ? "bg-white/20 text-white" : "bg-slate-200/70 text-slate-700"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search applied jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Applications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 py-20 px-4 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
              <FiBriefcase size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">No applications found</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
              {search || filter !== "all"
                ? "No applications matched your filter criteria. Try resetting your search."
                : "You haven't submitted any job applications yet. Start exploring top career opportunities!"}
            </p>
            {search || filter !== "all" ? (
              <button
                onClick={() => {
                  setFilter("all");
                  setSearch("");
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                to="/jobs"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-indigo-100 text-sm transition-all"
              >
                <span>Browse Available Jobs</span>
                <FiChevronRight />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {filtered.map((app) => {
              const job = app.jobId || {};
              const company = job.companyId || {};
              const badge = getStageBadge(app.pipelineStage, app.status);
              const logoUrl = resolveAsset(company.documents?.logo);
              const resumeUrl = resolveAsset(app.resumePath);

              return (
                <div
                  key={app._id}
                  className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-50 transition-all relative overflow-hidden group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left: Job & Company Info */}
                    <div className="flex items-start gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Company logo" className="w-10 h-10 object-contain" />
                        ) : (
                          <HiOutlineBuildingOffice2 className="text-2xl text-slate-400" />
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Link
                            to={`/jobs/${job._id}`}
                            className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors"
                          >
                            {job.title || "Untitled Role"}
                          </Link>
                          {job.job_type && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {job.job_type}
                            </span>
                          )}
                        </div>

                        <div className="text-sm font-bold text-indigo-600 mb-3">
                          {company.company_name || "Company"}
                        </div>

                        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs font-semibold text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <FiMapPin className="text-indigo-500" />
                            {typeof job.location === "object"
                              ? job.location?.city || "Remote"
                              : job.location || "Remote"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <FiCalendar className="text-indigo-500" /> Applied:{" "}
                            {new Date(app.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          {resumeUrl && (
                            <a
                              href={resumeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 underline font-bold"
                            >
                              <FiFileText /> View Submitted Resume
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Decision Status & Quick Action */}
                    <div className="flex flex-col sm:flex-row sm:items-center lg:flex-col lg:items-end gap-3 shrink-0 border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0">
                      <div className="flex flex-col sm:items-end">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                          Company Decision
                        </div>
                        <div
                          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold ${badge.bg}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                          <span>{badge.label}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <Link
                          to={`/jobs/${job._id}`}
                          className="px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <span>View Details &amp; Decision</span>
                          <FiExternalLink size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Visual Status Progress Tracker */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="text-xs text-slate-600 font-medium">{badge.desc}</div>
                      <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <FiClock size={12} /> Last updated:{" "}
                        {new Date(app.updatedAt || app.createdAt).toLocaleString()}
                      </div>
                    </div>

                    {badge.step > 0 && (
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${(badge.step / 4) * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
