module.exports = function (requiredRole) {
  return (req, res, next) => {
    try {
      const role = req.user && req.user.role ? req.user.role : "user";
      if (requiredRole === "admin" && role !== "admin")
        return res.status(403).json({ error: "Admin access required" });

      if (requiredRole === "recruiter") {
        if (role !== "recruiter")
          return res.status(403).json({ error: "Recruiter access required" });
        // additional checks for recruiter approval and verification
        const user = req.user || {};
        if (user.is_blocked)
          return res.status(403).json({ error: "Account blocked" });
        if (user.status !== "approved" || !user.is_verified)
          return res
            .status(403)
            .json({ error: "Recruiter account not approved or verified" });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};
