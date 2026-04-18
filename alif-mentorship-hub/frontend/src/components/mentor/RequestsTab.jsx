import { useEffect, useState } from "react";
import api from "../../services/axios";

const formatTime = (raw) => {
  if (!raw) return "—";
  try {
    return new Date(raw).toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    }) + " at " + new Date(raw).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch { return raw; }
};

// ── Accept Modal ──────────────────────────────────────────────────────────────
const AcceptModal = ({ session, onClose, onAccepted }) => {
  const [meetLink, setMeetLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isValidUrl = (v) => {
    try { return new URL(v).protocol === "https:"; } catch { return false; }
  };

  const submit = async () => {
    if (!isValidUrl(meetLink)) { setError("Please enter a valid URL starting with https://"); return; }
    setSubmitting(true);
    setError("");
    try {
      await api.post(`sessions/${session.id}/accept/`, { meet_link: meetLink });
      onAccepted(session.id);
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || "Failed to accept session.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Accept session</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* Read-only summary */}
        <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-sm">
          <p><span className="text-gray-500">Student:</span> <span className="font-medium text-gray-800">{session.student_username || session.student}</span></p>
          <p><span className="text-gray-500">Goal:</span> <span className="text-gray-700">{session.goal}</span></p>
          <p><span className="text-gray-500">Time:</span> <span className="text-gray-700">{formatTime(session.requested_time)}</span></p>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Meet link (required)</label>
          <input
            value={meetLink}
            onChange={(e) => setMeetLink(e.target.value)}
            placeholder="https://meet.google.com/..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {submitting ? "Accepting…" : "Confirm & accept"}
        </button>
      </div>
    </div>
  );
};

// ── Request Card ──────────────────────────────────────────────────────────────
const RequestCard = ({ session, onAccepted, onDeclined }) => {
  const [accepting, setAccepting]   = useState(false);
  const [declining, setDeclining]   = useState(false);
  const [declineErr, setDeclineErr] = useState("");

  const confirmDecline = async () => {
    setDeclining(true);
    setDeclineErr("");
    try {
      await api.post(`sessions/${session.id}/decline/`);
      onDeclined(session.id);
    } catch (err) {
      setDeclineErr(err.response?.data?.detail || "Failed to decline.");
      setDeclining(false);
    }
  };

  const [confirmingDecline, setConfirmingDecline] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
      <div>
        <p className="font-semibold text-gray-800">{session.student_username || session.student}</p>
        <p className="text-xs text-gray-400 mt-0.5">{formatTime(session.requested_time)}</p>
      </div>
      <p className="text-sm text-gray-700">{session.goal}</p>

      {declineErr && <p className="text-red-600 text-xs">{declineErr}</p>}

      {!confirmingDecline ? (
        <div className="flex gap-2">
          <button
            onClick={() => setAccepting(true)}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
          >
            Accept
          </button>
          <button
            onClick={() => setConfirmingDecline(true)}
            className="flex-1 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition"
          >
            Decline
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Are you sure you want to decline this request?</p>
          <div className="flex gap-2">
            <button
              onClick={confirmDecline}
              disabled={declining}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-red-700 transition"
            >
              {declining ? "Declining…" : "Confirm"}
            </button>
            <button
              onClick={() => setConfirmingDecline(false)}
              className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {accepting && (
        <AcceptModal
          session={session}
          onClose={() => setAccepting(false)}
          onAccepted={(id) => { setAccepting(false); onAccepted(id); }}
        />
      )}
    </div>
  );
};

// ── Requests Tab ──────────────────────────────────────────────────────────────
const RequestsTab = ({ onCountChange }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const r = await api.get("sessions/?status=pending");
      const data = Array.isArray(r.data) ? r.data : (r.data.results ?? []);
      setSessions(data);
      onCountChange(data.length);
    } catch {
      setError("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const remove = (id) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      onCountChange(updated.length);
      return updated;
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800 pt-2">Session requests</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-8 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 font-medium">No pending requests right now.</p>
          <p className="text-gray-400 text-sm mt-1">Make sure your profile is complete and verified so students can find you.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <RequestCard key={s.id} session={s} onAccepted={remove} onDeclined={remove} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RequestsTab;
