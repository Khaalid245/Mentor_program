export default function ArticleView({ resource, onBack }) {
  const categoryColors = {
    scholarship: { bg: 'bg-purple-100', text: 'text-purple-700' },
    career: { bg: 'bg-blue-100', text: 'text-blue-700' },
    university: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    skill: { bg: 'bg-amber-100', text: 'text-amber-700' }
  };

  const colors = categoryColors[resource.category] || categoryColors.career;
  const publishedDate = new Date(resource.published_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-teal-700 hover:text-teal-800 active:scale-95 transition-transform"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-medium">Back to resources</span>
      </button>

      {/* Article card */}
      <article className="bg-white rounded-2xl p-6 md:p-8">
        {/* Category badge */}
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize mb-4 ${colors.bg} ${colors.text}`}>
          {resource.category}
        </span>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{resource.title}</h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-8 pb-6 border-b border-gray-200">
          {resource.author_username && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-xs font-semibold text-teal-700">
                {resource.author_username[0]?.toUpperCase()}
              </div>
              <span>{resource.author_username}</span>
            </div>
          )}
          <span>•</span>
          <span>{publishedDate}</span>
        </div>

        {/* Body */}
        <div className="prose prose-gray max-w-none">
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {resource.body}
          </div>
        </div>
      </article>
    </div>
  );
}
