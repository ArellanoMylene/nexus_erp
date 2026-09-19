import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../../api/axios";
import {
  ClipboardList,
  Search,
  Plus,
  Pencil,
  Trash2,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Shuffle,
} from "lucide-react";
import { exportRegistrationFormPDF } from "../../../utils/exportRegistrationForm";
const toDateInputValue = (value) => {
  if (!value) return "";
  const stringValue = String(value);
  return stringValue.includes("T") ? stringValue.split("T")[0] : stringValue;
};

const findOptionByValue = (options, value) => {
  if (value === null || value === undefined) return null;
  return (
    options.find((option) => String(option.value) === String(value)) || null
  );
};

// Form-data mapping for enrollment creation/editing. Includes section_id
// so that registrars can transfer/change a student's section directly in edit mode.
const toEnrollmentFormData = (enrollment) => ({
  student_id: enrollment.student_id,
  course_id: enrollment.course_id,
  period_id: enrollment.period_id,
  section_id: enrollment.section_id || null,
  year_level: enrollment.year_level || "",
  enrollment_date: toDateInputValue(
    enrollment.enrollment_date || new Date().toISOString().split("T")[0],
  ),
  status: enrollment.status || "Enrolled",
  midterm_grade: enrollment.midterm_grade ?? "",
  final_grade: enrollment.final_grade ?? "",
  remarks: enrollment.remarks || "",
  enrollment_id: enrollment.enrollment_id,
});

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
    Enrolled: "bg-green-100 text-green-800",
    Dropped: "bg-red-100 text-red-800",
    Completed: "bg-blue-100 text-blue-800",
    Failed: "bg-gray-100 text-gray-800",
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        colors[status] || colors.Enrolled
      }`}
    >
      {status}
    </span>
  );
};

// Small badge shown in the table when a row still has no section - makes
// it obvious at a glance who's waiting on "Run Sectioning".
const SectionBadge = ({ sectionName }) => {
  if (!sectionName) {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
        Unsectioned
      </span>
    );
  }
  return (
    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
      {sectionName}
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
        className="p-1.5 rounded-md border disabled:opacity-50 hover:bg-slate-100"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="px-2 py-1">{currentPage}</span>
      <button
        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="p-1.5 rounded-md border disabled:opacity-50 hover:bg-slate-100"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  </div>
);

// --- Generic Confirm Modal (Yes / No), same pattern as AcademicSem/Admission ---
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

// Add/Edit Enrollment modal.
// In edit mode, allows transferring / changing the student's section directly
// with live capacity info and transfer preview.
const EnrollmentModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
  students,
  courses,
  periods,
  sections = [],
}) => {
  const [formData, setFormData] = useState({
    student_id: null,
    course_id: null,
    period_id: null,
    section_id: null,
    year_level: "",
    enrollment_date: new Date().toISOString().split("T")[0],
    status: "Enrolled",
    midterm_grade: "",
    final_grade: "",
    remarks: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsSubmitting(false);
    if (!initialData) {
      setFormData({
        student_id: null,
        course_id: null,
        period_id: null,
        section_id: null,
        year_level: "",
        enrollment_date: new Date().toISOString().split("T")[0],
        status: "Enrolled",
        midterm_grade: "",
        final_grade: "",
        remarks: "",
      });
      return;
    }
    setFormData(toEnrollmentFormData(initialData));
  }, [initialData]);

  // Filter sections by selected academic period and format with capacity status
  const sectionOptions = (sections || [])
    .filter(
      (s) =>
        !formData.period_id ||
        String(s.period_id) === String(formData.period_id),
    )
    .map((s) => {
      const isCurrent =
        initialData &&
        String(initialData.section_id) === String(s.section_id);
      const currentCount = Number(s.current_enrolled) || 0;
      const maxCap = Number(s.max_capacity) || 40;
      const isFull = currentCount >= maxCap && !isCurrent;
      return {
        value: s.section_id,
        label: `${s.section_name}${
          s.program_code ? ` (${s.program_code})` : ""
        } — [${currentCount}/${maxCap} enrolled]${
          isFull ? " (FULL)" : ""
        }${isCurrent ? " (Current)" : ""}`,
        section_name: s.section_name,
        current_enrolled: currentCount,
        max_capacity: maxCap,
        program_code: s.program_code,
        isFull,
      };
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentSectionName = initialData?.section_name || "Unsectioned";
  const selectedSectionObj = sectionOptions.find(
    (o) => String(o.value) === String(formData.section_id),
  );
  const targetSectionName = selectedSectionObj
    ? selectedSectionObj.section_name
    : formData.section_id
      ? "Selected Section"
      : "Unsectioned";
  const isTransferring =
    mode === "edit" &&
    String(initialData?.section_id || "") !==
      String(formData.section_id || "");

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {mode === "add" ? "New Enrollment" : "Edit Enrollment / Section Transfer"}
              </h2>
              {mode === "edit" && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Update student details or transfer student to another section.
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
            {/* Student */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Student *
              </label>
              <Select
                value={findOptionByValue(students, formData.student_id)}
                onChange={(selected) =>
                  setFormData((prev) => ({
                    ...prev,
                    student_id: selected?.value || null,
                  }))
                }
                options={students}
                placeholder="Select student..."
                isDisabled={mode === "edit"}
                required
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: "#CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    boxShadow: "none",
                    minHeight: "42px",
                    "&:hover": {
                      borderColor: "#CBD5E1",
                    },
                    "&:focus-within": {
                      borderColor: "#4F46E5",
                      boxShadow: "0 0 0 3px rgba(79, 70, 229, 0.1)",
                    },
                  }),
                  input: (base) => ({
                    ...base,
                    color: "#1E293B",
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected ? "#4F46E5" : "#FFFFFF",
                    color: state.isSelected ? "#FFFFFF" : "#1E293B",
                    "&:hover": {
                      backgroundColor: "#EEF2FF",
                      color: "#1E293B",
                    },
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 9999,
                  }),
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Course */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Course *
                </label>
                <Select
                  value={findOptionByValue(courses, formData.course_id)}
                  onChange={(selected) =>
                    setFormData((prev) => ({
                      ...prev,
                      course_id: selected?.value || null,
                    }))
                  }
                  options={courses}
                  placeholder="Select course..."
                  isDisabled={mode === "edit"}
                  isClearable
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: "#CBD5E1",
                      backgroundColor: "#FFFFFF",
                      fontSize: "0.875rem",
                      boxShadow: "none",
                      minHeight: "42px",
                      "&:hover": {
                        borderColor: "#CBD5E1",
                      },
                      "&:focus-within": {
                        borderColor: "#4F46E5",
                        boxShadow: "0 0 0 3px rgba(79, 70, 229, 0.1)",
                      },
                    }),
                    input: (base) => ({
                      ...base,
                      color: "#1E293B",
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected ? "#4F46E5" : "#FFFFFF",
                      color: state.isSelected ? "#FFFFFF" : "#1E293B",
                      "&:hover": {
                        backgroundColor: "#EEF2FF",
                        color: "#1E293B",
                      },
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 9999,
                    }),
                  }}
                />
              </div>

              {/* Academic Period */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Academic Period *
                </label>
                <Select
                  value={findOptionByValue(periods, formData.period_id)}
                  onChange={(selected) =>
                    setFormData((prev) => ({
                      ...prev,
                      period_id: selected?.value || null,
                    }))
                  }
                  options={periods}
                  placeholder="Select period..."
                  isDisabled={mode === "edit"}
                  isClearable
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: "#CBD5E1",
                      backgroundColor: "#FFFFFF",
                      fontSize: "0.875rem",
                      boxShadow: "none",
                      minHeight: "42px",
                      "&:hover": {
                        borderColor: "#CBD5E1",
                      },
                      "&:focus-within": {
                        borderColor: "#4F46E5",
                        boxShadow: "0 0 0 3px rgba(79, 70, 229, 0.1)",
                      },
                    }),
                    input: (base) => ({
                      ...base,
                      color: "#1E293B",
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected ? "#4F46E5" : "#FFFFFF",
                      color: state.isSelected ? "#FFFFFF" : "#1E293B",
                      "&:hover": {
                        backgroundColor: "#EEF2FF",
                        color: "#1E293B",
                      },
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 9999,
                    }),
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Year Level */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Year Level *
                </label>
                <select
                  value={formData.year_level}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      year_level: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select...</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              {/* Enrollment Date */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Enrollment Date *
                </label>
                <input
                  type="date"
                  value={formData.enrollment_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      enrollment_date: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Section / Section Transfer */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {mode === "edit"
                    ? "Assigned Section (Transfer / Change Section)"
                    : "Assigned Section (Optional)"}
                </label>
                {mode === "edit" && (
                  <span className="text-[11px] text-slate-500">
                    Current:{" "}
                    <span className="font-semibold text-slate-700">
                      {currentSectionName}
                    </span>
                  </span>
                )}
              </div>
              <Select
                value={findOptionByValue(sectionOptions, formData.section_id)}
                onChange={(selected) =>
                  setFormData((prev) => ({
                    ...prev,
                    section_id: selected?.value || null,
                  }))
                }
                options={sectionOptions}
                placeholder="Select section to assign or transfer..."
                isClearable
                isOptionDisabled={(option) => option.isFull}
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: "#CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    boxShadow: "none",
                    minHeight: "42px",
                    "&:hover": {
                      borderColor: "#CBD5E1",
                    },
                    "&:focus-within": {
                      borderColor: "#4F46E5",
                      boxShadow: "0 0 0 3px rgba(79, 70, 229, 0.1)",
                    },
                  }),
                  input: (base) => ({
                    ...base,
                    color: "#1E293B",
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "#4F46E5"
                      : state.isDisabled
                      ? "#F1F5F9"
                      : "#FFFFFF",
                    color: state.isSelected
                      ? "#FFFFFF"
                      : state.isDisabled
                      ? "#94A3B8"
                      : "#1E293B",
                    cursor: state.isDisabled ? "not-allowed" : "default",
                    "&:hover": {
                      backgroundColor: state.isDisabled
                        ? "#F1F5F9"
                        : state.isSelected
                        ? "#4F46E5"
                        : "#EEF2FF",
                      color: state.isDisabled
                        ? "#94A3B8"
                        : state.isSelected
                        ? "#FFFFFF"
                        : "#1E293B",
                    },
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 9999,
                  }),
                }}
              />

              {isTransferring && (
                <div className="mt-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2.5 flex items-center gap-2">
                  <Shuffle size={16} className="text-amber-600 shrink-0" />
                  <div>
                    <span className="font-semibold">Section Transfer:</span> Student will be moved from{" "}
                    <span className="underline font-medium">
                      {currentSectionName}
                    </span>{" "}
                    to{" "}
                    <span className="underline font-medium">
                      {targetSectionName}
                    </span>
                    .
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-500 mt-1.5">
                {mode === "edit"
                  ? "Changing the section transfers the student and immediately updates section enrollment capacity."
                  : "Leave unassigned if the student will be sectioned in bulk later."}
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Enrolled">Enrolled</option>
                <option value="Dropped">Dropped</option>
                <option value="Completed">Completed</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Midterm Grade */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Midterm Grade
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.midterm_grade}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      midterm_grade: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>

              {/* Final Grade */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Final Grade
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.final_grade}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      final_grade: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Remarks */}
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
                placeholder="Additional notes..."
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 rounded-b-lg">
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? "Saving..."
                  : mode === "add"
                    ? "Create Enrollment"
                    : isTransferring
                      ? "Save & Transfer Section"
                      : "Update Enrollment"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Sectioning Modal ---
// Runs AFTER enrollment. Students are automatically grouped into sections
// that correspond to their academic program offering (e.g. BPA students into
// BPA sections like BPA - 1A, BAHISTO students into BAHISTO sections like BAHISTO-1A).
const SectioningModal = ({ isOpen, onClose, onSubmit, courses, periods, programs }) => {
  const [formData, setFormData] = useState({
    period_id: null,
    program_id: null,
    course_id: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const activePeriod = periods.find((p) => p.is_active);
      setFormData({
        period_id: activePeriod ? activePeriod.value : (periods[0]?.value || null),
        program_id: null,
        course_id: null,
      });
    }
  }, [isOpen, periods]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formData.period_id) {
      toast.error("Please select an academic period.", {
        position: "top-center",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Shuffle size={20} className="text-emerald-600" /> Run Program Sectioning
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Evenly distributes unsectioned students into sections tied to their academic program (e.g., BPA-1A, BAHISTO-1A).
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40 shrink-0"
            >
              <Plus size={24} className="rotate-45" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Academic Period <span className="text-red-500">*</span>
              </label>
              <Select
                value={findOptionByValue(periods, formData.period_id)}
                onChange={(selected) =>
                  setFormData((prev) => ({
                    ...prev,
                    period_id: selected?.value || null,
                  }))
                }
                options={periods}
                placeholder="Select period..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Program Offering (Optional)
              </label>
              <Select
                value={findOptionByValue(programs, formData.program_id)}
                onChange={(selected) =>
                  setFormData((prev) => ({
                    ...prev,
                    program_id: selected?.value || null,
                  }))
                }
                options={programs}
                placeholder="All Programs (or select specific program)..."
                isClearable
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Leave empty to section all programs at once into their respective program sections.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Subject / Course (Optional)
              </label>
              <Select
                value={findOptionByValue(courses, formData.course_id)}
                onChange={(selected) =>
                  setFormData((prev) => ({
                    ...prev,
                    course_id: selected?.value || null,
                  }))
                }
                options={courses}
                placeholder="All Subjects (or select specific course)..."
                isClearable
              />
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900">
              <span className="font-semibold block mb-0.5">Program Section Matching:</span>
              Students enrolled in <strong>BPA</strong> will only be placed into <strong>BPA</strong> sections, and students in <strong>BAHISTO</strong> into <strong>BAHISTO</strong> sections.
            </div>
          </div>

          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50 shadow"
            >
              {isSubmitting ? "Sectioning..." : "Run Sectioning"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EnrollmentRecords = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [sections, setSections] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterProgram, setFilterProgram] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentRecord, setCurrentRecord] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sectioningModalOpen, setSectioningModalOpen] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const fetchEnrollments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/enrollments`);
      setEnrollments(res.data);
    } catch (err) {
      console.error("Error fetching enrollments:", err);
      toast.error(getErrorMessage(err, "Failed to load enrollments."), {
        position: "top-center",
      });
    }
  };

  const fetchSections = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/sections`);
      setSections(res.data || []);
    } catch (err) {
      console.error("Error fetching sections:", err);
      setSections([]);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/users`);
      const studentList = (res.data || [])
        .filter((u) => u.role === "Student")
        .map((s) => ({
          value: s.user_id,
          label: `${s.first_name} ${s.last_name} (${
            s.student_number || s.email
          })`,
        }));
      setStudents(studentList);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  const fetchPrograms = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/programs`);
      const programList = (res.data || [])
        .filter((p) => p && (p.id || p.program_id))
        .map((p) => ({
          value: p.id || p.program_id,
          label: `${p.code} - ${p.name}`,
          code: p.code,
          name: p.name,
        }));
      setPrograms(programList);
    } catch (err) {
      console.error("Error fetching programs:", err);
      setPrograms([]);
    }
  };

  const handleExportPDF = async (enrollment) => {
    const firstName = localStorage.getItem("firstName") || "";
    const lastName = localStorage.getItem("lastName") || "";
    const role = localStorage.getItem("role") || "";
    // The logged-in user's own ID (registrar/admin generating the form),
    // NOT the student's ID.
    const loggedInUserId = localStorage.getItem("userId");

    let currentUser = {
      full_name: "",
      position: "",
    };

    try {
      if (!loggedInUserId) throw new Error("No logged-in user id in storage");
      const res = await api.get(`/api/users/${loggedInUserId}`);
      const u = res.data;

      currentUser = {
        full_name: `${u.first_name} ${u.last_name}`.trim(),
        position: u.employee_details?.position_title || "Registrar",
      };
    } catch {
      currentUser = {
        full_name: `${firstName} ${lastName}`.trim() || "Registrar",
        position: role || "Registrar",
      };
    }

    // Student profile
    let studentInfo = {};
    try {
      const res = await api.get(`/api/users/${enrollment.student_id}`);
      const u = res.data;
      studentInfo = {
        student_number: u.student_number,
        full_name: `${u.first_name} ${u.last_name}`,
        address: u.address || "",
        birthday: u.birthday || "",
        age: u.age || "",
        gender: u.gender || "",
        civil_status: u.civil_status || "",
        religion: u.religion || "",
        nationality: u.nationality || "",
        cell_phone: u.phone || "",
        email: u.email || "",
        program_year: `${u.program || enrollment.student_course || "N/A"} / ${enrollment.year_level || ""}`,
      };
    } catch {
      // If the student profile fails to load, proceed with an empty
      // studentInfo rather than failing the whole export.
    }

    // Invoice for this student/period
    let invoice = {};
    try {
      const res = await api.get(`/api/invoices`, {
        params: { academic_period_id: enrollment.period_id },
      });
      const invoices = res.data?.data || res.data || [];
      invoice =
        invoices.find(
          (inv) => String(inv.student_id) === String(enrollment.student_id),
        ) || {};
    } catch {
      // No invoice found/available - export continues without it.
    }

    try {
      await exportRegistrationFormPDF(enrollment, studentInfo, currentUser, invoice);
    } catch (err) {
      console.error("Error exporting registration form:", err);
      toast.error("Failed to generate the registration form PDF.", {
        position: "top-center",
      });
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/course/courses`);
      const courseList = (res.data || [])
        .filter((c) => c && (c.id || c.course_id))
        .map((c) => ({
          value: c.id || c.course_id,
          label: `${c.code || c.course_code || "N/A"} - ${
            c.title || c.course_title || "N/A"
          }`,
        }));
      setCourses(courseList);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setCourses([]);
    }
  };

  const fetchPeriods = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/academic-periods`);
      const periodList = (res.data || [])
        .filter((p) => p && (p.id || p.period_id))
        .map((p) => ({
          value: p.id || p.period_id,
          label: `${p.school_year || "N/A"} - ${p.semester || "N/A"}`,
          is_active: p.is_active,
        }));
      setPeriods(periodList);
    } catch (err) {
      console.error("Error fetching periods:", err);
      setPeriods([]);
    }
  };

  useEffect(() => {
    fetchEnrollments();
    fetchStudents();
    fetchPrograms();
    fetchCourses();
    fetchPeriods();
    fetchSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = enrollments.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch =
      (e.student_name || "").toLowerCase().includes(q) ||
      (e.student_number || "").toLowerCase().includes(q) ||
      (e.course_title || "").toLowerCase().includes(q) ||
      (e.course_code || "").toLowerCase().includes(q) ||
      (e.student_course || "").toLowerCase().includes(q) ||
      (e.student_program_code || "").toLowerCase().includes(q) ||
      (e.section_name || "").toLowerCase().includes(q);

    const matchStatus = !filterStatus || e.status === filterStatus.value;
    const matchProgram =
      !filterProgram ||
      String(e.student_program_id) === String(filterProgram.value) ||
      String(e.section_program_id) === String(filterProgram.value) ||
      (e.student_course && (e.student_course === filterProgram.code || e.student_course === filterProgram.name));

    return matchSearch && matchStatus && matchProgram;
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const displayed = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const handleSubmit = async (data) => {
    if (!data.student_id || !data.course_id || !data.period_id || !data.year_level) {
      toast.error("Please fill in all required fields.", {
        position: "top-center",
      });
      return;
    }

    try {
      // Convert empty strings to null for numeric fields and clean section_id
      const cleanData = {
        ...data,
        section_id: data.section_id || null,
        midterm_grade: data.midterm_grade === "" ? null : parseFloat(data.midterm_grade),
        final_grade: data.final_grade === "" ? null : parseFloat(data.final_grade),
      };

      if (modalMode === "add") {
        await axios.post(`${API_BASE}/api/enrollments`, cleanData);
        toast.success("Enrollment added successfully", {
          position: "top-center",
        });
      } else {
        await axios.put(
          `${API_BASE}/api/enrollments/${cleanData.enrollment_id}`,
          cleanData,
        );
        toast.success("Enrollment updated successfully", {
          position: "top-center",
        });
      }
      fetchEnrollments();
      fetchSections();
      setModalOpen(false);
      setCurrentRecord(null);
    } catch (err) {
      console.error("Error saving enrollment:", err);
      toast.error(getErrorMessage(err, "Failed to save enrollment"), {
        position: "top-center",
      });
    }
  };

  // Runs sectioning for students into sections matching their academic program
  const handleRunSectioning = async (data) => {
    try {
      const res = await axios.post(
        `${API_BASE}/api/enrollments/run-sectioning`,
        data,
      );
      const { summary, failed, unassigned } = res.data;

      if (summary.totalUnsectioned === 0) {
        toast.info(
          "No unsectioned students found matching the selected criteria.",
          { position: "top-center" },
        );
      } else {
        toast.success(
          `Sectioned ${summary.assigned}/${summary.totalUnsectioned} student(s) into their program sections.`,
          { position: "top-center" },
        );
      }
      if (summary.unassigned > 0) {
        toast.warn(
          `${summary.unassigned} student(s) couldn't be placed (missing or full program sections).`,
          { position: "top-center" },
        );
        console.warn("Unassigned students:", unassigned);
      }
      if (summary.failed > 0) {
        toast.error(
          `${summary.failed} student(s) failed to be sectioned. Check console for details.`,
          { position: "top-center" },
        );
        console.error("Sectioning failures:", failed);
      }

      fetchEnrollments();
      fetchSections();
      setSectioningModalOpen(false);
    } catch (err) {
      console.error("Error running sectioning:", err);
      toast.error(getErrorMessage(err, "Failed to run sectioning."), {
        position: "top-center",
      });
    }
  };

  // Opens the Yes/No confirm modal for deleting an enrollment
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
      await axios.delete(`${API_BASE}/api/enrollments/${id}`);
      fetchEnrollments();
      toast.success("Enrollment deleted successfully", {
        position: "top-center",
      });
    } catch (err) {
      console.error("Error deleting enrollment:", err);
      toast.error(getErrorMessage(err, "Failed to delete enrollment"), {
        position: "top-center",
      });
    } finally {
      setDeleteLoading(false);
      setDeleteTargetId(null);
    }
  };

  const openModal = (mode, record = null) => {
    setModalMode(mode);
    setCurrentRecord(record);
    setModalOpen(true);
  };

  const statusOptions = [
    { value: "Enrolled", label: "Enrolled" },
    { value: "Dropped", label: "Dropped" },
    { value: "Completed", label: "Completed" },
    { value: "Failed", label: "Failed" },
  ];

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList size={24} /> Student Subject Enlistment Records
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          View and manage student course enrollments. Sections are connected to academic program offerings (e.g., BPA - 1A, BAHISTO-1A) and assigned via "Run Sectioning".
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by student, number, program, course, or section..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-3 py-2 border rounded-md text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select
            value={filterProgram}
            onChange={(selected) => {
              setFilterProgram(selected);
              setPage(1);
            }}
            options={programs}
            placeholder="Filter by Program"
            isClearable
            className="w-48 text-sm"
          />
          <Select
            value={filterStatus}
            onChange={(selected) => {
              setFilterStatus(selected);
              setPage(1);
            }}
            options={statusOptions}
            placeholder="Status"
            isClearable
            className="w-36 text-sm"
          />
          <button
            onClick={() => setSectioningModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md flex items-center gap-2 hover:bg-emerald-700 text-sm font-medium shadow-sm"
          >
            <Shuffle size={16} /> Run Sectioning
          </button>
          <button
            onClick={() => openModal("add")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center gap-2 hover:bg-indigo-700 text-sm font-medium shadow-sm"
          >
            <Plus size={16} /> New Enrollment
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded border bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-bold uppercase text-slate-700">ID</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold uppercase text-slate-700">
                Student
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-bold uppercase text-slate-700">
                Program Offering
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-bold uppercase text-slate-700">
                Subject / Course
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-bold uppercase text-slate-700">
                Period
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-bold uppercase text-slate-700">
                Year Level
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-bold uppercase text-slate-700">
                Section
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-bold uppercase text-slate-700">
                Enrollment Date
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-bold uppercase text-slate-700">
                Status
              </th>
              <th className="px-3 py-2.5 text-center text-xs font-bold uppercase text-slate-700">
                Grades
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-bold uppercase text-slate-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {displayed.length > 0 ? (
              displayed.map((enrollment) => (
                <tr
                  key={enrollment.enrollment_id}
                  className="hover:bg-slate-50 text-sm"
                >
                  <td className="px-3 py-2 font-mono text-xs text-slate-500">
                    #{enrollment.enrollment_id}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-900">{enrollment.student_name}</div>
                    {enrollment.student_number && (
                      <div className="text-xs text-slate-500">{enrollment.student_number}</div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-xs">
                      {enrollment.student_program_code || enrollment.student_course || "General"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-800">{enrollment.course_code}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[180px]">{enrollment.course_title}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {enrollment.school_year && enrollment.semester
                      ? `${enrollment.school_year} · ${enrollment.semester}`
                      : "N/A"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {enrollment.year_level || "N/A"}
                  </td>
                  <td className="px-3 py-2 font-semibold">
                    <SectionBadge sectionName={enrollment.section_name} />
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {toDateInputValue(enrollment.enrollment_date) || "N/A"}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={enrollment.status} />
                  </td>
                  <td className="px-3 py-2 text-center text-xs">
                    {enrollment.midterm_grade || "-"} /{" "}
                    {enrollment.final_grade || "-"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openModal("edit", enrollment)}
                        className="text-indigo-600 hover:text-indigo-800 p-1 hover:bg-slate-100 rounded"
                        title="Edit Record"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(enrollment.enrollment_id)}
                        className="text-red-600 hover:text-red-800 p-1 hover:bg-slate-100 rounded"
                        title="Delete Record"
                      >
                        <Trash2 size={15} />
                      </button>
                      <button
                        onClick={() => handleExportPDF(enrollment)}
                        className="text-emerald-600 hover:text-emerald-800 p-1 hover:bg-slate-100 rounded"
                        title="Download Registration Form"
                      >
                        <FileDown size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={11}
                  className="text-center py-8 text-slate-500 italic"
                >
                  No enrollment records found.
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

      <EnrollmentModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setCurrentRecord(null);
        }}
        onSubmit={handleSubmit}
        mode={modalMode}
        initialData={currentRecord}
        students={students}
        courses={courses}
        periods={periods}
        sections={sections}
      />

      <SectioningModal
        isOpen={sectioningModalOpen}
        onClose={() => setSectioningModalOpen(false)}
        onSubmit={handleRunSectioning}
        courses={courses}
        periods={periods}
        programs={programs}
      />

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        message={
          <>
            Are you sure you want to delete this enrollment record?{" "}
            <span className="text-red-500 font-semibold">This action cannot be undone!</span>
          </>
        }
        confirmLabel="Yes, Delete"
        tone="danger"
        loading={deleteLoading}
      />

      <ToastContainer
        position="top-center"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
      />
    </div>
  );
};

export default EnrollmentRecords;