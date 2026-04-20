import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ConfigProvider } from "./hooks/useConfig.js";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import StudentDashboard from "./pages/StudentDashboard";
import MentorDashboard from "./pages/MentorDashboard";
import AdminDashboard from "./pages/AdminDashboard";

const DASHBOARD_PATHS = ["/student/dashboard", "/mentor/dashboard", "/admin/dashboard"];

const Layout = ({ children }) => {
  const { pathname } = useLocation();
  const isDashboard = DASHBOARD_PATHS.some((p) => pathname.startsWith(p));
  return (
    <>
      {!isDashboard && <Navbar />}
      {children}
      {!isDashboard && <Footer />}
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <ConfigProvider>
      <Router basename="/">
        <Layout>
          <Routes>
            {/* Public */}
            <Route path="/"        element={<Navigate to="/login" replace />} />
            <Route path="/login"   element={<Login />} />
            <Route path="/signup"  element={<Signup />} />
            <Route path="/about"   element={<About />} />
            <Route path="/contact" element={<Contact />} />

            {/* Protected */}
            <Route path="/student/dashboard" element={
              <ProtectedRoute role="student">
                <ErrorBoundary><StudentDashboard /></ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/mentor/dashboard" element={
              <ProtectedRoute role="mentor">
                <ErrorBoundary><MentorDashboard /></ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute role="admin">
                <ErrorBoundary><AdminDashboard /></ErrorBoundary>
              </ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Layout>
      </Router>
    </ConfigProvider>
  </ErrorBoundary>
);

export default App;
