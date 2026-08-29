const User = require("../../models/User");
const Career = require("../../models/Career");
const QuizAttempt = require("../../models/QuizAttempt");
const Application = require("../../models/Application");
const Job = require("../../models/Job");

// GET /api/recruiter/candidate/:id?jobId=
exports.getCandidate = async (req, res, next) => {
  try {
    const companyId = req.user._id;
    const id = req.params.id;
    const jobId = req.query.jobId;

    const user = await User.findById(id).select("-password").lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    // find career/resume
    const career = await Career.findOne({ userId: id })
      .lean()
      .catch(() => null);

    // quiz attempts (normalize percent/qualified where missing)
    let quizAttempts = await QuizAttempt.find({ userId: id })
      .sort({ createdAt: -1 })
      .lean()
      .limit(50)
      .catch(() => []);
    quizAttempts = (quizAttempts || []).map((a) => {
      const out = { ...a };
      let pct = 0;
      if (typeof out.percent === "number") pct = Math.round(out.percent);
      else if (
        typeof out.obtainedMarks === "number" &&
        typeof out.totalMarks === "number" &&
        out.totalMarks > 0
      ) {
        pct = Math.round(
          (Number(out.obtainedMarks) / Number(out.totalMarks)) * 100,
        );
      } else if (typeof out.obtainedMarks === "number")
        pct = Math.round(out.obtainedMarks);
      out.percent = pct;
      out.qualified = !!out.qualified || pct >= 70;
      return out;
    });

    // application(s) for this user
    const apps = await Application.find({ userId: id })
      .sort({ createdAt: -1 })
      .lean()
      .catch(() => []);

    // if jobId provided, compute matching score using skill overlap and quiz score for that job
    let matchingScore = null;
    if (jobId) {
      const job = await Job.findById(jobId)
        .lean()
        .catch(() => null);
      if (job) {
        // use required_skills from Job model
        const jobSkills = Array.isArray(job.required_skills)
          ? job.required_skills.map((s) => String(s).toLowerCase())
          : [];
        // prefer authoritative qualified skills from Career if present
        const userSkills =
          career &&
          Array.isArray(career.qualifiedSkills) &&
          career.qualifiedSkills.length
            ? career.qualifiedSkills.map((s) => String(s.skill).toLowerCase())
            : Array.isArray(user.skills)
              ? user.skills.map((s) => String(s).toLowerCase())
              : [];
        const overlap = jobSkills.filter((s) => userSkills.includes(s)).length;
        const skillScore = jobSkills.length
          ? Math.round((overlap / jobSkills.length) * 100)
          : 0;
        // find application for this job
        const appForJob = apps.find((a) => String(a.jobId) === String(jobId));
        // derive quiz score: prefer application.quizScore, then career.avg_skill_score, then best attempt
        let quiz = 0;
        if (
          appForJob &&
          typeof appForJob.quizScore === "number" &&
          appForJob.quizScore > 0
        )
          quiz = appForJob.quizScore;
        else if (
          career &&
          career.careerResults &&
          career.careerResults.length
        ) {
          const last = career.careerResults[career.careerResults.length - 1];
          if (last && typeof last.avg_skill_score === "number")
            quiz = last.avg_skill_score;
        }
        if (!quiz) {
          const best = (quizAttempts || []).reduce(
            (m, x) => (x.percent && x.percent > m ? x.percent : m),
            0,
          );
          if (best) quiz = best;
        }
        // simple weighted score: 70% skills, 30% quiz
        matchingScore = Math.round(
          skillScore * 0.7 + Math.min(quiz, 100) * 0.3,
        );
      }
    }

    // attach computed bestQuizPercent and computed score per application
    const bestQuizPercent = (quizAttempts || []).reduce(
      (m, x) => (x.percent && x.percent > m ? x.percent : m),
      0,
    );
    const appsWithComputed = (apps || []).map((a) => {
      const computed = {};
      computed.computedScore =
        typeof a.quizScore === "number" && a.quizScore > 0
          ? a.quizScore
          : career && career.careerResults && career.careerResults.length
            ? career.careerResults[career.careerResults.length - 1]
                .avg_skill_score ||
              bestQuizPercent ||
              0
            : bestQuizPercent || 0;
      return { ...a, computedScore: computed.computedScore };
    });

    res.json({
      user,
      career,
      quizAttempts,
      applications: appsWithComputed,
      matchingScore,
      bestQuizPercent,
    });
  } catch (err) {
    next(err);
  }
};
