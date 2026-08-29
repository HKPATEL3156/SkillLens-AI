import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";
import {
  ArrowRight, BrainCircuit, FileText, TrendingUp, Star, Sparkles,
  Target, Rocket, Zap, CheckCircle2, Globe, BarChart3,
  Cpu, Briefcase, Users, MessageSquare, Award
} from "lucide-react";

const Landing = () => {
  const [activeReview, setActiveReview] = useState(0);
  const reviews = [
    { motive: "PLACED AT FAANG", text: "SkillLens AI analyzed my resume, highlighted my Java gap, and put me through mock interviews. I cracked my Google interview within 3 weeks!", author: "Aman Verma", role: "SDE @ Google" },
    { motive: "NON-TECH TO DEV PIVOT", text: "I was a manual tester. The Job Role Prediction module mapped my SQL skills and recommended Backend Dev. The roadmaps helped me pivot cleanly.", author: "Sanya Gupta", role: "Backend Developer @ TechCorp" },
    { motive: "CRACKED SYSTEM DESIGN", text: "The adaptive quizzes found my System Design concepts were weak. I followed the targeted gap roadmap, cleared my interview, and got a 45% hike.", author: "Rahul Jha", role: "B.Tech Student" },
    { motive: "ATS AUDIT SUCCESS", text: "My resume kept getting rejected. The ATS Analyzer flagged missing keywords and structured my experience. First application post-edit got short-listed!", author: "Ishita Roy", role: "Data Analyst" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveReview((prev) => (prev + 1) % reviews.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [reviews.length]);

  return (
    <Layout isLanding={true}>

      {/* 1. HERO SECTION - ELITE GLOW DESIGN */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 text-white pt-24 pb-20">
        {/* Glowing Orbs */}
        <div className="absolute top-[10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/25 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[140px] animate-bounce" style={{ animationDuration: '10s' }} />

        {/* Diagonal Tech Grid Lines */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10 flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-bold uppercase tracking-[0.25em] text-blue-400 mb-8 shadow-inner">
            <Sparkles size={13} className="animate-spin" style={{ animationDuration: '4s' }} />
            <span>AI-Driven Placement Readiness Platform</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-[110px] font-black tracking-tight leading-[0.9] text-white mb-8">
            Decode Your Skill DNA.<br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent italic">
              Accelerate Your Placement.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-12 font-medium leading-relaxed">
            Stop sending blind job applications. Parse your resume, test your technical ceiling through adaptive neural quizzes, identify skill gaps, and practice with real-time AI mock interviews.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 w-full max-w-lg mb-16">
            <Link to="/register" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-2xl font-extrabold text-lg hover:bg-blue-500 hover:scale-102 active:scale-98 transition-all shadow-[0_20px_40px_rgba(59,130,246,0.3)] flex items-center justify-center gap-3 group">
                Build Candidate Profile
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-slate-300 border border-slate-800 rounded-2xl font-extrabold text-lg hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-3">
                Sign In
              </button>
            </Link>
          </div>

          {/* Floating Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center gap-6 py-6 px-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-2xl">
            <div className="flex -space-x-3.5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`w-9 h-9 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400`} style={{ backgroundImage: `url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60')`, backgroundSize: 'cover' }} />
              ))}
            </div>
            <div className="h-px w-8 bg-slate-800 sm:h-8 sm:w-px" />
            <div className="text-left leading-tight">
              <div className="flex text-yellow-400 gap-1 mb-1 justify-center sm:justify-start">
                <Star size={13} fill="currentColor" />
                <Star size={13} fill="currentColor" />
                <Star size={13} fill="currentColor" />
                <Star size={13} fill="currentColor" />
                <Star size={13} fill="currentColor" />
              </div>
              <p className="text-[11px] font-black uppercase text-slate-400 tracking-wider">12,000+ Candidates Placement-Ready</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS SECTION - ULTRA HIGH-END NEON STRIP */}
      <section className="bg-slate-950 border-y border-slate-900 relative z-20 py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <StatItem label="ATS Resumes Scanned" value="1.8M+" />
          <StatItem label="Adaptive Questions Generated" value="450K+" />
          <StatItem label="Average Placement Rate" value="94.2%" />
          <StatItem label="Salary Acceleration" value="48% Avg" />
        </div>
      </section>

      {/* 3. CORE AI MODULES - PREPARATION ENGINE */}
      <section id="features" className="py-32 bg-slate-900 text-white px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#4F46E5 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="max-w-7xl mx-auto text-center mb-24">
          <span className="text-blue-500 font-bold text-xs uppercase tracking-[0.3em] block mb-4">Complete Candidate Core</span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            Engineered For Placement Success
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto font-medium text-lg leading-relaxed">
            All-in-one neural suite matching candidate skills with placement demands, powered by generative LLMs and machine learning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <BentoCard
            icon={<FileText className="text-blue-400" />}
            title="Resume parsing & ATS Audit"
            desc="Extract technical capabilities, languages, experience, and projects. Rate ATS compatibility with detailed fixes."
            tag="MODULE 01"
          />
          <BentoCard
            icon={<BrainCircuit className="text-purple-400" />}
            title="Adaptive Skill Assessments"
            desc="Generate personalized, multi-level MCQ/MSQ quizzes evaluating parsed skills. Transaction-safe progress."
            tag="MODULE 02"
          />
          <BentoCard
            icon={<TrendingUp className="text-emerald-400" />}
            title="Predictive Job Matcher"
            desc="Machine learning predicts suitable job roles based on skills, quiz performances, and academic history."
            tag="MODULE 03"
          />
          <BentoCard
            icon={<Target className="text-orange-400" />}
            title="Skill Gap Analysis"
            desc="Identify required skills vs. user competencies for target roles. Get learning suggestions instantly."
            tag="MODULE 04"
          />
          <BentoCard
            icon={<MessageSquare className="text-pink-400" />}
            title="AI Mock Interview Simulator"
            desc="Practice technical, coding, or HR rounds based on your resume or target roles, complete with detailed feedback."
            tag="MODULE 05"
          />
          <BentoCard
            icon={<Briefcase className="text-sky-400" />}
            title="Job Application Pipeline"
            desc="Explore mock and verified jobs matching your predicted roles, apply instantly, and track applications."
            tag="MODULE 06"
          />
        </div>
      </section>

      {/* 4. THE 5-STEP PROTOCOL - INTEGRATED CANDIDATE LIFECYCLE */}
      <section id="how" className="py-32 bg-slate-950 text-white px-6">
        <div className="max-w-7xl mx-auto text-center mb-24">
          <span className="text-blue-500 font-bold text-xs uppercase tracking-[0.3em] block mb-4">Neural Pipeline</span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">The 5-Step Placement Protocol</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 max-w-7xl mx-auto relative">
          <ProtocolStep num="01" title="Upload & Parse" desc="Drop your resume. Extracts structured info and skills." />
          <ProtocolStep num="02" title="Skill Evaluation" desc="Adaptively quiz extracted skills to lock scores." />
          <ProtocolStep num="03" title="ML Role Match" desc="AI predicts matching career profiles and target salaries." />
          <ProtocolStep num="04" title="Audit Gap" desc="Find exact missing skills and review ATS improvements." />
          <ProtocolStep num="05" title="Interview & Apply" desc="Run mock interviews, bridge gaps, and secure the job." />
        </div>
      </section>

      {/* 5. USER PERSPECTIVE CARD - ORGANIZATIONAL PORTAL */}
      <section id="about" className="py-24 bg-slate-900 border-t border-slate-800 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-left space-y-6">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
              <Users size={12} />
              <span>For Hiring Partners</span>
            </div>
            <h3 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Recruiter Portal & Platform Management.
            </h3>
            <p className="text-slate-400 text-lg leading-relaxed">
              SkillLens isn't just for candidates. We provide organizations with an elite dashboard to post jobs, filter candidates based on verified skill assessment scores, and track pipeline stages seamlessly.
            </p>
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 size={18} className="text-indigo-400 flex-shrink-0" />
                <span>Verification system for genuine registered companies.</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 size={18} className="text-indigo-400 flex-shrink-0" />
                <span>Job posting dashboard with customized candidate requirements.</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 size={18} className="text-indigo-400 flex-shrink-0" />
                <span>Admin management interface for approvals, metrics, and logs.</span>
              </div>
            </div>
          </div>

          <div className="relative group bg-slate-950 p-10 rounded-[3rem] border border-slate-800/80 shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="absolute top-[10%] right-[-10%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px]" />
            <div className="space-y-6">
              <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
                <Award size={24} />
              </div>
              <h4 className="text-2xl font-black text-white">Hire assessment-verified talent.</h4>
              <p className="text-slate-400 leading-relaxed text-sm">
                Skip filtering resumes manually. Match verified assessment results directly with your job roles. Filter candidates based on actual skill score weights, CGPA, and interview feedback.
              </p>
            </div>
            <div className="h-px bg-slate-800 my-8" />
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">Partnerships</div>
                <div className="text-lg font-black text-white">450+ Companies Hiring</div>
              </div>
              <Link to="/register">
                <button className="flex items-center gap-2 text-indigo-400 font-extrabold text-sm hover:text-white transition-colors group">
                  Register Company
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS SECTION */}
      <section id="reviews" className="py-32 bg-slate-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center mb-20 gap-8">
            <div className="text-left">
              <span className="text-blue-400 font-bold text-xs uppercase tracking-[0.3em] block mb-2">Student Success</span>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Verified Achievements</h2>
            </div>
            <div className="flex gap-2">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveReview(i)}
                  className={`h-1.5 transition-all duration-500 rounded-full ${i === activeReview ? 'w-16 bg-blue-500' : 'w-4 bg-slate-800'}`}
                />
              ))}
            </div>
          </div>

          <div className="relative h-[300px] md:h-[200px]">
            {reviews.map((rev, idx) => (
              <div
                key={idx}
                className={`transition-all duration-750 absolute inset-0 ${idx === activeReview ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12 pointer-events-none'}`}
              >
                <div className="grid md:grid-cols-12 gap-8 items-center bg-slate-900/40 border border-slate-900 p-8 rounded-3xl backdrop-blur-md">
                  <div className="md:col-span-9 space-y-4">
                    <div className="text-blue-500 font-black uppercase tracking-[0.25em] text-[10px] bg-blue-500/10 px-3.5 py-1.5 rounded-full inline-block">{rev.motive}</div>
                    <p className="text-xl md:text-2xl font-medium text-slate-200 italic leading-relaxed">
                      "{rev.text}"
                    </p>
                  </div>
                  <div className="md:col-span-3 border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-8">
                    <h4 className="text-lg font-black text-white mb-0.5">{rev.author}</h4>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{rev.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION */}
      <section className="py-32 px-6 text-center bg-slate-900 border-t border-slate-800 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[160px] -z-10" />

        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-5xl md:text-8xl font-black mb-8 text-white tracking-tight leading-[0.95]">
            Engine Your Placement Journey.
          </h2>

          <p className="text-lg text-slate-400 mb-12 font-medium max-w-2xl mx-auto">
            Decipher your resume, match roles, close assessment gaps, and prepare for placement interviews with elite AI-driven validation.
          </p>

          <Link to="/register">
            <button className="group relative bg-blue-600 text-white px-14 py-6 rounded-2xl font-black text-lg hover:bg-blue-500 hover:scale-103 transition-all shadow-[0_20px_40px_rgba(59,130,246,0.3)]">
              <span className="relative z-10 flex items-center gap-3 justify-center">
                Initialize My Placement Engine
                <Zap size={18} className="group-hover:fill-current" />
              </span>
            </button>
          </Link>

          <div className="mt-20 flex flex-wrap justify-center gap-10 opacity-20 grayscale">
            <div className="text-xl font-bold tracking-tighter text-slate-400">GOOGLE</div>
            <div className="text-xl font-bold tracking-tighter text-slate-400">META</div>
            <div className="text-xl font-bold tracking-tighter text-slate-400">AMAZON</div>
            <div className="text-xl font-bold tracking-tighter text-slate-400">MICROSOFT</div>
          </div>
        </div>
      </section>

    </Layout>
  );
};

// --- STAT ITEM ---
const StatItem = ({ label, value }) => (
  <div className="space-y-1 bg-slate-900/30 p-6 rounded-2xl border border-slate-800/40">
    <div className="text-3xl md:text-4xl font-black text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text">{value}</div>
    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
  </div>
);

// --- BENTO CARD ---
const BentoCard = ({ icon, title, desc, tag }) => (
  <div className="group relative p-8 rounded-3xl bg-slate-950 border border-slate-900 hover:border-slate-800 hover:bg-slate-900/60 transition-all duration-500 flex flex-col justify-between h-[300px]">
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:scale-108 transition-transform">
          {React.cloneElement(icon, { size: 22 })}
        </div>
        <span className="text-[9px] font-black text-slate-600 tracking-widest">{tag}</span>
      </div>
      <h3 className="text-xl font-black text-white tracking-tight">{title}</h3>
      <p className="text-slate-400 font-medium text-sm leading-relaxed">{desc}</p>
    </div>
    <div className="flex items-center justify-end">
      <ArrowRight className="text-slate-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" size={16} />
    </div>
  </div>
);

// --- PROTOCOL STEP ---
const ProtocolStep = ({ num, title, desc }) => (
  <div className="group relative bg-slate-900/50 p-6 rounded-2xl border border-slate-900 hover:border-slate-850 hover:bg-slate-900/90 transition-all duration-500">
    <div className="text-3xl font-black text-slate-800 group-hover:text-blue-500/25 transition-colors mb-3">{num}</div>
    <h3 className="text-md font-black text-white mb-1 tracking-tight">{title}</h3>
    <p className="text-xs font-medium text-slate-400 leading-normal">{desc}</p>
    <div className="mt-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
      <CheckCircle2 className="text-blue-500" size={16} />
    </div>
  </div>
);

export default Landing;