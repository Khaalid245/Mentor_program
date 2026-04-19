const StatsRow = ({ completedCount, pendingCount, mentorsCount }) => {
  const stats = [
    {
      number: completedCount,
      label: "Completed sessions",
      color: "#059669"
    },
    {
      number: pendingCount,
      label: "Pending requests",
      color: "#D97706"
    },
    {
      number: mentorsCount,
      label: "Available mentors",
      color: "#0D9488"
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat, index) => (
        <div 
          key={index}
          className="bg-white rounded-2xl border p-4 flex flex-col items-center gap-1"
          style={{ borderColor: "#CCFBF1" }}
        >
          <p className="text-2xl font-black" style={{ color: stat.color }}>
            {stat.number}
          </p>
          <p className="text-xs font-medium text-center" style={{ color: "#9CA3AF" }}>
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
};

export default StatsRow;
