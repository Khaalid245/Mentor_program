import { useState } from "react";
import api from "../services/axios";

const INITIAL_FORM = {
  first_name: "", last_name: "", dob: "", gender: "",
  phone: "", email: "", address: "", national_id: "",
  previous_school: "", previous_grade: "", gpa: "", course: "",
  mentorship_interest: "", career_goals: "", why_mentorship: "",
  certificate: null, passport_photo: null,
  transcript: null, recommendation_letter: null,
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const STEPS = [
  { id: 1, label: "Personal",  icon: "👤" },
  { id: 2, label: "Academic",  icon: "📚" },
  { id: 3, label: "Goals",     icon: "🎯" },
  { id: 4, label: "Documents", icon: "📎" },
];

// Validate required fields per step before allowing Next
const validateStep = (step, form) => {
  if (step === 1) {
    if (!form.first_name.trim()) return "First name is required.";
    if (!form.last_name.trim())  return "Last name is required.";
    if (!form.dob)               return "Date of birth is required.";
    if (!form.gender)            return "Please select your gender.";
    if (!form.phone.trim())      return "Phone number is required.";
    if (!form.email.trim())      return "Email address is required.";
    if (!form.address.trim())    return "Address is required.";
    if (!form.national_id.trim()) return "National ID is required.";
  }
  if (step === 2) {
    if (!form.previous_school.trim()) return "School name is required.";
    if (!form.previous_grade.trim())  return "Grade level is required.";
    if (!form.course)                 return "Please select a program interest.";
  }
  if (step === 3) {
    if (!form.mentorship_interest)       return "Please select a mentorship area.";
    if (!form.career_goals.trim())       return "Please describe your career goals.";
    if (!form.why_mentorship.trim())     return "Please explain why you want mentorship.";
  }
  if (step === 4) {
    if (!form.certificate)    return "Academic certificate is required.";
    if (!form.passport_photo) return "Passport photo is required.";
  }
  return null;
};

const ApplicationForm = ({ onSuccess }) => {
  const [step, setStep]           = useState(1);
  const [form, setForm]           = useState(INITIAL_FORM);
  const [error, setError]         = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const file = files[0];
      if (file && file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" exceeds the 5MB limit. Please choose a smaller file.`);
        e.target.value = "";
        return;
      }
      setError("");
      setForm((p) => ({ ...p, [name]: file }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const handleNext = () => {
    const err = validateStep(step, form);
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setError("");
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Guard: only submit when actually on step 4
    if (step !== 4) {
      handleNext();
      return;
    }
    const err = validateStep(4, form);
    if (err) { setError(err); return; }
    setError("");
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val !== null && val !== "") formData.append(key, val);
      });

      await api.post("student/applications/", formData);
      onSuccess();
    } catch (err) {
      const status = err.response?.status;
      const data   = err.response?.data;

      if (status === 401) {
        setError("Your session has expired. Please log out and log back in, then try again.");
        return;
      }
      if (data && typeof data === "object") {
        const [field, msg] = Object.entries(data)[0];
        setError(`${field}: ${Array.isArray(msg) ? msg[0] : msg}`);
      } else {
        setError("Submission failed. Please check your details and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-blue-700">Mentorship Application</h2>
        <p className="text-gray-500 text-sm mt-1">Step {step} of {STEPS.length} — {STEPS[step - 1].label}</p>
      </div>

      {/* Step progress bar */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border-2 transition-all ${
              step > s.id  ? "bg-blue-600 border-blue-600 text-white" :
              step === s.id ? "bg-white border-blue-600 text-blue-600" :
              "bg-white border-gray-300 text-gray-400"
            }`}>
              {step > s.id ? "✓" : s.icon}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-1 mx-1 rounded ${step > s.id ? "bg-blue-600" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step labels */}
      <div className="flex justify-between text-xs text-gray-500 -mt-2">
        {STEPS.map((s) => (
          <span key={s.id} className={`font-medium ${step === s.id ? "text-blue-600" : ""}`}>
            {s.label}
          </span>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* ── Step 1: Personal Information ── */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">First Name *</label>
                <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="Amina" required className="input" />
              </div>
              <div>
                <label className="label">Last Name *</label>
                <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Hassan" required className="input" />
              </div>
              <div>
                <label className="label">Date of Birth *</label>
                <input type="date" name="dob" value={form.dob} onChange={handleChange} required className="input" />
              </div>
              <div>
                <label className="label">Gender *</label>
                <select name="gender" value={form.gender} onChange={handleChange} required className="input">
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Phone Number *</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+252 61 234 5678" required className="input" />
              </div>
              <div>
                <label className="label">Email Address *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="amina@example.com" required className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">National ID / Student ID *</label>
                <input name="national_id" value={form.national_id} onChange={handleChange} placeholder="Your ID number" required className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Home Address *</label>
                <input name="address" value={form.address} onChange={handleChange} placeholder="City, District" required className="input" />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Academic Information ── */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="label">Current / Previous School *</label>
                <input name="previous_school" value={form.previous_school} onChange={handleChange} placeholder="School name" required className="input" />
              </div>
              <div>
                <label className="label">Current Grade Level *</label>
                <input name="previous_grade" value={form.previous_grade} onChange={handleChange} placeholder="e.g. Grade 11" required className="input" />
              </div>
              <div>
                <label className="label">GPA (optional)</label>
                <input type="number" name="gpa" value={form.gpa} onChange={handleChange} placeholder="e.g. 3.5" step="0.01" min="0" max="4" className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Program Interest *</label>
                <select name="course" value={form.course} onChange={handleChange} required className="input">
                  <option value="">Select a program</option>
                  <option value="Career Guidance">Career Guidance & Consultation</option>
                  <option value="Software Engineering Mentorship">Software Engineering Mentorship</option>
                  <option value="Business Mentorship">Business Mentorship</option>
                  <option value="Education Career Path">Education Career Path</option>
                  <option value="Technology Training">Technology Training & Digital Skills</option>
                  <option value="Higher Education Guidance">Higher Education & Scholarship Guidance</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Career Goals ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="label">What area interests you most? *</label>
              <select name="mentorship_interest" value={form.mentorship_interest} onChange={handleChange} required className="input">
                <option value="">Select an area</option>
                <option value="Career Consultation">Career Consultation & Guidance</option>
                <option value="Technology Skills">Technology Skills & Innovation</option>
                <option value="Higher Education">Higher Education Pathways</option>
                <option value="Scholarship Application">Scholarship Application Support</option>
                <option value="Personal Development">Personal Development & Growth</option>
              </select>
            </div>
            <div>
              <label className="label">What are your career goals? *</label>
              <textarea name="career_goals" value={form.career_goals} onChange={handleChange} rows={4} placeholder="Tell us what career you want to pursue and why..." required className="input resize-none" />
            </div>
            <div>
              <label className="label">Why do you want to join this program? *</label>
              <textarea name="why_mentorship" value={form.why_mentorship} onChange={handleChange} rows={4} placeholder="What do you hope to gain from having a mentor?" required className="input resize-none" />
            </div>
          </div>
        )}

        {/* ── Step 4: Documents ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
              📎 Upload clear photos or scans. Max file size: <strong>5MB</strong> each. Accepted: PDF, JPG, PNG.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Academic Certificate *</label>
                <input type="file" name="certificate" onChange={handleChange} accept=".pdf,.jpg,.jpeg,.png" className="input" />
                {form.certificate && <p className="text-xs text-green-600 mt-1">✓ {form.certificate.name}</p>}
              </div>
              <div>
                <label className="label">Passport Photo *</label>
                <input type="file" name="passport_photo" onChange={handleChange} accept=".jpg,.jpeg,.png" className="input" />
                {form.passport_photo && <p className="text-xs text-green-600 mt-1">✓ {form.passport_photo.name}</p>}
              </div>
              <div>
                <label className="label">Transcript <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="file" name="transcript" onChange={handleChange} accept=".pdf,.jpg,.jpeg,.png" className="input" />
                {form.transcript && <p className="text-xs text-green-600 mt-1">✓ {form.transcript.name}</p>}
              </div>
              <div>
                <label className="label">Recommendation Letter <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="file" name="recommendation_letter" onChange={handleChange} accept=".pdf,.jpg,.jpeg,.png" className="input" />
                {form.recommendation_letter && <p className="text-xs text-green-600 mt-1">✓ {form.recommendation_letter.name}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
          {step > 1 ? (
            <button type="button" onClick={handleBack} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition text-sm">
              ← Back
            </button>
          ) : <div />}

          {step < 4 ? (
            <button type="button" onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm">
              Next →
            </button>
          ) : (
            <button type="submit" disabled={submitting} className={`px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition text-sm ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}>
              {submitting ? "Submitting..." : "Submit Application ✓"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm;
