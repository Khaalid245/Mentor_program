import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const DashboardNavbar = ({ userType, userName }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      const token = localStorage.getItem("access_token");
      const isAuth = !!token;
      setIsAuthenticated(isAuth);
    };

    // Initial check
    checkAuth();

    // Listen for logout events
    const handleLogout = () => {
      checkAuth();
    };

    window.addEventListener('logoutSuccess', handleLogout);

    return () => {
      window.removeEventListener('logoutSuccess', handleLogout);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('logoutSuccess'));
    
    navigate("/");
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  if (!isAuthenticated) {
    return null; // Don't show if not authenticated
  }

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 fixed w-full top-0 left-0 z-50">
      <div className="container mx-auto flex justify-between items-center p-4">
        {/* Logo and Back Button */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToHome}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Home
          </button>
          <h1 className="text-xl font-bold text-blue-600">Alif Mentorship Hub</h1>
        </div>

        {/* User Info and Logout */}
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{userName}</span>
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              {userType === 'student' ? 'Student' : 'Mentor'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;
