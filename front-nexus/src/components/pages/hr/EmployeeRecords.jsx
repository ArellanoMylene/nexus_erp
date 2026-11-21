import { toast } from "react-toastify";
// UserManagement.jsx
import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  X,
  Settings,
  ListChecks,
  Eye,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  User2Icon,
  FileText,
  FileDown,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { downloadPDF, downloadExcel } from "../../../utils/exportHelpers";

/* -------------------------
   INITIAL STATE TEMPLATES
   ------------------------- */
const initialCommonState = {
  email: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",
  dob: "",
  gender: "",
  phone: "",
  permanentAddress: "",
  profilePicture: "", // base64 data URI
};

const studentSpecifics = {
  studentNumber: "",
  studentType: "New Student",
  course: "",
  courseProgram: "",
  major: "",
  yearLevel: "",
  academicYear: "",
  semester: "",
  civilStatus: "Single",
  religion: "",
  isPwd: "No",
  indigenousPeople: "No",
  zipCode: "5201",
  birthPlace: "",
  citizenship: "Filipino",
  elementarySchool: "",
  elementaryYearGraduated: "",
  juniorHighSchool: "",
  juniorHighYearGraduated: "",
  seniorHighSchool: "",
  seniorHighYearGraduated: "",
  collegeProgramAttended: "",
  schoolYearAttended: "",
  previousSchool: "",
  yearGraduated: "",
  fatherName: "",
  fatherOccupation: "",
  fatherPhone: "",
  motherName: "",
  motherOccupation: "",
  motherPhone: "",
  guardianName: "",
  guardianRelationship: "",
  guardianPhone: "",
  parentPhone: "",
  mailingAddress: "",
  otherFinancialAssistance: "No",
  scholarshipAssistance1: "",
  scholarshipAssistance2: "",
  scholarshipAssistance3: "",
};

const employeeCommon = {
  employeeId: "",
  department: "",
  positionTitle: "",
  status: "Active",
  dateHired: "",
};

const adminSpecifics = {
  accessLevel: "Super Admin",
};

const facultySpecifics = {
  specialization: "",
  educationalAttainment: "",
  licenseNumber: "",
  coursesHandled: [],
};

const ROLE_CONFIG = {
  Student: {
    icon: GraduationCap,
    color: "bg-indigo-100 text-indigo-800 border-indigo-300",
  },
  Admin: { icon: ShieldCheck, color: "bg-red-100 text-red-800 border-red-300" },
  Faculty: {
    icon: Briefcase,
    color: "bg-green-100 text-green-800 border-green-300",
  },
  Staff: {
    icon: Users,
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  HR: {
    icon: Briefcase,
    color: "bg-pink-100 text-pink-800 border-pink-300",
  },
  Accounting: {
    icon: FileText,
    color: "bg-blue-100 text-blue-800 border-blue-300",
  },
};

const PERMISSIONS_LIST = [
  {
    id: "C1",
    name: "Can Manage Courses",
    description: "Create, edit, and delete course offerings.",
  },
  {
    id: "S1",
    name: "Can View Student Grades",
    description: "Access student academic performance records.",
  },
  {
    id: "U1",
    name: "Can Manage User Accounts",
    description: "Create, edit, and delete non-Admin user accounts.",
  },
  {
    id: "A1",
    name: "Can Access Audit Logs",
    description: "View system activity and security logs.",
  },
];

const INITIAL_RBAC_STATE = {
  Admin: PERMISSIONS_LIST.map((p) => ({ ...p, allowed: true })),
  Faculty: PERMISSIONS_LIST.map((p) => ({ ...p, allowed: p.id === "S1" })),
  Staff: PERMISSIONS_LIST.map((p) => ({ ...p, allowed: p.id === "U1" })),
  Student: PERMISSIONS_LIST.map((p) => ({ ...p, allowed: false })),
  HR: PERMISSIONS_LIST.map((p) => ({ ...p, allowed: false })),
  Accounting: PERMISSIONS_LIST.map((p) => ({ ...p, allowed: false })),
};

/* -------------------------
   SMALL INPUT COMPONENTS
   (All padding reduced to p-1.5)
   ------------------------- */

const TextInput = ({
  name,
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
  label = "",
  disabled = false,
  className = "",
}) => (
  <div className="w-full">
    {label && <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>}
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 ${className}`}
    />
  </div>
);

const ReactSelectInput = ({ name, placeholder, value, onChange, options, label = "", isDisabled = false }) => (
  <div>
    {label && <label className="block text-xs font-medium text-slate-700 mb-1.5">{label}</label>}
    <Select
      name={name}
      options={options}
      value={options.find((option) => option.value === value) || null}
      onChange={(option) => onChange({ target: { name, value: option?.value || "" } })}
      placeholder={placeholder || `Select ${name}`}
      isClearable={false}
      isDisabled={isDisabled}
      className="text-sm"
      styles={{
        control: (base) => ({ ...base, minHeight: "38px", borderColor: "rgb(203 213 225)", borderRadius: "0.5rem", fontSize: "14px" }),
        option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? "rgb(79 70 229)" : state.isFocused ? "rgb(229 231 235)" : "white", color: state.isSelected ? "white" : "rgb(15 23 42)", fontSize: "14px" }),
      }}
    />
  </div>
);

const SelectInput = ({
  name,
  placeholder,
  value,
  onChange,
  children,
  label = "",
  className = "",
  required = false,
  ...props
}) => (
  <div className="w-full">
    {label && <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>}
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 ${className}`}
      {...props}
    >
      <option value="" disabled>
        {placeholder || `Select ${name}`}
      </option>
      {children}
    </select>
  </div>
);

