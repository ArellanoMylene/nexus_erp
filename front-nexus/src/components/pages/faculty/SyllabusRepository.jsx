import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  FileText,
  Download,
  Upload,
  BookOpen,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const SyllabusRepository = () => {
  const [syllabi, setSyllabi] = useState([]);
  const [courses, setCourses] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSyllabus, setCurrentSyllabus] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCourse, setFilterCourse] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    course_id: "",
    period_id: "",
    file_name: "",
    file_path: "",
    file_type: "",
    file_size: 0,
    description: "",
    uploaded_by: "",
  });

  useEffect(() => {
    fetchSyllabi();
    fetchCourses();
    fetchPeriods();

    // Get current user
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setFormData((prev) => ({ ...prev, uploaded_by: user.user_id }));
    }
  }, []);

  const fetchSyllabi = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/syllabus`);
      setSyllabi(response.data);
    } catch (error) {
      console.error("Error fetching syllabi:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/course/courses`,
      );
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchPeriods = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/academic-periods`,
      );
      setPeriods(response.data);
    } catch (error) {
      console.error("Error fetching periods:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (selectedOption, field) => {
    setFormData({ ...formData, [field]: selectedOption?.value || "" });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real implementation, you would upload this to a server
      // For now, we'll simulate with local file info
      setFormData({
        ...formData,
        file_name: file.name,
        file_path: `/uploads/syllabus/${file.name}`, // Simulated path
        file_type: file.type,
        file_size: file.size,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    /*   // Always set uploaded_by to the logged-in user's user_id or userId
    const user = JSON.parse(localStorage.getItem("userId"));
    const userId = user?.user_id || user?.userId;
    if (!userId) {
      alert("You must be logged in to upload a syllabus.", userId);
      return;
    } */
    const submitData = { ...formData, uploaded_by: formData.uploaded_by };
    try {
      if (editMode) {
        await axios.put(
          `${API_BASE}/api/syllabus/${currentSyllabus.syllabus_id}`,
          submitData,
        );
      } else {
        await axios.post(`${API_BASE}/api/syllabus`, submitData);
      }
      fetchSyllabi();
      closeModal();
    } catch (error) {
      console.error("Error saving syllabus:", error);
      alert(error.response?.data?.error || "Error saving syllabus");
    }
  };

  const handleEdit = (syllabus) => {
    setCurrentSyllabus(syllabus);
    setFormData({
      course_id: syllabus.course_id,
      period_id: syllabus.period_id || "",
      file_name: syllabus.file_name,
      file_path: syllabus.file_path,
      file_type: syllabus.file_type || "",
      file_size: syllabus.file_size || 0,
      description: syllabus.description || "",
      uploaded_by: syllabus.uploaded_by,
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this syllabus?")) {
      try {
        await axios.delete(`${API_BASE}/api/syllabus/${id}`);
        fetchSyllabi();
      } catch (error) {
        console.error("Error deleting syllabus:", error);
        alert(error.response?.data?.error || "Error deleting syllabus");
      }
    }
  };

  const handleDownload = (syllabus) => {
    // In a real implementation, this would download the actual file
    alert(`Downloading: ${syllabus.file_name}`);
    // window.open(syllabus.file_path, '_blank');
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setCurrentSyllabus(null);
    const user = JSON.parse(localStorage.getItem("user"));
    setFormData({
      course_id: "",
      period_id: "",
      file_name: "",
      file_path: "",
      file_type: "",
      file_size: 0,
      description: "",
      uploaded_by: user?.user_id || "",
    });
  };

  // Filter syllabi
  const filteredSyllabi = syllabi.filter((syllabus) => {
    const matchesSearch =
      syllabus.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      syllabus.course_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      syllabus.course_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      syllabus.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCourse =
      !filterCourse || syllabus.course_id === filterCourse.value;
    const matchesPeriod =
      !filterPeriod || syllabus.period_id === filterPeriod.value;

    return matchesSearch && matchesCourse && matchesPeriod;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSyllabi.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSyllabi.length / itemsPerPage);

  const courseOptions = courses.map((course) => ({
    value: course.id || course.course_id,
    label: `${course.code || course.course_code || ""} - ${course.title || course.course_title || ""}`,
  }));

  const periodOptions = periods.map((period) => ({
    value: period.id || period.period_id,
    label: `${period.school_year || period.year || ""} ${period.semester || period.period_name || ""}`,
  }));

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper Components
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
          className="p-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-2 py-1 text-xs font-semibold text-indigo-600">
          {currentPage}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  // Calculate statistics
  const totalFiles = syllabi.length;
  const totalSize = syllabi.reduce((sum, s) => sum + (s.file_size || 0), 0);
  const recentUploads = syllabi.filter((s) => {
    const uploadDate = new Date(s.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return uploadDate >= weekAgo;
  }).length;

  return (
    <div className=" p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText size={24} className="text-indigo-600" />
            Syllabus Repository
          </h2>
          <span className="text-sm text-slate-500 font-medium">
            Course Materials & Documents
          </span>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4">
            <p className="text-xs font-medium text-slate-600">
              Total Files
            </p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {totalFiles}
            </p>
          </div>

          <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4">
            <p className="text-xs font-medium text-slate-600">
              Total Storage
            </p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatFileSize(totalSize)}
            </p>
          </div>

          <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4">
            <p className="text-xs font-medium text-slate-600">
              Recent Uploads (7d)
            </p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {recentUploads}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-3">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input - LEFT */}
            <div className="relative flex-grow max-w-xs">
              <input
                type="text"
                placeholder="Search syllabus files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all shadow-inner"
              />
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
            </div>

            {/* Filters and Action Buttons - RIGHT */}
            <div className="flex items-center gap-2">
              <div className="w-44">
                <Select
                  options={courseOptions}
                  value={filterCourse}
                  onChange={setFilterCourse}
                  placeholder="Course"
                  isClearable
                  className="text-sm"
                  classNamePrefix="react-select"
                />
              </div>

              <div className="w-44">
                <Select
                  options={periodOptions}
                  value={filterPeriod}
                  onChange={setFilterPeriod}
                  placeholder="Period"
                  isClearable
                  className="text-sm"
                  classNamePrefix="react-select"
                />
              </div>

              {/* Upload Button */}
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium border border-indigo-700 shadow-md shadow-indigo-500/30 whitespace-nowrap"
              >
                <Upload size={14} />
                Upload Syllabus
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                  <th className="px-4 py-2.5">File Name</th>
                  <th className="px-4 py-2.5">Course</th>
                  <th className="px-4 py-2.5">Period</th>
                  <th className="px-4 py-2.5">Size</th>
                  <th className="px-4 py-2.5">Uploaded By</th>
                  <th className="px-4 py-2.5">Upload Date</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {currentItems.length > 0 ? (
                  currentItems.map((syllabus) => (
                    <tr
                      key={syllabus.syllabus_id}
                      className="text-sm text-slate-700 hover:bg-indigo-50/50 transition duration-150"
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <FileText
                            className="text-indigo-600"
                            size={18}
                          />
                          <div>
                            <div className="font-semibold text-slate-900">
                              {syllabus.file_name}
                            </div>
                            {syllabus.description && (
                              <div className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">
                                {syllabus.description.substring(0, 60)}
                                {syllabus.description.length > 60 && "..."}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="font-medium text-slate-900">
                          {syllabus.course_code}
                        </div>
                        <div className="text-xs text-slate-500 max-w-xs truncate">
                          {syllabus.course_title}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {syllabus.semester ? (
                          `${syllabus.semester} ${syllabus.school_year}`
                        ) : (
                          <span className="text-slate-400">
                            N/A
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {formatFileSize(syllabus.file_size)}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <Users
                            size={12}
                            className="text-slate-400"
                          />
                          <span className="text-xs">
                            {syllabus.first_name} {syllabus.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <Clock
                            size={12}
                            className="text-slate-400"
                          />
                          <span className="text-xs">
                            {formatDate(syllabus.created_at)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDownload(syllabus)}
                            className="text-green-600 hover:text-green-800 transition-colors p-1 rounded-full hover:bg-slate-200"
                            title="Download"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={() => handleEdit(syllabus)}
                            className="text-indigo-600 hover:text-indigo-800 transition-colors p-1 rounded-full hover:bg-slate-200"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(syllabus.syllabus_id)}
                            className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-full hover:bg-slate-200"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-4 text-center text-slate-500 italic"
                    >
                      No syllabus files found matching your search criteria.
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
            setPage={setCurrentPage}
            totalItems={filteredSyllabi.length}
          />
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 z-50 transition-opacity duration-300"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-2xl transform transition-transform duration-300 scale-100 border border-slate-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-lg z-10">
              <h3 className="text-lg font-bold text-slate-900">
                {editMode ? "Edit Syllabus" : "Upload New Syllabus"}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Plus size={18} className="rotate-45" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Course *
                  </label>
                  <Select
                    options={courseOptions}
                    value={courseOptions.find(
                      (o) => o.value === formData.course_id,
                    )}
                    onChange={(option) =>
                      handleSelectChange(option, "course_id")
                    }
                    placeholder="Select Course"
                    required
                    className="text-sm"
                    classNamePrefix="react-select"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Academic Period
                  </label>
                  <Select
                    options={periodOptions}
                    value={periodOptions.find(
                      (o) => o.value === formData.period_id,
                    )}
                    onChange={(option) =>
                      handleSelectChange(option, "period_id")
                    }
                    placeholder="Select Period (Optional)"
                    isClearable
                    className="text-sm"
                    classNamePrefix="react-select"
                  />
                </div>

                {!editMode && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Upload File *
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50">
                      <Upload
                        size={40}
                        className="text-slate-400 mx-auto mb-3"
                      />
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx"
                        className="text-sm text-slate-600"
                        required={!editMode}
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        Accepted formats: PDF, DOC, DOCX
                      </p>
                    </div>
                    {formData.file_name && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                        <FileText size={16} />
                        <span>Selected: {formData.file_name}</span>
                      </div>
                    )}
                  </div>
                )}

                {editMode && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Current File
                    </label>
                    <div className="p-3 bg-slate-100 rounded-md border border-slate-200">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <FileText size={16} />
                        <span>
                          {formData.file_name} (
                          {formatFileSize(formData.file_size)})
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Brief description of the syllabus content..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-vertical"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/30"
                >
                  {editMode ? "Update Syllabus" : "Upload Syllabus"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyllabusRepository;
