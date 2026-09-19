import React, { useState, useCallback, useMemo } from "react";
import {
  Search,
  Plus,
  FileText,
  ChevronLeft,
  ChevronRight,
  User,
  Building,
  Pencil,
  Trash2,
  X,
  Save,
  BookOpen, // Course
  GraduationCap, // Program
  Link, // Prerequisite
  LayoutGrid,
} from "lucide-react";

// --- Mock Data ---

const initialDepartments = [
  {
    id: 10,
    name: "Computer Science",
    head: "Dr. Alan Turing",
    status: "Active",
  },
  { id: 20, name: "Mathematics", head: "Prof. Ada Lovelace", status: "Active" },
  { id: 30, name: "Physics", head: "Dr. Albert Einstein", status: "Active" },
  { id: 40, name: "Chemistry", head: "Dr. Marie Curie", status: "Inactive" },
  { id: 50, name: "Biology", head: "Dr. Charles Darwin", status: "Active" },
  // --- ADDED 5 NEW DEPARTMENTS ---
  {
    id: 60,
    name: "Electrical Engineering",
    head: "Dr. Nikola Tesla",
    status: "Active",
  },
  {
    id: 70,
    name: "Literature",
    head: "Prof. Emily Dickinson",
    status: "Active",
  },
  { id: 80, name: "History", head: "Dr. Thucydides", status: "Pending" },
  {
    id: 90,
    name: "Fine Arts",
    head: "Prof. Leonardo da Vinci",
    status: "Active",
  },
  { id: 100, name: "Geology", head: "Dr. Mary Anning", status: "Active" },
];

const initialFaculty = [
  {
    id: 101,
    name: "Dr. Alan Turing",
    department: "Computer Science",
    contact: "alan.turing@univ.edu",
    status: "Active",
  },
  {
    id: 102,
    name: "Prof. Ada Lovelace",
    department: "Mathematics",
    contact: "ada.lovelace@univ.edu",
    status: "Active",
  },
  {
    id: 103,
    name: "Dr. Marie Curie",
    department: "Chemistry",
    contact: "marie.curie@univ.edu",
    status: "Active",
  },
  {
    id: 104,
    name: "Dr. Albert Einstein",
    department: "Physics",
    contact: "albert.e@univ.edu",
    status: "Inactive",
  },
  {
    id: 105,
    name: "Dr. Max Planck",
    department: "Physics",
    contact: "max.planck@univ.edu",
    status: "Active",
  },
  // --- ADDED 5 NEW FACULTY MEMBERS ---
  {
    id: 106,
    name: "Dr. Nikola Tesla",
    department: "Electrical Engineering",
    contact: "nikola.t@univ.edu",
    status: "Active",
  },
  {
    id: 107,
    name: "Prof. Emily Dickinson",
    department: "Literature",
    contact: "e.dickinson@univ.edu",
    status: "Active",
  },
  {
    id: 108,
    name: "Dr. Stephen Hawking",
    department: "Physics",
    contact: "stephen.h@univ.edu",
    status: "Inactive",
  },
  {
    id: 109,
    name: "Prof. Jane Goodall",
    department: "Biology",
    contact: "jane.g@univ.edu",
    status: "Active",
  },
  {
    id: 110,
    name: "Dr. Carl Sagan",
    department: "Astronomy",
    contact: "carl.sagan@univ.edu",
    status: "Pending",
  },
];

const initialCourses = [
  {
    id: 1010,
    name: "Intro to Programming",
    dept: "Computer Science",
    credits: 3,
  },
  { id: 1020, name: "Calculus I", dept: "Mathematics", credits: 4 },
  { id: 2010, name: "Data Structures", dept: "Computer Science", credits: 3 },
  { id: 3010, name: "Quantum Physics", dept: "Physics", credits: 4 },
  { id: 3020, name: "Classical Mechanics", dept: "Physics", credits: 3 },
  {
    id: 4010,
    name: "Advanced Algorithms",
    dept: "Computer Science",
    credits: 3,
  },
  // --- ADDED 5 NEW COURSES ---
  {
    id: 5010,
    name: "Circuit Theory",
    dept: "Electrical Engineering",
    credits: 4,
  },
  { id: 5020, name: "Victorian Literature", dept: "Literature", credits: 3 },
  { id: 5030, name: "Earth Science", dept: "Geology", credits: 3 },
  { id: 5040, name: "Advanced Calculus", dept: "Mathematics", credits: 4 },
  { id: 5050, name: "Thermodynamics", dept: "Physics", credits: 4 },
];

