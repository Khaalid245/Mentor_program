import { useEffect, useState, useMemo } from "react";
import api from "../../services/axios";

const CATEGORY_PILLS = ["All", "university", "scholarships", "career", "student_life"];
const CATEGORY_LABELS = {
  All: "All",
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

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [category, setCategory]   = useState("All");
  const [expanded, setExpanded]   = useState(null);

  useEffect(() => {
    api.get("resources/")
      .then((r) => setResources(Array.isArray(r.data) ? r.data : (r.data.results ?? [])))
      .catch(() => setError("Failed to load resources."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() =>
    resources.filter((r) =>
      category === "All" || r.category === category
    ), [resources, category]);

  if (expanded) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <button onClick={() => setExpanded(null)} className="flex items-center gap-1 text-blue-600 text-sm font-medium">
          ← Back to resources
        </button>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${CATEGORY_BADGE[expanded.category] || "bg-gray-100 text-gray-600"}`}>
            {CATEGORY_LABELS[expanded.category] || expanded.category}
          </span>
          <h2 className="font-bold text-gray-800 text-xl">{expanded.title}</h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{expanded.body}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800 pt-2">Resources</h1>

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORY_PILLS.map((c) => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              category === c ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 font-medium">No resources published yet. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <button key={r.id} onClick={() => setExpanded(r)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-left space-y-2 hover:border-blue-300 transition w-full">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${CATEGORY_BADGE[r.category] || "bg-gray-100 text-gray-600"}`}>
                {CATEGORY_LABELS[r.category] || r.category}
              </span>
              <p className="font-semibold text-gray-800 text-sm">{r.title}</p>
              <p className="text-xs text-gray-500 line-clamp-2">
                {r.body?.slice(0, 120)}{r.body?.length > 120 ? "…" : ""}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Resources;
