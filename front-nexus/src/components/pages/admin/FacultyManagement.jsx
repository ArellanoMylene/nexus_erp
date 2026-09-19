import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import {
  Users,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const StatusBadge = ({ status }) => {
  const colors = {
    Active: "bg-green-100 text-green-800",
    Inactive: "bg-gray-100 text-gray-800",
    OnLeave: "bg-yellow-100 text-yellow-800",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status] || colors.Active}`}
    >
      {status}
    </span>
  );
};

const Pagination = ({ currentPage, totalPages, setPage, totalItems }) => (
  <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700">
    <span className="text-xs sm:text-sm">
      Page <span className="font-semibold">{currentPage}</span> of{" "}
      <span className="font-semibold">{totalPages}</span> | Total Records:{" "}
      {totalItems}
    </span>
    <div className="flex gap-1 mt-2 sm:mt-0">
      <button
        onClick={() => setPage((p) => Math.max(p - 1, 1))}
        disabled={currentPage === 1}
        className="p-1.5 rounded border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
      >
        <ChevronLeft size={16} className="text-slate-600" />
      </button>
      {[...Array(totalPages)].map((_, i) => (
        <button
          key={i + 1}
          onClick={() => setPage(i + 1)}
          className={`px-3 py-1.5 text-xs rounded border transition-colors ${
            currentPage === i + 1
              ? "bg-indigo-600 text-white border-indigo-600"
              : "border-slate-300 text-slate-700 hover:bg-slate-100"
          }`}
        >
          {i + 1}
        </button>
      ))}
      <button
        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
        disabled={currentPage === totalPages || totalPages === 0}
        className="p-1.5 rounded border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
      >
        <ChevronRight size={16} className="text-slate-600" />
      </button>
    </div>
  </div>
);

const FacultyModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
  departments,
}) => {
  const [formData, setFormData] = useState({
    employee_id: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
    department: "",
    position: "",
    specialization: "",
    educational_attainment: "",
    license_number: "",
    date_hired: new Date().toISOString().split("T")[0],
    employment_status: "Active",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        employee_id: initialData.employee_id || "",
        first_name: initialData.first_name || "",
        middle_name: initialData.middle_name || "",
        last_name: initialData.last_name || "",
        email: initialData.email || "",
        password: "", // Only for add mode
        phone: initialData.phone || "",
        department: initialData.department || "",
        position: initialData.position_title || initialData.position || "",
        specialization: initialData.specialization || "",
        educational_attainment: initialData.educational_attainment || "",
        license_number: initialData.license_number || "",
        date_hired: initialData.date_hired || "",
        employment_status:
          initialData.status || initialData.employment_status || "Active",
        faculty_id: initialData.faculty_id,
        user_id: initialData.user_id,
      });
    } else {
      setFormData({
        employee_id: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        password: "",
        phone: "",
        department: "",
        position: "",
        specialization: "",
        educational_attainment: "",
        license_number: "",
        date_hired: new Date().toISOString().split("T")[0],
        employment_status: "Active",
      });
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800">
              {mode === "add"
                ? "Add New Faculty"
                : mode === "edit"
                  ? "Edit Faculty"
                  : "View Faculty"}
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mode === "add" && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    disabled={mode === "view"}
                    autoComplete="new-password"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Employee ID *
                </label>
                <input
                  type="text"
                  value={formData.employee_id}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      employee_id: e.target.value,
                    }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={mode === "view"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      first_name: e.target.value,
                    }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={mode === "view"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Middle Name
                </label>
                <input
                  type="text"
                  value={formData.middle_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      middle_name: e.target.value,
                    }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={mode === "view"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      last_name: e.target.value,
                    }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={mode === "view"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={mode === "view"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={mode === "view"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      department: e.target.value,
                    }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={mode === "view"}
                >
                  <option value="">Select...</option>
                  {departments.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Position *
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      position: e.target.value,
                    }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={mode === "view"}
                  placeholder="e.g., Professor, Instructor"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Specialization
                </label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      specialization: e.target.value,
                    }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={mode === "view"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Educational Attainment
                </label>
                <select
                  value={formData.educational_attainment}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      educational_attainment: e.target.value,
                    }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={mode === "view"}
                >
                  <option value="">Select...</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="Doctorate">Doctorate</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  License Number
                </label>
                <input
                  type="text"
                  value={formData.license_number}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      license_number: e.target.value,
                    }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={mode === "view"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Date Hired *
                </label>
                <input
                  type="date"
                  value={formData.date_hired}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      date_hired: e.target.value,
                    }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={mode === "view"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Employment Status
                </label>
                <select
                  value={formData.employment_status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      employment_status: e.target.value,
                    }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={mode === "view"}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="OnLeave">On Leave</option>
                </select>
              </div>
            </div>
          </div>

          {mode !== "view" && (
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 rounded-b-lg">
              <div className="flex justify-end gap-3">
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
                  {mode === "add" ? "Create Faculty" : "Update Faculty"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

const FacultyManagement = () => {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [filterDepartment, setFilterDepartment] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentRecord, setCurrentRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/faculty`);
      setFaculty(res.data);
    } catch (err) {
      console.error("Error fetching faculty:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/dept/departments`);
      const deptList = (res.data || []).map((d) => ({
        value: d.id,
        label: d.name,
      }));
      setDepartments(deptList);
      console.log("[FacultyManagement] fetched departments:", deptList);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  useEffect(() => {
    fetchFaculty();
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = faculty.filter((f) => {
    const matchSearch =
      (f.first_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (f.last_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (f.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (f.employee_id || "").toLowerCase().includes(search.toLowerCase());
    const matchDept =
      !filterDepartment || f.department === filterDepartment.label;
    return matchSearch && matchDept;
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const displayed = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const handleSubmit = async (data) => {
    try {
      if (modalMode === "add") {
        await axios.post(`${API_BASE}/api/faculty`, data);
      } else {
        // Use user_id for edit requests
        await axios.put(
          `${API_BASE}/api/faculty/${data.user_id || data.faculty_id}`,
          data,
        );
      }
      fetchFaculty();
      setModalOpen(false);
      setCurrentRecord(null);
    } catch (err) {
      console.error("Error saving faculty:", err);
      alert(err.response?.data?.message || "Failed to save faculty");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this faculty member?")) return;
    try {
      await axios.delete(`${API_BASE}/api/faculty/${id}`);
      fetchFaculty();
    } catch (err) {
      console.error("Error deleting faculty:", err);
    }
  };

  const openModal = (mode, record = null) => {
    setModalMode(mode);
    setCurrentRecord(record);
    setModalOpen(true);
  };

  return (
    <div className=" p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users size={24} className="text-indigo-600" />
            Faculty Management
          </h2>
          <span className="text-sm text-slate-500 font-medium">
            Manage Faculty Records
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input - LEFT */}
          <div className="relative flex-grow max-w-xs">
            <Search
              className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={filterDepartment}
              onChange={(selected) => {
                setFilterDepartment(selected);
                setPage(1);
              }}
              options={departments}
              placeholder="All Departments"
              isClearable
              className="w-56 text-sm"
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "38px",
                  borderColor: "rgb(203 213 225)",
                  "&:hover": { borderColor: "rgb(148 163 184)" },
                }),
              }}
            />
            <button
              onClick={() => openModal("add")}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors shadow-md shadow-indigo-500/30 whitespace-nowrap"
            >
              <Plus size={14} /> Add Faculty
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100">
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                <th className="px-4 py-2.5">Employee ID</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Department</th>
                <th className="px-4 py-2.5">Position</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 w-1/12 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-4 text-slate-500 italic"
                  >
                    Loading...
                  </td>
                </tr>
              ) : displayed.length > 0 ? (
                displayed.map((fac) => (
                  <tr
                    key={fac.faculty_id || fac.employee_id || Math.random()}
                    className="text-sm text-slate-700 hover:bg-indigo-50/50 transition duration-150"
                  >
                    <td className="px-4 py-2 font-medium">{fac.employee_id}</td>
                    <td className="px-4 py-2">
                      {fac.first_name} {fac.last_name}
                    </td>
                    <td className="px-4 py-2">{fac.email}</td>
                    <td className="px-4 py-2">{fac.department || "N/A"}</td>
                    <td className="px-4 py-2">{fac.position || "N/A"}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={fac.employment_status || "Active"} />
                    </td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button
                        onClick={() => openModal("view", fac)}
                        className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded-full hover:bg-slate-200"
                        title="View"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => openModal("edit", fac)}
                        className="text-indigo-600 hover:text-indigo-800 transition-colors p-1 rounded-full hover:bg-slate-200"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(fac.faculty_id)}
                        className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-full hover:bg-slate-200"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-4 text-slate-500 italic"
                  >
                    No faculty members found.
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

        <FacultyModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setCurrentRecord(null);
          }}
          onSubmit={handleSubmit}
          mode={modalMode}
          initialData={currentRecord}
          departments={departments}
        />
      </div>
    </div>
  );
};

export default FacultyManagement;
