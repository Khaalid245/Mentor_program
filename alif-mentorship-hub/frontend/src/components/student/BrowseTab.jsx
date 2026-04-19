import { useState, useEffect } from 'react';
import axios from 'axios';
import MentorCard from './browse/MentorCard';
import MentorDetailView from './browse/MentorDetailView';

export default function BrowseTab() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMentor, setSelectedMentor] = useState(null);

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:8000/api/mentors/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMentors(res.data);
    } catch (err) {
      console.error('Failed to fetch mentors:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMentors = mentors.filter(m => {
    const q = searchQuery.toLowerCase();
    return m.username?.toLowerCase().includes(q) ||
           m.field_of_study?.toLowerCase().includes(q) ||
           m.university?.toLowerCase().includes(q);
  });

  if (selectedMentor) {
    return (
      <MentorDetailView
        mentor={selectedMentor}
        onBack={() => setSelectedMentor(null)}
        onRequestSuccess={fetchMentors}
      />
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Search */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search mentors by name, field, or university..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-4 rounded-2xl border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-600">
        {filteredMentors.length} {filteredMentors.length === 1 ? 'mentor' : 'mentors'} available
      </p>

      {/* Mentors grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading mentors...</div>
      ) : filteredMentors.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchQuery ? 'No mentors match your search' : 'No mentors available'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMentors.map(mentor => (
            <MentorCard
              key={mentor.id}
              mentor={mentor}
              onClick={() => setSelectedMentor(mentor)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
