import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";
import { FiMail, FiLock, FiArrowRight, FiShield } from "react-icons/fi";

const Login = () => {
  const nav = useNavigate();
  const [data, setData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", data);
      localStorage.setItem("token", res.data.token);

      const role = res.data.role || 'user';
      localStorage.setItem('role', role);

      if (role === 'admin') nav('/admin');
      else if (role === 'recruiter') nav('/company');
      else nav('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout isLanding={true}>
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white relative overflow-hidden font-sans">
        
        {/* Background Glowing Ambient Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] -z-10 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px] -z-10" />

        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-0 bg-slate-900/80 backdrop-blur-xl border border-slate-700/80 md:rounded-[2.5rem] overflow-hidden shadow-2xl m-4">
          
          {/* Left Side: Brand/Marketing (Dark Slate Slate-950 equivalent) */}
          <div className="hidden md:flex flex-col justify-between p-12 bg-slate-950 text-white relative overflow-hidden border-r border-slate-800/80">
            {/* Tiny grid pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4F46E5 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

            <div className="relative z-10 space-y-12">
              {/* Actual navbar symbol matching logo */}
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3.5 rounded-2xl shadow-lg flex items-center justify-center w-12 h-12 shrink-0">
                  <i className="fas fa-brain text-white text-xl"></i>
                </div>
                <span className="text-2xl font-black tracking-tight">
                  SkillLens <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">AI</span>
                </span>
              </div>

              <div className="space-y-6">
                <h2 className="text-4xl lg:text-5xl font-black leading-tight tracking-tight">
                  Initialize your <br /> placement <br /> 
                  <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent italic font-serif">
                    career engine.
                  </span>
                </h2>
                <p className="text-slate-400 font-medium leading-relaxed max-w-sm">
                  Log in to access your custom AI assessment metrics, visual roadmaps, and verified recruitment pipelines.
                </p>
              </div>
            </div>

            {/* Avatars / Social */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60')`, backgroundSize: 'cover' }} />
                ))}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Joined by 12,000+ Candidates</p>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="p-8 md:p-16 flex flex-col justify-center bg-slate-900/40">
            <div className="max-w-sm mx-auto w-full">
              {/* Form title */}
              <div className="mb-10 text-center md:text-left">
                <h1 className="text-3xl font-black text-white tracking-tight mb-2">Welcome Back</h1>
                <p className="text-slate-400 font-medium">Please enter your credentials to login</p>
              </div>

              {/* Error banner */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                  <FiShield className="shrink-0" /> {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handle} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Email Address</label>
                  <div className="relative group">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="email"
                      placeholder="name@university.com"
                      required
                      value={data.email}
                      onChange={(e) => setData({ ...data, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-12 py-4 focus:bg-slate-900/60 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-white placeholder-slate-500 transition-all font-medium text-sm"
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
                      required
                      value={data.password}
                      onChange={(e) => setData({ ...data, password: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-12 py-4 focus:bg-slate-900/60 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-white placeholder-slate-500 transition-all font-medium text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end py-1">
                  <Link to="/forgot" className="text-xs font-black text-blue-400 uppercase tracking-widest hover:underline">Forgot password?</Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-4.5 rounded-2xl shadow-xl shadow-blue-950/20 transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
                >
                  {loading ? "Authenticating..." : "Sign In to Dashboard"}
                  <FiArrowRight size={16} />
                </button>
              </form>

              {/* Toggle to Signup */}
              <div className="mt-12 text-center">
                <p className="text-sm font-medium text-slate-400">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-blue-400 font-black uppercase tracking-widest text-xs hover:underline ml-1">
                    Register Now
                  </Link>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Login;