import { useEffect, useState } from "react";
import api from "../../services/axios";

const Stars = ({ rating }) => (
  <span className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} className={s <= Math.round(rating) ? "text-amber-400" : "text-gray-300"}>★</span>
    ))}
  </span>
);

const formatMonth = (raw) => {
  if (!raw) return "";
  try {
    return new Date(raw).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  } catch { return ""; }
};

const ReviewsTab = ({ profile }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!profile?.id) { setLoading(false); return; }
    api.get(`mentors/${profile.id}/reviews/`)
      .then((r) => setReviews(Array.isArray(r.data) ? r.data : (r.data.results ?? [])))
      .catch(() => setError("Failed to load reviews."))
      .finally(() => setLoading(false));
  }, [profile?.id]);

  const avg = profile?.average_rating;
  const count = reviews.length;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800 pt-2">My reviews</h1>

      {/* Average rating summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
        <span className="text-5xl font-bold text-gray-800">
          {avg ? Number(avg).toFixed(1) : "—"}
        </span>
        <div>
          <Stars rating={avg || 0} />
          <p className="text-sm text-gray-500 mt-1">
            {count > 0 ? `${count} review${count > 1 ? "s" : ""}` : "No reviews yet"}
          </p>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 font-medium">No reviews yet.</p>
          <p className="text-gray-400 text-sm mt-1">Complete sessions with students to receive reviews.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-semibold text-gray-800 text-sm">{r.student_username || r.student}</p>
                <span className="text-xs text-gray-400">{formatMonth(r.created_at)}</span>
              </div>
              <Stars rating={r.rating} />
              {r.comment && <p className="text-sm text-gray-600 pt-1">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsTab;
