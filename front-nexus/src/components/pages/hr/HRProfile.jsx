import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Camera,
  Lock,
  Edit,
  X,
  Briefcase,
} from "lucide-react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api`;

/* ── Shared style tokens ── */
const inputCls =
  "w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
const readonlyCls =
  "w-full px-3 py-2 bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed";

/* ── Reusable display field ── */
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

/* ── Section card wrapper ── */
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

/* ── Modal form field wrapper ── */
const FormField = ({ label, children, span }) => (
  <div className={span ? "col-span-2 sm:col-span-2" : ""}>
    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
      {label}
    </label>
    {children}
  </div>
);

const HRProfile = () => {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [profileData, setProfileData] = useState({
    employeeId: "",
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    gender: "",
    department: "",
    position: "",
    specialization: "",
    dateHired: "",
    employmentStatus: "",
  });
  const [formData, setFormData] = useState({});

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const getAxiosConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  const fetchProfile = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/users/${id}`,
        getAxiosConfig()
      );
      const userData = response.data;
      const mapped = {
        employeeId: userData.employee_id || "",
        firstName: userData.first_name || "",
        middleName: userData.middle_name || "",
        lastName: userData.last_name || "",
        suffix: userData.suffix || "",
        email: userData.email || "",
        phone: userData.phone || "",
        address: userData.permanent_address || "",
        dateOfBirth: userData.date_of_birth
          ? userData.date_of_birth.split("T")[0]
          : "",
        gender: userData.gender || "",
        department: userData.department || "",
        position: userData.position_title || "",
        specialization: userData.specialization || "",
        dateHired: userData.date_hired
          ? userData.date_hired.split("T")[0]
          : "",
        employmentStatus: userData.access_level || userData.status || "",
      };
      setProfileData(mapped);
      setFormData(mapped);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.clear();
      } else {
        alert(
          error.response?.data?.message ||
            "Failed to load profile. Please try again."
        );
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    if (!storedUserId || !token) {
      alert("Please login first");
      return;
    }
    setUserId(storedUserId);
    fetchProfile(storedUserId);
  }, [fetchProfile]);

  const f = (key) => (e) =>
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    try {
      setSubmitting(true);
      setSaveError(null);
      const payload = {
        email: formData.email,
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        suffix: formData.suffix,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        phone: formData.phone,
        permanentAddress: formData.address,
        employeeId: formData.employeeId,
        department: formData.department,
        positionTitle: formData.position,
        dateHired: formData.dateHired,
        specialization: formData.specialization,
      };
      await axios.put(
        `${API_BASE_URL}/users/employee/${userId}`,
        payload,
        getAxiosConfig()
      );
      setProfileData({ ...profileData, ...formData });
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setSaveError(
        error.response?.data?.message || "Failed to save changes."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match!");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }
    try {
      setSubmitting(true);
      setPasswordError(null);
      await axios.post(
        `${API_BASE_URL}/auth/change-password/${userId}`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          newPasswordConfirm: passwordData.confirmPassword,
        },
        getAxiosConfig()
      );
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordForm(false);
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordError(
        error.response?.data?.message || "Failed to change password."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fullName = [
    profileData.firstName,
    profileData.middleName,
    profileData.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .concat(profileData.suffix ? `, ${profileData.suffix}` : "");

  return (
    <div className="dark:bg-slate-900 px-4 py-3 transition-colors duration-500">
      <div className="w-full space-y-2 font-sans">

        {/* ── Header ── */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User size={24} className="text-indigo-600" />
            My Profile
          </h2>
          {!loading && profileData.firstName && (
            <button
              onClick={() => {
                setFormData(profileData);
                setEditing(true);
                setSaveError(null);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              <Edit size={14} /> Edit Profile
            </button>
          )}
        </div>

        {/* ── Loading ── */}
        {loading ? (
          <div className="flex justify-center items-center h-64 text-slate-400">
            Loading profile...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* ── Left — Avatar card ── */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-28 h-28 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                    {profileData.firstName?.[0]}
                    {profileData.lastName?.[0]}
                  </div>
                  <button className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow transition-colors">
                    <Camera size={14} />
                  </button>
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {fullName || "—"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {profileData.employeeId || "No employee ID"}
                </p>
                <span className="mt-2 inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                  {profileData.employmentStatus || "Active"}
                </span>

                {/* Quick-info rows */}
                <div className="mt-5 w-full divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                  {[
                    ["Position", profileData.position],
                    ["Department", profileData.department],
                    ["Specialization", profileData.specialization],
                    [
                      "Date Hired",
                      profileData.dateHired
                        ? new Date(profileData.dateHired).toLocaleDateString()
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

                {/* Contact mini-list */}
                <div className="mt-5 w-full space-y-2 text-sm text-left">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Mail size={14} className="text-indigo-500 shrink-0" />
                    <span className="truncate">{profileData.email || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Phone size={14} className="text-indigo-500 shrink-0" />
                    <span>{profileData.phone || "—"}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                    <MapPin size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                    <span>{profileData.address || "—"}</span>
                  </div>
                </div>

                {/* Change password trigger */}
                <div className="mt-5 w-full pt-5 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => {
                      setShowPasswordForm(true);
                      setPasswordError(null);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Lock size={14} /> Change Password
                  </button>
                </div>
              </div>
            </div>

            {/* ── Right — Info sections ── */}
            <div className="lg:col-span-2 space-y-4">
              <SectionCard title="Personal Information">
                <Field label="First Name" value={profileData.firstName} />
                <Field label="Last Name" value={profileData.lastName} />
                <Field label="Middle Name" value={profileData.middleName} />
                <Field label="Suffix" value={profileData.suffix} />
                <Field
                  label="Date of Birth"
                  value={
                    profileData.dateOfBirth
                      ? new Date(profileData.dateOfBirth).toLocaleDateString()
                      : null
                  }
                />
                <Field label="Gender" value={profileData.gender} />
              </SectionCard>

              <SectionCard title="Contact Information">
                <Field label="Email" value={profileData.email} />
                <Field label="Phone" value={profileData.phone} />
                <div className="col-span-2 md:col-span-3">
                  <Field label="Address" value={profileData.address} />
                </div>
              </SectionCard>

              <SectionCard title="Employment Information">
                <Field label="Employee ID" value={profileData.employeeId} />
                <Field label="Department" value={profileData.department} />
                <Field label="Position" value={profileData.position} />
                <Field
                  label="Date Hired"
                  value={
                    profileData.dateHired
                      ? new Date(profileData.dateHired).toLocaleDateString()
                      : null
                  }
                />
                <div className="col-span-2 md:col-span-3">
                  <Field label="Specialization" value={profileData.specialization} />
                </div>
              </SectionCard>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          Edit Profile Modal
      ══════════════════════════════════════ */}
      {editing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit size={18} className="text-indigo-600" /> Edit Profile
              </h2>
              <button
                onClick={() => { setEditing(false); setSaveError(null); }}
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
                    { label: "First Name", key: "firstName", type: "text" },
                    { label: "Last Name", key: "lastName", type: "text" },
                    { label: "Middle Name", key: "middleName", type: "text" },
                  ].map(({ label, key, type }) => (
                    <FormField key={key} label={label}>
                      <input
                        type={type}
                        value={formData[key] || ""}
                        onChange={f(key)}
                        className={inputCls}
                      />
                    </FormField>
                  ))}

                  <FormField label="Suffix">
                    <select
                      value={formData.suffix || ""}
                      onChange={f("suffix")}
                      className={inputCls}
                    >
                      <option value="">None</option>
                      <option value="Jr.">Jr.</option>
                      <option value="Sr.">Sr.</option>
                      <option value="III">III</option>
                      <option value="IV">IV</option>
                    </select>
                  </FormField>

                  <FormField label="Date of Birth">
                    <input
                      type="date"
                      value={formData.dateOfBirth || ""}
                      onChange={f("dateOfBirth")}
                      className={inputCls}
                    />
                  </FormField>

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
                  <FormField label="Address" span>
                    <input
                      type="text"
                      value={formData.address || ""}
                      onChange={f("address")}
                      className={inputCls}
                    />
                  </FormField>
                </div>
              </div>

              {/* Employment */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Employment Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Employee ID">
                    <input
                      type="text"
                      value={formData.employeeId || ""}
                      readOnly
                      className={readonlyCls}
                    />
                  </FormField>
                  <FormField label="Department">
                    <input
                      type="text"
                      value={formData.department || ""}
                      readOnly
                      className={readonlyCls}
                    />
                  </FormField>
                  <FormField label="Position">
                    <input
                      type="text"
                      value={formData.position || ""}
                      readOnly
                      className={readonlyCls}
                    />
                  </FormField>
                  <FormField label="Date Hired">
                    <input
                      type="date"
                      value={formData.dateHired || ""}
                      readOnly
                      className={readonlyCls}
                    />
                  </FormField>
                  <FormField label="Specialization" span>
                    <input
                      type="text"
                      value={formData.specialization || ""}
                      onChange={f("specialization")}
                      className={inputCls}
                    />
                  </FormField>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
              <button
                onClick={() => { setEditing(false); setSaveError(null); }}
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

      {/* ══════════════════════════════════════
          Change Password Modal
      ══════════════════════════════════════ */}
      {showPasswordForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock size={18} className="text-indigo-600" /> Change Password
              </h2>
              <button
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  setPasswordError(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handlePasswordSubmit} className="px-6 py-5 space-y-4">
              {passwordError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {passwordError}
                </div>
              )}

              {[
                { label: "Current Password", key: "currentPassword" },
                { label: "New Password", key: "newPassword" },
                { label: "Confirm New Password", key: "confirmPassword" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    {label}
                  </label>
                  <input
                    type="password"
                    name={key}
                    value={passwordData[key]}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    required
                    className={inputCls}
                  />
                </div>
              ))}

              {passwordData.newPassword &&
                passwordData.confirmPassword &&
                passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="text-xs text-red-500 font-medium">
                    Passwords do not match
                  </p>
                )}

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                    setPasswordError(null);
                  }}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    passwordData.newPassword !== passwordData.confirmPassword
                  }
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm shadow-sm transition-colors disabled:opacity-60"
                >
                  <Save size={14} />
                  {submitting ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRProfile;