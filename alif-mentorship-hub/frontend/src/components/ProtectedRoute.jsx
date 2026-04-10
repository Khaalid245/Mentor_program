import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute
 *
 * Props:
 *   - children   : the page component to render if authorized
 *   - allowedRole: "student" | "mentor" | "admin" (optional)
 *                  if provided, also checks that user_role matches
 *
 * Redirects to /login if no access_token found.
 * Redirects to /login if allowedRole is set and user_role doesn't match.
 */
const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("user_role");

  // Not logged in at all
  if (!token) return <Navigate to="/login" replace />;

  // Admin can only access admin dashboard, not student/mentor routes
  if (role === "admin" && allowedRole === "admin") return children;
  if (role === "admin" && allowedRole !== "admin") return <Navigate to="/admin/dashboard" replace />;

  // Logged in but wrong role
  if (allowedRole && role !== allowedRole) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;
