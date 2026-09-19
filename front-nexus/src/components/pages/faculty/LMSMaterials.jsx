import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Upload,
  FileText,
  Video,
  Link as LinkIcon,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  X,
  File,
  Image as ImageIcon,
  Music,
  Search,
  Filter,
} from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getCurrentAcademicPeriodId = async () => {
  try {
    const response = await axios.get(`${API_BASE}/api/academic-periods/active`);
    const periodData = response.data?.period || response.data;
    return periodData?.period_id || periodData?.id || "";
  } catch (error) {
    console.error("Error fetching active academic period:", error);
    return "";
  }
};

const LMSMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [academicPeriods, setAcademicPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    material_type: "document",
    file_url: "",
    file_name: "",
    file_size: "",
    section_id: "",
    course_id: "",
    academic_period_id: "",
  });

  const fetchAcademicPeriods = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/academic-periods`);
      const periods = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      setAcademicPeriods(periods);
    } catch (error) {
      console.error("Error fetching academic periods:", error);
    }
  }, []);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      const academicPeriodId = await getCurrentAcademicPeriodId();

      const response = await axios.get(
        `${API_BASE}/api/lms/materials/faculty`,
        {
          params: {
            faculty_id: userId,
            academic_period_id: academicPeriodId,
          },
        },
      );

      if (response.data.success) {
        setMaterials(response.data.materials);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    try {
      const userId = localStorage.getItem("userId");
      const response = await axios.get(
        `${API_BASE}/api/faculty-assignments/faculty/${userId}`,
      );
      if (response.data.success) {
        setAssignments(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  }, []);

  useEffect(() => {
    fetchAcademicPeriods();
    fetchMaterials();
    fetchAssignments();
  }, [fetchAcademicPeriods, fetchMaterials, fetchAssignments]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (formData.material_type === "link") {
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          setUploadingFile(true);
          const response = await axios.post(
            `${API_BASE}/api/lms/materials/upload`,
            {
              file_base64: event.target.result,
              file_name: file.name,
            },
          );

          if (response.data.success) {
            setFormData({
              ...formData,
              file_name: file.name,
              file_size: (file.size / 1024).toFixed(2) + " KB",
              file_url: response.data.file_url,
            });
          } else {
            toast.error(response.data.message || "Failed to upload file");
          }
        } catch (error) {
          console.error("Error uploading material file:", error);
          toast.error("Failed to upload file");
        } finally {
          setUploadingFile(false);
        }
      };

      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.academic_period_id) {
      toast.warn("Please select an academic period.");
      return;
    }

    if (formData.material_type !== "link" && !formData.file_url) {
      toast.warn("Please upload a file first.");
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem("userId");

      const materialData = {
        ...formData,
        faculty_id: userId,
        academic_period_id: formData.academic_period_id,
      };

      const response = await axios.post(
        `${API_BASE}/api/lms/materials`,
        materialData,
      );

      if (response.data.success) {
        toast.success("Material uploaded successfully!");
        setShowUploadModal(false);
        resetForm();
        fetchMaterials();
      }
    } catch (error) {
      console.error("Error uploading material:", error);
      toast.error("Failed to upload material");
    } finally {
      setLoading(false);
    }
  };

  // Does the actual delete call — split out from the confirmation step below.
  const performDelete = async (id) => {
    try {
      const response = await axios.delete(
        `${API_BASE}/api/lms/materials/${id}`,
      );

      if (response.data.success) {
        toast.success("Material deleted successfully!");
        fetchMaterials();
      }
    } catch (error) {
      console.error("Error deleting material:", error);
      toast.error("Failed to delete material");
    }
  };

  // Replaces window.confirm(...) with an in-app toast that has its own
const confirmDelete = (id) => {
  toast(
    ({ closeToast }) => (
      <div>
        <p className="font-medium text-gray-800 mb-3">
          Are you sure you want to delete this material?
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={closeToast}
            className="px-4 py-1.5 text-sm rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              closeToast();
              performDelete(id);
            }}
            className="px-4 py-1.5 text-sm rounded-full bg-red-600 text-white hover:bg-red-700 transition"
          >
            OK
          </button>
        </div>
      </div>
    ),
    {
      containerId: "confirmDialog",
      autoClose: false,
      closeOnClick: false,
      closeButton: false,
      draggable: false,
    },
  );
};

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      material_type: "document",
      file_url: "",
      file_name: "",
      file_size: "",
      section_id: "",
      course_id: "",
      academic_period_id: "",
    });
  };

  const getFileIcon = (type) => {
    switch (type) {
      case "document":
        return <FileText className="w-6 h-6 text-blue-500" />;
      case "video":
        return <Video className="w-6 h-6 text-red-500" />;
      case "link":
        return <LinkIcon className="w-6 h-6 text-green-500" />;
      case "image":
        return <ImageIcon className="w-6 h-6 text-purple-500" />;
      case "audio":
        return <Music className="w-6 h-6 text-yellow-500" />;
      default:
        return <File className="w-6 h-6 text-gray-500" />;
    }
  };

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.course_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterType === "all" || material.material_type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Renders the toast.success/toast.error/toast.warn notifications used
          throughout this component. If a <ToastContainer /> is already
          mounted higher up (e.g. App.jsx), remove this one to avoid a
          duplicate. */}
      <ToastContainer position="top-center" autoClose={3000} />
      <ToastContainer
        containerId="confirmDialog"
        className="confirm-toast-container"
        position="top-center"
      />

      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BookOpen className="w-8 h-8 mr-3 text-indigo-600" />
              Upload Learning Materials
            </h1>
            <p className="text-gray-600 mt-2">
              Share educational resources with your students
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" />
            Upload Material
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="document">Documents</option>
              <option value="video">Videos</option>
              <option value="link">Links</option>
              <option value="image">Images</option>
              <option value="audio">Audio</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <div
              key={material.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getFileIcon(material.material_type)}
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {material.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {material.course_name} - {material.section_name}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {material.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {material.view_count || 0} views
                  </span>
                  <span className="text-xs">
                    {new Date(material.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedMaterial(material);
                      setShowViewModal(true);
                    }}
                    className="flex-1 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-100 flex items-center justify-center gap-2 transition"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                 <button
  onClick={() => confirmDelete(material.id)}
  className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition"
>
  <Trash2 className="w-4 h-4" />
</button>
                </div>
              </div>
            </div>
          ))}

          {filteredMaterials.length === 0 && (
            <div className="col-span-full text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No materials found</p>
            </div>
          )}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0  flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Upload Learning Material
              </h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material Type *
                </label>
                <select
                  name="material_type"
                  value={formData.material_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="document">Document</option>
                  <option value="video">Video</option>
                  <option value="link">Link</option>
                  <option value="image">Image</option>
                  <option value="audio">Audio</option>
                </select>
              </div>

              {formData.material_type === "link" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL *
                  </label>
                  <input
                    type="url"
                    name="file_url"
                    value={formData.file_url}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className={`cursor-pointer text-indigo-600 hover:text-indigo-700 ${uploadingFile ? "pointer-events-none opacity-60" : ""}`}
                    >
                      {uploadingFile ? "Uploading file..." : "Click to upload or drag and drop"}
                    </label>
                    {formData.file_name && (
                      <p className="text-sm text-gray-600 mt-2">
                        {formData.file_name} ({formData.file_size})
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course *
                  </label>
                  <select
                    name="course_id"
                    value={formData.course_id}
                    onChange={(e) => {
                      handleInputChange(e);
                      setFormData((prev) => ({ ...prev, section_id: "" }));
                    }}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Course</option>
                    {[
                      ...new Map(
                        assignments.map((item) => [item.course_id, item]),
                      ).values(),
                    ].map((assignment) => (
                      <option
                        key={assignment.course_id}
                        value={assignment.course_id}
                      >
                        {assignment.course_code} - {assignment.course_title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section *
                  </label>
                  <select
                    name="section_id"
                    value={formData.section_id}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.course_id}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                  >
                    <option value="">Select Section</option>
                    {assignments
                      .filter(
                        (a) => a.course_id === parseInt(formData.course_id),
                      )
                      .map((assignment) => (
                        <option
                          key={assignment.section_id}
                          value={assignment.section_id}
                        >
                          {assignment.section}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Period *
                </label>
                <select
                  name="academic_period_id"
                  value={formData.academic_period_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Academic Period</option>
                  {academicPeriods.map((period) => {
                    const periodId = period.period_id || period.id;
                    return (
                      <option key={periodId} value={periodId}>
                        {period.school_year} - {period.semester}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingFile}
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
                >
                  {uploadingFile ? "Uploading file..." : loading ? "Uploading..." : "Upload Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedMaterial && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedMaterial.title}
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                {getFileIcon(selectedMaterial.material_type)}
                <div>
                  <p className="text-gray-600">
                    {selectedMaterial.course_name} - {selectedMaterial.section_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Uploaded on {new Date(selectedMaterial.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{selectedMaterial.description}</p>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {selectedMaterial.view_count || 0} views
                </span>
                <span>File: {selectedMaterial.file_name}</span>
              </div>

              {selectedMaterial.file_url && (
                <a
                  href={selectedMaterial.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
                >
                  <Download className="w-5 h-5" />
                  Download / View File
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LMSMaterials;