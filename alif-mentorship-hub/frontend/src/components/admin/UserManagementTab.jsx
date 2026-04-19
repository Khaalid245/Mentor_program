import { useState, useEffect } from "react";
import api from "../../services/axios";
import StudentsList from "./users/StudentsList";
import MentorsList from "./users/MentorsList";

const UserManagementTab = ({ description }) => {
  const [activeSubTab, setActiveSubTab] = useState("students");
  const [studentCount, setStudentCount] = useState(0);
  const [mentorCount, setMentorCount] = useState(0);

  useEffect(() => {
    // Fetch counts for both tabs
    Promise.all([
      api.get("admin/users/?role=student"),
      api.get("admin/users/?role=mentor")
    ]).then(([studentsRes, mentorsRes]) => {
      const students = Array.isArray(studentsRes.data) ? studentsRes.data : (studentsRes.data.results ?? []);
      const mentors = Array.isArray(mentorsRes.data) ? mentorsRes.data : (mentorsRes.data.results ?? []);
      setStudentCount(students.length);
      setMentorCount(mentors.length);
    }).catch(() => {});
  }, []);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {description && (
        <p className="text-sm text-gray-500 mb-6">{description}</p>
      )}

      {/* Sub-tab toggles */}
      <div className="flex gap-1 mb-6 bg-indigo-50 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveSubTab("students")}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
            activeSubTab === "students"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-indigo-600 hover:text-indigo-700"
          }`}
        >
          Students {studentCount > 0 && studentCount}
        </button>
        <button
          onClick={() => setActiveSubTab("mentors")}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
            activeSubTab === "mentors"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-indigo-600 hover:text-indigo-700"
          }`}
        >
          Mentors {mentorCount > 0 && mentorCount}
        </button>
      </div>

      {/* Active list */}
      {activeSubTab === "students" && <StudentsList />}
      {activeSubTab === "mentors" && <MentorsList />}
    </div>
  );
};

export default UserManagementTab;