const TextAreaInput = ({
  name,
  placeholder,
  value,
  onChange,
  label = "",
  className = "",
}) => (
  <div className="w-full">
    {label && <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>}
    <textarea
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full min-h-20 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out shadow-sm text-sm ${className}`}
    />
  </div>
);

const SectionDivider = ({ title }) => (
  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-200 mt-1 mb-3">
    {title}
  </p>
);

/* -------------------------
   Modal Component
   ------------------------- */

const Modal = ({ isOpen, onClose, title, children, size = "lg" }) => {
  if (!isOpen) return null;
  const widthClass = size === "lg" ? "max-w-4xl" : "max-w-xl";

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-lg shadow-xl w-full ${widthClass} max-h-[90vh] flex flex-col border border-slate-200 transform transition-transform duration-200 scale-100`}
      >
        <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10 rounded-t-lg">
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

/* -------------------------
   ViewUserModal
   ------------------------- */
const ViewUserModal = ({ isOpen, onClose, user }) => {
  if (!user) return null;

  const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.Staff;
  const RoleIcon = roleConfig.icon;

  // Format DOB safely
  const formatDOB = (dob) => {
    if (!dob) return "N/A";
    const date = new Date(dob);
    if (isNaN(date)) return "N/A";
    return date.toLocaleDateString("en-GB"); // DD/MM/YYYY
  };

  // Role-specific details
  const RoleSpecificDetails = useMemo(() => {
    const fields = [];
    if (user.role === "Student") {
      fields.push(
        { label: "Student Number", value: user.student_number || "N/A" },
        {
          label: "Course / Major",
          value: `${user.course || "N/A"} / ${user.major || "N/A"}`,
        },
        { label: "Year Level", value: user.year_level || "N/A" },
        { label: "Previous School", value: user.previous_school || "N/A" },
        {
          label: "Parent / Guardian",
          value: user.father_name || user.mother_name || "N/A",
        },
        { label: "Parent Phone", value: user.parent_phone || "N/A" },
        { label: "Mailing Address", value: user.mailing_address || "N/A" },
      );
    } else if (["Admin", "Faculty", "Staff"].includes(user.role)) {
      fields.push(
        { label: "Employee ID", value: user.employee_id || "N/A" },
        { label: "Department", value: user.department || "N/A" },
        { label: "Position Title", value: user.position_title || "N/A" },
        { label: "Date Hired", value: formatDOB(user.date_hired) || "N/A" },
        { label: "Employment Status", value: user.status || "N/A" },
      );
    }

    if (user.role === "Faculty") {
      fields.push(
        { label: "Specialization", value: user.specialization || "N/A" },
        {
          label: "Educational Attainment",
          value: user.educational_attainment || "N/A",
        },
        { label: "License Number", value: user.license_number || "N/A" },
      );
    }

    if (user.role === "Admin") {
      fields.push({
        label: "Access Level",
        value: user.access_level || "N/A",
      });
    }

    return fields;
  }, [user]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Viewing: ${user.first_name} ${user.last_name}`}
      size="lg"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column */}
        <div className="lg:col-span-1 bg-gray-50 p-2 rounded-lg border border-gray-200">
          <div className="flex flex-col items-center pb-3 border-b border-gray-200">
            <div className="h-16 w-16 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-800 text-2xl font-bold mb-2">
              {user.first_name?.[0] || "?"}
              {user.last_name?.[0] || "?"}
            </div>
            <h4 className="text-lg font-bold text-gray-800">
              {user.first_name} {user.last_name}
            </h4>
            <p className="text-sm text-gray-600">{user.email}</p>
            <span
              className={`mt-1.5 px-2 py-0.5 inline-flex items-center gap-1 text-xs font-bold rounded-full ${roleConfig.color} border`}
            >
              <RoleIcon className="w-3 h-3" />
              {user.role}
            </span>
          </div>

          <div className="mt-2 space-y-1">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">
                Phone
              </p>
              <p className="font-semibold text-gray-800 text-sm">
                {user.phone || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">
                DOB / Gender
              </p>
              <p className="font-semibold text-gray-800 text-sm">
                {formatDOB(user.date_of_birth)} / {user.gender || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">
                Permanent Address
              </p>
              <p className="font-semibold text-gray-800 text-sm">
                {user.permanent_address || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h5 className="font-bold text-gray-700 p-2 border-b bg-gray-50 rounded-t-lg flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Role Specific Details
          </h5>

          <div className="mt-2 space-y-2">
            {RoleSpecificDetails.length > 0 ? (
              RoleSpecificDetails.map((item, idx) => (
                <div key={idx}>
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    {item.label}
                  </p>
                  <p className="font-semibold text-gray-800 text-sm">
                    {item.value || "N/A"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-gray-500 py-4">
                No specific role details available.
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

/* -------------------------
   MAIN COMPONENT
   ------------------------- */

function EmployeeRecords() {
  // pages/tabs
  const [currentPage, setCurrentPage] = useState("users");

  // data
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]); // Added departments state
  const [rbac, setRbac] = useState(INITIAL_RBAC_STATE);

  // modals & form state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [selectedRole, setSelectedRole] = useState("Staff");
  const [formData, setFormData] = useState(getInitialFormState("Staff"));
  const [nextEmployeeId, setNextEmployeeId] = useState("");
  const [activeFormTab, setActiveFormTab] = useState("personal");

  // view modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // search / filter / pagination / sort
  const [query, setQuery] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [sortField, setSortField] = useState("lastName"); // lastName or dateHired
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // collapsible form sections
  const [collapsed, setCollapsed] = useState({
    account: false,
    student: false,
    employee: false,
    admin: false,
    faculty: false,
    guardian: false,
  });

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/dept/departments`,
      );
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/users`,
      );
      console.log("Fetched users:", response.data);
      setUsers(response.data);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  /* -------------------------
     helpers
     ------------------------- */
  // effect to keep form role in sync
  useEffect(() => {
    if (!isEditing && selectedRole !== "Student") {
      setFormData((previous) => ({
        ...getInitialFormState(selectedRole),
        employeeId: nextEmployeeId || previous.employeeId || "",
      }));
    }
  }, [selectedRole, isEditing, nextEmployeeId]);

  function getInitialFormState(role) {
    let specificFields = {};
    if (role === "Student")
      specificFields = {
        ...studentSpecifics,
        role: "Student",
      };
    else if (role === "Admin")
      specificFields = {
        ...employeeCommon,
        ...adminSpecifics,
        role: "Admin",
        employeeId: "",
      };
    else if (role === "Faculty")
      specificFields = {
        ...employeeCommon,
        ...facultySpecifics,
        role: "Faculty",
        employeeId: "",
      };
    else if (role === "Staff")
      specificFields = { ...employeeCommon, role: "Staff", employeeId: "" };
    else if (role === "HR")
      specificFields = { ...employeeCommon, role: "HR", employeeId: "" };
    else if (role === "Accounting")
      specificFields = {
        ...employeeCommon,
        role: "Accounting",
        employeeId: "",
      };

    return { ...initialCommonState, ...specificFields, role };
  }

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setIsEditing(false);
    setCurrentId(null);
    setFormData(getInitialFormState("Staff"));
    setSelectedRole("Staff");
    setActiveFormTab("personal");
    setCollapsed({
      account: false,
      student: false,
      employee: false,
      admin: false,
      faculty: false,
      guardian: false,
    });
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewingUser(null);
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setSelectedRole(newRole);
    setFormData({
      ...getInitialFormState(newRole),
      employeeId: nextEmployeeId,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let response;
      // Always ensure role is set in formData
      const submitData = { ...formData, role: selectedRole };

      // -------- CREATE MODE --------
      if (!isEditing) {
        // Password check only when creating
        if (
          !submitData.password ||
          submitData.password !== submitData.confirmPassword
        ) {
          toast.error("Password and Confirm Password must match and cannot be empty.",);
          return;
        }

          const requiredFields = [
            "email",
            "firstName",
            "lastName",
            "employeeId",
            "department",
            "positionTitle",
          ];
          const missing = requiredFields.filter(
            (field) => !submitData[field] || String(submitData[field]).trim() === "",
          );
          if (missing.length) {
            toast.warning(`Please fill required fields: ${missing.join(", ")}`);
            return;
        }

          response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/api/users/employee`,
            submitData,
          );
      }

      // -------- EDIT MODE --------
      else {
        const userId = currentId;

        if (selectedRole === "Student") {
          const payload = {
            ...submitData,
            courseProgram: submitData.courseProgram || submitData.course || "",
            course: submitData.course || submitData.courseProgram || "",
            dateOfBirth: submitData.dateOfBirth || submitData.dob || "",
            dob: submitData.dateOfBirth || submitData.dob || "",
            yearGraduated: String(submitData.yearGraduated || ""),
            elementaryYearGraduated: String(submitData.elementaryYearGraduated || ""),
            juniorHighYearGraduated: String(submitData.juniorHighYearGraduated || ""),
            seniorHighYearGraduated: String(submitData.seniorHighYearGraduated || ""),
            zipCode: String(submitData.zipCode || ""),
          };
          if (submitData.password) {
            if (submitData.password !== submitData.confirmPassword) {
              toast.warning("Password and Confirm Password must match.");
              return;
            }
            payload.password = submitData.password;
            payload.confirmPassword = submitData.confirmPassword;
          } else {
            delete payload.password;
            delete payload.confirmPassword;
          }

          response = await axios.put(
            `${import.meta.env.VITE_API_BASE_URL}/api/users/student/${userId}`,
            payload,
          );
        } else {
          response = await axios.put(
            `${import.meta.env.VITE_API_BASE_URL}/api/users/employee/${userId}`,
            submitData,
          );
        }
      }

      // Handle success
      toast.success(response.data.message || "Success!");
      console.log("Server Response:", response.data);
      fetchUsers();
      closeFormModal();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error.response?.data?.message || "Something went wrong.");
    }
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setSelectedRole("Staff");
    setFormData(getInitialFormState("Staff"));
    setActiveFormTab("personal");
    axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/api/users/employee/next-id`,
    ).then((response) => {
      const employeeId = response.data.employeeId || "";
      setNextEmployeeId(employeeId);
      setFormData((previous) => ({ ...previous, employeeId }));
    }).catch((error) => {
      console.error("Failed to fetch next employee ID:", error);
    });
    setIsFormModalOpen(true);
  };

  const handleEdit = (user) => {
    setIsEditing(true);
    setCurrentId(user.user_id);
    setSelectedRole(user.role);
    setActiveFormTab("personal");
    setFormData({
      ...getInitialFormState(user.role),
      email: user.email || "",
      password: "",
      confirmPassword: "",
      firstName: user.first_name || user.firstName || "",
      middleName: user.middle_name || user.middleName || "",
      lastName: user.last_name || user.lastName || "",
      suffix: user.suffix || "",
      dateOfBirth: user.date_of_birth ? user.date_of_birth.split("T")[0] : (user.dateOfBirth || user.dob || ""),
      dob: user.date_of_birth ? user.date_of_birth.split("T")[0] : (user.dateOfBirth || user.dob || ""),
      gender: user.gender || "",
      phone: user.phone || "",
      permanentAddress: user.permanent_address || user.permanentAddress || "",

      // Student details matching StudentRegistrationForm:
      studentNumber: user.student_number || user.studentNumber || "",
      studentType: user.student_type || user.studentType || "New Student",
      course: user.course || user.courseProgram || "",
      courseProgram: user.course || user.courseProgram || "",
      major: user.major || "",
      yearLevel: user.year_level || user.yearLevel || "",
      academicYear: user.academic_year || user.academicYear || "",
      semester: user.semester || "",
      civilStatus: user.civil_status || user.civilStatus || "Single",
      religion: user.religion || "",
      isPwd: user.is_pwd || user.isPwd || "No",
      indigenousPeople: user.indigenous_people || user.indigenousPeople || "No",
      zipCode: String(user.zip_code || user.zipCode || ""),
      birthPlace: user.birth_place || user.birthPlace || "",
      citizenship: user.citizenship || "Filipino",
      dateRegistered: user.date_registered ? user.date_registered.split("T")[0] : "",

      previousSchool: user.previous_school || user.previousSchool || user.senior_high_school_completed_at || "",
      yearGraduated: String(user.year_graduated || user.yearGraduated || user.senior_high_school_year_graduated || ""),
      elementarySchool: user.elementary_school_completed_at || user.elementarySchool || "",
      elementaryYearGraduated: String(user.elementary_school_year_graduated || user.elementaryYearGraduated || ""),
      juniorHighSchool: user.junior_high_school_completed_at || user.juniorHighSchool || "",
      juniorHighYearGraduated: String(user.junior_high_school_year_graduated || user.juniorHighYearGraduated || ""),
      seniorHighSchool: user.senior_high_school_completed_at || user.seniorHighSchool || "",
      seniorHighYearGraduated: String(user.senior_high_school_year_graduated || user.seniorHighYearGraduated || ""),
      collegeProgramAttended: user.college_program_course_attended || user.collegeProgramAttended || "",
      schoolYearAttended: user.school_year_attended || user.schoolYearAttended || "",

      fatherName: user.father_name || user.fatherName || "",
      fatherOccupation: user.father_occupation || user.fatherOccupation || "",
      fatherPhone: user.father_phone || user.fatherPhone || "",
      motherName: user.mother_name || user.motherName || "",
      motherOccupation: user.mother_occupation || user.motherOccupation || "",
      motherPhone: user.mother_phone || user.motherPhone || "",
      guardianName: user.guardian_name || user.guardianName || "",
      guardianRelationship: user.guardian_relationship || user.guardianRelationship || "",
      guardianPhone: user.guardian_phone || user.guardianPhone || "",
      parentPhone: user.parent_phone || user.parentPhone || "",
      mailingAddress: user.mailing_address || user.mailingAddress || "",

      otherFinancialAssistance: user.other_financial_assistance || user.otherFinancialAssistance || "No",
      scholarshipAssistance1: user.scholarship_assistance_1 || user.scholarshipAssistance1 || "",
      scholarshipAssistance2: user.scholarship_assistance_2 || user.scholarshipAssistance2 || "",
      scholarshipAssistance3: user.scholarship_assistance_3 || user.scholarshipAssistance3 || "",

      employeeId: user.employee_id || "",
      department: user.department || "",
      positionTitle: user.position_title || "",
      dateHired: user.date_hired || "",
      status: user.status || "Active",
      accessLevel: user.access_level || "",
      specialization: user.specialization || "",
      educationalAttainment: user.educational_attainment || "",
      licenseNumber: user.license_number || "",
    });
    setIsFormModalOpen(true);
  };


  const handleViewUser = (user) => {
    setViewingUser(user);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (user) => {
    setIsDeletingUser(true);
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/${user.user_id}`,
      );

      setUsers((prev) => prev.filter((u) => u.user_id !== user.user_id));
      setDeleteTargetUser(null);

      toast.success("User deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error(`Error deleting user: ${err.response?.data?.message || err.message}`,);
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handlePermissionChange = (role, permissionId, isAllowed) => {
    setRbac((prevRbac) => ({
      ...prevRbac,
      [role]: prevRbac[role].map((p) =>
        p.id === permissionId ? { ...p, allowed: isAllowed } : p,
      ),
    }));
  };

  // Determine logged-in user role
  const loggedInRole = (localStorage.getItem("role") || "").trim();
  const isHR = loggedInRole.toLowerCase() === "hr";

  /* -------------------------
   Search, filter, sort, paginate
   ------------------------- */
  const filteredSorted = useMemo(() => {
    // Ensure users is always an array
    const userList = Array.isArray(users) ? users : [];

    // When HR is logged in, never show student accounts
    let result = isHR
      ? userList.filter((u) => u.role !== "Student")
      : [...userList];

    // search by name, email, studentNumber, or employeeID
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (u) =>
          (u.firstName || u.first_name || "").toLowerCase().includes(q) ||
          (u.lastName || u.last_name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.studentNumber || u.student_number || "").toLowerCase().includes(q) ||
          (u.employeeId || u.employee_id || "").toLowerCase().includes(q),
      );
    }

    // filter by role
    if (filterRole) {
      result = result.filter((u) => u.role === filterRole);
    }

    // sort
    result.sort((a, b) => {
      let av = a[sortField] || "";
      let bv = b[sortField] || "";

      // compare as date if field is dateHired
      if (sortField === "dateHired") {
        av = a.dateHired ? new Date(a.dateHired).getTime() : 0;
        bv = b.dateHired ? new Date(b.dateHired).getTime() : 0;
      } else {
        av = String(av).toLowerCase();
        bv = String(bv).toLowerCase();
      }

      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, query, filterRole, sortField, sortDir, isHR]);

  const pageCount = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  useEffect(() => {
    if (page > pageCount) setPage(1);
  }, [pageCount, page]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, page]);

  /* -------------------------
     Export helpers
     ------------------------- */
  const exportCSV = () => {
    if (filteredSorted.length === 0) {
      toast.warning("No users to export.");
      return;
    }
    const exportData = filteredSorted.map((u) => ({
      first_name: u.first_name || u.firstName || "",
      last_name: u.last_name || u.lastName || "",
      email: u.email || "",
      phone: u.phone || "",
      role: u.role || "",
      employee_id: u.employee_id || u.employeeId || (u.role === "Student" ? u.student_number || u.studentNumber : "") || "",
      department: u.department || (u.role === "Student" ? u.course || "" : "") || "",
      position_title: u.position_title || u.positionTitle || "",
      date_hired: u.date_hired || u.dateHired || "",
      status: u.status || "",
    }));
    downloadExcel(exportData, {
      title: "Employee & User Records",
      officeLabel: "HR Office",
      headers: [
        "first_name",
        "last_name",
        "email",
        "phone",
        "role",
        "employee_id",
        "department",
        "position_title",
        "date_hired",
        "status",
      ],
    });
  };

  const exportPDF = () => {
    if (filteredSorted.length === 0) {
      toast.warning("No users to export.");
      return;
    }
    const exportData = filteredSorted.map((u) => ({
      first_name: u.first_name || u.firstName || "",
      last_name: u.last_name || u.lastName || "",
      email: u.email || "",
      role: u.role || "",
      employee_id: u.employee_id || u.employeeId || (u.role === "Student" ? u.student_number || u.studentNumber : "") || "",
      department: u.department || (u.role === "Student" ? u.course || "" : "") || "",
      status: u.status || "",
    }));
    downloadPDF(exportData, {
      title: "Employee & User Records",
      officeLabel: "HR Office",
      orientation: "portrait",
      headers: ["first_name", "last_name", "email", "role", "employee_id", "department", "status"],
    });
  };

  /* -------------------------
     Render helpers & components
     ------------------------- */

  const SectionTitle = ({ icon: Icon, title, color = "text-gray-700" }) => (
    <h3
      className={`col-span-full flex items-center gap-2 text-lg font-extrabold ${color} border-b-2 border-dashed border-gray-200 pb-2.5 mb-3 mt-2`}
    >
      <Icon className="w-5 h-5" />
      {title}
    </h3>
  );

  const renderCommonFields = () => (
    <div className="space-y-5">
      <div>
        <SectionDivider title="Role & account" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReactSelectInput name="role" label="User role *" placeholder="Select role" value={selectedRole} onChange={handleRoleChange} isDisabled={isEditing} options={["Admin", "Faculty", "Staff", "HR", "Accounting"].map((role) => ({ value: role, label: role }))} />
          <TextInput type="email" name="email" label="Email address *" value={formData.email} onChange={handleInputChange} required />
          <TextInput type="password" name="password" label={isEditing ? "Password (leave blank to keep)" : "Password *"} value={formData.password} onChange={handleInputChange} required={!isEditing} />
          <TextInput type="password" name="confirmPassword" label={isEditing ? "Confirm password (leave blank to keep)" : "Confirm password *"} value={formData.confirmPassword} onChange={handleInputChange} required={!isEditing} />
        </div>
      </div>
      <div>
        <SectionDivider title="Personal information" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TextInput name="firstName" label="First name *" value={formData.firstName} onChange={handleInputChange} required />
          <TextInput name="middleName" label="Middle name" value={formData.middleName} onChange={handleInputChange} />
          <TextInput name="lastName" label="Last name *" value={formData.lastName} onChange={handleInputChange} required />
          <TextInput name="suffix" label="Suffix (Jr., Sr.)" value={formData.suffix} onChange={handleInputChange} />
          <TextInput type="date" name="dateOfBirth" label="Date of birth" value={formData.dateOfBirth} onChange={handleInputChange} />
          <ReactSelectInput name="gender" label="Gender" placeholder="Select gender" value={formData.gender} onChange={handleInputChange} options={["Male", "Female", "Non-Binary", "Prefer not to say"].map((value) => ({ value, label: value }))} />
          <TextInput type="tel" name="phone" label="Phone number" value={formData.phone} onChange={handleInputChange} />
          <div className="md:col-span-2">
            <TextAreaInput name="permanentAddress" label="Permanent address" value={formData.permanentAddress} onChange={handleInputChange} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStudentFields = () => (
    <div className="space-y-6">
      <div>
        <SectionDivider title="Academic & Program details" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TextInput
            name="studentNumber"
            label="Student Number *"
            placeholder="Student Number"
            value={formData.studentNumber}
            onChange={handleInputChange}
            disabled={isEditing}
            required
          />
          <ReactSelectInput
            name="studentType"
            label="Student Type"
            placeholder="Select Type"
            value={formData.studentType}
            onChange={handleInputChange}
            options={[
              { value: "New Student", label: "New Student" },
              { value: "Transferee", label: "Transferee" },
              { value: "Returnee", label: "Returnee" },
              { value: "Continuing", label: "Continuing" },
            ]}
          />
          <TextInput
            name="course"
            label="Program / Course *"
            placeholder="e.g., BSIT, BSBA, BSED"
            value={formData.course || formData.courseProgram}
            onChange={handleInputChange}
          />
          <TextInput
            name="major"
            label="Major"
            placeholder="e.g., Network Administration"
            value={formData.major}
            onChange={handleInputChange}
          />
          <ReactSelectInput
            name="yearLevel"
            label="Year Level *"
            placeholder="Select Year Level"
            value={formData.yearLevel}
            onChange={handleInputChange}
            options={[
              { value: "1st Year", label: "1st Year" },
              { value: "2nd Year", label: "2nd Year" },
              { value: "3rd Year", label: "3rd Year" },
              { value: "4th Year", label: "4th Year" },
            ]}
          />
          <TextInput
            name="academicYear"
            label="Academic Year"
            placeholder="e.g., 2024-2025"
            value={formData.academicYear}
            onChange={handleInputChange}
          />
          <ReactSelectInput
            name="semester"
            label="Semester"
            placeholder="Select Semester"
            value={formData.semester}
            onChange={handleInputChange}
            options={[
              { value: "1st Semester", label: "1st Semester" },
              { value: "2nd Semester", label: "2nd Semester" },
              { value: "Summer", label: "Summer" },
            ]}
          />
        </div>
      </div>

      <div>
        <SectionDivider title="Educational Background" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput
            name="elementarySchool"
            label="Elementary School"
            placeholder="School Name"
            value={formData.elementarySchool}
            onChange={handleInputChange}
          />
          <TextInput
            name="elementaryYearGraduated"
            label="Elementary Year Graduated"
            placeholder="e.g., 2016"
            value={formData.elementaryYearGraduated}
            onChange={handleInputChange}
          />
          <TextInput
            name="juniorHighSchool"
            label="Junior High School"
            placeholder="School Name"
            value={formData.juniorHighSchool}
            onChange={handleInputChange}
          />
          <TextInput
            name="juniorHighYearGraduated"
            label="Junior High Year Graduated"
            placeholder="e.g., 2020"
            value={formData.juniorHighYearGraduated}
            onChange={handleInputChange}
          />
          <TextInput
            name="seniorHighSchool"
            label="Senior High School / Previous School"
            placeholder="School Name"
            value={formData.seniorHighSchool || formData.previousSchool}
            onChange={handleInputChange}
          />
          <TextInput
            name="seniorHighYearGraduated"
            label="Senior High Year Graduated"
            placeholder="e.g., 2022"
            value={formData.seniorHighYearGraduated || formData.yearGraduated}
            onChange={handleInputChange}
          />
          <TextInput
            name="collegeProgramAttended"
            label="College Program Attended (Transferee)"
            placeholder="Previous Program if any"
            value={formData.collegeProgramAttended}
            onChange={handleInputChange}
          />
          <TextInput
            name="schoolYearAttended"
            label="School Year Attended (College)"
            placeholder="e.g., 2022-2023"
            value={formData.schoolYearAttended}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div>
        <SectionDivider title="Demographics & Additional Info" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ReactSelectInput
            name="civilStatus"
            label="Civil Status"
            placeholder="Select Status"
            value={formData.civilStatus}
            onChange={handleInputChange}
            options={[
              { value: "Single", label: "Single" },
              { value: "Married", label: "Married" },
              { value: "Widowed", label: "Widowed" },
              { value: "Separated", label: "Separated" },
            ]}
          />
          <TextInput
            name="religion"
            label="Religion"
            placeholder="Religion"
            value={formData.religion}
            onChange={handleInputChange}
          />
          <TextInput
            name="citizenship"
            label="Citizenship"
            placeholder="Citizenship"
            value={formData.citizenship}
            onChange={handleInputChange}
          />
          <TextInput
            name="birthPlace"
            label="Birth Place"
            placeholder="Town / Province"
            value={formData.birthPlace}
            onChange={handleInputChange}
          />
          <TextInput
            name="zipCode"
            label="Zip Code"
            placeholder="e.g., 5201"
            value={formData.zipCode}
            onChange={handleInputChange}
          />
          <ReactSelectInput
            name="isPwd"
            label="Person With Disability (PWD)"
            placeholder="Select"
            value={formData.isPwd}
            onChange={handleInputChange}
            options={[
              { value: "No", label: "No" },
              { value: "Yes", label: "Yes" },
            ]}
          />
          <ReactSelectInput
            name="indigenousPeople"
            label="Indigenous People (IP)"
            placeholder="Select"
            value={formData.indigenousPeople}
            onChange={handleInputChange}
            options={[
              { value: "No", label: "No" },
              { value: "Yes", label: "Yes" },
            ]}
          />
        </div>
      </div>

      <div>
        <SectionDivider title="Family & Guardian details" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TextInput
            name="fatherName"
            label="Father's Name"
            placeholder="Full Name"
            value={formData.fatherName}
            onChange={handleInputChange}
          />
          <TextInput
            name="fatherOccupation"
            label="Father's Occupation"
            placeholder="Occupation"
            value={formData.fatherOccupation}
            onChange={handleInputChange}
          />
          <TextInput
            type="tel"
            name="fatherPhone"
            label="Father's Contact"
            placeholder="Phone number"
            value={formData.fatherPhone}
            onChange={handleInputChange}
          />
          <TextInput
            name="motherName"
            label="Mother's Name"
            placeholder="Full Name"
            value={formData.motherName}
            onChange={handleInputChange}
          />
          <TextInput
            name="motherOccupation"
            label="Mother's Occupation"
            placeholder="Occupation"
            value={formData.motherOccupation}
            onChange={handleInputChange}
          />
          <TextInput
            type="tel"
            name="motherPhone"
            label="Mother's Contact"
            placeholder="Phone number"
            value={formData.motherPhone}
            onChange={handleInputChange}
          />
          <TextInput
            name="guardianName"
            label="Guardian's Name"
            placeholder="Full Name"
            value={formData.guardianName}
            onChange={handleInputChange}
          />
          <TextInput
            name="guardianRelationship"
            label="Guardian Relationship"
            placeholder="e.g., Aunt, Grandparent"
            value={formData.guardianRelationship}
            onChange={handleInputChange}
          />
          <TextInput
            type="tel"
            name="guardianPhone"
            label="Guardian Contact"
            placeholder="Phone number"
            value={formData.guardianPhone || formData.parentPhone}
            onChange={handleInputChange}
          />
          <div className="md:col-span-3">
            <TextAreaInput
              name="mailingAddress"
              label="Mailing Address (if different from Permanent)"
              placeholder="Present / Mailing Address"
              value={formData.mailingAddress}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>

      <div>
        <SectionDivider title="Financial Assistance & Scholarship" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ReactSelectInput
            name="otherFinancialAssistance"
            label="Other Financial Assistance"
            placeholder="Select"
            value={formData.otherFinancialAssistance}
            onChange={handleInputChange}
            options={[
              { value: "No", label: "No" },
              { value: "Yes", label: "Yes" },
            ]}
          />
          {formData.otherFinancialAssistance === "Yes" && (
            <>
              <TextInput
                name="scholarshipAssistance1"
                label="Scholarship Source 1"
                placeholder="Grant / Scholarship Name"
                value={formData.scholarshipAssistance1}
                onChange={handleInputChange}
              />
              <TextInput
                name="scholarshipAssistance2"
                label="Scholarship Source 2"
                placeholder="Grant / Scholarship Name"
                value={formData.scholarshipAssistance2}
                onChange={handleInputChange}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );


  const renderEmployeeFields = () => (
    <div className="space-y-5">
      <div>
        <SectionDivider title="Employment details" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TextInput name="employeeId" label="Employee ID" value={formData.employeeId} onChange={handleInputChange} required disabled={!isEditing && !!formData.employeeId} />
          <ReactSelectInput name="department" label="Department *" placeholder="Select department" value={formData.department} onChange={handleInputChange} options={departments.map((dept) => ({ value: dept.name, label: dept.name }))} />
          <TextInput name="positionTitle" label="Position title *" placeholder="e.g., Professor, Instructor" value={formData.positionTitle} onChange={handleInputChange} required />
          <TextInput type="date" name="dateHired" label="Date hired" value={formData.dateHired} onChange={handleInputChange} />
          <ReactSelectInput name="status" label="Employment status" value={formData.status} onChange={handleInputChange} options={[{ value: "Active", label: "Active" }, { value: "Leave", label: "On Leave" }, { value: "Terminated", label: "Terminated" }]} />
          {selectedRole === "Admin" && (
            <ReactSelectInput name="accessLevel" label="Access level" value={formData.accessLevel} onChange={handleInputChange} options={[{ value: "Standard Admin", label: "Standard Admin" }, { value: "Super Admin", label: "Super Admin" }]} />
          )}
        </div>
      </div>
      {(selectedRole === "Faculty" || selectedRole === "Admin") && (
        <div>
          <SectionDivider title="Academic credentials" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextInput name="specialization" label="Specialization" value={formData.specialization} onChange={handleInputChange} placeholder="e.g., Software Engineering" />
            <SelectInput name="educationalAttainment" label="Educational attainment" value={formData.educationalAttainment} onChange={handleInputChange}>
              <option value="">Select...</option><option value="Bachelor's Degree">Bachelor's Degree</option><option value="Master's Degree">Master's Degree</option><option value="Doctorate">Doctorate</option><option value="PhD">PhD</option>
            </SelectInput>
            <TextInput name="licenseNumber" label="License number (PRC)" value={formData.licenseNumber} onChange={handleInputChange} />
          </div>
        </div>
      )}
    </div>
  );

  const renderAdminExtras = () => (
    <>
      <div className="md:col-span-2 lg:col-span-3 p-2.5 bg-green-50 rounded-lg border border-green-200">
        <h4 className="font-bold text-green-800 mb-2">Academic Credentials</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <TextInput
            name="specialization"
            placeholder="Specialization (e.g., IT)"
            value={formData.specialization}
            onChange={handleInputChange}
          />
          <TextInput
            name="educationalAttainment"
            placeholder="Highest Educational Attainment"
            value={formData.educationalAttainment}
            onChange={handleInputChange}
          />
          <TextInput
            name="licenseNumber"
            placeholder="License Number (PRC)"
            value={formData.licenseNumber}
            onChange={handleInputChange}
          />
        </div>
      </div>
      <div className="md:col-span-2 lg:col-span-3 p-2.5 bg-red-50 rounded-lg border border-red-200 flex items-center gap-4">
        <ShieldCheck className="w-5 h-5 text-red-600" />
        <div className="flex-grow">
          <label className="block text-red-800 font-bold mb-1 text-sm">
            System Access Level
          </label>
          <SelectInput
            name="accessLevel"
            value={formData.accessLevel}
            onChange={handleInputChange}
            className="w-full bg-white border-red-300"
          >
            <option value="Admin">Standard Admin</option>
            <option value="Super Admin">Super Admin</option>
          </SelectInput>
        </div>
      </div>
    </>
  );

  const renderFacultyExtras = () => (
    <div className="md:col-span-2 lg:col-span-3 p-2.5 bg-green-50 rounded-lg border border-green-200">
      <h4 className="font-bold text-green-800 mb-2">Academic Credentials</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <TextInput
          name="specialization"
          placeholder="Specialization (e.g., IT)"
          value={formData.specialization}
          onChange={handleInputChange}
        />
        <TextInput
          name="educationalAttainment"
          placeholder="Highest Educational Attainment"
          value={formData.educationalAttainment}
          onChange={handleInputChange}
        />
        <TextInput
          name="licenseNumber"
          placeholder="License Number (PRC)"
          value={formData.licenseNumber}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );

  /* -------------------------
     User List view (table)
     ------------------------- */

  const renderUserList = () => (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-700">
            All Users ({filteredSorted.length})
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search name, email, id..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="p-1.5 border border-gray-300 rounded-md text-sm"
            />
            <SelectInput
              name=""
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-40"
            >
              <option value="">All Roles</option>
              {!isHR && <option value="Student">Student</option>}
              <option value="Admin">Admin</option>
              <option value="Faculty">Faculty</option>
              <option value="Staff">Staff</option>
              <option value="HR">HR</option>
              <option value="Accounting">Accounting</option>
            </SelectInput>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Export CSV */}
          <div className="relative group">
            <button
              onClick={exportCSV}
              className="p-2 border rounded-md  border-slate-400 text-sm hover:bg-gray-100 transition"
            >
              <FileDown size={18} />
            </button>
            <span
              className="absolute left-1/2 -translate-x-1/2 mt-1 hidden group-hover:block 
                     bg-black text-white text-xs px-2 py-1 rounded shadow-lg"
            >
              Export CSV
            </span>
          </div>

          {/* Export PDF */}
          <div className="relative group">
            <button
              onClick={exportPDF}
              className="p-2 border rounded-md text-sm  border-slate-400 hover:bg-gray-100 transition"
            >
              <FileText size={18} />
            </button>
            <span
              className="absolute left-1/2 -translate-x-1/2 mt-1 hidden group-hover:block 
                     bg-black text-white text-xs px-2 py-1 rounded shadow-lg"
            >
              Export PDF
            </span>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-md shadow-sm text-sm"
          >
            <UserPlus className="w-4 h-4" /> New User
          </button>
        </div>
      </div>

      <div className="bg-white  rounded overflow-hidden border border-gray-100">
        <table className="min-w-full leading-normal">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-600 uppercase text-xs tracking-wider border-b">
              <th className="px-3 py-2">Name & Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">ID / Title</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                  No user accounts found.
                </td>
              </tr>
            ) : (
              paged.map((user) => {
                const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.Staff;
                const RoleIcon = roleConfig.icon;

                return (
                  <tr
                    key={user.user_id}
                    className="border-b border-gray-100 hover:bg-indigo-50 transition duration-150"
                  >
                    <td className="px-3 py-2">
                      <p className="text-gray-900 whitespace-nowrap font-semibold">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-indigo-600 text-xs">{user.email}</p>
                    </td>

                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-1 inline-flex items-center gap-1 text-xs font-bold rounded-full ${roleConfig.color} border`}
                      >
                        <RoleIcon className="w-3 h-3" />
                        {user.role}
                      </span>
                    </td>

                    <td className="px-3 py-2 text-sm text-gray-700">
                      {user.role === "Student"
                        ? user.student_number
                        : user.employee_id}
                      <p className="text-xs text-gray-500 mt-0.5">
                        {user.position_title || user.course || "—"}
                      </p>
                    </td>

                    <td className="px-3 py-2 text-sm">
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          user.status === "Active"
                            ? "bg-green-500 text-white"
                            : "bg-yellow-500 text-white"
                        }`}
                      >
                        {user.status || "Active"}
                      </span>
                    </td>

                    <td className="px-3 py-2 text-right text-sm flex justify-end space-x-1">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleEdit(user)}
                        className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-100 transition"
                        title="Edit Record"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteTargetUser(user)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-between text-sm">
        {/* Showing X - Y of Z */}
        <div className="text-gray-600">
          Showing {(page - 1) * pageSize + 1} -{" "}
          {Math.min(page * pageSize, filteredSorted.length)} of{" "}
          {filteredSorted.length}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-3">
          {/* Prev Button */}
          <div className="relative group">
            <button
              className="p-1 border rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={18} />
            </button>
          </div>

          {/* Page Indicator */}
          <div className="text-gray-700">
            Page{" "}
            <strong>
              {page} / {pageCount}
            </strong>
          </div>

          {/* Next Button */}
          <div className="relative group">
            <button
              className="p-1 border rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // RBAC/Access Control modal and view removed as requested

  /* -------------------------
     MAIN RENDER
     ------------------------- */

  return (
    <div className="p-3 max-w-7xl mx-auto font-sans">
      <div className="flex items-center gap-2 mb-3">
        <User2Icon className="w-7 h-7 text-indigo-600" />
        <h1 className="text-2xl font-extrabold text-gray-800">
          Employee Management
        </h1>
      </div>

      <div className="flex border-b border-gray-300 mb-3">
        {/* Manage Users */}
        <button
          onClick={() => setCurrentPage("users")}
          className={`flex items-center gap-2 px-4 py-1.5 font-semibold text-sm transition duration-150
      ${
        currentPage === "users"
          ? "border-b-2 border-indigo-600 text-indigo-600"
          : "text-gray-500 hover:text-indigo-600"
      }
    `}
        >
          <Users className="w-4 h-4" /> Manage Users
        </button>

        {/* Access Control (RBAC) tab removed as requested */}
      </div>

      <div className="py-1">{renderUserList()}</div>

      {/* CREATE/EDIT MODAL */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={isEditing ? "Edit user record" : "Create new user account"}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="flex border-b border-slate-200 mb-5">
            {[
              { id: "personal", label: "Personal info" },
              { id: "role", label: "Role details" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFormTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeFormTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-indigo-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeFormTab === "personal" && (
            renderCommonFields()
          )}

          {activeFormTab === "role" &&
            (selectedRole === "Student"
              ? renderStudentFields()
              : renderEmployeeFields())}

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={closeFormModal}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition shadow text-sm font-medium"
            >
              {isEditing ? "Save changes" : "Create account"}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteTargetUser !== null}
        onClose={() => !isDeletingUser && setDeleteTargetUser(null)}
        title="Delete user?"
        size="sm"
      >
        <p className="text-sm text-slate-600">
          Delete {deleteTargetUser?.first_name || deleteTargetUser?.name || "this user"}?
          This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeleteTargetUser(null)}
            disabled={isDeletingUser}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleDelete(deleteTargetUser)}
            disabled={isDeletingUser}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeletingUser ? "Deleting..." : "Yes, delete user"}
          </button>
        </div>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      {viewingUser && (
        <ViewUserModal
          isOpen={isViewModalOpen}
          onClose={closeViewModal}
          user={viewingUser}
        />
      )}
    </div>
  );
}

export default EmployeeRecords;
