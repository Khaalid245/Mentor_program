import { useEffect, useState, useCallback } from "react";
import api from "../../services/axios";

// ── Badges ────────────────────────────────────────────────────────────────────
const PendingBadge = () => (
  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
    Pending
  </span>
);
const VerifiedBadge = () => (
  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
    Verified
  </span>
);

// ── Profile completeness check ────────────────────────────────────────────────
const getMissingFields = (mentor) => {
  const checks = [
    { key: "bio",             label: "Bio" },
    { key: "university",      label: "University" },
    { key: "field_of_study",  label: "Field of study" },
    { key: "graduation_year", label: "Graduation year" },
    { key: "linkedin_url",    label: "LinkedIn URL" },
    { key: "availability",    label: "Availability slots" },
  ];
  return checks
    .filter(({ key }) => {
      const v = mentor[key];
      if (!v) return true;
      if (typeof v === "string" && !v.trim()) return true;
      if (Array.isArray(v) && v.length === 0) return true;
      if (typeof v === "string") {
        try { const p = JSON.parse(v); return Array.isArray(p) && p.length === 0; } catch { return false; }
      }
      return false;
    })
    .map(({ label }) => label);
};

// ── Empty states ──────────────────────────────────────────────────────────────
const AllCaughtUp = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4">
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <p className="text-base font-semibold text-indigo-900">All caught up</p>
    <p className="text-sm text-gray-400 mt-1">No mentors waiting for verification.</p>
  </div>
);

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-indigo-50 rounded-2xl h-48 animate-pulse" />
    ))}
  </div>
);

// ── Pending Card ──────────────────────────────────────────────────────────────
const PendingCard = ({ mentor, onVerified, onRejected }) => {
  const [verifying, setVerifying]   = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason]         = useState("");
  const [rejecting, setRejecting]   = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState("");

  const missing = getMissingFields(mentor);

  const verify = async () => {
    setVerifying(true);
    setError("");
    try {
      await api.post(`admin/mentors/${mentor.id}/verify/`);
      setSuccess(true);
      const t = setTimeout(() => onVerified(mentor.id), 2000);
      return () => clearTimeout(t);
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

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
        <p className="text-sm text-emerald-600 font-medium">
          Mentor verified — profile is now live and visible to students.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 hover:border-indigo-300 transition-colors p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm font-semibold text-indigo-900">{mentor.username}</p>
        <PendingBadge />
      </div>

      {(mentor.university || mentor.field_of_study) && (
        <p className="text-sm text-gray-400">
          {[mentor.university, mentor.field_of_study].filter(Boolean).join(" · ")}
        </p>
      )}

      {mentor.graduation_year && (
        <p className="text-sm text-gray-400">
          Graduation year {mentor.graduation_year}
        </p>
      )}

      {mentor.linkedin_url && (
        <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer"
          className="text-sm text-indigo-500 hover:underline block">
          LinkedIn profile
        </a>
      )}

      {mentor.bio && (
        <p className="text-sm text-gray-700">{mentor.bio}</p>
      )}

      {missing.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-amber-600 mb-1">
            Profile incomplete — {missing.length} field{missing.length > 1 ? "s" : ""} missing
          </p>
          <p className="text-xs text-amber-600">{missing.join(", ")}</p>
          <p className="text-xs text-amber-400 mt-1">You can still verify, but the mentor should complete their profile.</p>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {rejectOpen && (
        <div className="space-y-3 pt-3 border-t border-indigo-50">
          <label className="text-sm font-medium text-indigo-900 block">Reason for rejection</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Explain why this profile is being rejected…"
            className="w-full border border-indigo-100 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none bg-white"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => { setRejectOpen(false); setReason(""); setError(""); }}
              className="bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px]">
              Cancel
            </button>
            <button onClick={reject} disabled={rejecting}
              className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px] disabled:opacity-50">
              {rejecting ? "Rejecting…" : "Confirm rejection"}
            </button>
          </div>
        </div>
      )}

      {!rejectOpen && (
        <div className="flex justify-end gap-2 pt-3 border-t border-indigo-50">
          <button onClick={() => setRejectOpen(true)}
            className="bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px]">
            Reject
          </button>
          <button onClick={verify} disabled={verifying}
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px] disabled:opacity-50">
            {verifying ? "Verifying…" : "Verify"}
          </button>
        </div>
      )}
    </div>
  );
};

