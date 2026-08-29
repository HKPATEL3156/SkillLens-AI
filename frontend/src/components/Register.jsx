import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";
import { FiUser, FiMail, FiLock, FiShield, FiBriefcase, FiMapPin, FiPhone, FiGlobe, FiFileText } from "react-icons/fi";
import { CheckCircle2 } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('user'); 

  const [data, setData] = useState({ name: "", email: "", password: "" });
  const [recData, setRecData] = useState({
    company_name: '', company_email: '', username: '', password: '',
    phone: '', address: '', city: '', state: '', country: '',
    established_year: '', total_employees: '', website: '', company_description: ''
  });
  const [recFiles, setRecFiles] = useState({ company_profile_pdf: null, registration_certificate: null, logo: null });
  const [logoPreview, setLogoPreview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);

    const nameRegex = /^[a-zA-Z\s]{3,50}$/;
    if (!nameRegex.test(data.name)) {
      setLoading(false);
      return setError("Name must be 3-50 characters long.");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      setLoading(false);
      return setError("Please enter a valid email.");
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(data.password)) {
      setLoading(false);
      return setError("Password must be at least 8 characters, with uppercase, number, and symbol.");
    }

    try {
      const response = await api.post('/auth/signup', data);
      setSuccess(response.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecruiterSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);

    if (!recData.company_name || !recData.company_email || !recData.username || !recData.password) {
      setLoading(false);
      return setError('Please fill in all required fields.');
    }
    if (!recFiles.company_profile_pdf) {
      setLoading(false);
      return setError('Please upload your company profile PDF.');
    }

    try {
      const form = new FormData();
      Object.entries(recData).forEach(([k,v])=>{ if (v) form.append(k, v); });
      if (recFiles.company_profile_pdf) form.append('company_profile_pdf', recFiles.company_profile_pdf);
      if (recFiles.registration_certificate) form.append('registration_certificate', recFiles.registration_certificate);
      if (recFiles.logo) form.append('logo', recFiles.logo);

      const resp = await api.post('/recruiter/register', form);
      setSuccess(resp.data.message || 'Registration complete - awaiting admin verification.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Organization registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const fileName = (f) => (f ? f.name : 'No file selected');

  useEffect(() => {
    let url = null;
    if (recFiles.logo) {
      url = URL.createObjectURL(recFiles.logo);
      setLogoPreview(url);
    } else setLogoPreview(null);
    return () => url && URL.revokeObjectURL(url);
  }, [recFiles.logo]);

  return (
    <Layout isLanding={true}>
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white relative overflow-hidden font-sans py-24 px-4">
        
        {/* Decorative Background Orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] -z-10 animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] -z-10" />

        <div className="w-full max-w-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-700/80 rounded-[2.5rem] overflow-hidden shadow-2xl p-6 md:p-10 relative">
          
          {/* Header branding / Brain Symbol */}
          <div className="flex items-center gap-3.5 mb-8 justify-center">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2.5 rounded-xl shadow-lg flex items-center justify-center w-10 h-10 shrink-0">
              <i className="fas fa-brain text-white text-md"></i>
            </div>
            <span className="text-xl font-black tracking-tight">
              SkillLens <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">AI</span>
            </span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-white tracking-tight">Create your account</h2>
            <p className="text-slate-400 text-sm mt-1">Join the intelligent candidate placement pipeline.</p>
          </div>

          {/* Toggle Candidate vs Recruiter */}
          <div className="flex bg-slate-950 p-1 mb-8 rounded-2xl border border-slate-700/80 max-w-md mx-auto">
            <button 
              onClick={() => { setMode('user'); setError(''); setSuccess(''); }} 
              className={`flex-grow py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${mode === 'user' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Candidate
            </button>
            <button 
              onClick={() => { setMode('recruiter'); setError(''); setSuccess(''); }} 
              className={`flex-grow py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${mode === 'recruiter' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Company / Recruiter
            </button>
          </div>

          {/* Error and Success alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-bold animate-in fade-in slide-in-from-top-2">
              <FiShield className="shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-400 text-sm font-bold animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="shrink-0 text-green-400" size={18} /> {success}
            </div>
          )}

          {/* Forms */}
          {mode === 'user' ? (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Full Name</label>
                <div className="relative group">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Jane Doe" 
                    value={data.name} 
                    onChange={(e) => setData({ ...data, name: e.target.value })} 
                    className="w-full bg-slate-950 border border-slate-705 border-slate-700 rounded-2xl px-12 py-4 focus:bg-slate-900/60 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-white placeholder-slate-500 transition-all font-medium text-sm"
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Email Address</label>
                <div className="relative group">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type="email" 
                    placeholder="name@university.com" 
                    value={data.email} 
                    onChange={(e) => setData({ ...data, email: e.target.value })} 
                    className="w-full bg-slate-950 border border-slate-705 border-slate-700 rounded-2xl px-12 py-4 focus:bg-slate-900/60 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-white placeholder-slate-500 transition-all font-medium text-sm"
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Password</label>
                <div className="relative group">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={data.password} 
                    onChange={(e) => setData({ ...data, password: e.target.value })} 
                    className="w-full bg-slate-950 border border-slate-705 border-slate-700 rounded-2xl px-12 py-4 focus:bg-slate-900/60 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-white placeholder-slate-500 transition-all font-medium text-sm"
                    required 
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-4 rounded-2xl shadow-xl shadow-blue-950/20 transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
                <button 
                  type="button" 
                  onClick={() => navigate('/login')} 
                  className="flex-1 bg-slate-950 border border-slate-700 hover:bg-slate-900 text-slate-300 font-extrabold py-4 rounded-2xl transition-all text-sm"
                >
                  Sign In Instead
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRecruiterSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Company Name', key: 'company_name', type: 'text', icon: <FiBriefcase /> },
                  { label: 'Company Email', key: 'company_email', type: 'email', icon: <FiMail /> },
                  { label: 'Portal Username', key: 'username', type: 'text', icon: <FiUser /> },
                  { label: 'Secure Password', key: 'password', type: 'password', icon: <FiLock /> },
                  { label: 'Phone Number', key: 'phone', type: 'text', icon: <FiPhone /> },
                  { label: 'Address', key: 'address', type: 'text', icon: <FiMapPin /> },
                  { label: 'City', key: 'city', type: 'text', icon: <FiMapPin /> },
                  { label: 'State', key: 'state', type: 'text', icon: <FiMapPin /> },
                  { label: 'Country', key: 'country', type: 'text', icon: <FiGlobe /> },
                  { label: 'Established Year', key: 'established_year', type: 'number', icon: <FiFileText /> },
                  { label: 'Total Employees', key: 'total_employees', type: 'number', icon: <FiUser /> },
                  { label: 'Website URL', key: 'website', type: 'text', icon: <FiGlobe /> }
                ].map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{field.label}</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                        {field.icon}
                      </div>
                      <input 
                        type={field.type} 
                        className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-12 py-3 focus:bg-slate-900/60 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-white placeholder-slate-500 transition-all font-medium text-sm"
                        value={recData[field.key]} 
                        onChange={e => setRecData({ ...recData, [field.key]: e.target.value })} 
                        required={['company_name', 'company_email', 'username', 'password'].includes(field.key)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Company Description</label>
                <textarea 
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 focus:bg-slate-900/60 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-white placeholder-slate-500 transition-all font-medium text-sm min-h-[100px]" 
                  value={recData.company_description} 
                  onChange={e => setRecData({ ...recData, company_description: e.target.value })} 
                  placeholder="Tell candidates about your hiring workflow and target roles..."
                />
              </div>

              {/* File Upload Sections */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {[
                  { key: 'company_profile_pdf', label: 'Company Profile (PDF)' },
                  { key: 'registration_certificate', label: 'Reg. Certificate' },
                  { key: 'logo', label: 'Company Logo' }
                ].map((fileObj) => (
                  <div key={fileObj.key} className="relative group p-4 border-2 border-dashed border-slate-700 rounded-2xl hover:border-blue-500 transition-colors bg-slate-950 flex flex-col justify-between items-center text-center cursor-pointer min-h-[110px]">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">{fileObj.label}</span>
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={e => setRecFiles({ ...recFiles, [fileObj.key]: e.target.files[0] })} 
                    />
                    <p className="text-xs text-slate-400 truncate max-w-full font-semibold">{fileName(recFiles[fileObj.key])}</p>
                    {fileObj.key === 'logo' && logoPreview && (
                      <img src={logoPreview} alt="Preview" className="mt-2 h-10 w-10 rounded-lg object-cover border border-slate-700 shadow-lg" />
                    )}
                  </div>
                ))}
              </div>

              {/* Submit / Back Buttons */}
              <div className="flex gap-4 pt-6 border-t border-slate-800">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-4 rounded-2xl shadow-xl shadow-blue-950/20 transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
                >
                  {loading ? "Registering..." : "Register Organization"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setMode('user')} 
                  className="flex-1 bg-slate-950 border border-slate-700 text-slate-400 font-extrabold py-4 rounded-2xl hover:bg-slate-900 transition-all text-sm"
                >
                  Back
                </button>
              </div>
            </form>
          )}

          {/* Toggle back to Login */}
          <div className="mt-10 text-center">
            <p className="text-sm font-medium text-slate-400">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-400 font-black uppercase tracking-widest text-xs hover:underline ml-1">
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Register;