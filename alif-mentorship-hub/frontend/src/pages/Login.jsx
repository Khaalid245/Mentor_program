import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/axios";

const Login = () => {
  const [role, setRole] = useState("student");
  const [form, setForm] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Handle switching between Student / Mentor
  const handleRoleChange = (selectedRole) => setRole(selectedRole);

  // Handle input changes
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Handle login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Clear any old tokens before attempting login
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      // Make login request
      const res = await api.post("auth/login/", form);

      const { access, refresh } = res.data;

      // Save new tokens
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);

      // Let other components know user logged in
      window.dispatchEvent(new CustomEvent("loginSuccess"));

      // Redirect based on selected role
      if (role === "student") navigate("/student/dashboard");
      else if (role === "mentor") navigate("/mentor/dashboard");
    } catch (err) {
      console.error("Login error:", err.response?.data || err);
      alert("Invalid username or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-blue-600 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Role Switch */}
          <div className="mb-8 bg-gray-100 p-1 rounded-xl flex">
            <button
              onClick={() => handleRoleChange("student")}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                role === "student"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              👨‍🎓 Student
            </button>
            <button
              onClick={() => handleRoleChange("mentor")}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                role === "mentor"
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              👩‍🏫 Mentor
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Username or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  id="username"
                  placeholder="Enter your username"
                  onChange={handleChange}
                  value={form.username}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
                <span className="absolute right-3 top-3 text-gray-400">📧</span>
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Enter your password"
                  onChange={handleChange}
                  value={form.password}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
                <span className="absolute right-3 top-3 text-gray-400">🔒</span>
              </div>
            </div>

            {/* Remember & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-600"
                >
                  Remember me
                </label>
              </div>
              <a
                href="#"
                className="text-sm font-semibold text-blue-600 hover:text-blue-800"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${
                role === "student"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>
          </div>

          {/* Social Login */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              <span className="mr-2">🔵</span> Google
            </button>
            <button className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              <span className="mr-2">📘</span> Facebook
            </button>
          </div>

          {/* Signup Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-blue-600 hover:text-blue-800"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500">
          By signing in, you agree to our{" "}
          <a href="#" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
