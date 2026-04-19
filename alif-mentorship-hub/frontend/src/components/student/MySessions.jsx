import { useEffect, useState } from "react";
import api from "../../services/axios";

// ── Status Badge Styles ───────────────────────────────────────────────────────
const STATUS_STYLES = {
  pending: { bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" },
  accepted: { bg: "#CCFBF1", text: "#0D9488", border: "#99F6E4" },
  completed: { bg: "#D1FAE5", text: "#059669", border: "#A7F3D0" },
  declined: { bg: "#FEE2E2", text: "#DC2626", border: "#FECACA" },
  cancelled: { bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB" },
};

// ── Format Time ───────────────────────────────────────────────────────────────
const formatTime = (raw) => {
  if (!raw) return "—";
  try {
    const date = new Date(raw);
    const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
    const day = date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    return `${weekday}, ${day} at ${time}`;
  } catch {
    return raw;
  }
};

// ── Star Selector ─────────────────────────────────────────────────────────────
const StarSelector = ({ value, onChange }) => (
  <div className="flex gap-2">
    {[1, 2, 3, 4, 5].map((s) => (
      <button
        key={s}
        type="button"
        onClick={() => onChange(s)}
        className="text-3xl transition-colors"
        style={{ color: s <= value ? "#F59E0B" : "#D1D5DB" }}
      >
        ★
      </button>
    ))}
  </div>
);

// ── Review Modal ──────────────────────────────────────────────────────────────
const ReviewModal = ({ session, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!rating) {
      setError("Please select a star rating.");
      return;
    }
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
    <div className="fixed inset-0 bg-white z-50 flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: "#CCFBF1" }}>
        <h2 className="text-lg font-semibold" style={{ color: "#134E4A" }}>Leave a review</h2>
        <button onClick={onClose} className="text-2xl leading-none" style={{ color: "#6B7280" }}>×</button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <p className="text-sm font-medium mb-2" style={{ color: "#134E4A" }}>Rating</p>
          <StarSelector value={rating} onChange={setRating} />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: "#134E4A" }}>
            Comment (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Share your experience..."
            className="w-full border rounded-xl px-3 py-2.5 text-base resize-none focus:outline-none focus:ring-2"
            style={{ 
              borderColor: "#CCFBF1", 
              color: "#134E4A",
              backgroundColor: "#FFFFFF"
            }}
          />
        </div>

        {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}
      </div>

      {/* Submit button */}
      <div className="px-4 py-3 bg-white border-t" style={{ borderColor: "#CCFBF1" }}>
        <button
          onClick={submit}
          disabled={submitting || !rating}
          className="w-full text-sm font-medium px-4 rounded-xl transition-colors"
          style={{
            backgroundColor: "#0D9488",
            color: "#FFFFFF",
            opacity: submitting || !rating ? 0.5 : 1,
            minHeight: "44px",
            cursor: submitting || !rating ? "not-allowed" : "pointer"
          }}
        >
          {submitting ? "Submitting..." : "Submit review"}
        </button>
      </div>
    </div>
  );
};

// ── Report Modal ──────────────────────────────────────────────────────────────
const ReportModal = ({ session, onClose, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!reason) {
      setError("Please select a reason.");
      return;
    }
    if (details.trim().length < 10) {
      setError("Details must be at least 10 characters.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post(`sessions/${session.id}/report/`, { reason, details });
      onSuccess(session.id);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: "#CCFBF1" }}>
        <h2 className="text-lg font-semibold" style={{ color: "#134E4A" }}>Report mentor</h2>
        <button onClick={onClose} className="text-2xl leading-none" style={{ color: "#6B7280" }}>×</button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: "#134E4A" }}>Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2"
            style={{ 
              borderColor: "#CCFBF1", 
              color: "#134E4A",
              backgroundColor: "#FFFFFF"
            }}
          >
            <option value="">Select a reason</option>
            <option value="inappropriate_behavior">Inappropriate behavior</option>
            <option value="no_show">No show</option>
            <option value="unprofessional">Unprofessional</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: "#134E4A" }}>Details</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value.slice(0, 500))}
            rows={5}
            placeholder="Describe what happened..."
            className="w-full border rounded-xl px-3 py-2.5 text-base resize-none focus:outline-none focus:ring-2"
            style={{ 
              borderColor: "#CCFBF1", 
              color: "#134E4A",
              backgroundColor: "#FFFFFF"
            }}
          />
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>{details.length} / 500</p>
        </div>

        {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}
      </div>

      {/* Submit button */}
      <div className="px-4 py-3 bg-white border-t" style={{ borderColor: "#CCFBF1" }}>
        <button
          onClick={submit}
          disabled={submitting || !reason || details.trim().length < 10}
          className="w-full text-sm font-medium px-4 rounded-xl transition-colors"
          style={{
            backgroundColor: "#DC2626",
            color: "#FFFFFF",
            opacity: submitting || !reason || details.trim().length < 10 ? 0.5 : 1,
            minHeight: "44px",
            cursor: submitting || !reason || details.trim().length < 10 ? "not-allowed" : "pointer"
          }}
        >
          {submitting ? "Submitting..." : "Submit report"}
        </button>
      </div>
    </div>
  );
};

