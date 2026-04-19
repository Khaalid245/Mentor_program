const PageHeader = ({ title }) => {
  const username = localStorage.getItem("username") || "Student";
  const initial = username.charAt(0).toUpperCase();

  return (
    <div 
      className="bg-white border-b px-5 py-4 flex items-center justify-between sticky top-0 z-20"
      style={{ borderColor: "#CCFBF1" }}
    >
      {/* Left side - platform name on mobile, tab title on desktop */}
      <h1 className="text-lg font-black md:font-semibold" style={{ color: "#0D9488" }}>
        <span className="md:hidden">Alif</span>
        <span className="hidden md:inline" style={{ color: "#134E4A" }}>{title}</span>
      </h1>

      {/* Right side - avatar */}
      <div 
        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
        style={{ backgroundColor: "#0D9488", color: "#FFFFFF" }}
      >
        {initial}
      </div>
    </div>
  );
};

export default PageHeader;
