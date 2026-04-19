const BottomNav = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: "home",
      label: "Home",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={active ? "#0D9488" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l8-6 8 6v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="M7 20V12h8v8" />
        </svg>
      )
    },
    {
      id: "browse",
      label: "Browse",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={active ? "#0D9488" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="7" />
          <path d="M15 15l6 6" />
        </svg>
      )
    },
    {
      id: "sessions",
      label: "Sessions",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={active ? "#0D9488" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="16" height="16" rx="2" />
          <path d="M3 9h16M8 2v4M14 2v4" />
          <circle cx="11" cy="14" r="1.5" fill={active ? "#0D9488" : "#9CA3AF"} />
        </svg>
      )
    },
    {
      id: "resources",
      label: "Resources",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={active ? "#0D9488" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2V3z" />
          <path d="M20 3h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7V3z" />
        </svg>
      )
    }
  ];

  return (
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 h-16 flex items-stretch"
      style={{ 
        borderColor: "#CCFBF1",
        paddingBottom: "env(safe-area-inset-bottom)"
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center justify-center flex-1 gap-1 pt-1 relative"
          >
            {isActive && (
              <div 
                className="absolute top-1 w-1 h-1 rounded-full"
                style={{ backgroundColor: "#0D9488" }}
              />
            )}
            {tab.icon(isActive)}
            <span 
              className="text-xs"
              style={{ 
                color: isActive ? "#0D9488" : "#9CA3AF",
                fontWeight: isActive ? 700 : 500
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
