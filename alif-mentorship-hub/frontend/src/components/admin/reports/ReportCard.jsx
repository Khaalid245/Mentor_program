import { useState } from "react";
import api from "../../../services/axios";

const StatusBadge = ({ status }) => {
  const styles = {
    open: "bg-amber-50 text-amber-600 border border-amber-200",
    resolved: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    dismissed: "bg-gray-100 text-gray-500 border border-gray-200",
  };

  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${styles[status] || styles.open}`}>
      {status}
    </span>
  );
};

const ReasonBadge = ({ reason }) => {
  const styles = {
    inappropriate_behavior: "bg-red-50 text-red-500 border border-red-200",
    no_show: "bg-amber-50 text-amber-600 border border-amber-200",
    unprofessional: "bg-orange-50 text-orange-600 border border-orange-200",
    other: "bg-gray-100 text-gray-500 border border-gray-200",
  };

  const labels = {
    inappropriate_behavior: "Inappropriate behavior",
    no_show: "No show",
    unprofessional: "Unprofessional",
    other: "Other",
  };

  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${styles[reason] || styles.other}`}>
      {labels[reason] || reason}
    </span>
  );
};

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12,5 19,12 12,19" />
  </svg>
);

const AdminAction = ({ report, action, onSuccess }) => {
  const [expanded, setExpanded] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (adminNote.trim().length < 10) {
      setError("Admin note must be at least 10 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post(`admin/reports/${report.id}/${action}/`, { admin_note: adminNote });
      onSuccess(response.data);
      setExpanded(false);
      setAdminNote("");
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${action} report.`);
    } finally {
      setLoading(false);
    }
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px] ${
          action === "resolve"
            ? "bg-indigo-500 hover:bg-indigo-600 text-white"
            : "bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-600"
        }`}
      >
        {action === "resolve" ? "Resolve" : "Dismiss"}
      </button>
    );
  }

  return (
    <div className="mt-4 bg-indigo-50 rounded-xl p-4 space-y-3">
      <div>
        <label className="block text-xs text-indigo-400 uppercase tracking-widest mb-1">Admin note</label>
        <textarea
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          placeholder="Enter your note (minimum 10 characters)"
          rows={3}
          className="w-full border border-indigo-100 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">{adminNote.length} / 500 characters</p>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={loading || adminNote.trim().length < 10}
          className={`flex-1 text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px] disabled:opacity-50 ${
            action === "resolve"
              ? "bg-indigo-500 hover:bg-indigo-600 text-white"
              : "bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-600"
          }`}
        >
          {loading ? "Submitting…" : "Confirm"}
        </button>
        <button
          onClick={() => {
            setExpanded(false);
            setAdminNote("");
            setError("");
          }}
          className="text-sm text-indigo-600 hover:underline px-4"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const ReportCard = ({ report, onUpdate, onViewSession }) => {
  const createdDate = report.created_at ? new Date(report.created_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric"
  }) : "—";

  const sessionDate = report.session_info?.requested_time ? new Date(report.session_info.requested_time).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric"
  }) : "—";

  const truncatedGoal = report.session_info?.goal && report.session_info.goal.length > 60
    ? report.session_info.goal.slice(0, 60) + "…"
    : report.session_info?.goal || "—";

  const resolvedDate = report.resolved_at ? new Date(report.resolved_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric"
  }) : "—";

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 p-6">
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div>
            <p className="text-xs text-indigo-300">reported</p>
            <p className="text-sm font-semibold text-indigo-900">{report.reporter_username || "—"}</p>
          </div>
          <div className="text-gray-300">
            <ArrowIcon />
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-900">{report.reported_user_username || "—"}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={report.status} />
          <p className="text-xs text-gray-400">{createdDate}</p>
        </div>
      </div>

      {/* Reason badge */}
      <div className="mb-3">
        <ReasonBadge reason={report.reason} />
      </div>

      {/* Details */}
      <div className="bg-indigo-50 rounded-xl p-3 mb-3">
        <p className="text-sm text-gray-700">{report.details || "No details provided"}</p>
      </div>

      {/* Session info */}
      <div className="mb-4">
        <p className="text-xs text-gray-400">
          Session on {sessionDate} — {truncatedGoal}
          {" "}
          <button
            onClick={() => onViewSession(report.session_info?.id)}
            className="text-indigo-500 hover:underline"
          >
            View session
          </button>
        </p>
      </div>

      {/* Admin actions or resolution info */}
      {report.status === "open" ? (
        <div className="flex gap-2 border-t border-indigo-50 pt-4">
          <AdminAction report={report} action="resolve" onSuccess={onUpdate} />
          <AdminAction report={report} action="dismiss" onSuccess={onUpdate} />
        </div>
      ) : (
        <div className="border-t border-indigo-50 pt-4 space-y-2">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Admin note</p>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-sm text-gray-600">{report.admin_note || "No note provided"}</p>
          </div>
          <p className="text-xs text-gray-400">
            {report.status === "resolved" ? "Resolved" : "Dismissed"} by {report.resolved_by_username || "—"} on {resolvedDate}
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportCard;