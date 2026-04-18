import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../services/axios";
import DashboardHeader from "../components/DashboardHeader";
import ProfileTab from "../components/mentor/ProfileTab";
import RequestsTab from "../components/mentor/RequestsTab";
import UpcomingTab from "../components/mentor/UpcomingTab";
import PastSessionsTab from "../components/mentor/PastSessionsTab";
import ReviewsTab from "../components/mentor/ReviewsTab";

const TABS = [
  { id: "profile",  label: "Profile",       icon: "👤" },
  { id: "requests", label: "Requests",      icon: "📥" },
  { id: "upcoming", label: "Upcoming",      icon: "🗓️" },
  { id: "past",     label: "Past sessions", icon: "✅" },
  { id: "reviews",  label: "Reviews",       icon: "⭐" },
];

const isIncomplete = (p) =>
  !p || !p.university || !p.graduation_year || !p.field_of_study || !p.bio;

const MentorDashboard = () => {
  const role = localStorage.getItem("user_role");
  if (role !== "mentor") return <Navigate to="/login" replace />;

  const [profile, setProfile]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState("profile");
  const [pendingCount, setPendingCount] = useState(0);

  const fetchProfile = async () => {
    try {
      const r = await api.get("mentors/me/");
      setProfile(r.data);
    } catch {
      // interceptor handles 401
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const r = await api.get("sessions/?status=pending");
      const data = Array.isArray(r.data) ? r.data : (r.data.results ?? []);
      setPendingCount(data.length);
    } catch {
      setPendingCount(0);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchPendingCount();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="space-y-3 w-full max-w-sm px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Profile completion gate
  if (isIncomplete(profile)) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardHeader title="Complete your profile" />
        <div className="pt-14">
          <ProfileTab
            profile={profile}
            onSaved={(updated) => setProfile(updated)}
            gateMode
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-y-auto pb-20 pt-14">
        <DashboardHeader title="Mentor dashboard" />
        {activeTab === "profile"  && (
          <ProfileTab profile={profile} onSaved={(updated) => setProfile(updated)} />
        )}
        {activeTab === "requests" && (
          <RequestsTab onCountChange={setPendingCount} />
        )}
        {activeTab === "upcoming" && <UpcomingTab />}
        {activeTab === "past"     && <PastSessionsTab />}
        {activeTab === "reviews"  && <ReviewsTab profile={profile} />}
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
              {t.id === "requests" && pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </span>
            <span className="leading-tight text-center" style={{fontSize: "10px"}}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default MentorDashboard;
