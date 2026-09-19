import { useState, useEffect } from "react";
import api from "../../../api/axios";
import { Users, Edit, Save, X } from "lucide-react";

const resolveStoredStudentId = () => {
  const directUserId = localStorage.getItem("userId");
  if (directUserId) return directUserId;

  const userObj = localStorage.getItem("user");
  if (!userObj) return null;

  try {
    const parsedUser = JSON.parse(userObj);
    return parsedUser.user_id || parsedUser.userId || parsedUser.id || null;
  } catch (e) {
    console.error("Error parsing user object:", e);
    return null;
  }
};

const pickValue = (obj, ...keys) => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null) return value;
  }
  return "";
};

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">
      {label}
    </p>
    <p className="text-sm font-semibold text-slate-800 dark:text-white">
      {value || (
        <span className="text-slate-400 font-normal italic">Not provided</span>
      )}
    </p>
  </div>
);

const SectionCard = ({ title, children }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
      {title}
    </h3>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
      {children}
    </div>
  </div>
);

const FormField = ({ label, children, span }) => (
  <div className={span ? "col-span-2 md:col-span-3" : ""}>
    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
      {label}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
const readonlyCls =
  "w-full px-3 py-2 bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed";

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = resolveStoredStudentId();
      if (!userId) {
        setError("No logged-in user found. Please log in again.");
        return;
      }
      let u = null;

      try {
        const listResponse = await api.get("/api/users");
        const users = Array.isArray(listResponse.data) ? listResponse.data : [];
        u = users.find((user) => String(user.user_id) === String(userId)) || null;
      } catch (listErr) {
        console.warn("Falling back to single-user profile fetch:", listErr);
      }

      if (!u) {
        const response = await api.get(`/api/users/${userId}`);
        u = response.data || {};
      }

      const profileData = {
        user_id: pickValue(u, "user_id", "userId", "id"),
        student_number: pickValue(u, "student_number", "studentNumber"),
        first_name: pickValue(u, "first_name", "firstName"),
        middle_name: pickValue(u, "middle_name", "middleName"),
        last_name: pickValue(u, "last_name", "lastName"),
        suffix: pickValue(u, "suffix"),
        email: pickValue(u, "email"),
        phone: pickValue(u, "phone"),
        gender: pickValue(u, "gender"),
        date_of_birth: pickValue(u, "date_of_birth", "dateOfBirth"),
        permanent_address: pickValue(
          u,
          "permanent_address",
          "permanentAddress",
          "address",
        ),
        mailing_address: pickValue(u, "mailing_address", "mailingAddress"),
        course: pickValue(u, "course"),
        major: pickValue(u, "major"),
        year_level: pickValue(u, "year_level", "yearLevel"),
        previous_school: pickValue(u, "previous_school", "previousSchool"),
        father_name: pickValue(u, "father_name", "fatherName"),
        mother_name: pickValue(u, "mother_name", "motherName"),
        parent_phone: pickValue(u, "parent_phone", "parentPhone"),
        status: pickValue(u, "status"),
        role: pickValue(u, "role"),
        created_at: pickValue(u, "created_at", "createdAt"),
        profile_picture_url: pickValue(
          u,
          "profile_picture_url",
          "profilePictureUrl",
        ),
      };
      setProfile(profileData);
      setFormData(profileData);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const f = (key) => (e) =>
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    try {
      setSubmitting(true);
      setSaveError(null);
      const userId = resolveStoredStudentId();
      if (!userId) {
        setSaveError("No logged-in user found. Please log in again.");
        return;
      }
      
      // Format date to YYYY-MM-DD to match database DATE type
      const formatDate = (dateValue) => {
        if (!dateValue) return null;
        const date = new Date(dateValue);
        return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
      };
      
      await api.put(`/api/users/student/${userId}`, {
        email: formData.email,
        firstName: formData.first_name,
        middleName: formData.middle_name,
        lastName: formData.last_name,
        suffix: formData.suffix,
        dateOfBirth: formatDate(formData.date_of_birth),
        gender: formData.gender,
        phone: formData.phone,
        permanentAddress: formData.permanent_address,
        mailingAddress: formData.mailing_address,
        studentNumber: formData.student_number,
        course: formData.course,
        major: formData.major,
        yearLevel: formData.year_level,
        previousSchool: formData.previous_school,
        fatherName: formData.father_name,
        motherName: formData.mother_name,
        parentPhone: formData.parent_phone,
      });
      setProfile({ ...profile, ...formData });
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      setSaveError(err.response?.data?.message || "Failed to save changes.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
   <div className="dark:bg-slate-900 px-4 py-3 transition-colors duration-500">
      <div className="w-full space-y-2 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users size={24} className="text-indigo-600" />
            My Profile
          </h2>
          {!loading && profile && (
            <button
              onClick={() => {
                setFormData(profile);
                setIsEditing(true);
                setSaveError(null);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              <Edit size={14} /> Edit Profile
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center items-center h-64 text-slate-400">
            Loading profile...
          </div>
        ) : !profile ? null : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left — Avatar card */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center text-center">
                {profile.profile_picture_url ? (
                  <img
                    src={profile.profile_picture_url}
                    alt="Profile"
                    className="w-28 h-28 rounded-full object-cover border-4 border-indigo-100"
                  />
                ) : (
                  <div className="w-28 h-28 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                    {profile.first_name?.[0]}
                    {profile.last_name?.[0]}
                  </div>
                )}
                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {profile.first_name}{" "}
                  {profile.middle_name ? profile.middle_name + " " : ""}
                  {profile.last_name}
                  {profile.suffix ? ", " + profile.suffix : ""}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {profile.student_number || "No student number"}
                </p>
                <span className="mt-2 inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                  {profile.status || "Active"}
                </span>
                <div className="mt-5 w-full divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                  {[
                    ["Role", profile.role],
                    ["Course", profile.course],
                    ["Major", profile.major],
                    ["Year Level", profile.year_level],
                    [
                      "Registered",
                      profile.created_at
                        ? new Date(profile.created_at).toLocaleDateString()
                        : null,
                    ],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between py-2">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-semibold text-slate-800 dark:text-white text-right max-w-[55%] truncate">
                        {val || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — Info sections */}
            <div className="lg:col-span-2 space-y-4">
              <SectionCard title="Personal Information">
                <Field label="First Name" value={profile.first_name} />
                <Field label="Last Name" value={profile.last_name} />
                <Field label="Middle Name" value={profile.middle_name} />
                <Field label="Suffix" value={profile.suffix} />
                <Field
                  label="Date of Birth"
                  value={
                    profile.date_of_birth
                      ? new Date(profile.date_of_birth).toLocaleDateString()
                      : null
                  }
                />
                <Field label="Gender" value={profile.gender} />
              </SectionCard>

              <SectionCard title="Contact Information">
                <Field label="Email" value={profile.email} />
                <Field label="Phone" value={profile.phone} />
                <Field
                  label="Parent / Guardian Phone"
                  value={profile.parent_phone}
                />
                <Field label="Father's Name" value={profile.father_name} />
                <Field label="Mother's Name" value={profile.mother_name} />
                <div className="col-span-2 md:col-span-3">
                  <Field
                    label="Permanent Address"
                    value={profile.permanent_address}
                  />
                </div>
                <div className="col-span-2 md:col-span-3">
                  <Field
                    label="Mailing Address"
                    value={profile.mailing_address}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Academic Information">
                <Field label="Student Number" value={profile.student_number} />
                <Field label="Course" value={profile.course} />
                <Field label="Major" value={profile.major} />
                <Field label="Year Level" value={profile.year_level} />
                <Field
                  label="Previous School"
                  value={profile.previous_school}
                />
              </SectionCard>
            </div>
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit size={18} className="text-indigo-600" /> Edit Profile
              </h2>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSaveError(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto px-6 py-5 space-y-6">
              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {saveError}
                </div>
              )}

              {/* Personal */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "First Name", key: "first_name", type: "text" },
                    { label: "Last Name", key: "last_name", type: "text" },
                    { label: "Middle Name", key: "middle_name", type: "text" },
                    { label: "Suffix", key: "suffix", type: "text" },
                    {
                      label: "Date of Birth",
                      key: "date_of_birth",
                      type: "date",
                    },
                  ].map(({ label, key, type }) => (
                    <FormField key={key} label={label}>
                      <input
                        type={type}
                        value={
                          type === "date"
                            ? formData[key]?.split("T")[0] || ""
                            : formData[key] || ""
                        }
                        onChange={f(key)}
                        className={inputCls}
                      />
                    </FormField>
                  ))}
                  <FormField label="Gender">
                    <select
                      value={formData.gender || ""}
                      onChange={f("gender")}
                      className={inputCls}
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </FormField>
                </div>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Email">
                    <input
                      type="email"
                      value={formData.email || ""}
                      onChange={f("email")}
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Phone Number">
                    <input
                      type="tel"
                      value={formData.phone || ""}
                      onChange={f("phone")}
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Parent / Guardian Phone">
                    <input
                      type="tel"
                      value={formData.parent_phone || ""}
                      onChange={f("parent_phone")}
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Father's Name">
                    <input
                      type="text"
                      value={formData.father_name || ""}
                      onChange={f("father_name")}
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Mother's Name">
                    <input
                      type="text"
                      value={formData.mother_name || ""}
                      onChange={f("mother_name")}
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Permanent Address" span>
                    <input
                      type="text"
                      value={formData.permanent_address || ""}
                      onChange={f("permanent_address")}
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Mailing Address" span>
                    <input
                      type="text"
                      value={formData.mailing_address || ""}
                      onChange={f("mailing_address")}
                      className={inputCls}
                    />
                  </FormField>
                </div>
              </div>

              {/* Academic */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Academic Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Student Number">
                    <input
                      type="text"
                      value={formData.student_number || ""}
                      readOnly
                      className={readonlyCls}
                    />
                  </FormField>
                  {[
                    { label: "Course", key: "course" },
                    { label: "Major", key: "major" },
                    { label: "Year Level", key: "year_level" },
                    { label: "Previous School", key: "previous_school" },
                  ].map(({ label, key }) => (
                    <FormField key={key} label={label}>
                      <input
                        type="text"
                        value={formData[key] || ""}
                        onChange={f(key)}
                        className={inputCls}
                      />
                    </FormField>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSaveError(null);
                }}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm shadow-sm transition-colors disabled:opacity-60"
              >
                <Save size={14} />
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
