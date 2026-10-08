import React, { useState, useEffect, useCallback } from 'react';
import {
  FaUserGraduate,
  FaPlus,
  FaSearch,
  FaEye,
  FaPlay,
  FaTrashAlt,
  FaAward,
  FaClock,
  FaChartLine,
  FaCheckCircle,
  FaBriefcase,
  FaBuilding,
  FaRedo,
  FaExclamationCircle,
  FaArrowRight
} from 'react-icons/fa';
import {
  getMockInterviews,
  getInterviewStats,
  deleteMockInterview,
  getMockInterviewById
} from '../services/api';
import InterviewSetupModal from '../components/interview/InterviewSetupModal';
import ActiveInterviewRoom from '../components/interview/ActiveInterviewRoom';
import InterviewReviewModal from '../components/interview/InterviewReviewModal';

const MockInterviewPage = () => {
  // Data state
  const [interviews, setInterviews] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, avgScore: 0, topScore: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'completed' | 'in_progress'

  // Modals & Active State
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [initialRoleForSetup, setInitialRoleForSetup] = useState('');
  const [activeInterview, setActiveInterview] = useState(null); // When set, enters Active Interview Room
  const [reviewInterview, setReviewInterview] = useState(null); // When set, opens Review Modal
  const [deletingId, setDeletingId] = useState(null);

  // Fetch interviews & stats
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [listRes, statsRes] = await Promise.all([
        getMockInterviews(),
        getInterviewStats().catch(() => ({ data: { totalInterviews: 0, averageScore: 0, bestScore: 0 } }))
      ]);

      const items = listRes.data?.interviews || [];
      setInterviews(items);

      const rawStats = statsRes.data?.stats || statsRes.data || {};
      const completedCount = items.filter((i) => i.status === 'completed').length;
      
      setStats({
        total: rawStats.totalInterviews ?? items.length,
        completed: completedCount,
        avgScore: rawStats.averageScore ?? 0,
        topScore: rawStats.bestScore ?? 0,
      });
    } catch (err) {
      console.error('Error fetching mock interview data:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load interviews. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle interview started from setup modal
  const handleInterviewStarted = (newInterview) => {
    setIsSetupOpen(false);
    setActiveInterview(newInterview);
  };

  // Handle active interview completed
  const handleInterviewCompleted = (finishedInterview) => {
    setActiveInterview(null);
    setReviewInterview(finishedInterview);
    fetchDashboardData();
  };

  // Handle view review
  const handleViewReview = async (interview) => {
    try {
      if (interview.evaluation && interview.evaluation.question_reviews) {
        setReviewInterview(interview);
      } else {
        const res = await getMockInterviewById(interview._id);
        setReviewInterview(res.data.interview);
      }
    } catch (err) {
      alert('Could not load detailed review: ' + (err.response?.data?.message || err.message));
    }
  };

  // Handle resume interview
  const handleResumeInterview = async (interview) => {
    try {
      const res = await getMockInterviewById(interview._id);
      setActiveInterview(res.data.interview);
    } catch (err) {
      alert('Could not resume interview: ' + (err.response?.data?.message || err.message));
    }
  };

  // Handle delete interview
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this mock interview record?')) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteMockInterview(id);
      setInterviews((prev) => prev.filter((item) => item._id !== id));
      fetchDashboardData();
    } catch (err) {
      alert('Failed to delete interview: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  // Retake from review modal
  const handleRetake = (interview) => {
    setReviewInterview(null);
    setInitialRoleForSetup(interview.targetRole || '');
    setIsSetupOpen(true);
  };

  // Filtered interviews list
  const filteredInterviews = interviews.filter((item) => {
    const matchesSearch =
      (item.targetRole || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.companyName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'completed'
        ? item.status === 'completed'
        : item.status === 'in_progress';

    return matchesSearch && matchesStatus;
  });

  // If in active interview mode, render the full-screen Active Interview Room
  if (activeInterview) {
    return (
      <ActiveInterviewRoom
        interview={activeInterview}
        onFinish={handleInterviewCompleted}
        onFinishInterview={handleInterviewCompleted}
        onExit={() => {
          setActiveInterview(null);
          fetchDashboardData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <FaUserGraduate className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI Mock Interview</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Live AI Evaluator
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-1 font-normal">
              Practice role-specific technical & behavioral interviews generated from your resume and targeted company JDs.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setInitialRoleForSetup('');
            setIsSetupOpen(true);
          }}
          className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-md hover:shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <FaPlus className="w-4 h-4" />
          <span>Take AI Mock Interview</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <FaBriefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Attempted</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{stats.total || interviews.length}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <FaCheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{stats.completed || 0}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <FaChartLine className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Score</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {stats.avgScore ? `${stats.avgScore}%` : 'N/A'}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <FaAward className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Score</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {stats.topScore ? `${stats.topScore}%` : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Filter & Search Controls */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="Search by role or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {['all', 'completed', 'in_progress'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                  statusFilter === s
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s === 'in_progress' ? 'In Progress' : s}
              </button>
            ))}
            <button
              onClick={fetchDashboardData}
              title="Refresh interviews"
              className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs transition-colors ml-1"
            >
              <FaRedo className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Interviews Table / Empty State */}
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading interview records...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-3">
            <FaExclamationCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredInterviews.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-6 text-center max-w-lg mx-auto space-y-5">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-inner">
              <FaUserGraduate className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                {interviews.length === 0 ? 'No Mock Interviews Yet' : 'No Interviews Match Your Filter'}
              </h3>
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                {interviews.length === 0
                  ? 'Step into a realistic, AI-generated interview tailored to your resume, chosen market role, and optional company JD. Practice answering questions and receive an in-depth scorecard with actionable feedback.'
                  : 'Try adjusting your search keywords or filter to find previous mock interview sessions.'}
              </p>
            </div>

            {interviews.length === 0 ? (
              <button
                onClick={() => {
                  setInitialRoleForSetup('');
                  setIsSetupOpen(true);
                }}
                className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs md:text-sm inline-flex items-center gap-2 shadow-md hover:shadow-indigo-200 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <FaPlus className="w-3.5 h-3.5" />
                <span>Take AI Mock Interview</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          /* Interviews Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Target Role & Company</th>
                  <th className="py-3.5 px-4">Interview Mode</th>
                  <th className="py-3.5 px-4 text-center">Progress</th>
                  <th className="py-3.5 px-4 text-center">Score</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredInterviews.map((item) => {
                  const answeredCount = item.answers ? item.answers.length : 0;
                  const totalCount = item.totalQuestions || item.questions?.length || 5;
                  const isCompleted = item.status === 'completed';
                  const scoreVal = item.score ?? item.evaluation?.overall_score;

                  return (
                    <tr
                      key={item._id}
                      onClick={() => (isCompleted ? handleViewReview(item) : handleResumeInterview(item))}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                    >
                      {/* Role & Company */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <FaBriefcase className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {item.targetRole}
                            </div>
                            {item.companyName ? (
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                                <FaBuilding className="text-slate-400 text-[10px]" />
                                <span>{item.companyName}</span>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 mt-0.5">General Market Standard</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Mode */}
                      <td className="py-4 px-4">
                        <span className="capitalize font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {item.interviewType || 'Comprehensive'}
                        </span>
                      </td>

                      {/* Progress */}
                      <td className="py-4 px-4 text-center">
                        <span className="font-semibold text-slate-700">
                          {answeredCount} / {totalCount} Qs
                        </span>
                      </td>

                      {/* Score */}
                      <td className="py-4 px-4 text-center">
                        {isCompleted && scoreVal !== undefined && scoreVal !== null ? (
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-black border inline-block ${
                              scoreVal >= 80
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : scoreVal >= 60
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {scoreVal}%
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <FaCheckCircle className="w-3 h-3" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <FaClock className="w-3 h-3" />
                            In Progress
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-slate-500 font-medium">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {isCompleted ? (
                            <button
                              onClick={() => handleViewReview(item)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition-colors border border-indigo-200"
                            >
                              <FaEye className="w-3 h-3" />
                              <span>View Review</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleResumeInterview(item)}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                            >
                              <FaPlay className="w-3 h-3" />
                              <span>Resume</span>
                            </button>
                          )}

                          <button
                            onClick={(e) => handleDelete(item._id, e)}
                            disabled={deletingId === item._id}
                            title="Delete Record"
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <FaTrashAlt className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Setup Modal */}
      {isSetupOpen && (
        <InterviewSetupModal
          isOpen={isSetupOpen}
          onClose={() => setIsSetupOpen(false)}
          onStartInterview={handleInterviewStarted}
          initialRole={initialRoleForSetup}
        />
      )}

      {/* Review Modal */}
      {reviewInterview && (
        <InterviewReviewModal
          interview={reviewInterview}
          onClose={() => setReviewInterview(null)}
          onRetake={handleRetake}
        />
      )}
    </div>
  );
};

export default MockInterviewPage;
