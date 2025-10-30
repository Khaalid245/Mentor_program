import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current page is dashboard for Sign Out button
  const isDashboardPage = ["/dashboard", "/student/", "/mentor/"].some((path) =>
    location.pathname.includes(path)
  );

  // Keep track of auth state from localStorage
  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem("access_token"));
    };
    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("loginSuccess", checkAuth);
    window.addEventListener("logoutSuccess", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("loginSuccess", checkAuth);
      window.removeEventListener("logoutSuccess", checkAuth);
    };
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsAuthenticated(false);
    window.dispatchEvent(new Event("logoutSuccess"));
    navigate("/");
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link to="/">
          <h1 className="text-xl font-bold text-blue-600">
            Alif Mentorship Hub
          </h1>
        </Link>

        {/* Desktop Links - always show Login and Signup for easy access */}
        <div className="hidden md:flex space-x-8 items-center">
          <Link to="/" className="hover:text-blue-600 transition">
            Home
          </Link>
          <Link to="/about" className="hover:text-blue-600 transition">
            About
          </Link>
          <Link to="/contact" className="hover:text-blue-600 transition">
            Contact
          </Link>
          {/* Always show Login and Signup regardless of auth */}
          <Link
            to="/login"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Signup
          </Link>
          {/* Show Sign Out button if user is on dashboard */}
          {isDashboardPage && isAuthenticated && (
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Sign Out
            </button>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="md:hidden z-50">
          <button
            aria-controls="mobile-menu"
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="focus:outline-none"
          >
            {/* Hamburger icon with animated lines */}
            <div className="w-6 h-6 relative transition-transform duration-300">
              {/* Top line */}
              <span
                className={`block absolute h-0.5 w-full bg-gray-700 rounded-full transition-all duration-300 ${
                  menuOpen ? "rotate-45 top-3" : "top-2"
                }`}
              ></span>
              {/* Middle line */}
              <span
                className={`block absolute h-0.5 w-full bg-gray-700 rounded-full transition-all duration-300 ${
                  menuOpen ? "opacity-0" : "top-2.5"
                }`}
              ></span>
              {/* Bottom line */}
              <span
                className={`block absolute h-0.5 w-full bg-gray-700 rounded-full transition-all duration-300 ${
                  menuOpen ? "-rotate-45 top-3" : "top-3.5"
                }`}
              ></span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu overlay + slide-in panel */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMenuOpen(false)}
            />

            {/* Slide-in menu panel */}
            <motion.div
              className="fixed top-0 right-0 w-64 sm:w-80 h-full bg-white shadow-xl z-50"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Menu content */}
              <div className="p-6 flex flex-col space-y-4 h-full overflow-y-auto">
                {/* Links */}
                <Link
                  to="/"
                  className="text-gray-700 hover:text-blue-600 transition"
                  onClick={() => setMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/about"
                  className="text-gray-700 hover:text-blue-600 transition"
                  onClick={() => setMenuOpen(false)}
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  className="text-gray-700 hover:text-blue-600 transition"
                  onClick={() => setMenuOpen(false)}
                >
                  Contact
                </Link>
                {/* Always show Login and Signup for mobile */}
                <Link
                  to="/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  onClick={() => {
                    setMenuOpen(false);
                  }}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  onClick={() => {
                    setMenuOpen(false);
                  }}
                >
                  Signup
                </Link>
                {/* Sign Out button for mobile if on dashboard */}
                {isDashboardPage && isAuthenticated && (
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMenuOpen(false);
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
