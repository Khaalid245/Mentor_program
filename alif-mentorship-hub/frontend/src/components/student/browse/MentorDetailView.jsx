import { useState } from 'react';
import SessionRequestModal from './SessionRequestModal';

export default function MentorDetailView({ mentor, onBack, onRequestSuccess }) {
  const [showRequestModal, setShowRequestModal] = useState(false);

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
        <span className="font-medium">Back to browse</span>
      </button>

      {/* Hero card */}
      <div className="bg-white rounded-2xl overflow-hidden">
        {/* Gradient header */}
        <div className="h-32 bg-gradient-to-br from-teal-500 to-emerald-500" />
        
        {/* Content */}
        <div className="px-6 pb-6">
          {/* Avatar overlapping header */}
          <div className="flex items-end gap-4 -mt-12 mb-4">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-3xl font-bold text-teal-700 ring-4 ring-white">
              {mentor.username?.[0]?.toUpperCase() || 'M'}
            </div>
            {mentor.is_verified && (
              <div className="mb-2 flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </div>
            )}
          </div>

          {/* Name and title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{mentor.username}</h1>
          <p className="text-gray-600 mb-4">
            {mentor.university} {mentor.graduation_year && `• Class of ${mentor.graduation_year}`}
          </p>

          {/* Field badge */}
          {mentor.field_of_study && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm font-medium mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {mentor.field_of_study}
            </div>
          )}

          {/* Rating */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${i < Math.floor(mentor.average_rating || 0) ? 'text-amber-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {mentor.average_rating ? mentor.average_rating.toFixed(1) : 'New'}
              {mentor.review_count > 0 && ` • ${mentor.review_count} ${mentor.review_count === 1 ? 'review' : 'reviews'}`}
            </span>
          </div>

          {/* Bio */}
          {mentor.bio && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">About</h2>
              <p className="text-gray-700 leading-relaxed">{mentor.bio}</p>
            </div>
          )}

          {/* LinkedIn */}
          {mentor.linkedin_url && (
            <a
              href={mentor.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-teal-700 hover:text-teal-800 text-sm font-medium mb-6"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
              View LinkedIn Profile
            </a>
          )}

          {/* Availability indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`w-2 h-2 rounded-full ${mentor.availability ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-600">
              {mentor.availability ? 'Available for sessions' : 'Currently unavailable'}
            </span>
          </div>

          {/* Request button */}
          <button
            onClick={() => setShowRequestModal(true)}
            disabled={!mentor.availability}
            className="w-full h-12 bg-teal-600 text-white rounded-2xl font-semibold hover:bg-teal-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Request mentorship session
          </button>
        </div>
      </div>

      {/* Session request modal */}
      {showRequestModal && (
        <SessionRequestModal
          mentor={mentor}
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => {
            setShowRequestModal(false);
            onRequestSuccess();
            onBack();
          }}
        />
      )}
    </div>
  );
}
