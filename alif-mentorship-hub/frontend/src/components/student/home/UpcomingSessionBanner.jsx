const UpcomingSessionBanner = ({ session, pendingCount, onSwitchTab }) => {
  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    const isThisWeek = (date - now) / (1000 * 60 * 60 * 24) <= 7;
    
    const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    
    if (isToday) return `Today at ${time}`;
    if (isTomorrow) return `Tomorrow at ${time}`;
    if (isThisWeek) return `${date.toLocaleDateString("en-GB", { weekday: "long" })} at ${time}`;
    return `${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} at ${time}`;
  };

  // If there's an upcoming session
  if (session) {
    return (
      <div 
        className="rounded-2xl p-5 text-white"
        style={{ backgroundColor: "#0D9488" }}
      >
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#99F6E4" }}>
          Next session
        </p>
        <h3 className="text-lg font-black mt-2">
          {session.mentor_username}
        </h3>
        <p className="text-sm mt-1">
          {formatDate(session.requested_time)}
        </p>
        <p className="text-sm italic mt-1" style={{ color: "#99F6E4" }}>
          "{session.goal}"
        </p>
        {session.meet_link && (
          <a
            href={session.meet_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 bg-white text-sm font-bold px-5 py-2 rounded-xl transition-all active:scale-95"
            style={{ color: "#0F766E" }}
          >
            Join session →
          </a>
        )}
      </div>
    );
  }

  // If there are pending sessions
  if (pendingCount > 0) {
    return (
      <div 
        className="rounded-2xl border p-5"
        style={{ backgroundColor: "#FEF3C7", borderColor: "#FDE68A" }}
      >
        <p className="text-sm font-semibold" style={{ color: "#92400E" }}>
          {pendingCount} session request{pendingCount > 1 ? "s" : ""} waiting for mentor response
        </p>
        <button
          onClick={() => onSwitchTab("sessions")}
          className="mt-3 text-sm font-semibold px-5 py-2 rounded-xl border-2 transition-all active:scale-95"
          style={{ 
            backgroundColor: "#FFFFFF",
            color: "#D97706",
            borderColor: "#FDE68A",
            minHeight: "44px"
          }}
        >
          View requests →
        </button>
      </div>
    );
  }

  // Empty state
  return (
    <div 
      className="rounded-2xl border-2 border-dashed p-6 flex flex-col items-center gap-3 text-center"
      style={{ borderColor: "#99F6E4" }}
    >
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#99F6E4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="8" width="36" height="36" rx="4" />
        <path d="M6 16h36M14 4v8M34 4v8" />
      </svg>
      <div>
        <p className="text-base font-bold" style={{ color: "#134E4A" }}>
          No sessions yet
        </p>
        <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>
          Find a mentor and book your first session
        </p>
      </div>
      <button
        onClick={() => onSwitchTab("browse")}
        className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-95"
        style={{ 
          backgroundColor: "#0D9488",
          color: "#FFFFFF",
          minHeight: "44px"
        }}
      >
        Browse mentors
      </button>
    </div>
  );
};

export default UpcomingSessionBanner;
