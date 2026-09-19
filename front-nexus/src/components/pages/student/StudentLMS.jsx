import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  BookOpen,
  Play,
  FileText,
  Download,
  Clock,
  Eye,
  Upload,
  CheckCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  Send,
  MessageCircle,
  User,
  X,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const StudentLMS = () => {
  const [activeTab, setActiveTab] = useState("lessons");
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [academicPeriod, setAcademicPeriod] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(true);

  // Get student user from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const studentId = user?.user_id || user?.id;

  // Fetch active academic period on mount
  useEffect(() => {
    const fetchAcademicPeriod = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/api/academic-periods/active`,
        );
        // The response may have period directly or nested
        const periodData = response.data?.period || response.data;
        if (periodData) {
          setAcademicPeriod(periodData);
        }
      } catch (error) {
        console.error("Error fetching academic period:", error);
      }
    };
    fetchAcademicPeriod();
  }, []);

  // Get the academic period ID (could be 'id' or 'period_id' depending on API)
  const academicPeriodId = academicPeriod?.period_id || academicPeriod?.id;

  const fetchLessons = useCallback(async () => {
    try {
      // Fetch materials filtered by student's enrolled courses
      const response = await axios.get(
        `${API_BASE}/api/lms/materials/student`,
        {
          params: {
            student_id: studentId,
            academic_period_id: academicPeriodId,
          },
        },
      );
      const materials = response.data?.materials || response.data || [];
      const isEnrolledStatus = response.data?.isEnrolled !== false;
      setIsEnrolled(isEnrolledStatus);

      setLessons(
        materials.map((m) => ({
          lesson_id: m.id || m.material_id,
          title: m.title,
          description: m.description,
          subject_name: m.course_name || m.subject_name || "General",
          section_name: m.section_name,
          type: m.material_type || m.type || "document",
          duration: m.duration || "30 min",
          uploaded_at: m.created_at || m.uploaded_at,
          file_url: m.file_url,
          is_viewed: m.is_viewed,
          faculty_name: m.faculty_name,
        })),
      );
    } catch (error) {
      console.error("Error fetching lessons:", error);
    }
  }, [studentId, academicPeriodId]);

  const fetchAssignmentsAndQuizzes = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/lms/assignments/student`,
        {
          params: {
            student_id: studentId,
            academic_period_id: academicPeriodId,
          },
        },
      );

      // Handle different possible response formats
      let allItems = response.data?.data || response.data?.assignments || response.data || [];
      // Ensure it's an array
      if (!Array.isArray(allItems)) {
        console.warn("LMS assignments response is not an array:", allItems);
        allItems = [];
      }

      console.log("Raw LMS Assignments Response:", allItems);

      // Filter Assignments (type 'assignment')
      const assignmentsData = allItems
        .filter((item) => item.assignment_type === "assignment")
        .map((a) => ({
          assignment_id: a.id || a.assignment_id,
          title: a.title,
          description: a.description,
          instructions: a.instructions || a.instruction || "",
          model_answer_file_url: a.model_answer_file_url || a.model_answer_file || "",
          subject_name: a.course_name || a.course_code,
          section_name: a.section_name,
          faculty_name: a.faculty_name,
          status:
            a.submission_score !== null
              ? "graded"
              : a.submission_status ||
              (new Date(a.due_date) < new Date() ? "missing" : "pending"),
          due_date: a.due_date,
          score: a.submission_score,
          total_points: a.total_points,
          submitted_at: a.submitted_at,
          posted_at: a.created_at || a.posted_at,
          feedback: a.feedback,
          max_score: a.total_points, // Ensure max_score is mapped
          graded_by_name: a.graded_by_name,
          graded_at: a.graded_at,
          file_url: a.file_url || a.model_answer_file_url || "",
          file_name: a.file_name || a.model_answer_file_name || "",
        }));
      setAssignments(assignmentsData);

      // Filter Quizzes (type 'quiz' or 'exam')
      const quizzesData = allItems
        .filter(
          (item) =>
            item.assignment_type === "quiz" || item.assignment_type === "exam",
        )
        .map((q) => ({
          quiz_id: q.id || q.assignment_id, // ID is from lms_assignments table
          title: q.title,
          description: q.description,
          subject_name: q.course_name || q.course_code,
          section_name: q.section_name,
          faculty_name: q.faculty_name,
          status:
            q.submission_score !== null
              ? "completed" // Quizzes usually use 'completed' or 'graded', let's stick to 'completed' for quizzes based on existing usage or 'graded' if that's what triggers the score view.
              : q.submission_status ||
              (new Date(q.due_date) < new Date() ? "missing" : "pending"),
          due_date: q.due_date,
          time_limit: 30, // Default as it's not in the main table query yet (would need join or separate column)
          total_questions: 0, // Placeholder
          score: q.submission_score,
          total_points: q.total_points,
          max_score: q.total_points,
          submitted_at: q.submitted_at,
          quiz_answers: q.submission_text,
        }));
      setQuizzes(quizzesData);
    } catch (error) {
      console.error("Error fetching assignments/quizzes:", error);
    }
  }, [studentId, academicPeriodId]);

  const [discussionReplies, setDiscussionReplies] = useState([]);

  // Fetch replies when a discussion is selected
  useEffect(() => {
    if (selectedDiscussion) {
      fetchDiscussionReplies(selectedDiscussion.id);
    }
  }, [selectedDiscussion]);

  const fetchDiscussionReplies = async (discussionId) => {
    try {
      const response = await axios.get(`${API_BASE}/api/lms/discussions/${discussionId}/replies`);
      setDiscussionReplies(response.data?.replies || []);
    } catch (error) {
      console.error("Error fetching replies:", error);
    }
  };

  const getLessonFileUrl = (fileUrl) => {
    if (!fileUrl) return "";
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
      return fileUrl;
    }
    return `${API_BASE}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
  };

  const getFileNameFromUrl = (fileUrl, fallbackName) => {
    if (!fileUrl) return fallbackName;

    try {
      const urlPath = fileUrl.split("?")[0].split("#")[0];
      const segments = urlPath.split("/").filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      return lastSegment || fallbackName;
    } catch {
      return fallbackName;
    }
  };

  const handleLessonDownload = async (lesson) => {
    const resolvedUrl = getLessonFileUrl(lesson.file_url);
    if (!resolvedUrl) return;

    try {
      const link = document.createElement("a");
      link.href = resolvedUrl;
      link.download = getFileNameFromUrl(
        lesson.file_url,
        `${lesson.title || "lesson-file"}`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading lesson file:", error);
      window.open(resolvedUrl, "_blank", "noopener,noreferrer");
    }
  };



  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [isReviewMode, setIsReviewMode] = useState(false);

  const handleTakeQuiz = async (quiz) => {
    setIsReviewMode(false);
    try {
      // Fetch questions
      const response = await axios.get(`${API_BASE}/api/lms/assignments/${quiz.quiz_id}/quiz-questions`);
      const questions = response.data?.questions || [];

      if (questions.length === 0) {
        alert("This quiz has no questions yet.");
        return;
      }

      setQuizQuestions(questions);
      setQuizAnswers({});
      setSelectedQuiz(quiz);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      alert("Failed to load quiz.");
    }
  };

  const handleQuizSubmit = async () => {
    if (!selectedQuiz) return;

    // Calculate total points for display (score is calculated by backend)
    let totalPoints = 0;
    quizQuestions.forEach(q => {
      totalPoints += q.points || 1;
    });

    try {
      const submissionPayload = {
        student_id: studentId,
        assignment_id: selectedQuiz.quiz_id,
        submission_text: JSON.stringify(quizAnswers),
        file_name: "quiz_results.json",
        file_url: "", // No file
      };

      const submitRes = await axios.post(`${API_BASE}/api/lms/assignments/submit`, submissionPayload);
      const { score } = submitRes.data;

      if (score !== undefined) {
        alert(`Quiz submitted! Your score: ${score}/${totalPoints}`);
      } else {
        alert("Quiz submitted successfully!");
      }

      setSelectedQuiz(null);
      setQuizQuestions([]);
      setQuizAnswers({});
      fetchAssignmentsAndQuizzes();
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to submit quiz.");
    }
  };

  const handleViewQuizResults = async (quiz) => {
    setIsReviewMode(true);
    try {
      // Fetch questions WITH answers (secure review endpoint)
      const response = await axios.get(`${API_BASE}/api/lms/assignments/${quiz.quiz_id}/quiz-review`, {
        params: { student_id: studentId }
      });
      const questions = response.data?.questions || [];

      if (questions.length === 0) {
        alert("Unable to load quiz results.");
        return;
      }

      setQuizQuestions(questions);
      // Parse saved answers
      const answers = JSON.parse(quiz.quiz_answers || "{}");
      setQuizAnswers(answers);
      setSelectedQuiz(quiz);
    } catch (error) {
      console.error("Error fetching quiz results:", error);
      alert("Failed to load quiz results. Ensure you have submitted the quiz.");
    }
  };






  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!submissionFile || !selectedAssignment || isSubmittingAssignment) return;

    setIsSubmittingAssignment(true);

    // Use FileReader to read the file as Base64
    const reader = new FileReader();
    reader.readAsDataURL(submissionFile);

    reader.onload = async () => {
      try {
        const fileBase64 = reader.result;

        // 1. Upload the file to the backend
        // Note: In a production app, we might want to show a loading state here
        const uploadResponse = await axios.post(`${API_BASE}/api/lms/assignments/upload`, {
          file_base64: fileBase64,
          file_name: submissionFile.name
        });

        if (!uploadResponse.data.success) {
          throw new Error(uploadResponse.data.message || "File upload failed");
        }

        const fileUrl = uploadResponse.data.file_url;

        // 2. Submit the assignment with the real file_url
        const payload = {
          student_id: studentId,
          assignment_id: selectedAssignment.assignment_id,
          file_name: submissionFile.name,
          file_url: fileUrl, // Real URL from backend
          submission_text: "Assignment submitted via Student Portal",
        };

        await axios.post(`${API_BASE}/api/lms/assignments/submit`, payload, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        alert("Assignment submitted successfully!");
        setSelectedAssignment(null);
        setSubmissionFile(null);
        fetchAssignmentsAndQuizzes(); // Refresh list
      } catch (error) {
        console.error("Error submitting assignment:", error);
        alert(`Failed to submit assignment: ${error.message || "Unknown error"}`);
      } finally {
        setIsSubmittingAssignment(false);
      }
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      alert("Failed to read file for upload");
      setIsSubmittingAssignment(false);
    };
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !selectedDiscussion) return;

    try {
      await axios.post(`${API_BASE}/api/lms/discussions/replies`, {
        discussion_id: selectedDiscussion.id,
        user_id: studentId, // Backend controller expects user_id
        content: replyContent,
        author_name: user.full_name || "Student",
        author_role: "Student",
      });

      setReplyContent("");
      fetchDiscussionReplies(selectedDiscussion.id); // Refresh replies
      // Update global discussion list to reflect new reply count if needed
      fetchDiscussions();
    } catch (error) {
      console.error("Error submitting reply:", error);
      alert("Failed to submit reply");
    }
  };

  const fetchDiscussions = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/lms/discussions/student`,
        {
          params: {
            student_id: studentId,
            academic_period_id: academicPeriodId,
          },
        },
      );
      const discussionsData = response.data?.discussions || response.data || [];
      setDiscussions(discussionsData);
    } catch (error) {
      console.error("Error fetching discussions:", error);
    }
  }, [studentId, academicPeriodId]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (activeTab === "lessons") {
        await fetchLessons();
      } else if (activeTab === "quizzes" || activeTab === "assignments") {
        await fetchAssignmentsAndQuizzes();
      } else if (activeTab === "discussions") {
        await fetchDiscussions();
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, fetchLessons, fetchAssignmentsAndQuizzes, fetchDiscussions]);

  useEffect(() => {
    if (studentId && academicPeriodId) {
      fetchData();
    }
  }, [fetchData, studentId, academicPeriodId]);

  const groupedLessons = lessons.reduce((acc, lesson) => {
    const subject = lesson.subject_name || "General";
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(lesson);
    return acc;
  }, {});

  const getStatusColor = (status) => {
    const colors = {
      completed:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      pending:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      missed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      submitted:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      late: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      graded:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    };
    return colors[status] || colors.pending;
  };

  const tabs = [
    { id: "lessons", label: "View Lessons", icon: BookOpen },
    { id: "quizzes", label: "Quizzes", icon: FileText },
    { id: "assignments", label: "Assignments", icon: FileText },
    { id: "discussions", label: "Discussions", icon: MessageCircle },
  ];

  return (
    <div className="dark:bg-slate-900 px-4 py-3 transition-colors duration-500">
      <div className="w-full space-y-2 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen size={24} className="text-indigo-600" />
            Learning Management System
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Online Learning Platform
          </span>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8 text-slate-500 dark:text-slate-400">
            Loading LMS content...
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-0 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Lessons Tab */}
        {activeTab === "lessons" && (
          <div className="space-y-4">
            {Object.entries(groupedLessons).length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
                <BookOpen size={48} className="mx-auto text-slate-400 mb-3" />
                <p className="text-slate-500 dark:text-slate-400">
                  {isEnrolled
                    ? "No learning materials available yet"
                    : "You are not enrolled in any courses for this academic period"}
                </p>
              </div>
            ) : (
              Object.entries(groupedLessons).map(
                ([subject, subjectLessons]) => (
                  <div
                    key={subject}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
                  >
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                      {subject}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {subjectLessons.map((lesson) => (
                        <div
                          key={lesson.lesson_id}
                          className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {lesson.type === "video" ? (
                                <Play size={18} className="text-indigo-600" />
                              ) : (
                                <FileText
                                  size={18}
                                  className="text-indigo-600"
                                />
                              )}
                              <h4 className="font-semibold text-slate-900 dark:text-white">
                                {lesson.title}
                              </h4>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                            {lesson.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {lesson.duration || "30 min"}
                            </span>
                            <span>
                              {new Date(
                                lesson.uploaded_at,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedLesson(lesson)}
                              className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors"
                            >
                              <Eye size={14} />
                              View
                            </button>
                            {lesson.file_url && (
                              <button
                                onClick={() => handleLessonDownload(lesson)}
                                className="flex items-center justify-center gap-1 bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors"
                                title="Download lesson file"
                              >
                                <Download size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              )
            )}
          </div>
        )}

        {/* Quizzes Tab */}
        {activeTab === "quizzes" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {quizzes.length === 0 ? (
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
                <FileText size={48} className="mx-auto text-slate-400 mb-3" />
                <p className="text-slate-500 dark:text-slate-400">
                  No quizzes available
                </p>
              </div>
            ) : (
              quizzes.map((quiz) => (
                <div
                  key={quiz.quiz_id}
                  className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {quiz.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {quiz.subject_name}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${getStatusColor(quiz.status)}`}
                    >
                      {quiz.status}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {quiz.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon size={16} className="text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Due Date
                        </p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {new Date(quiz.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={16} className="text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Time Limit
                        </p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {quiz.time_limit || "30"} mins
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText size={16} className="text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Questions
                        </p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {quiz.total_questions || 20}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle size={16} className="text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Score
                        </p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {quiz.score
                            ? `${quiz.score}/${quiz.max_score}`
                            : "Not taken"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {quiz.status === "pending" && (
                    <button
                      onClick={() => handleTakeQuiz(quiz)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
                    >
                      Take Quiz
                    </button>
                  )}
                  {quiz.status === "completed" && (
                    <button
                      onClick={() => handleViewQuizResults(quiz)}
                      className="w-full bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
                    >
                      View Results
                    </button>
                  )}
                  {quiz.status === "missed" && (
                    <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 text-sm">
                      <AlertCircle size={16} />
                      Quiz deadline has passed
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === "assignments" && (
          <div className="space-y-3">
            {assignments.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
                <FileText size={48} className="mx-auto text-slate-400 mb-3" />
                <p className="text-slate-500 dark:text-slate-400">
                  No assignments available
                </p>
              </div>
            ) : (
              assignments.map((assignment) => (
                <div
                  key={assignment.assignment_id}
                  className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {assignment.title}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {assignment.subject_name}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full font-medium ${getStatusColor(assignment.status)}`}
                        >
                          {assignment.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        {assignment.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <CalendarIcon size={16} className="text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Due Date
                            </p>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {new Date(
                                assignment.due_date,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Posted
                            </p>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {new Date(
                                assignment.posted_at,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {assignment.score !== null && (
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-slate-400" />
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Score
                              </p>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {assignment.score}/{assignment.max_score}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex lg:flex-col gap-2">
                      {assignment.status === "pending" && (
                        <button
                          onClick={() => setSelectedAssignment(assignment)}
                          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors whitespace-nowrap"
                        >
                          <Upload size={14} />
                          Submit
                        </button>
                      )}
                      {assignment.status === "submitted" && (
                        <button
                          onClick={() => setSelectedAssignment(assignment)}
                          className="flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors whitespace-nowrap"
                        >
                          <FileText size={14} />
                          View Submission
                        </button>
                      )}
                      {assignment.status === "graded" && (
                        <button
                          onClick={() => setSelectedAssignment(assignment)}
                          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors whitespace-nowrap"
                        >
                          <CheckCircle size={14} />
                          View Grade
                        </button>
                      )}
                      {assignment.status === "late" && (
                        <div className="flex items-center justify-center gap-2 text-orange-600 dark:text-orange-400 text-sm px-4 py-2">
                          <AlertCircle size={16} />
                          Late Submission
                        </div>
                      )}
                    </div>
                  </div>

                  {assignment.submitted_at && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Submitted on{" "}
                        {new Date(assignment.submitted_at).toLocaleString()}
                      </p>
                      {assignment.feedback && (
                        <div className="mt-2 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md border border-slate-100 dark:border-slate-700">
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            <strong>Feedback:</strong> {assignment.feedback}
                          </p>
                        </div>
                      )}

                      {assignment.graded_by_name && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <span>
                            Graded by: <span className="font-medium text-slate-700 dark:text-slate-200">{assignment.graded_by_name}</span>
                          </span>
                          {assignment.graded_at && (
                            <span>
                              on: <span className="font-medium text-slate-700 dark:text-slate-200">{new Date(assignment.graded_at).toLocaleString()}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Discussions Tab */}
        {activeTab === "discussions" && (
          <div className="space-y-4">
            {discussions.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
                <MessageCircle
                  size={48}
                  className="mx-auto text-slate-400 mb-3"
                />
                <p className="text-slate-500 dark:text-slate-400">
                  No discussions available
                </p>
              </div>
            ) : (
              discussions.map((discussion) => (
                <div
                  key={discussion.id}
                  className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {discussion.is_pinned && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
                            Pin
                          </span>
                        )}
                        <h3 className="font-semibold text-xl text-slate-900 dark:text-white">
                          {discussion.title}
                        </h3>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                        {discussion.course_name} - {discussion.section_name}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          {discussion.author_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(discussion.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                    {discussion.content}
                  </p>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-4">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <MessageCircle size={16} />
                      <span className="text-sm">
                        {discussion.reply_count || 0} replies
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedDiscussion(discussion)}
                      className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                    >
                      View Discussion →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {/* Lesson View Modal */}
        {selectedLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {selectedLesson.type === "video" ? (
                    <Play size={24} className="text-indigo-600" />
                  ) : (
                    <FileText size={24} className="text-indigo-600" />
                  )}
                  {selectedLesson.title}
                </h3>
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                  <p className="text-slate-700 dark:text-slate-300">
                    {selectedLesson.description}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      {selectedLesson.faculty_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(selectedLesson.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center min-h-[300px]">
                  {selectedLesson.type === "video" && selectedLesson.file_url ? (
                    <video
                      controls
                      className="w-full h-full max-h-[600px]"
                      src={selectedLesson.file_url}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : selectedLesson.type === "image" &&
                    selectedLesson.file_url ? (
                    <img
                      src={selectedLesson.file_url}
                      alt={selectedLesson.title}
                      className="max-w-full max-h-[600px] object-contain"
                    />
                  ) : (
                    <div className="text-center p-8">
                      <FileText
                        size={64}
                        className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
                      />
                      <p className="text-slate-600 dark:text-slate-400 mb-4">
                        This content cannot be previewed directly.
                      </p>
                      {selectedLesson.file_url && (
                        <a
                          href={selectedLesson.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                          <Download size={18} />
                          Download / View File
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Submission Modal */}
        {selectedAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedAssignment.status === "submitted" || selectedAssignment.status === "graded"
                    ? "Submission Details"
                    : "Submit Assignment"}
                </h3>
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Common Details */}
                <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {selectedAssignment.title}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {selectedAssignment.description}
                  </p>
                  {selectedAssignment.instructions && (
                    <div className="mt-2 p-2 bg-white dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">Instructions</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{selectedAssignment.instructions}</p>
                    </div>
                  )}
                  {selectedAssignment.file_url && (
                    <div className="mt-3 p-2 bg-white dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">Attached File</p>
                      <a
                        href={selectedAssignment.file_url.startsWith("http") ? selectedAssignment.file_url : `${API_BASE}${selectedAssignment.file_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {selectedAssignment.file_name || "View Attachment"}
                      </a>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2">
                    <span className="flex items-center gap-1">
                      <CalendarIcon size={12} />
                      Due: {new Date(selectedAssignment.due_date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={12} />
                      Max Score: {selectedAssignment.max_score}
                    </span>
                  </div>
                </div>

                {/* View Mode (Submitted/Graded) */}
                {(selectedAssignment.status === "submitted" || selectedAssignment.status === "graded") ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <CheckCircle size={16} className="text-indigo-600" />
                        Your Submission
                      </h4>
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                          Submitted on {new Date(selectedAssignment.submitted_at).toLocaleString()}
                        </p>
                        {/* Attachment shown in common details above */}
                      </div>
                    </div>

                    {/* Grade & Feedback Section */}
                    {selectedAssignment.status === "graded" && (
                      <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-green-800 dark:text-green-400 flex items-center gap-2">
                            <CheckCircle size={18} />
                            Graded
                          </h4>
                          <span className="text-lg font-bold text-green-700 dark:text-green-300">
                            {selectedAssignment.score} <span className="text-sm font-normal text-green-600 dark:text-green-400">/ {selectedAssignment.max_score}</span>
                          </span>
                        </div>

                        {selectedAssignment.feedback && (
                          <div className="bg-white/60 dark:bg-black/20 p-3 rounded border border-green-100 dark:border-green-800/50">
                            <p className="text-xs font-semibold text-green-800 dark:text-green-400 mb-1 uppercase tracking-wider">Feedback</p>
                            <p className="text-sm text-green-900 dark:text-green-100">
                              {selectedAssignment.feedback}
                            </p>
                          </div>
                        )}

                        {selectedAssignment.graded_by_name && (
                          <div className="text-xs text-green-700 dark:text-green-400 pt-2 border-t border-green-200 dark:border-green-800 flex flex-wrap gap-2">
                            <span>Graded by: <strong>{selectedAssignment.graded_by_name}</strong></span>
                            {selectedAssignment.graded_at && (
                              <span>on {new Date(selectedAssignment.graded_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => setSelectedAssignment(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Submit Mode (Pending/Late) */
                  <form onSubmit={handleAssignmentSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Upload File
                      </label>
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors bg-slate-50 dark:bg-slate-900/20">
                        <input
                          type="file"
                          id="file-upload"
                          onChange={(e) => setSubmissionFile(e.target.files[0])}
                          required
                          className="hidden"
                        />
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <Upload size={32} className="text-slate-400" />
                          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                            Click to upload a file
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {submissionFile ? submissionFile.name : "PDF, DOCX, ZIP up to 10MB"}
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200 flex items-center gap-1">
                        <AlertCircle size={14} />
                        Ensure your file is final before submitting. You cannot edit after submission.
                      </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedAssignment(null)}
                        disabled={isSubmittingAssignment}
                        className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingAssignment}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <Upload size={16} />
                        {isSubmittingAssignment ? "Submitting" : "Submit Assignment"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Discussion View Modal */}
        {selectedDiscussion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageCircle size={20} className="text-indigo-600" />
                  Discussion Thread
                </h3>
                <button
                  onClick={() => setSelectedDiscussion(null)}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Original Post */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">
                      {selectedDiscussion.title}
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(selectedDiscussion.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 mb-3 whitespace-pre-wrap">
                    {selectedDiscussion.content}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                    <User size={14} />
                    {selectedDiscussion.author_name}
                  </div>
                </div>

                {/* Replies */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                    Replies ({discussionReplies.length})
                  </h4>
                  {discussionReplies.length === 0 ? (
                    <p className="text-center text-slate-500 dark:text-slate-400 py-4">
                      No replies yet. Be the first to reply!
                    </p>
                  ) : (
                    discussionReplies.map((reply) => (
                      <div key={reply.id} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-slate-900 dark:text-white text-sm flex items-center gap-2">
                            <User size={14} />
                            {reply.author_name}
                            <span className="text-xs font-normal text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                              {reply.author_role}
                            </span>
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(reply.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">
                          {reply.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Reply Form */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <form onSubmit={handleReplySubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!replyContent.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Send size={18} />
                    <span className="hidden sm:inline">Reply</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
        {/* Quiz Modal */}
        {selectedQuiz && quizQuestions.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock size={20} className="text-indigo-600" />
                  {selectedQuiz.title}
                </h3>
                <button
                  onClick={() => setSelectedQuiz(null)}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {quizQuestions.map((q, index) => (
                  <div key={q.id} className="space-y-3">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {index + 1}. {q.question_text} <span className="text-xs text-slate-500">({q.points} pts)</span>
                    </p>
                    <div className="space-y-2 ml-4">
                      {q.options && q.options.map((option, optIndex) => (
                        <label key={optIndex} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            value={option}
                            checked={quizAnswers[q.id] === option}
                            onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: option })}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedQuiz(null)}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuizSubmit}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                >
                  Submit Quiz
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quiz Modal */}
      {selectedQuiz && quizQuestions.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedQuiz.title}
                </h2>
                {isReviewMode && (
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400 mt-1">
                    Results: {selectedQuiz.score}/{selectedQuiz.total_points}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedQuiz(null);
                  setIsReviewMode(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {quizQuestions.map((q, index) => (
                <div key={q.id || index} className="space-y-3">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {index + 1}. {q.question_text}{" "}
                    <span className="text-sm font-normal text-slate-500">
                      ({q.points} pts)
                    </span>
                  </p>
                  <div className="space-y-2">
                    {isReviewMode ? (
                      <div className="space-y-2">
                        {/* Student Answer */}
                        <div className={`p-3 rounded-lg border flex items-center gap-3 ${quizAnswers[q.id] === q.correct_answer
                            ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
                            : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
                          }`}>
                          {quizAnswers[q.id] === q.correct_answer ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <X className="w-5 h-5 flex-shrink-0" />}
                          <span className="font-medium">
                            {quizAnswers[q.id] || "No Answer"}
                          </span>
                          <span className="text-sm opacity-75 ml-auto">
                            {quizAnswers[q.id] === q.correct_answer ? "(Correct)" : "(Your Answer)"}
                          </span>
                        </div>

                        {/* Correct Answer (only if wrong) */}
                        {quizAnswers[q.id] !== q.correct_answer && (
                          <div className="p-3 rounded-lg border flex items-center gap-3 bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium">
                              {q.correct_answer}
                            </span>
                            <span className="text-sm opacity-75 ml-auto">(Correct Answer)</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      q.options.map((option, optIdx) => (
                        <label
                          key={optIdx}
                          onClick={() => {
                            if (!isReviewMode) {
                              setQuizAnswers(prev => ({
                                ...prev,
                                [q.id]: option
                              }));
                            }
                          }}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${quizAnswers[q.id] === option
                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                            } cursor-pointer`}
                        >
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            value={option}
                            checked={quizAnswers[q.id] === option}
                            onChange={() => { }} // Handled by label onClick
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 transition-transform duration-200 transform scale-100 active:scale-95"
                          />
                          <span className="text-slate-700 dark:text-slate-300">
                            {option}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-800">
              <button
                onClick={() => {
                  setSelectedQuiz(null);
                  setIsReviewMode(false);
                }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              {!isReviewMode && (
                <button
                  onClick={handleQuizSubmit}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLMS;
