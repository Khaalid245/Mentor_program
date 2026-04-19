import { useEffect, useState, useCallback } from "react";
import api from "../../services/axios";

const CATEGORIES = [
  { value: "university",   label: "University",   badge: "bg-indigo-50 text-indigo-600 border border-indigo-200" },
  { value: "scholarships", label: "Scholarships", badge: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  { value: "career",       label: "Career",       badge: "bg-amber-50 text-amber-600 border border-amber-200" },
  { value: "student_life", label: "Student life", badge: "bg-violet-50 text-violet-600 border border-violet-200" },
];

const getCat = (value) =>
  CATEGORIES.find((c) => c.value === value) ||
  { label: value, badge: "bg-gray-100 text-gray-600 border border-indigo-100" };

const formatMonth = (raw) => {
  if (!raw) return "";
  try { return new Date(raw).toLocaleDateString("en-GB", { month: "long", year: "numeric" }); }
  catch { return ""; }
};

const Skeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-indigo-50 rounded-2xl h-36 animate-pulse" />
    ))}
  </div>
);

// ── Resource Card ─────────────────────────────────────────────────────────────
const ResourceCard = ({ resource, onUpdated, onDeleted }) => {
  const [editing, setEditing]       = useState(false);
  const [draft, setDraft]           = useState({ title: resource.title, category: resource.category, body: resource.body });
  const [saving, setSaving]         = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [fading, setFading]         = useState(false);
  const [error, setError]           = useState("");

  const cat = getCat(resource.category);

  const save = async () => {
    if (!draft.title.trim() || !draft.body.trim()) { setError("Title and body are required."); return; }
    setSaving(true);
    setError("");
    try {
      const r = await api.patch(`resources/${resource.id}/`, draft);
      onUpdated(r.data);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    setDeleting(true);
    try {
      await api.delete(`resources/${resource.id}/`);
      setFading(true);
      setTimeout(() => onDeleted(resource.id), 300);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete.");
      setDeleting(false);
      setConfirmDel(false);
    }
  };

  if (editing) {
    return (
      <div className="bg-white rounded-2xl border border-indigo-100 p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-indigo-900 mb-1 block">Title</label>
          <input value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            className="w-full border border-indigo-100 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white" />
        </div>
        <div>
          <label className="text-sm font-medium text-indigo-900 mb-1 block">Category</label>
          <select value={draft.category}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
            className="w-full border border-indigo-100 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white">
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-indigo-900 mb-1 block">Body</label>
          <textarea value={draft.body}
            onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
            rows={6}
            className="w-full border border-indigo-100 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none bg-white" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => { setEditing(false); setDraft({ title: resource.title, category: resource.category, body: resource.body }); setError(""); }}
            className="text-sm text-gray-400 hover:text-indigo-600 transition-colors">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px] disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-indigo-100 p-6 space-y-3 transition-opacity duration-300 ${fading ? "opacity-0" : "opacity-100"}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-sm font-semibold text-indigo-900 flex-1 min-w-0">{resource.title}</p>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0 ${cat.badge}`}>
          {cat.label}
        </span>
      </div>
      <p className="text-xs text-gray-400">{formatMonth(resource.published_at)}</p>
      <p className="text-sm text-gray-700">
        {resource.body?.slice(0, 150)}{resource.body?.length > 150 ? "…" : ""}
      </p>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {confirmDel ? (
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-indigo-50">
          <p className="text-sm text-gray-400 flex-1">Are you sure?</p>
          <button onClick={() => setConfirmDel(false)}
            className="bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-600 text-sm font-medium px-3 py-1.5 rounded-xl transition-colors min-h-[40px]">
            Cancel
          </button>
          <button onClick={del} disabled={deleting}
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-3 py-1.5 rounded-xl transition-colors min-h-[40px] disabled:opacity-50">
            {deleting ? "Deleting…" : "Confirm"}
          </button>
        </div>
      ) : (
        <div className="flex justify-end gap-2 pt-3 border-t border-indigo-50">
          <button onClick={() => setEditing(true)}
            className="bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px]">
            Edit
          </button>
          <button onClick={() => setConfirmDel(true)}
            className="bg-white border border-red-100 hover:bg-red-50 text-red-500 text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px]">
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

// ── Create Form ───────────────────────────────────────────────────────────────
const CreateForm = ({ onPublished }) => {
  const [form, setForm]             = useState({ title: "", category: "university", body: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState("");
  const [error, setError]           = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const canSubmit = form.title.trim().length > 0 && form.body.length >= 100;

  const publish = async () => {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const r = await api.post("resources/", form);
      onPublished(r.data);
      setForm({ title: "", category: "university", body: "" });
      setSuccess("Article published successfully.");
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || "Failed to publish.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 p-6 space-y-5 max-w-3xl">
      <div>
        <label className="text-sm font-medium text-indigo-900 mb-1 block">Title</label>
        <input value={form.title} onChange={(e) => set("title", e.target.value)}
          placeholder="Article title"
          className="w-full border border-indigo-100 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white" />
      </div>
      <div>
        <label className="text-sm font-medium text-indigo-900 mb-1 block">Category</label>
        <select value={form.category} onChange={(e) => set("category", e.target.value)}
          className="w-full border border-indigo-100 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white">
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-indigo-900 mb-1 block">Body</label>
        <textarea value={form.body} onChange={(e) => set("body", e.target.value)}
          rows={8} placeholder="Write the article content here…"
          className="w-full border border-indigo-100 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none h-48 bg-white" />
        <p className={`text-xs mt-1 ${form.body.length >= 100 ? "text-emerald-600" : "text-gray-400"}`}>
          {form.body.length} / 100 minimum
        </p>
      </div>
      {error   && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-emerald-600 font-medium">{success}</p>}
      <button onClick={publish} disabled={submitting || !canSubmit}
        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px] disabled:opacity-50">
        {submitting ? "Publishing…" : "Publish"}
      </button>
    </div>
  );
};

// ── Resources Tab ─────────────────────────────────────────────────────────────
const ResourcesTab = ({ description }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [pill, setPill]           = useState("published");

  const fetchResources = useCallback(() => {
    setLoading(true);
    api.get("resources/")
      .then((r) => { setResources(Array.isArray(r.data) ? r.data : (r.data.results ?? [])); setError(""); })
      .catch(() => setError("Failed to load resources."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  const handlePublished = (r) => {
    setResources((prev) => [r, ...prev]);
    setPill("published");
  };

  return (
    <div className="max-w-3xl space-y-6">
      {description && <p className="text-sm text-gray-400">{description}</p>}

      <div className="flex gap-2">
        {[
          { id: "published",   label: "Published", count: resources.length },
          { id: "create new",  label: "Create new", count: null },
        ].map((p) => (
          <button key={p.id} onClick={() => setPill(p.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors min-h-[40px] flex items-center gap-2 ${
              pill === p.id
                ? "bg-indigo-500 text-white"
                : "bg-white border border-indigo-100 text-indigo-600 hover:bg-indigo-50"
            }`}>
            {p.label}
            {p.count !== null && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                pill === p.id ? "bg-indigo-400 text-white" : "bg-indigo-50 text-indigo-400"
              }`}>
                {p.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {pill === "create new" ? (
        <CreateForm onPublished={handlePublished} />
      ) : error ? (
        <div className="bg-white border border-indigo-100 rounded-2xl p-6 flex items-center justify-between gap-4">
          <p className="text-sm text-red-500">{error}</p>
          <button onClick={fetchResources}
            className="bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors min-h-[40px]">
            Retry
          </button>
        </div>
      ) : loading ? (
        <Skeleton />
      ) : resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-semibold text-indigo-900">No resources published yet.</p>
          <p className="text-sm text-gray-400 mt-1">Switch to Create new to publish your first article.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {resources.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              onUpdated={(updated) => setResources((prev) => prev.map((x) => x.id === updated.id ? updated : x))}
              onDeleted={(id) => setResources((prev) => prev.filter((x) => x.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourcesTab;
