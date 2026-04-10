import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/axios";
import DashboardNavbar from "../components/DashboardNavbar";
import SessionCard from "../components/SessionCard";
import GoalStatusBadge from "../components/GoalStatusBadge";

// ── Goal form for setting/updating a student's career goal ──────────────────
const GoalForm = ({ studentId, existingGoal, careerPaths, onSaved, onCancel }) => {
  const [form, setForm] = useState({
    career_path_id: existingGoal?.career_path?.id || "",
    status: existingGoal?.status || "Exploring",
    mentor_notes: existingGoal?.mentor_notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.career_path_id) {
      setError("Please select a career path.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      // create uses upsert logic on the backend
      await api.post("goals/", { ...form, student_id: studentId });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || "Failed to save goal.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
      <h4 className="font-semibold text-indigo-800 text-sm">
        {existingGoal ? "Update Career Goal" : "Set Career Goal"}
      </h4>

      {error && <p className="text-red-600 text-xs">{error}</p>}

      <div>
        <label className="label">Career Path *</label>
        <select
          value={form.career_path_id}
          onChange={(e) => setForm((p) => ({ ...p, career_path_id: e.target.value }))}
          className="input"
          required
        >
          <option value="">Select a career path</option>
          {careerPaths.map((cp) => (
            <option key={cp.id} value={cp.id}>{cp.title}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Progress Status</label>
        <select
          value={form.status}
          onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
          className="input"
        >
          <option value="Exploring">🔍 Exploring</option>
          <option value="Decided">🎯 Decided</option>
          <option value="Applying">📝 Applying</option>
          <option value="Enrolled">🎓 Enrolled</option>
        </select>
      </div>

      <div>
        <label className="label">Guidance Notes for Student</label>
        <textarea
          rows={3}
          value={form.mentor_notes}
          onChange={(e) => setForm((p) => ({ ...p, mentor_notes: e.target.value }))}
          placeholder="Next steps, advice, resources to look at..."
          className="input resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className={`px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {saving ? "Saving..." : "Save Goal"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

// ── Small form for creating a new session ────────────────────────────────────
const NewSessionForm = ({ applicationId, onCreated, onCancel }) => {
  const [form, setForm] = useState({ scheduled_at: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("sessions/", {
        application_id: applicationId,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        notes: form.notes,
      });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create session.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
      <h4 className="font-semibold text-blue-800 text-sm">Schedule New Session</h4>

      {error && <p className="text-red-600 text-xs">{error}</p>}

      <div>
        <label className="label">Date & Time *</label>
        <input
          type="datetime-local"
          value={form.scheduled_at}
          min={new Date().toISOString().slice(0, 16)}
          onChange={(e) => setForm((p) => ({ ...p, scheduled_at: e.target.value }))}
          required
          className="input"
        />
      </div>

      <div>
        <label className="label">Initial Notes (optional)</label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          placeholder="What will you cover in this session?"
          className="input resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className={`px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {saving ? "Saving..." : "Create Session"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

// ── Small form for editing an existing session ───────────────────────────────
const EditSessionForm = ({ session, onSaved, onCancel }) => {
  const [form, setForm] = useState({
    notes: session.notes || "",
    outcome: session.outcome,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.patch(`sessions/${session.id}/`, form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update session.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
      <h4 className="font-semibold text-yellow-800 text-sm">Edit Session</h4>

      {error && <p className="text-red-600 text-xs">{error}</p>}

      <div>
        <label className="label">Notes</label>
        <textarea
          rows={4}
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          placeholder="Session notes, guidance given, next steps..."
          className="input resize-none"
        />
      </div>

      <div>
        <label className="label">Outcome</label>
        <select
          value={form.outcome}
          onChange={(e) => setForm((p) => ({ ...p, outcome: e.target.value }))}
          className="input"
        >
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className={`px-4 py-2 bg-yellow-600 text-white text-sm font-semibold rounded-lg hover:bg-yellow-700 transition ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

// ── Main MentorDashboard ─────────────────────────────────────────────────────
const MentorDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [goals, setGoals] = useState([]);           // goals for all assigned students
  const [careerPaths, setCareerPaths] = useState([]); // available career paths
  const [mentorName, setMentorName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const [reviewForms, setReviewForms] = useState({});
  const [newSessionFor, setNewSessionFor] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [goalFormFor, setGoalFormFor] = useState(null); // studentId whose goal form is open

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [appsRes, userRes, sessionsRes, goalsRes, pathsRes] = await Promise.all([
        api.get("student/applications/"),
        api.get("auth/user/"),
        api.get("sessions/"),
        api.get("goals/"),
        api.get("career-paths/"),
      ]);

      setApplications(appsRes.data);
      setMentorName(userRes.data.first_name || userRes.data.username);
      setSessions(sessionsRes.data);
      setGoals(goalsRes.data);
      setCareerPaths(pathsRes.data);

      // Initialise review form state per application
      const forms = {};
      appsRes.data.forEach((app) => {
        forms[app.id] = {
          feedback: app.feedback || "",
          consultationDate: app.consultation_date
            ? app.consultation_date.slice(0, 16)
            : "",
          open: false,
        };
      });
      setReviewForms(forms);
    } catch (err) {
      console.error("Fetch error:", err.response?.data || err);
      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user_role");
        navigate("/login");
      } else {
        setError("Failed to load dashboard. Please refresh.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Review form helpers ────────────────────────────────────────────────────
  const toggleReviewForm = (appId) => {
    setReviewForms((prev) => ({
      ...prev,
      [appId]: { ...prev[appId], open: !prev[appId].open },
    }));
  };

  const handleFormChange = (appId, field, value) => {
    setReviewForms((prev) => ({
      ...prev,
      [appId]: { ...prev[appId], [field]: value },
    }));
  };

  const handleSubmitReview = async (appId, newStatus) => {
    const form = reviewForms[appId];
    if (newStatus === "Approved" && !form.consultationDate) {
      alert("Please select a consultation date before approving.");
      return;
    }
    try {
      setUpdatingId(appId);
      await api.post(`student/applications/${appId}/update_status/`, {
        status: newStatus,
        feedback: form.feedback,
        consultation_date: form.consultationDate
          ? new Date(form.consultationDate).toISOString()
          : null,
      });
      setReviewForms((prev) => ({
        ...prev,
        [appId]: { ...prev[appId], open: false },
      }));
      fetchData();
    } catch (err) {
      console.error("Update error:", err.response?.data || err);
      alert(
        err.response?.status === 403
          ? "You do not have permission to update this application."
          : "Failed to update status. Please try again."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getStatusBadge = (status) => {
    const styles = {
      Pending: "bg-yellow-100 text-yellow-800",
      "Under Review": "bg-blue-100 text-blue-800",
      Approved: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-800"}`}>
        {status}
      </span>
    );
  };

  // Goal for a specific student — matched by student_id from the serializer
  const goalForStudent = (userId) => goals.find((g) => g.student_id === userId);

  // Sessions belonging to a specific application
  const sessionsFor = (appId) => sessions.filter((s) => s.application_id === appId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <DashboardNavbar userName={mentorName} />

      <div className="max-w-5xl mx-auto p-4 pt-24">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-600">Mentor Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your assigned students and sessions</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {applications.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center border border-blue-100">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-600 font-medium">No student applications assigned yet.</p>
            <p className="text-gray-400 text-sm mt-1">An admin will assign students to you shortly.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((app) => {
              const form = reviewForms[app.id] || {};
              const isUpdating = updatingId === app.id;
              const appSessions = sessionsFor(app.id);
              const studentGoal = goalForStudent(app.user?.id);

              return (
                <div key={app.id} className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden">

                  {/* ── Application Header ─────────────────────────────── */}
                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-gray-800">
                          {app.first_name} {app.last_name}
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">{app.course}</p>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>

                    {/* Student details */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div><span className="font-medium text-gray-700">Email: </span>{app.email}</div>
                      <div><span className="font-medium text-gray-700">Phone: </span>{app.phone}</div>
                      <div><span className="font-medium text-gray-700">School: </span>{app.previous_school}</div>
                      <div><span className="font-medium text-gray-700">GPA: </span>{app.gpa}</div>
                    </div>

                    {/* Career goals — key info for the mentor */}
                    {app.career_goals && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs font-semibold text-blue-700 mb-1">Student's Career Goals</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.career_goals}</p>
                      </div>
                    )}

                    {/* Existing feedback */}
                    {app.feedback && (
                      <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                        <p className="text-xs font-semibold text-yellow-700 mb-1">Your feedback</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.feedback}</p>
                      </div>
                    )}

                    {/* Review action — only for non-approved */}
                    {app.status !== "Approved" && (
                      <button
                        onClick={() => toggleReviewForm(app.id)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
                      >
                        {form.open ? "Cancel Review" : "Write Review"}
                      </button>
                    )}
                  </div>

                  {/* ── Inline Review Form ─────────────────────────────── */}
                  {form.open && (
                    <div className="border-t border-blue-100 bg-blue-50 p-5 space-y-4">
                      <h3 className="font-semibold text-gray-700">Review Application</h3>

                      <div>
                        <label className="label">Feedback for student</label>
                        <textarea
                          rows={4}
                          value={form.feedback}
                          onChange={(e) => handleFormChange(app.id, "feedback", e.target.value)}
                          placeholder="Write your feedback, guidance, or reasons for your decision..."
                          className="input resize-none"
                        />
                      </div>

                      <div>
                        <label className="label">
                          Consultation date & time{" "}
                          <span className="text-gray-400">(required to approve)</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={form.consultationDate}
                          min={new Date().toISOString().slice(0, 16)}
                          onChange={(e) => handleFormChange(app.id, "consultationDate", e.target.value)}
                          className="input w-full sm:w-auto"
                        />
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          disabled={isUpdating}
                          onClick={() => handleSubmitReview(app.id, "Approved")}
                          className={`px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {isUpdating ? "Saving..." : "Approve & Schedule"}
                        </button>
                        <button
                          disabled={isUpdating}
                          onClick={() => handleSubmitReview(app.id, "Rejected")}
                          className={`px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {isUpdating ? "Saving..." : "Reject"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Career Goal Section ───────────────────────────── */}
                  {app.status === "Approved" && (
                    <div className="border-t border-gray-100 p-5 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-700">Career Goal</h3>
                          {studentGoal && <GoalStatusBadge status={studentGoal.status} />}
                        </div>
                        <button
                          onClick={() => setGoalFormFor(goalFormFor === app.user?.id ? null : app.user?.id)}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
                        >
                          {goalFormFor === app.user?.id ? "Cancel" : studentGoal ? "Update Goal" : "Set Goal"}
                        </button>
                      </div>

                      {/* Current goal summary */}
                      {studentGoal && goalFormFor !== app.user?.id && (
                        <div className="text-sm text-gray-700 space-y-1">
                          <p><span className="font-medium">Path: </span>{studentGoal.career_path?.title}</p>
                          {studentGoal.mentor_notes && (
                            <p className="text-gray-500 italic">{studentGoal.mentor_notes}</p>
                          )}
                        </div>
                      )}

                      {/* Goal form */}
                      {goalFormFor === app.user?.id && (
                        <GoalForm
                          studentId={app.user?.id}
                          existingGoal={studentGoal}
                          careerPaths={careerPaths}
                          onSaved={() => { setGoalFormFor(null); fetchData(); }}
                          onCancel={() => setGoalFormFor(null)}
                        />
                      )}

                      {!studentGoal && goalFormFor !== app.user?.id && (
                        <p className="text-sm text-gray-400 italic">No career goal set yet.</p>
                      )}
                    </div>
                  )}

                  {/* ── Sessions Section ───────────────────────────────── */}
                  {app.status === "Approved" && (
                    <div className="border-t border-gray-100 p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-700">
                          Sessions{" "}
                          <span className="text-gray-400 font-normal text-sm">
                            ({appSessions.length})
                          </span>
                        </h3>
                        <button
                          onClick={() =>
                            setNewSessionFor(newSessionFor === app.id ? null : app.id)
                          }
                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition"
                        >
                          {newSessionFor === app.id ? "Cancel" : "+ New Session"}
                        </button>
                      </div>

                      {/* New session form */}
                      {newSessionFor === app.id && (
                        <NewSessionForm
                          applicationId={app.id}
                          onCreated={() => { setNewSessionFor(null); fetchData(); }}
                          onCancel={() => setNewSessionFor(null)}
                        />
                      )}

                      {/* Edit session form */}
                      {editingSession?.application_id === app.id && (
                        <EditSessionForm
                          session={editingSession}
                          onSaved={() => { setEditingSession(null); fetchData(); }}
                          onCancel={() => setEditingSession(null)}
                        />
                      )}

                      {/* Session list */}
                      {appSessions.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">
                          No sessions yet. Schedule the first one above.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {appSessions.map((s) => (
                            <SessionCard
                              key={s.id}
                              session={s}
                              onEdit={(session) => setEditingSession(session)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorDashboard;
