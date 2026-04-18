import { useEffect, useState } from "react";
import api from "../../services/axios";

const CATEGORIES = ["university", "scholarships", "career", "student_life"];
const CATEGORY_LABELS = {
  university:   "University",
  scholarships: "Scholarships",
  career:       "Career",
  student_life: "Student life",
};

const CATEGORY_BADGE = {
  university:   "bg-blue-50 text-blue-700",
  scholarships: "bg-purple-50 text-purple-700",
  career:       "bg-green-50 text-green-700",
  student_life: "bg-amber-50 text-amber-700",
};

const formatMonth = (raw) => {
  if (!raw) return "";
  try { return new Date(raw).toLocaleDateString("en-GB", { month: "long", year: "numeric" }); }
  catch { return ""; }
};

// ── Resource Card ─────────────────────────────────────────────────────────────
const ResourceCard = ({ resource, onUpdated, onDeleted }) => {
  const [editing, setEditing]       = useState(false);
  const [draft, setDraft]           = useState({ title: resource.title, category: resource.category, body: resource.body });
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [error, setError]           = useState("");

  const save = async () => {
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
      onDeleted(resource.id);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete.");
      setDeleting(false);
      setConfirmDel(false);
    }
  };

  const badgeClass = CATEGORY_BADGE[resource.category?.toLowerCase()] || "bg-gray-100 text-gray-600";
  const categoryLabel = CATEGORY_LABELS[resource.category] || resource.category;

  if (editing) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-4 space-y-3">
        <input
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Title"
        />
        <select
          value={draft.category}
          onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
        <textarea
          value={draft.body}
          onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
          rows={5}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <p className="text-red-600 text-xs">{error}</p>}
        <div className="flex gap-2 items-center">
          <button onClick={save} disabled={saving}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-blue-700 transition">
            {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={() => { setEditing(false); setDraft({ title: resource.title, category: resource.category, body: resource.body }); setError(""); }}
            className="text-sm text-gray-500 hover:text-gray-700 px-2">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm">{resource.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatMonth(resource.published_at)}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize flex-shrink-0 ${badgeClass}`}>
          {categoryLabel}
        </span>
      </div>
      <p className="text-xs text-gray-500">
        {resource.body?.slice(0, 150)}{resource.body?.length > 150 ? "…" : ""}
      </p>

      {error && <p className="text-red-600 text-xs">{error}</p>}

      {!confirmDel ? (
        <div className="flex gap-2 pt-1">
          <button onClick={() => setEditing(true)}
            className="flex-1 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition">
            Edit
          </button>
          <button onClick={() => setConfirmDel(true)}
            className="flex-1 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition">
            Delete
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Delete this article?</p>
          <div className="flex gap-2">
            <button onClick={del} disabled={deleting}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-red-700 transition">
              {deleting ? "Deleting…" : "Confirm"}
            </button>
            <button onClick={() => setConfirmDel(false)}
              className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Create Form ───────────────────────────────────────────────────────────────
const CreateForm = ({ onPublished }) => {
      const [form, setForm] = useState({ title: "", category: "university", body: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError]     = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const publish = async () => {
    if (!form.title.trim() || !form.body.trim()) { setError("Title and body are required."); return; }
    if (form.body.length < 100) { setError("Body must be at least 100 characters."); return; }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const r = await api.post("resources/", form);
      onPublished(r.data);
      setForm({ title: "", category: "University", body: "" });
      setSuccess("Article published");
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || "Failed to publish.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1">Title *</label>
        <input value={form.title} onChange={(e) => set("title", e.target.value)}
          placeholder="Article title"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1">Category *</label>
        <select value={form.category} onChange={(e) => set("category", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1">
          Body * <span className="font-normal text-gray-400">({form.body.length} chars, min 100)</span>
        </label>
        <textarea value={form.body} onChange={(e) => set("body", e.target.value)}
          rows={6} placeholder="Write the article content here…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      {error   && <p className="text-red-600 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm font-medium">{success}</p>}
      <button onClick={publish} disabled={submitting}
        className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition">
        {submitting ? "Publishing…" : "Publish"}
      </button>
    </div>
  );
};

// ── Resources Tab ─────────────────────────────────────────────────────────────
const ResourcesTab = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [pill, setPill]           = useState("published");

  useEffect(() => {
    api.get("resources/")
      .then((r) => setResources(Array.isArray(r.data) ? r.data : (r.data.results ?? [])))
      .catch(() => setError("Failed to load resources."))
      .finally(() => setLoading(false));
  }, []);

  const handlePublished = (newResource) => {
    setResources((prev) => [newResource, ...prev]);
    setPill("published");
  };

  const handleUpdated = (updated) =>
    setResources((prev) => prev.map((r) => r.id === updated.id ? updated : r));

  const handleDeleted = (id) =>
    setResources((prev) => prev.filter((r) => r.id !== id));

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800 pt-2">Resources</h1>

      <div className="flex gap-2">
        {["published", "create new"].map((p) => (
          <button key={p} onClick={() => setPill(p)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition ${
              pill === p ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {p}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {pill === "create new" ? (
        <CreateForm onPublished={handlePublished} />
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 font-medium">No resources published yet.</p>
          <p className="text-gray-400 text-sm mt-1">Use the Create new tab to add your first article.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((r) => (
            <ResourceCard key={r.id} resource={r} onUpdated={handleUpdated} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourcesTab;
