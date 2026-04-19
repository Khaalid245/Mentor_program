export default function ResourceCard({ resource, onClick }) {
  const categoryColors = {
    scholarship: { bg: 'bg-purple-100', text: 'text-purple-700', square: 'bg-purple-500' },
    career: { bg: 'bg-blue-100', text: 'text-blue-700', square: 'bg-blue-500' },
    university: { bg: 'bg-emerald-100', text: 'text-emerald-700', square: 'bg-emerald-500' },
    skill: { bg: 'bg-amber-100', text: 'text-amber-700', square: 'bg-amber-500' }
  };

  const colors = categoryColors[resource.category] || categoryColors.career;
  const excerpt = resource.body?.substring(0, 120) + (resource.body?.length > 120 ? '...' : '');
  const publishedDate = new Date(resource.published_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-gray-200 p-4 hover:border-teal-300 active:scale-[0.98] transition-all text-left"
    >
      <div className="flex gap-4">
        {/* Color square */}
        <div className={`w-16 h-16 rounded-xl ${colors.square} flex-shrink-0`} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${colors.bg} ${colors.text}`}>
              {resource.category}
            </span>
            <span className="text-xs text-gray-500">{publishedDate}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{resource.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{excerpt}</p>
          {resource.author_username && (
            <p className="text-xs text-gray-500 mt-2">By {resource.author_username}</p>
          )}
        </div>

        {/* Arrow */}
        <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
