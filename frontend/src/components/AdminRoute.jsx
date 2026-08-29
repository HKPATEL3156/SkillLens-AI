import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getProfile } from "../services/api";

const AdminRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await getProfile();
        if (!mounted) return;
        const user = res.data.user || res.data;
        if (user && user.role === "admin") setIsAdmin(true);
      } catch (e) {
        // not authorized or network error
      } finally {
        if (mounted) setLoading(false);
      }
    };
    check();
    return () => (mounted = false);
  }, []);

  if (loading) return <div className="p-6">Checking permissions...</div>;
  return isAdmin ? children : <Navigate to="/login" replace />;
};

export default AdminRoute;
