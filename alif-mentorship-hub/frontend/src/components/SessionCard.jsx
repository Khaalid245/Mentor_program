// SessionCard — displays a single mentorship session
// Used by both StudentDashboard (read-only) and MentorDashboard (with edit)

const OUTCOME_STYLES = {
  Scheduled: "bg-blue-100 text-blue-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

const SessionCard = ({ session, onEdit }) => {
  const formattedDate = new Date(session.scheduled_at).toLocaleString([], {
    dateStyle: "full",
    timeStyle: "short",
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-2">
      {/* Header row: date + outcome badge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-gray-700">
          <span>🗓️</span>
          <span className="font-semibold text-sm">{formattedDate}</span>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            OUTCOME_STYLES[session.outcome] || "bg-gray-100 text-gray-700"
          }`}
        >
          {session.outcome}
        </span>
      </div>

      {/* Mentor name — shown on student side */}
      {session.mentor_name && (
        <p className="text-sm text-gray-500">
          Mentor: <span className="font-medium text-gray-700">{session.mentor_name}</span>
        </p>
      )}

      {/* Session notes */}
      {session.notes ? (
        <p className="text-sm text-gray-700 whitespace-pre-wrap border-t pt-2">
          {session.notes}
        </p>
      ) : (
        <p className="text-sm text-gray-400 italic border-t pt-2">
          No notes added yet.
        </p>
      )}

      {/* Edit button — only rendered when onEdit prop is provided (mentor side) */}
      {onEdit && (
        <button
          onClick={() => onEdit(session)}
          className="text-xs text-blue-600 hover:underline pt-1"
        >
          Edit notes / outcome
        </button>
      )}
    </div>
  );
};

export default SessionCard;
