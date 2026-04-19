import { useEffect, useState, useCallback } from "react";
import api from "../../../services/axios";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (raw) => {
  if (!raw) return "—";
  try { return new Date(raw).toLocaleDateString("en-GB", { month: "long", year: "numeric" }); }
  catch { return "—"; }
};

const fmtDate = (raw) => {
  if (!raw) return "—";
  try { return new Date(raw).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return "—"; }
};

const StatusBadge = ({ user }) => {
  if (user.is_deactivated) return <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200">Deactivated</span>;
  if (user.is_suspended)   return <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">Suspended</span>;
  return <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">Active</span>;
};

const SESSION_BADGE = {
  pending:   "bg-amber-50 text-amber-600 border border-amber-200",
  accepted:  "bg-indigo-50 text-indigo-600 border border-indigo-200",
  completed: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  declined:  "bg-red-50 text-red-500 border border-red-200",
  cancelled: "bg-gray-100 text-gray-500 border border-gray-200",
};

const PanelSkeleton = () => (
  <div className="p-6 space-y-4 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-indigo-50" />
      <div className="space-y-2 flex-1">
        <div className="h-5 bg-indigo-50 rounded-xl w-1/2" />
        <div className="h-3 bg-indigo-50 rounded-xl w-3/4" />
      </div>
    </div>
    {[1,2,3,4].map(i => <div key={i} className="h-8 bg-indigo-50 rounded-xl" />)}
  </div>
);

// ── Action buttons ────────────────────────────────────────────────────────────
const Actions = ({ user, onStatusChange }) => {
  const [confirm, setConfirm]       = useState(null); // 'suspend' | 'deactivate' | 'unsuspend'
  const [typeConfirm, setTypeConfirm] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  if (user.is_deactivated) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <p className="text-sm text-red-500 font-medium">This account has been permanently deactivated.</p>
      </div>
    );
  }

  const act = async (endpoint, payload) => {
    setLoading(true);
    setError("");
    try {
      const r = await api.post(`admin/users/${user.id}/${endpoint}/`);
      onStatusChange({ ...user, ...r.data });
      setConfirm(null);
      setTypeConfirm("");
    } catch (err) {
      setError(err.response?.data?.error || "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  if (confirm === "suspend") return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <p className="text-sm text-amber-700 font-medium">Suspend this account? The user will not be able to log in.</p>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button onClick={() => act("suspend")} disabled={loading}
          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px] disabled:opacity-50">
          {loading ? "Suspending…" : "Confirm"}
        </button>
        <button onClick={() => setConfirm(null)}
          className="flex-1 bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px]">
          Cancel
        </button>
      </div>
    </div>
  );

  if (confirm === "unsuspend") return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
      <p className="text-sm text-emerald-700 font-medium">Unsuspend this account? The user will be able to log in again.</p>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button onClick={() => act("unsuspend")} disabled={loading}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px] disabled:opacity-50">
          {loading ? "Unsuspending…" : "Confirm"}
        </button>
        <button onClick={() => setConfirm(null)}
          className="flex-1 bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px]">
          Cancel
        </button>
      </div>
    </div>
  );

  if (confirm === "deactivate") return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
      <p className="text-sm text-red-600 font-medium">Permanently deactivate this account? This cannot be undone.</p>
      <p className="text-xs text-red-400">Type <span className="font-semibold">{user.username}</span> to confirm.</p>
      <input
        value={typeConfirm}
        onChange={(e) => setTypeConfirm(e.target.value)}
        placeholder={user.username}
        className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-red-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent bg-white"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => act("deactivate")}
          disabled={loading || typeConfirm !== user.username}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px] disabled:opacity-50">
          {loading ? "Deactivating…" : "Deactivate"}
        </button>
        <button onClick={() => { setConfirm(null); setTypeConfirm(""); }}
          className="flex-1 bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px]">
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-wrap gap-2">
      {user.is_suspended ? (
        <button onClick={() => setConfirm("unsuspend")}
          className="bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px]">
          Unsuspend
        </button>
      ) : (
        <button onClick={() => setConfirm("suspend")}
          className="bg-white border border-amber-200 hover:bg-amber-50 text-amber-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px]">
          Suspend
        </button>
      )}
      <button onClick={() => setConfirm("deactivate")}
        className="bg-white border border-red-100 hover:bg-red-50 text-red-500 text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px]">
        Deactivate
      </button>
    </div>
  );
};

