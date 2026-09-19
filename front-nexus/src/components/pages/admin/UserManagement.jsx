import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import {
  Users, UserPlus, Edit, Trash2, ShieldCheck, GraduationCap, Briefcase,
  X, ListChecks, Eye, FileText, FileDown, ChevronRight, ChevronLeft,
  Search, User2Icon,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { generateCSV, downloadCSV, downloadPDF } from "../../../utils/exportHelpers";

/* -------------------------
   UTILITY FUNCTIONS
   ------------------------- */
const formatDateForInput = (dateValue) => {
  if (!dateValue) return "";
  if (typeof dateValue === "string") {
    if (dateValue.includes("T")) return dateValue.split("T")[0];
    return dateValue;
  }
  return "";
};

// Turn a raw axios error into a short, human-readable message
const getErrorMessage = (err, fallback) => {
  const serverMessage =
    err.response?.data?.message || err.response?.data?.error;
  if (serverMessage) return serverMessage;
  if (err.response?.status === 400)
    return "Some fields are missing or invalid. Please check the form and try again.";
  if (err.response?.status === 404)
    return "This user no longer exists. It may have already been deleted.";
  if (err.response?.status === 409)
    return "A user with these details already exists.";
  if (err.response?.status === 500)
    return "Something went wrong on the server. Please try again later.";
  if (!err.response)
    return "Can't reach the server. Check your connection and try again.";
  return fallback;
};

/**
 * Builds the API payload for a user.
 *
 * NOTE ON SCHEMA MISMATCH:
 * `registerStudentSchema` (create) and `updateStudentSchema` (edit) on the
 * backend use two different field vocabularies for the same entity
 * (e.g. create wants `courseProgram`, update wants `course`; create wants
 * `academicYear`/`semester`/full family+education history, update only
 * wants the older simple set). Both zod schemas strip unknown keys by
 * default (neither uses `.strict()`), so it's safe to send the union of
 * both vocabularies — whichever endpoint receives it will just use the
 * fields it recognizes and ignore the rest.
 */
const buildPayload = (formData, role) => {
  const common = {
    email:            formData.email,
    password:         formData.password        || undefined,
    firstName:        formData.firstName,
    middleName:       formData.middleName       || undefined,
    lastName:         formData.lastName,
    suffix:           formData.suffix           || undefined,
    dateOfBirth:      formData.dateOfBirth      || undefined,
    gender:           formData.gender           || undefined,
    phone:            formData.phone            || undefined,
    permanentAddress: formData.permanentAddress || undefined,
  };

  if (role === "Student") {
    return {
      ...common,
      studentNumber: formData.studentNumber || undefined,

      // registerStudentSchema (create) fields
      academicYear:           formData.academicYear           || undefined,
      semester:                formData.semester                || undefined,
      courseProgram:           formData.courseProgram           || undefined,
      yearLevel:               formData.yearLevel               || undefined,
      dateRegistered:          formData.dateRegistered          || undefined,
      civilStatus:             formData.civilStatus             || undefined,
      religion:                formData.religion                || undefined,
      isPwd:                   formData.isPwd                   || undefined,
      indigenousPeople:        formData.indigenousPeople        || undefined,
      zipCode:                 formData.zipCode                 || undefined,
      birthPlace:              formData.birthPlace              || undefined,
      citizenship:             formData.citizenship              || undefined,
      studentType:             formData.studentType             || undefined,

      elementarySchool:            formData.elementarySchool            || undefined,
      elementaryYearGraduated:     formData.elementaryYearGraduated     || undefined,
      juniorHighSchool:            formData.juniorHighSchool            || undefined,
      juniorHighYearGraduated:     formData.juniorHighYearGraduated     || undefined,
      seniorHighSchool:            formData.seniorHighSchool            || undefined,
      seniorHighYearGraduated:     formData.seniorHighYearGraduated     || undefined,
      collegeProgramAttended:      formData.collegeProgramAttended      || undefined,
      schoolYearAttended:          formData.schoolYearAttended          || undefined,

      fatherName:              formData.fatherName              || undefined,
      fatherStatus:             formData.fatherStatus            || undefined,
      fatherResidenceStreet:    formData.fatherResidenceStreet   || undefined,
      fatherResidenceBarangay:  formData.fatherResidenceBarangay || undefined,
      fatherResidenceCity:      formData.fatherResidenceCity     || undefined,
      fatherResidenceProvince:  formData.fatherResidenceProvince || undefined,
      fatherResidenceZipCode:   formData.fatherResidenceZipCode  || undefined,
      fatherOccupation:         formData.fatherOccupation        || undefined,
      fatherPhone:              formData.fatherPhone             || undefined,

      motherName:               formData.motherName              || undefined,
      motherStatus:             formData.motherStatus            || undefined,
      motherResidenceStreet:    formData.motherResidenceStreet   || undefined,
      motherResidenceBarangay:  formData.motherResidenceBarangay || undefined,
      motherResidenceCity:      formData.motherResidenceCity     || undefined,
      motherResidenceProvince:  formData.motherResidenceProvince || undefined,
      motherResidenceZipCode:   formData.motherResidenceZipCode  || undefined,
      motherOccupation:         formData.motherOccupation        || undefined,
      motherPhone:              formData.motherPhone             || undefined,

      guardianName:             formData.guardianName             || undefined,
      guardianRelationship:     formData.guardianRelationship     || undefined,
      guardianResidenceStreet:  formData.guardianResidenceStreet  || undefined,
      guardianResidenceBarangay:formData.guardianResidenceBarangay|| undefined,
      guardianResidenceCity:    formData.guardianResidenceCity    || undefined,
      guardianResidenceProvince:formData.guardianResidenceProvince|| undefined,
      guardianResidenceZipCode: formData.guardianResidenceZipCode || undefined,
      guardianOccupation:       formData.guardianOccupation       || undefined,
      guardianPhone:            formData.guardianPhone            || undefined,

      otherFinancialAssistance: formData.otherFinancialAssistance || undefined,
      scholarshipAssistance1:   formData.scholarshipAssistance1   || undefined,
      scholarshipAssistance2:   formData.scholarshipAssistance2   || undefined,
      scholarshipAssistance3:   formData.scholarshipAssistance3   || undefined,

      // updateStudentSchema (edit) compatibility fields — same data, older names
      course:         formData.courseProgram    || undefined,
      major:          formData.major            || undefined,
      previousSchool: formData.previousSchool   || undefined,
      yearGraduated:  formData.yearGraduated    || undefined,
      mailingAddress: formData.mailingAddress   || undefined,
      parentPhone:    formData.parentPhone      || undefined,
    };
  }

  return {
    ...common,
    role,
    employeeId:            formData.employeeId            || undefined,
    department:            formData.department            || undefined,
    positionTitle:         formData.positionTitle         || undefined,
    dateHired:             formData.dateHired             || undefined,
    status:                formData.status                || undefined,
    specialization:        formData.specialization        || undefined,
    educationalAttainment: formData.educationalAttainment || undefined,
    licenseNumber:         formData.licenseNumber         || undefined,
    accessLevel:           formData.accessLevel           || undefined,
  };
};

/* -------------------------
   INITIAL STATE TEMPLATES
   ------------------------- */
const initialCommonState = {
  email: "", password: "", confirmPassword: "",
  firstName: "", middleName: "", lastName: "", suffix: "",
  dateOfBirth: "", gender: "", phone: "", permanentAddress: "", profilePicture: "",
};

const studentSpecifics = {
  // enrollment
  studentNumber: "", academicYear: "", semester: "", courseProgram: "", yearLevel: "",
  dateRegistered: "",
  // personal / status
  civilStatus: "", religion: "", isPwd: "", indigenousPeople: "", zipCode: "",
  birthPlace: "", citizenship: "", studentType: "",
  // education history
  elementarySchool: "", elementaryYearGraduated: "",
  juniorHighSchool: "", juniorHighYearGraduated: "",
  seniorHighSchool: "", seniorHighYearGraduated: "",
  collegeProgramAttended: "", schoolYearAttended: "",
  // father
  fatherName: "", fatherStatus: "", fatherResidenceStreet: "", fatherResidenceBarangay: "",
  fatherResidenceCity: "", fatherResidenceProvince: "", fatherResidenceZipCode: "",
  fatherOccupation: "", fatherPhone: "",
  // mother
  motherName: "", motherStatus: "", motherResidenceStreet: "", motherResidenceBarangay: "",
  motherResidenceCity: "", motherResidenceProvince: "", motherResidenceZipCode: "",
  motherOccupation: "", motherPhone: "",
  // guardian
  guardianName: "", guardianRelationship: "", guardianResidenceStreet: "",
  guardianResidenceBarangay: "", guardianResidenceCity: "", guardianResidenceProvince: "",
  guardianResidenceZipCode: "", guardianOccupation: "", guardianPhone: "",
  // financial assistance
  otherFinancialAssistance: "", scholarshipAssistance1: "", scholarshipAssistance2: "",
  scholarshipAssistance3: "",
  // legacy / edit-only fields (kept so existing records still populate & save correctly)
  parentPhone: "", mailingAddress: "", major: "", previousSchool: "", yearGraduated: "",
};

const employeeCommon = {
  employeeId: "", department: "", positionTitle: "", status: "Active", dateHired: "",
};

const adminSpecifics = {
  accessLevel: "Standard Admin", specialization: "", educationalAttainment: "", licenseNumber: "",
};

const facultySpecifics = {
  specialization: "", educationalAttainment: "", licenseNumber: "",
};

const ROLE_CONFIG = {
  Student:    { icon: GraduationCap, color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  Admin:      { icon: ShieldCheck,   color: "bg-red-100 text-red-800 border-red-300" },
  Faculty:    { icon: Briefcase,     color: "bg-green-100 text-green-800 border-green-300" },
  Staff:      { icon: Users,         color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  HR:         { icon: Briefcase,     color: "bg-pink-100 text-pink-800 border-pink-300" },
  Accounting: { icon: FileText,      color: "bg-blue-100 text-blue-800 border-blue-300" },
};

const PERMISSIONS_LIST = [
  { id: "C1", name: "Can Manage Courses",       description: "Create, edit, and delete course offerings." },
  { id: "S1", name: "Can View Student Grades",  description: "Access student academic performance records." },
  { id: "U1", name: "Can Manage User Accounts", description: "Create, edit, and delete non-Admin user accounts." },
  { id: "A1", name: "Can Access Audit Logs",    description: "View system activity and security logs." },
];

const INITIAL_RBAC_STATE = {
  Admin:      PERMISSIONS_LIST.map((p) => ({ ...p, allowed: true })),
  Faculty:    PERMISSIONS_LIST.map((p) => ({ ...p, allowed: p.id === "S1" })),
  Staff:      PERMISSIONS_LIST.map((p) => ({ ...p, allowed: p.id === "U1" })),
  Student:    PERMISSIONS_LIST.map((p) => ({ ...p, allowed: false })),
  HR:         PERMISSIONS_LIST.map((p) => ({ ...p, allowed: false })),
  Accounting: PERMISSIONS_LIST.map((p) => ({ ...p, allowed: false })),
};

/* -------------------------
   REUSABLE INPUT COMPONENTS
   ------------------------- */
const inputClass =
  "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500";

const disabledInputClass =
  "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-100 text-slate-500 cursor-not-allowed";

const FieldLabel = ({ children }) => (
  <label className="block text-xs font-medium text-slate-700 mb-1.5">{children}</label>
);

const TextInput = ({ name, placeholder, value, onChange, type = "text", required = false, label = "", disabled = false }) => (
  <div>
    {label && <FieldLabel>{label}</FieldLabel>}
    <input
      type={type} name={name} placeholder={placeholder} value={value ?? ""}
      onChange={onChange} required={required} disabled={disabled}
      className={disabled ? disabledInputClass : inputClass}
    />
  </div>
);

const NativeSelect = ({ name, value, onChange, children, label = "", required = false, disabled = false }) => (
  <div>
    {label && <FieldLabel>{label}</FieldLabel>}
    <select name={name} value={value} onChange={onChange} required={required} disabled={disabled}
      className={`${inputClass} appearance-none`}>
      {children}
    </select>
  </div>
);

const ReactSelectInput = ({ name, placeholder, value, onChange, options, label = "", isMulti = false, isClearable = true, isDisabled = false }) => {
  let selectedValue = null;
  if (isMulti && Array.isArray(value)) {
    selectedValue = options.filter((opt) => value.includes(opt.value));
  } else if (value) {
    selectedValue = options.find((opt) => opt.value === value) || null;
  }

  const handleChange = (selected) => {
    if (isMulti) {
      onChange({ target: { name, value: selected ? selected.map((s) => s.value) : [] } });
    } else {
      onChange({ target: { name, value: selected ? selected.value : "" } });
    }
  };

  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <Select
        name={name} options={options} value={selectedValue} onChange={handleChange}
        placeholder={placeholder || `Select ${name}`} isMulti={isMulti}
        isClearable={isClearable} isSearchable isDisabled={isDisabled} className="text-sm"
        styles={{
          control: (base) => ({
            ...base, minHeight: "38px", borderColor: "rgb(203 213 225)",
            "&:hover": { borderColor: "rgb(148 163 184)" }, borderRadius: "0.5rem", fontSize: "14px",
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? "rgb(79 70 229)" : state.isFocused ? "rgb(229 231 235)" : "white",
            color: state.isSelected ? "white" : "rgb(15 23 42)", cursor: "pointer", fontSize: "14px",
          }),
          menuList: (base) => ({ ...base, maxHeight: "200px" }),
        }}
      />
    </div>
  );
};

const TextAreaInput = ({ name, placeholder, value, onChange, label = "" }) => (
  <div>
    {label && <FieldLabel>{label}</FieldLabel>}
    <textarea name={name} placeholder={placeholder} value={value ?? ""} onChange={onChange} rows={2} className={inputClass} />
  </div>
);

const SectionDivider = ({ title }) => (
  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-200 mt-1 mb-3">
    {title}
  </p>
);

/* -------------------------
   GENERIC CONFIRM MODAL (same pattern as AcademicCalendar.jsx)
   ------------------------- */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  message,
  confirmLabel = "Yes",
  tone = "danger",
}) => {
  if (!isOpen) return null;

  const confirmClasses =
    tone === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-green-600 hover:bg-green-700";

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
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
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${confirmClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------
   VIEW USER MODAL
   ------------------------- */
const ViewUserModal = ({ isOpen, onClose, user }) => {
  const formatDOB = (dob) => {
    if (!dob) return "N/A";
    const date = new Date(dob);
    if (isNaN(date)) return "N/A";
    return date.toLocaleDateString("en-GB");
  };

  const roleSpecificDetails = useMemo(() => {
    if (!user) return [];
    const fields = [];
    if (user.role === "Student") {
      fields.push(
        { label: "Student Number",    value: user.student_number },
        { label: "Academic Year",     value: user.academic_year },
        { label: "Semester",          value: user.semester },
        { label: "Course / Program",  value: `${user.course_program || user.course || "N/A"}${user.major ? " / " + user.major : ""}` },
        { label: "Year Level",        value: user.year_level },
        { label: "Civil Status",      value: user.civil_status },
        { label: "Student Type",      value: user.student_type },
        { label: "Previous School",   value: user.previous_school || user.senior_high_school },
        { label: "Father / Mother",   value: user.father_name || user.mother_name },
        { label: "Guardian",          value: user.guardian_name },
        { label: "Parent / Guardian Phone", value: user.parent_phone || user.guardian_phone },
        { label: "Mailing Address",   value: user.mailing_address },
        { label: "Scholarship / Assistance", value: user.scholarship_assistance1 || user.other_financial_assistance },
      );
    } else {
      fields.push(
        { label: "Employee ID",       value: user.employee_id },
        { label: "Department",        value: user.department },
        { label: "Position Title",    value: user.position_title },
        { label: "Date Hired",        value: formatDOB(user.date_hired) },
        { label: "Employment Status", value: user.status },
      );
      if (user.role === "Faculty" || user.role === "Admin") {
        fields.push(
          { label: "Specialization",         value: user.specialization },
          { label: "Educational Attainment", value: user.educational_attainment },
          { label: "License Number",         value: user.license_number },
        );
      }
      if (user.role === "Admin") {
        fields.push({ label: "Access Level", value: user.access_level });
      }
    }
    return fields;
  }, [user]);

  if (!user) return null;
  const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.Staff;
  const RoleIcon = roleConfig.icon;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-6 py-4 rounded-t-lg flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Viewing: {user.first_name} {user.last_name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex flex-col items-center pb-4 border-b border-slate-200">
                <div className="h-16 w-16 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-800 text-2xl font-bold mb-3">
                  {user.first_name?.[0] || "?"}{user.last_name?.[0] || "?"}
                </div>
                <h4 className="text-lg font-bold text-slate-900">{user.first_name} {user.last_name}</h4>
                <p className="text-sm text-slate-600">{user.email}</p>
                <span className={`mt-2 px-3 py-1 inline-flex items-center gap-1 text-xs font-bold rounded-full ${roleConfig.color} border`}>
                  <RoleIcon className="w-3 h-3" />{user.role}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase">Phone</p>
                  <p className="font-semibold text-slate-900 text-sm">{user.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase">DOB / Gender</p>
                  <p className="font-semibold text-slate-900 text-sm">{formatDOB(user.date_of_birth)} / {user.gender || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase">Permanent Address</p>
                  <p className="font-semibold text-slate-900 text-sm">{user.permanent_address || "N/A"}</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 bg-slate-50 rounded-lg border border-slate-200 p-4">
              <h5 className="font-bold text-slate-800 pb-3 border-b border-slate-200 flex items-center gap-2 mb-4">
                <Briefcase className="w-4 h-4" /> Role Specific Details
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roleSpecificDetails.length > 0 ? (
                  roleSpecificDetails.map((item, idx) => (
                    <div key={idx}>
                      <p className="text-xs font-medium text-slate-600 uppercase">{item.label}</p>
                      <p className="font-semibold text-slate-900 text-sm">{item.value || "N/A"}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-slate-500 py-4 col-span-2">No specific role details available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 rounded-b-lg flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-sm font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------
   CREATE / EDIT MODAL
   ------------------------- */
const UserFormModal = ({ isOpen, onClose, onSubmit, isEditing, selectedRole, onRoleChange, formData, onInputChange, departments, programs }) => {
  const [activeTab, setActiveTab] = useState("personal");
  const [studentSubTab, setStudentSubTab] = useState("enrollment");

  useEffect(() => {
    if (isOpen) {
      setActiveTab("personal");
      setStudentSubTab("enrollment");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const roleOptions = [
   /*  { value: "Student",    label: "Student" }, */
    { value: "Admin",      label: "Admin" },
    { value: "Faculty",    label: "Faculty" },
    { value: "Staff",      label: "Staff" },
    { value: "HR",         label: "HR" },
    { value: "Accounting", label: "Accounting" },
  ];

  const genderOptions    = [
    { value: "Male",              label: "Male" },
    { value: "Female",            label: "Female" },
    { value: "Non-Binary",        label: "Non-Binary" },
    { value: "Prefer not to say", label: "Prefer not to say" },
  ];
  const statusOptions    = [
    { value: "Active",     label: "Active" },
    { value: "Leave",      label: "On Leave" },
    { value: "Terminated", label: "Terminated" },
  ];
  const yearLevelOptions = [
    { value: "1st Year", label: "1st Year" },
    { value: "2nd Year", label: "2nd Year" },
    { value: "3rd Year", label: "3rd Year" },
    { value: "4th Year", label: "4th Year" },
    { value: "5th Year", label: "5th Year" },
    { value: "Irregular", label: "Irregular" },
  ];
  const semesterOptions = [
    { value: "1st Semester", label: "1st Semester" },
    { value: "2nd Semester", label: "2nd Semester" },
    { value: "Summer",       label: "Summer" },
  ];
  const civilStatusOptions = [
    { value: "Single",    label: "Single" },
    { value: "Married",   label: "Married" },
    { value: "Widowed",   label: "Widowed" },
    { value: "Separated", label: "Separated" },
  ];
  const studentTypeOptions = [
    { value: "New Student", label: "New Student" },
    { value: "Transferee",  label: "Transferee" },
    { value: "Returnee",    label: "Returnee" },
    { value: "Continuing",  label: "Continuing" },
  ];
  const yesNoOptions = [
    { value: "Yes", label: "Yes" },
    { value: "No",  label: "No" },
  ];
  const parentStatusOptions = [
    { value: "Living",   label: "Living" },
    { value: "Deceased", label: "Deceased" },
  ];

  const isEmployee = ["Admin", "Faculty", "Staff", "HR", "Accounting"].includes(selectedRole);
  const isAutoGeneratedId = !isEditing && !!formData.employeeId;

  const studentSubTabs = [
    { id: "enrollment", label: "Enrollment" },
    { id: "education",  label: "Education History" },
    { id: "family",     label: "Family & Guardian" },
    { id: "financial",  label: "Financial Assistance" },
  ];

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-6 py-4 rounded-t-lg flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">{isEditing ? "Edit user record" : "Create new user account"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Tab bar */}
            <div className="flex border-b border-slate-200 mb-5">
              {["personal", "role"].map((tab) => (
                <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                    activeTab === tab ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-indigo-600"
                  }`}>
                  {tab === "personal" ? "Personal info" : "Role details"}
                </button>
              ))}
            </div>

            {/* ── TAB: PERSONAL INFO ── */}
            {activeTab === "personal" && (
              <div className="space-y-5">
                <div>
                  <SectionDivider title="Role & account" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ReactSelectInput name="role" label="User role *" value={selectedRole} onChange={onRoleChange}
                      options={roleOptions} isDisabled={isEditing} isClearable={false} placeholder="Select role" />
                    <TextInput type="email" name="email" label="Email address *" value={formData.email} onChange={onInputChange} required />
                    <TextInput type="password" name="password" label={isEditing ? "Password (leave blank to keep)" : "Password *"}
                      value={formData.password} onChange={onInputChange} required={!isEditing} />
                    <TextInput type="password" name="confirmPassword" label={isEditing ? "Confirm password (leave blank to keep)" : "Confirm password *"}
                      value={formData.confirmPassword} onChange={onInputChange} required={!isEditing} />
                  </div>
                </div>
                <div>
                  <SectionDivider title="Personal information" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TextInput name="firstName"  label="First name *"     value={formData.firstName}  onChange={onInputChange} required />
                    <TextInput name="middleName" label="Middle name"       value={formData.middleName} onChange={onInputChange} />
                    <TextInput name="lastName"   label="Last name *"       value={formData.lastName}   onChange={onInputChange} required />
                    <TextInput name="suffix"     label="Suffix (Jr., Sr.)" value={formData.suffix}     onChange={onInputChange} />
                    <TextInput type="date" name="dateOfBirth" label="Date of birth" value={formData.dateOfBirth} onChange={onInputChange} />
                    <ReactSelectInput name="gender" label="Gender" value={formData.gender} onChange={onInputChange} options={genderOptions} placeholder="Select gender" />
                    <TextInput type="tel" name="phone" label="Phone number" value={formData.phone} onChange={onInputChange} />
                    <div className="md:col-span-2">
                      <TextAreaInput name="permanentAddress" label="Permanent address" value={formData.permanentAddress} onChange={onInputChange} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: ROLE DETAILS — Student ── */}
            {activeTab === "role" && selectedRole === "Student" && (
              <div className="space-y-5">
                {/* Student sub-tabs */}
                <div className="flex flex-wrap gap-2 -mt-1 mb-4">
                  {studentSubTabs.map((t) => (
                    <button key={t.id} type="button" onClick={() => setStudentSubTab(t.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        studentSubTab === t.id
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Enrollment */}
                {studentSubTab === "enrollment" && (
                  <div>
                    <SectionDivider title="Enrollment details" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <TextInput name="studentNumber" label="Student number" value={formData.studentNumber} onChange={onInputChange}
                        disabled={!isEditing && !!formData.studentNumber} />
                      <TextInput name="academicYear" label="Academic year *" placeholder="e.g., 2025-2026" value={formData.academicYear} onChange={onInputChange} required />
                      <ReactSelectInput name="semester" label="Semester *" value={formData.semester} onChange={onInputChange}
                        options={semesterOptions} placeholder="Select semester" isClearable={false} />
                      <ReactSelectInput name="courseProgram" label="Course / program *" value={formData.courseProgram} onChange={onInputChange}
                        placeholder="Select program" options={programs.map((p) => ({ value: p.code, label: `${p.code} - ${p.name}` }))} />
                      <ReactSelectInput name="yearLevel" label="Year level *" value={formData.yearLevel} onChange={onInputChange}
                        options={yearLevelOptions} placeholder="Select year" />
                      <TextInput type="date" name="dateRegistered" label="Date registered" value={formData.dateRegistered} onChange={onInputChange} />
                    </div>
                    <SectionDivider title="Status information" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <ReactSelectInput name="civilStatus" label="Civil status" value={formData.civilStatus} onChange={onInputChange} options={civilStatusOptions} placeholder="Select status" />
                      <TextInput name="religion" label="Religion" value={formData.religion} onChange={onInputChange} />
                      <ReactSelectInput name="studentType" label="Student type" value={formData.studentType} onChange={onInputChange} options={studentTypeOptions} placeholder="Select type" />
                      <ReactSelectInput name="isPwd" label="Person with disability (PWD)" value={formData.isPwd} onChange={onInputChange} options={yesNoOptions} placeholder="Select" isClearable={false} />
                      <ReactSelectInput name="indigenousPeople" label="Indigenous people (IP)" value={formData.indigenousPeople} onChange={onInputChange} options={yesNoOptions} placeholder="Select" isClearable={false} />
                      <TextInput name="citizenship" label="Citizenship" value={formData.citizenship} onChange={onInputChange} />
                      <TextInput name="birthPlace" label="Place of birth" value={formData.birthPlace} onChange={onInputChange} />
                      <TextInput name="zipCode" label="Zip code" value={formData.zipCode} onChange={onInputChange} />
                    </div>
                  </div>
                )}

                {/* Education History */}
                {studentSubTab === "education" && (
                  <div>
                    <SectionDivider title="Basic education background" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <TextInput name="elementarySchool" label="Elementary school" value={formData.elementarySchool} onChange={onInputChange} />
                      <TextInput name="elementaryYearGraduated" label="Year graduated (elementary)" value={formData.elementaryYearGraduated} onChange={onInputChange} />
                      <div className="hidden md:block" />
                      <TextInput name="juniorHighSchool" label="Junior high school" value={formData.juniorHighSchool} onChange={onInputChange} />
                      <TextInput name="juniorHighYearGraduated" label="Year graduated (junior high)" value={formData.juniorHighYearGraduated} onChange={onInputChange} />
                      <div className="hidden md:block" />
                      <TextInput name="seniorHighSchool" label="Senior high school" value={formData.seniorHighSchool} onChange={onInputChange} />
                      <TextInput name="seniorHighYearGraduated" label="Year graduated (senior high)" value={formData.seniorHighYearGraduated} onChange={onInputChange} />
                    </div>
                    <SectionDivider title="Prior college attendance (if any)" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <TextInput name="collegeProgramAttended" label="College program attended" value={formData.collegeProgramAttended} onChange={onInputChange} />
                      <TextInput name="schoolYearAttended" label="School year attended" value={formData.schoolYearAttended} onChange={onInputChange} />
                      <TextInput name="previousSchool" label="Previous school" value={formData.previousSchool} onChange={onInputChange} />
                      <TextInput name="major" label="Major" value={formData.major} onChange={onInputChange} />
                      <TextInput name="yearGraduated" label="Year graduated" value={formData.yearGraduated} onChange={onInputChange} />
                    </div>
                  </div>
                )}

                {/* Family & Guardian */}
                {studentSubTab === "family" && (
                  <div>
                    <SectionDivider title="Father's information" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <TextInput name="fatherName" label="Father's name" value={formData.fatherName} onChange={onInputChange} />
                      <ReactSelectInput name="fatherStatus" label="Status" value={formData.fatherStatus} onChange={onInputChange} options={parentStatusOptions} placeholder="Select status" />
                      <TextInput name="fatherOccupation" label="Occupation" value={formData.fatherOccupation} onChange={onInputChange} />
                      <TextInput type="tel" name="fatherPhone" label="Phone" value={formData.fatherPhone} onChange={onInputChange} />
                      <TextInput name="fatherResidenceStreet" label="Street" value={formData.fatherResidenceStreet} onChange={onInputChange} />
                      <TextInput name="fatherResidenceBarangay" label="Barangay" value={formData.fatherResidenceBarangay} onChange={onInputChange} />
                      <TextInput name="fatherResidenceCity" label="City / Municipality" value={formData.fatherResidenceCity} onChange={onInputChange} />
                      <TextInput name="fatherResidenceProvince" label="Province" value={formData.fatherResidenceProvince} onChange={onInputChange} />
                      <TextInput name="fatherResidenceZipCode" label="Zip code" value={formData.fatherResidenceZipCode} onChange={onInputChange} />
                    </div>
                    <SectionDivider title="Mother's information" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <TextInput name="motherName" label="Mother's name" value={formData.motherName} onChange={onInputChange} />
                      <ReactSelectInput name="motherStatus" label="Status" value={formData.motherStatus} onChange={onInputChange} options={parentStatusOptions} placeholder="Select status" />
                      <TextInput name="motherOccupation" label="Occupation" value={formData.motherOccupation} onChange={onInputChange} />
                      <TextInput type="tel" name="motherPhone" label="Phone" value={formData.motherPhone} onChange={onInputChange} />
                      <TextInput name="motherResidenceStreet" label="Street" value={formData.motherResidenceStreet} onChange={onInputChange} />
                      <TextInput name="motherResidenceBarangay" label="Barangay" value={formData.motherResidenceBarangay} onChange={onInputChange} />
                      <TextInput name="motherResidenceCity" label="City / Municipality" value={formData.motherResidenceCity} onChange={onInputChange} />
                      <TextInput name="motherResidenceProvince" label="Province" value={formData.motherResidenceProvince} onChange={onInputChange} />
                      <TextInput name="motherResidenceZipCode" label="Zip code" value={formData.motherResidenceZipCode} onChange={onInputChange} />
                    </div>
                    <SectionDivider title="Guardian's information (if applicable)" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <TextInput name="guardianName" label="Guardian's name" value={formData.guardianName} onChange={onInputChange} />
                      <TextInput name="guardianRelationship" label="Relationship to student" value={formData.guardianRelationship} onChange={onInputChange} />
                      <TextInput name="guardianOccupation" label="Occupation" value={formData.guardianOccupation} onChange={onInputChange} />
                      <TextInput type="tel" name="guardianPhone" label="Phone" value={formData.guardianPhone} onChange={onInputChange} />
                      <TextInput type="tel" name="parentPhone" label="Parent/guardian contact phone" value={formData.parentPhone} onChange={onInputChange} />
                      <TextInput name="guardianResidenceStreet" label="Street" value={formData.guardianResidenceStreet} onChange={onInputChange} />
                      <TextInput name="guardianResidenceBarangay" label="Barangay" value={formData.guardianResidenceBarangay} onChange={onInputChange} />
                      <TextInput name="guardianResidenceCity" label="City / Municipality" value={formData.guardianResidenceCity} onChange={onInputChange} />
                      <TextInput name="guardianResidenceProvince" label="Province" value={formData.guardianResidenceProvince} onChange={onInputChange} />
                      <TextInput name="guardianResidenceZipCode" label="Zip code" value={formData.guardianResidenceZipCode} onChange={onInputChange} />
                      <div className="md:col-span-3">
                        <TextAreaInput name="mailingAddress" label="Mailing address (if different from permanent)" value={formData.mailingAddress} onChange={onInputChange} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Financial Assistance */}
                {studentSubTab === "financial" && (
                  <div>
                    <SectionDivider title="Financial assistance / scholarships" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <TextInput name="scholarshipAssistance1" label="Scholarship / assistance 1" value={formData.scholarshipAssistance1} onChange={onInputChange} />
                      <TextInput name="scholarshipAssistance2" label="Scholarship / assistance 2" value={formData.scholarshipAssistance2} onChange={onInputChange} />
                      <TextInput name="scholarshipAssistance3" label="Scholarship / assistance 3" value={formData.scholarshipAssistance3} onChange={onInputChange} />
                      <div className="md:col-span-3">
                        <TextAreaInput name="otherFinancialAssistance" label="Other financial assistance" value={formData.otherFinancialAssistance} onChange={onInputChange} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: ROLE DETAILS — Employee ── */}
            {activeTab === "role" && isEmployee && (
              <div className="space-y-5">
                <div>
                  <SectionDivider title="Employment details" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <TextInput name="employeeId" label="Employee ID" value={formData.employeeId} onChange={onInputChange}
                        disabled={isAutoGeneratedId} />
                      {isAutoGeneratedId && (
                        <p className="text-xs text-slate-400 mt-1">Auto-generated</p>
                      )}
                    </div>
                    <ReactSelectInput name="department" label="Department" value={formData.department} onChange={onInputChange}
                      placeholder="Select department" options={departments.map((d) => ({ value: d.name, label: d.name }))} />
                    <TextInput name="positionTitle" label="Position title *" value={formData.positionTitle} onChange={onInputChange}
                      required placeholder="e.g., Professor, Instructor" />
                    <TextInput type="date" name="dateHired" label="Date hired" value={formData.dateHired} onChange={onInputChange} />
                    <ReactSelectInput name="status" label="Employment status" value={formData.status} onChange={onInputChange}
                      options={statusOptions} placeholder="Select status" />
                    {selectedRole === "Admin" && (
                      <ReactSelectInput name="accessLevel" label="Access level" value={formData.accessLevel} onChange={onInputChange}
                        options={[{ value: "Standard Admin", label: "Standard Admin" }, { value: "Super Admin", label: "Super Admin" }]}
                        placeholder="Select access level" isClearable={false} />
                    )}
                  </div>
                </div>
                {(selectedRole === "Faculty" || selectedRole === "Admin") && (
                  <div>
                    <SectionDivider title="Academic credentials" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <TextInput name="specialization" label="Specialization" value={formData.specialization} onChange={onInputChange}
                        placeholder="e.g., Software Engineering" />
                      <NativeSelect name="educationalAttainment" label="Educational attainment" value={formData.educationalAttainment} onChange={onInputChange}>
                        <option value="">Select...</option>
                        <option value="Bachelor's Degree">Bachelor's Degree</option>
                        <option value="Master's Degree">Master's Degree</option>
                        <option value="Doctorate">Doctorate</option>
                        <option value="PhD">PhD</option>
                      </NativeSelect>
                      <TextInput name="licenseNumber" label="License number (PRC)" value={formData.licenseNumber} onChange={onInputChange} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 rounded-b-lg flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-sm font-medium">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
              {isEditing ? "Save changes" : "Create account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* -------------------------
   MAIN COMPONENT
   ------------------------- */
function UserManagement() {
  const [currentPage, setCurrentPage] = useState("users");

  const [users,       setUsers]       = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs,    setPrograms]    = useState([]);
  const [rbac,        setRbac]        = useState(INITIAL_RBAC_STATE);
  const [rbacSaving,  setRbacSaving]  = useState(false);
  const [rbacSaved,   setRbacSaved]   = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditing,       setIsEditing]       = useState(false);
  const [currentId,       setCurrentId]       = useState(null);
  const [selectedRole,    setSelectedRole]    = useState("Student");
  const [formData,        setFormData]        = useState(getInitialFormState("Student"));
  const [nextEmployeeId,  setNextEmployeeId]  = useState(""); // ← sa parent

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingUser,     setViewingUser]     = useState(null);

  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [query,      setQuery]      = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [page,       setPage]       = useState(1);
  const pageSize = 6;

  /* ── Helpers ── */
  function getInitialFormState(role) {
    let specific = {};
    if (role === "Student")      specific = { ...studentSpecifics };
    else if (role === "Admin")   specific = { ...employeeCommon, ...adminSpecifics };
    else if (role === "Faculty") specific = { ...employeeCommon, ...facultySpecifics };
    else                         specific = { ...employeeCommon };
    return { ...initialCommonState, ...specific, role };
  }

  /* ── Data fetching ── */
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, "Failed to load users."));
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/dept/departments`, { headers: { Authorization: `Bearer ${token}` } });
      setDepartments(res.data);
    } catch (err) {
      console.error("Error fetching departments:", err);
      toast.error(getErrorMessage(err, "Failed to load departments."));
    }
  };

  const fetchPrograms = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/programs`, { headers: { Authorization: `Bearer ${token}` } });
      setPrograms(res.data);
    } catch (err) {
      console.error("Error fetching programs:", err);
      toast.error(getErrorMessage(err, "Failed to load programs."));
    }
  };

  const fetchRbac = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/rbac`, { headers: { Authorization: `Bearer ${token}` } });
      const fetched = res.data;
      setRbac((prev) => {
        const merged = { ...prev };
        for (const role of Object.keys(prev)) { if (fetched[role]) merged[role] = fetched[role]; }
        return merged;
      });
    } catch (err) {
      console.error("Error fetching RBAC config:", err);
      toast.error(getErrorMessage(err, "Failed to load RBAC configuration."));
    }
  };

  // Kasama ng ibang useEffect mo — nasa UserManagement component
useEffect(() => { fetchUsers(); fetchDepartments(); fetchPrograms(); fetchRbac(); }, []);

// ← DAGDAG ITO PAGKATAPOS:
useEffect(() => {
  if (!isEditing && selectedRole !== "Student" && nextEmployeeId) {
    setFormData((prev) => ({ ...prev, employeeId: nextEmployeeId }));
  }
}, [selectedRole, nextEmployeeId, isEditing]);

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setIsEditing(false);
    setCurrentId(null);
    setFormData(getInitialFormState("Student"));
    setSelectedRole("Student");
  };

  /* ── Handlers ── */
const handleAddNew = async () => {
  setIsEditing(false);
  setSelectedRole("Student");
  setFormData(getInitialFormState("Student"));

  try {
    const token = localStorage.getItem("token");
    const res = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/api/users/employee/next-id`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setNextEmployeeId(res.data.employeeId);
  } catch (err) {
    console.error("Failed to fetch next employee ID:", err);
  }

  setIsFormModalOpen(true);
};
const handleRoleChange = (e) => {
  const r = e.target?.value || e.value;
  setSelectedRole(r);
  const newState = getInitialFormState(r);
  if (r !== "Student") {
    newState.employeeId = nextEmployeeId;
  }
  // Preserve existing form values na dapat ma-retain
  newState.email    = formData.email    || newState.email;
  newState.password = formData.password || newState.password;
  newState.confirmPassword = formData.confirmPassword || newState.confirmPassword;
  newState.firstName       = formData.firstName       || newState.firstName;
  newState.middleName      = formData.middleName      || newState.middleName;
  newState.lastName        = formData.lastName        || newState.lastName;
  newState.suffix          = formData.suffix          || newState.suffix;
  newState.dateOfBirth     = formData.dateOfBirth     || newState.dateOfBirth;
  newState.gender          = formData.gender          || newState.gender;
  newState.phone           = formData.phone           || newState.phone;
  newState.permanentAddress = formData.permanentAddress || newState.permanentAddress;
  setFormData(newState);
};
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleViewUser = (user) => { setViewingUser(user); setIsViewModalOpen(true); };

  const handleEdit = (user) => {
    setIsEditing(true);
    setCurrentId(user.user_id);
    setSelectedRole(user.role);
    setFormData({
      ...getInitialFormState(user.role),
      email:                 user.email                  || "",
      firstName:             user.first_name             || "",
      middleName:            user.middle_name            || "",
      lastName:              user.last_name              || "",
      suffix:                user.suffix                 || "",
      dateOfBirth:           formatDateForInput(user.date_of_birth),
      gender:                user.gender                 || "",
      phone:                 user.phone                  || "",
      permanentAddress:      user.permanent_address      || "",

      // student — enrollment
      studentNumber:         user.student_number         || "",
      academicYear:          user.academic_year          || "",
      semester:               user.semester                || "",
      courseProgram:          user.course_program || user.course || "",
      yearLevel:              user.year_level              || "",
      dateRegistered:         formatDateForInput(user.date_registered),

      // student — status
      civilStatus:            user.civil_status            || "",
      religion:                user.religion                || "",
      isPwd:                   user.is_pwd                  || "",
      indigenousPeople:        user.indigenous_people       || "",
      zipCode:                 user.zip_code                || "",
      birthPlace:              user.birth_place             || "",
      citizenship:             user.citizenship             || "",
      studentType:             user.student_type            || "",

      // student — education history
      elementarySchool:            user.elementary_school            || "",
      elementaryYearGraduated:     user.elementary_year_graduated    || "",
      juniorHighSchool:            user.junior_high_school           || "",
      juniorHighYearGraduated:     user.junior_high_year_graduated   || "",
      seniorHighSchool:            user.senior_high_school           || "",
      seniorHighYearGraduated:     user.senior_high_year_graduated   || "",
      collegeProgramAttended:      user.college_program_attended     || "",
      schoolYearAttended:          user.school_year_attended         || "",
      previousSchool:              user.previous_school              || "",
      major:                       user.major                        || "",
      yearGraduated:               user.year_graduated                || "",
      mailingAddress:              user.mailing_address              || "",

      // student — father
      fatherName:               user.father_name               || "",
      fatherStatus:              user.father_status              || "",
      fatherResidenceStreet:     user.father_residence_street    || "",
      fatherResidenceBarangay:   user.father_residence_barangay  || "",
      fatherResidenceCity:       user.father_residence_city      || "",
      fatherResidenceProvince:   user.father_residence_province  || "",
      fatherResidenceZipCode:    user.father_residence_zip_code  || "",
      fatherOccupation:          user.father_occupation          || "",
      fatherPhone:               user.father_phone               || "",

      // student — mother
      motherName:                user.mother_name                || "",
      motherStatus:               user.mother_status               || "",
      motherResidenceStreet:      user.mother_residence_street     || "",
      motherResidenceBarangay:    user.mother_residence_barangay   || "",
      motherResidenceCity:        user.mother_residence_city       || "",
      motherResidenceProvince:    user.mother_residence_province   || "",
      motherResidenceZipCode:     user.mother_residence_zip_code   || "",
      motherOccupation:           user.mother_occupation           || "",
      motherPhone:                user.mother_phone                || "",

      // student — guardian
      guardianName:                user.guardian_name                || "",
      guardianRelationship:        user.guardian_relationship        || "",
      guardianResidenceStreet:     user.guardian_residence_street    || "",
      guardianResidenceBarangay:   user.guardian_residence_barangay  || "",
      guardianResidenceCity:       user.guardian_residence_city      || "",
      guardianResidenceProvince:   user.guardian_residence_province  || "",
      guardianResidenceZipCode:    user.guardian_residence_zip_code  || "",
      guardianOccupation:          user.guardian_occupation          || "",
      guardianPhone:               user.guardian_phone               || "",
      parentPhone:                 user.parent_phone                 || "",

      // student — financial assistance
      otherFinancialAssistance:   user.other_financial_assistance   || "",
      scholarshipAssistance1:      user.scholarship_assistance1      || "",
      scholarshipAssistance2:      user.scholarship_assistance2      || "",
      scholarshipAssistance3:      user.scholarship_assistance3      || "",

      // employee
      employeeId:            user.employee_id            || "",
      department:            user.department             || "",
      positionTitle:         user.position_title         || "",
      dateHired:             formatDateForInput(user.date_hired),
      status:                user.status                 || "Active",
      accessLevel:           user.access_level           || "",
      specialization:        user.specialization         || "",
      educationalAttainment: user.educational_attainment || "",
      licenseNumber:         user.license_number         || "",
    });
    setIsFormModalOpen(true);
  };

  const handleDelete = (userId) => {
    setDeleteTargetId(userId);
  };

  const cancelDelete = () => {
    setDeleteTargetId(null);
  };

  const confirmDelete = async () => {
    const userId = deleteTargetId;
    if (!userId) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
      toast.success("User deleted successfully.");
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, "Failed to delete user."));
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = buildPayload(formData, selectedRole);

      if (!isEditing) {
        if (!formData.password || formData.password !== formData.confirmPassword) {
          toast.error("Password and Confirm Password must match and cannot be empty.");
          return;
        }
        if (selectedRole !== "Student") {
          const missing = ["email", "firstName", "lastName"].filter((f) => !payload[f]?.trim());
          if (missing.length) {
            toast.error(`Please fill required fields: ${missing.join(", ")}`);
            return;
          }
        } else {
          const missing = ["academicYear", "semester", "courseProgram", "yearLevel"].filter((f) => !payload[f]?.toString().trim());
          if (missing.length) {
            toast.error(`Please fill required student fields: ${missing.join(", ")}`);
            return;
          }
        }
      } else {
        if (!formData.password) delete payload.password;
      }

      const BASE = import.meta.env.VITE_API_BASE_URL;
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      let response;
      if (!isEditing) {
        response = selectedRole === "Student"
          ? await axios.post(`${BASE}/api/users/student`,  payload, { headers })
          : await axios.post(`${BASE}/api/users/employee`, payload, { headers });
      } else {
        response = selectedRole === "Student"
          ? await axios.put(`${BASE}/api/users/student/${currentId}`,  payload, { headers })
          : await axios.put(`${BASE}/api/users/employee/${currentId}`, payload, { headers });
      }

      toast.success(response.data.message || "Success!");
      fetchUsers();
      if (response.data.token) localStorage.setItem("token", response.data.token);
      closeFormModal();
    } catch (error) {
      console.error("Response data:", JSON.stringify(error.response?.data, null, 2));
      const serverErrors = error.response?.data?.errors;
      if (serverErrors?.length) {
        toast.error("Validation failed: " + serverErrors.map((e) => `${e.field}: ${e.message}`).join("; "));
      } else {
        toast.error(getErrorMessage(error, "Something went wrong."));
      }
    }
  };

  const handleSaveRbac = async () => {
    setRbacSaving(true);
    setRbacSaved(false);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/rbac`, rbac, { headers: { Authorization: `Bearer ${token}` } });
      setRbacSaved(true);
      toast.success("RBAC configuration saved.");
      setTimeout(() => setRbacSaved(false), 3000);
    } catch (error) {
      console.error("Error saving RBAC:", error);
      toast.error(getErrorMessage(error, "Failed to save RBAC configuration."));
    } finally { setRbacSaving(false); }
  };

  const handlePermissionChange = (role, permissionId, isAllowed) => {
    setRbac((prev) => ({
      ...prev,
      [role]: prev[role].map((p) => p.id === permissionId ? { ...p, allowed: isAllowed } : p),
    }));
  };

  /* ── Search / filter / paginate ── */
  const filteredSorted = useMemo(() => {
    const userList = Array.isArray(users) ? users : [];
    let result = [...userList];
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((u) =>
        (u.first_name     || "").toLowerCase().includes(q) ||
        (u.last_name      || "").toLowerCase().includes(q) ||
        (u.email          || "").toLowerCase().includes(q) ||
        (u.student_number || "").toLowerCase().includes(q) ||
        (u.employee_id    || "").toLowerCase().includes(q),
      );
    }
    if (filterRole) result = result.filter((u) => u.role === filterRole);
    return result;
  }, [users, query, filterRole]);

  const pageCount = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  useEffect(() => { if (page > pageCount) setPage(1); }, [pageCount, page]);
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, page]);

  /* ── Export ── */
  const exportCSV = () => {
    if (users.length === 0) { toast.error("No users to export."); return; }
    const exportData = users.map((u) => ({
      first_name:     u.first_name     || "",
      last_name:      u.last_name      || "",
      email:          u.email          || "",
      phone:          u.phone          || "",
      role:           u.role           || "",
      employee_id:    u.employee_id    || "",
      student_number: u.student_number || "",
      department:     u.department     || "",
      position_title: u.position_title || "",
      date_hired:     u.date_hired     || "",
      status:         u.status         || "",
    }));
    const csv = generateCSV(exportData, {
      headers: ["first_name","last_name","email","phone","role","employee_id","student_number","department","position_title","date_hired","status"],
      includeTimestamps: false,
      title: "Users Report",
    });
    downloadCSV(csv, `users_export_${new Date().toISOString().split("T")[0]}.csv`);
  };

  const exportPDF = () => {
    if (users.length === 0) { toast.error("No users to export."); return; }
    const exportData = users.map((u) => ({
      first_name: u.first_name || "",
      last_name:  u.last_name  || "",
      email:      u.email      || "",
      role:       u.role       || "",
      id_number:  u.role === "Student" ? u.student_number || "" : u.employee_id || "",
      department: u.role === "Student" ? (u.course_program || u.course || "") : u.department || "",
      status:     u.status || "",
    }));
    downloadPDF(jsPDF, autoTable, exportData, {
      title: "Users Report",
      orientation: "landscape",
      headers: ["first_name","last_name","email","role","id_number","department","status"],
      includeTimestamps: false,
    });
  };

  /* ── Derived stats ── */
  const totalStudents     = users.filter((u) => u.role === "Student").length;
  const totalFacultyStaff = users.filter((u) => ["Faculty","Staff","HR","Accounting"].includes(u.role)).length;
  const totalAdmins       = users.filter((u) => u.role === "Admin").length;

  /* ── RBAC view ── */
  const renderAccessControl = () => (
    <div className="p-3 md:p-4 shadow rounded border border-gray-200">
      <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-indigo-600" /> Role-Based Access Control (RBAC)
      </h2>
      <p className="text-gray-600 mb-4 text-sm">Define which roles have access to specific system features and permissions.</p>
      <div className="overflow-x-auto">
        <table className="min-w-full leading-normal border-collapse">
          <thead className="bg-gray-50 border-b-2 border-indigo-200">
            <tr className="text-left text-gray-700 uppercase text-xs tracking-wider">
              <th className="px-3 py-1.5 w-1/4">Permission Module</th>
              {Object.keys(ROLE_CONFIG).map((role) => {
                const RoleIcon = ROLE_CONFIG[role].icon;
                return (
                  <th key={role} className="px-3 py-1.5 text-center">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded-full ${ROLE_CONFIG[role].color}`}>
                      <RoleIcon className="w-3 h-3 mr-1" />{role}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS_LIST.map((permission) => (
              <tr key={permission.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2">
                  <p className="font-semibold text-gray-800 text-sm">{permission.name}</p>
                  <p className="text-xs text-gray-500">{permission.description}</p>
                </td>
                {Object.keys(ROLE_CONFIG).map((role) => {
                  const isAllowed = rbac[role].find((p) => p.id === permission.id)?.allowed;
                  return (
                    <td key={`${role}-${permission.id}`} className="px-3 py-2 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={isAllowed}
                          onChange={(e) => handlePermissionChange(role, permission.id, e.target.checked)}
                          className="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300"
                          disabled={role === "Student" && permission.id === "A1"} />
                        <span className={`ml-2 text-xs font-medium hidden sm:inline ${isAllowed ? "text-green-600" : "text-red-500"}`}>
                          {isAllowed ? "Allowed" : "Denied"}
                        </span>
                      </label>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 pt-3 border-t text-right flex items-center justify-end gap-3">
        {rbacSaved && <span className="text-sm text-green-600 font-medium">✓ Configuration saved!</span>}
        <button onClick={handleSaveRbac} disabled={rbacSaving}
          className="px-4 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm disabled:opacity-60">
          {rbacSaving ? "Saving..." : "Save RBAC Configuration"}
        </button>
      </div>
    </div>
  );

  /* ── User list view ── */
  const renderUserList = () => (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative flex-grow max-w-xs">
          <input type="text" placeholder="Search name, email, id..." value={query} onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-inner" />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        </div>
        <div className="flex items-center gap-2">
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-36">
            <option value="">All Roles</option>
            {["Student","Admin","Faculty","Staff","HR","Accounting"].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="relative group">
            <button onClick={exportCSV} className="p-2 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-100"><FileDown size={16} /></button>
            <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">Export CSV</span>
          </div>
          <div className="relative group">
            <button onClick={exportPDF} className="p-2 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-100"><FileText size={16} /></button>
            <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">Export PDF</span>
          </div>
          <button onClick={handleAddNew}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium text-sm shadow-md shadow-indigo-500/30">
            <UserPlus size={14} /> New User
          </button>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4 text-slate-800">User List</h2>
      <div className="overflow-x-auto rounded border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-100">
            <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700">
              <th className="px-4 py-2.5">Name & Email</th>
              <th className="px-4 py-2.5">Role</th>
              <th className="px-4 py-2.5">ID / Title</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right w-1/12">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {paged.length === 0 ? (
              <tr><td colSpan="5" className="p-4 text-center text-slate-500 italic">No user accounts found.</td></tr>
            ) : (
              paged.map((user) => {
                const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.Staff;
                const RoleIcon = roleConfig.icon;
                return (
                  <tr key={user.user_id} className="text-sm text-slate-700 hover:bg-indigo-50/50 transition duration-150">
                    <td className="px-4 py-2">
                      <p className="font-semibold text-slate-900 whitespace-nowrap">{user.first_name} {user.last_name}</p>
                      <p className="text-indigo-600 text-xs">{user.email}</p>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 inline-flex items-center gap-1 text-xs font-bold rounded-full ${roleConfig.color} border`}>
                        <RoleIcon className="w-3 h-3" />{user.role}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-slate-800">{user.role === "Student" ? user.student_number : user.employee_id}</span>
                      <p className="text-xs text-slate-500 mt-0.5">{user.position_title || user.course_program || user.course || "—"}</p>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${user.status === "Active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                        {user.status || "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right space-x-1">
                      <button onClick={() => handleViewUser(user)} className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-slate-200" title="View Details"><Eye size={14} /></button>
                      <button onClick={() => handleEdit(user)}     className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-slate-200" title="Edit Record"><Edit size={14} /></button>
                      <button onClick={() => handleDelete(user.user_id)} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-slate-200" title="Delete Record"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700">
        <span className="text-xs sm:text-sm">
          Showing <span className="font-semibold">{(page - 1) * pageSize + 1}</span>–
          <span className="font-semibold">{Math.min(page * pageSize, filteredSorted.length)}</span> of{" "}
          <span className="font-semibold">{filteredSorted.length}</span> users
        </span>
        <div className="flex gap-1 mt-2 sm:mt-0">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="p-1.5 rounded border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100">
            <ChevronLeft size={16} className="text-slate-600" />
          </button>
          {[...Array(pageCount)].map((_, i) => (
            <button key={i + 1} onClick={() => setPage(i + 1)}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${page === i + 1 ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-300 text-slate-700 hover:bg-slate-100"}`}>
              {i + 1}
            </button>
          ))}
          <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount}
            className="p-1.5 rounded border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100">
            <ChevronRight size={16} className="text-slate-600" />
          </button>
        </div>
      </div>
    </>
  );

  /* ── Main render ── */
  return (
    <div className="w-full overflow-hidden bg-slate-50 sm:p-4 flex flex-col">
      <ToastContainer position="top-right" />

      <div className="w-full mx-auto flex flex-col gap-3 font-sans flex-1 min-h-0">
        <div className="flex-shrink-0 flex justify-between items-center border-b border-slate-200 pb-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <User2Icon className="w-6 h-6 text-indigo-600" /> User Management
          </h2>
          <span className="text-sm text-slate-500 font-medium">Data Integrity: Online</span>
        </div>

        <div className="flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {[
            { label: "Total Users",     value: users.length,      color: "text-indigo-600" },
            { label: "Students",        value: totalStudents,      color: "text-blue-600" },
            { label: "Faculty & Staff", value: totalFacultyStaff,  color: "text-green-600" },
            { label: "Admins",          value: totalAdmins,        color: "text-purple-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <p className="text-sm text-slate-600">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="flex-shrink-0 flex border-b border-slate-200">
          {[["users", Users, "Manage Users"], ["roles", ListChecks, "Access Control (RBAC)"]].map(([id, Icon, label]) => (
            <button key={id} onClick={() => setCurrentPage(id)}
              className={`flex items-center gap-2 px-3 py-1.5 font-semibold text-sm transition duration-150 ${
                currentPage === id ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-indigo-600"
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {currentPage === "users" && renderUserList()}
          {currentPage === "roles" && renderAccessControl()}
        </div>
      </div>

      <UserFormModal
        isOpen={isFormModalOpen} onClose={closeFormModal} onSubmit={handleSubmit}
        isEditing={isEditing} selectedRole={selectedRole} onRoleChange={handleRoleChange}
        formData={formData} onInputChange={handleInputChange}
        departments={departments} programs={programs}
      />

      {viewingUser && (
        <ViewUserModal
          isOpen={isViewModalOpen}
          onClose={() => { setIsViewModalOpen(false); setViewingUser(null); }}
          user={viewingUser}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        message={
          <>
            Are you sure you want to delete this user?{" "}
            <span className="text-red-400">This action cannot be undone!</span>
          </>
        }
        confirmLabel="Yes"
        tone="danger"
      />
    </div>
  );
}

export default UserManagement;