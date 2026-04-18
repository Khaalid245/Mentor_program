import { useEffect, useState } from "react";
import api from "../../services/axios";

// ── Pending Card ──────────────────────────────────────────────────────────────
const PendingCard = ({ mentor, onVerified, onRejected }) => {
  const [verifying, setVerifying]     = useState(false);
  const [verified, setVerified]       = useState(false);
  const [rejectOpen, setRejectOpen]   = useState(false);
  const [reason, setReason]           = useState("");
  const [rejecting, setRejecting]     = useState(false);
  const [error, setError]             = useState("");

  const verify = async () => {
    setVerifying(true);
    setError("");
    try {
      await api.post(`admin/mentors/${mentor.id}/verify/`);
      setVerified(true);
      setTimeout(() => onVerified(mentor.id), 1200);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to verify.");
      setVerifying(false);
    }
  };

  const reject = async () => {
    if (!reason.trim()) { setError("Please enter a rejection reason."); return; }
    setRejecting(true);
    setError("");
    try {
      await api.post(`admin/mentors/${mentor.id}/reject/`, { reason });
      onRejected(mentor.id);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reject.");
      setRejecting(false);
    }
  };

  if (verified) {
    return (
      <div className="bg-green-50 border border-green-300 rounded-xl p-4 text-center">
        <p className="text-green-700 font-semibold text-sm">✓ Mentor verified</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
      <div>
        <p className="font-semibold text-gray-800">{mentor.username}</p>
        <p className="text-xs text-gray-500">{mentor.field_of_study} · {mentor.university}</p>
        {mentor.graduation_year && (
          <p className="text-xs text-gray-400">Class of {mentor.graduation_year}</p>
        )}
      </div>

      {mentor.bio && (
        <p className="text-sm text-gray-600 leading-relaxed">{mentor.bio}</p>
      )}

      {mentor.linkedin_url && (
        <a
          href={mentor.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 text-sm hover:underline"
        >
          LinkedIn profile ↗
        </a>
      )}

      {error && <p className="text-red-600 text-xs">{error}</p>}

      {!rejectOpen ? (
        <div className="flex gap-2">
          <button
            onClick={verify}
            disabled={verifying}
            className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-green-700 transition"
          >
            {verifying ? "Verifying…" : "Verify"}
          </button>
          <button
            onClick={() => setRejectOpen(true)}
            className="flex-1 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition"
          >
            Reject
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Reason for rejection…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <div className="flex gap-2">
            <button
              onClick={reject}
              disabled={rejecting}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-red-700 transition"
            >
              {rejecting ? "Rejecting…" : "Confirm rejection"}
            </button>
            <button
              onClick={() => { setRejectOpen(false); setReason(""); setError(""); }}
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

// ── Verified Card ─────────────────────────────────────────────────────────────
const VerifiedCard = ({ mentor }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-1">
    <div className="flex items-start justify-between gap-2 flex-wrap">
      <div>
        <p className="font-semibold text-gray-800">{mentor.username}</p>
        <p className="text-xs text-gray-500">{mentor.field_of_study} · {mentor.university}</p>
      </div>
      {mentor.average_rating > 0 && (
        <span className="text-xs text-amber-600 font-semibold">{Number(mentor.average_rating).toFixed(1)} ★</span>
      )}
    </div>
    {mentor.linkedin_url && (
      <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer"
        className="text-blue-600 text-xs hover:underline">LinkedIn ↗</a>
    )}
  </div>
);

// ── Verify Mentors Tab ────────────────────────────────────────────────────────
const VerifyMentorsTab = ({ onPendingChange }) => {
  const [all, setAll]         = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [pill, setPill]       = useState("pending");

  useEffect(() => {
    api.get("admin/mentors/")
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : (r.data.results ?? []);
        setAll(data);
        const unverified = data.filter((m) => !m.is_verified).length;
        onPendingChange(unverified);
      })
      .catch(() => setError("Failed to load mentors."))
      .finally(() => setLoading(false));
  }, []);

  const pending  = all.filter((m) => !m.is_verified);
  const verified = all.filter((m) => m.is_verified);

  const removeAndUpdate = (id) => {
    setAll((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      onPendingChange(updated.filter((m) => !m.is_verified).length);
      return updated;
    });
  };

  const markVerified = (id) => {
    setAll((prev) => {
      const updated = prev.map((m) => m.id === id ? { ...m, is_verified: true } : m);
      onPendingChange(updated.filter((m) => !m.is_verified).length);
      return updated;
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800 pt-2">Verify mentors</h1>

      <div className="flex gap-2">
        {["pending", "verified"].map((p) => (
          <button key={p} onClick={() => setPill(p)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition ${
              pill === p ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {p} {p === "pending" ? `(${pending.length})` : `(${verified.length})`}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              <div className="h-8 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : pill === "pending" ? (
        pending.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 font-medium">No mentors waiting for verification.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((m) => (
              <PendingCard
                key={m.id}
                mentor={m}
                onVerified={markVerified}
                onRejected={removeAndUpdate}
              />
            ))}
          </div>
        )
      ) : (
        verified.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 font-medium">No verified mentors yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {verified.map((m) => <VerifiedCard key={m.id} mentor={m} />)}
          </div>
        )
      )}
    </div>
  );
};

export default VerifyMentorsTab;
