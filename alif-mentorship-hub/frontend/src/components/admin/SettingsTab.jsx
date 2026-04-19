import { useEffect, useState, useCallback } from "react";
import api from "../../services/axios";

// ── Toggle Switch ─────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
      checked ? "bg-indigo-500" : "bg-gray-200"
    }`}
  >
    <span
      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
        checked ? "translate-x-5" : "translate-x-0.5"
      }`}
    />
  </button>
);

// ── Section skeleton ──────────────────────────────────────────────────────────
const SectionSkeleton = () => (
  <div className="bg-white rounded-2xl border border-indigo-100 p-6 animate-pulse space-y-3">
    <div className="h-3 bg-indigo-50 rounded-xl w-24 mb-4" />
    <div className="h-px bg-indigo-50 mb-6" />
    <div className="h-8 bg-indigo-50 rounded-xl w-full" />
    <div className="h-8 bg-indigo-50 rounded-xl w-full" />
    <div className="h-8 bg-indigo-50 rounded-xl w-3/4" />
  </div>
);

// ── Input ─────────────────────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div>
    <label className="text-sm font-medium text-indigo-900 mb-1 block">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full border border-indigo-100 rounded-xl px-3 py-2 text-base text-gray-900 placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white";

// ── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ heading, children }) => (
  <div className="bg-white rounded-2xl border border-indigo-100 p-6 space-y-5">
    <div>
      <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-4">{heading}</p>
      <div className="border-b border-indigo-50 mb-6" />
    </div>
    {children}
  </div>
);

