import { useState } from 'react';
import axios from 'axios';

export default function ReportModal({ session, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const reasons = [
    'Inappropriate behavior',
    'No-show',
    'Unprofessional conduct',
    'Harassment',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (details.trim().length < 10) {
      setError('Please provide at least 10 characters of detail');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `http://localhost:8000/api/sessions/${session.id}/report/`,
        { reason, details },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmitted(true);
      setTimeout(() => onSuccess(), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden">
        {submitted ? (
          // Confirmation screen
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Report submitted</h2>
            <p className="text-gray-600">Our team will review your report and take appropriate action.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Report issue</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Session info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-sm font-semibold text-teal-700">
                  {session.mentor_username?.[0]?.toUpperCase() || 'M'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{session.mentor_username}</p>
                  <p className="text-sm text-gray-600">{new Date(session.requested_time).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Reason selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What went wrong?
                </label>
                <div className="space-y-2">
                  {reasons.map((r) => (
                    <label
                      key={r}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        reason === r
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r}
                        checked={reason === r}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-4 h-4 text-red-600"
                      />
                      <span className="text-sm font-medium text-gray-900">{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please provide details (minimum 10 characters)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  required
                  rows={4}
                  placeholder="Describe what happened..."
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {details.length}/10 characters minimum
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || !reason || details.trim().length < 10}
                className="w-full h-12 bg-red-600 text-white rounded-2xl font-semibold hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit report'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
