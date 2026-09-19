import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Calendar,
  Award,
  Search,
  Filter,
  X,
  Download,
  Upload,
  Sparkles,
  FileUp,
} from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DocumentViewer from "../../shared/DocumentViewer.jsx";

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

const LMSAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [facultyAssignments, setFacultyAssignments] = useState([]);
  const [academicPeriods, setAcademicPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState("active");

  // Document import state (for quiz question import)
  const [importingDoc, setImportingDoc] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Model answer file state
  const [modelAnswerFile, setModelAnswerFile] = useState(null);
  const [modelAnswerFileName, setModelAnswerFileName] = useState("");
  const [uploadingModelAnswer, setUploadingModelAnswer] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignment_type: "assignment",
    total_points: 100,
    due_date: "",
    instructions: "",
    model_answer: "",
    allow_late_submission: false,
    section_id: "",
    course_id: "",
    academic_period_id: "",
  });

  const [questions, setQuestions] = useState([]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        question_text: "",
        question_type: "multiple_choice",
        points: 5,
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        correct_answer: "Option 1",
      },
    ]);
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (questionId, optionIndex, value) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return q;
      })
    );
  };

  // Handle quiz question import from PDF/DOCX
  const handleDocumentImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingDoc(true);
    setImportResult(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64 = event.target.result;
          const response = await axios.post(
            `${API_BASE}/api/lms/assignments/parse-quiz-document`,
            { file_base64: base64, file_name: file.name }
          );

          if (response.data.success && response.data.questions.length > 0) {
            const imported = response.data.questions.map((q) => ({
              id: Date.now() + Math.random(),
              question_text: q.question_text || "",
              question_type: "multiple_choice",
              points: q.points || 1,
              options:
                q.options?.length >= 4
                  ? q.options.slice(0, 4)
                  : [
                      ...(q.options || []),
                      ...Array(4 - (q.options?.length || 0)).fill(""),
                    ],
              correct_answer: q.correct_answer || q.options?.[0] || "",
            }));

            setQuestions((prev) => [...prev, ...imported]);
            setImportResult({ count: imported.length, fileName: file.name });
          } else {
            toast.warn(
              response.data.message ||
                "No questions found in the document. Please check the format."
            );
          }
        } catch (err) {
          toast.error(
            err.response?.data?.message ||
              "Failed to parse document. Please check the file format."
          );
        } finally {
          setImportingDoc(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setImportingDoc(false);
    }

    e.target.value = "";
  };

  // Handle model answer file selection
  const handleModelAnswerFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setModelAnswerFile(file);
    setModelAnswerFileName(file.name);
    e.target.value = "";
  };

  const clearModelAnswerFile = () => {
    setModelAnswerFile(null);
    setModelAnswerFileName("");
  };

  const [gradeData, setGradeData] = useState({
    score: 0,
    feedback: "",
  });

  const [aiChecking, setAiChecking] = useState(false);
  const [aiModelAnswer, setAiModelAnswer] = useState("");

  // AI grade modal: model answer file
  const [aiModelAnswerFile, setAiModelAnswerFile] = useState(null);
  const [aiModelAnswerFileName, setAiModelAnswerFileName] = useState("");

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

  const fetchFacultyAssignments = useCallback(async () => {
    try {
      const userId = localStorage.getItem("userId");
      const response = await axios.get(
        `${API_BASE}/api/faculty-assignments/faculty/${userId}`
      );
      if (response.data.success) {
        setFacultyAssignments(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching faculty assignments:", error);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      const academicPeriodId = await getCurrentAcademicPeriodId();

      const response = await axios.get(
        `${API_BASE}/api/lms/assignments/faculty`,
        {
          params: {
            faculty_id: userId,
            academic_period_id: academicPeriodId,
          },
        }
      );

      if (response.data.success) {
        setAssignments(response.data.assignments);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAcademicPeriods();
    fetchAssignments();
    fetchFacultyAssignments();
  }, [fetchAcademicPeriods, fetchAssignments, fetchFacultyAssignments]);

  const fetchSubmissions = async (assignmentId) => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/lms/assignments/${assignmentId}/submissions`
      );
      if (response.data.success) {
        setSubmissions(response.data.submissions);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  const openGradeModal = (submission) => {
    setSelectedSubmission(submission);
    setGradeData({
      score: submission.score ?? 0,
      feedback: submission.feedback || "",
    });
    setAiModelAnswer(selectedAssignment?.model_answer || "");
    setAiModelAnswerFile(null);
    setAiModelAnswerFileName("");
    setShowGradeModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.academic_period_id) {
      toast.warn("Please select an academic period.");
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem("userId");
      const academicPeriodId = formData.academic_period_id;

      let modelAnswerFileUrl = null;

      // Upload model answer file if provided
      if (modelAnswerFile) {
        setUploadingModelAnswer(true);
        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(modelAnswerFile);
        });

        const uploadRes = await axios.post(
          `${API_BASE}/api/lms/assignments/upload`,
          {
            file_base64: base64,
            file_name: modelAnswerFile.name,
          }
        );

        if (uploadRes.data.success) {
          modelAnswerFileUrl = uploadRes.data.file_url;
        }
        setUploadingModelAnswer(false);
      }

      const assignmentData = {
        ...formData,
        faculty_id: userId,
        academic_period_id: academicPeriodId,
        model_answer_file_url: modelAnswerFileUrl,
      };

      const response = await axios.post(
        `${API_BASE}/api/lms/assignments`,
        assignmentData
      );

      if (response.data.success) {
        const newAssignmentId = response.data.assignmentId;

        if (formData.assignment_type === "quiz" && questions.length > 0) {
          for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            await axios.post(`${API_BASE}/api/lms/assignments/quiz-question`, {
              assignment_id: newAssignmentId,
              question_text: q.question_text,
              question_type: q.question_type,
              options: q.options,
              correct_answer: q.correct_answer,
              points: q.points,
              order_num: i + 1,
            });
          }
        }

        toast.success("Assignment created successfully!");
        setShowCreateModal(false);
        resetForm();
        fetchAssignments();
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error("Failed to create assignment");
    } finally {
      setLoading(false);
      setUploadingModelAnswer(false);
    }
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();

    try {
      const submissionId =
        selectedSubmission?.id ?? selectedSubmission?.submission_id;
      if (!submissionId) {
        toast.warn("Submission not found.");
        return;
      }

      const userId = localStorage.getItem("userId");

      const response = await axios.put(
        `${API_BASE}/api/lms/assignments/submissions/${submissionId}/grade`,
        {
          ...gradeData,
          graded_by: userId,
        }
      );

      if (response.data.success) {
        toast.success("Submission graded successfully!");
        setShowGradeModal(false);
        fetchSubmissions(selectedAssignment.id);
      }
    } catch (error) {
      console.error("Error grading submission:", error);
      toast.error("Failed to grade submission");
    }
  };

  // Does the actual delete call — split out from the confirmation step below.
  const performDelete = async (id) => {
    try {
      const response = await axios.delete(
        `${API_BASE}/api/lms/assignments/${id}`
      );

      if (response.data.success) {
        toast.success("Assignment deleted successfully!");
        fetchAssignments();
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("Failed to delete assignment");
    }
  };

  // Replaces window.confirm(...) with an in-app toast that has its own
  // OK / Cancel buttons, rendered in a dedicated centered container.
  const confirmDelete = (id) => {
    toast(
      ({ closeToast }) => (
        <div>
          <p className="font-medium text-gray-800 mb-3">
            Are you sure you want to delete this assignment?
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

  const handleAiCheck = async () => {
    if (!aiModelAnswer.trim() && !aiModelAnswerFile) {
      toast.warn(
        "Please enter a model answer or upload a PDF/DOCX before running the AI check."
      );
      return;
    }

    setAiChecking(true);
    try {
      const submissionId =
        selectedSubmission?.id ?? selectedSubmission?.submission_id;
      const assignmentId =
        selectedAssignment?.id ?? selectedAssignment?.assignment_id;
      if (!submissionId) {
        toast.warn("Submission not found.");
        return;
      }

      let modelAnswerFileUrl = null;

      // Upload the AI model answer file if provided
      if (aiModelAnswerFile) {
        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(aiModelAnswerFile);
        });

        const uploadRes = await axios.post(
          `${API_BASE}/api/lms/assignments/upload`,
          {
            file_base64: base64,
            file_name: aiModelAnswerFile.name,
          }
        );

        if (uploadRes.data.success) {
          modelAnswerFileUrl = uploadRes.data.file_url;
        }
      }

      const response = await axios.post(
        `${API_BASE}/api/lms/assignments/submissions/${submissionId}/ai-check`,
        {
          model_answer: aiModelAnswer,
          model_answer_file_url: modelAnswerFileUrl,
          assignment_id: assignmentId,
          student_id: selectedSubmission?.student_id,
        }
      );

      if (response.data.success) {
        setGradeData({
          score: response.data.score,
          feedback: response.data.feedback,
        });
      } else {
        toast.warn(
          response.data.message || "AI check failed. Please grade manually."
        );
      }
    } catch (error) {
      console.error("AI check error:", error);
      toast.error(
        error.response?.data?.message ||
          "AI check failed. Please try again or grade manually."
      );
    } finally {
      setAiChecking(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      assignment_type: "assignment",
      total_points: 100,
      due_date: "",
      instructions: "",
      model_answer: "",
      allow_late_submission: false,
      section_id: "",
      course_id: "",
      academic_period_id: "",
    });
    setQuestions([]);
    setImportResult(null);
    setModelAnswerFile(null);
    setModelAnswerFileName("");
  };

  const getStatusBadge = (assignment) => {
    const dueDate = new Date(assignment.due_date);
    const now = new Date();

    if (assignment.status === "closed") {
      return (
        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm flex items-center gap-1">
          <XCircle className="w-4 h-4" />
          Closed
        </span>
      );
    } else if (dueDate < now) {
      return (
        <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm flex items-center gap-1">
          <Clock className="w-4 h-4" />
          Overdue
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          Active
        </span>
      );
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.course_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterType === "all" || assignment.assignment_type === filterType;

    const dueDate = new Date(assignment.due_date);
    const now = new Date();
    const isActive = dueDate >= now && assignment.status === "active";
    const isPast = dueDate < now || assignment.status === "closed";

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && isActive) ||
      (activeTab === "past" && isPast);

    return matchesSearch && matchesFilter && matchesTab;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Renders the toast.success/toast.error/toast.warn notifications used
          throughout this component. */}
      <ToastContainer position="top-center" autoClose={3000} />
      {/* Dedicated, centered container used only for the delete confirmation
          dialog (see confirmDelete). Kept separate so its CSS overrides
          don't affect the regular top-center notifications above. */}
      <ToastContainer
        containerId="confirmDialog"
        className="confirm-toast-container"
        position="top-center"
      />

      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileText className="w-8 h-8 mr-3 text-indigo-600" />
              Assignments & Quizzes
            </h1>
            <p className="text-gray-600 mt-2">
              Create and manage assignments and quizzes
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" />
            Create Assignment
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b">
        {["all", "active", "past"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-4 font-medium transition capitalize ${
              activeTab === tab
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab === "past"
              ? "Past Due"
              : tab === "all"
              ? "All Assignments"
              : "Active"}
          </button>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search assignments..."
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
              <option value="assignment">Assignments</option>
              <option value="quiz">Quizzes</option>
             
            </select>
          </div>
        </div>
      </div>

      {/* Assignments Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {assignment.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {assignment.course_name} - {assignment.section_name}
                    </p>
                    {getStatusBadge(assignment)}
                  </div>
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded-full">
                    {assignment.assignment_type}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {assignment.description}
                </p>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Award className="w-4 h-4" />
                    Points: {assignment.total_points}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    Submissions: {assignment.submission_count || 0} /{" "}
                    {assignment.graded_count || 0} graded
                  </div>
                  {/* Show model answer file indicator */}
                  {assignment.model_answer_file_url && (
                    <div className="flex items-center gap-2 text-indigo-600">
                      <FileUp className="w-4 h-4" />
                      <span className="text-xs">Model answer file attached</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      fetchSubmissions(assignment.id);
                      setShowSubmissionsModal(true);
                    }}
                    className="flex-1 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-100 flex items-center justify-center gap-2 transition text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    View Submissions
                  </button>
                  <button
                    onClick={() => confirmDelete(assignment.id)}
                    className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredAssignments.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No assignments found</p>
            </div>
          )}
        </div>
      )}

      {/* ── Create Assignment Modal ─────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Create Assignment/Quiz
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
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
                  Instructions
                </label>
                <textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* ── Model / Expected Answer (non-quiz only) ─────────────────── */}
              {formData.assignment_type !== "quiz" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model / Expected Answer
                    <span className="ml-2 text-xs text-indigo-500 font-normal">
                      (Used by AI checker when grading student submissions)
                    </span>
                  </label>

                  {/* Text answer */}
                  <textarea
                    name="model_answer"
                    value={formData.model_answer}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Type your expected answer here, or upload a PDF/DOCX below…"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />

                  {/* File upload option */}
                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <label
                      className={`cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition
                        ${
                          modelAnswerFileName
                            ? "bg-green-50 border-green-300 text-green-700"
                            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                      <FileUp className="w-4 h-4" />
                      {modelAnswerFileName
                        ? modelAnswerFileName
                        : "Upload PDF/DOCX as model answer"}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleModelAnswerFileChange}
                      />
                    </label>

                    {modelAnswerFileName && (
                      <button
                        type="button"
                        onClick={clearModelAnswerFile}
                        className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition"
                      >
                        <X className="w-3 h-3" />
                        Remove file
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mt-1">
                    You can provide text, a file, or both. The AI will use the
                    file content if uploaded.
                  </p>
                </div>
              )}
              {/* ── End Model Answer ────────────────────────────────────────── */}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    name="assignment_type"
                    value={formData.assignment_type}
                    onChange={(e) => {
                      handleInputChange(e);
                      if (e.target.value !== "quiz") setImportResult(null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="assignment">Assignment</option>
                    <option value="quiz">Quiz</option>
                    <option value="exam">Exam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Points *
                  </label>
                  <input
                    type="number"
                    name="total_points"
                    value={formData.total_points}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="datetime-local"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

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
                        facultyAssignments.map((item) => [item.course_id, item])
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
                    {facultyAssignments
                      .filter(
                        (a) => a.course_id === parseInt(formData.course_id)
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

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="allow_late_submission"
                  checked={formData.allow_late_submission}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label className="text-sm text-gray-700">
                  Allow late submissions
                </label>
              </div>

              {/* ── Quiz Questions Section ──────────────────────────────────── */}
              {formData.assignment_type === "quiz" && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Quiz Questions
                    </label>
                    <div className="flex items-center gap-2">
                      <label
                        className={`cursor-pointer text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition
                          ${
                            importingDoc
                              ? "bg-purple-50 text-purple-400 border-purple-200 cursor-not-allowed"
                              : "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"
                          }`}
                      >
                        <Upload className="w-4 h-4" />
                        {importingDoc ? "Importing…" : "Import PDF/DOCX"}
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          disabled={importingDoc}
                          onChange={handleDocumentImport}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={addQuestion}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition"
                      >
                        <Plus className="w-4 h-4" /> Add Question
                      </button>
                    </div>
                  </div>

                  {importResult && (
                    <div className="mb-4 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                      <div className="flex items-center gap-2 text-green-700 text-sm">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span>
                          <strong>{importResult.count}</strong> question
                          {importResult.count !== 1 ? "s" : ""} imported from{" "}
                          <span className="font-medium">
                            {importResult.fileName}
                          </span>
                          . Review and edit below before saving.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setImportResult(null)}
                        className="text-green-500 hover:text-green-700 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <details className="mb-4 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">
                    <summary className="px-3 py-2 cursor-pointer font-medium text-gray-600 select-none">
                      📄 Supported document format (click to expand)
                    </summary>
                    <div className="px-3 pb-3 pt-1 space-y-1 font-mono leading-relaxed">
                      <p className="not-italic text-gray-500 mb-2 font-sans">
                        Your PDF or DOCX should follow one of these patterns:
                      </p>
                      <pre className="whitespace-pre-wrap text-gray-700 bg-white border border-gray-200 rounded p-2">
{`1. What is the capital of France?
A. London
B. Paris
C. Berlin
D. Madrid
Answer: B

2) Which planet is closest to the sun?
A) Earth   B) Venus   C) Mercury   D) Mars
Ans: C`}
                      </pre>
                      <p className="not-italic text-gray-500 font-sans pt-1">
                        Supported answer labels:{" "}
                        <code>Answer:</code> <code>Ans:</code>{" "}
                        <code>Correct:</code> <code>Key:</code>
                      </p>
                    </div>
                  </details>

                  <div className="space-y-6">
                    {questions.map((q, index) => (
                      <div
                        key={q.id}
                        className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative"
                      >
                        <button
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <div className="grid gap-3">
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Question {index + 1}
                              </label>
                              <input
                                type="text"
                                value={q.question_text}
                                onChange={(e) =>
                                  updateQuestion(
                                    q.id,
                                    "question_text",
                                    e.target.value
                                  )
                                }
                                placeholder="Enter question text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                required
                              />
                            </div>
                            <div className="w-24">
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Points
                              </label>
                              <input
                                type="number"
                                value={q.points}
                                onChange={(e) =>
                                  updateQuestion(
                                    q.id,
                                    "points",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                min="1"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-500">
                              Options
                            </label>
                            {q.options.map((option, optIdx) => (
                              <div
                                key={optIdx}
                                className="flex items-center gap-2"
                              >
                                <span className="text-xs text-gray-400 w-4">
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) =>
                                    updateOption(q.id, optIdx, e.target.value)
                                  }
                                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                  placeholder={`Option ${optIdx + 1}`}
                                  required
                                />
                              </div>
                            ))}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Correct Answer
                            </label>
                            <select
                              value={q.correct_answer}
                              onChange={(e) =>
                                updateQuestion(
                                  q.id,
                                  "correct_answer",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                              {q.options.map((opt, i) => (
                                <option key={i} value={opt}>
                                  {opt || `Option ${i + 1}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}

                    {questions.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 font-medium">
                          No questions yet
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Import from a PDF/DOCX file or add questions manually
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 text-right text-sm text-gray-600">
                    Total Logic Points:{" "}
                    <span className="font-bold">
                      {questions.reduce((sum, q) => sum + (q.points || 0), 0)}
                    </span>{" "}
                    (Make sure this matches Total Points above)
                  </div>
                </div>
              )}
              {/* ── End Quiz Questions Section ─────────────────────────────── */}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingModelAnswer}
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
                >
                  {uploadingModelAnswer
                    ? "Uploading model answer…"
                    : loading
                    ? "Creating..."
                    : "Create Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Submissions Modal ───────────────────────────────────────────────── */}
      {showSubmissionsModal && selectedAssignment && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedAssignment.title}
                </h2>
                <p className="text-sm text-gray-600">Submissions</p>
              </div>
              <button
                onClick={() => setShowSubmissionsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {submissions.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No submissions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {submission.student_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {submission.student_id} • {submission.email}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Submitted:{" "}
                            {new Date(submission.submitted_at).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            submission.status === "graded"
                              ? "bg-green-100 text-green-600"
                              : "bg-yellow-100 text-yellow-600"
                          }`}
                        >
                          {submission.status}
                        </span>
                      </div>

                      {submission.submission_text && (
                        <p className="text-gray-600 text-sm mb-3">
                          {submission.submission_text}
                        </p>
                      )}

                      {submission.file_url && (
                        <div className="flex gap-2 mb-3">
                          <button
                            onClick={() => {
                              setViewingDocument({
                                fileUrl: submission.file_url,
                                fileName: submission.file_name,
                              });
                              setShowDocumentViewer(true);
                            }}
                            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100 transition"
                          >
                            <Eye className="w-4 h-4" />
                            View Document
                          </button>
                          <a
                            href={submission.file_url}
                            download
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-700 text-sm bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200 transition"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                          <span className="text-xs text-gray-500 self-center">
                            {submission.file_name}
                          </span>
                        </div>
                      )}

                      {submission.status === "graded" ? (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900">
                              Score: {submission.score} /{" "}
                              {selectedAssignment.total_points}
                            </span>
                            <span className="text-sm text-gray-600">
                              Graded on:{" "}
                              {new Date(
                                submission.graded_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          {submission.feedback && (
                            <p className="text-sm text-gray-700">
                              Feedback: {submission.feedback}
                            </p>
                          )}
                          <button
                            onClick={() => openGradeModal(submission)}
                            className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm flex items-center gap-2"
                          >
                            <Award className="w-4 h-4" />
                            Override Grade
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openGradeModal(submission)}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm flex items-center gap-2"
                        >
                          <Award className="w-4 h-4" />
                          Grade Submission
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Grade Submission Modal ──────────────────────────────────────────── */}
      {showGradeModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Grade Submission
              </h2>
              <button
                onClick={() => setShowGradeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleGradeSubmission} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Student: {selectedSubmission.student_name}
                </p>
              </div>

              {/* AI-Assisted Checker Section */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-semibold text-indigo-700">
                    AI-Assisted Checker
                  </span>
                </div>
                <p className="text-xs text-indigo-600">
                  Provide the expected answer as text, a PDF/DOCX file, or both.
                  The AI will compare it against the student&apos;s submission.
                </p>

                {/* Text model answer */}
                <textarea
                  value={aiModelAnswer}
                  onChange={(e) => setAiModelAnswer(e.target.value)}
                  rows="3"
                  placeholder="Paste your model / expected answer here…"
                  className="w-full px-3 py-2 border border-indigo-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                />

                {/* ── File upload for model answer inside AI checker ── */}
                <div className="flex items-center gap-3 flex-wrap">
                  <label
                    className={`cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition
                      ${
                        aiModelAnswerFileName
                          ? "bg-green-50 border-green-300 text-green-700"
                          : "bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                      }`}
                  >
                    <FileUp className="w-4 h-4" />
                    {aiModelAnswerFileName
                      ? aiModelAnswerFileName
                      : "Upload PDF/DOCX as model answer"}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setAiModelAnswerFile(file);
                        setAiModelAnswerFileName(file.name);
                        e.target.value = "";
                      }}
                    />
                  </label>

                  {aiModelAnswerFileName && (
                    <button
                      type="button"
                      onClick={() => {
                        setAiModelAnswerFile(null);
                        setAiModelAnswerFileName("");
                      }}
                      className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition"
                    >
                      <X className="w-3 h-3" />
                      Remove file
                    </button>
                  )}
                </div>
                {/* ── End file upload ─────────────────────────────────────── */}

                <button
                  type="button"
                  onClick={handleAiCheck}
                  disabled={aiChecking}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm flex items-center justify-center gap-2 disabled:bg-indigo-300"
                >
                  <Sparkles className="w-4 h-4" />
                  {aiChecking ? "Checking with AI..." : "Run AI Check"}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Score (out of {selectedAssignment.total_points}) *
                </label>
                <input
                  type="number"
                  value={gradeData.score}
                  onChange={(e) =>
                    setGradeData({ ...gradeData, score: e.target.value })
                  }
                  required
                  min="0"
                  max={selectedAssignment.total_points}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback
                </label>
                <textarea
                  value={gradeData.feedback}
                  onChange={(e) =>
                    setGradeData({ ...gradeData, feedback: e.target.value })
                  }
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Optional feedback for the student..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowGradeModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
                >
                  Submit Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Document Viewer Modal ───────────────────────────────────────────── */}
      {showDocumentViewer && viewingDocument && (
        <DocumentViewer
          fileUrl={viewingDocument.fileUrl}
          fileName={viewingDocument.fileName}
          onClose={() => {
            setShowDocumentViewer(false);
            setViewingDocument(null);
          }}
        />
      )}
    </div>
  );
};

export default LMSAssignments;