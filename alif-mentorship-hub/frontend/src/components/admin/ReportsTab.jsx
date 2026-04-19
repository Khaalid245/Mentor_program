import { useState, useEffect } from "react";
import api from "../../services/axios";
import ReportCard from "./reports/ReportCard";
import SessionDetailPanel from "./sessions/SessionDetailPanel";

const ShieldIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const SkeletonCard = () => (
  <div className="bg-indigo-50 rounded-2xl h-48 animate-pulse" />
);

const ReportsTab = ({ description }) => {
  const [activeTab, setActiveTab] = useState("open");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  useEffect(() => {
    fetchReports(activeTab);
  }, [activeTab]);

  const fetchReports = async (status) => {
    setLoading(true);
    try {
      const params = status !== "all" ? `?status=${status}` : "";
      const response = await api.get(`admin/reports/${params}`);
      const data = Array.isArray(response.data) ? response.data : (response.data.results ?? []);
      setReports(data);
    } catch (error) {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReportUpdate = (updatedReport) => {
    setReports(prev => prev.filter(r => r.id !== updatedReport.id));
  };

  const handleViewSession = (sessionId) => {
    setSelectedSessionId(sessionId);
  };

  // Calculate counts
  const openCount = reports.filter(r => r.status === "open").length;
  const resolvedCount = reports.filter(r => r.status === "resolved").length;
  const dismissedCount = reports.filter(r => r.status === "dismissed").length;

  const getEmptyState = () => {
    if (activeTab === "open") {
      return (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <ShieldIcon />
          </div>
          <p className="text-gray-500 font-medium">No open reports</p>
          <p className="text-sm text-gray-400 mt-1">All clear. No reports need your attention right now.</p>
        </div>
      );
    }
    if (activeTab === "resolved") {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 font-medium">No resolved reports yet.</p>
        </div>
      );
    }
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 font-medium">No dismissed reports yet.</p>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {description && (
        <p className="text-sm text-gray-500 mb-6">{description}</p>
      )}

      {/* Tab toggles */}
      <div className="flex gap-1 mb-6 bg-indigo-50 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("open")}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
            activeTab === "open"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-indigo-600 hover:text-indigo-700"
          }`}
        >
          Open {openCount > 0 && openCount}
        </button>
        <button
          onClick={() => setActiveTab("resolved")}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
            activeTab === "resolved"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-indigo-600 hover:text-indigo-700"
          }`}
        >
          Resolved {resolvedCount > 0 && resolvedCount}
        </button>
        <button
          onClick={() => setActiveTab("dismissed")}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
            activeTab === "dismissed"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-indigo-600 hover:text-indigo-700"
          }`}
        >
          Dismissed {dismissedCount > 0 && dismissedCount}
        </button>
      </div>

      {/* Reports list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : reports.length === 0 ? (
        getEmptyState()
      ) : (
        <div className="space-y-4">
          {reports.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              onUpdate={handleReportUpdate}
              onViewSession={handleViewSession}
            />
          ))}
        </div>
      )}

      {/* Session detail panel */}
      {selectedSessionId && (
        <SessionDetailPanel
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
          onSessionUpdate={() => {}}
        />
      )}
    </div>
  );
};

export default ReportsTab;