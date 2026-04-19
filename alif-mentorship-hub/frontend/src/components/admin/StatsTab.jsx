import { useEffect, useState, useCallback } from "react";
import api from "../../services/axios";

const STAT_DEFS = [
  { key: "total_students",          label: "Total students",      border: "border-l-4 border-indigo-400" },
  { key: "total_verified_mentors",  label: "Verified mentors",    border: "border-l-4 border-indigo-400" },
  { key: "total_sessions",          label: "Total sessions",      border: "border-l-4 border-violet-400" },
  { key: "sessions_this_month",     label: "Sessions this month", border: "border-l-4 border-violet-400" },
  { key: "completed_sessions",      label: "Completed sessions",  border: "border-l-4 border-emerald-400" },
  { key: "average_platform_rating", label: "Avg platform rating", border: "border-l-4 border-emerald-400", isRating: true },
];

const getContext = (key, stats) => {
  if (!stats) return null;
  if (key === "completed_sessions" && stats.total_sessions > 0)
    return `${Math.round((stats.completed_sessions / stats.total_sessions) * 100)}% of total sessions`;
  if (key === "sessions_this_month" && stats.total_sessions > 0)
    return `${Math.round((stats.sessions_this_month / stats.total_sessions) * 100)}% of all sessions`;
  if (key === "total_verified_mentors" && stats.total_students > 0)
    return `${stats.total_students} student${stats.total_students !== 1 ? "s" : ""} on platform`;
  return null;
};

const formatTime = (date) =>
  date?.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) ?? null;

const StatCard = ({ label, value, border, isRating, context }) => (
  <div className={`bg-white rounded-2xl border border-indigo-100 p-6 ${border}`}>
    <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest mb-2">{label}</p>
    <p className="text-3xl font-bold text-indigo-900">
      {isRating ? (value != null ? `${Number(value).toFixed(1)} ★` : "—") : (value ?? "—")}
    </p>
    {context && <p className="text-xs text-gray-400 mt-1">{context}</p>}
  </div>
);

const SkeletonCard = () => (
  <div className="bg-indigo-50 rounded-2xl h-28 animate-pulse" />
);

const StatsTab = ({ description }) => {
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStats = useCallback(() => {
    setError("");
    api.get("admin/stats/")
      .then((r) => { setStats(r.data); setLastUpdated(new Date()); setLoading(false); })
      .catch(() => { setError("Could not load stats. Try refreshing the page."); setLoading(false); });
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (error) {
    return (
      <div className="max-w-5xl space-y-4">
        {description && <p className="text-sm text-gray-400">{description}</p>}
        <div className="bg-white border border-indigo-100 rounded-2xl p-6 flex items-center justify-between gap-4">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={() => { setLoading(true); fetchStats(); }}
            className="bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px] flex-shrink-0"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        {description && <p className="text-sm text-gray-400">{description}</p>}
        {lastUpdated && (
          <p className="text-xs text-gray-400 flex-shrink-0">
            Last updated {formatTime(lastUpdated)} · auto-refreshes every 60s
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
          : STAT_DEFS.map((def) => (
              <StatCard
                key={def.key}
                label={def.label}
                value={stats?.[def.key]}
                border={def.border}
                isRating={def.isRating}
                context={getContext(def.key, stats)}
              />
            ))}
      </div>
    </div>
  );
};

export default StatsTab;
