import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Pages that have their own DashboardNavbar — hide public Navbar on these
const DASHBOARD_PATHS = ["/student/dashboard", "/mentor/dashboard", "/admin/dashboard"];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Don't render on dashboard pages — they have their own navbar
  if (DASHBOARD_PATHS.includes(location.pathname)) return null;

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/">
          <h1 className="text-xl font-bold text-blue-600">Alif Mentorship Hub</h1>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex space-x-6 items-center">
          <Link to="/" className="text-gray-600 hover:text-blue-600 transition">Home</Link>
          <Link to="/about" className="text-gray-600 hover:text-blue-600 transition">About</Link>
          <Link to="/contact" className="text-gray-600 hover:text-blue-600 transition">Contact</Link>
          <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            Login
          </Link>
          <Link to="/signup" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
            Sign Up
          </Link>
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden z-50">
          <button
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((p) => !p)}
            className="focus:outline-none"
          >
            <div className="w-6 h-6 relative">
              <span className={`block absolute h-0.5 w-full bg-gray-700 rounded-full transition-all duration-300 ${menuOpen ? "rotate-45 top-3" : "top-2"}`} />
              <span className={`block absolute h-0.5 w-full bg-gray-700 rounded-full transition-all duration-300 ${menuOpen ? "opacity-0" : "top-2.5"}`} />
              <span className={`block absolute h-0.5 w-full bg-gray-700 rounded-full transition-all duration-300 ${menuOpen ? "-rotate-45 top-3" : "top-3.5"}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile slide-in menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              className="fixed top-0 right-0 w-64 h-full bg-white shadow-xl z-50"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="p-6 flex flex-col space-y-4">
                <Link to="/" className="text-gray-700 hover:text-blue-600" onClick={() => setMenuOpen(false)}>Home</Link>
                <Link to="/about" className="text-gray-700 hover:text-blue-600" onClick={() => setMenuOpen(false)}>About</Link>
                <Link to="/contact" className="text-gray-700 hover:text-blue-600" onClick={() => setMenuOpen(false)}>Contact</Link>
                <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-center" onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/signup" className="bg-green-600 text-white px-4 py-2 rounded-lg text-center" onClick={() => setMenuOpen(false)}>Sign Up</Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