const initialPrograms = [
  {
    id: 100,
    name: "BSc Computer Science",
    department: "Computer Science",
    duration: 4,
  },
  {
    id: 200,
    name: "MSc Theoretical Physics",
    department: "Physics",
    duration: 2,
  },
  { id: 300, name: "BSc Mathematics", department: "Mathematics", duration: 4 },
  // --- ADDED 5 NEW PROGRAMS ---
  {
    id: 400,
    name: "MEng Electrical Engineering",
    department: "Electrical Engineering",
    duration: 2,
  },
  {
    id: 500,
    name: "BA English Literature",
    department: "Literature",
    duration: 3,
  },
  {
    id: 600,
    name: "PhD Theoretical Physics",
    department: "Physics",
    duration: 5,
  },
  {
    id: 700,
    name: "BSc Applied Mathematics",
    department: "Mathematics",
    duration: 4,
  },
  { id: 800, name: "MA Art History", department: "Fine Arts", duration: 2 },
];

// Stores pairs: { courseId: number, prerequisiteId: number }
const initialPrerequisites = [
  { courseId: 2010, prerequisiteId: 1010 }, // Data Structures requires Intro to Programming
  { courseId: 4010, prerequisiteId: 2010 }, // Advanced Algorithms requires Data Structures
  // --- ADDED 2 NEW PREREQUISITES ---
  { courseId: 5010, prerequisiteId: 1010 }, // Circuit Theory requires Intro to Programming
  { courseId: 5050, prerequisiteId: 3020 }, // Thermodynamics requires Classical Mechanics
];

const statusOptions = ["Active", "Inactive", "Pending"]; // Options for Status dropdowns

// --- Reusable Components ---

