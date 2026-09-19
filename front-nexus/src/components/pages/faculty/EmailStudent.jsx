import React, { useState, useEffect } from "react";
import {
  Mail,
  Send,
  Users,
  User,
  Paperclip,
  X,
  Check,
  AlertCircle,
  FileText,
  Trash2,
  Eye,
} from "lucide-react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const EmailStudent = () => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sentEmails, setSentEmails] = useState([]);
  const [showSentEmails, setShowSentEmails] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);

  const [emailData, setEmailData] = useState({
    recipient_type: "individual",
    recipient_ids: [],
    section_id: "",
    course_id: "",
    subject: "",
    message: "",
    cc_self: true,
    priority: "normal",
  });

  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
    fetchStudents();
    fetchSections();
    fetchCourses();
    fetchSentEmails();
  }, []);

  const fetchStudents = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const response = await axios.get(
        `${API_BASE}/api/faculty/${userId}/students`
      );

      if (response.data.success) {
        setStudents(response.data.students);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchSections = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const response = await axios.get(
        `${API_BASE}/api/faculty/${userId}/sections`
      );

      if (response.data.success) {
        setSections(response.data.sections);
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const response = await axios.get(
        `${API_BASE}/api/faculty/${userId}/courses`
      );

      if (response.data.success) {
        setCourses(response.data.courses);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchSentEmails = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const response = await axios.get(
        `${API_BASE}/api/emails/sent/${userId}`
      );

      if (response.data.success) {
        setSentEmails(response.data.emails);
      }
    } catch (error) {
      console.error("Error fetching sent emails:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmailData({
      ...emailData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleStudentSelection = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userId = localStorage.getItem("userId");

      let recipients = [];
      if (emailData.recipient_type === "individual") {
        recipients = selectedStudents;
      }

      const payload = {
        ...emailData,
        recipient_ids: recipients,
        sender_id: userId,
      };

      const response = await axios.post(
        `${API_BASE}/api/emails/send`,
        payload
      );

      if (response.data.success) {
        alert("Email sent successfully!");
        resetForm();
        fetchSentEmails();
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmailData({
      recipient_type: "individual",
      recipient_ids: [],
      section_id: "",
      course_id: "",
      subject: "",
      message: "",
      cc_self: true,
      priority: "normal",
    });
    setSelectedStudents([]);
  };

  const getRecipientCount = () => {
    if (emailData.recipient_type === "individual") {
      return selectedStudents.length;
    } else if (emailData.recipient_type === "section" && emailData.section_id) {
      const section = sections.find((s) => s.id == emailData.section_id);
      return section?.student_count || 0;
    } else if (emailData.recipient_type === "course" && emailData.course_id) {
      const course = courses.find((c) => c.id == emailData.course_id);
      return course?.student_count || 0;
    } else if (emailData.recipient_type === "all") {
      return students.length;
    }
    return 0;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Mail className="w-8 h-8 mr-3 text-indigo-600" />
              Email Student
            </h1>
            <p className="text-gray-600 mt-2">
              Send emails to students and groups
            </p>
          </div>
          <button
            onClick={() => setShowSentEmails(!showSentEmails)}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 flex items-center gap-2 transition"
          >
            <FileText className="w-5 h-5" />
            {showSentEmails ? "Compose Email" : "Sent Emails"}
          </button>
        </div>
      </div>

      {showSentEmails ? (
        /* Sent Emails View */
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sent Emails</h2>
          <div className="space-y-4">
            {sentEmails.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No sent emails yet</p>
              </div>
            ) : (
              sentEmails.map((email) => (
                <div
                  key={email.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {email.subject}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${email.priority === "urgent"
                              ? "bg-red-100 text-red-800"
                              : email.priority === "high"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                        >
                          {email.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {email.message}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>To: {email.recipient_count} recipients</span>
                        <span>•</span>
                        <span>
                          {new Date(email.sent_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedEmail(email)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Compose Email Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Compose Email
            </h2>

            {/* Recipient Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send To *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setEmailData({ ...emailData, recipient_type: "individual" })
                  }
                  className={`p-4 border-2 rounded-lg text-center transition ${emailData.recipient_type === "individual"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-300 hover:border-indigo-300"
                    }`}
                >
                  <User className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
                  <span className="text-sm font-medium">Individual</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEmailData({ ...emailData, recipient_type: "section" })
                  }
                  className={`p-4 border-2 rounded-lg text-center transition ${emailData.recipient_type === "section"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-300 hover:border-indigo-300"
                    }`}
                >
                  <Users className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
                  <span className="text-sm font-medium">Section</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEmailData({ ...emailData, recipient_type: "course" })
                  }
                  className={`p-4 border-2 rounded-lg text-center transition ${emailData.recipient_type === "course"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-300 hover:border-indigo-300"
                    }`}
                >
                  <FileText className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
                  <span className="text-sm font-medium">Course</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEmailData({ ...emailData, recipient_type: "all" })
                  }
                  className={`p-4 border-2 rounded-lg text-center transition ${emailData.recipient_type === "all"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-300 hover:border-indigo-300"
                    }`}
                >
                  <Users className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
                  <span className="text-sm font-medium">All Students</span>
                </button>
              </div>
            </div>

            {/* Conditional Recipient Selection */}
            {emailData.recipient_type === "individual" && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Select Students *
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    {selectedStudents.length === students.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
                <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => handleStudentSelection(student.id)}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => { }}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {student.full_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {student.student_id} - {student.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {selectedStudents.length} student(s) selected
                </p>
              </div>
            )}

            {emailData.recipient_type === "section" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Section *
                </label>
                <select
                  name="section_id"
                  value={emailData.section_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Choose a section...</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.section_name} ({section.student_count} students)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {emailData.recipient_type === "course" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Course *
                </label>
                <select
                  name="course_id"
                  value={emailData.course_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Choose a course...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.course_name} ({course.student_count} students)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Email Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={emailData.priority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="cc_self"
                    id="cc_self"
                    checked={emailData.cc_self}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="cc_self"
                    className="ml-2 text-sm font-medium text-gray-700"
                  >
                    Send a copy to myself
                  </label>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                name="subject"
                value={emailData.subject}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter email subject"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                name="message"
                value={emailData.message}
                onChange={handleInputChange}
                required
                rows="10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Compose your email message..."
              />
            </div>

            {/* Recipient Summary */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-indigo-900">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">
                  This email will be sent to {getRecipientCount()} recipient(s)
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Clear
              </button>
              <button
                type="submit"
                disabled={loading || getRecipientCount() === 0}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                {loading ? "Sending..." : "Send Email"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* View Email Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedEmail.subject}
              </h2>
              <button
                onClick={() => setSelectedEmail(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-900">To:</span>{" "}
                  {selectedEmail.recipient_count} recipients
                </div>
                <div>
                  <span className="font-medium text-gray-900">Priority:</span>{" "}
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${selectedEmail.priority === "urgent"
                        ? "bg-red-100 text-red-800"
                        : selectedEmail.priority === "high"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                  >
                    {selectedEmail.priority}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-900">Sent:</span>{" "}
                  {new Date(selectedEmail.sent_at).toLocaleString()}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Message:</h3>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {selectedEmail.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailStudent;
