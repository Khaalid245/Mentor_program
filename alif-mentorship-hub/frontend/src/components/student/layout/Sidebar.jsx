import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/axios";

const Sidebar = ({ activeTab, onTabChange }) => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Student";
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Fetch pending sessions count
    api.get("sessions/?status=pending")
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : (r.data.results || []);
        setPendingCount(data.length);
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const navItems = [
    {
      id: "home",
      label: "Home",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 7l7-5 7 5v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" />
          <path d="M6 16V9h6v7" />
        </svg>
      ),
      section: "menu"
    },
    {
      id: "browse",
      label: "Browse mentors",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="6" />
          <path d="M12.5 12.5L17 17" />
        </svg>
      ),
      section: "menu"
    },
    {
      id: "sessions",
      label: "My sessions",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="14" height="14" rx="2" />
          <path d="M2 7h14M6 1v4M12 1v4" />
          <circle cx="9" cy="12" r="1.5" fill="currentColor" />
        </svg>
      ),
      section: "account",
      badge: pendingCount
    },
    {
      id: "resources",
      label: "Resources",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h5a3 3 0 0 1 3 3v10a2 2 0 0 0-2-2H2V3z" />
          <path d="M16 3h-5a3 3 0 0 0-3 3v10a2 2 0 0 1 2-2h6V3z" />
        </svg>
      ),
      section: "account"
    },
    {
      id: "settings",
      label: "Settings",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="9" r="3" />
          <path d="M14.5 9a5.5 5.5 0 0 0-.1-1.1l1.4-.8-1-1.7-1.6.4a5.5 5.5 0 0 0-1.9-1.1l-.3-1.7h-2l-.3 1.7a5.5 5.5 0 0 0-1.9 1.1l-1.6-.4-1 1.7 1.4.8a5.5 5.5 0 0 0 0 2.2l-1.4.8 1 1.7 1.6-.4a5.5 5.5 0 0 0 1.9 1.1l.3 1.7h2l.3-1.7a5.5 5.5 0 0 0 1.9-1.1l1.6.4 1-1.7-1.4-.8a5.5 5.5 0 0 0 .1-1.1z" />
        </svg>
      ),
      section: "account"
    }
  ];

  const menuItems = navItems.filter(item => item.section === "menu");
  const accountItems = navItems.filter(item => item.section === "account");

  return (
    <div 
      className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-white border-r z-30"
      style={{ borderColor: "#CCFBF1" }}
    >
      {/* Top section - branding */}
      <div className="px-5 py-6 border-b" style={{ borderColor: "#CCFBF1" }}>
        <h1 className="text-base font-black" style={{ color: "#0F766E" }}>
          Alif Mentorship
        </h1>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
          {username}
        </p>
      </div>

      {/* Navigation links */}
      <div className="flex flex-col gap-1 px-3 py-4 flex-1 overflow-y-auto">
        {/* Menu section */}
        <p 
          className="text-xs font-bold uppercase tracking-widest px-3 mb-1"
          style={{ color: "#D1D5DB" }}
        >
          Menu
        </p>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors w-full"
            style={{
              backgroundColor: activeTab === item.id ? "#CCFBF1" : "transparent",
              color: activeTab === item.id ? "#0F766E" : "#6B7280",
              fontWeight: activeTab === item.id ? 600 : 400
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}

        {/* My account section */}
        <p 
          className="text-xs font-bold uppercase tracking-widest px-3 mb-1 mt-4"
          style={{ color: "#D1D5DB" }}
        >
          My account
        </p>
        {accountItems.map((item) => (
          <button
            key={item.id}
            onClick={() => item.id !== "settings" && onTabChange(item.id)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors w-full"
            style={{
              backgroundColor: activeTab === item.id ? "#CCFBF1" : "transparent",
              color: activeTab === item.id ? "#0F766E" : "#6B7280",
              fontWeight: activeTab === item.id ? 600 : 400,
              cursor: item.id === "settings" ? "not-allowed" : "pointer",
              opacity: item.id === "settings" ? 0.5 : 1
            }}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge > 0 && (
              <span 
                className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: "#0D9488", color: "#FFFFFF" }}
              >
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bottom section - logout */}
      <div className="px-3 py-4 border-t mt-auto" style={{ borderColor: "#CCFBF1" }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors w-full hover:bg-red-50"
          style={{ color: "#9CA3AF" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#DC2626"}
          onMouseLeave={(e) => e.currentTarget.style.color = "#9CA3AF"}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 16H3a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4M12 12l4-4-4-4M16 8H7" />
          </svg>
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
