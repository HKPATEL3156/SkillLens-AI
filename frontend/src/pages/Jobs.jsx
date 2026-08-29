import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { listPublicJobs } from "../services/api";
import { FiSearch, FiMapPin, FiBriefcase, FiClock, FiChevronLeft, FiChevronRight, FiFilter, FiDollarSign } from "react-icons/fi";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
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
    fetchJobs({ search: params.get("q") || params.get("search"), role: params.get("role") });
  }, [page]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs({ search: query });
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Dynamic Header Section */}
      <div className="bg-slate-900 pt-20 pb-28 px-4 relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl"></div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            Find Your <span className="text-indigo-400">Dream Career</span>
          </h1>
          <p className="text-slate-400 font-medium mb-10 max-w-xl mx-auto">
            Browse through thousands of high-growth opportunities from top-tier companies.
          </p>
          
          <form onSubmit={onSearch} className="max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row items-center bg-white/5 backdrop-blur-md p-2 rounded-3xl border border-white/10 shadow-2xl">
              <div className="flex flex-1 items-center w-full px-4 border-b md:border-b-0 md:border-r border-white/10 py-3 md:py-0">
                <FiSearch className="text-indigo-400 text-xl shrink-0" />
                <input 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                  placeholder="Job title, keywords, or company..." 
                  className="w-full bg-transparent border-none outline-none text-white px-4 font-medium placeholder:text-slate-500" 
                />
              </div>
              <button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-indigo-600/30 mt-2 md:mt-0">
                Find Jobs
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-12 relative z-20">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Listings Column */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60">
              <div className="flex items-center gap-2">
                <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
                <span className="text-sm font-black text-slate-800 uppercase tracking-wider">{total} Opportunities Open</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <FiFilter /> Sort by: <span className="text-indigo-600">Newest First</span>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-slate-200">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Syncing with SkillLens AI...</p>
              </div>
            ) : (
              <>
                <div className="grid gap-5">
                  {jobs.map((job) => (
                    <div key={job._id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100 transition-all group relative overflow-hidden">
                      {/* Interaction Glow */}
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="flex flex-col md:flex-row md:items-center gap-6">
                        {/* Company Logo container */}
                        <div className="w-20 h-20 bg-slate-50 flex items-center justify-center rounded-3xl border border-slate-100 flex-shrink-0 group-hover:bg-white group-hover:rotate-3 transition-all duration-300">
                          {job.companyId?.documents?.logo ? (
                            <img src={job.companyId.documents.logo} alt="logo" className="w-12 h-12 object-contain rounded-lg" />
                          ) : (
                            <HiOutlineBuildingOffice2 className="text-3xl text-slate-300" />
                          )}
                        </div>
                        
                        <div className="flex-grow min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                             <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{job.title}</h3>
                             {job.job_type === 'full-time' && (
                               <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-100">Featured</span>
                             )}
                          </div>
                          
                          <p className="text-indigo-600 font-bold text-base mb-4 flex items-center gap-1.5">
                            {job.companyId?.company_name}
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className="text-slate-400 text-sm">{job.job_category || 'General'}</span>
                          </p>

                          <div className="flex flex-wrap gap-y-2 gap-x-5 text-xs font-bold text-slate-500">
                            <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full"><FiMapPin className="text-indigo-500" /> {job.location?.city || 'Remote'}</span>
                            <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full uppercase"><FiBriefcase className="text-indigo-500" /> {job.job_type}</span>
                            <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full"><FiClock className="text-indigo-500" /> {new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>

                        <div className="flex flex-col md:items-end gap-4 min-w-[140px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                          <div className="text-right">
                             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Offered Salary</div>
                             <div className="text-lg font-black text-slate-900 flex items-center md:justify-end gap-1">
                               <FiDollarSign className="text-indigo-600" />
                               {job.salary_min ? `₹${(job.salary_min / 100000).toFixed(1)}L+` : 'Best in Industry'}
                             </div>
                          </div>
                          <Link to={`/jobs/${job._id}`} className="w-full bg-slate-900 hover:bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black transition-all text-center text-sm shadow-lg shadow-slate-200">
                            Apply Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {jobs.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                      <FiSearch className="mx-auto text-5xl text-slate-200 mb-4" />
                      <h3 className="text-xl font-bold text-slate-400">No matches found for "{query}"</h3>
                      <button onClick={() => {setQuery(""); fetchJobs();}} className="mt-4 text-indigo-600 font-bold hover:underline">Clear all filters</button>
                    </div>
                  )}
                </div>

                {/* Modern Pagination */}
                <div className="mt-16 flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                  <div className="text-sm font-bold text-slate-400 order-2 md:order-1">
                    Showing <span className="text-slate-900">{jobs.length}</span> of <span className="text-slate-900">{total}</span> opportunities
                  </div>
                  
                  <div className="flex items-center gap-3 order-1 md:order-2">
                    <button 
                      disabled={page <= 1} 
                      onClick={() => setPage(p => p - 1)} 
                      className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                    >
                      <FiChevronLeft size={20} />
                    </button>
                    
                    <div className="flex items-center gap-1">
                       <span className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-200">
                         {page}
                       </span>
                       <span className="text-slate-300 px-1 font-bold">/</span>
                       <span className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-xl font-bold">
                         {totalPages}
                       </span>
                    </div>

                    <button 
                      disabled={page >= totalPages} 
                      onClick={() => setPage(p => p + 1)} 
                      className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                    >
                      <FiChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Jobs;