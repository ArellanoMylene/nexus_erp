import React, { useState, useEffect, useRef } from "react";
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
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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

const calculateAge = (value) => {
  const dateValue = toDateInputValue(value);
  if (!dateValue) return "";
  const [year, month, day] = dateValue.split("-").map(Number);
  const birthDate = new Date(year, month - 1, day);
  if (Number.isNaN(birthDate.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (
    today.getMonth() < birthDate.getMonth()
    || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
  ) age -= 1;
  return age >= 0 ? String(age) : "";
};

const formatBirthday = (value) => {
  const dateValue = toDateInputValue(value);
  if (!dateValue) return "";
  const [year, month, day] = dateValue.split("-");
  return year && month && day ? `${month}/${day}/${year}` : dateValue;
};

const formatPwdStatus = (value) => {
  if (value === true || value === 1 || value === "1") return "Yes";
  if (value === false || value === 0 || value === "0") return "No";
  return value || "";
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
        enrollment_date: mode === "bulk-edit" ? "" : new Date().toISOString().split("T")[0],
        status: mode === "bulk-edit" ? "" : "Enrolled",
        midterm_grade: "",
        final_grade: "",
        remarks: "",
      });
      return;
    }
    setFormData(toEnrollmentFormData(initialData));
  }, [initialData, mode, isOpen]);

  useEffect(() => {
    if (!isOpen || mode === "edit" || formData.period_id || !periods.length) return;
    const activePeriod = periods.find((period) => period.is_active) || periods[0];
    setFormData((prev) => ({ ...prev, period_id: activePeriod.value }));
  }, [isOpen, mode, periods, formData.period_id]);

  const selectedProgram = findOptionByValue(programs, formData.program_id);
  const selectedPeriod = findOptionByValue(periods, formData.period_id);
  const selectedSemester = String(selectedPeriod?.semester || "").trim().toLowerCase();
  const programMatches = (value) => !selectedProgram || [selectedProgram.code, selectedProgram.name]
    .some((programValue) => programValue && String(programValue).trim().toLowerCase() === String(value || "").trim().toLowerCase());
  const eligibleStudents = students.filter((student) =>
    programMatches(student.program)
    && (!formData.year_level || String(student.year_level || "").trim().toLowerCase() === String(formData.year_level).trim().toLowerCase()),
  );
  const eligibleCourses = courses.filter((course) =>
    (!formData.year_level || String(course.year_level || "").trim().toLowerCase() === String(formData.year_level).trim().toLowerCase())
    && (!selectedSemester || String(course.semester_offer || "").trim().toLowerCase() === selectedSemester)
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
                {mode === "add"
                  ? "New Enrollment"
                  : mode === "bulk-edit"
                    ? "Bulk Edit Existing Enrollments"
                    : "Edit Enrollment / Section Transfer"}
              </h2>
              {mode === "bulk-edit" ? (
                <p className="text-xs text-slate-500 mt-0.5">
                  Select existing students and courses. Only fields you fill in will be updated; no enrollments will be created.
                </p>
              ) : mode === "edit" && (
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
                onChange={(selected) => setFormData((prev) => ({
                  ...prev,
                  period_id: selected?.value || null,
                  course_id: null,
                  course_ids: [],
                  select_all_courses: false,
                  section_id: null,
                }))}
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
                  {mode === "bulk-edit" ? "Existing Course(s) *" : "Course *"}
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

            {mode !== "bulk-edit" && (
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
            )}

            {/* Choose an admission/student after narrowing the available offerings. */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                {mode === "bulk-edit" ? "Existing Student(s) *" : "Student(s) *"}
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
                {mode === "bulk-edit" ? "Enrollment Date (Optional)" : "Enrollment Date *"}
              </label>
              <input
                type="date"
                value={formData.enrollment_date}
                onChange={(e) => setFormData((prev) => ({
                  ...prev,
                  enrollment_date: e.target.value,
                }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required={mode !== "bulk-edit"}
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
                {mode === "bulk-edit" && <option value="">No change</option>}
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
                  ? mode === "bulk-edit" ? "Updating..." : "Saving..."
                  : mode === "add"
                    ? "Create Enrollment"
                    : mode === "bulk-edit"
                      ? "Update Existing Matches"
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
      // The picker shows the program's curriculum courses. When "All Courses"
      // is selected, omit that list so the backend sections every matching
      // year/curriculum enrollment for those students, including GE courses
      // owned by another department.
      if (select_all_courses) sectioningData.course_ids = [];
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
                  Showing this program's {formData.year_level} courses. All Courses also sections shared subjects enrolled by matching students.
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
  const [bulkExportProgress, setBulkExportProgress] = useState(null);
  const [singleExportingId, setSingleExportingId] = useState(null);
  const [expandedStudentIds, setExpandedStudentIds] = useState(() => new Set());
  const invoiceCacheRef = useRef(new Map());

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
          student_number: s.student_number || "",
          full_name: `${s.first_name || ""} ${s.last_name || ""}`.trim(),
          address: s.permanent_address || s.permanentAddress || s.mailing_address || s.mailingAddress || [
            s.permanent_sitio,
            s.permanent_barangay,
            s.permanent_city_municipality,
            s.permanent_province,
          ].filter(Boolean).join(", ") || [
            s.present_sitio,
            s.present_barangay,
            s.present_city_municipality,
            s.present_province,
          ].filter(Boolean).join(", ") || s.student_details?.mailing_address || "",
          birthday: formatBirthday(s.date_of_birth || s.birthday || s.dateOfBirth),
          age: s.age || calculateAge(s.date_of_birth || s.birthday || s.dateOfBirth),
          gender: s.gender || "",
          civil_status: s.civil_status || s.civilStatus || s.student_details?.civil_status || "",
          religion: s.religion || s.student_details?.religion || "",
          pwd: formatPwdStatus(s.is_pwd ?? s.pwd),
          nationality: s.nationality || s.citizenship || "",
          indigenous_people: s.indigenous_people || "",
          phone: s.phone || "",
          email: s.email || "",
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
    // Use the already-loaded enrollment rows as the source of truth for the
    // student's subjects. Fetching the same schedule once per PDF page made
    // large filtered exports intermittently produce empty course tables.
    const subjects = enrollments
      .filter((row) =>
        String(row.student_id) === String(enrollment.student_id)
        && String(row.period_id) === String(enrollment.period_id),
      )
      .map((row) => ({
        subject_code: row.course_code || "N/A",
        subject_name: row.course_title || row.course_name || "N/A",
        units: Number(row.units) || 3,
        section_code: row.section_name || row.section_code || "",
        room: row.section_room || row.room || "",
      }));

    // Use the student list already loaded for this screen instead of making
    // one extra API request for every exported student.
    const u = students.find((student) => String(student.value) === String(enrollment.student_id)) || {};
    const program = [
      enrollment.student_program_code,
      enrollment.section_program_code,
      enrollment.student_program_name,
      enrollment.section_program_name,
      enrollment.student_course,
      u.program,
    ]
      .map((value) => String(value || "").trim())
      .find((value) => value && !/^(n\/?a|general)$/i.test(value));
    const studentInfo = {
      student_number: u.student_number || enrollment.student_number || "",
      full_name: u.full_name || enrollment.student_name || "",
      address: u.address || "",
      birthday: u.birthday || "",
      age: u.age || "",
      gender: u.gender || "",
      civil_status: u.civil_status || "",
      religion: u.religion || "",
      pwd: u.pwd || "",
      nationality: u.nationality || "",
      indigenous_people: u.indigenous_people || "",
      cell_phone: u.phone || "",
      email: u.email || "",
      program_year: `${program || "N/A"} / ${enrollment.year_level || u.year_level || ""}`,
    };

    // The invoice endpoint returns every invoice for a period. Cache that
    // response once per period and reuse it for each student in the export.
    const periodKey = String(enrollment.period_id);
    if (!invoiceCacheRef.current.has(periodKey)) {
      const invoicesRequest = api.get(`/api/invoices`, {
        params: { academic_period_id: enrollment.period_id },
      })
        .then((res) => res.data?.data || res.data || [])
        .catch((err) => {
          console.error("Failed to load invoices for registration PDF:", err);
          return [];
        });
      invoiceCacheRef.current.set(periodKey, invoicesRequest);
    }
    const invoices = await invoiceCacheRef.current.get(periodKey);
    const invoice = invoices.find(
      (inv) => String(inv.student_id) === String(enrollment.student_id),
    ) || {};

    return { enrollment, studentInfo, invoice, subjects };
  };

  const handleExportPDF = async (enrollment) => {
    if (singleExportingId || bulkExporting) return;
    setSingleExportingId(enrollment.enrollment_id);
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
        { subjects: form.subjects },
      );
    } catch (err) {
      console.error("Error exporting registration form:", err);
      toast.error("Failed to generate the registration form PDF.", {
        position: "top-center",
      });
    } finally {
      setSingleExportingId(null);
    }
  };

  const handleBulkExportPDF = async () => {
    if (!filteredExportRows.length || bulkExporting) return;
    setBulkExporting(true);
    setBulkExportProgress({ phase: "preparing", current: 0, total: filteredExportRows.length });
    try {
      const currentUser = await getRegistrarInfo();
      const forms = [];
      for (let index = 0; index < filteredExportRows.length; index += 1) {
        const enrollment = filteredExportRows[index];
        forms.push({
          ...(await getRegistrationFormDetails(enrollment)),
          currentUser,
        });
        setBulkExportProgress({ phase: "preparing", current: index + 1, total: filteredExportRows.length });
      }
      setBulkExportProgress({ phase: "generating", current: 0, total: forms.length });
      await exportRegistrationFormsPDF(forms, (current, total) => {
        setBulkExportProgress({ phase: "generating", current, total });
      });
      toast.success(`Downloaded forms for ${forms.length} student(s) in one PDF.`, {
        position: "top-center",
      });
    } catch (err) {
      console.error("Error exporting filtered registration forms:", err);
      toast.error("Failed to generate the filtered registration forms PDF.", {
        position: "top-center",
      });
    } finally {
      setBulkExporting(false);
      setBulkExportProgress(null);
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
          semester_offer: c.semester_offer || null,
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
          semester: p.semester || null,
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

  // Keep the table and export filters student-based. A matching course row
  // selects that student, then the visible group contains all their courses.
  const matchingEnrollmentByStudent = new Map();
  for (const enrollment of filtered) {
    const studentKey = String(enrollment.student_id);
    if (!matchingEnrollmentByStudent.has(studentKey)) {
      matchingEnrollmentByStudent.set(studentKey, enrollment);
    }
  }
  const studentGroupsById = new Map();
  for (const enrollment of enrollments) {
    const studentKey = String(enrollment.student_id);
    if (!matchingEnrollmentByStudent.has(studentKey)) continue;
    if (!studentGroupsById.has(studentKey)) {
      studentGroupsById.set(studentKey, {
        student_id: enrollment.student_id,
        student_name: enrollment.student_name,
        student_number: enrollment.student_number,
        student_program_code: enrollment.student_program_code,
        student_course: enrollment.student_course,
        matching_enrollment: matchingEnrollmentByStudent.get(studentKey),
        enrollments: [],
      });
    }
    studentGroupsById.get(studentKey).enrollments.push(enrollment);
  }
  const studentGroups = Array.from(studentGroupsById.values());
  const filteredExportRows = studentGroups.map((group) => group.matching_enrollment);
  const totalPages = Math.ceil(studentGroups.length / rowsPerPage);
  const displayed = studentGroups.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const toggleStudentExpanded = (studentId) => {
    setExpandedStudentIds((current) => {
      const next = new Set(current);
      const key = String(studentId);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSubmit = async (data) => {
    if (modalMode === "bulk-edit") {
      const studentIds = [...new Set(data.student_ids || [])];
      const courseIds = [...new Set(data.course_ids || [])];
      if (!studentIds.length || !courseIds.length || !data.period_id || !data.program_id || !data.year_level) {
        toast.error("Select an academic period, program, year level, students, and courses to target.", {
          position: "top-center",
        });
        return;
      }

      const updates = {};
      if (data.enrollment_date) updates.enrollment_date = data.enrollment_date;
      if (data.status) updates.status = data.status;
      if (data.midterm_grade !== "") updates.midterm_grade = data.midterm_grade;
      if (data.final_grade !== "") updates.final_grade = data.final_grade;
      if (String(data.remarks || "").trim()) updates.remarks = data.remarks;
      if (!Object.keys(updates).length) {
        toast.error("Enter at least one field to update.", { position: "top-center" });
        return;
      }

      try {
        const res = await axios.put(`${API_BASE}/api/enrollments/bulk`, {
          student_ids: studentIds,
          course_ids: courseIds,
          period_id: data.period_id,
          updates,
        });
        if (res.data.updated > 0) {
          toast.success(`Updated ${res.data.updated} existing enrollment(s).`, { position: "top-center" });
        } else {
          toast.info("No existing enrollments matched the selected students, courses, and period.", { position: "top-center" });
        }
        fetchEnrollments();
        setModalOpen(false);
        setCurrentRecord(null);
      } catch (err) {
        console.error("Error bulk updating enrollments:", err);
        toast.error(getErrorMessage(err, "Failed to bulk update enrollments."), { position: "top-center" });
      }
      return;
    }

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
            disabled={!filteredExportRows.length || bulkExporting || Boolean(singleExportingId)}
            className="px-4 py-2 bg-emerald-700 text-white rounded-md flex items-center gap-2 hover:bg-emerald-800 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download registration forms for all filtered enrollment records"
          >
            {bulkExporting
              ? <Loader2 size={16} className="animate-spin" />
              : <FileDown size={16} />}
            {bulkExporting
              ? bulkExportProgress?.phase === "generating"
                ? `Generating PDF ${bulkExportProgress.current}/${bulkExportProgress.total}...`
                : `Preparing ${bulkExportProgress?.current || 0}/${bulkExportProgress?.total || filteredExportRows.length}...`
              : `Download Student PDFs (${filteredExportRows.length})`}
          </button>
          <button
            onClick={() => setSectioningModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md flex items-center gap-2 hover:bg-emerald-700 text-sm font-medium shadow-sm"
          >
            <Shuffle size={16} /> Run Sectioning
          </button>
          <button
            onClick={() => openModal("bulk-edit")}
            className="px-4 py-2 bg-amber-600 text-white rounded-md flex items-center gap-2 hover:bg-amber-700 text-sm font-medium shadow-sm"
          >
            <Pencil size={15} /> Bulk Edit
          </button>
          <button
            onClick={() => openModal("add")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center gap-2 hover:bg-indigo-700 text-sm font-medium shadow-sm"
          >
            <Plus size={16} /> New Enrollment
          </button>
        </div>
      </div>

      {bulkExporting && bulkExportProgress && (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3" role="status" aria-live="polite" aria-busy="true">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm text-emerald-900">
            <span className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              {bulkExportProgress.phase === "preparing"
                ? `Preparing registration forms: ${bulkExportProgress.current} of ${bulkExportProgress.total}`
                : `Building PDF: ${bulkExportProgress.current} of ${bulkExportProgress.total}`}
            </span>
            <span>{bulkExportProgress.total
              ? Math.round((bulkExportProgress.current / bulkExportProgress.total) * 100)
              : 0}%</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-emerald-100"
            role="progressbar"
            aria-label="PDF download progress"
            aria-valuemin={0}
            aria-valuemax={bulkExportProgress.total}
            aria-valuenow={bulkExportProgress.current}
          >
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-200"
              style={{ width: `${bulkExportProgress.total
                ? Math.min(100, (bulkExportProgress.current / bulkExportProgress.total) * 100)
                : 0}%` }}
            />
          </div>
          {bulkExportProgress.phase === "generating" && (
            <p className="mt-2 text-xs text-emerald-800">Keep this page open until the download starts.</p>
          )}
        </div>
      )}

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
            {displayed.length > 0 ? displayed.map((group) => {
              const enrollment = group.matching_enrollment;
              const studentKey = String(group.student_id);
              const expanded = expandedStudentIds.has(studentKey);
              const courseCodes = [...new Set(group.enrollments.map((row) => row.course_code).filter(Boolean))];
              const periods = [...new Set(group.enrollments
                .map((row) => row.school_year && row.semester ? `${row.school_year} · ${row.semester}` : null)
                .filter(Boolean))];
              const yearLevels = [...new Set(group.enrollments.map((row) => row.year_level).filter(Boolean))];
              const sectionsForStudent = [...new Set(group.enrollments.map((row) => row.section_name || "Unsectioned"))];
              const statuses = [...new Set(group.enrollments.map((row) => row.status).filter(Boolean))];
              const isExporting = String(singleExportingId) === String(enrollment.enrollment_id);

              return (
                <React.Fragment key={studentKey}>
                  <tr className="hover:bg-slate-50 text-sm">
                    <td className="px-3 py-2 font-mono text-xs text-slate-500">
                      #{group.student_number || group.student_id}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-900">{group.student_name}</div>
                      {group.student_number && <div className="text-xs text-slate-500">{group.student_number}</div>}
                    </td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-xs">
                        {group.student_program_code || group.student_course || "General"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => toggleStudentExpanded(group.student_id)}
                        className="flex items-center gap-1 text-left font-medium text-indigo-700 hover:text-indigo-900"
                        aria-expanded={expanded}
                      >
                        {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        {courseCodes.length} course(s)
                      </button>
                      <div className="mt-0.5 max-w-[200px] truncate text-xs text-slate-500">
                        {courseCodes.slice(0, 3).join(", ")}{courseCodes.length > 3 ? ", …" : ""}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {periods[0] || "N/A"}{periods.length > 1 ? ` +${periods.length - 1} more` : ""}
                    </td>
                    <td className="px-3 py-2 text-xs">{yearLevels.join(", ") || "N/A"}</td>
                    <td className="px-3 py-2 text-xs font-semibold">
                      {sectionsForStudent.join(", ")}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {toDateInputValue(enrollment.enrollment_date) || "N/A"}
                    </td>
                    <td className="px-3 py-2">
                      {statuses.length === 1
                        ? <StatusBadge status={statuses[0]} />
                        : <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">Mixed</span>}
                    </td>
                    <td className="px-3 py-2 text-center text-xs">
                      {group.enrollments.length === 1
                        ? `${enrollment.midterm_grade || "-"} / ${enrollment.final_grade || "-"}`
                        : <button type="button" onClick={() => toggleStudentExpanded(group.student_id)} className="text-indigo-700 hover:underline">Per course</button>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => toggleStudentExpanded(group.student_id)}
                          className="rounded p-1 text-slate-600 hover:bg-slate-100"
                          title={expanded ? "Hide courses" : "Manage courses"}
                          aria-label={expanded ? "Hide courses" : "Manage courses"}
                        >
                          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportPDF(enrollment)}
                          disabled={bulkExporting || Boolean(singleExportingId)}
                          className="rounded p-1 text-emerald-600 hover:bg-slate-100 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                          title={isExporting ? "Generating registration form..." : "Download Registration Form"}
                          aria-label={isExporting ? "Generating registration form" : "Download registration form"}
                        >
                          {isExporting ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded && (
                    <tr key={`${studentKey}-courses`} className="bg-slate-50">
                      <td colSpan={11} className="px-6 py-3">
                        <div className="overflow-x-auto rounded border border-slate-200 bg-white">
                          <table className="min-w-full text-xs">
                            <thead className="bg-slate-100 text-slate-700">
                              <tr>
                                <th className="px-3 py-2 text-left">Course</th>
                                <th className="px-3 py-2 text-left">Period / Year</th>
                                <th className="px-3 py-2 text-left">Section</th>
                                <th className="px-3 py-2 text-left">Status</th>
                                <th className="px-3 py-2 text-left">Grades</th>
                                <th className="px-3 py-2 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {group.enrollments.map((courseEnrollment) => (
                                <tr key={courseEnrollment.enrollment_id}>
                                  <td className="px-3 py-2">
                                    <span className="font-medium">{courseEnrollment.course_code}</span>
                                    <span className="ml-2 text-slate-500">{courseEnrollment.course_title}</span>
                                  </td>
                                  <td className="px-3 py-2">
                                    {courseEnrollment.school_year} · {courseEnrollment.semester} · {courseEnrollment.year_level || "N/A"}
                                  </td>
                                  <td className="px-3 py-2"><SectionBadge sectionName={courseEnrollment.section_name} /></td>
                                  <td className="px-3 py-2"><StatusBadge status={courseEnrollment.status} /></td>
                                  <td className="px-3 py-2">
                                    {courseEnrollment.midterm_grade || "-"} / {courseEnrollment.final_grade || "-"}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <div className="flex justify-end gap-2">
                                      <button type="button" onClick={() => openModal("edit", courseEnrollment)} className="rounded p-1 text-indigo-600 hover:bg-slate-100" title="Edit enrollment">
                                        <Pencil size={14} />
                                      </button>
                                      <button type="button" onClick={() => handleDelete(courseEnrollment.enrollment_id)} className="rounded p-1 text-red-600 hover:bg-slate-100" title="Delete enrollment">
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            }) : (
              <tr>
                <td
                  colSpan={11}
                  className="text-center py-8 text-slate-500 italic"
                >
                  No students found for these filters.
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
        totalItems={studentGroups.length}
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