/** Custom Action Button with Tooltip (Optimized for reuse) */
const ActionButton = ({ onClick, icon, label, className, tooltipText }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const handleClick = (e) => {
    e.preventDefault();
    onClick();
    setShowTooltip(false);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-colors text-sm border shadow-sm whitespace-nowrap ${className}`}
      >
        {icon}
        {label}
      </button>
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-slate-800 text-white text-xs rounded-lg shadow-xl pointer-events-none dark:bg-slate-200 dark:text-slate-800 before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-8 before:border-transparent before:border-t-slate-800 dark:before:border-t-slate-200">
          {tooltipText}
        </div>
      )}
    </div>
  );
};

/** Reusable Pagination component */
const Pagination = ({ currentPage, totalPages, setPage, totalItems }) => (
  <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700 dark:text-slate-200">
    <span className="text-xs sm:text-sm">
      Page <span className="font-semibold">{currentPage}</span> of{" "}
      <span className="font-semibold">{totalPages}</span> | Total Records:{" "}
      {totalItems}
    </span>
    <div className="flex gap-1 items-center mt-2 sm:mt-0">
      <button
        onClick={() => setPage((p) => Math.max(p - 1, 1))}
        disabled={currentPage === 1}
        className="p-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="px-2 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
        {currentPage}
      </span>
      <button
        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
        disabled={currentPage === totalPages || totalPages === 0}
        className="p-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  </div>
);

/**
 * Highly Flexible CRUD Modal
 */
const CrudModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode, // 'add' or 'edit'
  type, // 'department', 'faculty', 'course', 'program'
  initialData,
  allDepartments, // Needed for dropdowns
}) => {
  const [formData, setFormData] = useState(initialData || {});

  const typeConfig = useMemo(() => {
    switch (type) {
      case "department":
        return {
          title: "Department",
          fields: {
            name: "Name",
            head: "Head",
            status: "Status",
          },
        };
      case "faculty":
        return {
          title: "Faculty Member",
          fields: {
            name: "Name",
            department: "Department",
            contact: "Contact Email",
            status: "Status",
          },
        };
      case "course":
        return {
          title: "Course",
          fields: {
            id: "Course ID",
            name: "Title",
            dept: "Department",
            credits: "Credits",
          },
        };
      case "program":
        return {
          title: "Program",
          fields: {
            name: "Name",
            department: "Owning Department",
            duration: "Duration (Years)",
          },
        };
      default:
        return { title: "Record", fields: {} };
    }
  }, [type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple validation: check if required fields are present
    const isFormValid = Object.keys(typeConfig.fields).every(
      (key) =>
        (mode === "edit" && key === "id") ||
        (formData[key] && String(formData[key]).trim() !== "")
    );
    if (!isFormValid) {
      // Using console.error instead of alert due to constraints, but conceptually an alert would fire here.
      console.error("Please fill out all required fields.");
      return;
    }

    // Convert credits/duration/id to number if applicable
    const dataToSend = { ...formData };
    if (type === "course") {
      dataToSend.credits = parseInt(dataToSend.credits, 10) || 0;
      dataToSend.id = parseInt(dataToSend.id, 10) || dataToSend.id; // Ensure ID is parsed if it was edited
    }
    if (type === "program") {
      dataToSend.duration = parseInt(dataToSend.duration, 10) || 0;
    }

    onSubmit(dataToSend, mode, type);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-sm sm:max-w-md transform transition-transform duration-300 scale-100 border border-slate-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 rounded-t-lg">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {mode === "add" ? "Add New" : "Edit"} {typeConfig.title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {Object.entries(typeConfig.fields).map(([key, label]) => {
            const isDepartmentDropdown =
              (key === "department" || key === "dept") &&
              (type === "faculty" || type === "course" || type === "program");
            const isStatusDropdown = key === "status";
            const inputType =
              key === "credits" || key === "duration" || key === "id"
                ? "number"
                : "text";

            return (
              <div key={key}>
                <label
                  htmlFor={key}
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  {label}
                </label>
                {isDepartmentDropdown ? (
                  <select
                    id={key}
                    name={key}
                    value={formData[key] || allDepartments[0]?.name || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    required
                  >
                    {allDepartments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                ) : isStatusDropdown ? (
                  <select
                    id={key}
                    name={key}
                    value={formData[key] || statusOptions[0]}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    required
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={key}
                    name={key}
                    type={inputType}
                    value={formData[key] || ""}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      key === "id" && mode === "edit"
                        ? "bg-slate-100 dark:bg-slate-900 cursor-not-allowed"
                        : ""
                    }`}
                    placeholder={`Enter ${label}`}
                    required
                    readOnly={key === "id" && mode === "edit"}
                  />
                )}
              </div>
            );
          })}

          {/* Modal Footer / Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-1 shadow-md shadow-indigo-500/30"
            >
              <Save size={16} />
              {mode === "add" ? "Create Record" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- View Components (Condensed) ---

/** Helper to render status badges */
const StatusBadge = ({ status }) => {
  let colorClass = "";
  switch (status) {
    case "Active":
      colorClass =
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      break;
    case "Inactive":
      colorClass = "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      break;
    case "Pending":
      colorClass =
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      break;
    default:
      colorClass =
        "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
    >
      {status}
    </span>
  );
};

const ViewTemplate = ({
  title,
  Icon,
  searchPlaceholder,
  searchQuery,
  setSearchQuery,
  openModal,
  modalType,
  data,
  columns,
  currentPage,
  setPage,
  totalPages,
  filteredCount,
  handleCrudAction,
  primaryRing,
}) => (
  <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Search Input - LEFT */}
      <div className="relative flex-grow max-w-xs">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className={`w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 ${primaryRing} dark:bg-slate-800 dark:text-white text-sm transition-all shadow-inner`}
        />
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          size={14}
        />
      </div>

      {/* Action Buttons - RIGHT */}
      <div className="flex items-center gap-2">
        <ActionButton
          onClick={() => console.log(`Generating ${title} PDF...`)}
          icon={<FileText size={14} />}
          tooltipText={`Generate ${title} PDF report`}
          className="bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 border-slate-300 dark:border-slate-600"
        />
        <ActionButton
          onClick={() => openModal("add", modalType, null)}
          icon={<Plus size={14} />}
          label={`New ${title}`}
          tooltipText={`Create a new ${title} entry`}
          className="bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-700 dark:border-indigo-600 shadow-md shadow-indigo-500/30"
        />
      </div>
    </div>

    {/* Table */}
    <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-100 dark:bg-slate-700/70">
          <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {columns.map((col, index) => (
              <th
                key={index}
                className={`px-4 py-2.5 ${
                  col.align === "right" ? "text-right" : ""
                } ${col.width || ""}`}
              >
                {col.header}
              </th>
            ))}
            <th className="px-4 py-2.5 w-1/12 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
          {data.length ? (
            data.map((item) => (
              <tr
                key={item.id}
                className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150"
              >
                {columns.map((col, index) => (
                  <td
                    key={index}
                    className={`px-4 py-2 ${
                      col.align === "right" ? "text-right" : ""
                    } ${col.width || ""}`}
                  >
                    {col.field === "status" ? (
                      <StatusBadge status={item[col.field]} />
                    ) : (
                      item[col.field]
                    )}
                  </td>
                ))}
                <td className="px-4 py-2 text-right space-x-2">
                  <button
                    onClick={() => openModal("edit", modalType, item)}
                    title={`Edit ${title}`}
                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleCrudAction(item, "delete", modalType)}
                    title={`Delete ${title}`}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="p-4 text-center text-slate-500 italic"
              >
                No {title.toLowerCase()} records found matching your search
                criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* Pagination */}
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      setPage={setPage}
      totalItems={filteredCount}
    />
  </div>
);

/** Dedicated Prerequisite Management View */
const PrerequisiteManager = ({
  allCourses,
  prerequisites,
  setPrerequisites,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedPrereqId, setSelectedPrereqId] = useState("");

  // Ensure we can map IDs to names
  const getCourseNameWithId = useCallback(
    (id) => {
      const course = allCourses.find((c) => c.id === id);
      return course ? `[${course.id}] ${course.name}` : `[${id}] Unknown`;
    },
    [allCourses]
  );

  const availablePrereqs = useMemo(
    () => allCourses.filter((c) => c.id !== parseInt(selectedCourseId)),
    [allCourses, selectedCourseId]
  );

  const handleAddPrerequisite = () => {
    const courseId = parseInt(selectedCourseId);
    const prerequisiteId = parseInt(selectedPrereqId);

    if (!courseId || !prerequisiteId) {
      // Using console.error instead of alert due to constraints
      console.error("Please select both a course and a prerequisite.");
      return;
    }

    // Prevent duplicate dependencies
    const isDuplicate = prerequisites.some(
      (p) => p.courseId === courseId && p.prerequisiteId === prerequisiteId
    );
    if (isDuplicate) {
      // Using console.error instead of alert due to constraints
      console.error("This prerequisite already exists.");
      return;
    }

    setPrerequisites((prev) => [...prev, { courseId, prerequisiteId }]);
    setSelectedCourseId("");
    setSelectedPrereqId("");
  };

  const handleRemovePrerequisite = (courseId, prerequisiteId) => {
    setPrerequisites((prev) =>
      prev.filter(
        (p) => !(p.courseId === courseId && p.prerequisiteId === prerequisiteId)
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Setup Form */}
      <div className="p-4 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 shadow-md">
        <h4 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
          <Link size={18} className="text-indigo-600" /> Define New Prerequisite
          (A requires B)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          {/* Select Course (A) */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Target Course (A)
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Select Course (Requires Prereq) --</option>
              {allCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {getCourseNameWithId(c.id)}
                </option>
              ))}
            </select>
          </div>

          {/* Select Prerequisite (B) */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Required Prerequisite (B)
            </label>
            <select
              value={selectedPrereqId}
              onChange={(e) => setSelectedPrereqId(e.target.value)}
              disabled={!selectedCourseId || availablePrereqs.length === 0}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-900/50 disabled:cursor-not-allowed focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Select Required Course --</option>
              {availablePrereqs.map((c) => (
                <option key={c.id} value={c.id}>
                  {getCourseNameWithId(c.id)}
                </option>
              ))}
            </select>
          </div>

          {/* Action Button */}
          <ActionButton
            onClick={handleAddPrerequisite}
            icon={<Plus size={14} />}
            label="Establish Dependency"
            tooltipText="Create A -> B dependency"
            className="bg-indigo-600 text-white hover:bg-indigo-700 h-full border-indigo-700 dark:border-indigo-600"
          />
        </div>
      </div>

      {/* Existing Prerequisites List */}
      <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-4 flex items-center gap-2">
        <LayoutGrid size={20} className="text-indigo-600" /> Existing
        Dependencies
      </h4>

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-100 dark:bg-slate-700/70">
            <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <th className="px-4 py-2.5 w-5/12">Course (A)</th>
              <th className="px-4 py-2.5 w-5/12">Requires Prerequisite (B)</th>
              <th className="px-4 py-2.5 w-1/12 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
            {prerequisites.length > 0 ? (
              prerequisites.map((p, index) => (
                <tr
                  key={index}
                  className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150"
                >
                  <td className="px-4 py-2 font-semibold">
                    {getCourseNameWithId(p.courseId)}
                  </td>
                  <td className="px-4 py-2 italic text-indigo-600 dark:text-indigo-400">
                    {getCourseNameWithId(p.prerequisiteId)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() =>
                        handleRemovePrerequisite(p.courseId, p.prerequisiteId)
                      }
                      title="Remove Prerequisite"
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="p-4 text-center text-slate-500 italic"
                >
                  No prerequisites have been set up yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Main Component ---
const DepartmentMngt = () => {
  const [activeTab, setActiveTab] = useState("department");

  // --- Data States ---
  const [departments, setDepartments] = useState(initialDepartments);
  const [faculty, setFaculty] = useState(initialFaculty);
  const [courses, setCourses] = useState(initialCourses);
  const [programs, setPrograms] = useState(initialPrograms);
  const [prerequisites, setPrerequisites] = useState(initialPrerequisites);

  // --- Search/Pagination States ---
  const [deptSearch, setDeptSearch] = useState("");
  const [deptPage, setDeptPage] = useState(1);
  const [facultySearch, setFacultySearch] = useState("");
  const [facultyPage, setFacultyPage] = useState(1);
  const [courseSearch, setCourseSearch] = useState("");
  const [coursePage, setCoursePage] = useState(1);
  const [programSearch, setProgramSearch] = useState("");
  const [programPage, setProgramPage] = useState(1);

  // --- Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [modalType, setModalType] = useState("department");
  const [currentRecord, setCurrentRecord] = useState(null);

  const rowsPerPage = 10; // Enforcing max 10 rows per page

  // --- CRUD Logic Handlers ---
  const getDataSetter = (type) => {
    switch (type) {
      case "department":
        return setDepartments;
      case "faculty":
        return setFaculty;
      case "course":
        return setCourses;
      case "program":
        return setPrograms;
      default:
        return () => {};
    }
  };

  const getPageSetter = (type) => {
    switch (type) {
      case "department":
        return setDeptPage;
      case "faculty":
        return setFacultyPage;
      case "course":
        return setCoursePage;
      case "program":
        return setProgramPage;
      default:
        return () => {};
    }
  };

  // Unified function to handle Add/Edit/Delete
  const handleCrudAction = useCallback((data, mode, type) => {
    const setRecords = getDataSetter(type);
    const setPage = getPageSetter(type);

    setRecords((prevRecords) => {
      if (mode === "add") {
        // Use user-provided ID if available, otherwise find a high ID
        const newId =
          (type === "course" && data.id) ||
          Math.max(...prevRecords.map((d) => d.id).concat(0)) + 1;
        // Default status if adding a new faculty/dept
        const newRecord = {
          ...data,
          id: newId,
          status: data.status || "Active",
        };
        setPage(1); // Reset to first page to see the new record
        return [newRecord, ...prevRecords];
      } else if (mode === "edit") {
        return prevRecords.map((d) => (d.id === data.id ? data : d));
      } else if (mode === "delete") {
        console.log(
          `DELETING ${type.toUpperCase()} ID ${data.id}: ${
            data.name || data.id
          }`
        );

        // Also handle related data deletion (e.g., if a course is deleted, remove its prerequisites)
        if (type === "course") {
          setPrerequisites((prev) =>
            prev.filter(
              (p) => p.courseId !== data.id && p.prerequisiteId !== data.id
            )
          );
        }

        return prevRecords.filter((d) => d.id !== data.id);
      }
      return prevRecords;
    });
  }, []);

  const openModal = (mode, type, record = null) => {
    setModalMode(mode);
    setModalType(type);
    setCurrentRecord(record);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentRecord(null);
  };

  // --- Filtering and Pagination Logic (Memoized for performance) ---

  const createFilterAndPagination = (data, search, page) => {
    const filteredData = data.filter((item) =>
      Object.keys(item).some((key) =>
        String(item[key]).toLowerCase().includes(search.toLowerCase())
      )
    );
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const displayedData = filteredData.slice(
      (page - 1) * rowsPerPage,
      page * rowsPerPage
    );
    return { filteredData, totalPages, displayedData };
  };

  // Department Logic
  const deptResult = useMemo(
    () => createFilterAndPagination(departments, deptSearch, deptPage),
    [departments, deptSearch, deptPage]
  );

  // Faculty Logic
  const facultyResult = useMemo(
    () => createFilterAndPagination(faculty, facultySearch, facultyPage),
    [faculty, facultySearch, facultyPage]
  );

  // Course Logic
  const courseResult = useMemo(
    () => createFilterAndPagination(courses, courseSearch, coursePage),
    [courses, courseSearch, coursePage]
  );

  // Program Logic
  const programResult = useMemo(
    () => createFilterAndPagination(programs, programSearch, programPage),
    [programs, programSearch, programPage]
  );

  // --- Styling Constants ---
  const primaryColor = "indigo";
  const primaryRing = `focus:ring-${primaryColor}-500`;

  // --- Column Definitions ---
  const deptColumns = [
    { header: "ID", field: "id", width: "w-1/12" },
    { header: "Department Name", field: "name", width: "w-4/12" },
    { header: "Head", field: "head", width: "w-4/12" },
    { header: "Status", field: "status", width: "w-2/12" }, // ADDED Status
  ];
  const facultyColumns = [
    { header: "ID", field: "id", width: "w-1/12" },
    { header: "Faculty Name", field: "name", width: "w-3/12" },
    { header: "Contact", field: "contact", width: "w-3/12" }, // ADDED Contact
    { header: "Department", field: "department", width: "w-3/12" },
    { header: "Status", field: "status", width: "w-2/12" }, // ADDED Status
  ];
  const courseColumns = [
    { header: "ID", field: "id", width: "w-1/12" },
    { header: "Course Title", field: "name", width: "w-4/12" },
    { header: "Department", field: "dept", width: "w-3/12" },
    { header: "Credits", field: "credits", width: "w-2/12", align: "right" },
  ];
  const programColumns = [
    { header: "ID", field: "id", width: "w-1/12" },
    { header: "Program Name", field: "name", width: "w-4/12" },
    { header: "Department", field: "department", width: "w-3/12" },
    {
      header: "Duration (Yrs)",
      field: "duration",
      width: "w-2/12",
      align: "right",
    },
  ];

  return (
    <div className=" dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap size={24} className="text-indigo-600" />
            Curriculum & Program ERP Module
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Data Integrity: Online
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-300 dark:border-slate-700 overflow-x-auto">
          {[
            {
              key: "department",
              label: "Departments",
              Icon: Building,
              modalType: "department",
            },
            {
              key: "faculty",
              label: "Faculty Management",
              Icon: User,
              modalType: "faculty",
            },
            {
              key: "course",
              label: "Course Management",
              Icon: BookOpen,
              modalType: "course",
            },
            {
              key: "program",
              label: "Program Offerings",
              Icon: GraduationCap,
              modalType: "program",
            },
            {
              key: "prerequisite",
              label: "Prerequisite Setup",
              Icon: Link,
              modalType: "prerequisite",
            },
          ].map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`
                flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-all duration-300 whitespace-nowrap border-b-2
                ${
                  activeTab === key
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 shadow-t-sm"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300"
                }
              `}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* Content Views */}
        <div className="pt-2">
          {activeTab === "department" && (
            <ViewTemplate
              title="Department"
              Icon={Building}
              modalType="department"
              columns={deptColumns}
              searchPlaceholder="Search departments..."
              searchQuery={deptSearch}
              setSearchQuery={setDeptSearch}
              data={deptResult.displayedData}
              currentPage={deptPage}
              setPage={setDeptPage}
              totalPages={deptResult.totalPages}
              filteredCount={deptResult.filteredData.length}
              handleCrudAction={handleCrudAction}
              openModal={openModal}
              primaryRing={primaryRing}
            />
          )}

          {activeTab === "faculty" && (
            <ViewTemplate
              title="Faculty Member"
              Icon={User}
              modalType="faculty"
              columns={facultyColumns}
              searchPlaceholder="Search faculty..."
              searchQuery={facultySearch}
              setSearchQuery={setFacultySearch}
              data={facultyResult.displayedData}
              currentPage={facultyPage}
              setPage={setFacultyPage}
              totalPages={facultyResult.totalPages}
              filteredCount={facultyResult.filteredData.length}
              handleCrudAction={handleCrudAction}
              openModal={openModal}
              primaryRing={primaryRing}
            />
          )}

          {activeTab === "course" && (
            <ViewTemplate
              title="Course"
              Icon={BookOpen}
              modalType="course"
              columns={courseColumns}
              searchPlaceholder="Search courses by ID, title, or department..."
              searchQuery={courseSearch}
              setSearchQuery={setCourseSearch}
              data={courseResult.displayedData}
              currentPage={coursePage}
              setPage={setCoursePage}
              totalPages={courseResult.totalPages}
              filteredCount={courseResult.filteredData.length}
              handleCrudAction={handleCrudAction}
              openModal={openModal}
              primaryRing={primaryRing}
            />
          )}

          {activeTab === "program" && (
            <ViewTemplate
              title="Program Offering"
              Icon={GraduationCap}
              modalType="program"
              columns={programColumns}
              searchPlaceholder="Search programs..."
              searchQuery={programSearch}
              setSearchQuery={setProgramSearch}
              data={programResult.displayedData}
              currentPage={programPage}
              setPage={setProgramPage}
              totalPages={programResult.totalPages}
              filteredCount={programResult.filteredData.length}
              handleCrudAction={handleCrudAction}
              openModal={openModal}
              primaryRing={primaryRing}
            />
          )}

          {activeTab === "prerequisite" && (
            <PrerequisiteManager
              allCourses={courses}
              prerequisites={prerequisites}
              setPrerequisites={setPrerequisites}
            />
          )}
        </div>
      </div>

      {/* CRUD Modal Integration */}
      <CrudModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleCrudAction}
        mode={modalMode}
        type={modalType}
        initialData={currentRecord}
        allDepartments={departments}
      />
    </div>
  );
};

export default DepartmentMngt;
