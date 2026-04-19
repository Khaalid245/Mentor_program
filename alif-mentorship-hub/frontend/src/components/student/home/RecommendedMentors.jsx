const RecommendedMentors = ({ mentors, onSelectMentor, onSwitchTab }) => {
  if (!mentors || mentors.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold" style={{ color: "#134E4A" }}>
          Mentors for you
        </h3>
        <button 
          onClick={() => onSwitchTab("browse")}
          className="text-xs font-semibold"
          style={{ color: "#0D9488" }}
        >
          See all →
        </button>
      </div>

      <div 
        className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`.overflow-x-auto::-webkit-scrollbar { display: none; }`}</style>
        {mentors.slice(0, 5).map((mentor) => (
          <button
            key={mentor.id}
            onClick={() => onSelectMentor(mentor)}
            className="w-36 flex-shrink-0 bg-white rounded-2xl border p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-teal-300 transition-colors"
            style={{ borderColor: "#CCFBF1" }}
          >
            {/* Avatar */}
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black"
              style={{ backgroundColor: "#CCFBF1", color: "#0F766E" }}
            >
              {(mentor.first_name || mentor.username)?.charAt(0).toUpperCase()}
            </div>

            {/* Username */}
            <p className="text-xs font-bold text-center line-clamp-1" style={{ color: "#134E4A" }}>
              {mentor.first_name || mentor.username} {mentor.last_name || ""}
            </p>

            {/* Field */}
            <p className="text-xs text-center line-clamp-1" style={{ color: "#9CA3AF" }}>
              {mentor.field_of_study}
            </p>

            {/* Rating */}
            {mentor.average_rating > 0 ? (
              <p className="text-xs font-semibold" style={{ color: "#F59E0B" }}>
                ★ {Number(mentor.average_rating).toFixed(1)}
              </p>
            ) : (
              <span className="text-xs" style={{ color: "#5EEAD4" }}>
                New
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecommendedMentors;
