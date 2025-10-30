import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/axios";
import DashboardNavbar from "../components/DashboardNavbar";

const MentorDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const navigate = useNavigate();

  // ✅ Fetch assigned applications
  const fetchApplications = async () => {
    try {
      const res = await api.get("student/applications/");
      setApplications(res.data);
    } catch (err) {
      console.error("Fetch error:", err.response?.data || err);
      alert("Failed to fetch applications. Please re-login.");
      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // ✅ Update application status
  const handleUpdateStatus = async (appId, status, consultationDate = null) => {
    try {
      setUpdatingId(appId);
      const payload = {
        status,
        consultation_date: consultationDate,
      };

      await api.post(`student/applications/${appId}/update_status/`, payload);
      alert(`Application ${status} successfully!`);
      fetchApplications();
    } catch (err) {
      console.error("Update error:", err.response?.data || err);
      if (err.response?.status === 403) {
        alert("You do not have permission to update this application.");
      } else {
        alert("Failed to update status.");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <p className="p-4">Loading applications...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <DashboardNavbar userType="mentor" userName="Mentor" />

      <div className="max-w-5xl mx-auto p-4 pt-24">
        <h1 className="text-2xl font-bold mb-4">Mentor Dashboard</h1>

        {applications.length === 0 ? (
          <p>No student applications assigned yet.</p>
        ) : (
          <ul>
            {applications.map((app) => (
              <li
                key={app.id}
                className="border p-4 mb-4 rounded shadow bg-white"
              >
                <p>
                  <strong>Name:</strong> {app.first_name} {app.last_name}
                </p>
                <p>
                  <strong>Course:</strong> {app.course}
                </p>
                <p>
                  <strong>Status:</strong> {app.status}
                </p>
                <p>
                  <strong>Feedback:</strong> {app.feedback || "No feedback yet"}
                </p>
                <p>
                  <strong>Consultation Date:</strong>{" "}
                  {app.consultation_date || "Not scheduled"}
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    disabled={updatingId === app.id}
                    onClick={() =>
                      handleUpdateStatus(
                        app.id,
                        "Approved",
                        new Date().toISOString()
                      )
                    }
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Approve & Schedule
                  </button>
                  <button
                    disabled={updatingId === app.id}
                    onClick={() => handleUpdateStatus(app.id, "Rejected")}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MentorDashboard;
