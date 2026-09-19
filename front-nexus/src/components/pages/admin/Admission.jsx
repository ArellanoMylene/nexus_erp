import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import {
  FileText,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  Check,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ---------------------------------------------------------------------------
// Academic period helpers (shared by the Admissions table and the
// Bulk Enroll modal so both stay in sync).
// ---------------------------------------------------------------------------

const sortAcademicPeriods = (periods) =>
  [...periods].sort((left, right) => {
    if (left.school_year === right.school_year) {
      return String(right.semester || "").localeCompare(
        String(left.semester || ""),
      );
    }
    return String(right.school_year || "").localeCompare(
      String(left.school_year || ""),
    );
  });

// Resolve which academic period an admission "belongs to" based on its
// application date. Applicants usually apply BEFORE a term starts, so we:
//   1) first check if the application date falls inside a period's range,
//   2) otherwise fall back to the next period that starts on/after that date,
//   3) and finally fall back to the most recent period overall.
const getAcademicPeriodForAdmission = (admission, academicPeriods) => {
  if (!admission?.application_date || !Array.isArray(academicPeriods)) {
    return null;
  }

  const applicationDate = new Date(admission.application_date);
  if (Number.isNaN(applicationDate.getTime())) return null;

  const containingPeriod = academicPeriods.find((period) => {
    const startDate = new Date(period.start_date);
    const endDate = new Date(period.end_date);
    return (
      !Number.isNaN(startDate.getTime()) &&
      !Number.isNaN(endDate.getTime()) &&
      applicationDate >= startDate &&
      applicationDate <= endDate
    );
  });
  if (containingPeriod) return containingPeriod;

  const upcomingPeriods = academicPeriods
    .filter((period) => {
      const startDate = new Date(period.start_date);
      return !Number.isNaN(startDate.getTime()) && startDate >= applicationDate;
    })
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  if (upcomingPeriods[0]) return upcomingPeriods[0];

  const sortedByStart = [...academicPeriods].sort(
    (a, b) => new Date(b.start_date) - new Date(a.start_date),
  );
  return sortedByStart[0] || null;
};

const formatAcademicPeriod = (period) =>
  period
    ? `${period.school_year || "N/A"} - ${period.semester || "N/A"}`
    : "N/A";

// Unique key for an academic period, used for <select> values and matching.
// Prefers a real id if the API provides one, otherwise falls back to a
// school_year + semester composite key.
const getAcademicPeriodKey = (period) => {
  if (!period) return "";
  const id = period.id ?? period.period_id ?? period.academic_period_id;
  if (id !== undefined && id !== null && id !== "") return String(id);
  return `${period.school_year || ""}|${period.semester || ""}`;
};

// Turn a raw axios error into a short, human-readable message
const getErrorMessage = (err, fallback) => {
  const serverMessage =
    err.response?.data?.message || err.response?.data?.error;
  if (serverMessage) return serverMessage;
  if (err.response?.status === 400)
    return "Some fields are missing or invalid. Please check the form and try again.";
  if (err.response?.status === 404)
    return "This record no longer exists. It may have already been deleted.";
  if (err.response?.status === 409)
    return "A conflicting record already exists.";
  if (err.response?.status === 500)
    return "Something went wrong on the server. Please try again later.";
  if (!err.response)
    return "Can't reach the server. Check your connection and try again.";
  return fallback;
};

const StatusBadge = ({ status }) => {
  const colors = {
    Pending: "bg-yellow-100 text-yellow-800",
    "Under Review": "bg-blue-100 text-blue-800",
    Accepted: "bg-green-100 text-green-800",
    Rejected: "bg-red-100 text-red-800",
    Enrolled: "bg-purple-100 text-purple-800",
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        colors[status] || colors.Pending
      }`}
    >
      {status}
    </span>
  );
};

const Pagination = ({ currentPage, totalPages, setPage, totalItems }) => (
  <div className="flex justify-between items-center mt-4 text-sm text-slate-700">
    <span>
      Page {currentPage} of {totalPages} | Total: {totalItems}
    </span>
    <div className="flex gap-1">
      <button
        onClick={() => setPage((p) => Math.max(p - 1, 1))}
        disabled={currentPage === 1}
        className="p-1.5 rounded-md border disabled:opacity-50"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="px-2 py-1">{currentPage}</span>
      <button
        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="p-1.5 rounded-md border disabled:opacity-50"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  </div>
);

// --- Generic Confirm Modal (Yes / No), same pattern as AcademicSem ---
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  message,
  confirmLabel = "Yes",
  tone = "danger",
  loading = false,
}) => {
  if (!isOpen) return null;

  const confirmClasses =
    tone === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-green-600 hover:bg-green-700";

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium text-gray-900 text-center mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 ${confirmClasses}`}
          >
            {loading ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdmissionModal = ({ isOpen, onClose, onSubmit, mode, initialData }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    address: "",
    previous_school: "",
    year_graduated: "",
    program_applied: "",
    application_date: new Date().toISOString().split("T")[0],
    entrance_exam_score: "",
    interview_date: "",
    interview_notes: "",
    status: "Pending",
    decision_date: "",
    decision_by: "",
    remarks: "",
    documents_submitted: [],
  });
  const [admins, setAdmins] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);

  const documentOptions = [
    { value: "Birth Certificate", label: "Birth Certificate" },
    { value: "High School Diploma", label: "High School Diploma" },
    { value: "Transcript", label: "Transcript" },
    { value: "ID Card", label: "ID Card" },
    { value: "Medical Certificate", label: "Medical Certificate" },
    { value: "NBI Clearance", label: "NBI Clearance" },
    { value: "Good Moral Certificate", label: "Good Moral Certificate" },
    { value: "NCAE Score", label: "NCAE Score" },
    { value: "Proof of Income", label: "Proof of Income" },
    { value: "Parent/Guardian ID", label: "Parent/Guardian ID" },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return dateString.split("T")[0];
  };

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const API_BASE =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
        const res = await axios.get(`${API_BASE}/api/users?role=Admin`);
        setAdmins(res.data || []);
      } catch (err) {
        console.error("Error fetching admins:", err);
        toast.error(getErrorMessage(err, "Failed to load admin list."));
      }
    };
    fetchAdmins();
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      const documentsArray = initialData.documents_submitted
        ? initialData.documents_submitted
            .split(",")
            .map((doc) => ({
              value: doc.trim(),
              label: doc.trim(),
            }))
        : [];
      setSelectedDocuments(documentsArray);
      setFormData({
        first_name: initialData.first_name || "",
        middle_name: initialData.middle_name || "",
        last_name: initialData.last_name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        date_of_birth: formatDate(initialData.date_of_birth),
        gender: initialData.gender || "",
        address: initialData.address || "",
        previous_school: initialData.previous_school || "",
        year_graduated: initialData.year_graduated || "",
        program_applied: initialData.program_applied || "",
        application_date: formatDate(
          initialData.application_date ||
            new Date().toISOString().split("T")[0]
        ),
        entrance_exam_score: initialData.entrance_exam_score || "",
        interview_date: formatDate(initialData.interview_date),
        interview_notes: initialData.interview_notes || "",
        status: initialData.status || "Pending",
        decision_date: formatDate(initialData.decision_date),
        decision_by: initialData.decision_by || "",
        remarks: initialData.remarks || "",
        documents_submitted: initialData.documents_submitted || "",
        admission_id: initialData.admission_id,
      });
    } else {
      setSelectedDocuments([]);
      setFormData({
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        phone: "",
        date_of_birth: "",
        gender: "",
        address: "",
        previous_school: "",
        year_graduated: "",
        program_applied: "",
        application_date: new Date().toISOString().split("T")[0],
        entrance_exam_score: "",
        interview_date: "",
        interview_notes: "",
        status: "Pending",
        decision_date: "",
        decision_by: "",
        remarks: "",
        documents_submitted: "",
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">
              {mode === "add"
                ? "New Application"
                : mode === "edit"
                  ? "Edit Application"
                  : "View Application"}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Plus size={24} className="rotate-45" />
            </button>
          </div>
        </div>

        {/* Form Wrapper */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      first_name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={mode === "view"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Middle Name
                </label>
                <input
                  type="text"
                  value={formData.middle_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      middle_name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={mode === "view"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      last_name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={mode === "view"}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={mode === "view"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={mode === "view"}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      date_of_birth: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={mode === "view"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, gender: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={mode === "view"}
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
                disabled={mode === "view"}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Previous School
                </label>
                <input
                  type="text"
                  value={formData.previous_school}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      previous_school: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={mode === "view"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Year Graduated
                </label>
                <input
                  type="number"
                  value={formData.year_graduated}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      year_graduated: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={mode === "view"}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Program Applied *
                </label>
                <input
                  type="text"
                  value={formData.program_applied}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      program_applied: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. BSIT"
                  required
                  disabled={mode === "view"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Application Date *
                </label>
                <input
                  type="date"
                  value={formData.application_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      application_date: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={mode === "view"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Entrance Exam Score
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.entrance_exam_score}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      entrance_exam_score: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={mode === "view"}
                />
              </div>
            </div>

            {/* Interview Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Interview Date
                </label>
                <input
                  type="date"
                  value={formData.interview_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      interview_date: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={mode === "view"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={mode === "view"}
                >
                  <option value="Pending">Pending</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Enrolled">Enrolled</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Interview Notes
              </label>
              <textarea
                value={formData.interview_notes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    interview_notes: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
                disabled={mode === "view"}
              />
            </div>

            {/* Decision Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Decision Date
                </label>
                <input
                  type="date"
                  value={formData.decision_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      decision_date: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={mode === "view"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Decision By
                </label>
                <Select
                  options={admins.map((admin) => ({
                    value: admin.user_id,
                    label: admin.first_name + " " + admin.last_name,
                  }))}
                  value={
                    formData.decision_by && admins.length > 0
                      ? admins
                          .filter((admin) => admin.user_id === formData.decision_by)
                          .map((admin) => ({
                            value: admin.user_id,
                            label: admin.first_name + " " + admin.last_name,
                          }))[0] || null
                      : null
                  }
                  onChange={(option) =>
                    setFormData((prev) => ({
                      ...prev,
                      decision_by: option ? option.value : "",
                    }))
                  }
                  isDisabled={mode === "view"}
                  isClearable
                  placeholder="Select Admin..."
                  className="text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Remarks
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    remarks: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
                disabled={mode === "view"}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Documents Submitted (Select one or more)
              </label>
              <Select
                isMulti
                options={documentOptions}
                value={selectedDocuments}
                onChange={(options) => {
                  setSelectedDocuments(options || []);
                  setFormData((prev) => ({
                    ...prev,
                    documents_submitted: options
                      ? options.map((opt) => opt.value).join(", ")
                      : "",
                  }));
                }}
                isDisabled={mode === "view"}
                placeholder="Select documents..."
                className="text-sm"
              />
            </div>
          </div>

          {mode !== "view" && (
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 rounded-b-lg">
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  {mode === "add" ? "Create Application" : "Update Application"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

const BulkEnrollModal = ({ isOpen, onClose, admissions, onSubmit }) => {
  const [filterAcademicPeriod, setFilterAcademicPeriod] = useState("");
  const [filterProgram, setFilterProgram] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [academicPeriods, setAcademicPeriods] = useState([]);
  const [defaultAcademicPeriod, setDefaultAcademicPeriod] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchLookupData = async () => {
      try {
        const API_BASE =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

        const [departmentRes, programRes, academicPeriodRes, activePeriodRes] =
          await Promise.all([
            axios.get(`${API_BASE}/api/dept/departments`),
            axios.get(`${API_BASE}/api/programs`),
            axios.get(`${API_BASE}/api/academic-periods`),
            axios.get(`${API_BASE}/api/academic-periods/active`),
          ]);

        const departmentRows = Array.isArray(departmentRes.data)
          ? departmentRes.data
          : departmentRes.data?.data || [];
        const programRows = Array.isArray(programRes.data)
          ? programRes.data
          : programRes.data?.data || [];
        const academicPeriodRows = Array.isArray(academicPeriodRes.data)
          ? academicPeriodRes.data
          : academicPeriodRes.data?.data || [];
        const activePeriod =
          activePeriodRes.data?.period || activePeriodRes.data || null;

        const sortedAcademicPeriods = sortAcademicPeriods(academicPeriodRows);

        const initialPeriod =
          activePeriod && Object.keys(activePeriod).length > 0
            ? activePeriod
            : sortedAcademicPeriods[0] || null;
        const initialAcademicPeriodKey = getAcademicPeriodKey(initialPeriod);

        setDepartments(departmentRows);
        setPrograms(programRows);
        setAcademicPeriods(academicPeriodRows);
        setDefaultAcademicPeriod(initialAcademicPeriodKey);
        setFilterAcademicPeriod(initialAcademicPeriodKey);
        setFilterProgram("");
        setFilterDepartment("");
        setSelectedIds(new Set());
      } catch (error) {
        console.error("Error loading bulk enroll lookup data:", error);
        toast.error(getErrorMessage(error, "Failed to load bulk enroll data."));
      }
    };

    fetchLookupData();
  }, [isOpen]);

  // Get unique values for filters
  const programDepartmentMap = new Map(
    programs.map((program) => [
      program.name || program.program_name,
      program.department_name || program.department || "",
    ]),
  );

  const getProgramLabel = (program) =>
    program.code
      ? `${program.code} - ${program.name || program.program_name}`
      : program.name || program.program_name || "";

  // Unique list of academic periods (school year + semester) for the filter
  const academicPeriodOptions = sortAcademicPeriods(
    Array.from(
      academicPeriods
        .reduce((map, period) => {
          const key = getAcademicPeriodKey(period);
          if (!map.has(key)) {
            map.set(key, period);
          }
          return map;
        }, new Map())
        .values(),
    ),
  );

  const getAdmissionDepartment = (admission) =>
    admission.department_name ||
    admission.department ||
    programDepartmentMap.get(admission.program_applied) ||
    "";

  // Filter admissions based on criteria
  const filteredAdmissions = admissions.filter(a => {
    let match = a.status !== "Enrolled";

    if (filterAcademicPeriod) {
      const matchedPeriod = getAcademicPeriodForAdmission(a, academicPeriods);
      match =
        match && getAcademicPeriodKey(matchedPeriod) === filterAcademicPeriod;
    }

    if (filterProgram) {
      match = match && a.program_applied === filterProgram;
    }

    if (filterDepartment) {
      match = match && getAdmissionDepartment(a) === filterDepartment;
    }

    return match;
  });

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAdmissions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAdmissions.map(a => a.admission_id)));
    }
  };

  // Triggered by the "Enroll" button - opens the Yes/No confirm modal
  const handleBulkEnrollClick = () => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one applicant.");
      return;
    }
    setConfirmOpen(true);
  };

  // Triggered by "Yes" on the confirm modal - performs the actual submission
  const performBulkEnroll = async () => {
    setLoading(true);
    try {
      await onSubmit(Array.from(selectedIds));
      setSelectedIds(new Set());
      setFilterAcademicPeriod(defaultAcademicPeriod);
      setFilterProgram("");
      setFilterDepartment("");
    } catch (error) {
      console.error("Error during bulk enroll:", error);
      // toast for this is already handled by the parent onSubmit
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-100 border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users size={20} className="text-indigo-600" />
            Bulk Enroll Applicants
          </h2>
        </div>

        <div className="p-6 space-y-4">
          {/* Filters */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Academic Year & Semester
                </label>
                <select
                  value={filterAcademicPeriod}
                  onChange={(e) => setFilterAcademicPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Academic Periods</option>
                  {academicPeriodOptions.map((period) => {
                    const key = getAcademicPeriodKey(period);
                    return (
                      <option key={key} value={key}>
                        {formatAcademicPeriod(period)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Program Applied
                </label>
                <select
                  value={filterProgram}
                  onChange={(e) => setFilterProgram(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Programs</option>
                  {programs.map(prog => (
                    <option
                      key={prog.id || prog.program_id || prog.code || getProgramLabel(prog)}
                      value={prog.name || prog.program_name || ""}
                    >
                      {getProgramLabel(prog)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Department
                </label>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option
                      key={dept.id || dept.department_id || dept.name || dept.department_name}
                      value={dept.name || dept.department_name || ""}
                    >
                      {dept.name || dept.department_name || ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Found {filteredAdmissions.length} applicant(s) matching filters
            </p>
          </div>

          {/* Applicants List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900">
                Applicants ({selectedIds.size} selected)
              </h3>
              {filteredAdmissions.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {selectedIds.size === filteredAdmissions.length ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              {filteredAdmissions.length > 0 ? (
                <table className="min-w-full divide-y">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === filteredAdmissions.length && filteredAdmissions.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-300"
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Email</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Academic Period</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Program</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Department</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y">
                    {filteredAdmissions.map(applicant => (
                      <tr key={applicant.admission_id} className="hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(applicant.admission_id)}
                            onChange={() => toggleSelect(applicant.admission_id)}
                            className="rounded border-slate-300"
                          />
                        </td>
                        <td className="px-3 py-2 text-sm text-slate-900">
                          {applicant.first_name} {applicant.last_name}
                        </td>
                        <td className="px-3 py-2 text-sm text-slate-600">{applicant.email}</td>
                        <td className="px-3 py-2 text-sm text-slate-600">
                          {formatAcademicPeriod(
                            getAcademicPeriodForAdmission(applicant, academicPeriods)
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm text-slate-600">{applicant.program_applied}</td>
                        <td className="px-3 py-2 text-sm text-slate-600">{getAdmissionDepartment(applicant) || "N/A"}</td>
                        <td className="px-3 py-2 text-sm">
                          <StatusBadge status={applicant.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  No applicants match the selected filters
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 rounded-b-lg">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkEnrollClick}
              disabled={loading || selectedIds.size === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={16} />
              {loading ? "Enrolling..." : `Enroll ${selectedIds.size} Applicant(s)`}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => !loading && setConfirmOpen(false)}
        onConfirm={performBulkEnroll}
        message={`Are you sure you want to enroll ${selectedIds.size} applicant(s)? This action cannot be undone.`}
        confirmLabel="Enroll"
        tone="success"
        loading={loading}
      />
    </div>
  );
};

const Admission = () => {
  const [admissions, setAdmissions] = useState([]);
  const [academicPeriods, setAcademicPeriods] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentRecord, setCurrentRecord] = useState(null);
  const [bulkEnrollModalOpen, setBulkEnrollModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";

    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const fetchAdmissions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admissions`);
      setAdmissions(res.data);
    } catch (err) {
      console.error("Error fetching admissions:", err);
      toast.error(getErrorMessage(err, "Failed to load admissions."));
    }
  };

  const fetchAcademicPeriods = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/academic-periods`);
      const rows = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setAcademicPeriods(rows);
    } catch (err) {
      console.error("Error fetching academic periods:", err);
    }
  };

  useEffect(() => {
    fetchAdmissions();
    fetchAcademicPeriods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = admissions.filter(
    (a) =>
      (a.first_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.last_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.email || "").toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const displayed = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const handleSubmit = async (data) => {
    try {
      if (modalMode === "add") {
        await axios.post(`${API_BASE}/api/admissions`, data);
        toast.success("Application created successfully.");
      } else {
        await axios.put(
          `${API_BASE}/api/admissions/${data.admission_id}`,
          data,
        );
        toast.success("Application updated successfully.");
      }
      fetchAdmissions();
      setModalOpen(false);
      setCurrentRecord(null);
    } catch (err) {
      console.error("Error saving admission:", err);
      toast.error(
        getErrorMessage(
          err,
          modalMode === "add"
            ? "Failed to create application."
            : "Failed to update application.",
        ),
      );
    }
  };

  // Opens the Yes/No confirm modal for deleting a single admission
  const handleDelete = (id) => {
    setDeleteTargetId(id);
  };

  const cancelDelete = () => {
    if (deleteLoading) return;
    setDeleteTargetId(null);
  };

  const confirmDelete = async () => {
    const id = deleteTargetId;
    if (!id) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`${API_BASE}/api/admissions/${id}`);
      toast.success("Admission record deleted successfully.");
      fetchAdmissions();
    } catch (err) {
      console.error("Error deleting admission:", err);
      toast.error(getErrorMessage(err, "Failed to delete admission record."));
    } finally {
      setDeleteLoading(false);
      setDeleteTargetId(null);
    }
  };

  const handleBulkEnroll = async (selectedIds) => {
    try {
      await axios.post(`${API_BASE}/api/admissions/bulk-enroll`, {
        admission_ids: selectedIds,
      });

      toast.success(`Successfully enrolled ${selectedIds.length} applicant(s).`);
      fetchAdmissions();
      setBulkEnrollModalOpen(false);
    } catch (err) {
      console.error("Error during bulk enroll:", err);
      toast.error(getErrorMessage(err, "Failed to enroll applicants."));
      throw err;
    }
  };

  const openModal = (mode, record = null) => {
    setModalMode(mode);
    setCurrentRecord(record);
    setModalOpen(true);
  };

  return (
    <div className="p-4">
      <ToastContainer position="top-right" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText size={24} /> Admissions
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Manage student admission applications and status.
        </p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search applicants..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-3 py-2 border rounded-md"
          />
        </div>
        <button
          onClick={() => openModal("add")}
          className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center gap-2 hover:bg-indigo-700"
        >
          <Plus size={16} /> New Application
        </button>
        <button
          onClick={() => setBulkEnrollModalOpen(true)}
          className="ml-2 px-4 py-2 bg-green-600 text-white rounded-md flex items-center gap-2 hover:bg-green-700"
        >
          <Users size={16} /> Bulk Enroll
        </button>
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="min-w-full divide-y">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-semibold">ID</th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Name
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Email
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Program Applied
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Application Date
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Academic Period
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Status
              </th>
              <th className="px-3 py-2 text-right text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y">
            {displayed.length > 0 ? (
              displayed.map((admission) => (
                <tr key={admission.admission_id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-sm">
                    {admission.admission_id}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {admission.first_name} {admission.last_name}
                  </td>
                  <td className="px-3 py-2 text-sm">{admission.email}</td>
                  <td className="px-3 py-2 text-sm">
                    {admission.program_applied || "N/A"}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {formatDisplayDate(admission.application_date)}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {formatAcademicPeriod(
                      getAcademicPeriodForAdmission(admission, academicPeriods)
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <StatusBadge status={admission.status} />
                  </td>
                  <td className="px-3 py-2 text-right flex justify-end gap-2">
                    <button
                      onClick={() => openModal("view", admission)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => openModal("edit", admission)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(admission.admission_id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-4 text-slate-500 italic"
                >
                  No admissions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        setPage={setPage}
        totalItems={filtered.length}
      />

      <AdmissionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setCurrentRecord(null);
        }}
        onSubmit={handleSubmit}
        mode={modalMode}
        initialData={currentRecord}
      />

      <BulkEnrollModal
        isOpen={bulkEnrollModalOpen}
        onClose={() => setBulkEnrollModalOpen(false)}
        admissions={admissions}
        onSubmit={handleBulkEnroll}
      />

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        message={
          <>
            Are you sure you want to delete this admission record?{" "}
            <span className="text-red-400">This action cannot be undone!</span>
          </>
        }
        confirmLabel="Yes"
        tone="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default Admission;