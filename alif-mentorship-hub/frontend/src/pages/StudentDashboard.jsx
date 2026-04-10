import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/axios";
import ApplicationForm from "../components/ApplicationForm";
import DashboardNavbar from "../components/DashboardNavbar";
import SessionCard from "../components/SessionCard";
import CareerPathCard from "../components/CareerPathCard";
import GoalStatusBadge from "../components/GoalStatusBadge";

const StudentDashboard = () => {
  const [application, setApplication] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [goal, setGoal] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [appsRes, sessionsRes, goalRes] = await Promise.all([
        api.get("student/applications/"),
        api.get("sessions/"),
        api.get("goals/"),
      ]);

      const app = appsRes.data[0] || null;
      setApplication(app);
      setSessions(sessionsRes.data);
      setGoal(goalRes.data[0] || null);

      if (app) {
        setStudentName(app.first_name);
      } else {
        const userRes = await api.get("auth/user/");
        setStudentName(userRes.data.first_name);
      }
    } catch (err) {
      console.error(err.response?.data || err);
      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user_role");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <DashboardNavbar userName={studentName} />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 pt-24">

        {/* Welcome Header */}
        <div className="mb-8 text-center px-2">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
            Welcome back, {studentName}! 👋
          </h1>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 px-2">
          <div className="bg-white p-4 rounded-xl shadow-md border border-blue-100 text-center">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-semibold text-gray-800 mb-1 text-sm">Career Path</h3>
            <span className={`text-sm font-medium ${goal?.career_path ? "text-green-600" : "text-gray-400"}`}>
              {goal?.career_path ? goal.career_path.title : "Not set"}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md border border-blue-100 text-center">
            <div className="text-3xl mb-2">👨‍🎓</div>
            <h3 className="font-semibold text-gray-800 mb-1 text-sm">Mentor</h3>
            <span className={`text-sm font-medium ${application?.mentor ? "text-green-600" : "text-gray-500"}`}>
              {application?.mentor ? "Assigned" : "None"}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md border border-blue-100 text-center">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-800 mb-1 text-sm">Progress</h3>
            <span className={`text-sm font-medium ${goal ? "text-blue-600" : "text-gray-400"}`}>
              {goal?.status || "No goal"}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md border border-blue-100 text-center">
            <div className="text-3xl mb-2">🗓️</div>
            <h3 className="font-semibold text-gray-800 mb-1 text-sm">Sessions</h3>
            <span className="text-sm font-medium text-purple-600">{sessions.length}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md border border-blue-100 text-center">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-semibold text-gray-800 mb-1 text-sm">Application</h3>
            <span className={`text-sm font-medium ${
              application?.status === "Approved" ? "text-green-600" :
              application?.status === "Pending" ? "text-yellow-600" :
              application?.status === "Under Review" ? "text-blue-600" :
              application ? "text-red-600" : "text-gray-400"
            }`}>
              {application?.status || "None"}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 px-2">

          {/* ── Left column ─────────────────────────────────────── */}
          <div className="md:col-span-2 space-y-4">

            {/* Application form or status */}
            {!application ? (
              <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border-2 border-blue-200">
                <ApplicationForm onSuccess={fetchData} />
              </div>
            ) : (
              <div className="space-y-4">

                {/* Application Status */}
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border-2 border-blue-200">
                  <h2 className="text-xl md:text-2xl mb-4 text-gray-800 font-bold">
                    Application Status
                  </h2>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="font-semibold text-gray-700">Program:</span>
                      <span className="text-gray-800">{application.course}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="font-semibold text-gray-700">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        application.status === "Approved" ? "bg-green-100 text-green-800" :
                        application.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                        application.status === "Under Review" ? "bg-blue-100 text-blue-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {application.status}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="font-semibold text-gray-700">Applied:</span>
                      <span className="text-gray-800">
                        {new Date(application.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Career Goal — shown once mentor has set one */}
                {goal && (
                  <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border-2 border-indigo-200">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h2 className="text-xl md:text-2xl text-gray-800 font-bold flex items-center gap-2">
                        <span>🚀</span> Your Career Path
                      </h2>
                      <GoalStatusBadge status={goal.status} showDescription />
                    </div>

                    <CareerPathCard careerPath={goal.career_path} />

                    {/* Mentor guidance notes */}
                    {goal.mentor_notes && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                        <p className="text-xs font-semibold text-yellow-700 mb-1">
                          Mentor Guidance
                        </p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {goal.mentor_notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Mentor Feedback */}
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border-2 border-yellow-200">
                  <h2 className="text-xl md:text-2xl mb-4 text-gray-800 font-bold flex items-center gap-2">
                    <span>📝</span> Mentor Feedback
                  </h2>
                  {application.feedback ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{application.feedback}</p>
                  ) : (
                    <p className="text-gray-500">
                      Your mentor has not provided any feedback yet.
                    </p>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* ── Sidebar ─────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Mentor Card */}
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border-2 border-blue-200">
              <h2 className="text-xl md:text-2xl mb-4 text-gray-800 font-bold flex items-center gap-2">
                <span>👨‍🎓</span> Your Mentor
              </h2>

              {application?.mentor ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {application.mentor.profile_picture ? (
                      <img
                        src={application.mentor.profile_picture}
                        alt="Mentor"
                        className="w-12 h-12 rounded-full object-cover border-2 border-blue-400"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                        {`${application.mentor.user?.first_name?.[0] || ""}${application.mentor.user?.last_name?.[0] || ""}`}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-800">
                        {`${application.mentor.user?.first_name || ""} ${application.mentor.user?.last_name || ""}`}
                      </p>
                      <p className="text-xs text-gray-600">
                        {application.mentor.specialization || "Mentorship Specialist"}
                      </p>
                    </div>
                  </div>

                  {application.mentor.bio && (
                    <div className="text-gray-700 text-sm leading-relaxed border-t pt-3">
                      <h3 className="font-semibold mb-1">About</h3>
                      <p className="whitespace-pre-wrap">{application.mentor.bio}</p>
                    </div>
                  )}

                  {application.mentor.phone_number && (
                    <div className="text-sm text-gray-700 flex items-center gap-2 pt-2 border-t border-blue-100">
                      <span>📞</span>
                      <span>{application.mentor.phone_number}</span>
                    </div>
                  )}

                  {application.mentor.user?.email && (
                    <div className="text-sm text-gray-700 flex items-center gap-2 pt-2 border-t border-blue-100">
                      <span>📧</span>
                      <span className="truncate">{application.mentor.user.email}</span>
                    </div>
                  )}

                  <a
                    href={`mailto:${application.mentor.user?.email || ""}`}
                    className="w-full block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    Contact Mentor
                  </a>
                </div>
              ) : (
                <p className="text-gray-500 text-center text-sm">
                  {application?.status === "Approved"
                    ? "A mentor will be assigned to you soon."
                    : "Not assigned yet. Your application is still pending."}
                </p>
              )}
            </div>

            {/* Session History */}
            {application?.status === "Approved" && (
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border-2 border-green-200">
                <h2 className="text-xl md:text-2xl mb-4 text-gray-800 font-bold flex items-center gap-2">
                  <span>🗓️</span> My Sessions
                  <span className="text-sm font-normal text-gray-400">({sessions.length})</span>
                </h2>
                {sessions.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center">
                    No sessions scheduled yet — your mentor will add one soon.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((s) => (
                      <SessionCard key={s.id} session={s} />
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
