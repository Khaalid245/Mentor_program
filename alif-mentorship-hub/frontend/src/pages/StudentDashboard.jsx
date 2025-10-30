import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/axios";
import ApplicationForm from "../components/ApplicationForm";
import DashboardNavbar from "../components/DashboardNavbar";

const StudentDashboard = () => {
  const [application, setApplication] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [meetingDetails, setMeetingDetails] = useState(null);
  const navigate = useNavigate();

  const fetchApplication = async () => {
    try {
      const res = await api.get("student/applications/");
      const app = res.data[0] || null;
      setApplication(app);

      if (app) {
        setStudentName(app.first_name);
        if (app.status === "Approved" && app.mentor) {
          if (
            app.meeting_date &&
            app.meeting_time &&
            app.meeting_link &&
            app.mentor?.email
          ) {
            setMeetingDetails({
              meeting_date: app.meeting_date,
              meeting_time: app.meeting_time,
              meeting_link: app.meeting_link,
              mentor: { email: app.mentor.email },
            });
          } else {
            try {
              const meetingRes = await api.get(`student/meetings/${app.id}`);
              const meetingData = meetingRes.data; // adjust as needed
              setMeetingDetails({
                meeting_date: meetingData.meeting_date,
                meeting_time: meetingData.meeting_time,
                meeting_link: meetingData.meeting_link,
                mentor: { email: app.mentor.email },
              });
            } catch (err) {
              console.error("Error fetching meeting details:", err);
            }
          }
        }
      } else {
        const userRes = await api.get("auth/user/");
        setStudentName(userRes.data.first_name);
      }
    } catch (err) {
      console.error(err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, []);

  const formatDateTime = (isoString) => {
    if (!isoString) return "TBD";
    return new Date(isoString).toLocaleString([], {
      dateStyle: "full",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-white">
      <DashboardNavbar userType="student" userName={studentName} />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 pt-24">
        {/* Welcome Header */}
        <div className="mb-8 text-center px-2">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
            Welcome back, {studentName}! 👋
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Access mentorship, training, and resources to achieve your goals
          </p>
        </div>

        {/* Key Components Stats (Responsive grid) */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 px-2">
          <div className="bg-white p-4 rounded-xl shadow-md border border-blue-100 text-center">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-semibold text-gray-800 mb-1">
              Career Guidance
            </h3>
            <span className="text-sm text-green-600 font-medium">Active</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md border border-blue-100 text-center">
            <div className="text-3xl mb-2">👨‍🎓</div>
            <h3 className="font-semibold text-gray-800 mb-1">Mentor</h3>
            <span
              className={`text-sm font-medium ${
                application && application.mentor
                  ? "text-green-600"
                  : "text-gray-500"
              }`}
            >
              {application && application.mentor ? "Assigned" : "None"}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md border border-blue-100 text-center">
            <div className="text-3xl mb-2">💻</div>
            <h3 className="font-semibold text-gray-800 mb-1">Tech Training</h3>
            <span className="text-sm text-blue-600 font-medium">Available</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md border border-blue-100 text-center">
            <div className="text-3xl mb-2">📚</div>
            <h3 className="font-semibold text-gray-800 mb-1">Resources</h3>
            <span className="text-sm text-purple-600 font-medium">4</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md border border-blue-100 text-center">
            <div className="text-3xl mb-2">🌐</div>
            <h3 className="font-semibold text-gray-800 mb-1">Events</h3>
            <span className="text-sm text-orange-600 font-medium">4</span>
          </div>
        </div>

        {/* Main Content - Responsive layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 px-2">
          {/* Main Content Area (spans full width on mobile) */}
          <div className="md:col-span-2 space-y-4">
            {!application ? (
              <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border-2 border-blue-200">
                <div className="text-center">
                  <div className="text-4xl md:text-6xl mb-4">🚀</div>
                  <h2 className="text-xl md:text-3xl font-bold mb-3 text-gray-800">
                    Start Your Mentorship Journey
                  </h2>
                  <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-lg">
                    Join our comprehensive program offering career guidance,
                    mentorship connections, technology training, and community
                    engagement opportunities.
                  </p>
                  <ApplicationForm onSuccess={fetchApplication} />
                </div>
              </div>
            ) : (
              // Existing Application Status & Feedback
              <div className="space-y-4">
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border-2 border-blue-200">
                  <h2 className="text-2xl md:text-3xl mb-4 text-gray-800 font-bold">
                    Application Status
                  </h2>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="font-semibold text-gray-700">
                        Program:
                      </span>
                      <span className="text-gray-800">
                        {application.program}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="font-semibold text-gray-700">
                        Status:
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          application.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : application.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {application.status}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="font-semibold text-gray-700">
                        Applied:
                      </span>
                      <span className="text-gray-800">
                        {new Date(application.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Feedback */}
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border-2 border-yellow-200">
                  <h2 className="text-2xl md:text-3xl mb-4 text-gray-800 font-bold flex items-center gap-2">
                    <span>📝</span> Mentor Feedback
                  </h2>
                  {application.feedback ? (
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {application.feedback}
                    </p>
                  ) : (
                    <p className="text-gray-500">
                      Your mentor has not provided any feedback yet.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Mentor and Meeting info */}
          <div className="space-y-4">
            {/* Mentor Info */}
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border-2 border-blue-200">
              <h2 className="text-xl md:text-2xl mb-4 text-gray-800 font-bold flex items-center gap-2">
                <span>👨‍🎓</span> Your Mentor
              </h2>
              {application && application.mentor ? (
                <div className="space-y-3">
                  {/* Mentor details */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                      {`${application.mentor.first_name?.[0] || ""}${
                        application.mentor.last_name?.[0] || ""
                      }`}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-lg">
                        {`${application.mentor.first_name || ""} ${
                          application.mentor.last_name || ""
                        }`}
                      </p>
                      <p className="text-xs text-gray-600">
                        Mentorship Specialist
                      </p>
                    </div>
                  </div>
                  {/* Mentor Email */}
                  {application.mentor.user?.email && (
                    <div className="text-sm text-gray-700 flex items-center gap-2 pt-2 border-t border-blue-100">
                      <span className="text-lg">📧</span>
                      <span className="truncate">
                        {application.mentor.user.email}
                      </span>
                    </div>
                  )}
                  {/* Contact Button */}
                  <a
                    href={`mailto:${application.mentor.user?.email || ""}`}
                    className="w-full block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    Contact Mentor
                  </a>
                </div>
              ) : (
                <p className="text-gray-500 text-center">
                  {application && application.status === "Approved"
                    ? "A mentor will be assigned to you soon."
                    : "Not assigned yet. Your application is still pending."}
                </p>
              )}
            </div>

            {/* Meeting Schedule - only if approved and mentor assigned */}
            {application &&
              application.status === "Approved" &&
              application.mentor && (
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border-2 border-green-200">
                  <h2 className="text-xl md:text-2xl mb-4 text-gray-800 font-bold flex items-center gap-2">
                    <span>🗓️</span> Meeting Schedule
                  </h2>
                  {application.consultation_date ? (
                    <div className="space-y-3 md:space-y-4">
                      {/* Meeting Time */}
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-lg">🕒</span>
                        <div>
                          <p className="font-semibold text-gray-700">
                            Meeting Time
                          </p>
                          <p className="text-gray-600">
                            {formatDateTime(application.consultation_date)}
                          </p>
                        </div>
                      </div>
                      {/* Meeting Link */}
                      {application.meeting_link && (
                        <div className="flex items-center gap-2 md:gap-3">
                          <span className="text-lg">🔗</span>
                          <div>
                            <p className="font-semibold text-gray-700">
                              Meeting Link
                            </p>
                            <a
                              href={application.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline break-words"
                            >
                              Click here to join your Google Meet
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center">
                      No meeting scheduled yet — your mentor will assign one
                      soon.
                    </p>
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
