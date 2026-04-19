import { useEffect, useState, useMemo } from "react";
import api from "../../services/axios";

const CATEGORY_PILLS = ["All", "university", "scholarships", "career", "student_life"];

const CATEGORY_LABELS = {
  All: "All",
  university: "University",
  scholarships: "Scholarships",
  career: "Career",
  student_life: "Student life",
};

const CATEGORY_STYLES = {
  university: { bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" },
  scholarships: { bg: "#F3E8FF", text: "#7C3AED", border: "#E9D5FF" },
  career: { bg: "#D1FAE5", text: "#059669", border: "#A7F3D0" },
  student_life: { bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" },
};

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("All");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get("resources/")
      .then((r) => setResources(Array.isArray(r.data) ? r.data : (r.data.results ?? [])))
      .catch(() => setError("Failed to load resources."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => resources.filter((r) => category === "All" || r.category === category),
    [resources, category]
  );

  // Article view
  if (expanded) {
    const style = CATEGORY_STYLES[expanded.category] || { bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB" };
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <button 
          onClick={() => setExpanded(null)} 
          className="flex items-center gap-1 text-sm font-medium"
          style={{ color: "#0D9488" }}
        >
          ← Back
        </button>

        <div className="bg-white rounded-2xl p-6 space-y-4" style={{ border: "1px solid #CCFBF1" }}>
          <span 
            className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full"
            style={{ 
              backgroundColor: style.bg, 
              color: style.text, 
              border: `1px solid ${style.border}` 
            }}
          >
            {CATEGORY_LABELS[expanded.category] || expanded.category}
          </span>

          <h2 className="text-xl font-semibold" style={{ color: "#134E4A" }}>
            {expanded.title}
          </h2>

          {expanded.published_at && (
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              Published {new Date(expanded.published_at).toLocaleDateString()}
            </p>
          )}

          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#374151" }}>
            {expanded.body}
          </p>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <h1 className="text-xl font-semibold pt-2" style={{ color: "#134E4A" }}>Resources</h1>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORY_PILLS.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors"
            style={{
              backgroundColor: category === c ? "#0D9488" : "#FFFFFF",
              color: category === c ? "#FFFFFF" : "#0D9488",
              border: category === c ? "1px solid #0D9488" : "1px solid #CCFBF1"
            }}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}

      {/* Resource cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse" style={{ border: "1px solid #CCFBF1" }}>
              <div className="h-3 rounded" style={{ backgroundColor: "#CCFBF1", width: "30%" }} />
              <div className="h-4 rounded mt-2" style={{ backgroundColor: "#CCFBF1", width: "70%" }} />
              <div className="h-3 rounded mt-2" style={{ backgroundColor: "#CCFBF1", width: "90%" }} />
              <div className="h-3 rounded mt-1" style={{ backgroundColor: "#CCFBF1", width: "80%" }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-medium" style={{ color: "#134E4A" }}>No resources published yet.</p>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((r) => {
            const style = CATEGORY_STYLES[r.category] || { bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB" };
            const excerpt = r.body?.slice(0, 120) || "";
            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl p-4 cursor-pointer transition-all hover:shadow-sm"
                style={{ border: "1px solid #CCFBF1" }}
                onClick={() => setExpanded(r)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span 
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: style.bg, 
                      color: style.text, 
                      border: `1px solid ${style.border}` 
                    }}
                  >
                    {CATEGORY_LABELS[r.category] || r.category}
                  </span>
                </div>

                <h3 className="text-sm font-semibold" style={{ color: "#134E4A" }}>
                  {r.title}
                </h3>

                {r.published_at && (
                  <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                    {new Date(r.published_at).toLocaleDateString()}
                  </p>
                )}

                <p className="text-sm mt-2 line-clamp-3" style={{ color: "#6B7280" }}>
                  {excerpt}{excerpt.length >= 120 ? "..." : ""}
                </p>

                <button 
                  className="text-xs font-medium mt-2 hover:underline"
                  style={{ color: "#0D9488" }}
                >
                  Read article
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Resources;
