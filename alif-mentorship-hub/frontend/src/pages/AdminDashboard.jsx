import { useEffect, useState, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import api from "../services/axios";
import VerifyMentorsTab from "../components/admin/VerifyMentorsTab";
import StatsTab from "../components/admin/StatsTab";
import UserManagementTab from "../components/admin/UserManagementTab";
import SessionOversightTab from "../components/admin/SessionOversightTab";
import ResourcesTab from "../components/admin/ResourcesTab";
import ReportsTab from "../components/admin/ReportsTab";
import AuditLogTab from "../components/admin/AuditLogTab";
import SettingsTab from "../components/admin/SettingsTab";

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconVerify = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconStats = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="12" width="4" height="9" /><rect x="10" y="7" width="4" height="14" /><rect x="17" y="3" width="4" height="18" />
  </svg>
);
const IconResources = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
  </svg>
);
const IconReports = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconSessions = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const IconAuditLog = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10,9 9,9 8,9" />
  </svg>
);

const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

// ── Nav config ────────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Management",
    items: [
      { id: "verify",    label: "Verify mentors", Icon: IconVerify,    desc: "Review and approve mentor profiles" },
      { id: "stats",     label: "Stats",          Icon: IconStats,     desc: "Platform-wide activity overview" },
      { id: "users",     label: "Users",          Icon: IconUsers,     desc: "Manage student and mentor accounts" },
      { id: "sessions",  label: "Sessions",       Icon: IconSessions,  desc: "Monitor and manage mentorship sessions" },
    ],
  },
  {
    label: "Content",
    items: [
      { id: "resources", label: "Resources",      Icon: IconResources, desc: "Publish and manage learning articles" },
      { id: "reports",   label: "Reports",        Icon: IconReports,   desc: "Flagged content from users" },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "auditlog",  label: "Audit log",      Icon: IconAuditLog,  desc: "View all admin actions and changes" },
      { id: "settings",  label: "Settings",       Icon: IconSettings,  desc: "Account, platform and notification settings" },
    ],
  },
];

const ALL_TABS = NAV_GROUPS.flatMap((g) => g.items);

// ── NavItem ───────────────────────────────────────────────────────────────────
const NavItem = ({ id, label, Icon, hasBadge, pendingCount, activeTab, onNavigate }) => (
  <button
    aria-current={activeTab === id ? "page" : undefined}
    onClick={() => onNavigate(id)}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
      activeTab === id
        ? "bg-indigo-50 text-indigo-700 font-semibold"
        : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-700"
    }`}
  >
    <Icon />
    <span className="flex-1 text-left">{label}</span>
    {hasBadge && pendingCount > 0 && (
      <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-xs font-semibold flex items-center justify-center ml-auto">
        {pendingCount}
      </span>
    )}
  </button>
);

// ── SidebarContent ────────────────────────────────────────────────────────────
const SidebarContent = ({ username, platformName, pendingCount, activeTab, onNavigate, onLogout }) => (
  <div className="flex flex-col h-full">
    <div className="px-4 py-5 border-b border-indigo-50">
      <p className="text-base font-semibold text-indigo-900">{platformName}</p>
      <p className="text-xs text-indigo-300 mt-0.5">{username}</p>
    </div>

    <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest px-3 mb-1">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map(({ id, label, Icon }) => (
              <NavItem
                key={id}
                id={id}
                label={label}
                Icon={Icon}
                hasBadge={id === "verify"}
                pendingCount={pendingCount}
                activeTab={activeTab}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>

    <div className="px-3 py-4 border-t border-indigo-50">
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-red-500 transition-colors rounded-xl"
      >
        <IconLogout />
        Logout
      </button>
    </div>
  </div>
);

// ── AdminDashboard ────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const role = localStorage.getItem("user_role");
  if (role !== "admin") return <Navigate to="/login" replace />;

  const navigate                        = useNavigate();
  const username                        = localStorage.getItem("username") || "Admin";
  const initials                        = username.slice(0, 2).toUpperCase();
  const [activeTab, setActiveTab]         = useState("verify");
  const [pendingCount, setPendingCount]   = useState(0);
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [platformName, setPlatformName]   = useState("Alif Mentorship");

  useEffect(() => {
    api.get("admin/mentors/")
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : (r.data.results ?? []);
        setPendingCount(data.filter((m) => !m.is_verified).length);
      })
      .catch(() => {});
  }, []);

  const logout = useCallback(() => {
    ["access_token", "refresh_token", "user_role", "username"].forEach((k) =>
      localStorage.removeItem(k)
    );
    navigate("/login", { replace: true });
  }, [navigate]);

  const handleNavigate = useCallback((id) => {
    setActiveTab(id);
    setSidebarOpen(false);
  }, []);

  const currentTab = ALL_TABS.find((t) => t.id === activeTab);

  return (
    <div className="min-h-screen bg-[#F5F4FF]" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-indigo-100 flex-col z-40">
        <SidebarContent
          username={username}
          platformName={platformName}
          pendingCount={pendingCount}
          activeTab={activeTab}
          onNavigate={handleNavigate}
          onLogout={logout}
        />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
            role="button"
            aria-label="Close sidebar"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-white h-full z-50 flex flex-col border-r border-indigo-100">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-indigo-600"
              aria-label="Close menu"
            >
              <IconClose />
            </button>
            <SidebarContent
              username={username}
              platformName={platformName}
              pendingCount={pendingCount}
              activeTab={activeTab}
              onNavigate={handleNavigate}
              onLogout={logout}
            />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="md:ml-64 flex flex-col min-h-screen">
        <header className="bg-white border-b border-indigo-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-gray-400 hover:text-indigo-600 mr-1"
              aria-label="Open menu"
            >
              <IconMenu />
            </button>
            <span className="md:hidden text-sm font-semibold text-indigo-900 mr-2">Alif</span>
            <h1 className="text-xl font-semibold text-indigo-900">{currentTab?.label}</h1>
          </div>
          <div
            className="w-8 h-8 rounded-full bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0"
            aria-label={`Logged in as ${username}`}
          >
            {initials}
          </div>
        </header>

        <main className="flex-1 p-6">
          {activeTab === "verify"    && (
            <VerifyMentorsTab onPendingChange={setPendingCount} description={currentTab?.desc} />
          )}
          {activeTab === "stats"     && <StatsTab description={currentTab?.desc} />}
          {activeTab === "users"     && <UserManagementTab description={currentTab?.desc} />}
          {activeTab === "sessions"  && <SessionOversightTab description={currentTab?.desc} />}
          {activeTab === "resources" && <ResourcesTab description={currentTab?.desc} />}
          {activeTab === "reports"   && <ReportsTab description={currentTab?.desc} />}
          {activeTab === "auditlog"  && <AuditLogTab description={currentTab?.desc} />}
          {activeTab === "settings"  && (
            <SettingsTab
              description={currentTab?.desc}
              onPlatformNameChange={setPlatformName}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
