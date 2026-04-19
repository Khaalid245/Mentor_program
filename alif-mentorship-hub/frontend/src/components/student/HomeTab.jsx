import { useEffect, useState } from "react";
import api from "../../services/axios";
import WelcomeCard from "./home/WelcomeCard";
import StatsRow from "./home/StatsRow";
import UpcomingSessionBanner from "./home/UpcomingSessionBanner";
import QuickActions from "./home/QuickActions";
import RecommendedMentors from "./home/RecommendedMentors";
import LatestResources from "./home/LatestResources";
import MentorDetailView from "./browse/MentorDetailView";

const HomeTab = ({ onSwitchTab }) => {
  const username = localStorage.getItem("username") || "Student";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [acceptedSessions, setAcceptedSessions] = useState([]);
  const [pendingSessions, setPendingSessions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [resources, setResources] = useState([]);
  
  const [selectedMentor, setSelectedMentor] = useState(null);

  useEffect(() => {
    // Fetch 4 endpoints in parallel using Promise.all
    Promise.all([
      api.get("sessions/?status=accepted"),
      api.get("sessions/?status=pending"),
      api.get("sessions/?status=completed"),
      api.get("mentors/")
    ])
      .then(([acceptedRes, pendingRes, completedRes, mentorsRes]) => {
        setAcceptedSessions(Array.isArray(acceptedRes.data) ? acceptedRes.data : (acceptedRes.data.results || []));
        setPendingSessions(Array.isArray(pendingRes.data) ? pendingRes.data : (pendingRes.data.results || []));
        setCompletedSessions(Array.isArray(completedRes.data) ? completedRes.data : (completedRes.data.results || []));
        setMentors(Array.isArray(mentorsRes.data) ? mentorsRes.data : (mentorsRes.data.results || []));
      })
      .catch(() => setError("Failed to load home feed."))
      .finally(() => setLoading(false));

    // Fetch resources separately (can be lazy)
    api.get("resources/")
      .then((r) => setResources(Array.isArray(r.data) ? r.data : (r.data.results || [])))
      .catch(() => {});
  }, []);

  // Get next upcoming session (soonest accepted session)
  const upcomingSession = acceptedSessions.length > 0
    ? acceptedSessions.sort((a, b) => new Date(a.requested_time) - new Date(b.requested_time))[0]
    : null;

  if (selectedMentor) {
    return (
      <MentorDetailView 
        mentor={selectedMentor} 
        onBack={() => setSelectedMentor(null)} 
        onSwitchTab={onSwitchTab}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {loading ? (
        <>
          <div className="h-32 rounded-2xl animate-pulse" style={{ backgroundColor: "#CCFBF1" }} />
          <div className="h-24 rounded-2xl animate-pulse" style={{ backgroundColor: "#CCFBF1" }} />
          <div className="h-40 rounded-2xl animate-pulse" style={{ backgroundColor: "#CCFBF1" }} />
        </>
      ) : error ? (
        <p className="text-sm text-center" style={{ color: "#DC2626" }}>{error}</p>
      ) : (
        <>
          <WelcomeCard 
            username={username}
            completedCount={completedSessions.length}
            pendingCount={pendingSessions.length}
          />

          <StatsRow 
            completedCount={completedSessions.length}
            pendingCount={pendingSessions.length}
            mentorsCount={mentors.length}
          />

          <UpcomingSessionBanner 
            session={upcomingSession}
            pendingCount={pendingSessions.length}
            onSwitchTab={onSwitchTab}
          />

          <QuickActions onSwitchTab={onSwitchTab} />

          <RecommendedMentors 
            mentors={mentors}
            onSelectMentor={setSelectedMentor}
            onSwitchTab={onSwitchTab}
          />

          <LatestResources 
            resources={resources}
            onSwitchTab={onSwitchTab}
          />
        </>
      )}
    </div>
  );
};

export default HomeTab;
