import { useState, useEffect, useCallback } from "react";
import api from "../../../services/axios";
import SessionDetailPanel from "./SessionDetailPanel";

const StatusBadge = ({ status }) => {
  const styles = {
    pending: "bg-amber-50 text-amber-600 border border-amber-200",
    accepted: "bg-indigo-50 text-indigo-600 border border-indigo-200",
    completed: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    declined: "bg-red-50 text-red-500 border border-red-200",
    cancelled: "bg-gray-100 text-gray-500 border border-gray-200",
  };

  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${styles[status] || styles.cancelled}`}>
      {status}
    </span>
  );
};

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12,5 19,12 12,19" />
  </svg>
);

const LinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </svg>
);

const SessionCard = ({ session, onClick }) => {
  const requestedTime = session.requested_time ? new Date(session.requested_time).toLocaleDateString("en-GB", { 
    weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" 
  }) : "—";
  
  const createdDate = session.created_at ? new Date(session.created_at).toLocaleDateString("en-GB", { 
    day: "numeric", month: "long", year: "numeric" 
  }) : "—";

  const truncatedGoal = session.goal && session.goal.length > 80 
    ? session.goal.slice(0, 80) + "…" 
    : session.goal || "—";

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 p-4">
      {/* Top row - Student → Mentor */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs text-indigo-300">Student</p>
          <p className="text-sm font-semibold text-indigo-900">{session.student_username || "—"}</p>
        </div>
        <div className="text-gray-300 mx-4">
          <ArrowIcon />
        </div>
        <div className="flex-1 text-right">
          <p className="text-xs text-indigo-300">Mentor</p>
          <p className="text-sm font-semibold text-indigo-900">{session.mentor_username || "—"}</p>
        </div>
      </div>

      {/* Goal */}
      <p className="text-sm text-gray-600 mb-2">{truncatedGoal}</p>

      {/* Times */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
        <p className="text-xs text-gray-400">{requestedTime}</p>
        <p className="text-xs text-gray-400">Booked on {createdDate}</p>
      </div>

      {/* Bottom row - Status, meet link, actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusBadge status={session.status} />
          {session.status === 'accepted' && session.meet_link && (
            <a
              href={session.meet_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700"
              title="Join session"
            >
              <LinkIcon />
            </a>
          )}
        </div>
        <button
          onClick={onClick}
          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
        >
          View details
        </button>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-indigo-50 rounded-2xl h-24 animate-pulse" />
);

const SessionsTable = ({ onSessionUpdate }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchSessions = useCallback((search = "", status = "all", from = "", to = "") => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status !== "all") params.append("status", status);
    if (from) params.append("date_from", from);
    if (to) params.append("date_to", to);

    api.get(`admin/sessions/?${params}`)
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : (r.data.results ?? []);
        setSessions(data);
      })
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      fetchSessions(value, statusFilter, dateFrom, dateTo);
    }, 400);
    setSearchTimeout(timeout);
  };

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    fetchSessions(searchQuery, status, dateFrom, dateTo);
  };

  const handleDateFromChange = (e) => {
    const value = e.target.value;
    setDateFrom(value);
    fetchSessions(searchQuery, statusFilter, value, dateTo);
  };

  const handleDateToChange = (e) => {
    const value = e.target.value;
    setDateTo(value);
    fetchSessions(searchQuery, statusFilter, dateFrom, value);
  };

  const handleSessionStatusUpdate = (updatedSession) => {
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
    if (onSessionUpdate) {
      onSessionUpdate(updatedSession);
    }
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by student or mentor name"
            className="w-full border border-indigo-100 rounded-xl px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="border border-indigo-100 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="completed">Completed</option>
          <option value="declined">Declined</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <div className="flex gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={handleDateFromChange}
              className="border border-indigo-100 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={handleDateToChange}
              className="border border-indigo-100 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
            />
          </div>
        </div>
      </div>

      {/* Sessions list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 font-medium">No sessions found.</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              onClick={() => setSelectedSessionId(session.id)}
            />
          ))}
        </div>
      )}

      {/* Session detail panel */}
      {selectedSessionId && (
        <SessionDetailPanel
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
          onSessionUpdate={handleSessionStatusUpdate}
        />
      )}
    </div>
  );
};

export default SessionsTable;