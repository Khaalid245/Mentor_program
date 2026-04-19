import { useEffect, useState, useCallback } from "react";
import api from "../../../services/axios";

const StatusBadge = ({ status }) => {
  const styles = {
    pending: "bg-amber-50 text-amber-600 border border-amber-200",
    accepted: "bg-indigo-50 text-indigo-600 border border-indigo-200",
    completed: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    declined: "bg-red-50 text-red-500 border border-red-200",
    cancelled: "bg-gray-100 text-gray-500 border border-gray-200",
  };

  return (
    <span className={`text-sm font-semibold px-3 py-1.5 rounded-full capitalize ${styles[status] || styles.cancelled}`}>
      {status}
    </span>
  );
};

const PanelSkeleton = () => (
  <div className="p-6 space-y-4 animate-pulse">
    <div className="h-8 bg-indigo-50 rounded-xl w-1/3" />
    <div className="h-16 bg-indigo-50 rounded-xl" />
    <div className="h-4 bg-indigo-50 rounded-xl w-1/2" />
    <div className="h-4 bg-indigo-50 rounded-xl w-3/4" />
    <div className="grid grid-cols-2 gap-4">
      <div className="h-20 bg-indigo-50 rounded-xl" />
      <div className="h-20 bg-indigo-50 rounded-xl" />
    </div>
  </div>
);

const UserCard = ({ user, role, onViewUser }) => {
  const initials = user?.username?.slice(0, 2).toUpperCase() || "??";

  return (
    <div className="bg-indigo-50 rounded-xl p-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 text-sm font-bold flex items-center justify-center flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-indigo-900 truncate">{user?.username || "—"}</p>
          <p className="text-xs text-gray-500 truncate">{user?.email || "—"}</p>
          <button
            onClick={() => onViewUser(user?.id)}
            className="text-xs text-indigo-500 hover:underline"
          >
            View user
          </button>
        </div>
      </div>
    </div>
  );
};

const CancelAction = ({ session, onCancel }) => {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleCancel = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.post(`admin/sessions/${session.id}/cancel/`);
      onCancel(response.data);
      setConfirm(false);
      setSuccess("Session cancelled.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to cancel session.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return <p className="text-sm text-emerald-600">{success}</p>;
  }

  if (confirm) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
        <p className="text-sm text-red-600 font-medium">Cancel this session? Both the student and mentor will lose access to it.</p>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px] disabled:opacity-50"
          >
            {loading ? "Cancelling…" : "Confirm"}
          </button>
          <button
            onClick={() => setConfirm(false)}
            className="flex-1 bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px]"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="bg-white border border-red-100 hover:bg-red-50 text-red-500 text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px]"
    >
      Cancel session
    </button>
  );
};

const SessionDetailPanel = ({ sessionId, onClose, onSessionUpdate }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSession = useCallback(() => {
    setLoading(true);
    setError("");
    api.get(`sessions/${sessionId}/`)
      .then((r) => setSession(r.data))
      .catch(() => setError("Could not load session details."))
      .finally(() => setLoading(false));
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleSessionCancel = (updatedSession) => {
    setSession(updatedSession);
    onSessionUpdate(updatedSession);
  };

  const handleViewUser = (userId) => {
    // This would open the UserDetailPanel - for now just close this panel
    // In a full implementation, you might want to manage multiple panels
    console.log("View user:", userId);
  };

  const requestedTime = session?.requested_time ? new Date(session.requested_time).toLocaleDateString("en-GB", { 
    weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" 
  }) : "—";
  
  const createdDate = session?.created_at ? new Date(session.created_at).toLocaleDateString("en-GB", { 
    day: "numeric", month: "long", year: "numeric" 
  }) : "—";

  const canCancel = session?.status === 'pending' || session?.status === 'accepted';
  const isClosed = session?.status === 'completed' || session?.status === 'declined' || session?.status === 'cancelled';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        role="button"
        aria-label="Close panel"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full w-full md:w-[480px] bg-white border-l border-indigo-100 z-50 overflow-y-auto"
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-indigo-600 transition-colors"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {loading ? <PanelSkeleton /> : error ? (
          <div className="p-6 flex items-center justify-between gap-4">
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={fetchSession}
              className="bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px]"
            >
              Retry
            </button>
          </div>
        ) : session && (
          <div className="p-6 space-y-6">
            {/* Session info */}
            <div className="space-y-4">
              <StatusBadge status={session.status} />
              
              <div className="bg-indigo-50 rounded-xl p-3">
                <p className="text-sm text-gray-700">{session.goal || "No goal specified"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-700">{requestedTime}</p>
                <p className="text-xs text-gray-400">Booked on {createdDate}</p>
                {session.meet_link && (
                  <a
                    href={session.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:underline block"
                  >
                    Join session
                  </a>
                )}
              </div>
            </div>

            {/* Parties */}
            <div className="border-t border-indigo-50 pt-4 space-y-3">
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Participants</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <UserCard 
                  user={{ id: session.student?.id, username: session.student_username, email: session.student?.email }}
                  role="Student"
                  onViewUser={handleViewUser}
                />
                <UserCard 
                  user={{ id: session.mentor?.id, username: session.mentor_username, email: session.mentor?.email }}
                  role="Mentor"
                  onViewUser={handleViewUser}
                />
              </div>
            </div>

            {/* Mentor notes */}
            <div className="border-t border-indigo-50 pt-4 space-y-3">
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Mentor notes</p>
              {session.mentor_notes ? (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-sm text-gray-700">{session.mentor_notes}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-400">No notes added yet.</p>
              )}
            </div>

            {/* Admin actions */}
            <div className="border-t border-indigo-50 pt-4 space-y-3">
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Admin actions</p>
              {isClosed ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <p className="text-sm text-gray-500">This session is closed. No actions available.</p>
                </div>
              ) : canCancel ? (
                <CancelAction session={session} onCancel={handleSessionCancel} />
              ) : null}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SessionDetailPanel;