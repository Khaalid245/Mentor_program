import { useState } from "react";
import api from "../services/axios";

const ApplicationForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    dob: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    national_id: "",
    previous_school: "",
    previous_grade: "",
    gpa: "",
    course: "",
    mentorship_interest: "", // New field
    career_goals: "", // New field
    why_mentorship: "", // New field
    certificate: null,
    transcript: null,
    passport_photo: null,
    recommendation_letter: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setForm({ ...form, [name]: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        if (form[key] !== null && form[key] !== '') formData.append(key, form[key]);
      });

      await api.post("student/applications/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Mentorship application submitted successfully!");
      onSuccess(); // refresh dashboard
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Failed to submit application");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 border-2 border-blue-200 rounded-xl p-6 bg-white">
      <h2 className="text-2xl font-bold text-blue-600 mb-4">Mentorship Program Application</h2>
      <p className="text-gray-600 mb-6">
        Join Alif Mentorship Hub to access career guidance, mentorship programs, technology training, 
        and community events designed to support Somali high school students.
      </p>

      {/* Personal Information Section */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-blue-800">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="first_name"
            placeholder="First Name *"
            value={form.first_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            name="last_name"
            placeholder="Last Name *"
            value={form.last_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="date"
            name="dob"
            value={form.dob}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address *"
            value={form.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="mt-4">
          <input
            name="address"
            placeholder="Address *"
            value={form.address}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="mt-4">
          <input
            name="national_id"
            placeholder="National ID / Student ID *"
            value={form.national_id}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      {/* Academic Information */}
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-purple-800">Academic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="previous_school"
            placeholder="Current/Previous School *"
            value={form.previous_school}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            required
          />
          <input
            name="previous_grade"
            placeholder="Current Grade Level *"
            value={form.previous_grade}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            required
          />
          <input
            name="gpa"
            placeholder="GPA (if applicable)"
            value={form.gpa}
            onChange={handleChange}
            type="number"
            step="0.01"
            min="0"
            max="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          <select
            name="course"
            value={form.course}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            required
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
      </div>

      {/* Mentorship Interest Section */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-green-800">Mentorship Program Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              What mentorship area interests you most? *
            </label>
            <select
              name="mentorship_interest"
              value={form.mentorship_interest}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              What are your career goals? *
            </label>
            <textarea
              name="career_goals"
              placeholder="Tell us about your career aspirations and goals..."
              value={form.career_goals}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Why are you interested in this mentorship program? *
            </label>
            <textarea
              name="why_mentorship"
              placeholder="Share why you want to join Alif Mentorship Hub..."
              value={form.why_mentorship}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Document Upload Section */}
      <div className="bg-orange-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-orange-800">Supporting Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Academic Certificate or Transcript *
            </label>
            <input
              type="file"
              name="certificate"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Passport Photo *
            </label>
            <input
              type="file"
              name="passport_photo"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              accept=".jpg,.jpeg,.png"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Recommendation Letter (Optional)
            </label>
            <input
              type="file"
              name="recommendation_letter"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </div>
        </div>
      </div>

      <button 
        type="submit" 
        className="w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl"
      >
        Submit Mentorship Application
      </button>
    </form>
  );
};

export default ApplicationForm;
