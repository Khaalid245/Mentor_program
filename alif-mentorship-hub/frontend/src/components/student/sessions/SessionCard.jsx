export default function SessionCard({ session, onCancel, onReview, onReport }) {
  const statusConfig = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Pending' },
    accepted: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', label: 'Accepted' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Completed' },
    cancelled: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: 'Cancelled' },
    declined: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Declined' }
  };

  const config = statusConfig[session.status] || statusConfig.pending;
  const date = new Date(session.requested_time);
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <div className={`bg-white rounded-2xl border ${config.border} p-4`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-sm font-semibold text-teal-700">
              {session.mentor_username?.[0]?.toUpperCase() || 'M'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{session.mentor_username}</p>
              {session.mentor_field && (
                <p className="text-xs text-gray-500">{session.mentor_field}</p>
              )}
            </div>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
          {config.label}
        </span>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formattedDate} at {formattedTime}
        </div>
        <p className="text-sm text-gray-700 line-clamp-2">{session.goal}</p>
      </div>

      {/* Mentor notes */}
      {session.mentor_notes && (
        <div className="mb-3 p-3 bg-gray-50 rounded-xl">
          <p className="text-xs font-medium text-gray-700 mb-1">Mentor's note:</p>
          <p className="text-sm text-gray-600">{session.mentor_notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {session.status === 'pending' && (
          <button
            onClick={() => onCancel(session.id)}
            className="flex-1 h-10 border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 active:scale-95 transition-all"
          >
            Cancel request
          </button>
        )}
        {session.status === 'accepted' && (
          <>
            {session.meet_link && (
              <a
                href={session.meet_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 h-10 bg-teal-600 text-white rounded-xl font-medium text-sm hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center"
              >
                Join session
              </a>
            )}
            <button
              onClick={() => onCancel(session.id)}
              className="h-10 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 active:scale-95 transition-all"
            >
              Cancel
            </button>
          </>
        )}
        {session.status === 'completed' && (
          <>
            {!session.has_review && (
              <button
                onClick={() => onReview(session)}
                className="flex-1 h-10 bg-teal-600 text-white rounded-xl font-medium text-sm hover:bg-teal-700 active:scale-95 transition-all"
              >
                Leave review
              </button>
            )}
            {!session.has_report && (
              <button
                onClick={() => onReport(session)}
                className="h-10 px-4 border border-red-300 text-red-700 rounded-xl font-medium text-sm hover:bg-red-50 active:scale-95 transition-all"
              >
                Report
              </button>
            )}
            {session.has_review && session.has_report && (
              <p className="text-sm text-gray-500 py-2">Session reviewed</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
