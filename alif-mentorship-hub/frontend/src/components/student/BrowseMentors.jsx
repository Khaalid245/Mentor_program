import { useEffect, useState, useMemo } from "react";
import api from "../../services/axios";

// ── Stars Component ───────────────────────────────────────────────────────────
const Stars = ({ rating, reviewCount }) => {
  if (!rating || rating === 0) {
    return <span className="text-xs text-gray-400">No reviews yet</span>;
  }
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs font-medium" style={{ color: "#F59E0B" }}>★ {Number(rating).toFixed(1)}</span>
      {reviewCount > 0 && <span className="text-xs text-gray-400">({reviewCount})</span>}
    </div>
  );
};

// ── Skeleton Loading ──────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-4 animate-pulse" style={{ border: "1px solid #CCFBF1" }}>
    <div className="w-12 h-12 rounded-full" style={{ backgroundColor: "#CCFBF1" }} />
    <div className="h-4 rounded mt-3" style={{ backgroundColor: "#CCFBF1", width: "70%" }} />
    <div className="h-3 rounded mt-2" style={{ backgroundColor: "#CCFBF1", width: "50%" }} />
    <div className="h-3 rounded mt-2" style={{ backgroundColor: "#CCFBF1", width: "90%" }} />
    <div className="h-3 rounded mt-1" style={{ backgroundColor: "#CCFBF1", width: "80%" }} />
    <div className="h-10 rounded-xl mt-3" style={{ backgroundColor: "#CCFBF1" }} />
  </div>
);

// ── Parse Availability ────────────────────────────────────────────────────────
const parseAvailability = (raw) => {
  if (!raw) return [];
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(data)) {
      return data.map((s) => `${s.day} ${s.start}–${s.end}`);
    }
    return Object.entries(data).flatMap(([day, slots]) =>
      (Array.isArray(slots) ? slots : [slots]).map((slot) => `${day} ${slot}`)
    );
  } catch {
    return [];
  }
};

// ── Session Request Modal ─────────────────────────────────────────────────────
const SessionModal = ({ mentor, onClose, onSuccess }) => {
  const timeOptions = useMemo(() => parseAvailability(mentor.availability), [mentor.availability]);
  const [selectedSlot, setSelectedSlot] = useState(timeOptions[0] || "");
  const [goal, setGoal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!goal.trim()) {
      setError("Please enter your goal for this session.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post("sessions/", {
        mentor_id: mentor.id,
        requested_time: selectedSlot,
        goal: goal.trim(),
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || "Failed to request session.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: "#CCFBF1" }}>
        <h2 className="text-lg font-semibold" style={{ color: "#134E4A" }}>Request a session</h2>
        <button onClick={onClose} className="text-2xl leading-none" style={{ color: "#6B7280" }}>×</button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Mentor summary */}
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ backgroundColor: "#CCFBF1", color: "#0F766E" }}
          >
            {(mentor.first_name || mentor.username).charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#134E4A" }}>
              {mentor.first_name || mentor.username} {mentor.last_name || ""}
            </p>
            <p className="text-xs" style={{ color: "#6B7280" }}>{mentor.field_of_study}</p>
          </div>
        </div>

        {/* Time slot selection */}
        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: "#134E4A" }}>
            When would you like to meet?
          </label>
          {timeOptions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {timeOptions.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: selectedSlot === slot ? "#0D9488" : "#FFFFFF",
                    color: selectedSlot === slot ? "#FFFFFF" : "#0F766E",
                    border: selectedSlot === slot ? "1px solid #0D9488" : "1px solid #CCFBF1"
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>
          ) : (
            <input
              type="datetime-local"
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="w-full border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2"
              style={{ 
                borderColor: "#CCFBF1", 
                color: "#134E4A",
                backgroundColor: "#FFFFFF"
              }}
            />
          )}
        </div>

        {/* Goal textarea */}
        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: "#134E4A" }}>
            What is your goal for this session?
          </label>
          <textarea
            value={goal}
            onChange={(e) => e.target.value.length <= 200 && setGoal(e.target.value)}
            rows={4}
            placeholder="Describe what you want to achieve..."
            className="w-full border rounded-xl px-3 py-2.5 text-base resize-none focus:outline-none focus:ring-2"
            style={{ 
              borderColor: "#CCFBF1", 
              color: "#134E4A",
              backgroundColor: "#FFFFFF"
            }}
          />
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>{goal.length} / 200</p>
        </div>

        {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}
      </div>

      {/* Submit button */}
      <div className="px-4 py-3 bg-white border-t" style={{ borderColor: "#CCFBF1" }}>
        <button
          onClick={submit}
          disabled={submitting || !goal.trim()}
          className="w-full text-sm font-medium px-4 rounded-xl transition-colors"
          style={{
            backgroundColor: submitting || !goal.trim() ? "#0D9488" : "#0D9488",
            color: "#FFFFFF",
            opacity: submitting || !goal.trim() ? 0.5 : 1,
            minHeight: "44px",
            cursor: submitting || !goal.trim() ? "not-allowed" : "pointer"
          }}
        >
          {submitting ? "Requesting..." : "Request a session"}
        </button>
      </div>
    </div>
  );
};

