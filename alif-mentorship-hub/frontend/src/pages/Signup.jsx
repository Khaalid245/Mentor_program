import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/axios";

const ROLE_REDIRECT = {
  student: "/student/dashboard",
  mentor:  "/mentor/dashboard",
};

const Signup = () => {
  const [form, setForm] = useState({
    username: "", phone: "", password: "", confirm_password: "", role: "student",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const navigate = useNavigate();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    if (!form.username.trim() || !form.phone.trim() || !form.password || !form.confirm_password)
      return "All fields are required.";
    if (form.phone.replace(/\D/g, "").length < 9)
      return "Phone number must be at least 9 digits.";
    if (form.password !== form.confirm_password)
      return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError("");
    try {
      // Register
      await api.post("auth/register/", {
        username: form.username,
        phone:    form.phone,
        password: form.password,
        password2: form.confirm_password,
        role:     form.role,
      });

      // Auto-login
      const loginRes = await api.post("auth/login/", {
        username: form.username,
        password: form.password,
      });
      const { access, refresh, role, username } = loginRes.data;
      localStorage.setItem("access_token",  access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("user_role",     role);
      localStorage.setItem("username",      username);

      navigate(ROLE_REDIRECT[role] || "/login");
    } catch (err) {
      const data = err.response?.data;
      if (data?.username)  setError(`Username: ${data.username[0]}`);
      else if (data?.phone) setError(`Phone: ${data.phone[0]}`);
      else if (data?.password) setError(`Password: ${data.password[0]}`);
      else if (data?.detail) setError(data.detail);
      else setError("Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-blue-600">Join Alif Mentorship Hub</h1>
          <p className="text-gray-500 text-sm mt-1">Create your account to get started</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">I am a *</label>
              <select
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="student">Student</option>
                <option value="mentor">Mentor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Username *</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => set("username", e.target.value)}
                placeholder="your_username"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone number *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+252 61 234 5678"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Create a strong password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm password *</label>
              <input
                type="password"
                value={form.confirm_password}
                onChange={(e) => set("confirm_password", e.target.value)}
                placeholder="Repeat your password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-base hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 pt-2 border-t border-gray-100">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
