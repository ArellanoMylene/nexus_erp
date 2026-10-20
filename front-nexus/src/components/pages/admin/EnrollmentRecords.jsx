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
import {
  exportRegistrationFormPDF,
  exportRegistrationFormsPDF,
} from "../../../utils/exportRegistrationForm";
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

const ALL_COURSES_VALUE = "__all_courses__";
const ALL_STUDENTS_VALUE = "__all_students__";

// Form-data mapping for enrollment creation/editing. Includes section_id
// so that registrars can transfer/change a student's section directly in edit mode.
const toEnrollmentFormData = (enrollment) => ({
  student_id: enrollment.student_id,
  student_ids: [enrollment.student_id].filter(Boolean),
  select_all_students: false,
  program_id: enrollment.student_program_id || enrollment.section_program_id || null,
  course_id: enrollment.course_id,
  course_ids: [enrollment.course_id].filter(Boolean),
  select_all_courses: false,
  curriculum_type: null,
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
  programs = [],
  sections = [],
}) => {
  const [formData, setFormData] = useState({
    student_id: null,
    student_ids: [],
    select_all_students: false,
    program_id: null,
    course_id: null,
    course_ids: [],
    select_all_courses: false,
    curriculum_type: null,
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
        student_ids: [],
        select_all_students: false,
        program_id: null,
        course_id: null,
        course_ids: [],
        select_all_courses: false,
        curriculum_type: null,
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

  useEffect(() => {
    if (!isOpen || mode !== "add" || formData.period_id || !periods.length) return;
    const activePeriod = periods.find((period) => period.is_active) || periods[0];
    setFormData((prev) => ({ ...prev, period_id: activePeriod.value }));
  }, [isOpen, mode, periods, formData.period_id]);

  const selectedProgram = findOptionByValue(programs, formData.program_id);
  const programMatches = (value) => !selectedProgram || [selectedProgram.code, selectedProgram.name]
    .some((programValue) => programValue && String(programValue).trim().toLowerCase() === String(value || "").trim().toLowerCase());
  const eligibleStudents = students.filter((student) =>
    programMatches(student.program)
    && (!formData.year_level || String(student.year_level || "").trim().toLowerCase() === String(formData.year_level).trim().toLowerCase()),
  );
  const eligibleCourses = courses.filter((course) =>
    (!formData.year_level || String(course.year_level || "").trim().toLowerCase() === String(formData.year_level).trim().toLowerCase())
    && (!selectedProgram?.department_id || String(course.department_id) === String(selectedProgram.department_id)),
  );
  const curriculumOptions = Array.from(new Set(
    eligibleCourses.map((course) => String(course.curriculum_type || "").trim()).filter(Boolean),
  )).sort((a, b) => a.localeCompare(b)).map((curriculum) => ({
    value: curriculum,
    label: `${curriculum} Curriculum`,
  }));
  const filteredCourses = eligibleCourses.filter((course) =>
    !formData.curriculum_type
    || String(course.curriculum_type || "").trim().toLowerCase() === String(formData.curriculum_type).trim().toLowerCase(),
  );
  const yearLevelOptions = Array.from(new Set([
    ...eligibleCourses.map((course) => course.year_level),
    ...eligibleStudents.map((student) => student.year_level),
  ].map((yearLevel) => String(yearLevel || "").trim()).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((yearLevel) => ({ value: yearLevel, label: yearLevel }));
  // Filter sections by academic period and program.
  const sectionOptions = (sections || [])
    .filter(
      (s) =>
        (!formData.period_id || String(s.period_id) === String(formData.period_id))
        && (!formData.program_id || String(s.program_id) === String(formData.program_id)),
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
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Academic Period *
              </label>
              <Select
                value={findOptionByValue(periods, formData.period_id)}
                onChange={(selected) => setFormData((prev) => ({ ...prev, period_id: selected?.value || null, section_id: null }))}
                options={periods}
                placeholder="Select academic period..."
                isDisabled={mode === "edit"}
                isClearable
                styles={{ control: (base) => ({ ...base, minHeight: "42px" }) }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Program *</label>
                <Select
                  value={findOptionByValue(programs, formData.program_id)}
                  onChange={(selected) => setFormData((prev) => ({
                    ...prev,
                    program_id: selected?.value || null,
                    student_id: null,
                    student_ids: [],
                    select_all_students: false,
                    year_level: "",
                    course_id: null,
                    course_ids: [],
                    select_all_courses: false,
                    curriculum_type: null,
                    section_id: null,
                  }))}
                  options={programs}
                  placeholder="Select program..."
                  isDisabled={mode === "edit"}
                  isClearable
                  required
                  styles={{ control: (base) => ({ ...base, minHeight: "42px" }) }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Year Level *</label>
                <Select
                  value={findOptionByValue(yearLevelOptions, formData.year_level)}
                  onChange={(selected) => setFormData((prev) => ({
                    ...prev,
                    year_level: selected?.value || "",
                    student_id: null,
                    student_ids: [],
                    select_all_students: false,
                    course_id: null,
                    course_ids: [],
                    select_all_courses: false,
                    curriculum_type: null,
                    section_id: null,
                  }))}
                  options={yearLevelOptions}
                  placeholder={formData.program_id ? "Select year level..." : "Select program first..."}
                  isDisabled={mode === "edit" || !formData.program_id}
                  isClearable
                  styles={{ control: (base) => ({ ...base, minHeight: "42px" }) }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Curriculum Type (Optional)</label>
                <Select
                  value={findOptionByValue(curriculumOptions, formData.curriculum_type)}
                  onChange={(selected) => setFormData((prev) => ({
                    ...prev,
                    curriculum_type: selected?.value || null,
                    course_id: null,
                    course_ids: [],
                    select_all_courses: false,
                    section_id: null,
                  }))}
                  options={curriculumOptions}
                  placeholder={formData.year_level ? "All Curricula" : "Select year level first..."}
                  isDisabled={mode === "edit" || !formData.year_level || !curriculumOptions.length}
                  isClearable
                  styles={{ control: (base) => ({ ...base, minHeight: "42px" }) }}
                />
              </div>

              {/* Course */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Course *
                </label>
                <Select
                  value={formData.select_all_courses
                    ? [{ value: ALL_COURSES_VALUE, label: `All Courses (${filteredCourses.length})` }]
                    : filteredCourses.filter((course) => formData.course_ids.includes(course.value))}
                  onChange={(selected) => setFormData((prev) => {
                    const selectedOptions = selected || [];
                    const selectAll = selectedOptions.some((course) => course.value === ALL_COURSES_VALUE);
                    const courseIds = selectAll
                      ? filteredCourses.map((course) => course.value)
                      : selectedOptions.map((course) => course.value);
                    return {
                      ...prev,
                      course_id: courseIds[0] || null,
                      course_ids: courseIds,
                      select_all_courses: selectAll,
                      section_id: null,
                    };
                  })}
                  options={[
                    { value: ALL_COURSES_VALUE, label: `All Courses (${filteredCourses.length})` },
                    ...filteredCourses,
                  ]}
                  placeholder={formData.year_level ? "Select one or more courses..." : "Select year level first..."}
                  isDisabled={mode === "edit" || !formData.year_level}
                  isClearable
                  isMulti
                  closeMenuOnSelect={false}
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
                placeholder={formData.course_ids.length ? "Select section to assign or transfer..." : "Select course first..."}
                isDisabled={mode === "edit" || !formData.period_id || !formData.program_id || !formData.course_ids.length}
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

            {/* Choose an admission/student after narrowing the available offerings. */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Student(s) *
              </label>
              <Select
                value={formData.select_all_students
                  ? [{ value: ALL_STUDENTS_VALUE, label: `All Students (${eligibleStudents.length})` }]
                  : eligibleStudents.filter((student) => formData.student_ids.includes(student.value))}
                onChange={(selected) => setFormData((prev) => {
                  const selectedOptions = selected || [];
                  const selectAll = selectedOptions.some((student) => student.value === ALL_STUDENTS_VALUE);
                  const studentIds = selectAll
                    ? eligibleStudents.map((student) => student.value)
                    : selectedOptions.map((student) => student.value);
                  return {
                    ...prev,
                    student_id: studentIds[0] || null,
                    student_ids: studentIds,
                    select_all_students: selectAll,
                  };
                })}
                options={[
                  { value: ALL_STUDENTS_VALUE, label: `All Students (${eligibleStudents.length})` },
                  ...eligibleStudents,
                ]}
                placeholder={formData.year_level ? "Select one or more students..." : "Select year level first..."}
                isDisabled={mode === "edit" || !formData.program_id || !formData.year_level}
                required
                isMulti
                closeMenuOnSelect={false}
                styles={{ control: (base) => ({ ...base, minHeight: "42px" }) }}
              />
              {formData.program_id && formData.year_level && eligibleStudents.length === 0 && (
                <p className="text-[11px] text-amber-700 mt-1">
                  No student records match this program and year level. Check that the admission has a linked student account with the correct program and year level.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Enrollment Date *
              </label>
              <input
                type="date"
                value={formData.enrollment_date}
                onChange={(e) => setFormData((prev) => ({
                  ...prev,
                  enrollment_date: e.target.value,
                }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
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
const SectioningModal = ({ isOpen, onClose, onSubmit, courses, coursesLoading, periods, programs }) => {
  const [formData, setFormData] = useState({
    period_id: null,
    program_id: null,
    year_level: null,
    curriculum_type: null,
    course_ids: [],
    select_all_courses: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const courseYearLevels = () => Array.from(new Set(
    (courses || [])
      .map((course) => String(course.year_level || "").trim())
      .filter(Boolean),
  )).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const yearLevelOptions = courseYearLevels().map((yearLevel) => ({
    value: yearLevel,
    label: yearLevel,
  }));
  const selectedProgram = findOptionByValue(programs, formData.program_id);
  const coursesForFilters = courses.filter((course) =>
    (!formData.year_level || String(course.year_level || "").trim().toLowerCase() === String(formData.year_level).trim().toLowerCase())
    && (!selectedProgram?.department_id || String(course.department_id) === String(selectedProgram.department_id)),
  );
  const curriculumTypeOptions = Array.from(new Set(
    coursesForFilters
      .map((course) => String(course.curriculum_type || "").trim())
      .filter(Boolean),
  )).sort((a, b) => a.localeCompare(b)).map((curriculumType) => ({
    value: curriculumType,
    label: `${curriculumType} Curriculum`,
  }));
  const filteredCourses = coursesForFilters.filter((course) =>
    !formData.curriculum_type
    || String(course.curriculum_type || "").trim().toLowerCase() === String(formData.curriculum_type).trim().toLowerCase(),
  );

  useEffect(() => {
    if (isOpen) {
      const activePeriod = periods.find((p) => p.is_active);
      const periodId = activePeriod ? activePeriod.value : (periods[0]?.value || null);
      setFormData({
        period_id: periodId,
        program_id: null,
        year_level: null,
        curriculum_type: null,
        course_ids: [],
        select_all_courses: false,
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
    if (!formData.year_level) {
      toast.error("Please select a course year level before running sectioning.", {
        position: "top-center",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const { select_all_courses, ...sectioningData } = formData;
      await onSubmit(sectioningData);
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
        className="bg-white rounded-xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Shuffle size={20} className="text-emerald-600" /> Run Program Sectioning
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Evenly balances students by academic program and year level across matching sections.
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
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Academic Period <span className="text-red-500">*</span>
              </label>
              <Select
                value={findOptionByValue(periods, formData.period_id)}
                onChange={(selected) => {
                  setFormData((prev) => ({
                    ...prev,
                    period_id: selected?.value || null,
                  }))
                }}
                options={periods}
                placeholder="Select period..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Course Year Level <span className="text-red-500">*</span>
              </label>
              <Select
                value={findOptionByValue(yearLevelOptions, formData.year_level)}
                onChange={(selected) =>
                  setFormData((prev) => ({
                    ...prev,
                    year_level: selected?.value || null,
                    curriculum_type: null,
                    course_ids: [],
                    select_all_courses: false,
                  }))
                }
                options={yearLevelOptions}
                placeholder={coursesLoading
                  ? "Loading course year levels..."
                  : yearLevelOptions.length ? "Select Year Level..." : "No year levels returned for courses"}
                isClearable={false}
                isDisabled={coursesLoading || !yearLevelOptions.length}
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
                    curriculum_type: null,
                    course_ids: [],
                    select_all_courses: false,
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
                Curriculum Type (Optional)
              </label>
              <Select
                value={findOptionByValue(curriculumTypeOptions, formData.curriculum_type)}
                onChange={(selected) =>
                  setFormData((prev) => ({
                    ...prev,
                    curriculum_type: selected?.value || null,
                    course_ids: [],
                    select_all_courses: false,
                  }))
                }
                options={curriculumTypeOptions}
                placeholder={coursesLoading
                  ? "Loading curriculum types..."
                  : "All Curricula"}
                isClearable
                isDisabled={coursesLoading || !curriculumTypeOptions.length}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Subject / Course (Optional)
              </label>
              <Select
                value={formData.select_all_courses
                  ? [{ value: ALL_COURSES_VALUE, label: `All Courses (${filteredCourses.length})` }]
                  : filteredCourses.filter((course) => formData.course_ids.includes(course.value))}
                onChange={(selected) =>
                  setFormData((prev) => {
                    const selectedOptions = selected || [];
                    const selectAll = selectedOptions.some((course) => course.value === ALL_COURSES_VALUE);
                    return {
                      ...prev,
                      select_all_courses: selectAll,
                      course_ids: selectAll
                        ? filteredCourses.map((course) => course.value)
                        : selectedOptions.map((course) => course.value),
                    };
                  })
                }
                options={[
                  { value: ALL_COURSES_VALUE, label: `All Courses (${filteredCourses.length})` },
                  ...filteredCourses,
                ]}
                placeholder={formData.year_level
                  ? `All ${formData.year_level} subjects (or select courses)...`
                  : "All Subjects (or select courses)..."}
                isClearable
                isMulti
                isDisabled={coursesLoading || !filteredCourses.length}
              />
              {formData.year_level && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Only courses labeled for {formData.year_level} are shown.
                </p>
              )}
            </div>

            <div className="md:col-span-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900">
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
  const [coursesLoading, setCoursesLoading] = useState(true);
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
  const [bulkExporting, setBulkExporting] = useState(false);

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
          program: s.course || null,
          year_level: s.year_level || null,
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
          department_id: p.department_id || null,
        }));
      setPrograms(programList);
    } catch (err) {
      console.error("Error fetching programs:", err);
      setPrograms([]);
    }
  };

  const getRegistrarInfo = async () => {
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
    return currentUser;
  };

  const getRegistrationFormDetails = async (enrollment) => {
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

    return { enrollment, studentInfo, invoice };
  };

  const handleExportPDF = async (enrollment) => {
    try {
      const [currentUser, form] = await Promise.all([
        getRegistrarInfo(),
        getRegistrationFormDetails(enrollment),
      ]);
      await exportRegistrationFormPDF(
        form.enrollment,
        form.studentInfo,
        currentUser,
        form.invoice,
      );
    } catch (err) {
      console.error("Error exporting registration form:", err);
      toast.error("Failed to generate the registration form PDF.", {
        position: "top-center",
      });
    }
  };

  const handleBulkExportPDF = async () => {
    if (!filtered.length || bulkExporting) return;
    setBulkExporting(true);
    try {
      const currentUser = await getRegistrarInfo();
      const forms = [];
      for (const enrollment of filtered) {
        forms.push({
          ...(await getRegistrationFormDetails(enrollment)),
          currentUser,
        });
      }
      await exportRegistrationFormsPDF(forms);
      toast.success(`Downloaded ${forms.length} registration forms in one PDF.`, {
        position: "top-center",
      });
    } catch (err) {
      console.error("Error exporting filtered registration forms:", err);
      toast.error("Failed to generate the filtered registration forms PDF.", {
        position: "top-center",
      });
    } finally {
      setBulkExporting(false);
    }
  };

  const fetchCourses = async () => {
    setCoursesLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/course/courses`);
      const courseList = (res.data || [])
        .filter((c) => c && (c.id || c.course_id))
        .map((c) => ({
          value: c.id || c.course_id,
          label: `${c.code || c.course_code || "N/A"} - ${
            c.title || c.course_title || "N/A"
          }`,
          year_level: c.year_level || null,
          department_id: c.department_id || null,
          curriculum_type: c.curriculum_type ?? c.curriculumType ?? c.curriculum ?? c.curriculum_name ?? null,
        }));
      setCourses(courseList);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setCourses([]);
    } finally {
      setCoursesLoading(false);
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
    const studentIds = modalMode === "add"
      ? [...new Set(data.student_ids || [])]
      : [data.student_id].filter(Boolean);
    const courseIds = modalMode === "add"
      ? [...new Set(data.course_ids || [])]
      : [data.course_id].filter(Boolean);
    if (!studentIds.length || !courseIds.length || !data.period_id || !data.year_level || (modalMode === "add" && !data.program_id)) {
      toast.error("Please fill in all required fields.", {
        position: "top-center",
      });
      return;
    }

    try {
      // Convert empty strings to null for numeric fields and clean section_id
      const cleanData = {
        ...data,
        student_id: studentIds[0],
        student_ids: modalMode === "add" ? studentIds : undefined,
        select_all_students: undefined,
        course_id: courseIds[0],
        course_ids: modalMode === "add" ? courseIds : undefined,
        select_all_courses: undefined,
        section_id: data.section_id || null,
        midterm_grade: data.midterm_grade === "" ? null : parseFloat(data.midterm_grade),
        final_grade: data.final_grade === "" ? null : parseFloat(data.final_grade),
      };

      if (modalMode === "add") {
        await axios.post(`${API_BASE}/api/enrollments`, cleanData);
        toast.success(`Enrollment added for ${studentIds.length} student(s) and ${courseIds.length} course(s).`, {
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
      const studentCount = summary.totalStudents ?? summary.totalEnrollments;

      if (summary.totalEnrollments === 0) {
        toast.info(
          "No enrollment records found matching the selected criteria.",
          { position: "top-center" },
        );
      } else if (summary.assigned > 0) {
        toast.success(
          `Sectioned ${summary.assigned}/${summary.totalEnrollments} enrollment(s) for ${studentCount} student(s).`,
          { position: "top-center" },
        );
      }
      if (summary.unassigned > 0) {
        const missingSections = unassigned.filter((item) => item.reason?.startsWith("No sections available")).length;
        const fullSections = unassigned.filter((item) => item.reason === "Program sections are full").length;
        const reasons = [
          missingSections ? `${missingSections} with no matching program section` : null,
          fullSections ? `${fullSections} because sections are full` : null,
        ].filter(Boolean).join("; ");
        toast.warn(
          `${summary.unassigned} enrollment(s) for ${new Set(unassigned.map((item) => String(item.student_id))).size} student(s) couldn't be placed${reasons ? `: ${reasons}` : "."}`,
          { position: "top-center" },
        );
        console.warn("Unassigned students:", unassigned);
      }
      if (summary.failed > 0) {
        toast.error(
          `${summary.failed} enrollment(s) failed to be sectioned. Check console for details.`,
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
            onClick={handleBulkExportPDF}
            disabled={!filtered.length || bulkExporting}
            className="px-4 py-2 bg-emerald-700 text-white rounded-md flex items-center gap-2 hover:bg-emerald-800 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download registration forms for all filtered enrollment records"
          >
            <FileDown size={16} />
            {bulkExporting
              ? "Preparing PDFs..."
              : `Download Filtered PDFs (${filtered.length})`}
          </button>
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
        programs={programs}
        sections={sections}
      />

      <SectioningModal
        isOpen={sectioningModalOpen}
        onClose={() => setSectioningModalOpen(false)}
        onSubmit={handleRunSectioning}
        courses={courses}
        periods={periods}
        programs={programs}
        coursesLoading={coursesLoading}
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
