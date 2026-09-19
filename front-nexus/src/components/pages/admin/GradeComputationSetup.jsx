import { useState, useEffect } from "react";
import Select from "react-select";
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const GradeComputationSetup = () => {
  const [settings, setSettings] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [filters, setFilters] = useState({
    course_id: "",
    period_id: "",
    section_id: "",
    search: "",
  });
  const [formData, setFormData] = useState({
    component_name: "",
    component_type: "quiz",
    course_id: "",
    section_id: "",
    period_id: "",
    weight: "",
    computation_method: "average",
    is_required: true,
  });
  const [totalWeight, setTotalWeight] = useState(0);

  useEffect(() => {
    fetchSettings();
    fetchCourses();
    fetchSections();
    fetchPeriods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(
        `${API_BASE}/api/grade-computation-settings?${queryParams}`,
      );
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
        // Calculate total weight
        const total = data.data.reduce(
          (sum, setting) => sum + parseFloat(setting.weight || 0),
          0,
        );
        setTotalWeight(total);
      }
    } catch (error) {
      console.error("Error fetching grade computation settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/course/courses`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setCourses(data);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/sections`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setSections(data);
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
    }
  };

  const fetchPeriods = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/academic-periods`,
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        setPeriods(data);
      }
    } catch (error) {
      console.error("Error fetching periods:", error);
    }
  };

  const handleFilter = () => {
    fetchSettings();
  };

  const handleOpenModal = (setting = null) => {
    if (setting) {
      setEditingSetting(setting);
      setFormData({
        component_name: setting.component_name || "",
        component_type: setting.component_type || "quiz",
        course_id: setting.course_id || "",
        section_id: setting.section_id || "",
        period_id: setting.period_id || "",
        weight: setting.weight || "",
        computation_method: setting.computation_method || "average",
        is_required: setting.is_required || false,
      });
    } else {
      setEditingSetting(null);
      setFormData({
        component_name: "",
        component_type: "quiz",
        course_id: "",
        section_id: "",
        period_id: "",
        weight: "",
        computation_method: "average",
        is_required: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSetting(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingSetting
        ? `${API_BASE}/api/grade-computation-settings/${editingSetting.setting_id}`
        : `${API_BASE}/api/grade-computation-settings`;
      const method = editingSetting ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        alert(
          editingSetting
            ? "Setting updated successfully"
            : "Setting created successfully",
        );
        handleCloseModal();
        fetchSettings();
      } else {
        alert("Error: " + (data.message || "Failed to save setting"));
      }
    } catch (error) {
      console.error("Error saving setting:", error);
      alert("Error saving setting");
    }
  };

  const handleDelete = async (settingId) => {
    if (!confirm("Are you sure you want to delete this setting?")) return;
    try {
      const response = await fetch(
        `${API_BASE}/api/grade-computation-settings/${settingId}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (data.success) {
        alert("Setting deleted successfully");
        fetchSettings();
      }
    } catch (error) {
      console.error("Error deleting setting:", error);
      alert("Error deleting setting");
    }
  };

  const getComponentTypeBadge = (type) => {
    const typeColors = {
      exam: "bg-red-100 text-red-800",
      quiz: "bg-yellow-100 text-yellow-800",
      assignment: "bg-blue-100 text-blue-800",
      project: "bg-purple-100 text-purple-800",
      attendance: "bg-green-100 text-green-800",
      participation: "bg-indigo-100 text-indigo-800",
      other: "bg-slate-100 text-slate-800",
    };

    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          typeColors[type] || "bg-slate-100 text-slate-800"
        }`}
      >
        {type}
      </span>
    );
  };

  return (
    <div className=" p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText size={24} className="text-indigo-600" />
            Grade Computation Setup
          </h2>
          <span className="text-sm text-slate-500 font-medium">
            Data Integrity: Online
          </span>
        </div>

        {/* Weight Status Card */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-slate-600">Total Weight</h3>
              <div className="flex items-center gap-4 mt-2">
                <p
                  className={`text-2xl font-bold ${
                    totalWeight === 100 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {totalWeight.toFixed(2)}%
                </p>
                {totalWeight !== 100 && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertCircle size={16} />
                    <span className="text-sm font-medium">
                      {totalWeight < 100
                        ? `${(100 - totalWeight).toFixed(2)}% remaining`
                        : `${(totalWeight - 100).toFixed(2)}% over limit`}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Settings className="text-indigo-500" size={40} />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input - LEFT */}
          <div className="relative flex-grow max-w-xs">
            <input
              type="text"
              placeholder="Search settings..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all shadow-inner"
            />
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
          </div>

          {/* Filters - RIGHT */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Course ID"
              className="px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-32"
              value={filters.course_id}
              onChange={(e) =>
                setFilters({ ...filters, course_id: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Period ID"
              className="px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-32"
              value={filters.period_id}
              onChange={(e) =>
                setFilters({ ...filters, period_id: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Section ID"
              className="px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-32"
              value={filters.section_id}
              onChange={(e) =>
                setFilters({ ...filters, section_id: e.target.value })
              }
            />
            <button
              onClick={handleFilter}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
            >
              Apply Filters
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors shadow-md shadow-indigo-500/30"
            >
              <Plus size={14} />
              Add Component
            </button>
          </div>
        </div>

        {/* Settings Table */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-slate-800">
            Grade Component Settings
          </h2>
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                  <th className="px-4 py-2.5">Component Name</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Course</th>
                  <th className="px-4 py-2.5">Section</th>
                  <th className="px-4 py-2.5">Weight (%)</th>
                  <th className="px-4 py-2.5">Method</th>
                  <th className="px-4 py-2.5">Required</th>
                  <th className="px-4 py-2.5 w-1/12 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : settings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No grade computation settings found
                    </td>
                  </tr>
                ) : (
                  settings.map((setting) => (
                    <tr key={setting.setting_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {setting.component_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getComponentTypeBadge(setting.component_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {setting.course_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {setting.section_name || "All Sections"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-semibold">
                        {setting.weight}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 capitalize">
                        {setting.computation_method.replace("_", " ")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            setting.is_required
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {setting.is_required ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal(setting)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(setting.setting_id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700">
            <span className="text-xs sm:text-sm">
              Page <span className="font-semibold">{currentPage}</span> of{" "}
              <span className="font-semibold">
                {(() => {
                  const searchTerm = filters.search.toLowerCase();
                  const filtered = settings.filter((setting) => {
                    const matchesSearch =
                      setting.component_name
                        ?.toLowerCase()
                        .includes(searchTerm) ||
                      setting.component_type
                        ?.toLowerCase()
                        .includes(searchTerm) ||
                      setting.course_code?.toLowerCase().includes(searchTerm) ||
                      setting.section_name?.toLowerCase().includes(searchTerm);
                    return matchesSearch;
                  });
                  return Math.ceil(filtered.length / itemsPerPage) || 1;
                })()}
              </span>{" "}
              | Total Records:{" "}
              {(() => {
                const searchTerm = filters.search.toLowerCase();
                const filtered = settings.filter((setting) => {
                  const matchesSearch =
                    setting.component_name
                      ?.toLowerCase()
                      .includes(searchTerm) ||
                    setting.component_type
                      ?.toLowerCase()
                      .includes(searchTerm) ||
                    setting.course_code?.toLowerCase().includes(searchTerm) ||
                    setting.section_name?.toLowerCase().includes(searchTerm);
                  return matchesSearch;
                });
                return filtered.length;
              })()}
            </span>
            <div className="flex gap-1 mt-2 sm:mt-0">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft size={16} className="text-slate-600" />
              </button>
              {(() => {
                const searchTerm = filters.search.toLowerCase();
                const filtered = settings.filter((setting) => {
                  const matchesSearch =
                    setting.component_name
                      ?.toLowerCase()
                      .includes(searchTerm) ||
                    setting.component_type
                      ?.toLowerCase()
                      .includes(searchTerm) ||
                    setting.course_code?.toLowerCase().includes(searchTerm) ||
                    setting.section_name?.toLowerCase().includes(searchTerm);
                  return matchesSearch;
                });
                const totalPages =
                  Math.ceil(filtered.length / itemsPerPage) || 1;

                return [...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                      currentPage === i + 1
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ));
              })()}
              <button
                onClick={() => {
                  const searchTerm = filters.search.toLowerCase();
                  const filtered = settings.filter((setting) => {
                    const matchesSearch =
                      setting.component_name
                        ?.toLowerCase()
                        .includes(searchTerm) ||
                      setting.component_type
                        ?.toLowerCase()
                        .includes(searchTerm) ||
                      setting.course_code?.toLowerCase().includes(searchTerm) ||
                      setting.section_name?.toLowerCase().includes(searchTerm);
                    return matchesSearch;
                  });
                  const totalPages =
                    Math.ceil(filtered.length / itemsPerPage) || 1;
                  setCurrentPage(Math.min(totalPages, currentPage + 1));
                }}
                disabled={(() => {
                  const searchTerm = filters.search.toLowerCase();
                  const filtered = settings.filter((setting) => {
                    const matchesSearch =
                      setting.component_name
                        ?.toLowerCase()
                        .includes(searchTerm) ||
                      setting.component_type
                        ?.toLowerCase()
                        .includes(searchTerm) ||
                      setting.course_code?.toLowerCase().includes(searchTerm) ||
                      setting.section_name?.toLowerCase().includes(searchTerm);
                    return matchesSearch;
                  });
                  const totalPages =
                    Math.ceil(filtered.length / itemsPerPage) || 1;
                  return currentPage === totalPages;
                })()}
                className="p-1.5 rounded border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div
            className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50 transition-opacity duration-300"
            onClick={handleCloseModal}
          >
            <div
              className="bg-white rounded-lg shadow-2xl w-full max-w-4xl transform transition-transform duration-300 scale-100 border border-slate-200 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-lg z-10">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingSetting ? "Edit" : "Add"} Grade Component
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Plus size={18} className="rotate-45" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Component Name *
                    </label>
                    <input
                      type="text"
                      value={formData.component_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          component_name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Component Type *
                    </label>
                    <select
                      value={formData.component_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          component_type: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      required
                    >
                      <option value="quiz">Quiz</option>
                      <option value="exam">Exam</option>
                      <option value="assignment">Assignment</option>
                      <option value="project">Project</option>
                      <option value="attendance">Attendance</option>
                      <option value="participation">Participation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Course ID *
                    </label>
                    <Select
                      options={courses.map((course) => ({
                        value: course.id,
                        label: `${course.code} - ${course.title}`,
                      }))}
                      value={
                        formData.course_id
                          ? {
                              value: formData.course_id,
                              label: courses.find(
                                (c) => c.id === formData.course_id,
                              )
                                ? `${courses.find((c) => c.id === formData.course_id).code} - ${courses.find((c) => c.id === formData.course_id).title}`
                                : "",
                            }
                          : null
                      }
                      onChange={(option) =>
                        setFormData({
                          ...formData,
                          course_id: option?.value || "",
                        })
                      }
                      className="text-sm"
                      placeholder="Select course..."
                      isClearable
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Section ID
                    </label>
                    <Select
                      options={sections.map((section) => ({
                        value: section.section_id,
                        label: section.section_name,
                      }))}
                      value={
                        formData.section_id
                          ? {
                              value: formData.section_id,
                              label:
                                sections.find(
                                  (s) => s.section_id === formData.section_id,
                                )?.section_name || "",
                            }
                          : null
                      }
                      onChange={(option) =>
                        setFormData({
                          ...formData,
                          section_id: option?.value || "",
                        })
                      }
                      className="text-sm"
                      placeholder="Select section..."
                      isClearable
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Period ID *
                    </label>
                    <Select
                      options={periods.map((period) => ({
                        value: period.id,
                        label: `${period.school_year} - ${period.semester}`,
                      }))}
                      value={
                        formData.period_id
                          ? {
                              value: formData.period_id,
                              label: periods.find(
                                (p) => p.id === formData.period_id,
                              )
                                ? `${periods.find((p) => p.id === formData.period_id).school_year} - ${periods.find((p) => p.id === formData.period_id).semester}`
                                : "",
                            }
                          : null
                      }
                      onChange={(option) =>
                        setFormData({
                          ...formData,
                          period_id: option?.value || "",
                        })
                      }
                      className="text-sm"
                      placeholder="Select period..."
                      isClearable
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Weight (%) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData({ ...formData, weight: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Computation Method *
                    </label>
                    <select
                      value={formData.computation_method}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          computation_method: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      required
                    >
                      <option value="average">Average</option>
                      <option value="highest">Highest</option>
                      <option value="lowest">Lowest</option>
                      <option value="total">Total</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Required
                    </label>
                    <select
                      value={formData.is_required}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_required: e.target.value === "true",
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors border border-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/30"
                  >
                    {editingSetting ? "Update" : "Save"} Component
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeComputationSetup;
