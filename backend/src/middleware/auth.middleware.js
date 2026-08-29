const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Company = require("../models/Company");

module.exports = async (req, res, next) => {
  try {
    // Accept token from Authorization header or x-access-token for flexibility
    const authHeader =
      req.headers.authorization || req.headers["x-access-token"];
    if (!authHeader) {
      console.warn("Auth: no authorization header present");
      return res.status(401).json({ error: "No token provided" });
    }

    // Normalize 'Bearer <token>' or raw token
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;
    if (!token) {
      console.warn("Auth: token missing after parsing header");
      return res.status(401).json({ error: "No token provided" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("Auth: JWT_SECRET not configured in environment");
      return res.status(500).json({ error: "Server auth misconfiguration" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.warn("Auth: token verification failed:", err.message);
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    // Attach account to req.user. Support both User and Company tokens by role.
    if (decoded.role === "recruiter") {
      const company = await Company.findById(decoded.id).select("-password");
      if (!company) {
        console.warn(`Auth: company not found for id ${decoded.id}`);
        return res.status(401).json({ error: "Recruiter not found" });
      }
      req.user = company;
      req.isRecruiter = true;
      next();
      return;
    }

    // default: user/admin
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      console.warn(`Auth: user not found for id ${decoded.id}`);
      return res.status(401).json({ error: "User not found" });
    }
    req.user = user;
    req.isRecruiter = false;
    next();
  } catch (err) {
    next(err);
  }
};
