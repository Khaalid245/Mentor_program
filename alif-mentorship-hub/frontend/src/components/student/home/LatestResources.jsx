const LatestResources = ({ resources, onSwitchTab }) => {
  if (!resources || resources.length === 0) {
    return null;
  }

  const CATEGORY_COLORS = {
    university: "#0D9488",
    scholarships: "#10B981",
    career: "#D97706",
    student_life: "#7C3AED"
  };

  const CATEGORY_STYLES = {
    university: { bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" },
    scholarships: { bg: "#D1FAE5", text: "#059669", border: "#A7F3D0" },
    career: { bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" },
    student_life: { bg: "#F3E8FF", text: "#7C3AED", border: "#E9D5FF" }
  };

  const CATEGORY_LABELS = {
    university: "University",
    scholarships: "Scholarships",
    career: "Career",
    student_life: "Student life"
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold" style={{ color: "#134E4A" }}>
          Latest resources
        </h3>
        <button 
          onClick={() => onSwitchTab("resources")}
          className="text-xs font-semibold"
          style={{ color: "#0D9488" }}
        >
          See all →
        </button>
      </div>

      <div className="space-y-3">
        {resources.slice(0, 2).map((resource) => {
          const squareColor = CATEGORY_COLORS[resource.category] || "#9CA3AF";
          const style = CATEGORY_STYLES[resource.category] || { bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB" };
          const excerpt = resource.body?.slice(0, 80) || "";

          return (
            <button
              key={resource.id}
              onClick={() => onSwitchTab("resources")}
              className="bg-white rounded-2xl border p-4 flex gap-3 cursor-pointer hover:border-teal-300 transition-colors w-full text-left"
              style={{ borderColor: "#CCFBF1" }}
            >
              {/* Colored square */}
              <div 
                className="w-10 h-10 rounded-xl flex-shrink-0"
                style={{ backgroundColor: squareColor }}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <span 
                  className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-full border"
                  style={{ 
                    backgroundColor: style.bg, 
                    color: style.text, 
                    borderColor: style.border 
                  }}
                >
                  {CATEGORY_LABELS[resource.category] || resource.category}
                </span>
                <h4 className="text-sm font-semibold line-clamp-1 mt-1" style={{ color: "#134E4A" }}>
                  {resource.title}
                </h4>
                <p className="text-xs line-clamp-2 mt-1" style={{ color: "#9CA3AF" }}>
                  {excerpt}{excerpt.length >= 80 ? "..." : ""}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LatestResources;
