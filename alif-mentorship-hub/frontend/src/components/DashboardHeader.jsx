import { useNavigate } from "react-router-dom";

const ROLE_BADGE = {
  admin:   "bg-purple-100 text-purple-700",
  mentor:  "bg-green-100 text-green-700",
  student: "bg-blue-100 text-blue-700",
};

const DashboardHeader = ({ title }) => {
  const navigate  = useNavigate();
  const username  = localStorage.getItem("username") || "User";
  const role      = localStorage.getItem("user_role") || "";

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("username");
    navigate("/login", { replace: true });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
      {/* Left — platform name + page title */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-blue-600 font-extrabold text-base tracking-tight whitespace-nowrap">
          Alif Hub
        </span>
        {title && (
          <>
            <span className="text-gray-300 text-sm">/</span>
            <span className="text-gray-600 text-sm font-medium truncate">{title}</span>
          </>
        )}
      </div>

      {/* Right — username + role + logout */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_BADGE[role] || "bg-gray-100 text-gray-600"}`}>
          {role}
        </span>
        <span className="text-sm text-gray-700 font-medium hidden sm:block">{username}</span>
        <button
          onClick={logout}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
          </svg>
          Logout
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
