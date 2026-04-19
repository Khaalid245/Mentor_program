const UpcomingSessionCard = ({ session, pendingCount, onSwitchTab }) => {
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
        className="bg-white rounded-3xl border p-5 border-l-4"
        style={{ borderColor: "#CCFBF1", borderLeftColor: "#0D9488" }}
      >
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#5EEAD4" }}>
          Next session
        </p>
        
        <div className="flex items-center gap-3 mb-2">
          <div 
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-base font-bold"
            style={{ backgroundColor: "#CCFBF1", color: "#0F766E" }}
          >
            {session.mentor_username?.charAt(0).toUpperCase() || "M"}
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "#134E4A" }}>
              {session.mentor_username}
            </p>
            <p className="text-xs" style={{ color: "#6B7280" }}>
              {session.mentor_field || "Mentor"}
            </p>
          </div>
        </div>

        <p className="text-sm font-semibold mb-2" style={{ color: "#0D9488" }}>
          {formatDate(session.requested_time)}
        </p>

        <p className="text-sm italic mb-4" style={{ color: "#6B7280" }}>
          "{session.goal}"
        </p>

        {session.meet_link && (
          <a
            href={session.meet_link}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center text-sm font-semibold px-5 rounded-2xl transition-all active:scale-95"
            style={{ 
              backgroundColor: "#0D9488", 
              color: "#FFFFFF",
              minHeight: "48px",
              lineHeight: "48px"
            }}
          >
            Join session
          </a>
        )}
      </div>
    );
  }

  // If there are pending sessions
  if (pendingCount > 0) {
    return (
      <div 
        className="bg-white rounded-3xl border p-5 border-l-4"
        style={{ borderColor: "#CCFBF1", borderLeftColor: "#D97706" }}
      >
        <p className="text-sm font-semibold" style={{ color: "#92400E" }}>
          You have {pendingCount} pending request{pendingCount > 1 ? "s" : ""}. Waiting for mentor response.
        </p>
      </div>
    );
  }

  // Empty state
  return (
    <div 
      className="rounded-3xl border-2 border-dashed p-5"
      style={{ borderColor: "#99F6E4", backgroundColor: "#CCFBF1" }}
    >
      <p className="text-sm font-semibold mb-1" style={{ color: "#0F766E" }}>
        Ready to find your mentor?
      </p>
      <p className="text-xs mb-4" style={{ color: "#0D9488" }}>
        Browse mentors and request your first session.
      </p>
      <button
        onClick={() => onSwitchTab("browse")}
        className="w-full text-sm font-semibold px-5 rounded-2xl transition-all active:scale-95"
        style={{ 
          backgroundColor: "#0D9488", 
          color: "#FFFFFF",
          minHeight: "48px"
        }}
      >
        Find a mentor
      </button>
    </div>
  );
};

export default UpcomingSessionCard;
