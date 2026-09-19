import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  File,
  FileArchive,
  BookOpen,
  Eye,
  Building2,
} from "lucide-react";
import axios from "axios";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const statusOptions = ["Active", "Inactive", "Pending"];

// --- Status Badge ---
const StatusBadge = ({ status }) => {
  const colorMap = {
    Active: "bg-green-100 text-green-800",
    Inactive: "bg-red-100 text-red-800",
    Pending: "bg-yellow-100 text-yellow-800",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
        colorMap[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
};

// --- CSV Export ---
const exportCSV = (data) => {
  if (!data.length) return alert("No departments to export.");
  const headers = ["ID", "Name", "Head", "Status"];
  const rows = data.map((d) =>
    headers
      .map(
        (h) =>
          `"${(d[h.toLowerCase()] || d[h] || "")
            .toString()
            .replace(/"/g, '""')}"`,
      )
      .join(","),
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `departments_export_${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// --- PDF Export ---
const exportPDF = (data) => {
  if (!data.length) return alert("No departments to export.");
  const printWindow = window.open("", "_blank");
  const content = `
    <html>
      <head>
        <title>Departments Export</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
          header { text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 6px; text-align: left; font-size: 12px; }
          th { background: #f4f4f4; }
        </style>
      </head>
      <body>
        <header>
          <h1>Baco Community College</h1>
          <h2>Departments Export</h2>
          <p>${new Date().toLocaleString()}</p>
        </header>
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Head</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${data
              .map(
                (d) =>
                  `<tr><td>${d.id}</td><td>${d.name}</td><td>${d.head}</td><td>${d.status}</td></tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;
  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 250);
};

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
const CrudModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
  eligibleHeads,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    head_user_id: null,
    status: "Active",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        head_user_id: initialData.head_user_id ?? initialData.user_id ?? null, // Use null if empty
        status: initialData.status || "Active",
        id: initialData.id,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        head_user_id: null,
        status: "Active",
      });
    }
  }, [initialData]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();

    // Convert empty string to null for head_user_id
    const cleanedData = {
      ...formData,
      head_user_id: formData.head_user_id || null,
    };

    const headObj = eligibleHeads.find(
      (h) => h.user_id === cleanedData.head_user_id,
    );

    const updatedData = {
      ...cleanedData,
      head: headObj ? `${headObj.first_name} ${headObj.last_name}` : "",
    };

    onSubmit(updatedData);
    onClose();
    // Reset formData after submit
    setFormData({
      name: "",
      description: "",
      head_user_id: null,
      status: "Active",
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">
              {mode === "add" ? "Add Department" : "Edit Department"}
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
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Name
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
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
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Head */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Head
              </label>
              <Select
                value={
                  formData.head_user_id
                    ? eligibleHeads
                        .map((u) => ({
                          value: u.user_id,
                          label: `${u.first_name} ${u.last_name} (${u.role})`,
                        }))
                        .find((o) => o.value === formData.head_user_id)
                    : null
                }
                onChange={(selected) =>
                  setFormData((prev) => ({
                    ...prev,
                    head_user_id: selected ? selected.value : null,
                  }))
                }
                options={eligibleHeads.map((u) => ({
                  value: u.user_id,
                  label: `${u.first_name} ${u.last_name} (${u.role})`,
                }))}
                placeholder="Select or type head..."
                isClearable
                isSearchable
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: "#CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    boxShadow: "none",
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
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
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
                {mode === "add" ? "Add Department" : "Update Department"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- View Modal ---
const ViewModal = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Avatar and Name */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-indigo-100 rounded-full p-4 mb-3">
            <Building2 className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">{data.name}</h2>
        </div>

        {/* Profile Card */}
        <div className="flex flex-col gap-4 border p-4 rounded-lg bg-gray-50">
          {/* Head */}
          <div>
            <span className="font-semibold text-gray-700">Head:</span>
            <p className="text-gray-900 mt-1">{data.head || "N/A"}</p>
          </div>

          {/* Status */}
          <div>
            <span className="font-semibold text-gray-700">Status:</span>
            <div className="mt-1">
              <StatusBadge status={data.status} />
            </div>
          </div>

          {/* Description */}
          <div>
            <span className="font-semibold text-gray-700">Description:</span>
            <p className="text-gray-900 mt-1">
              {data.description || "No description"}
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
          Are you sure you want to delete this department?
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
const Department = () => {
  const [departments, setDepartments] = useState([]);
  const [eligibleHeads, setEligibleHeads] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentRecord, setCurrentRecord] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const rowsPerPage = 10;

  const filtered = useMemo(
    () =>
      departments.filter((d) =>
        Object.values(d).some((v) =>
          String(v).toLowerCase().includes(search.toLowerCase()),
        ),
      ),
    [departments, search],
  );

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const displayed = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/dept/departments`,
      );
      setDepartments(res.data);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    }
  };

  const fetchEligibleHeads = async () => {
    try {
      const res = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/dept/departments/eligible-heads`,
      );
      setEligibleHeads(res.data);
    } catch (error) {
      console.error("Failed to fetch eligible heads:", error);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchEligibleHeads();
  }, []);

  const openModalHandler = (mode, record = null) => {
    setModalMode(mode);
    setCurrentRecord(record || null);
    setIsModalOpen(true);
  };

  const openViewModalHandler = (record) => {
    setCurrentRecord(record);
    setViewModalOpen(true);
  };

  const handleSubmit = async (data) => {
    try {
      let res;

      if (modalMode === "add") {
        res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/dept/departments`,
          data,
        );

        const headObj = eligibleHeads.find(
          (h) => h.user_id === res.data.head_user_id,
        );
        const newDept = {
          ...res.data,
          head: headObj ? `${headObj.first_name} ${headObj.last_name}` : "",
          status: data.status,
        };

        setDepartments((prev) => [...prev, newDept]);
        toast.success("Department added successfully.");
      } else {
        res = await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/api/dept/departments/${
            data.id
          }`,
          data,
        );

        const headObj = eligibleHeads.find(
          (h) => h.user_id === data.head_user_id,
        );
        setDepartments((prev) =>
          prev.map((d) =>
            d.id === data.id
              ? {
                  ...d, // keep other existing fields
                  ...data, // override with edited values
                  head: headObj
                    ? `${headObj.first_name} ${headObj.last_name}`
                    : "",
                  status: data.status,
                }
              : d,
          ),
        );
        toast.success("Department updated successfully.");
      }

      setPage(1);
    } catch (error) {
      console.error("Failed to save department:", error);
      toast.error(
        modalMode === "add"
          ? "Failed to add department."
          : "Failed to update department.",
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
        `${import.meta.env.VITE_API_BASE_URL}/api/dept/departments/${id}`,
      );
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      toast.success("Department deleted successfully.");
    } catch (error) {
      console.error("Failed to delete department:", error);
      toast.error("Failed to delete department.");
    } finally {
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="p-4">
      <ToastContainer position="top-right" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen /> Department Management
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Manage all departments, heads, and their status here. You can add,
          edit, view, or export department records.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <input
          type="text"
          placeholder="Search departments..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="px-2 py-1 border  text-sm border-slate-400 rounded-md w-full sm:w-1/3 focus:ring-1 focus:ring-indigo-500"
        />
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-2">
            {/* CSV Button */}
            <div className="relative group">
              <button
                onClick={() => exportCSV(filtered)}
                className="p-2 border rounded-md text-sm border-slate-400 hover:bg-gray-100 transition relative"
              >
                <FileArchive size={16} />
                {/* Tooltip below */}
                <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity pointer-events-none">
                  Export as CSV
                </span>
              </button>
            </div>

            {/* PDF Button */}
            <div className="relative group">
              <button
                onClick={() => exportPDF(filtered)}
                className="p-2 border rounded-md text-sm border-slate-400 hover:bg-gray-100 transition relative"
              >
                <File size={16} />
                {/* Tooltip below */}
                <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity pointer-events-none">
                  Export as PDF
                </span>
              </button>
            </div>
          </div>

          <button
            onClick={() => openModalHandler("add")}
            className="flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus size={16} /> Department
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold">ID</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">
                Name
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold">
                Head
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold">
                Status
              </th>
              <th className="px-4 py-2 text-right text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-slate-200">
            {displayed.length ? (
              displayed.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-2 text-sm">{d.id}</td>
                  <td className="px-4 py-2 text-sm">{d.name}</td>
                  <td className="px-4 py-2 text-sm">{d.head}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3 text-right flex justify-end gap-2">
                    <button
                      onClick={() => openViewModalHandler(d)}
                      className="text-slate-600 hover:text-slate-800"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => openModalHandler("edit", d)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
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
                  colSpan={5}
                  className="text-center py-4 text-slate-500 italic"
                >
                  No departments found.
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

      <CrudModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        mode={modalMode}
        initialData={currentRecord}
        eligibleHeads={eligibleHeads}
      />
      <ViewModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        data={currentRecord}
      />
      <DeleteConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Department;