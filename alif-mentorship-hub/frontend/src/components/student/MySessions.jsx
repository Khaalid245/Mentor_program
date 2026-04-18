import { useEffect, useState } from "react";
import api from "../../services/axios";

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_BADGE = {
  pending:   "bg-amber-100 text-amber-700",
  accepted:  "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  declined:  "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-600",
};

const formatTime = (raw) => {
  if (!raw) return "—";
  try {
    return new Date(raw).toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    }) + " at " + new Date(raw).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return raw;
  }
};

// ── Star Selector ─────────────────────────────────────────────────────────────
const StarSelector = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button key={s} type="button" onClick={() => onChange(s)}
        className={`text-2xl transition ${s <= value ? "text-amber-400" : "text-gray-300 hover:text-amber-300"}`}>
        ★
      </button>
    ))}
  </div>
);

// ── Review Modal ──────────────────────────────────────────────────────────────
const ReviewModal = ({ session, onClose, onSuccess }) => {
  const [rating, setRating]       = useState(0);
  const [comment, setComment]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState("");

  const submit = async () => {
    if (!rating) { setError("Please select a star rating."); return; }
    setSubmitting(true);
    setError("");
    try {
      await api.post(`sessions/${session.id}/review/`, { rating, comment });
      onSuccess(session.id);
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Leave a review</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Rating</p>
          <StarSelector value={rating} onChange={setRating} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Comment (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Share your experience…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          onClick={submit}
          disabled={submitting}
          className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {submitting ? "Submitting…" : "Submit review"}
        </button>
      </div>
    </div>
  );
};

// ── Session Card ──────────────────────────────────────────────────────────────
const SessionCard = ({ session, onCancelled, onReviewed }) => {
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [reviewed, setReviewed]     = useState(false);

  const cancel = async () => {
    setCancelling(true);
    setCancelError("");
    try {
      await api.post(`sessions/${session.id}/cancel/`);
      onCancelled(session.id);
    } catch (err) {
      setCancelError(err.response?.data?.detail || "Failed to cancel.");
      setCancelling(false);
      setConfirming(false);
    }
  };

  const handleReviewed = (id) => {
    setReviewed(true);
    setShowReview(false);
    onReviewed(id);
  };

  const status = session.status?.toLowerCase();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <p className="font-semibold text-gray-800">
            {session.mentor_username}
          </p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_BADGE[status] || "bg-gray-100 text-gray-600"}`}>
          {session.status}
        </span>
      </div>

      <p className="text-sm text-gray-600">{session.goal}</p>
      <p className="text-xs text-gray-400">{formatTime(session.requested_time)}</p>

      {cancelError && <p className="text-red-600 text-xs">{cancelError}</p>}

      <div className="flex flex-wrap gap-2 pt-1">
        {status === "accepted" && session.meet_link && (
          <a href={session.meet_link} target="_blank" rel="noopener noreferrer"
            className="flex-1 text-center py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
            Join session
          </a>
        )}

        {status === "completed" && !session.has_review && !reviewed && (
          <button onClick={() => setShowReview(true)}
            className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition">
            Leave a review
          </button>
        )}

        {status === "completed" && (session.has_review || reviewed) && (
          <span className="text-xs text-green-600 font-medium">✓ Review submitted</span>
        )}

        {status === "pending" && !confirming && (
          <button onClick={() => setConfirming(true)}
            className="flex-1 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition">
            Cancel request
          </button>
        )}

        {status === "pending" && confirming && (
          <>
            <p className="w-full text-xs text-gray-600">Are you sure you want to cancel?</p>
            <button onClick={cancel} disabled={cancelling}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-red-700 transition">
              {cancelling ? "Cancelling…" : "Yes, cancel"}
            </button>
            <button onClick={() => setConfirming(false)}
              className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              Keep it
            </button>
          </>
        )}
      </div>

      {showReview && (
        <ReviewModal session={session} onClose={() => setShowReview(false)} onSuccess={handleReviewed} />
      )}
    </div>
  );
};

// ── My Sessions (Tab 2) ───────────────────────────────────────────────────────
const PILLS = ["All", "Upcoming", "Pending", "Completed"];

const MySessions = ({ onBrowse }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [pill, setPill]         = useState("All");

  useEffect(() => {
    api.get("sessions/")
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : (r.data.results ?? []);
        setSessions(data);
      })
      .catch(() => setError("Failed to load sessions."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = sessions.filter((s) => {
    if (pill === "All")       return true;
    if (pill === "Upcoming")  return s.status?.toLowerCase() === "accepted";
    if (pill === "Pending")   return s.status?.toLowerCase() === "pending";
    if (pill === "Completed") return s.status?.toLowerCase() === "completed";
    return true;
  });

  const handleCancelled = (id) =>
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, status: "cancelled" } : s));

  const handleReviewed = (id) =>
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, has_review: true } : s));

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800 pt-2">My sessions</h1>

      {/* Pill filters */}
      <div className="flex gap-2 flex-wrap">
        {PILLS.map((p) => (
          <button key={p} onClick={() => setPill(p)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              pill === p ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {p}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-8 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-gray-500 font-medium">
            {sessions.length === 0
              ? "You have no sessions yet. Browse mentors to request your first session."
              : `No ${pill.toLowerCase()} sessions.`}
          </p>
          {sessions.length === 0 && (
            <button onClick={onBrowse}
              className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
              Browse mentors
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <SessionCard key={s.id} session={s} onCancelled={handleCancelled} onReviewed={handleReviewed} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MySessions;