// ── Section 1 — Account ───────────────────────────────────────────────────────
const AccountSection = () => {
  const [form, setForm]       = useState({ username: "", email: "", current_password: "", new_password: "", confirm_password: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError]     = useState("");
  const [fetchErr, setFetchErr] = useState("");

  const fetchMe = useCallback(() => {
    setLoading(true);
    setFetchErr("");
    api.get("auth/me/")
      .then((r) => setForm((f) => ({ ...f, username: r.data.username, email: r.data.email || "" })))
      .catch(() => setFetchErr("Could not load account settings. Try refreshing."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    if (form.new_password) {
      if (!form.current_password) return "Current password is required to set a new password.";
      if (form.new_password.length < 8) return "New password must be at least 8 characters.";
      if (form.new_password !== form.confirm_password) return "New password and confirm password do not match.";
    }
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    setError("");
    setSuccess("");
    const payload = { username: form.username, email: form.email };
    if (form.new_password) {
      payload.current_password = form.current_password;
      payload.new_password     = form.new_password;
    }
    try {
      await api.patch("auth/me/", payload);
      localStorage.setItem("username", form.username);
      setSuccess("Account updated.");
      setForm((f) => ({ ...f, current_password: "", new_password: "", confirm_password: "" }));
    } catch (err) {
      const d = err.response?.data;
      setError(d?.current_password?.[0] || d?.new_password?.[0] || d?.detail || JSON.stringify(d) || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SectionSkeleton />;

  if (fetchErr) {
    return (
      <div className="bg-white rounded-2xl border border-indigo-100 p-6 flex items-center justify-between gap-4">
        <p className="text-sm text-red-500">{fetchErr}</p>
        <button onClick={fetchMe} className="bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px]">Retry</button>
      </div>
    );
  }

  return (
    <Section heading="Account">
      <Field label="Username">
        <input value={form.username} onChange={(e) => set("username", e.target.value)} className={inputCls} />
      </Field>
      <Field label="Email">
        <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
      </Field>

      <div className="border-t border-indigo-50 pt-4 space-y-4">
        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Change password</p>
        <Field label="Current password">
          <input type="password" value={form.current_password} onChange={(e) => set("current_password", e.target.value)} placeholder="Leave blank to keep current password" className={inputCls} />
        </Field>
        <Field label="New password">
          <input type="password" value={form.new_password} onChange={(e) => set("new_password", e.target.value)} placeholder="Minimum 8 characters" className={inputCls} />
        </Field>
        <Field label="Confirm new password">
          <input type="password" value={form.confirm_password} onChange={(e) => set("confirm_password", e.target.value)} placeholder="Repeat new password" className={inputCls} />
        </Field>
      </div>

      {error   && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}

      <div className="flex justify-end pt-2">
        <button onClick={save} disabled={saving}
          className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px] disabled:opacity-50">
          {saving ? "Saving…" : "Save account settings"}
        </button>
      </div>
    </Section>
  );
};

// ── Section 2 — Platform ──────────────────────────────────────────────────────
const PlatformSection = ({ onPlatformNameChange }) => {
  const [form, setForm]         = useState({ platform_name: "", contact_email: "", maintenance_mode: false });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState("");
  const [error, setError]       = useState("");
  const [fetchErr, setFetchErr] = useState("");

  const fetchSettings = useCallback(() => {
    setLoading(true);
    setFetchErr("");
    api.get("admin/settings/")
      .then((r) => setForm(r.data))
      .catch(() => setFetchErr("Could not load platform settings. Try refreshing."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const r = await api.patch("admin/settings/", form);
      setForm(r.data);
      onPlatformNameChange(r.data.platform_name);
      setSuccess("Platform settings saved.");
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SectionSkeleton />;

  if (fetchErr) {
    return (
      <div className="bg-white rounded-2xl border border-indigo-100 p-6 flex items-center justify-between gap-4">
        <p className="text-sm text-red-500">{fetchErr}</p>
        <button onClick={fetchSettings} className="bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px]">Retry</button>
      </div>
    );
  }

  return (
    <Section heading="Platform">
      <Field label="Platform name">
        <input value={form.platform_name} onChange={(e) => set("platform_name", e.target.value)} className={inputCls} />
      </Field>
      <Field label="Contact email">
        <input type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} placeholder="support@example.com" className={inputCls} />
      </Field>

      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-medium text-indigo-900">Maintenance mode</p>
          <p className="text-xs text-gray-400">Prevents students and mentors from logging in</p>
        </div>
        <Toggle checked={form.maintenance_mode} onChange={(v) => set("maintenance_mode", v)} />
      </div>

      {form.maintenance_mode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
          <p className="text-sm text-amber-600">Maintenance mode is active. Students and mentors cannot log in.</p>
        </div>
      )}

      {error   && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}

      <div className="flex justify-end pt-2">
        <button onClick={save} disabled={saving}
          className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px] disabled:opacity-50">
          {saving ? "Saving…" : "Save platform settings"}
        </button>
      </div>
    </Section>
  );
};

// ── Section 3 — Notifications ─────────────────────────────────────────────────
const NOTIF_FIELDS = [
  { key: "notify_new_mentor",       label: "New mentor signup",    desc: "Email me when a new mentor registers" },
  { key: "notify_mentor_verified",  label: "Mentor verified",      desc: "Email me when a mentor is verified" },
  { key: "notify_new_session",      label: "New session booked",   desc: "Email me when a student books a session" },
  { key: "notify_session_completed",label: "Session completed",    desc: "Email me when a session is marked complete" },
];

const NotificationsSection = () => {
  const [form, setForm]         = useState({ notify_new_mentor: true, notify_mentor_verified: true, notify_new_session: false, notify_session_completed: false });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState("");
  const [error, setError]       = useState("");
  const [fetchErr, setFetchErr] = useState("");

  const fetchSettings = useCallback(() => {
    setLoading(true);
    setFetchErr("");
    api.get("admin/notification-settings/")
      .then((r) => setForm(r.data))
      .catch(() => setFetchErr("Could not load notification settings. Try refreshing."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const save = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const r = await api.patch("admin/notification-settings/", form);
      setForm(r.data);
      setSuccess("Notification preferences saved.");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SectionSkeleton />;

  if (fetchErr) {
    return (
      <div className="bg-white rounded-2xl border border-indigo-100 p-6 flex items-center justify-between gap-4">
        <p className="text-sm text-red-500">{fetchErr}</p>
        <button onClick={fetchSettings} className="bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px]">Retry</button>
      </div>
    );
  }

  return (
    <Section heading="Notifications">
      <div className="space-y-0">
        {NOTIF_FIELDS.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-3 border-b border-indigo-50 last:border-0">
            <div className="pr-4">
              <p className="text-sm font-medium text-indigo-900">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
            <Toggle checked={!!form[key]} onChange={(v) => setForm((f) => ({ ...f, [key]: v }))} />
          </div>
        ))}
      </div>

      {error   && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}

      <div className="flex justify-end pt-2">
        <button onClick={save} disabled={saving}
          className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px] disabled:opacity-50">
          {saving ? "Saving…" : "Save notification settings"}
        </button>
      </div>
    </Section>
  );
};

// ── Settings Tab ──────────────────────────────────────────────────────────────
const SettingsTab = ({ description, onPlatformNameChange }) => (
  <div className="max-w-2xl space-y-6">
    {description && <p className="text-sm text-gray-400">{description}</p>}
    <AccountSection />
    <PlatformSection onPlatformNameChange={onPlatformNameChange} />
    <NotificationsSection />
  </div>
);

export default SettingsTab;
