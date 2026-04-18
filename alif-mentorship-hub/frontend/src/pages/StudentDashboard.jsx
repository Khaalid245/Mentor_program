import { useState } from "react";
import { Navigate } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";
import BrowseMentors from "../components/student/BrowseMentors";
import MySessions from "../components/student/MySessions";
import Resources from "../components/student/Resources";

const TABS = [
  { id: "browse", label: "Browse mentors", icon: "🔍" },
  { id: "sessions", label: "My sessions",   icon: "🗓️" },
  { id: "resources", label: "Resources",    icon: "📚" },
];

const StudentDashboard = () => {
  const role = localStorage.getItem("user_role");
  if (role !== "student") return <Navigate to="/login" replace />;

  const [activeTab, setActiveTab] = useState("browse");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Tab content */}
      <div className="flex-1 overflow-y-auto pb-20 pt-14">
        <DashboardHeader title="Student dashboard" />
        {activeTab === "browse"    && <BrowseMentors onRequestSession={() => setActiveTab("sessions")} />}
        {activeTab === "sessions"  && <MySessions onBrowse={() => setActiveTab("browse")} />}
        {activeTab === "resources" && <Resources />}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${
              activeTab === t.id ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="text-lg leading-none mb-0.5">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default StudentDashboard;
