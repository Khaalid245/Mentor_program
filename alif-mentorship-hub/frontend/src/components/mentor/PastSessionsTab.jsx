import { useEffect, useState } from "react";
import api from "../../services/axios";

const formatDate = (raw) => {
  if (!raw) return "—";
  try {
    return new Date(raw).toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } catch { return raw; }
};

const PastCard = ({ session }) => {
  const [notes, setNotes]       = useState(session.mentor_notes || "");
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState(session.mentor_notes || "");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await api.patch(`sessions/${session.id}/`, { mentor_notes: draft });
      setNotes(draft);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save notes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-2">
      <div>
        <p className="font-semibold text-gray-800">{session.student_username || session.student}</p>
        <p className="text-xs text-gray-400 mt-0.5">{formatDate(session.requested_time)}</p>
      </div>
      <p className="text-sm text-gray-700">{session.goal}</p>

      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-gray-500">Mentor notes</p>
          {notes && !editing && (
            <button
              onClick={() => { setDraft(notes); setEditing(true); }}
              className="text-xs text-blue-600 hover:underline"
            >
              Edit notes
            </button>
          )}
        </div>

        {!editing && !notes && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-blue-600 font-medium hover:underline"
          >
            + Add notes
          </button>
        )}

        {!editing && notes && (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{notes}</p>
        )}

        {editing && (
          <div className="space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              placeholder="Add your session notes here…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-red-600 text-xs">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-blue-700 transition"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => { setEditing(false); setDraft(notes); }}
                className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PastSessionsTab = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    api.get("sessions/?status=completed")
      .then((r) => setSessions(Array.isArray(r.data) ? r.data : (r.data.results ?? [])))
      .catch(() => setError("Failed to load past sessions."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800 pt-2">Past sessions</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-12 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 font-medium">No completed sessions yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => <PastCard key={s.id} session={s} />)}
        </div>
      )}
    </div>
  );
};

export default PastSessionsTab;
