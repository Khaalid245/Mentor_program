import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/axios";

const ROLE_OPTIONS = [
  {
    value: "student",
    label: "Student",
    icon: "👨🎓",
    description: "I am a high school student seeking mentorship",
    color: "border-blue-400 bg-blue-50",
    badge: "bg-blue-100 text-blue-800",
  },
  {
    value: "mentor",
    label: "Mentor",
    icon: "👩🏫",
    description: "I am a mentor guiding students",
    color: "border-green-400 bg-green-50",
    badge: "bg-green-100 text-green-800",
  },
  {
    value: "admin",
    label: "Admin",
    icon: "🛡️",
    description: "I manage the platform",
    color: "border-purple-400 bg-purple-50",
    badge: "bg-purple-100 text-purple-800",
  },
];

const Login = () => {
  const [selectedRole, setSelectedRole] = useState("");
  const [form, setForm] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [detectedRole, setDetectedRole] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError("");
    setForm({ username: "", password: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedRole) {
      setError("Please select your account type before signing in.");
      return;
    }

    setIsLoading(true);

    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_role");
      localStorage.removeItem("username");

      const res = await api.post("auth/login/", form);
      const { access, refresh, role, username } = res.data;

      // ── Security check — role must match what user selected ──
      if (role !== selectedRole) {
        const selected = ROLE_OPTIONS.find((r) => r.value === selectedRole)?.label;
        const actual = ROLE_OPTIONS.find((r) => r.value === role)?.label;
        setError(
          `This account is registered as "${actual}", not "${selected}". Please select the correct account type.`
        );
        return;
      }

      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("user_role", role);
      localStorage.setItem("username", username);

      window.dispatchEvent(new CustomEvent("loginSuccess"));

      // Show success banner briefly then redirect
      setDetectedRole(role);
      setTimeout(() => {
        if (role === "mentor") navigate("/mentor/dashboard");
        else if (role === "admin") navigate("/admin/dashboard");
        else navigate("/student/dashboard");
      }, 1000);

    } catch (err) {
      console.error("Login error:", err.response?.data || err);
      setError("Invalid username or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const selected = ROLE_OPTIONS.find((r) => r.value === selectedRole);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-blue-600 mb-2">Welcome Back</h1>
          <p className="text-gray-500 text-sm">Select your account type to sign in</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">

          {/* ── Step 1: Role selector ── */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Step 1 — Who are you?
            </p>
            <div className="grid grid-cols-3 gap-2">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleRoleSelect(option.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                    selectedRole === option.value
                      ? `${option.color} border-opacity-100 shadow-sm scale-105`
                      : "border-gray-200 bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    selectedRole === option.value ? option.badge : "text-gray-600"
                  }`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected role description */}
            <AnimatePresence>
              {selected && (
                <motion.p
                  key={selected.value}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-2 text-xs text-gray-500 text-center"
                >
                  {selected.description}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* ── Step 2: Credentials — only shown after role is selected ── */}
          <AnimatePresence>
            {selectedRole && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Step 2 — Enter your credentials
                </p>

                {/* Success banner */}
                {detectedRole && (
                  <div className={`mb-4 p-3 rounded-xl border flex items-center gap-3 ${selected?.color}`}>
                    <span className="text-xl">{selected?.icon}</span>
                    <div>
                      <p className="font-bold text-sm">Logged in as {selected?.label}</p>
                      <p className="text-xs">Redirecting...</p>
                    </div>
                  </div>
                )}

                {/* Error banner */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      placeholder={`Enter your ${selected?.label.toLowerCase()} username`}
                      value={form.username}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !!detectedRole}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-all duration-200 ${
                      selectedRole === "student"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        : selectedRole === "mentor"
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        : "bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                    } ${isLoading || detectedRole ? "opacity-50 cursor-not-allowed" : "shadow-lg hover:shadow-xl"}`}
                  >
                    {isLoading
                      ? "Signing in..."
                      : `Sign in as ${selected?.label}`}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Signup link */}
          <p className="text-center text-sm text-gray-600 pt-2 border-t border-gray-100">
            New student?{" "}
            <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-800">
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
