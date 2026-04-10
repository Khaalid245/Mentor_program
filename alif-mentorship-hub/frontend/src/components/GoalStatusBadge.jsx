// GoalStatusBadge — shows a student's current stage on their career path
// Stages: Exploring → Decided → Applying → Enrolled

const STATUS_CONFIG = {
  Exploring: {
    color: "bg-yellow-100 text-yellow-800",
    icon: "🔍",
    description: "Still exploring options",
  },
  Decided: {
    color: "bg-blue-100 text-blue-800",
    icon: "🎯",
    description: "Career path decided",
  },
  Applying: {
    color: "bg-orange-100 text-orange-800",
    icon: "📝",
    description: "Actively applying",
  },
  Enrolled: {
    color: "bg-green-100 text-green-800",
    icon: "🎓",
    description: "Enrolled in program",
  },
};

const GoalStatusBadge = ({ status, showDescription = false }) => {
  const config = STATUS_CONFIG[status] || {
    color: "bg-gray-100 text-gray-700",
    icon: "❓",
    description: status,
  };

  return (
    <div className="inline-flex flex-col gap-1">
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${config.color}`}>
        <span>{config.icon}</span>
        {status}
      </span>
      {showDescription && (
        <span className="text-xs text-gray-500 pl-1">{config.description}</span>
      )}
    </div>
  );
};

export default GoalStatusBadge;
