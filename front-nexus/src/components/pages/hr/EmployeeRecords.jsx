// UserManagement.jsx
import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
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

/* const studentSpecifics = {
  parentPhone: "",
  mailingAddress: "",
  fatherName: "",
  motherName: "",
  studentNumber: "",
  course: "",
  major: "",
  yearLevel: "",
  previousSchool: "",
  yearGraduated: "",
};
 */
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
  className = "",
}) => (
  <input
    type={type}
    name={name}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    required={required}
    className={`w-full p-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out shadow-sm text-sm ${className}`}
  />
);

const SelectInput = ({
  name,
  placeholder,
  value,
  onChange,
  children,
  className = "",
  required = false,
  ...props
}) => (
  <select
    name={name}
    value={value}
    onChange={onChange}
    required={required}
    className={`w-full p-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out shadow-sm text-sm appearance-none bg-white ${className}`}
    {...props}
  >
    <option value="" disabled>
      {placeholder || `Select ${name}`}
    </option>
    {children}
  </select>
);

const TextAreaInput = ({
  name,
  placeholder,
  value,
  onChange,
  className = "",
}) => (
  <textarea
    name={name}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`w-full p-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out shadow-sm text-sm h-12 ${className}`}
  />
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
        className={`bg-white rounded-xl shadow-2xl w-full ${widthClass} max-h-[90vh] overflow-y-auto transform transition-transform duration-200 scale-100`}
      >
        <div className="sticky top-0 bg-white border-b p-2.5 flex justify-between items-center z-10 rounded-t-xl">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-3">{children}</div>
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
  const [programs, setPrograms] = useState([]); // Added programs state
  const [rbac, setRbac] = useState(INITIAL_RBAC_STATE);

  // modals & form state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [selectedRole, setSelectedRole] = useState("Student");
  const [formData, setFormData] = useState(getInitialFormState("Student"));

  // view modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);

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
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/dept/departments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }, // Added missing closing brace and comma
      );
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchPrograms = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/programs`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setPrograms(response.data);
    } catch (error) {
      console.error("Error fetching programs:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
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
    fetchPrograms();
  }, []);

  /* -------------------------
     helpers
     ------------------------- */
  // effect to keep form role in sync
  useEffect(() => {
    if (!isEditing) {
      setFormData(getInitialFormState(selectedRole));
    }
  }, [selectedRole, isEditing]);

  function getInitialFormState(role) {
    let specificFields = {};
    if (role === "Admin")
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
    setFormData(getInitialFormState("Student"));
    setSelectedRole("Student");
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
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // image upload (base64 preview)
  const handleProfileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, profilePicture: reader.result }));
    };
    reader.readAsDataURL(file);
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
          alert(
            "Password and Confirm Password must match and cannot be empty.",
          );
          return;
        }

        // Check required fields for employee
        if (selectedRole !== "Student") {
          const requiredFields = [
            "email",
            "firstName",
            "lastName",
            "employeeId",
          ];
          const missing = requiredFields.filter(
            (field) => !submitData[field] || submitData[field].trim() === "",
          );
          if (missing.length) {
            alert(`Please fill required fields: ${missing.join(", ")}`);
            return;
          }
        }

        // STUDENT ACCOUNT CREATION
        if (selectedRole === "Student") {
          response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/api/users/student`,
            submitData,
          );
        }

        // EMPLOYEE / ADMIN / FACULTY / STAFF CREATION
        else {
          response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/api/users/employee`,
            submitData,
          );
        }
      }

      // -------- EDIT MODE --------
      else {
        const userId = currentId;

        // STUDENT UPDATE
        if (selectedRole === "Student") {
          response = await axios.put(
            `${import.meta.env.VITE_API_BASE_URL}/api/users/student/${userId}`,
            submitData,
          );
        }

        // EMPLOYEE / ADMIN / FACULTY / STAFF UPDATE
        else {
          response = await axios.put(
            `${import.meta.env.VITE_API_BASE_URL}/api/users/employee/${userId}`,
            submitData,
          );
        }
      }

      // Handle success
      alert(response.data.message || "Success!");
      console.log("Server Response:", response.data);
      fetchUsers();
      // Optional token save
      if (response.data.token)
        localStorage.setItem("token", response.data.token);

      closeFormModal();
    } catch (error) {
      console.error("Submission error:", error);
      alert(error.response?.data?.message || "Something went wrong.");
    }
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setFormData(getInitialFormState("Student"));
    setSelectedRole("Student");
    setIsFormModalOpen(true);
  };

  const handleEdit = (user) => {
    setIsEditing(true);
    setCurrentId(user.user_id);
    setSelectedRole(user.role);
    setFormData({
      ...getInitialFormState(user.role),
      email: user.email || "",
      firstName: user.first_name || "",
      middleName: user.middle_name || "",
      lastName: user.last_name || "",
      suffix: user.suffix || "",
      dateOfBirth: user.dateOfBirth || "",
      gender: user.gender || "",
      phone: user.phone || "",
      permanentAddress: user.permanent_address || "",
      studentNumber: user.student_number || "",
      course: user.course || "",
      major: user.major || "",
      yearLevel: user.year_level || "",
      previousSchool: user.previous_school || "",
      yearGraduated: user.year_graduated || "",
      mailingAddress: user.mailing_address || "",
      fatherName: user.father_name || "",
      motherName: user.mother_name || "",
      parentPhone: user.parent_phone || "",
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

  const handleDelete = async (userId) => {
    if (!confirm("Delete this user? This action cannot be undone.")) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/${userId}`,
      );

      setUsers((prev) => prev.filter((u) => u.user_id !== userId));

      alert("User deleted successfully");
    } catch (err) {
      console.error(err);
      alert(
        `Error deleting user: ${err.response?.data?.message || err.message}`,
      );
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

  /* -------------------------
   Search, filter, sort, paginate
   ------------------------- */
  const filteredSorted = useMemo(() => {
    // Ensure users is always an array
    const userList = Array.isArray(users) ? users : [];

    let result = [...userList];

    // search by name, email, studentNumber, or employeeID
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (u) =>
          (u.firstName || "").toLowerCase().includes(q) ||
          (u.lastName || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.studentNumber || "").toLowerCase().includes(q) ||
          (u.employeeId || "").toLowerCase().includes(q),
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
  }, [users, query, filterRole, sortField, sortDir]);

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
    if (users.length === 0) {
      alert("No users to export.");
      return;
    }
    const headers = [
      "id",
      "role",
      "firstName",
      "lastName",
      "email",
      "phone",
      "employeeId",
      "studentNumber",
      "department",
      "positionTitle",
      "dateHired",
      "status",
    ];
    const rows = users.map((u) =>
      headers
        .map((h) => `"${(u[h] || "")?.toString().replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (users.length === 0) {
      alert("No users to export.");
      return;
    }
    // Simple printable view — user can "Save as PDF" from print dialog
    const printWindow = window.open("", "_blank");
    const content = `
     <html>
  <head>
    <title>Users Export</title>
    <style>
      @media print {
        body { margin: 0; padding: 0; }
        header, footer { position: fixed; width: 100%; }
        header { top: 0; }
        footer { bottom: 0; text-align: center; font-size: 10px; }
        table { margin-top: 100px; margin-bottom: 50px; }
      }

      body {
        font-family: Arial, sans-serif;
        padding: 20px;
        color: #111;
      }

      header {
        text-align: center;
        margin-bottom: 20px;
      }

      footer {
        text-align: center;
        margin-top: 20px;
        font-size: 10px;
        color: #555;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 12px;
      }

      th, td {
        border: 1px solid #ccc;
        padding: 6px;
        text-align: left;
        font-size: 12px;
      }

      th {
        background: #f4f4f4;
      }
    </style>
  </head>
  <body>
    <header>
      <h1>Baco Community College</h1>
      <h2>Users Export</h2>
      <p>${new Date().toLocaleString()}</p>
    </header>

    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>ID/Number</th>
          <th>Department / Course</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${users
          .map(
            (u) =>
              `<tr>
                <td>${u.last_name || ""}, ${u.first_name || ""}</td>
                <td>${u.email || ""}</td>
                <td>${u.role || ""}</td>
                <td>${
                  u.role === "Student"
                    ? u.student_number || ""
                    : u.employee_id || ""
                }</td>
                <td>${
                  u.role === "Student" ? u.course || "" : u.department || ""
                }</td>
                <td>${u.status || ""}</td>
              </tr>`,
          )
          .join("")}
      </tbody>
    </table>

    <footer>
      Baco Community College - Page 1
    </footer>
  </body>
</html>

    `;
    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    // Allow slight delay then open print dialog
    setTimeout(() => {
      printWindow.print();
    }, 250);
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <div className="col-span-full flex items-center justify-between">
        <SectionTitle icon={Users} title="Account & Personal Information" />
        <button
          type="button"
          onClick={() => setCollapsed((s) => ({ ...s, account: !s.account }))}
          className="text-xs text-gray-500"
        >
          {collapsed.account ? (
            <ChevronUp className="inline w-4 h-4" />
          ) : (
            <ChevronDown className="inline w-4 h-4" />
          )}
        </button>
      </div>

      {!collapsed.account && (
        <>
          <TextInput
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <TextInput
            type="password"
            name="password"
            placeholder="Password (Leave blank to keep old password)"
            value={formData.password}
            onChange={handleInputChange}
            required={!isEditing}
          />
          <TextInput
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required={!isEditing}
          />
          <TextInput
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleInputChange}
            required
          />
          <TextInput
            name="middleName"
            placeholder="Middle Name"
            value={formData.middleName}
            onChange={handleInputChange}
          />
          <TextInput
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleInputChange}
            required
          />
          <TextInput
            name="suffix"
            placeholder="Suffix (Jr, Sr)"
            value={formData.suffix}
            onChange={handleInputChange}
          />
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1 ml-1">
              Date of Birth
            </label>
            {/* fixed label */}
            <TextInput
              type="date"
              name="dateOfBirth"
              placeholder=""
              value={formData.dateOfBirth}
              onChange={handleInputChange}
            />
          </div>

          <SelectInput
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </SelectInput>

          <TextInput
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleInputChange}
          />

          <TextAreaInput
            name="permanentAddress"
            placeholder="Permanent Address"
            value={formData.permanentAddress}
            onChange={handleInputChange}
            className="lg:col-span-3"
          />

          {/* Profile picture upload */}
          <div className="lg:col-span-3 flex items-center gap-3">
            <label className="text-xs text-gray-600">Profile Picture</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleProfileUpload}
              className="text-sm"
            />
            {formData.profilePicture && (
              <img
                src={formData.profilePicture}
                alt="preview"
                className="h-10 w-10 rounded-full object-cover border"
              />
            )}
          </div>
        </>
      )}
    </div>
  );

  /*   const renderStudentFields = () => (
    <div className="p-3 mt-4 rounded-xl bg-indigo-50 border border-indigo-200 shadow-inner">
      <div className="flex items-center justify-between">
        <SectionTitle
          icon={GraduationCap}
          title="Student Academic Details"
          color="text-indigo-800"
        />
        <button
          type="button"
          onClick={() => setCollapsed((s) => ({ ...s, student: !s.student }))}
          className="text-xs text-indigo-700"
        >
          {collapsed.student ? (
            <ChevronUp className="inline w-4 h-4" />
          ) : (
            <ChevronDown className="inline w-4 h-4" />
          )}
        </button>
      </div>

      {!collapsed.student && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <TextInput
            name="studentNumber"
            placeholder="Student Number"
            value={formData.studentNumber}
            onChange={handleInputChange}
            required={selectedRole === "Student"}
          />
          <SelectInput
            name="course"
            value={formData.course}
            onChange={handleInputChange}
          >
            <option value="" disabled>
              Select Course (Program)
            </option>
            {programs.map((prog) => (
              <option key={prog.id} value={prog.code}>
                {prog.code} - {prog.name}
              </option>
            ))}
          </SelectInput>
          <TextInput
            name="major"
            placeholder="Major"
            value={formData.major}
            onChange={handleInputChange}
          />
          <SelectInput
            name="yearLevel"
            value={formData.yearLevel}
            onChange={handleInputChange}
          >
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </SelectInput>
          <TextInput
            name="previousSchool"
            placeholder="Previous School"
            value={formData.previousSchool}
            onChange={handleInputChange}
          />
          <TextInput
            name="yearGraduated"
            placeholder="Year Graduated"
            value={formData.yearGraduated}
            onChange={handleInputChange}
          />
          <div className="lg:col-span-3">
            <TextAreaInput
              name="mailingAddress"
              placeholder="Mailing Address (if different from Permanent)"
              value={formData.mailingAddress}
              onChange={handleInputChange}
            />
          </div>

          <SectionTitle
            icon={Users}
            title="Parent/Guardian Information"
            color="text-indigo-800"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 col-span-full">
            <TextInput
              name="fatherName"
              placeholder="Father's Name"
              value={formData.fatherName}
              onChange={handleInputChange}
            />
            <TextInput
              name="motherName"
              placeholder="Mother's Name"
              value={formData.motherName}
              onChange={handleInputChange}
            />
            <TextInput
              type="tel"
              name="parentPhone"
              placeholder="Parent's Phone"
              value={formData.parentPhone}
              onChange={handleInputChange}
            />
          </div>
        </div>
      )}
    </div>
  );
 */
  const renderEmployeeFields = () => (
    <div className="p-3 mt-4 rounded-xl bg-gray-50 border border-gray-200 shadow-inner">
      <div className="flex items-center justify-between">
        <SectionTitle
          icon={Briefcase}
          title="Employment Details"
          color="text-gray-800"
        />
        <button
          type="button"
          onClick={() => setCollapsed((s) => ({ ...s, employee: !s.employee }))}
          className="text-xs text-gray-600"
        >
          {collapsed.employee ? (
            <ChevronUp className="inline w-4 h-4" />
          ) : (
            <ChevronDown className="inline w-4 h-4" />
          )}
        </button>
      </div>

      {!collapsed.employee && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Only show employeeId for roles that require it */}
          {["Admin", "Faculty", "Staff", "HR", "Accounting"].includes(
            selectedRole,
          ) && (
            <TextInput
              name="employeeId"
              placeholder="Employee ID"
              value={formData.employeeId}
              onChange={handleInputChange}
              required
            />
          )}
          <SelectInput
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            className={selectedRole === "Student" ? "hidden" : ""}
            required={selectedRole !== "Student"}
          >
            <option value="" disabled>
              Select Department
            </option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </SelectInput>
          <TextInput
            name="positionTitle"
            placeholder="Position Title"
            value={formData.positionTitle}
            onChange={handleInputChange}
            required={selectedRole !== "Student"}
          />

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 -mb-1 ml-1">
              Date Hired
            </label>
            <TextInput
              type="date"
              name="dateHired"
              value={formData.dateHired}
              onChange={handleInputChange}
            />
          </div>

          <SelectInput
            name="status"
            value={formData.status}
            onChange={handleInputChange}
          >
            <option value="Active">Active</option>
            <option value="Leave">On Leave</option>
            <option value="Terminated">Terminated</option>
          </SelectInput>

          {["Admin", "Faculty", "Staff"].includes(selectedRole) &&
            (selectedRole === "Admin"
              ? renderAdminExtras()
              : renderFacultyExtras())}
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
            All Users ({users.length})
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
                        onClick={() => handleDelete(user.user_id)}
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
        title={isEditing ? "Edit User Record" : "Create New User Account"}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-4 p-2 bg-gray-50 rounded-xl border border-gray-200">
            <label className="block text-gray-700 font-bold mb-1 text-sm">
              Define User Role
            </label>
            <SelectInput
              name="role"
              placeholder="Select Role"
              value={selectedRole}
              onChange={handleRoleChange}
              className="md:w-1/3 bg-white"
              required
              disabled={isEditing}
            >
              <option value="Admin">Admin</option>
              <option value="Faculty">Faculty</option>
              <option value="Staff">Staff</option>
              <option value="HR">HR</option>
              <option value="Accounting">Accounting</option>
            </SelectInput>
            <p className="text-xs text-gray-500 mt-2">
              The role determines the specific fields required below. Role
              cannot be changed while editing.
            </p>
          </div>

          {renderCommonFields()}
          {/*   {selectedRole === "Student" && renderStudentFields()} */}
          {["Admin", "Faculty", "Staff", "HR", "Accounting"].includes(
            selectedRole,
          ) && renderEmployeeFields()}

          <div className="flex justify-end space-x-3 mt-4 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={closeFormModal}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition shadow text-sm"
            >
              {isEditing ? "Save Changes" : "Create Account"}
            </button>
          </div>
        </form>
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
