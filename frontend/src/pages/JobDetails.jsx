import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { companyGetJob, companyGetApplicants } from '../services/api';

const JobDetails = ()=>{
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let mounted = true;
    companyGetJob(id).then(res=>{
      if (!mounted) return;
      setJob(res.data.job);
      setMetrics(res.data.metrics);
      setRecent(res.data.recentApplicants || []);
    }).catch(e=>{ console.error(e); }).finally(()=>{ if (mounted) setLoading(false); });
    return ()=> mounted = false;
  }, [id]);

  if (loading) return <div>Loading job...</div>;
  if (!job) return <div>Job not found</div>;

  return (
    <div>
      <div className="bg-white rounded shadow p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <div className="text-sm text-gray-600">
              {typeof job.location === 'string'
                ? job.location
                : job.location
                ? [job.location.address, job.location.city, job.location.state, job.location.country].filter(Boolean).join(', ')
                : '—'} • {job.employmentType}
            </div>
          </div>
          <div>
            <button onClick={()=>navigate('/company/jobs')} className="px-3 py-1 bg-gray-200 rounded">Back</button>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="font-semibold">Description</h3>
          <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{job.description}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="p-3 bg-indigo-50 rounded">
            <div className="text-sm text-gray-500">Total applicants</div>
            <div className="text-xl font-bold">{metrics?.totalApplicants || 0}</div>
          </div>
          <div className="p-3 bg-green-50 rounded">
            <div className="text-sm text-gray-500">Shortlisted</div>
            <div className="text-xl font-bold">{metrics?.shortlisted || 0}</div>
          </div>
          <div className="p-3 bg-red-50 rounded">
            <div className="text-sm text-gray-500">Rejected</div>
            <div className="text-xl font-bold">{metrics?.rejected || 0}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded shadow p-4">
        <h3 className="font-semibold mb-2">Recent applicants</h3>
        {recent.length===0 ? <div className="text-sm text-gray-500">No recent applicants</div> : (
          <ul>
            {recent.map(a=> (
              <li key={a._id} className="border-b py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{a.userId?.fullName || a.user?.fullName || 'Candidate'}</div>
                    <div className="text-xs text-gray-500">{a.userId?.email || a.user?.email}</div>
                  </div>
                  <div className="text-sm text-gray-600">Score: {a.quizScore || 0}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default JobDetails;
