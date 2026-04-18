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

const UpcomingCard = ({ session, onCompleted }) => {
  const [confirming, setConfirming] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError]           = useState("");

  const complete = async () => {
    setCompleting(true);
    setError("");
    try {
      await api.post(`sessions/${session.id}/complete/`);
      onCompleted(session.id);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to mark as completed.");
      setCompleting(false);
      setConfirming(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
      <div>
        <p className="font-semibold text-gray-800">{session.student_username || session.student}</p>
        <p className="text-xs text-gray-400 mt-0.5">{formatTime(session.requested_time)}</p>
      </div>
      <p className="text-sm text-gray-700">{session.goal}</p>

      {session.meet_link && (
        <a
          href={session.meet_link}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
        >
          Join session
        </a>
      )}

      {error && <p className="text-red-600 text-xs">{error}</p>}

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="w-full py-2 border border-green-400 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50 transition"
        >
          Mark as completed
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Has this session taken place?</p>
          <div className="flex gap-2">
            <button
              onClick={complete}
              disabled={completing}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-green-700 transition"
            >
              {completing ? "Saving…" : "Yes, completed"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const UpcomingTab = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    api.get("sessions/?status=accepted")
      .then((r) => setSessions(Array.isArray(r.data) ? r.data : (r.data.results ?? [])))
      .catch(() => setError("Failed to load upcoming sessions."))
      .finally(() => setLoading(false));
  }, []);

  const remove = (id) => setSessions((prev) => prev.filter((s) => s.id !== id));

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800 pt-2">Upcoming sessions</h1>
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
          <p className="text-gray-500 font-medium">No upcoming sessions.</p>
          <p className="text-gray-400 text-sm mt-1">Accepted requests will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <UpcomingCard key={s.id} session={s} onCompleted={remove} />
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingTab;
