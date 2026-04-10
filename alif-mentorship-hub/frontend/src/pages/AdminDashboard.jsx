import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/axios";
import DashboardNavbar from "../components/DashboardNavbar";

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color }) => (
  <div className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${color} flex items-center gap-4`}>
    <span className="text-3xl">{icon}</span>
    <div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
);

// ── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    Pending: "bg-yellow-100 text-yellow-800",
    "Under Review": "bg-blue-100 text-blue-800",
    Approved: "bg-green-100 text-green-800",
    Rejected: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
};

// ── Main AdminDashboard ───────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigningId, setAssigningId] = useState(null);   // application being assigned
  const [selectedMentor, setSelectedMentor] = useState({}); // { [appId]: mentorId }
  const [activeTab, setActiveTab] = useState("applications"); // applications | mentors
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [appsRes, mentorsRes] = await Promise.all([
        api.get("student/applications/"),
        api.get("mentors/"),
      ]);
      setApplications(appsRes.data);
      setMentors(mentorsRes.data);
    } catch (err) {
      console.error(err.response?.data || err);
      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user_role");
        localStorage.removeItem("username");
        navigate("/login");
      } else {
        setError("Failed to load data. Please refresh.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAssignMentor = async (appId) => {
    const mentorId = selectedMentor[appId];
    if (!mentorId) {
      alert("Please select a mentor first.");
      return;
    }
    try {
      setAssigningId(appId);
      await api.post(`student/applications/${appId}/assign_mentor/`, {
        mentor_id: parseInt(mentorId),
      });
      fetchData();
    } catch (err) {
      console.error(err.response?.data || err);
      alert(err.response?.data?.error || "Failed to assign mentor.");
    } finally {
      setAssigningId(null);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "Pending").length,
    underReview: applications.filter((a) => a.status === "Under Review").length,
    approved: applications.filter((a) => a.status === "Approved").length,
    rejected: applications.filter((a) => a.status === "Rejected").length,
    unassigned: applications.filter((a) => !a.mentor).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      <DashboardNavbar userName="Admin" />

      <div className="max-w-6xl mx-auto p-4 pt-24">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-700">
            🛡️ Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Manage applications, assign mentors, and monitor the platform
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* ── Stats Bar ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon="📋" label="Total Applications" value={stats.total} color="border-purple-400" />
          <StatCard icon="⏳" label="Pending" value={stats.pending} color="border-yellow-400" />
          <StatCard icon="✅" label="Approved" value={stats.approved} color="border-green-400" />
          <StatCard icon="👤" label="Unassigned" value={stats.unassigned} color="border-red-400" />
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("applications")}
            className={`px-5 py-2 rounded-lg font-semibold text-sm transition ${
              activeTab === "applications"
                ? "bg-purple-600 text-white shadow"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            📋 Applications ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab("mentors")}
            className={`px-5 py-2 rounded-lg font-semibold text-sm transition ${
              activeTab === "mentors"
                ? "bg-purple-600 text-white shadow"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            👩🏫 Mentors ({mentors.length})
          </button>
        </div>

        {/* ── Applications Tab ──────────────────────────────────────────── */}
        {activeTab === "applications" && (
          <div className="space-y-4">
            {applications.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
                <p className="text-4xl mb-2">📭</p>
                <p className="text-gray-500">No applications yet.</p>
              </div>
            ) : (
              applications.map((app) => (
                <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">

                    {/* Student info */}
                    <div>
                      <h2 className="font-bold text-gray-800 text-lg">
                        {app.first_name} {app.last_name}
                      </h2>
                      <p className="text-sm text-gray-500">{app.course}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>📧 {app.email}</span>
                        <span>📞 {app.phone}</span>
                        <span>🏫 {app.previous_school}</span>
                      </div>
                    </div>

                    {/* Status + date */}
                    <div className="text-right space-y-1">
                      <StatusBadge status={app.status} />
                      <p className="text-xs text-gray-400">
                        Applied: {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Career goals */}
                  {app.career_goals && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs font-semibold text-blue-700 mb-1">Career Goals</p>
                      <p className="text-sm text-gray-700">{app.career_goals}</p>
                    </div>
                  )}

                  {/* Current mentor or assign */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {app.mentor ? (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-600 font-semibold">✅ Assigned to:</span>
                        <span className="text-gray-700">
                          {app.mentor.user?.first_name} {app.mentor.user?.last_name}
                          <span className="text-gray-400 ml-1">({app.mentor.specialization})</span>
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm text-orange-600 font-semibold">⚠️ No mentor assigned</span>
                        <select
                          value={selectedMentor[app.id] || ""}
                          onChange={(e) =>
                            setSelectedMentor((prev) => ({ ...prev, [app.id]: e.target.value }))
                          }
                          className="flex-1 min-w-[180px] px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Select a mentor...</option>
                          {mentors
                            .filter((m) => m.available)
                            .map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.user?.first_name} {m.user?.last_name} — {m.specialization}
                              </option>
                            ))}
                        </select>
                        <button
                          disabled={assigningId === app.id || !selectedMentor[app.id]}
                          onClick={() => handleAssignMentor(app.id)}
                          className={`px-4 py-1.5 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition ${
                            assigningId === app.id || !selectedMentor[app.id]
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {assigningId === app.id ? "Assigning..." : "Assign"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Mentors Tab ───────────────────────────────────────────────── */}
        {activeTab === "mentors" && (
          <div className="space-y-3">
            {mentors.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
                <p className="text-4xl mb-2">👤</p>
                <p className="text-gray-500">No mentors yet.</p>
                <p className="text-sm text-gray-400 mt-1">
                  Create mentors from the{" "}
                  <a
                    href="http://localhost:8000/admin/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline"
                  >
                    Django admin panel
                  </a>
                </p>
              </div>
            ) : (
              mentors.map((m) => {
                const assignedCount = applications.filter(
                  (a) => a.mentor?.id === m.id
                ).length;
                return (
                  <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
                    {/* Avatar */}
                    {m.profile_picture ? (
                      <img
                        src={m.profile_picture}
                        alt="Mentor"
                        className="w-12 h-12 rounded-full object-cover border-2 border-purple-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {m.user?.first_name?.[0]}{m.user?.last_name?.[0]}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800">
                        {m.user?.first_name} {m.user?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{m.specialization}</p>
                      <p className="text-xs text-gray-400">{m.user?.email}</p>
                    </div>

                    {/* Stats */}
                    <div className="text-right space-y-1 flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-700">
                        {assignedCount} student{assignedCount !== 1 ? "s" : ""}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        m.available
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {m.available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