// ── Session Card ──────────────────────────────────────────────────────────────
const SessionCard = ({ session, onCancelled, onReviewed, onReported }) => {
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [reported, setReported] = useState(false);

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

  const handleReported = (id) => {
    setReported(true);
    setShowReport(false);
    onReported(id);
  };

  const status = session.status?.toLowerCase();
  const style = STATUS_STYLES[status] || STATUS_STYLES.cancelled;

  return (
    <div className="bg-white rounded-2xl p-4 space-y-3" style={{ border: "1px solid #CCFBF1" }}>
      {/* Top row: mentor + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{ backgroundColor: "#CCFBF1", color: "#0F766E" }}
          >
            {session.mentor_username?.charAt(0).toUpperCase() || "M"}
          </div>
          <span className="text-sm font-semibold" style={{ color: "#134E4A" }}>
            {session.mentor_username}
          </span>
        </div>
        <span 
          className="text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize"
          style={{ 
            backgroundColor: style.bg, 
            color: style.text, 
            border: `1px solid ${style.border}` 
          }}
        >
          {session.status}
        </span>
      </div>

      {/* Goal */}
      <p className="text-sm" style={{ color: "#4B5563" }}>{session.goal}</p>

      {/* Date/time */}
      <div className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#0D9488" strokeWidth="1.5">
          <rect x="2" y="3" width="10" height="10" rx="1.5" />
          <path d="M2 6h10M5 1.5v3M9 1.5v3" />
        </svg>
        <span className="text-xs" style={{ color: "#6B7280" }}>{formatTime(session.requested_time)}</span>
      </div>

      {cancelError && <p className="text-xs" style={{ color: "#DC2626" }}>{cancelError}</p>}

      {/* Action area */}
      <div className="space-y-2 pt-1">
        {/* Pending: waiting message + cancel */}
        {status === "pending" && !confirming && (
          <>
            <div 
              className="rounded-xl p-3 text-xs"
              style={{ backgroundColor: "#FEF3C7", border: "1px solid #FDE68A", color: "#92400E" }}
            >
              Waiting for mentor to respond.
            </div>
            <button
              onClick={() => setConfirming(true)}
              className="w-full text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
              style={{
                backgroundColor: "#FFFFFF",
                color: "#DC2626",
                border: "1px solid #FECACA",
                minHeight: "44px"
              }}
            >
              Cancel request
            </button>
          </>
        )}

        {status === "pending" && confirming && (
          <>
            <p className="text-xs" style={{ color: "#6B7280" }}>Cancel this request?</p>
            <div className="flex gap-2">
              <button
                onClick={cancel}
                disabled={cancelling}
                className="flex-1 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                style={{
                  backgroundColor: "#DC2626",
                  color: "#FFFFFF",
                  opacity: cancelling ? 0.5 : 1,
                  minHeight: "44px",
                  cursor: cancelling ? "not-allowed" : "pointer"
                }}
              >
                {cancelling ? "Cancelling..." : "Confirm"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                style={{
                  backgroundColor: "#FFFFFF",
                  color: "#6B7280",
                  border: "1px solid #CCFBF1",
                  minHeight: "44px"
                }}
              >
                Keep
              </button>
            </div>
          </>
        )}

        {/* Accepted: confirmed message + join button */}
        {status === "accepted" && (
          <>
            <div 
              className="rounded-xl p-3 text-xs"
              style={{ backgroundColor: "#D1FAE5", border: "1px solid #A7F3D0", color: "#065F46" }}
            >
              Your session is confirmed.
            </div>
            {session.meet_link && (
              <a
                href={session.meet_link}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                style={{
                  backgroundColor: "#0D9488",
                  color: "#FFFFFF",
                  minHeight: "44px"
                }}
              >
                Join session
              </a>
            )}
          </>
        )}

        {/* Completed: review + report buttons */}
        {status === "completed" && (
          <div className="flex gap-2">
            {!session.has_review && !reviewed ? (
              <button
                onClick={() => setShowReview(true)}
                className="flex-1 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                style={{
                  backgroundColor: "#0D9488",
                  color: "#FFFFFF",
                  minHeight: "44px"
                }}
              >
                Leave a review
              </button>
            ) : (
              <span className="text-xs font-medium" style={{ color: "#059669" }}>Review submitted ✓</span>
            )}

            {!session.has_report && !reported ? (
              <button
                onClick={() => setShowReport(true)}
                className="flex-1 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                style={{
                  backgroundColor: "#FFFFFF",
                  color: "#DC2626",
                  border: "1px solid #FECACA",
                  minHeight: "44px"
                }}
              >
                Report mentor
              </button>
            ) : (
              <span className="text-xs" style={{ color: "#9CA3AF" }}>Report submitted</span>
            )}
          </div>
        )}

        {/* Declined or cancelled: inactive message */}
        {(status === "declined" || status === "cancelled") && (
          <div 
            className="rounded-xl p-3 text-xs"
            style={{ backgroundColor: "#F3F4F6", border: "1px solid #E5E7EB", color: "#6B7280" }}
          >
            This session is no longer active.
          </div>
        )}
      </div>

      {showReview && (
        <ReviewModal session={session} onClose={() => setShowReview(false)} onSuccess={handleReviewed} />
      )}
      {showReport && (
        <ReportModal session={session} onClose={() => setShowReport(false)} onSuccess={handleReported} />
      )}
    </div>
  );
};