// ── Verified Card ─────────────────────────────────────────────────────────────
const VerifiedCard = ({ mentor }) => (
  <div className="bg-white rounded-2xl border border-indigo-100 p-6 space-y-2">
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <p className="text-sm font-semibold text-indigo-900">{mentor.username}</p>
      <VerifiedBadge />
    </div>
    {(mentor.university || mentor.field_of_study) && (
      <p className="text-sm text-gray-400">
        {[mentor.university, mentor.field_of_study].filter(Boolean).join(" · ")}
      </p>
    )}
    {mentor.average_rating > 0 && (
      <p className="text-sm text-gray-700">{Number(mentor.average_rating).toFixed(1)} ★</p>
    )}
    {mentor.linkedin_url && (
      <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer"
        className="text-sm text-indigo-500 hover:underline block">
        LinkedIn profile
      </a>
    )}
  </div>
);

// ── Verify Mentors Tab ────────────────────────────────────────────────────────
const VerifyMentorsTab = ({ onPendingChange, description }) => {
  const [all, setAll]         = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [pill, setPill]       = useState("pending");

  const fetchMentors = useCallback(() => {
    setLoading(true);
    api.get("admin/mentors/")
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : (r.data.results ?? []);
        setAll(data);
        onPendingChange(data.filter((m) => !m.is_verified).length);
        setError("");
      })
      .catch(() => setError("Failed to load mentors."))
      .finally(() => setLoading(false));
  }, [onPendingChange]);

  useEffect(() => { fetchMentors(); }, [fetchMentors]);

  const pending  = all.filter((m) => !m.is_verified);
  const verified = all.filter((m) => m.is_verified);

  const onVerified = (id) => {
    setAll((prev) => {
      const updated = prev.map((m) => m.id === id ? { ...m, is_verified: true } : m);
      onPendingChange(updated.filter((m) => !m.is_verified).length);
      return updated;
    });
  };

  const onRejected = (id) => {
    setAll((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      onPendingChange(updated.filter((m) => !m.is_verified).length);
      return updated;
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      {description && <p className="text-sm text-gray-400">{description}</p>}

      <div className="flex gap-2">
        {[
          { id: "pending",  label: "Pending",  count: pending.length },
          { id: "verified", label: "Verified", count: verified.length },
        ].map((p) => (
          <button key={p.id} onClick={() => setPill(p.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors min-h-[40px] flex items-center gap-2 ${
              pill === p.id
                ? "bg-indigo-500 text-white"
                : "bg-white border border-indigo-100 text-indigo-600 hover:bg-indigo-50"
            }`}>
            {p.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              pill === p.id ? "bg-indigo-400 text-white" : "bg-indigo-50 text-indigo-400"
            }`}>
              {p.count}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center justify-between bg-white border border-indigo-100 rounded-2xl p-4">
          <p className="text-sm text-red-500">{error}</p>
          <button onClick={fetchMentors}
            className="bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px]">
            Retry
          </button>
        </div>
      )}

      {loading ? <Skeleton /> : pill === "pending" ? (
        pending.length === 0 ? <AllCaughtUp /> : (
          <div className="space-y-4">
            {pending.map((m) => (
              <PendingCard key={m.id} mentor={m} onVerified={onVerified} onRejected={onRejected} />
            ))}
          </div>
        )
      ) : (
        verified.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-gray-400">No verified mentors yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {verified.map((m) => <VerifiedCard key={m.id} mentor={m} />)}
          </div>
        )
      )}
    </div>
  );
};

export default VerifyMentorsTab;
