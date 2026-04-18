const ReportsTab = () => (
  <div className="max-w-2xl mx-auto p-4 flex flex-col items-center justify-center min-h-96 text-center space-y-4">
    {/* Inline SVG flag — no external icon library */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-16 h-16 text-gray-300"
    >
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>

    <div>
      <h2 className="text-lg font-bold text-gray-700">No reports yet</h2>
      <p className="text-sm text-gray-400 mt-1 max-w-xs">
        When students or mentors flag content, it will appear here for review.
      </p>
    </div>
  </div>
);

export default ReportsTab;
