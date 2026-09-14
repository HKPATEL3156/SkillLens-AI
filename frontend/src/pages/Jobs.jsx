import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { listPublicJobs, getMyApplications } from "../services/api";
import {
  FiSearch,
  FiMapPin,
  FiBriefcase,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiDollarSign,
  FiCheck,
  FiCalendar,
  FiUsers,
  FiLayers,
  FiCheckCircle,
  FiShield,
} from "react-icons/fi";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { formatSalary } from "../utils/salary";

const backendBase = import.meta?.env?.VITE_API_BASE || "http://localhost:5000";

const resolveAsset = (p) => {
  if (!p) return null;
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  const clean = p.startsWith("/") ? p : `/${p}`;
  return `${backendBase}${clean}`;
};

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [appliedCount, setAppliedCount] = useState(0);

  // Filters
  const [workModeFilter, setWorkModeFilter] = useState("all");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");

  const location = useLocation();

  const fetchJobs = async ({ search = "", role = "" } = {}) => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (role) params.role = role;
      const res = await listPublicJobs(params);
      setJobs(res.data.jobs || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Load user applications to mark already applied jobs
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    getMyApplications()
      .then((res) => {
        const apps = res.data.applications || [];
        setAppliedCount(apps.length);
        const ids = new Set(
          apps.map((a) => (a.jobId?._id ? String(a.jobId._id) : String(a.jobId)))
        );
        setAppliedJobIds(ids);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const role = params.get("role") || "";
    const q = params.get("q") || params.get("search") || "";
    if (role || q) {
      setQuery(role || q);
      setPage(1);
      fetchJobs({ role, search: q });
    } else {
      setPage(1);
      fetchJobs();
    }
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    fetchJobs({
      search: params.get("q") || params.get("search"),
      role: params.get("role"),
    });
  }, [page]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs({ search: query });
  };

  // Client-side quick filter
  const displayedJobs = jobs.filter((j) => {
    if (workModeFilter !== "all") {
      const mode = (j.work_mode || "").toLowerCase();
      if (!mode.includes(workModeFilter.toLowerCase())) return false;
    }
    if (jobTypeFilter !== "all") {
      const t = (j.job_type || "").toLowerCase();
      if (!t.includes(jobTypeFilter.toLowerCase())) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header Section */}
      <div className="bg-slate-900 pt-16 pb-28 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl"></div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Top Quick Navigation Tabs */}
          <div className="inline-flex items-center gap-2 p-1.5 bg-white/10 backdrop-blur-md rounded-2xl mb-6 border border-white/15">
            <span className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md">
              Available Jobs
            </span>
            <Link
              to="/dashboard/applications"
              className="px-5 py-2 rounded-xl text-slate-300 hover:text-white font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <span>My Applications</span>
              {appliedCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-[10px] font-black">
                  {appliedCount}
                </span>
              )}
            </Link>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight">
            Find Your <span className="text-indigo-400">Next Role</span>
          </h1>
          <p className="text-slate-400 font-medium text-sm md:text-base mb-8 max-w-xl mx-auto">
            Discover verified tech opportunities tailored to your skills and qualifications.
          </p>

          <form onSubmit={onSearch} className="max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row items-center bg-white/10 backdrop-blur-md p-2 rounded-3xl border border-white/15 shadow-2xl">
              <div className="flex flex-1 items-center w-full px-4 border-b md:border-b-0 md:border-r border-white/10 py-3 md:py-0">
                <FiSearch className="text-indigo-400 text-xl shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by job title, skill keywords, or company..."
                  className="w-full bg-transparent border-none outline-none text-white px-4 font-medium text-sm placeholder:text-slate-400"
                />
              </div>
              <button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-600/30 mt-2 md:mt-0 text-sm">
                Find Jobs
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-12 relative z-20">
        {/* Filter and Control Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-indigo-600 rounded-full"></div>
            <span className="text-sm font-black text-slate-800 uppercase tracking-wider">
              {total} Opportunities Open
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
            {/* Work Mode Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">Mode:</span>
              {["all", "remote", "hybrid", "onsite"].map((m) => (
                <button
                  key={m}
                  onClick={() => setWorkModeFilter(m)}
                  className={`px-3 py-1.5 rounded-xl capitalize transition-all ${
                    workModeFilter === m
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Job Type Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">Type:</span>
              {["all", "full-time", "internship"].map((t) => (
                <button
                  key={t}
                  onClick={() => setJobTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-xl capitalize transition-all ${
                    jobTypeFilter === t
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {t === "all" ? "All" : t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Jobs Listings */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
              Loading Opportunities...
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-5">
              {displayedJobs.map((job) => {
                const isApplied = appliedJobIds.has(String(job._id));
                const logo = resolveAsset(job.companyId?.documents?.logo);
                const isDeadlinePassed =
                  job.application_deadline && new Date(job.application_deadline) < new Date();

                return (
                  <div
                    key={job._id}
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50 transition-all group relative overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      {/* Company Logo container */}
                      <div className="w-20 h-20 bg-slate-50 flex items-center justify-center rounded-2xl border border-slate-100 shrink-0 group-hover:bg-white transition-all overflow-hidden">
                        {logo ? (
                          <img src={logo} alt="Company logo" className="w-14 h-14 object-contain rounded-lg" />
                        ) : (
                          <HiOutlineBuildingOffice2 className="text-3xl text-slate-300" />
                        )}
                      </div>

                      <div className="flex-grow min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <Link
                            to={`/jobs/${job._id}`}
                            className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight"
                          >
                            {job.title}
                          </Link>
                          {job.job_type === "full-time" && (
                            <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-100">
                              Full-time
                            </span>
                          )}
                          {isApplied && (
                            <span className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                              <FiCheck size={12} /> Applied
                            </span>
                          )}
                          {isDeadlinePassed && (
                            <span className="text-[10px] font-bold uppercase bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md">
                              Closed
                            </span>
                          )}
                        </div>

                        <p className="text-indigo-600 font-bold text-sm mb-3 flex items-center gap-1.5">
                          <span>{job.companyId?.company_name || "Company"}</span>
                          {job.companyId?.is_verified && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200"
                              title="Verified Placement Partner"
                            >
                              <FiCheckCircle size={12} /> Verified
                            </span>
                          )}
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span className="text-slate-500 font-medium text-xs">
                            {job.job_category || job.job_role || "Technology"}
                          </span>
                        </p>

                        {/* Required Skills Chips */}
                        {job.required_skills && job.required_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {job.required_skills.slice(0, 4).map((s, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold"
                              >
                                {s}
                              </span>
                            ))}
                            {job.required_skills.length > 4 && (
                              <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-lg text-[11px] font-bold">
                                +{job.required_skills.length - 4} more
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-y-1.5 gap-x-4 text-xs font-semibold text-slate-500">
                          <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full">
                            <FiMapPin className="text-indigo-500" />
                            {typeof job.location === "object"
                              ? job.location?.city || "Remote"
                              : job.location || "Remote"}
                          </span>
                          <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full uppercase">
                            <FiBriefcase className="text-indigo-500" /> {job.work_mode || job.job_type}
                          </span>
                          <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full">
                            <FiClock className="text-indigo-500" />{" "}
                            {new Date(job.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Right Salary and Action Column */}
                      <div className="flex flex-col md:items-end gap-3 min-w-[160px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                        <div className="text-left md:text-right">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                            Salary Range
                          </div>
                          <div className="text-base font-black text-slate-900 flex items-center md:justify-end">
                            {formatSalary(job.salary_min, job.salary_max, job.currency)}
                          </div>
                        </div>

                        <Link
                          to={`/jobs/${job._id}`}
                          className={`w-full py-3 px-6 rounded-2xl font-bold text-center text-xs transition-all shadow-sm ${
                            isApplied
                              ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                              : "bg-slate-900 hover:bg-indigo-600 text-white"
                          }`}
                        >
                          {isApplied ? "View Status & Decision" : "View Details & Apply"}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}

              {displayedJobs.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <FiSearch className="mx-auto text-4xl text-slate-300 mb-3" />
                  <h3 className="text-lg font-bold text-slate-700">No matching jobs found</h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Try modifying your search keywords or resetting filters.
                  </p>
                  <button
                    onClick={() => {
                      setQuery("");
                      setWorkModeFilter("all");
                      setJobTypeFilter("all");
                      fetchJobs();
                    }}
                    className="mt-4 px-5 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-4 px-2">
                <div className="text-xs font-bold text-slate-400">
                  Showing <span className="text-slate-800">{jobs.length}</span> of{" "}
                  <span className="text-slate-800">{total}</span> positions
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
                  >
                    <FiChevronLeft />
                  </button>

                  <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
                    <span className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl">
                      {page}
                    </span>
                    <span className="text-slate-400">/</span>
                    <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl">
                      {totalPages}
                    </span>
                  </div>

                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Jobs;