// ── Mentor Detail View ────────────────────────────────────────────────────────
const MentorDetail = ({ mentor, onBack, onRequestSession }) => {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    api.get(`mentors/${mentor.id}/reviews/`)
      .then((r) => setReviews(r.data))
      .catch(() => {})
      .finally(() => setLoadingReviews(false));
  }, [mentor.id]);

  const slots = parseAvailability(mentor.availability);

  const handleSuccess = () => {
    setShowModal(false);
    setToast("Session requested. You will be notified when the mentor responds.");
    setTimeout(() => {
      setToast("");
      onRequestSession();
    }, 3000);
  };

  return (
    <div className="pb-20" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Toast notification */}
      {toast && (
        <div 
          className="fixed top-4 left-4 right-4 px-4 py-3 rounded-xl z-50 text-sm font-medium"
          style={{ backgroundColor: "#0D9488", color: "#FFFFFF" }}
        >
          {toast}
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <button 
          onClick={onBack} 
          className="flex items-center gap-1 text-sm font-medium"
          style={{ color: "#0D9488" }}
        >
          ← Back
        </button>

        {/* Mentor info card */}
        <div className="bg-white rounded-2xl p-6 space-y-4" style={{ border: "1px solid #CCFBF1" }}>
          {/* Avatar and basic info */}
          <div className="flex flex-col items-center text-center gap-3">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ backgroundColor: "#CCFBF1", color: "#0F766E" }}
            >
              {(mentor.first_name || mentor.username).charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: "#134E4A" }}>
                {mentor.first_name || mentor.username} {mentor.last_name || ""}
              </h2>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                {mentor.university} · {mentor.field_of_study}
              </p>
              {mentor.graduation_year && (
                <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Class of {mentor.graduation_year}</p>
              )}
            </div>
            <Stars rating={mentor.average_rating} reviewCount={reviews.length} />
          </div>

          {/* Bio */}
          {mentor.bio && (
            <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>
              {mentor.bio}
            </p>
          )}

          {/* LinkedIn */}
          {mentor.linkedin_url && (
            <a 
              href={mentor.linkedin_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-medium hover:underline"
              style={{ color: "#0D9488" }}
            >
              View LinkedIn profile ↗
            </a>
          )}
        </div>

        {/* Availability section */}
        <div className="bg-white rounded-2xl p-6 space-y-3" style={{ border: "1px solid #CCFBF1" }}>
          <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#5EEAD4" }}>Availability</h3>
          {slots.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot, i) => (
                <span 
                  key={i}
                  className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{ backgroundColor: "#CCFBF1", color: "#0F766E", border: "1px solid #99F6E4" }}
                >
                  {slot}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: "#9CA3AF" }}>This mentor has not set availability yet.</p>
          )}
        </div>

        {/* Reviews section */}
        <div className="bg-white rounded-2xl p-6 space-y-3" style={{ border: "1px solid #CCFBF1" }}>
          <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#5EEAD4" }}>Reviews</h3>
          {loadingReviews ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: "#CCFBF1" }} />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              No reviews yet. Be the first to work with this mentor.
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 5).map((r, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: "#134E4A" }}>
                      {r.student_username || r.student}
                    </span>
                    <span className="text-xs font-medium" style={{ color: "#F59E0B" }}>
                      {"★".repeat(r.rating)}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm" style={{ color: "#4B5563" }}>{r.comment}</p>}
                  {r.created_at && (
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
              {reviews.length > 5 && (
                <button className="text-xs font-medium" style={{ color: "#0D9488" }}>
                  See all reviews
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fixed request button */}
      <div 
        className="fixed left-0 right-0 px-4 py-3 bg-white border-t"
        style={{ bottom: "64px", borderColor: "#CCFBF1" }}
      >
        <button
          onClick={() => setShowModal(true)}
          className="w-full text-sm font-medium px-4 rounded-xl transition-colors"
          style={{
            backgroundColor: "#0D9488",
            color: "#FFFFFF",
            minHeight: "44px"
          }}
        >
          Request a session
        </button>
      </div>

      {showModal && (
        <SessionModal mentor={mentor} onClose={() => setShowModal(false)} onSuccess={handleSuccess} />
      )}
    </div>
  );
};

// ── Browse Mentors (Main Component) ───────────────────────────────────────────
const BrowseMentors = ({ onRequestSession }) => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [fieldFilter, setFieldFilter] = useState("");
  const [uniFilter, setUniFilter] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get("mentors/")
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : (r.data.results ?? []);
        setMentors(data);
      })
      .catch(() => setError("Failed to load mentors."))
      .finally(() => setLoading(false));
  }, []);

  const fields = useMemo(() => [...new Set(mentors.map((m) => m.field_of_study).filter(Boolean))], [mentors]);
  const unis = useMemo(() => [...new Set(mentors.map((m) => m.university).filter(Boolean))], [mentors]);

  const filtered = useMemo(() => {
    return mentors.filter((m) => {
      const matchesSearch = !searchQuery || 
        (m.username?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.first_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.last_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.field_of_study?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesField = !fieldFilter || m.field_of_study === fieldFilter;
      const matchesUni = !uniFilter || m.university === uniFilter;
      return matchesSearch && matchesField && matchesUni;
    });
  }, [mentors, searchQuery, fieldFilter, uniFilter]);

  if (selected) {
    return <MentorDetail mentor={selected} onBack={() => setSelected(null)} onRequestSession={onRequestSession} />;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <h1 className="text-xl font-semibold pt-2" style={{ color: "#134E4A" }}>Browse mentors</h1>

      {/* Search and filter bar */}
      <div className="space-y-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search mentors by name or field"
          className="w-full border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2"
          style={{ 
            borderColor: "#CCFBF1", 
            color: "#134E4A",
            backgroundColor: "#FFFFFF"
          }}
        />
        <div className="flex gap-2">
          <select
            value={fieldFilter}
            onChange={(e) => setFieldFilter(e.target.value)}
            className="flex-1 border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
            style={{ 
              borderColor: "#CCFBF1", 
              color: "#134E4A",
              backgroundColor: "#FFFFFF"
            }}
          >
            <option value="">Field of study</option>
            {fields.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select
            value={uniFilter}
            onChange={(e) => setUniFilter(e.target.value)}
            className="flex-1 border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
            style={{ 
              borderColor: "#CCFBF1", 
              color: "#134E4A",
              backgroundColor: "#FFFFFF"
            }}
          >
            <option value="">University</option>
            {unis.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        {(searchQuery || fieldFilter || uniFilter) && (
          <button
            onClick={() => {
              setSearchQuery("");
              setFieldFilter("");
              setUniFilter("");
            }}
            className="text-sm font-medium"
            style={{ color: "#0D9488" }}
          >
            Clear
          </button>
        )}
      </div>

      {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}

      {/* Mentor grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#0D9488" strokeWidth="2" className="mx-auto">
            <circle cx="20" cy="20" r="14" />
            <path d="M30 30L42 42" />
          </svg>
          <p className="font-medium" style={{ color: "#134E4A" }}>No mentors found</p>
          <p className="text-sm" style={{ color: "#6B7280" }}>Try adjusting your search or filters.</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setFieldFilter("");
              setUniFilter("");
            }}
            className="text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
            style={{
              backgroundColor: "#FFFFFF",
              color: "#0F766E",
              border: "1px solid #CCFBF1",
              minHeight: "44px"
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((m) => {
            const availabilitySlots = parseAvailability(m.availability);
            return (
              <div
                key={m.id}
                onClick={() => setSelected(m)}
                className="bg-white rounded-2xl p-4 cursor-pointer transition-all hover:shadow-sm"
                style={{ border: "1px solid #CCFBF1" }}
              >
                {/* Avatar */}
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: "#CCFBF1", color: "#0F766E" }}
                >
                  {(m.first_name || m.username).charAt(0).toUpperCase()}
                </div>

                {/* Name and university */}
                <h3 className="text-sm font-semibold mt-3" style={{ color: "#134E4A" }}>
                  {m.first_name || m.username} {m.last_name || ""}
                </h3>
                <p className="text-xs" style={{ color: "#6B7280" }}>
                  {m.university} · <span style={{ color: "#0D9488" }}>{m.field_of_study}</span>
                </p>

                {/* Rating */}
                <div className="mt-2">
                  <Stars rating={m.average_rating} />
                </div>

                {/* Availability indicator */}
                <div className="flex items-center gap-1 mt-2">
                  {availabilitySlots.length > 0 ? (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#0D9488" }} />
                      <span className="text-xs" style={{ color: "#0D9488" }}>Available</span>
                    </>
                  ) : (
                    <span className="text-xs" style={{ color: "#9CA3AF" }}>No availability set</span>
                  )}
                </div>

                {/* Bio */}
                {m.bio && (
                  <p className="text-xs mt-2 line-clamp-2" style={{ color: "#6B7280" }}>
                    {m.bio}
                  </p>
                )}

                {/* View profile button */}
                <button
                  className="w-full mt-3 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                  style={{
                    backgroundColor: "#FFFFFF",
                    color: "#0F766E",
                    border: "1px solid #CCFBF1",
                    minHeight: "44px"
                  }}
                >
                  View profile
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BrowseMentors;
