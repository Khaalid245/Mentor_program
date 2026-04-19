import { useState, useEffect } from 'react';
import axios from 'axios';
import ResourceCard from './resources/ResourceCard';
import ArticleView from './resources/ArticleView';

export default function ResourcesTab() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedResource, setSelectedResource] = useState(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:8000/api/resources/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResources(res.data);
    } catch (err) {
      console.error('Failed to fetch resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'scholarship', 'career', 'university', 'skill'];
  const filteredResources = categoryFilter === 'all'
    ? resources
    : resources.filter(r => r.category === categoryFilter);

  if (selectedResource) {
    return (
      <ArticleView
        resource={selectedResource}
        onBack={() => setSelectedResource(null)}
      />
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all active:scale-95 capitalize ${
              categoryFilter === cat
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Resources list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading resources...</div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-gray-600">
            {categoryFilter === 'all' ? 'No resources available' : `No ${categoryFilter} resources`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredResources.map(resource => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onClick={() => setSelectedResource(resource)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
