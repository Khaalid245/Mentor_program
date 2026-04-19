import { useState, useEffect } from 'react';
import axios from 'axios';
import SessionCard from './sessions/SessionCard';
import ReviewModal from './sessions/ReviewModal';
import ReportModal from './sessions/ReportModal';

export default function SessionsTab() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState(null);
  const [modalType, setModalType] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:8000/api/sessions/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (sessionId) => {
    if (!confirm('Cancel this session request?')) return;
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `http://localhost:8000/api/sessions/${sessionId}/cancel/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel session');
    }
  };

  const filteredSessions = sessions.filter(s => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  const counts = {
    all: sessions.length,
    pending: sessions.filter(s => s.status === 'pending').length,
    accepted: sessions.filter(s => s.status === 'accepted').length,
    completed: sessions.filter(s => s.status === 'completed').length,
    cancelled: sessions.filter(s => s.status === 'cancelled').length,
    declined: sessions.filter(s => s.status === 'declined').length
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'accepted', label: 'Upcoming' },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled' },
          { key: 'declined', label: 'Declined' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all active:scale-95 ${
              filter === key
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label} {counts[key] > 0 && `(${counts[key]})`}
          </button>
        ))}
      </div>

      {/* Sessions list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading sessions...</div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">
            {filter === 'all' ? 'No sessions yet' : `No ${filter} sessions`}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'browse' }))}
              className="px-6 py-2 bg-teal-600 text-white rounded-full font-medium hover:bg-teal-700 active:scale-95 transition-all"
            >
              Browse mentors
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              onCancel={handleCancel}
              onReview={(s) => {
                setSelectedSession(s);
                setModalType('review');
              }}
              onReport={(s) => {
                setSelectedSession(s);
                setModalType('report');
              }}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {modalType === 'review' && selectedSession && (
        <ReviewModal
          session={selectedSession}
          onClose={() => {
            setModalType(null);
            setSelectedSession(null);
          }}
          onSuccess={() => {
            setModalType(null);
            setSelectedSession(null);
            fetchSessions();
          }}
        />
      )}
      {modalType === 'report' && selectedSession && (
        <ReportModal
          session={selectedSession}
          onClose={() => {
            setModalType(null);
            setSelectedSession(null);
          }}
          onSuccess={() => {
            setModalType(null);
            setSelectedSession(null);
            fetchSessions();
          }}
        />
      )}
    </div>
  );
}
