import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import Sidebar from "../components/student/layout/Sidebar";
import BottomNav from "../components/student/layout/BottomNav";
import PageHeader from "../components/student/layout/PageHeader";
import HomeTab from "../components/student/HomeTab";
import BrowseTab from "../components/student/BrowseTab";
import SessionsTab from "../components/student/SessionsTab";
import ResourcesTab from "../components/student/ResourcesTab";

const StudentDashboard = () => {
  const role = localStorage.getItem("user_role");
  
  if (role !== "student") return <Navigate to="/login" replace />;

  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    const handleSwitchTab = (e) => setActiveTab(e.detail);
    window.addEventListener('switchTab', handleSwitchTab);
    return () => window.removeEventListener('switchTab', handleSwitchTab);
  }, []);

  const tabTitles = {
    home: "Home",
    browse: "Browse mentors",
    sessions: "My sessions",
    resources: "Resources"
  };

  return (
    <div 
      className="min-h-screen flex"
      style={{ 
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        backgroundColor: "#F0FDF9"
      }}
    >
      {/* Sidebar - desktop only */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:ml-64">
        <PageHeader title={tabTitles[activeTab]} />
        
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          {activeTab === "home" && <HomeTab onSwitchTab={setActiveTab} />}
          {activeTab === "browse" && <BrowseTab />}
          {activeTab === "sessions" && <SessionsTab onSwitchTab={setActiveTab} />}
          {activeTab === "resources" && <ResourcesTab />}
        </main>
      </div>

      {/* Bottom nav - mobile only */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default StudentDashboard;