// ── Panel ─────────────────────────────────────────────────────────────────────
const UserDetailPanel = ({ userId, onClose, onStatusChange }) => {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  const fetchUser = useCallback(() => {
    setLoading(true);
    setError("");
    api.get(`admin/users/${userId}/`)
      .then((r) => setUser(r.data))
      .catch(() => setError("Could not load user details."))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const handleStatusChange = (updated) => {
    setUser(updated);
    onStatusChange(updated);
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() || "??";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        role="button"
        aria-label="Close panel"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full w-full md:w-[480px] bg-white border-l border-indigo-100 z-50 overflow-y-auto"
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      >
        {/* Close */}
        <button onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-indigo-600 transition-colors"
          aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {loading ? <PanelSkeleton /> : error ? (
          <div className="p-6 flex items-center justify-between gap-4">
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={fetchUser}
              className="bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px]">
              Retry
            </button>
          </div>
        ) : user && (
          <div className="p-6 space-y-6">
            {/* Profile */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 text-xl font-bold flex items-center justify-center flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-indigo-900 truncate">{user.username}</p>
                  <p className="text-sm text-gray-500">{user.email || "—"}</p>
                  {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 capitalize">
                  {user.role}
                </span>
                <StatusBadge user={user} />
              </div>

              <p className="text-xs text-gray-400">Joined {fmtDate(user.date_joined)}</p>

              {/* Mentor profile grid */}
              {user.mentor_profile && (
                <div className="grid grid-cols-2 gap-3 mt-2 bg-indigo-50 rounded-2xl p-4">
                  {[
                    { label: "University",      value: user.mentor_profile.university },
                    { label: "Field",           value: user.mentor_profile.field_of_study },
                    { label: "Graduation",      value: user.mentor_profile.graduation_year },
                    { label: "Verified",        value: user.mentor_profile.is_verified ? "Yes" : "No" },
                    { label: "Avg rating",      value: user.mentor_profile.average_rating > 0 ? `${Number(user.mentor_profile.average_rating).toFixed(1)} ★` : "—" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-indigo-400 font-medium">{label}</p>
                      <p className="text-sm text-indigo-900">{value || "—"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-indigo-50 pt-4">
              <Actions user={user} onStatusChange={handleStatusChange} />
            </div>

            {/* Sessions */}
            <div className="border-t border-indigo-50 pt-4 space-y-3">
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Recent sessions</p>
              {user.recent_sessions?.length === 0 ? (
                <p className="text-sm text-gray-400">No sessions yet.</p>
              ) : (
                <>
                  {user.recent_sessions?.map((s) => (
                    <div key={s.id} className="flex items-start gap-3 py-2 border-b border-indigo-50 last:border-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 capitalize ${SESSION_BADGE[s.status] || "bg-gray-100 text-gray-500"}`}>
                        {s.status}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-indigo-900">
                          {user.role === "student" ? "with" : "for"} {s.other_party}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{s.goal?.slice(0, 60)}{s.goal?.length > 60 ? "…" : ""}</p>
                        <p className="text-xs text-gray-400">{fmtDate(s.requested_time)}</p>
                      </div>
                    </div>
                  ))}
                  {user.recent_sessions?.length === 20 && (
                    <p className="text-xs text-gray-400">Showing 20 most recent sessions.</p>
                  )}
                </>
              )}
            </div>

            {/* Review count */}
            <div className="border-t border-indigo-50 pt-4">
              <p className="text-sm text-gray-500">
                {user.role === "student"
                  ? `Total reviews written: ${user.review_count ?? 0}`
                  : `Total reviews received: ${user.review_count ?? 0}`}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserDetailPanel;