// ── My Sessions (Main Component) ──────────────────────────────────────────────
const PILLS = ["All", "Pending", "Upcoming", "Completed"];

const MySessions = ({ onBrowse }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pill, setPill] = useState("All");

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
    if (pill === "All") return true;
    if (pill === "Pending") return s.status?.toLowerCase() === "pending";
    if (pill === "Upcoming") return s.status?.toLowerCase() === "accepted";
    if (pill === "Completed") return s.status?.toLowerCase() === "completed";
    return true;
  });

  const handleCancelled = (id) =>
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status: "cancelled" } : s)));

  const handleReviewed = (id) =>
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, has_review: true } : s)));

  const handleReported = (id) =>
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, has_report: true } : s)));

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <h1 className="text-xl font-semibold pt-2" style={{ color: "#134E4A" }}>My sessions</h1>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PILLS.map((p) => (
          <button
            key={p}
            onClick={() => setPill(p)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors"
            style={{
              backgroundColor: pill === p ? "#0D9488" : "#FFFFFF",
              color: pill === p ? "#FFFFFF" : "#0D9488",
              border: pill === p ? "1px solid #0D9488" : "1px solid #CCFBF1"
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}

      {/* Session cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse" style={{ border: "1px solid #CCFBF1" }}>
              <div className="h-4 rounded" style={{ backgroundColor: "#CCFBF1", width: "50%" }} />
              <div className="h-3 rounded mt-2" style={{ backgroundColor: "#CCFBF1", width: "75%" }} />
              <div className="h-10 rounded-xl mt-3" style={{ backgroundColor: "#CCFBF1" }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#0D9488" strokeWidth="2" className="mx-auto">
            <rect x="6" y="8" width="36" height="36" rx="4" />
            <path d="M6 16h36M14 4v8M34 4v8" />
          </svg>
          <p className="font-medium" style={{ color: "#134E4A" }}>
            {sessions.length === 0 ? "No sessions yet" : `No ${pill.toLowerCase()} sessions`}
          </p>
          {sessions.length === 0 && (
            <>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                Browse mentors and request your first session.
              </p>
              <button
                onClick={onBrowse}
                className="text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                style={{
                  backgroundColor: "#0D9488",
                  color: "#FFFFFF",
                  minHeight: "44px"
                }}
              >
                Browse mentors
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              onCancelled={handleCancelled}
              onReviewed={handleReviewed}
              onReported={handleReported}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MySessions;
