const WelcomeCard = ({ username, completedCount, pendingCount }) => {
  // Detect time of day
  const hour = new Date().getHours();
  let greeting = "Good morning";
  if (hour >= 12 && hour < 17) greeting = "Good afternoon";
  else if (hour >= 17) greeting = "Good evening";

  // Motivational message based on session count
  const totalSessions = completedCount + pendingCount;
  let motivationalMessage = "Start your mentorship journey today.";
  if (totalSessions >= 4) motivationalMessage = "You're a dedicated learner. Keep going.";
  else if (totalSessions >= 1) motivationalMessage = "You're building great momentum.";

  // Calculate progress ring
  const total = completedCount + pendingCount;
  const progress = total > 0 ? (completedCount / total) * 100 : 0;
  const circumference = 2 * Math.PI * 28; // radius = 28
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div 
      className="bg-white rounded-2xl border p-6 flex items-center justify-between gap-4 shadow-sm"
      style={{ 
        borderColor: "#CCFBF1",
        boxShadow: "0 1px 3px 0 rgba(204, 251, 241, 0.5)"
      }}
    >
      {/* Left column */}
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: "#0D9488" }}>
          {greeting},
        </p>
        <h2 className="text-2xl font-black mt-1" style={{ color: "#134E4A" }}>
          {username}
        </h2>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
          {motivationalMessage}
        </p>
      </div>

      {/* Right column - Progress ring */}
      <div className="flex-shrink-0">
        <svg width="80" height="80" className="transform -rotate-90">
          {/* Track circle */}
          <circle
            cx="40"
            cy="40"
            r="28"
            fill="none"
            stroke="#CCFBF1"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r="28"
            fill="none"
            stroke="#0D9488"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ marginTop: "-80px", marginLeft: "0" }}>
          <p className="text-xl font-black" style={{ color: "#0F766E" }}>
            {completedCount}
          </p>
          <p className="text-xs" style={{ color: "#5EEAD4" }}>
            {total === 0 ? "Start!" : "done"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;
