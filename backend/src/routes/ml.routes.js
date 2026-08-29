const express = require("express");
const axios = require("axios");
const router = express.Router();
const auth = require("../middleware/auth.middleware");

router.use(auth);

// Proxy to ML service. Set ML_SERVICE_URL in env or default to localhost:8000
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

router.post("/job-role", async (req, res, next) => {
  try {
    // forward to ml-service
    const url = `${ML_SERVICE_URL}/ml/job-role`;
    // use a short timeout so we can fall back quickly to artifact-based heuristic
    const r = await axios.post(url, req.body, { timeout: 5000 });
    // If ML service returned simple role names (array of strings), enrich with required_skills
    try {
      const data = r.data || {};
      const roles = Array.isArray(data.roles) ? data.roles : [];
      // load artifacts map if exists
      const fs = require("fs");
      const path = require("path");
      const mapPath = path.join(
        __dirname,
        "../../../ml-service/artifacts/role_required_skills_top10.json",
      );
      let map = null;
      if (fs.existsSync(mapPath)) {
        try {
          map = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
        } catch (e) {
          map = null;
        }
      }

      if (roles.length && map) {
        const skills = (req.body.skills || []).map((s) =>
          String(s).toLowerCase(),
        );
        const enriched = roles.map((rItem) => {
          const name = String(rItem || "").trim();
          const reqSkills = Array.isArray(map[name])
            ? map[name]
            : map[name.toLowerCase()] || [];
          const reqNorm = (reqSkills || []).map((s) => String(s).trim());
          const matched = reqNorm.filter((s) =>
            skills.includes(String(s).toLowerCase()),
          );
          const matchPct = reqNorm.length
            ? Math.round((matched.length / reqNorm.length) * 100)
            : 0;
          return {
            name,
            required_skills: reqNorm,
            matched: matched.length,
            match_pct: matchPct,
          };
        });
        return res.json({ roles: enriched, fallback: false });
      }

      return res.json(r.data);
    } catch (e) {
      return res.json(r.data);
    }
  } catch (err) {
    console.error("ml proxy error:", err.message || err);
    // if ml service unreachable, provide graceful fallback: simple heuristic
    try {
      // fallback: if role_skill map exists in backend/data, use simple scoring
      const fs = require("fs");
      const path = require("path");
      // resolve to repo root: backend/src/routes -> ../../../ml-service
      const mapPath = path.join(
        __dirname,
        "../../../ml-service/artifacts/role_required_skills_top10.json",
      );
      if (fs.existsSync(mapPath)) {
        const map = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
        const skills = (req.body.skills || []).map((s) =>
          String(s).toLowerCase(),
        );
        const scores = {};
        for (const [role, reqSkills] of Object.entries(map)) {
          const matched = reqSkills.filter((s) =>
            skills.includes((s || "").toLowerCase()),
          ).length;
          if (matched > 0) scores[role] = matched;
        }
        const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        const top = sorted.slice(0, 10).map(([role, matched]) => {
          const reqSkills = map[role] || [];
          const matchPct = reqSkills.length
            ? Math.round((matched / reqSkills.length) * 100)
            : 0;
          return {
            name: role,
            required_skills: reqSkills,
            matched,
            match_pct: matchPct,
          };
        });
        // return top 5 by default, plus full mapping for clients that want details
        return res.json({
          roles: top.slice(0, 5),
          all_role_map: map,
          fallback: true,
        });
      }
    } catch (e) { }
    // ensure we return a 502 with a helpful message rather than unhandled 500
    return res
      .status(502)
      .json({ error: "ML service unavailable", details: err.message });
  }
});

router.post("/parse-resume", async (req, res, next) => {
  try {
    const url = `${ML_SERVICE_URL}/ml/parse-resume`;
    const r = await axios.post(url, req.body, { timeout: 35000 });
    return res.json(r.data);
  } catch (err) {
    console.error("ml parse-resume proxy error:", err.message || err);
    return res.status(502).json({
      error: "ML parse-resume service error",
      details: err.message,
    });
  }
});

module.exports = router;
