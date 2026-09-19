import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Select from "react-select";
import {
  Plus,
  Pencil,
  Trash2,
  File,
  FileArchive,
  Eye,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { saveAs } from "file-saver";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// --- Status Badge Component ---
const StatusBadge = ({ status }) => (
  <span
    className={`px-2 py-1 rounded-full text-xs font-semibold ${
      status === "Active"
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800"
    }`}
  >
    {status}
  </span>
);

// --- Pagination ---
const Pagination = ({ currentPage, totalPages, setPage, totalItems }) => (
  <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700">
    <span className="text-xs sm:text-sm">
      Page <span className="font-semibold">{currentPage}</span> of{" "}
      <span className="font-semibold">{totalPages}</span> | Total Records:{" "}
      {totalItems}
    </span>
    <div className="flex gap-1 items-center mt-2 sm:mt-0">
      <button
        onClick={() => setPage((p) => Math.max(p - 1, 1))}
        disabled={currentPage === 1}
        className="p-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-50 hover:bg-slate-100 transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="px-2 py-1 text-xs font-semibold text-indigo-600">
        {currentPage}
      </span>
      <button
        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
        disabled={currentPage === totalPages || totalPages === 0}
        className="p-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-50 hover:bg-slate-100 transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  </div>
);

// --- Program Modal Component ---
const ProgramModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
  departments,
}) => {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    degree_type: "Bachelor",
    duration_years: 4,
    department_id: null,
    status: "Active",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || "",
        name: initialData.name || "",
        description: initialData.description || "",
        degree_type: initialData.degree_type || "Bachelor",
        duration_years: initialData.duration_years || 4,
        department_id: initialData.department_id || null,
        status: initialData.status || "Active",
        id: initialData.id,
      });
    } else {
      setFormData({
        code: "",
        name: "",
        description: "",
        degree_type: "Bachelor",
        duration_years: 4,
        department_id: null,
        status: "Active",
      });
    }
  }, [initialData]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

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
            <h2 className="text-lg font-bold text-slate-800">
              {mode === "add" ? "Add Program" : "Edit Program"}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Program Code
                </label>
                <input
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g. BSIT"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Program Name
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Information Technology"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Program description..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Degree Type */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Degree Type
                </label>
                <select
                  name="degree_type"
                  value={formData.degree_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Bachelor">Bachelor</option>
                  <option value="Associate">Associate</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Diploma">Diploma</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Duration (Years)
                </label>
                <input
                  name="duration_years"
                  type="number"
                  min={1}
                  max={10}
                  value={formData.duration_years}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Department
              </label>
              <Select
                value={
                  formData.department_id
                    ? departments
                        .map((d) => ({
                          value: d.department_id || d.id,
                          label: d.name,
                        }))
                        .find((o) => o.value === formData.department_id)
                    : null
                }
                onChange={(selected) =>
                  setFormData((prev) => ({
                    ...prev,
                    department_id: selected ? selected.value : null,
                  }))
                }
                options={departments.map((d) => ({
                  value: d.department_id || d.id,
                  label: d.name,
                }))}
                placeholder="Select department..."
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

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Sticky Footer */}
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
                {mode === "add" ? "Add Program" : "Update Program"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Program View Modal ---
const ProgramViewModal = ({ isOpen, onClose, program }) => {
  if (!isOpen || !program) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-indigo-100 rounded-full p-4 mb-3">
            <GraduationCap className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">{program.name}</h2>
          <p className="text-sm text-gray-600">{program.code}</p>
        </div>

        {/* Program Details */}
        <div className="flex flex-col gap-4 border p-4 rounded-lg bg-gray-50">
          {/* Department */}
          <div>
            <span className="font-semibold text-gray-700">Department:</span>
            <p className="text-gray-900 mt-1">
              {program.department_name || "N/A"}
            </p>
          </div>

          {/* Degree Type */}
          <div>
            <span className="font-semibold text-gray-700">Degree Type:</span>
            <p className="text-gray-900 mt-1">{program.degree_type}</p>
          </div>

          {/* Duration */}
          <div>
            <span className="font-semibold text-gray-700">Duration:</span>
            <p className="text-gray-900 mt-1">
              {program.duration_years}{" "}
              {program.duration_years === 1 ? "Year" : "Years"}
            </p>
          </div>

          {/* Status */}
          <div>
            <span className="font-semibold text-gray-700">Status:</span>
            <div className="mt-1">
              <StatusBadge status={program.status} />
            </div>
          </div>

          {/* Description */}
          <div>
            <span className="font-semibold text-gray-700">Description:</span>
            <p className="text-gray-900 mt-1">
              {program.description || "No description"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Delete Confirmation Modal ---
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

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
          Are you sure you want to delete this program?{" "}
          <span className="text-red-400">This action cannot be undone!</span>
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
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
function ProgramsOffering() {
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentRecord, setCurrentRecord] = useState(null);
  const [viewProgram, setViewProgram] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Fetch data
  const fetchPrograms = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/programs`,
      );
      setPrograms(res.data);
    } catch (err) {
      console.error("Failed to fetch programs:", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/dept/departments`,
      );
      setDepartments(res.data);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  };

  useEffect(() => {
    fetchPrograms();
    fetchDepartments();
  }, []);

  // Filter & paginate
  const filtered = useMemo(
    () =>
      programs.filter(
        (p) =>
          (p.code || "").toLowerCase().includes(search.toLowerCase()) ||
          (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
          (p.degree_type || "").toLowerCase().includes(search.toLowerCase()),
      ),
    [programs, search],
  );

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const displayed = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  // Export
  const exportCSV = (data) => {
    const csv = [
      ["ID", "Code", "Name", "Degree Type", "Duration", "Department", "Status"],
      ...data.map((p) => [
        p.id,
        p.code,
        p.name,
        p.degree_type,
        p.duration_years,
        p.department_name || "N/A",
        p.status,
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");
    saveAs(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
      "programs.csv",
    );
  };

  const exportPDF = (data) => {
    const doc = new jsPDF();
    doc.text("Programs Offering", 14, 16);
    doc.autoTable({
      head: [
        ["ID", "Code", "Name", "Degree", "Duration", "Department", "Status"],
      ],
      body: data.map((p) => [
        p.id,
        p.code,
        p.name,
        p.degree_type,
        `${p.duration_years} yrs`,
        p.department_name || "N/A",
        p.status,
      ]),
      startY: 20,
    });
    doc.save("programs.pdf");
  };

  // Turn a raw axios error into a short, human-readable message
  const getErrorMessage = (err, fallback) => {
    const serverMessage = err.response?.data?.message || err.response?.data?.error;
    if (serverMessage) return serverMessage;
    if (err.response?.status === 400) return "Some fields are missing or invalid. Please check the form and try again.";
    if (err.response?.status === 404) return "This program no longer exists. It may have already been deleted.";
    if (err.response?.status === 409) return "A program with this code already exists.";
    if (err.response?.status === 500) return "Something went wrong on the server. Please try again later.";
    if (!err.response) return "Can't reach the server. Check your connection and try again.";
    return fallback;
  };

  // CRUD
  const handleSubmit = async (data) => {
    try {
      let res;
      if (modalMode === "add") {
        res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/programs`,
          data,
        );
        setPrograms((prev) => [...prev, res.data]);
        toast.success("Program added successfully.");
      } else {
        res = await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/api/programs/${data.id}`,
          data,
        );
        setPrograms((prev) =>
          prev.map((p) =>
            p.id === data.id
              ? {
                  ...p,
                  ...data,
                }
              : p,
          ),
        );
        toast.success("Program updated successfully.");
      }
      setModalOpen(false);
    } catch (err) {
      console.error("Failed to save program:", err.response?.data || err.message);
      toast.error(
        getErrorMessage(
          err,
          modalMode === "add"
            ? "Failed to add program."
            : "Failed to update program.",
        ),
      );
    }
  };

  const handleDelete = (id) => {
    setDeleteTargetId(id);
  };

  const cancelDelete = () => {
    setDeleteTargetId(null);
  };

  const confirmDelete = async () => {
    const id = deleteTargetId;
    if (!id) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/api/programs/${id}`,
      );
      setPrograms((prev) => prev.filter((p) => p.id !== id));
      toast.success("Program deleted successfully.");
    } catch (err) {
      console.error("Failed to delete program:", err.response?.data || err.message);
      toast.error(getErrorMessage(err, "Failed to delete program."));
    } finally {
      setDeleteTargetId(null);
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
          <GraduationCap size={24} /> Programs Offering
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Manage all academic programs, their departments, degree types, and
          status. You can add, edit, view, or export program records.
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <input
          type="text"
          placeholder="Search programs..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="px-2 py-1 border border-slate-400 rounded-md w-full sm:w-1/3 focus:ring-1 focus:ring-indigo-500"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => exportCSV(filtered)}
            className="p-2 border rounded-md text-sm border-slate-400 hover:bg-gray-100 transition"
            title="Export CSV"
          >
            <FileArchive size={16} />
          </button>
          <button
            onClick={() => exportPDF(filtered)}
            className="p-2 border rounded-md text-sm border-slate-400 hover:bg-gray-100 transition"
            title="Export PDF"
          >
            <File size={16} />
          </button>
          <button
            onClick={() => openModal("add")}
            className="flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus size={16} /> Program
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-semibold">ID</th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Code
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Program Name
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Degree Type
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Duration
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Department
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Status
              </th>
              <th className="px-3 py-2 text-right text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {displayed.length ? (
              displayed.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition">
                  <td className="px-3 py-2 text-sm">{p.id}</td>
                  <td className="px-3 py-2 text-sm font-semibold">{p.code}</td>
                  <td className="px-3 py-2 text-sm">{p.name}</td>
                  <td className="px-3 py-2 text-sm">{p.degree_type}</td>
                  <td className="px-3 py-2 text-sm">
                    {p.duration_years} {p.duration_years === 1 ? "yr" : "yrs"}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {p.department_name || "N/A"}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-3 py-2 text-right flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setViewProgram(p);
                        setViewModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-800"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => openModal("edit", p)}
                      className="text-indigo-600 hover:text-indigo-800"
                      title="Edit Program"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete Program"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr key="no-programs">
                <td
                  colSpan={8}
                  className="text-center py-4 text-slate-500 italic"
                >
                  No programs found.
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

      {/* Modals */}
      <ProgramModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        mode={modalMode}
        initialData={currentRecord}
        departments={departments}
      />
      <ProgramViewModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        program={viewProgram}
      />
      <DeleteConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default ProgramsOffering;