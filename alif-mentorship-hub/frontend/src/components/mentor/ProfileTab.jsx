import { useState, useEffect } from "react";
import api from "../../services/axios";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const parseSlots = (raw) => {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const ProfileTab = ({ profile, onSaved, gateMode = false }) => {
  const [form, setForm] = useState({
    university:      profile?.university      || "",
    graduation_year: profile?.graduation_year || "",
    field_of_study:  profile?.field_of_study  || "",
    bio:             profile?.bio             || "",
    linkedin_url:    profile?.linkedin_url    || "",
  });
  const [slots, setSlots]     = useState(parseSlots(profile?.availability));
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError]     = useState("");

  useEffect(() => {
    if (profile) {
      setForm({
        university:      profile.university      || "",
        graduation_year: profile.graduation_year || "",
        field_of_study:  profile.field_of_study  || "",
        bio:             profile.bio             || "",
        linkedin_url:    profile.linkedin_url    || "",
      });
      setSlots(parseSlots(profile.availability));
    }
  }, [profile]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const addSlot = () => setSlots((s) => [...s, { day: "Monday", start: "09:00", end: "10:00" }]);
  const removeSlot = (i) => setSlots((s) => s.filter((_, idx) => idx !== i));
  const updateSlot = (i, key, val) =>
    setSlots((s) => s.map((sl, idx) => idx === i ? { ...sl, [key]: val } : sl));

  const save = async () => {
    setSaving(true);
    setSuccess("");
    setError("");
    try {
      const payload = {
        ...form,
        graduation_year: form.graduation_year ? Number(form.graduation_year) : null,
        availability: JSON.stringify(slots),
      };
      const r = await api.patch("mentors/me/", payload);
      onSaved(r.data);
      setSuccess("Profile saved");
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const isVerified = profile?.is_verified;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {gateMode ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="font-bold text-blue-800 text-base">Complete your profile to start receiving session requests.</p>
          <p className="text-sm text-blue-600 mt-1">Fill in all required fields below.</p>
        </div>
      ) : (
        <>
          <h1 className="text-xl font-bold text-gray-800 pt-2">My profile</h1>
          {/* Verification banner */}
          {isVerified ? (
            <div className="bg-green-50 border border-green-300 rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="text-green-600 text-lg">✓</span>
              <span className="text-green-700 font-semibold text-sm">Verified mentor</span>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3">
              <p className="text-amber-700 text-sm font-medium">
                Your profile is under review. You will start receiving session requests once an admin verifies your profile.
              </p>
            </div>
          )}
        </>
      )}

      {/* Form fields */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">University *</label>
          <input
            value={form.university}
            onChange={(e) => set("university", e.target.value)}
            placeholder="e.g. University of Mogadishu"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Graduation year *</label>
          <input
            type="number"
            min={2000}
            max={2030}
            value={form.graduation_year}
            onChange={(e) => set("graduation_year", e.target.value)}
            placeholder="e.g. 2022"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Field of study *</label>
          <input
            value={form.field_of_study}
            onChange={(e) => set("field_of_study", e.target.value)}
            placeholder="e.g. Software Engineering"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">
            Bio * <span className="font-normal text-gray-400">({form.bio.length}/500)</span>
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => e.target.value.length <= 500 && set("bio", e.target.value)}
            rows={4}
            placeholder="Tell students about your background and experience…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">LinkedIn URL</label>
          <input
            value={form.linkedin_url}
            onChange={(e) => set("linkedin_url", e.target.value)}
            placeholder="https://linkedin.com/in/yourprofile"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Availability slot builder */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-600">Availability slots</label>
            <button
              type="button"
              onClick={addSlot}
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              + Add slot
            </button>
          </div>
          {slots.length === 0 && (
            <p className="text-xs text-gray-400">No slots added yet. Add at least one so students can book you.</p>
          )}
          <div className="space-y-2">
            {slots.map((sl, i) => (
              <div key={i} className="flex flex-wrap gap-2 items-center bg-gray-50 rounded-lg p-2">
                <select
                  value={sl.day}
                  onChange={(e) => updateSlot(i, "day", e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <input
                  type="time"
                  value={sl.start}
                  onChange={(e) => updateSlot(i, "start", e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-400 text-xs">to</span>
                <input
                  type="time"
                  value={sl.end}
                  onChange={(e) => updateSlot(i, "end", e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  className="text-red-400 hover:text-red-600 text-sm font-bold px-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {error   && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm font-medium">{success}</p>}

        <button
          onClick={save}
          disabled={saving}
          className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {saving ? "Saving…" : gateMode ? "Save and continue" : "Save profile"}
        </button>
      </div>
    </div>
  );
};

export default ProfileTab;
