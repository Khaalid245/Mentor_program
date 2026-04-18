import { useEffect, useState } from "react";
import api from "../../services/axios";

const STAT_DEFS = [
  { key: "total_students",        label: "Total students" },
  { key: "total_verified_mentors",label: "Verified mentors" },
  { key: "total_sessions",        label: "Total sessions" },
  { key: "sessions_this_month",   label: "Sessions this month" },
  { key: "completed_sessions",    label: "Completed sessions" },
  { key: "average_platform_rating", label: "Avg platform rating", isRating: true },
];

const StatCard = ({ label, value, isRating }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-1">
    <p className="text-xs text-gray-500 font-medium">{label}</p>
    <p className="text-3xl font-bold text-gray-800">
      {isRating
        ? value != null ? `${Number(value).toFixed(1)} ★` : "—"
        : value ?? "—"}
    </p>
  </div>
);

const SkeletonCard = () => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse space-y-2">
    <div className="h-3 bg-gray-200 rounded w-1/2" />
    <div className="h-8 bg-gray-200 rounded w-1/3" />
  </div>
);

const StatsTab = () => {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  const fetchStats = () => {
    api.get("admin/stats/")
      .then((r) => { setStats(r.data); setError(""); })
      .catch(() => setError("Could not load stats. Try refreshing."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800 pt-2">Platform stats</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {loading
          ? [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
          : STAT_DEFS.map((def) => (
              <StatCard
                key={def.key}
                label={def.label}
                value={stats?.[def.key]}
                isRating={def.isRating}
              />
            ))}
      </div>
    </div>
  );
};

export default StatsTab;
