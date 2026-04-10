import { useState } from "react";
import api from "../services/axios";

// Fields sent must exactly match StudentApplication model fields
const INITIAL_FORM = {
  // Personal info
  first_name: "",
  last_name: "",
  dob: "",
  gender: "",
  phone: "",
  email: "",
  address: "",
  national_id: "",
  // Academic info
  previous_school: "",
  previous_grade: "",
  gpa: "",
  course: "",
  // Career guidance (saved to model)
  mentorship_interest: "",
  career_goals: "",
  why_mentorship: "",
  // Documents
  certificate: null,
  transcript: null,
  passport_photo: null,
  recommendation_letter: null, // optional — blank=True, null=True on model
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const FILE_FIELDS = ["certificate", "transcript", "passport_photo", "recommendation_letter"];

const ApplicationForm = ({ onSuccess }) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const file = files[0];
      if (file && file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" exceeds the 5MB limit. Please compress or choose a smaller file.`);
        e.target.value = ""; // reset the input
        return;
      }
      setError("");
      setForm((prev) => ({ ...prev, [name]: file }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        // Skip null/empty values — don't send empty strings for optional file fields
        if (value !== null && value !== "") {
          formData.append(key, value);
        }
      });

      await api.post("student/applications/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onSuccess(); // refresh dashboard
    } catch (err) {
      console.error(err.response?.data || err);
      const detail = err.response?.data
        ? JSON.stringify(err.response.data)
        : "Failed to submit. Please check your details and try again.";
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-blue-600">
          Mentorship Program Application
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Fields marked * are required.
        </p>
      </div>

      {/* Inline error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ── Personal Information ─────────────────────────────── */}
      <section className="bg-blue-50 p-4 rounded-lg space-y-3">
        <h3 className="font-semibold text-blue-800">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            name="first_name"
            placeholder="First Name *"
            value={form.first_name}
            onChange={handleChange}
            required
            className="input"
          />
          <input
            name="last_name"
            placeholder="Last Name *"
            value={form.last_name}
            onChange={handleChange}
            required
            className="input"
          />
          <input
            type="date"
            name="dob"
            value={form.dob}
            onChange={handleChange}
            required
            className="input"
          />
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            required
            className="input"
          >
            <option value="">Select Gender *</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <input
            name="phone"
            placeholder="Phone Number *"
            value={form.phone}
            onChange={handleChange}
            required
            className="input"
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address *"
            value={form.email}
            onChange={handleChange}
            required
            className="input"
          />
          <input
            name="national_id"
            placeholder="National ID / Student ID *"
            value={form.national_id}
            onChange={handleChange}
            required
            className="input md:col-span-2"
          />
          <input
            name="address"
            placeholder="Address *"
            value={form.address}
            onChange={handleChange}
            required
            className="input md:col-span-2"
          />
        </div>
      </section>

      {/* ── Academic Information ─────────────────────────────── */}
      <section className="bg-purple-50 p-4 rounded-lg space-y-3">
        <h3 className="font-semibold text-purple-800">Academic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            name="previous_school"
            placeholder="Current / Previous School *"
            value={form.previous_school}
            onChange={handleChange}
            required
            className="input"
          />
          <input
            name="previous_grade"
            placeholder="Current Grade Level *"
            value={form.previous_grade}
            onChange={handleChange}
            required
            className="input"
          />
          <input
            type="number"
            name="gpa"
            placeholder="GPA (optional)"
            value={form.gpa}
            onChange={handleChange}
            step="0.01"
            min="0"
            max="4"
            className="input"
          />
          <select
            name="course"
            value={form.course}
            onChange={handleChange}
            required
            className="input"
          >
            <option value="">Select Program Interest *</option>
            <option value="Career Guidance">Career Guidance & Consultation</option>
            <option value="Software Engineering Mentorship">Software Engineering Mentorship</option>
            <option value="Business Mentorship">Business Mentorship</option>
            <option value="Education Career Path">Education Career Path</option>
            <option value="Technology Training">Technology Training & Digital Skills</option>
            <option value="Higher Education Guidance">Higher Education & Scholarship Guidance</option>
          </select>
        </div>
      </section>

      {/* ── Career Guidance ──────────────────────────────────── */}
      <section className="bg-green-50 p-4 rounded-lg space-y-3">
        <h3 className="font-semibold text-green-800">Career Guidance</h3>

        <div>
          <label className="label">What mentorship area interests you most? *</label>
          <select
            name="mentorship_interest"
            value={form.mentorship_interest}
            onChange={handleChange}
            required
            className="input"
          >
            <option value="">Select area of interest *</option>
            <option value="Career Consultation">Career Consultation & Guidance</option>
            <option value="Technology Skills">Technology Skills & Innovation</option>
            <option value="Higher Education">Higher Education Pathways</option>
            <option value="Scholarship Application">Scholarship Application Support</option>
            <option value="Personal Development">Personal Development & Growth</option>
          </select>
        </div>

        <div>
          <label className="label">What are your career goals? *</label>
          <textarea
            name="career_goals"
            placeholder="Tell us about your career aspirations..."
            value={form.career_goals}
            onChange={handleChange}
            rows={3}
            required
            className="input resize-none"
          />
        </div>

        <div>
          <label className="label">Why are you interested in this mentorship program? *</label>
          <textarea
            name="why_mentorship"
            placeholder="Share why you want to join Alif Mentorship Hub..."
            value={form.why_mentorship}
            onChange={handleChange}
            rows={3}
            required
            className="input resize-none"
          />
        </div>
      </section>

      {/* ── Supporting Documents ─────────────────────────────── */}
      <section className="bg-orange-50 p-4 rounded-lg space-y-3">
        <h3 className="font-semibold text-orange-800">Supporting Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="label">Academic Certificate *</label>
            <input
              type="file"
              name="certificate"
              onChange={handleChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">Passport Photo *</label>
            <input
              type="file"
              name="passport_photo"
              onChange={handleChange}
              accept=".jpg,.jpeg,.png"
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">Transcript (optional)</label>
            <input
              type="file"
              name="transcript"
              onChange={handleChange}
              accept=".pdf,.jpg,.jpeg,.png"
              className="input"
            />
          </div>
          <div>
            <label className="label">Recommendation Letter (optional)</label>
            <input
              type="file"
              name="recommendation_letter"
              onChange={handleChange}
              accept=".pdf,.jpg,.jpeg,.png"
              className="input"
            />
          </div>
        </div>
      </section>

      <button
        type="submit"
        disabled={submitting}
        className={`w-full py-3 px-6 rounded-lg font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition shadow-lg ${
          submitting ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {submitting ? "Submitting..." : "Submit Application"}
      </button>
    </form>
  );
};

export default ApplicationForm;
