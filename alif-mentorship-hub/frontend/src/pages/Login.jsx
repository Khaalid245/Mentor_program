import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/axios";

const ROLE_OPTIONS = [
  {
    value: "student",
    label: "Student",
    icon: "👨🎓",
    description: "I am a high school student seeking mentorship",
    selectedStyle: "border-blue-500 bg-blue-50",
    btnStyle: "bg-blue-600 hover:bg-blue-700",
  },
  {
    value: "mentor",
    label: "Mentor",
    icon: "👩🏫",
    description: "I am a mentor guiding students",
    selectedStyle: "border-green-500 bg-green-50",
    btnStyle: "bg-green-600 hover:bg-green-700",
  },
  {
    value: "admin",
    label: "Admin",
    icon: "🛡️",
    description: "I manage the platform",
    selectedStyle: "border-purple-500 bg-purple-50",
    btnStyle: "bg-purple-600 hover:bg-purple-700",
  },
];

const REDIRECT = {
  student: "/student/dashboard",
  mentor:  "/mentor/dashboard",
  admin:   "/admin/dashboard",
};

const Login = () => {
  const [selectedRole, setSelectedRole] = useState("");
  const [form, setForm]     = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]   = useState("");
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError("");
    setForm({ username: "", password: "" });
  };

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole) {
      setError("Please select your account type first.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const res = await api.post("auth/login/", form);
      const { access, refresh, role, username } = res.data;

      // Security check — role must match what user selected
      if (role !== selectedRole) {
        const selectedLabel = ROLE_OPTIONS.find((r) => r.value === selectedRole)?.label;
        const actualLabel   = ROLE_OPTIONS.find((r) => r.value === role)?.label;
        setError(`This is a "${actualLabel}" account. Please select "${actualLabel}" and try again.`);
        setIsLoading(false);
        return;
      }

      // Save to localStorage
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("user_role", role);
      localStorage.setItem("username", username);

      // Navigate immediately — no delay, no useEffect
      navigate(REDIRECT[role] || "/student/dashboard");

    } catch (err) {
      console.error("Login error:", err.response?.data || err);
      setError("Invalid username or password. Please try again.");
      setIsLoading(false);
    }
  };

  const selected = ROLE_OPTIONS.find((r) => r.value === selectedRole);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-blue-600 mb-2">Welcome Back</h1>
          <p className="text-gray-500 text-sm">Select your account type to sign in</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">

          {/* Step 1 — Role selector */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Step 1 — Who are you?
            </p>
            <div className="grid grid-cols-3 gap-3">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleRoleSelect(option.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    selectedRole === option.value
                      ? `${option.selectedStyle} shadow-sm`
                      : "border-gray-200 bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <span className="text-3xl">{option.icon}</span>
                  <span className="text-xs font-bold text-gray-700">{option.label}</span>
                </button>
              ))}
            </div>
            {selected && (
              <p className="mt-2 text-xs text-gray-500 text-center">{selected.description}</p>
            )}
          </div>

          {/* Step 2 — Credentials */}
          {selectedRole && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Step 2 — Enter your credentials
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  ⚠️ {error}
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
                    value={form.username}
                    onChange={handleChange}
                    placeholder={`Your ${selected.label.toLowerCase()} username`}
                    required
                    autoComplete="username"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Your password"
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 rounded-xl font-bold text-white transition-all ${selected.btnStyle} ${
                    isLoading ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? "Signing in..." : `Sign in as ${selected.label}`}
                </button>
              </form>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 pt-2 border-t border-gray-100">
            New student?{" "}
            <Link to="/signup" className="font-semibold text-blue-600 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
