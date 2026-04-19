const QuickActions = ({ onSwitchTab }) => {
  const actions = [
    {
      id: "browse",
      label: "Find a mentor",
      subtext: "Browse verified mentors",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="M17 17l4 4" />
        </svg>
      )
    },
    {
      id: "sessions",
      label: "My sessions",
      subtext: "View all your sessions",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M3 10h18M9 2v4M15 2v4" />
        </svg>
      )
    }
  ];

  return (
    <div>
      <h3 className="text-sm font-bold mb-3" style={{ color: "#134E4A" }}>
        Quick actions
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onSwitchTab(action.id)}
            className="bg-white rounded-2xl border p-4 flex flex-col gap-2 cursor-pointer hover:border-teal-300 transition-colors active:scale-95 text-left"
            style={{ borderColor: "#CCFBF1" }}
          >
            {action.icon}
            <p className="text-sm font-bold" style={{ color: "#134E4A" }}>
              {action.label}
            </p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              {action.subtext}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
