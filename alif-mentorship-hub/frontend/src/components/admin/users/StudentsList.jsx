import { useState, useEffect, useCallback } from "react";
import api from "../../../services/axios";
import UserDetailPanel from "./UserDetailPanel";

const StatusBadge = ({ user }) => {
  if (user.is_deactivated) return <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200">Deactivated</span>;
  if (user.is_suspended) return <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">Suspended</span>;
  return <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">Active</span>;
};

const StudentCard = ({ student, onClick }) => {
  const joinedDate = student.date_joined ? new Date(student.date_joined).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "—";

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-indigo-100 p-4 cursor-pointer hover:border-indigo-200 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-indigo-900 truncate">{student.username}</p>
          <p className="text-xs text-gray-400 truncate">{student.email || "—"}</p>
          {student.phone && <p className="text-xs text-gray-400">{student.phone}</p>}
          <p className="text-xs text-gray-400">Joined {joinedDate}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge user={student} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View profile
          </button>
        </div>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-indigo-50 rounded-2xl h-20 animate-pulse" />
);

const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchStudents = useCallback((search = "", status = "all") => {
    setLoading(true);
    const params = new URLSearchParams({ role: "student" });
    if (search) params.append("search", search);
    if (status !== "all") params.append("status", status);

    api.get(`admin/users/?${params}`)
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : (r.data.results ?? []);
        setStudents(data);
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      fetchStudents(value, statusFilter);
    }, 400);
    setSearchTimeout(timeout);
  };

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    fetchStudents(searchQuery, status);
  };

  const handleUserStatusUpdate = (updatedUser) => {
    setStudents(prev => prev.map(s => s.id === updatedUser.id ? updatedUser : s));
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Search and filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by name or email"
            className="w-full border border-indigo-100 rounded-xl px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="border border-indigo-100 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </div>

      {/* Students list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 font-medium">No students found.</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {students.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              onClick={() => setSelectedUserId(student.id)}
            />
          ))}
        </div>
      )}

      {/* User detail panel */}
      {selectedUserId && (
        <UserDetailPanel
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onStatusChange={handleUserStatusUpdate}
        />
      )}
    </div>
  );
};

export default StudentsList;