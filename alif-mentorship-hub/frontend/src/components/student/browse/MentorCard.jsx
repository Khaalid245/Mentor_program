const MentorCard = ({ mentor, onSelect }) => {
  // Parse availability
  const parseAvailability = (raw) => {
    if (!raw) return [];
    try {
      const data = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(data)) return data;
      return Object.entries(data).flatMap(([day, slots]) =>
        (Array.isArray(slots) ? slots : [slots]).map(() => true)
      );
    } catch {
      return [];
    }
  };

  const hasAvailability = parseAvailability(mentor.availability).length > 0;

  return (
    <button
      onClick={() => onSelect(mentor)}
      className="bg-white rounded-2xl border overflow-hidden hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer text-left w-full"
      style={{ borderColor: "#CCFBF1" }}
    >
      {/* Top gradient header */}
      <div 
        className="h-16 relative"
        style={{ background: "linear-gradient(to right, #0D9488, #10B981)" }}
      >
        {/* Avatar - positioned to overlap */}
        <div 
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black absolute -bottom-7 left-5 border-4 shadow-sm"
          style={{ backgroundColor: "#FFFFFF", color: "#0D9488", borderColor: "#FFFFFF" }}
        >
          {(mentor.first_name || mentor.username)?.charAt(0).toUpperCase()}
        </div>

        {/* Verified badge */}
        {mentor.is_verified && (
          <div 
            className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.2)", color: "#FFFFFF" }}
          >
            Verified
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div className="pt-10 px-5 pb-5">
        {/* Name */}
        <h3 className="text-base font-bold" style={{ color: "#134E4A" }}>
          {mentor.first_name || mentor.username} {mentor.last_name || ""}
        </h3>

        {/* University and graduation year */}
        <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
          {mentor.university} {mentor.graduation_year ? `· Class of ${mentor.graduation_year}` : ""}
        </p>

        {/* Field badge */}
        <span 
          className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full border mt-2"
          style={{ backgroundColor: "#CCFBF1", color: "#0D9488", borderColor: "#99F6E4" }}
        >
          {mentor.field_of_study}
        </span>

        {/* Rating */}
        <div className="mt-2">
          {mentor.average_rating > 0 ? (
            <p className="text-xs font-semibold" style={{ color: "#F59E0B" }}>
              ★ {Number(mentor.average_rating).toFixed(1)} ({mentor.review_count || 0} reviews)
            </p>
          ) : (
            <p className="text-xs" style={{ color: "#9CA3AF" }}>No reviews yet</p>
          )}
        </div>

        {/* Bio */}
        {mentor.bio && (
          <p className="text-xs line-clamp-2 mt-2" style={{ color: "#6B7280" }}>
            {mentor.bio}
          </p>
        )}

        {/* Availability indicator */}
        <div className="flex items-center gap-1.5 mt-2">
          <div 
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: hasAvailability ? "#10B981" : "#9CA3AF" }}
          />
          <span className="text-xs" style={{ color: hasAvailability ? "#10B981" : "#9CA3AF" }}>
            {hasAvailability ? "Available" : "No slots set"}
          </span>
        </div>

        {/* View profile button */}
        <button
          className="w-full mt-4 text-sm font-semibold px-5 py-2.5 rounded-xl border-2 transition-all hover:border-teal-400 hover:bg-teal-50"
          style={{ 
            backgroundColor: "#FFFFFF",
            color: "#0F766E",
            borderColor: "#99F6E4",
            minHeight: "44px"
          }}
        >
          View profile
        </button>
      </div>
    </button>
  );
};

export default MentorCard;
