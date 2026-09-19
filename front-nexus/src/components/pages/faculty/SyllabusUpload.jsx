import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FileText,
  Upload,
  Search,
  Download,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  Calendar,
  X,
} from "lucide-react";

const SyllabusUpload = () => {
  const [loading, setLoading] = useState(false);
  const [syllabi, setSyllabi] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [file, setFile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    academicYear: "",
    semester: "",
  });

  useEffect(() => {
    fetchCourses();
    fetchSyllabi();
  }, []);

  const fetchCourses = async () => {
    // TODO: Replace with actual API
    setCourses([
      { id: 1, code: "CS101", name: "Introduction to Programming" },
      { id: 2, code: "CS102", name: "Data Structures" },
      { id: 3, code: "MATH201", name: "Calculus II" },
    ]);
  };

  const fetchSyllabi = async () => {
    // TODO: Replace with actual API
    setSyllabi([
      {
        id: 1,
        course: "CS101",
        title: "Introduction to Programming Syllabus",
        filename: "CS101_Syllabus_2024.pdf",
        uploadedDate: "2024-01-15",
        academicYear: "2023-2024",
        semester: "First Semester",
        size: "2.3 MB",
      },
      {
        id: 2,
        course: "MATH201",
        title: "Calculus II Course Outline",
        filename: "MATH201_Syllabus_2024.pdf",
        uploadedDate: "2024-01-10",
        academicYear: "2023-2024",
        semester: "First Semester",
        size: "1.8 MB",
      },
    ]);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        alert("Please select a PDF file");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !selectedCourse) {
      alert("Please select a course and upload a file");
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement actual file upload
      const formDataToSend = new FormData();
      formDataToSend.append("file", file);
      formDataToSend.append("courseId", selectedCourse);
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("academicYear", formData.academicYear);
      formDataToSend.append("semester", formData.semester);

      // await axios.post('/api/faculty/syllabus/upload', formDataToSend);

      alert("Syllabus uploaded successfully!");
      closeModal();
      fetchSyllabi();
    } catch (error) {
      console.error("Error uploading syllabus:", error);
      alert("Failed to upload syllabus");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this syllabus?")) {
      try {
        // await axios.delete(`/api/faculty/syllabus/${id}`);
        alert("Syllabus deleted successfully!");
        fetchSyllabi();
      } catch (error) {
        console.error("Error deleting syllabus:", error);
      }
    }
  };

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFile(null);
    setSelectedCourse("");
    setFormData({ title: "", description: "", academicYear: "", semester: "" });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FileText className="w-8 h-8 mr-3 text-indigo-600" />
            Syllabus Management
          </h1>
          <p className="text-gray-600 mt-2">Upload and manage course syllabi</p>
        </div>
        <button
          onClick={openModal}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center shadow-lg"
        >
          <Upload className="w-5 h-5 mr-2" />
          Upload New Syllabus
        </button>
      </div>

      {/* Uploaded Syllabi List */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <BookOpen className="w-6 h-6 mr-2 text-indigo-600" />
          Uploaded Syllabi
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Course
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Academic Year
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Uploaded
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Size
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {syllabi.map((syllabus) => (
                <tr
                  key={syllabus.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-4">
                    <span className="font-semibold text-indigo-600">
                      {syllabus.course}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {syllabus.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {syllabus.filename}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    <div>{syllabus.academicYear}</div>
                    <div className="text-xs text-gray-500">
                      {syllabus.semester}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {syllabus.uploadedDate}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {syllabus.size}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(syllabus.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {syllabi.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No syllabi uploaded yet</p>
              <button
                onClick={openModal}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Upload Your First Syllabus
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Upload className="w-6 h-6 mr-2 text-indigo-600" />
                Upload New Syllabus
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={loading}
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Course <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    >
                      <option value="">Choose a course...</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Academic Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.academicYear}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          academicYear: e.target.value,
                        })
                      }
                      placeholder="e.g., 2023-2024"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Semester <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.semester}
                      onChange={(e) =>
                        setFormData({ ...formData, semester: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select semester...</option>
                      <option value="First Semester">First Semester</option>
                      <option value="Second Semester">Second Semester</option>
                      <option value="Summer">Summer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Syllabus Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Enter syllabus title"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of the syllabus content..."
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File (PDF) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="w-full flex flex-col items-center px-4 py-6 bg-white border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        {file ? file.name : "Click to upload or drag and drop"}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        PDF files only (Max 10MB)
                      </span>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        required
                      />
                    </label>
                  </div>
                  {file && (
                    <div className="mt-2 flex items-center justify-between bg-indigo-50 px-4 py-2 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-indigo-600 mr-2" />
                        <span className="text-sm text-gray-700">
                          {file.name}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Syllabus
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyllabusUpload;
