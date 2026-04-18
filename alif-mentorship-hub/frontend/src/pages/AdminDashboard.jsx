import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../services/axios";
import DashboardHeader from "../components/DashboardHeader";
import VerifyMentorsTab from "../components/admin/VerifyMentorsTab";
import StatsTab from "../components/admin/StatsTab";
import ResourcesTab from "../components/admin/ResourcesTab";
import ReportsTab from "../components/admin/ReportsTab";

const TABS = [
  { id: "verify",    label: "Verify mentors", icon: "✅" },
  { id: "stats",     label: "Stats",          icon: "📊" },
  { id: "resources", label: "Resources",      icon: "📚" },
  { id: "reports",   label: "Reports",        icon: "🚩" },
];

const AdminDashboard = () => {
  const role = localStorage.getItem("user_role");
  if (role !== "admin") return <Navigate to="/login" replace />;

  const [activeTab, setActiveTab]       = useState("verify");
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    api.get("admin/mentors/")
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : (r.data.results ?? []);
        const unverified = data.filter((m) => !m.is_verified).length;
        setPendingCount(unverified);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-y-auto pb-20 pt-14">
        <DashboardHeader title="Admin dashboard" />
        {activeTab === "verify"    && (
          <VerifyMentorsTab onPendingChange={setPendingCount} />
        )}
        {activeTab === "stats"     && <StatsTab />}
        {activeTab === "resources" && <ResourcesTab />}
        {activeTab === "reports"   && <ReportsTab />}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors relative ${
              activeTab === t.id ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="text-lg leading-none mb-0.5 relative">
              {t.icon}
              {t.id === "verify" && pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </span>
            <span className="leading-tight text-center" style={{ fontSize: "10px" }}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default AdminDashboard;
