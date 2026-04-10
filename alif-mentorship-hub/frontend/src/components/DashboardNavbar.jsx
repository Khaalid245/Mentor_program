import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

// Role config — label, color, icon for each role
const ROLE_CONFIG = {
  student: {
    label: "Student",
    color: "bg-blue-100 text-blue-800",
    icon: "👨🎓",
  },
  mentor: {
    label: "Mentor",
    color: "bg-green-100 text-green-800",
    icon: "👩🏫",
  },
  admin: {
    label: "Admin",
    color: "bg-purple-100 text-purple-800",
    icon: "🛡️",
  },
};

const DashboardNavbar = ({ userName }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState("");
  const [displayName, setDisplayName] = useState("");
  const navigate = useNavigate();

  const readAuthState = () => {
    const token = localStorage.getItem("access_token");
    const storedRole = localStorage.getItem("user_role") || "";
    const storedUsername = localStorage.getItem("username") || "";
    setIsAuthenticated(!!token);
    setRole(storedRole);
    // prefer the userName prop (first_name from API) over stored username
    setDisplayName(userName || storedUsername);
  };

  useEffect(() => {
    readAuthState();
    window.addEventListener("logoutSuccess", readAuthState);
    window.addEventListener("loginSuccess", readAuthState);
    return () => {
      window.removeEventListener("logoutSuccess", readAuthState);
      window.removeEventListener("loginSuccess", readAuthState);
    };
  }, [userName]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("username");
    window.dispatchEvent(new CustomEvent("logoutSuccess"));
    navigate("/");
  };

  if (!isAuthenticated) return null;

  const config = ROLE_CONFIG[role] || ROLE_CONFIG.student;

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 fixed w-full top-0 left-0 z-50">
      <div className="container mx-auto flex justify-between items-center px-4 py-3">

        {/* Left — logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            ← Home
          </button>
          <span className="text-gray-300">|</span>
          <h1 className="text-lg font-bold text-blue-600">Alif Mentorship Hub</h1>
        </div>

        {/* Right — who is logged in */}
        <div className="flex items-center gap-3">
          {/* Role badge with icon */}
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            <div className="text-sm">
              <span className="font-semibold text-gray-800">{displayName}</span>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${config.color}`}>
                {config.label}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;
