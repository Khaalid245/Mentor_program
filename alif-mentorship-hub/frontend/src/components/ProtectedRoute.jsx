import { Navigate } from "react-router-dom";

const ROLE_REDIRECT = {
  student: "/student/dashboard",
  mentor:  "/mentor/dashboard",
  admin:   "/admin/dashboard",
};

const ProtectedRoute = ({ children, role: requiredRole }) => {
  const token = localStorage.getItem("access_token");
  const role  = localStorage.getItem("user_role");

  if (!token || !role) return <Navigate to="/login" replace />;

  if (role !== requiredRole) {
    return <Navigate to={ROLE_REDIRECT[role] || "/login"} replace />;
  }

  return children;
};

export default ProtectedRoute;
