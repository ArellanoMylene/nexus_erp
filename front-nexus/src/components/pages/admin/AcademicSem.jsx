import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Plus,
  Pencil,
  Trash2,
  File,
  FileArchive,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Power,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { saveAs } from "file-saver";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// --- Status Badge Component ---
const StatusBadge = ({ status }) => {
  const statusConfig = {
    Active: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle2 },
    Upcoming: { bg: "bg-blue-100", text: "text-blue-800", icon: Clock },
    Closed: { bg: "bg-gray-100", text: "text-gray-800", icon: XCircle },
  };

  const config = statusConfig[status] || statusConfig.Closed;
  const Icon = config.icon;

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${config.bg} ${config.text}`}
    >
      <Icon size={12} />
      {status}
    </span>
  );
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

// --- Academic Period Modal Component ---
const AcademicPeriodModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    school_year: "",
    semester: "1st Semester",
    start_date: "",
    end_date: "",
    is_active: false,
    status: "Upcoming",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        school_year: initialData.school_year || "",
        semester: initialData.semester || "1st Semester",
        start_date: initialData.start_date
          ? initialData.start_date.split("T")[0]
          : "",
        end_date: initialData.end_date
          ? initialData.end_date.split("T")[0]
          : "",
        is_active: initialData.is_active || false,
        status: initialData.status || "Upcoming",
        id: initialData.id,
      });
    } else {
      setFormData({
        school_year: "",
        semester: "1st Semester",
        start_date: "",
        end_date: "",
        is_active: false,
        status: "Upcoming",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

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
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">
              {mode === "add" ? "Add Academic Period" : "Edit Academic Period"}
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
              {/* School Year */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  School Year *
                </label>
                <input
                  name="school_year"
                  value={formData.school_year}
                  onChange={handleChange}
                  placeholder="e.g. 2024-2025"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Semester */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Semester *
                </label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Start Date *
                </label>
                <input
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  End Date *
                </label>
                <input
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <option value="Upcoming">Upcoming</option>
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {/* Is Active Checkbox */}
              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="is_active"
                  className="text-sm font-medium text-slate-900 ml-2"
                >
                  Set as Active Period
                </label>
              </div>
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
                {mode === "add" ? "Add Period" : "Update Period"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Academic Period View Modal ---
const AcademicPeriodViewModal = ({ isOpen, onClose, period }) => {
  if (!isOpen || !period) return null;

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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
            <Calendar className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            {period.school_year}
          </h2>
          <p className="text-sm text-gray-600">{period.semester}</p>
        </div>

        {/* Period Details */}
        <div className="flex flex-col gap-4 border p-4 rounded-lg bg-gray-50">
          {/* Start Date */}
          <div>
            <span className="font-semibold text-gray-700">Start Date:</span>
            <p className="text-gray-900 mt-1">
              {formatDate(period.start_date)}
            </p>
          </div>

          {/* End Date */}
          <div>
            <span className="font-semibold text-gray-700">End Date:</span>
            <p className="text-gray-900 mt-1">{formatDate(period.end_date)}</p>
          </div>

          {/* Status */}
          <div>
            <span className="font-semibold text-gray-700">Status:</span>
            <div className="mt-1">
              <StatusBadge status={period.status} />
            </div>
          </div>

          {/* Active Status */}
          <div>
            <span className="font-semibold text-gray-700">Active Period:</span>
            <p className="text-gray-900 mt-1">
              {period.is_active ? "Yes" : "No"}
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

// --- Generic Confirm Modal (used for delete + activate) ---
const ConfirmModal = ({ isOpen, onClose, onConfirm, message, confirmLabel = "Yes", tone = "danger" }) => {
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

// --- Main Component ---
function AcademicSem() {
  const [periods, setPeriods] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentRecord, setCurrentRecord] = useState(null);
  const [viewPeriod, setViewPeriod] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [activateTargetId, setActivateTargetId] = useState(null);

  // Fetch data
  const fetchAcademicPeriods = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/academic-periods`,
      );
      setPeriods(res.data);
    } catch (err) {
      console.error("Failed to fetch academic periods:", err);
    }
  };

  useEffect(() => {
    fetchAcademicPeriods();
  }, []);

  // Filter & paginate
  const filtered = useMemo(
    () =>
      periods.filter(
        (p) =>
          (p.school_year || "").toLowerCase().includes(search.toLowerCase()) ||
          (p.semester || "").toLowerCase().includes(search.toLowerCase()) ||
          (p.status || "").toLowerCase().includes(search.toLowerCase()),
      ),
    [periods, search],
  );

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const displayed = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  // Export
  const exportCSV = (data) => {
    const csv = [
      [
        "ID",
        "School Year",
        "Semester",
        "Start Date",
        "End Date",
        "Status",
        "Active",
      ],
      ...data.map((p) => [
        p.id,
        p.school_year,
        p.semester,
        p.start_date,
        p.end_date,
        p.status,
        p.is_active ? "Yes" : "No",
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");
    saveAs(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
      "academic_periods.csv",
    );
  };

  const exportPDF = (data) => {
    const doc = new jsPDF();
    doc.text("Academic Periods", 14, 16);
    doc.autoTable({
      head: [["School Year", "Semester", "Start Date", "End Date", "Status"]],
      body: data.map((p) => [
        p.school_year,
        p.semester,
        new Date(p.start_date).toLocaleDateString(),
        new Date(p.end_date).toLocaleDateString(),
        p.status,
      ]),
      startY: 20,
    });
    doc.save("academic_periods.pdf");
  };

  // Turn a raw axios error into a short, human-readable message
  const getErrorMessage = (err, fallback) => {
    const serverMessage =
      err.response?.data?.message || err.response?.data?.error;
    if (serverMessage) return serverMessage;
    if (err.response?.status === 400)
      return "Some fields are missing or invalid. Please check the form and try again.";
    if (err.response?.status === 404)
      return "This academic period no longer exists. It may have already been deleted.";
    if (err.response?.status === 409)
      return "An academic period with this school year and semester already exists.";
    if (err.response?.status === 500)
      return "Something went wrong on the server. Please try again later.";
    if (!err.response)
      return "Can't reach the server. Check your connection and try again.";
    return fallback;
  };

  // CRUD
  const handleSubmit = async (data) => {
    try {
      let res;
      if (modalMode === "add") {
        res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/academic-periods`,
          data,
        );
        setPeriods((prev) => [...prev, res.data]);
        toast.success("Academic period added successfully.");
      } else {
        res = await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/api/academic-periods/${
            data.id
          }`,
          data,
        );
        setPeriods((prev) =>
          prev.map((p) =>
            p.id === data.id
              ? {
                  ...p,
                  ...data,
                }
              : p,
          ),
        );
        toast.success("Academic period updated successfully.");
      }
      fetchAcademicPeriods(); // Refresh to get updated active status
      setModalOpen(false);
    } catch (err) {
      console.error(
        "Failed to save academic period:",
        err.response?.data || err.message,
      );
      toast.error(
        getErrorMessage(
          err,
          modalMode === "add"
            ? "Failed to add academic period."
            : "Failed to update academic period.",
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
        `${import.meta.env.VITE_API_BASE_URL}/api/academic-periods/${id}`,
      );
      setPeriods((prev) => prev.filter((p) => p.id !== id));
      toast.success("Academic period deleted successfully.");
    } catch (err) {
      console.error(
        "Failed to delete academic period:",
        err.response?.data || err.message,
      );
      toast.error(getErrorMessage(err, "Failed to delete academic period."));
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleActivate = (id) => {
    setActivateTargetId(id);
  };

  const cancelActivate = () => {
    setActivateTargetId(null);
  };

  const confirmActivate = async () => {
    const id = activateTargetId;
    if (!id) return;
    try {
      await axios.post(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/academic-periods/${id}/activate`,
      );
      fetchAcademicPeriods(); // Refresh to update all active statuses
      toast.success("Academic period activated successfully.");
    } catch (err) {
      console.error(
        "Failed to activate period:",
        err.response?.data || err.message,
      );
      toast.error(getErrorMessage(err, "Failed to activate academic period."));
    } finally {
      setActivateTargetId(null);
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
          <Calendar size={24} /> Academic Year & Semester Management
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Manage school years, semesters, and enrollment periods. Only one
          period can be active at a time.
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <input
          type="text"
          placeholder="Search periods..."
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
            <Plus size={16} /> Period
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
                School Year
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Semester
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Start Date
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                End Date
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Status
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Active
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
                  <td className="px-3 py-2 text-sm font-semibold">
                    {p.school_year}
                  </td>
                  <td className="px-3 py-2 text-sm">{p.semester}</td>
                  <td className="px-3 py-2 text-sm">
                    {new Date(p.start_date).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {new Date(p.end_date).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {p.is_active ? (
                      <span className="text-green-600 font-semibold">
                        ✓ Yes
                      </span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right flex justify-end gap-2">
                    {!p.is_active && (
                      <button
                        onClick={() => handleActivate(p.id)}
                        className="text-green-600 hover:text-green-800"
                        title="Set as Active"
                      >
                        <Power size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setViewPeriod(p);
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
                      title="Edit Period"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete Period"
                      disabled={p.is_active}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr key="no-periods">
                <td
                  colSpan={8}
                  className="text-center py-4 text-slate-500 italic"
                >
                  No academic periods found.
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
      <AcademicPeriodModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        mode={modalMode}
        initialData={currentRecord}
      />
      <AcademicPeriodViewModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        period={viewPeriod}
      />
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        message={
          <>
            Are you sure you want to delete this academic period?{" "}
            <span className="text-red-400">This action cannot be undone!</span>
          </>
        }
        confirmLabel="Yes"
        tone="danger"
      />
      <ConfirmModal
        isOpen={activateTargetId !== null}
        onClose={cancelActivate}
        onConfirm={confirmActivate}
        message="Set this as the active academic period? The currently active period will be closed."
        confirmLabel="Activate"
        tone="success"
      />
    </div>
  );
}

export default AcademicSem;