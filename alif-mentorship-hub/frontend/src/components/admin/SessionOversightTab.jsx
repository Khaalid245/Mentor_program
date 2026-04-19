import { useState, useEffect } from "react";
import api from "../../services/axios";
import SessionsTable from "./sessions/SessionsTable";

const SessionOversightTab = ({ description }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await api.get("admin/sessions/");
      const data = Array.isArray(response.data) ? response.data : (response.data.results ?? []);
      setSessions(data);
    } catch (error) {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionUpdate = (updatedSession) => {
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
  };

  // Calculate stats from sessions data
  const stats = {
    total: sessions.length,
    pending: sessions.filter(s => s.status === 'pending').length,
    accepted: sessions.filter(s => s.status === 'accepted').length,
    completed: sessions.filter(s => s.status === 'completed').length,
    cancelledDeclined: sessions.filter(s => s.status === 'cancelled' || s.status === 'declined').length,
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {description && (
        <p className="text-sm text-gray-500 mb-6">{description}</p>
      )}

      {/* Stats row */}
      <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
        <div className="bg-white border border-indigo-100 rounded-xl px-4 py-2 flex-shrink-0">
          <p className="text-xs text-indigo-400 uppercase tracking-widest">Total sessions</p>
          <p className="text-lg font-bold text-indigo-900">{loading ? "—" : stats.total}</p>
        </div>
        <div className="bg-white border border-indigo-100 rounded-xl px-4 py-2 flex-shrink-0">
          <p className="text-xs text-indigo-400 uppercase tracking-widest">Pending</p>
          <p className="text-lg font-bold text-indigo-900">{loading ? "—" : stats.pending}</p>
        </div>
        <div className="bg-white border border-indigo-100 rounded-xl px-4 py-2 flex-shrink-0">
          <p className="text-xs text-indigo-400 uppercase tracking-widest">Accepted</p>
          <p className="text-lg font-bold text-indigo-900">{loading ? "—" : stats.accepted}</p>
        </div>
        <div className="bg-white border border-indigo-100 rounded-xl px-4 py-2 flex-shrink-0">
          <p className="text-xs text-indigo-400 uppercase tracking-widest">Completed</p>
          <p className="text-lg font-bold text-indigo-900">{loading ? "—" : stats.completed}</p>
        </div>
        <div className="bg-white border border-indigo-100 rounded-xl px-4 py-2 flex-shrink-0">
          <p className="text-xs text-indigo-400 uppercase tracking-widest">Cancelled / Declined</p>
          <p className="text-lg font-bold text-indigo-900">{loading ? "—" : stats.cancelledDeclined}</p>
        </div>
      </div>

      {/* Sessions table */}
      <SessionsTable onSessionUpdate={handleSessionUpdate} />
    </div>
  );
};

export default SessionOversightTab;