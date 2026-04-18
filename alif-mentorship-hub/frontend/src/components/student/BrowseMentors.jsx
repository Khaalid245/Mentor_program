import { useEffect, useState, useMemo } from "react";
import api from "../../services/axios";

// ── Helpers ───────────────────────────────────────────────────────────────────
const Stars = ({ rating }) => {
  if (!rating) return <span className="text-xs text-gray-400">No reviews yet</span>;
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= Math.round(rating) ? "text-amber-400" : "text-gray-300"}>★</span>
      ))}
      <span className="text-xs text-gray-500 ml-1">{Number(rating).toFixed(1)}</span>
    </span>
  );
};

const SkeletonCard = () => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse space-y-3">
    <div className="h-4 bg-gray-200 rounded w-3/4" />
    <div className="h-3 bg-gray-200 rounded w-1/2" />
    <div className="h-3 bg-gray-200 rounded w-full" />
    <div className="h-3 bg-gray-200 rounded w-5/6" />
    <div className="h-8 bg-gray-200 rounded w-full mt-2" />
  </div>
);

// Parse availability JSON → readable slots
const parseAvailability = (raw) => {
  if (!raw) return [];
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    // Support { Monday: ["10:00-12:00", ...], ... } or [{ day, start, end }, ...]
    if (Array.isArray(data)) {
      return data.map((s) => `${s.day} ${s.start}–${s.end}`);
    }
    return Object.entries(data).flatMap(([day, slots]) =>
      (Array.isArray(slots) ? slots : [slots]).map((slot) => ({ label: `${day} ${slot}`, day, slot }))
    );
  } catch {
    return [];
  }
};

// Build datetime options from availability for the session modal
const buildTimeOptions = (raw) => {
  const slots = parseAvailability(raw);
  return slots.map((s) => (typeof s === "string" ? s : s.label));
};

// ── Session Request Modal ─────────────────────────────────────────────────────
const SessionModal = ({ mentor, onClose, onSuccess }) => {
  const timeOptions = useMemo(() => buildTimeOptions(mentor.availability), [mentor.availability]);
  const [selectedSlot, setSelectedSlot] = useState(timeOptions[0] || "");
  const [goal, setGoal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!selectedSlot) { setError("Please select a time slot."); return; }
    if (!goal.trim())  { setError("Please enter a goal."); return; }
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
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Request a session</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Available slot</label>
          {timeOptions.length > 0 ? (
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timeOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <input
              type="datetime-local"
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">
            Your goal <span className="font-normal text-gray-400">({goal.length}/200)</span>
          </label>
          <textarea
            value={goal}
            onChange={(e) => e.target.value.length <= 200 && setGoal(e.target.value)}
            rows={3}
            placeholder="What do you want to achieve in this session?"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {submitting ? "Sending…" : "Send request"}
        </button>
      </div>
    </div>
  );
};

// ── Mentor Detail Panel ───────────────────────────────────────────────────────
const MentorDetail = ({ mentor, onBack, onRequestSession }) => {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    api.get(`mentors/${mentor.id}/reviews/`)
      .then((r) => setReviews(r.data))
      .catch(() => {})
      .finally(() => setLoadingReviews(false));
  }, [mentor.id]);

  const slots = parseAvailability(mentor.availability);

  const handleSuccess = () => {
    setShowModal(false);
    setSuccessMsg("Session requested! Switching to My sessions…");
    setTimeout(() => onRequestSession(), 1500);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-blue-600 text-sm font-medium">
        ← Back to mentors
      </button>

      {successMsg && (
        <div className="bg-green-50 border border-green-300 text-green-700 rounded-xl px-4 py-3 text-sm">
          {successMsg}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">{mentor.first_name || mentor.username} {mentor.last_name}</h2>
            <p className="text-sm text-gray-500">{mentor.field_of_study} · {mentor.university}</p>
          </div>
          <Stars rating={mentor.average_rating} />
        </div>

        <p className="text-sm text-gray-700 leading-relaxed">{mentor.bio || "No bio provided."}</p>

        <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Graduation year</p>
            <p className="font-medium text-gray-700">{mentor.graduation_year || "—"}</p>
          </div>
          {mentor.linkedin_url && (
            <div>
              <p className="text-xs text-gray-400">LinkedIn</p>
              <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer"
                className="text-blue-600 font-medium text-sm hover:underline">View profile ↗</a>
            </div>
          )}
        </div>

        {slots.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-2">Availability</p>
            <div className="flex flex-wrap gap-2">
              {slots.map((s, i) => (
                <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                  {typeof s === "string" ? s : s.label}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowModal(true)}
          className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition"
        >
          Request a session
        </button>
      </div>

      {/* Reviews */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 mb-3">Reviews</h3>
        {loadingReviews ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-gray-400">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r, i) => (
              <div key={i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{r.student_username || r.student}</span>
                  <Stars rating={r.rating} />
                </div>
                {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <SessionModal mentor={mentor} onClose={() => setShowModal(false)} onSuccess={handleSuccess} />
      )}
    </div>
  );
};

// ── Browse Mentors (Tab 1) ────────────────────────────────────────────────────
const BrowseMentors = ({ onRequestSession }) => {
  const [mentors, setMentors]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [fieldFilter, setFieldFilter] = useState("");
  const [uniFilter, setUniFilter]     = useState("");
  const [selected, setSelected]       = useState(null);

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
  const unis   = useMemo(() => [...new Set(mentors.map((m) => m.university).filter(Boolean))], [mentors]);

  const filtered = useMemo(() =>
    mentors.filter((m) =>
      (!fieldFilter || m.field_of_study === fieldFilter) &&
      (!uniFilter   || m.university === uniFilter)
    ), [mentors, fieldFilter, uniFilter]);

  if (selected) {
    return <MentorDetail mentor={selected} onBack={() => setSelected(null)} onRequestSession={onRequestSession} />;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800 pt-2">Browse mentors</h1>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={fieldFilter}
          onChange={(e) => setFieldFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All fields</option>
          {fields.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select
          value={uniFilter}
          onChange={(e) => setUniFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All universities</option>
          {unis.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        {(fieldFilter || uniFilter) && (
          <button
            onClick={() => { setFieldFilter(""); setUniFilter(""); }}
            className="text-blue-600 text-sm font-medium whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 font-medium">No mentors found for this filter.</p>
          <p className="text-gray-400 text-sm mt-1">Try clearing the filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-2">
              <div>
                <p className="font-semibold text-gray-800">{m.first_name || m.username} {m.last_name}</p>
                <p className="text-xs text-gray-500">{m.university}</p>
              </div>
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full self-start">
                {m.field_of_study}
              </span>
              <p className="text-sm text-gray-600 line-clamp-2 flex-1">{m.bio}</p>
              <Stars rating={m.average_rating} />
              <button
                onClick={() => setSelected(m)}
                className="mt-1 w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
              >
                View profile
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseMentors;
