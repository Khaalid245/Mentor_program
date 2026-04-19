import { useState, useEffect } from "react";
import api from "../../services/axios";

const ACTION_LABELS = {
  verify_mentor: "Verify mentor",
  reject_mentor: "Reject mentor",
  suspend_user: "Suspend user",
  unsuspend_user: "Unsuspend user",
  deactivate_user: "Deactivate user",
  cancel_session: "Cancel session",
  resolve_report: "Resolve report",
  dismiss_report: "Dismiss report",
  publish_resource: "Publish resource",
  edit_resource: "Edit resource",
  delete_resource: "Delete resource",
  update_platform_settings: "Update platform settings",
};

const ACTION_COLORS = {
  suspend_user: "bg-amber-400",
  unsuspend_user: "bg-amber-400",
  deactivate_user: "bg-amber-400",
  verify_mentor: "bg-indigo-400",
  reject_mentor: "bg-indigo-400",
  cancel_session: "bg-violet-400",
  resolve_report: "bg-emerald-400",
  dismiss_report: "bg-emerald-400",
  publish_resource: "bg-blue-400",
  edit_resource: "bg-blue-400",
  delete_resource: "bg-blue-400",
  update_platform_settings: "bg-gray-400",
};

const SkeletonRow = () => (
  <div className="bg-indigo-50 rounded-xl h-12 animate-pulse" />
);

const LogEntry = ({ log }) => {
  const timestamp = log.created_at ? new Date(log.created_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  }) : "—";

  const dotColor = ACTION_COLORS[log.action] || "bg-gray-400";

  return (
    <div className="bg-white rounded-xl border border-indigo-50 px-4 py-3 flex items-start gap-3">
      <div className={`w-2 h-2 rounded-full ${dotColor} mt-1.5 flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-indigo-900">{log.detail}</p>
        <div className="flex flex-wrap gap-2 mt-1">
          <span className="text-xs text-gray-400">by {log.admin_username || "—"}</span>
          {log.target_username && (
            <span className="text-xs text-indigo-400">on {log.target_username}</span>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-400 flex-shrink-0">{timestamp}</p>
    </div>
  );
};

const AuditLogTab = ({ description }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, dateFrom, dateTo]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (actionFilter) params.append("action", actionFilter);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);

      const response = await api.get(`admin/audit-log/?${params}`);
      setLogs(response.data.results || []);
      setTotalPages(response.data.total_pages || 1);
      setHasNext(response.data.has_next || false);
      setHasPrevious(response.data.has_previous || false);
    } catch (error) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setActionFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const handlePrevious = () => {
    if (hasPrevious) {
      setPage(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {description && (
        <p className="text-sm text-gray-500 mb-6">{description}</p>
      )}

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="border border-indigo-100 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
        >
          <option value="">All actions</option>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <div className="flex gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="border border-indigo-100 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="border border-indigo-100 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
            />
          </div>
        </div>

        {(actionFilter || dateFrom || dateTo) && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-indigo-600 hover:underline self-start sm:self-center"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Log list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonRow key={i} />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No audit log entries yet. Admin actions will appear here.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {logs.map(log => (
              <LogEntry key={log.id} log={log} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={handlePrevious}
                disabled={!hasPrevious}
                className="bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={handleNext}
                disabled={!hasNext}
                className="bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditLogTab;