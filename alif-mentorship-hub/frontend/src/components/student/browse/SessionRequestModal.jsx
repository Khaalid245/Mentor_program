import { useState } from 'react';
import axios from 'axios';

export default function SessionRequestModal({ mentor, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    requested_time: '',
    goal: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        'http://localhost:8000/api/sessions/',
        {
          mentor_id: mentor.user_id,
          requested_time: formData.requested_time,
          goal: formData.goal
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStep(3);
      setTimeout(() => onSuccess(), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden">
        {step === 3 ? (
          // Celebration screen
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-teal-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request sent!</h2>
            <p className="text-gray-600">
              {mentor.username} will review your request soon. Check your sessions tab for updates.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Request session with {mentor.username}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress indicator */}
            <div className="px-6 py-4 flex items-center gap-2">
              <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-teal-600' : 'bg-gray-200'}`} />
              <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-teal-600' : 'bg-gray-200'}`} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 pb-6">
              {step === 1 ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred date and time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.requested_time}
                      onChange={(e) => setFormData({ ...formData, requested_time: e.target.value })}
                      required
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full h-12 px-4 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!formData.requested_time}
                    className="w-full h-12 bg-teal-600 text-white rounded-2xl font-semibold hover:bg-teal-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What do you want to discuss?
                    </label>
                    <textarea
                      value={formData.goal}
                      onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                      required
                      rows={4}
                      placeholder="E.g., Career guidance in software engineering, university application advice..."
                      className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    />
                  </div>
                  {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">
                      {error}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 h-12 border border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 active:scale-95 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !formData.goal}
                      className="flex-1 h-12 bg-teal-600 text-white rounded-2xl font-semibold hover:bg-teal-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Sending...' : 'Send request'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
