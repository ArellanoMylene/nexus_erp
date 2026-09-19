import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { GraduationCap, Plus, Pencil, X } from "lucide-react";

const toDateInputValue = (value) => {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().split("T")[0];
  }

  const strValue = String(value);
  if (strValue.includes("T")) {
    return strValue.split("T")[0];
  }

  const parsed = new Date(strValue);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return strValue;
};

const resolveStoredStudentId = () => {
  const directUserId = localStorage.getItem("userId");
  if (directUserId) return directUserId;

  const userObj = localStorage.getItem("user");
  if (!userObj) return null;

  try {
    const parsedUser = JSON.parse(userObj);
    return parsedUser.user_id || parsedUser.userId || parsedUser.id || null;
  } catch (e) {
    console.error("Error parsing user object:", e);
    return null;
  }
};

const pickValue = (obj, ...keys) => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null) return value;
  }
  return "";
};

const normalizeAdmission = (admission) => {
  if (!admission) return null;

  return {
    ...admission,
    admission_id: pickValue(admission, "admission_id", "admissionId"),
    first_name: pickValue(admission, "first_name", "firstName"),
    middle_name: pickValue(admission, "middle_name", "middleName"),
    last_name: pickValue(admission, "last_name", "lastName"),
    email: pickValue(admission, "email"),
    phone: pickValue(admission, "phone"),
    date_of_birth: pickValue(admission, "date_of_birth", "dateOfBirth"),
    gender: pickValue(admission, "gender"),
    address: pickValue(admission, "address", "permanent_address", "permanentAddress"),
    previous_school: pickValue(admission, "previous_school", "previousSchool"),
    year_graduated: pickValue(admission, "year_graduated", "yearGraduated"),
    program_applied: pickValue(admission, "program_applied", "programApplied"),
    application_date: pickValue(admission, "application_date", "applicationDate"),
    entrance_exam_score: pickValue(admission, "entrance_exam_score", "entranceExamScore"),
    interview_date: pickValue(admission, "interview_date", "interviewDate"),
    interview_notes: pickValue(admission, "interview_notes", "interviewNotes"),
    documents_submitted: pickValue(admission, "documents_submitted", "documentsSubmitted"),
    status: pickValue(admission, "status") || "Pending",
    remarks: pickValue(admission, "remarks"),
  };
};

const formatAcademicPeriodLabel = (period) => {
  if (!period) return "";

  const schoolYear =
    period.school_year || period.academic_year || period.schoolYear || "";
  const semester = period.semester || period.term || "";

  if (schoolYear && semester) {
    return `${schoolYear} • ${semester}`;
  }

  return schoolYear || semester || "";
};

const StatusBadge = ({ status }) => {
  const colors = {
    Pending:
      "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md",
    "Under Review":
      "bg-gradient-to-r from-blue-400 to-indigo-400 text-white shadow-md",
    Accepted:
      "bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-md",
    Rejected: "bg-gradient-to-r from-red-400 to-pink-400 text-white shadow-md",
    Dropped: "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md",
    Enrolled:
      "bg-gradient-to-r from-purple-400 to-indigo-400 text-white shadow-md",
  };
  const icons = {
    Pending: "⏳",
    "Under Review": "👀",
    Accepted: "✅",
    Rejected: "❌",
    Dropped: "🛑",
    Enrolled: "🎓",
  };
  return (
    <span
      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
        colors[status] || colors.Pending
      }`}
    >
      <span>{icons[status] || icons.Pending}</span>
      {status}
    </span>
  );
};

const EnrollmentModal = ({ isOpen, onClose, onSubmit, mode, initialData }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    address: "",
    program_applied: "",
    application_date: new Date().toISOString().split("T")[0],
    status: "Pending",
    previous_school: "",
    year_graduated: "",
    entrance_exam_score: "",
    interview_date: "",
    interview_notes: "",
    documents_submitted: "",
  });
  const [studentProfile, setStudentProfile] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);

  const documentOptions = [
    { value: "Birth Certificate", label: "Birth Certificate" },
    { value: "High School Diploma", label: "High School Diploma" },
    { value: "Transcript", label: "Transcript" },
    { value: "ID Card", label: "ID Card" },
    { value: "Medical Certificate", label: "Medical Certificate" },
    { value: "NBI Clearance", label: "NBI Clearance" },
    { value: "Good Moral Certificate", label: "Good Moral Certificate" },
    { value: "NCAE Score", label: "NCAE Score" },
    { value: "Proof of Income", label: "Proof of Income" },
    { value: "Parent/Guardian ID", label: "Parent/Guardian ID" },
  ];

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const API_BASE =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
        const res = await axios.get(`${API_BASE}/api/programs`);
        console.log("Programs API response:", res.data);
        setPrograms(res.data);
      } catch (err) {
        console.error("Error fetching programs:", err);
      }
    };

    const fetchStudentProfile = async () => {
      try {
        const API_BASE =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
        const studentId = resolveStoredStudentId();

        if (studentId) {
          const res = await axios.get(`${API_BASE}/api/users/${studentId}`);
          setStudentProfile(res.data);
        }
      } catch (err) {
        console.error("Error fetching student profile:", err);
      }
    };

    if (isOpen) {
      fetchPrograms();
      fetchStudentProfile();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData || studentProfile) {
      const baseData = studentProfile
        ? {
            first_name: studentProfile.first_name || "",
            middle_name: studentProfile.middle_name || "",
            last_name: studentProfile.last_name || "",
            email: studentProfile.email || "",
            phone: studentProfile.phone || "",
            date_of_birth: toDateInputValue(
              studentProfile.date_of_birth || studentProfile.dateOfBirth,
            ),
            gender: studentProfile.gender || "",
            address:
              studentProfile.permanent_address || studentProfile.address || "",
            program_applied: "",
            application_date: new Date().toISOString().split("T")[0],
            status: "Pending",
            previous_school: studentProfile.previous_school || "",
            year_graduated:
              studentProfile.year_graduated ||
              studentProfile.yearGraduated ||
              "",
            entrance_exam_score: studentProfile.entrance_exam_score || "",
            interview_date: "",
            interview_notes: "",
            documents_submitted: "",
          }
        : {};

      const documentsArray = initialData?.documents_submitted
        ? initialData.documents_submitted
            .split(",")
            .map((doc) => ({
              value: doc.trim(),
              label: doc.trim(),
            }))
        : [];
      setSelectedDocuments(documentsArray);

      setFormData({
        ...baseData,
        ...(initialData && {
          admission_id: pickValue(initialData, "admission_id", "admissionId"),
          first_name:
            pickValue(initialData, "first_name", "firstName") ||
            baseData.first_name,
          middle_name:
            pickValue(initialData, "middle_name", "middleName") ||
            baseData.middle_name,
          last_name:
            pickValue(initialData, "last_name", "lastName") ||
            baseData.last_name,
          email: pickValue(initialData, "email") || baseData.email,
          phone: pickValue(initialData, "phone") || baseData.phone,
          date_of_birth: toDateInputValue(
            pickValue(initialData, "date_of_birth", "dateOfBirth") ||
              baseData.date_of_birth,
          ),
          gender: pickValue(initialData, "gender") || baseData.gender,
          address:
            pickValue(
              initialData,
              "address",
              "permanent_address",
              "permanentAddress",
            ) || baseData.address,
          program_applied:
            pickValue(initialData, "program_applied", "programApplied") ||
            baseData.program_applied,
          application_date: toDateInputValue(
            pickValue(initialData, "application_date", "applicationDate") ||
              baseData.application_date,
          ),
          status: pickValue(initialData, "status") || baseData.status,
          previous_school:
            pickValue(initialData, "previous_school", "previousSchool") ||
            baseData.previous_school,
          year_graduated:
            pickValue(initialData, "year_graduated", "yearGraduated") ||
            baseData.year_graduated,
          entrance_exam_score:
            pickValue(initialData, "entrance_exam_score", "entranceExamScore") ||
            baseData.entrance_exam_score,
          interview_date: toDateInputValue(
            pickValue(initialData, "interview_date", "interviewDate"),
          ),
          interview_notes:
            pickValue(initialData, "interview_notes", "interviewNotes") || "",
          documents_submitted:
            pickValue(initialData, "documents_submitted", "documentsSubmitted") ||
            "",
        }),
      });
    } else if (!initialData && !studentProfile) {
      setSelectedDocuments([]);
      setFormData({
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        phone: "",
        date_of_birth: "",
        gender: "",
        address: "",
        program_applied: "",
        application_date: new Date().toISOString().split("T")[0],
        status: "Pending",
        previous_school: "",
        year_graduated: "",
        entrance_exam_score: "",
        interview_date: "",
        interview_notes: "",
        documents_submitted: "",
      });
    }
  }, [initialData, studentProfile]);

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
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-transform duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b p-2.5 flex justify-between items-center z-10 rounded-t-xl">
          <h3 className="text-lg font-bold text-gray-800">
            {mode === "add"
              ? "New Admission Application"
              : mode === "edit"
                ? "Edit Admission Application"
                : "View Admission Application"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-3">
          <form onSubmit={handleSubmit} className="space-y-3 px-3 pb-3">
            {/* Student Information Section */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <h4 className="text-sm font-semibold mb-2 text-slate-700 uppercase tracking-wider">
                Student Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-0.5 text-slate-600">
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
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    disabled={true}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5 text-slate-600">
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
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={true}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5 text-slate-600">
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
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    disabled={true}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-xs font-medium mb-0.5 text-slate-600">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    disabled={true}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5 text-slate-600">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={true}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-xs font-medium mb-0.5 text-slate-600">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        date_of_birth: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={true}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5 text-slate-600">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        gender: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={true}
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="mt-2">
                <label className="block text-xs font-medium mb-0.5 text-slate-600">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={2}
                  disabled={true}
                />
              </div>
            </div>

            {/* Academic Information Section */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <h4 className="text-sm font-semibold mb-2 text-slate-700 uppercase tracking-wider">
                Academic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-0.5 text-slate-600">
                    Program Applied *
                  </label>
                  <select
                    value={formData.program_applied}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        program_applied: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    disabled={
                      mode === "view" || (mode === "edit" && initialData)
                    }
                  >
                    <option value="">Select Program...</option>
                    {programs.map((program) => (
                      <option
                        key={program.id || program.program_id}
                        value={program.name || program.program_name}
                      >
                        {program.code
                          ? `${program.code} - ${program.name || program.program_name}`
                          : program.name || program.program_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5 text-slate-600">
                    Application Date
                  </label>
                  <input
                    type="date"
                    value={formData.application_date}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        application_date: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={true}
                  />
                </div>
              </div>

              {/* Previous Education Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-xs font-medium mb-0.5 text-slate-600">
                    Previous School
                  </label>
                  <input
                    type="text"
                    value={formData.previous_school}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        previous_school: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g. SDS High School"
                    disabled={mode === "view"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5 text-slate-600">
                    Year Graduated
                  </label>
                  <input
                    type="text"
                    value={formData.year_graduated}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        year_graduated: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g. 2024"
                    disabled={mode === "view"}
                  />
                </div>
              </div>

           {/*    <div className="grid grid-cols-1 gap-2 mt-2">
                <div>
                  <label className="block text-xs font-medium mb-0.5 text-slate-600">
                    Entrance Exam Score
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.entrance_exam_score}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        entrance_exam_score: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g. 85.5"
                    disabled={mode === "view"}
                  />
                </div>
              </div> */}
            </div>

            {/* Interview Information */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <h4 className="text-sm font-semibold mb-2 text-slate-700 uppercase tracking-wider">
                Interview Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-0.5 text-slate-600">
                    Interview Date
                  </label>
                  <input
                    type="date"
                    value={formData.interview_date}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        interview_date: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={mode === "view"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5 text-slate-600">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={true}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Enrolled">Enrolled</option>
                  </select>
                </div>
              </div>
              <div className="mt-2">
                <label className="block text-xs font-medium mb-0.5 text-slate-600">
                  Interview Notes
                </label>
                <textarea
                  value={formData.interview_notes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      interview_notes: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={2}
                  disabled={mode === "view"}
                />
              </div>
            </div>

            {/* Documents Submitted */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <h4 className="text-sm font-semibold mb-2 text-slate-700 uppercase tracking-wider">
                Documents to Submit
              </h4>
              <Select
                isMulti
                options={documentOptions}
                value={selectedDocuments}
                onChange={(options) => {
                  setSelectedDocuments(options || []);
                  setFormData((prev) => ({
                    ...prev,
                    documents_submitted: options
                      ? options.map((opt) => opt.value).join(", ")
                      : "",
                  }));
                }}
                isDisabled={mode === "view"}
                placeholder="Select documents..."
                className="text-sm"
              />
            </div>

            {mode !== "view" && (
              <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 transition text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm font-medium"
                >
                  {mode === "add" ? "Submit Application" : "Update Application"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default function StudentEnrollment() {
  const [admission, setAdmission] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [loading, setLoading] = useState(true);
  const [academicPeriod, setAcademicPeriod] = useState(null);

  const enrolledPeriodLabel = formatAcademicPeriodLabel(academicPeriod);

  const fetchAdmissionData = async () => {
    try {
      const API_BASE =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

      const studentId = resolveStoredStudentId();

      if (studentId) {
        // Fetch the logged-in student profile so we can look up the matching admission.
        const userRes = await axios.get(`${API_BASE}/api/users/${studentId}`);

        // Fetch admission by user email.
        const userEmail = userRes.data.email;
        const res = await axios.get(
          `${API_BASE}/api/admissions?email=${userEmail}`,
        );

        if (res.data && res.data.length > 0) {
          setAdmission(normalizeAdmission(res.data[0]));
        } else {
          setAdmission(null);
        }
      } else {
        setAdmission(null);
      }
    } catch (err) {
      console.error("Error fetching admission:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveAcademicPeriod = async () => {
    try {
      const API_BASE =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      const res = await axios.get(`${API_BASE}/api/academic-periods/active`);
      setAcademicPeriod(res.data?.period || res.data || null);
    } catch (err) {
      console.error("Error fetching active academic period:", err);
    }
  };

  useEffect(() => {
    fetchAdmissionData();
    fetchActiveAcademicPeriod();
  }, []);

  // Auto-refresh admission status every 5 seconds.
  useEffect(() => {
    if (!admission) return;

    const interval = setInterval(() => {
      fetchAdmissionData();
    }, 5000);

    // Also refresh when page becomes visible (tab focus)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchAdmissionData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [admission]);

  const openModal = (mode) => {
    setModalMode(mode);
    setModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    try {
      const API_BASE =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

      if (modalMode === "add") {
        const res = await axios.post(`${API_BASE}/api/admissions`, formData);
        setAdmission(normalizeAdmission(res.data));
      } else if (modalMode === "edit") {
        const res = await axios.put(
          `${API_BASE}/api/admissions/${formData.admission_id}`,
          formData,
        );
        setAdmission(normalizeAdmission(res.data));
      }

      setModalOpen(false);

      // Refresh admission status after a short delay to see enrollment updates
      setTimeout(() => {
        fetchAdmissionData();
      }, 500);
    } catch (err) {
      console.error("Error submitting admission:", err);
      alert("Failed to submit application. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {!admission ? (
        <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 p-12 shadow-sm">
          <div className="bg-white rounded-full p-4 w-20 h-20 mx-auto mb-6 shadow-md">
            <GraduationCap size={48} className="mx-auto text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-3">
            No Admission Application Found
          </h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            You haven't submitted an admission application yet. Start your
            journey with us by completing your application below.
          </p>
          <button
            onClick={() => openModal("add")}
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-3 mx-auto shadow-md hover:shadow-lg"
          >
            <Plus size={20} /> Start Your Application
          </button>
          <p className="text-sm text-slate-500 mt-4">
            The application process typically takes 5-10 minutes to complete
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2H11z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Application Status
                </h2>
                <p className="text-sm text-slate-600">
                  Submitted on:{" "}
                  {admission.application_date
                    ? new Date(admission.application_date).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )
                    : "Not specified"}
                </p>
              </div>
              <div className="flex gap-2 items-start">
                <button
                  onClick={fetchAdmissionData}
                  className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Refresh status"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <StatusBadge status={admission.status} />
                {admission.status === "Pending" && (
                  <button
                    onClick={() => openModal("edit")}
                    className="text-indigo-600 hover:text-indigo-800 p-2 rounded-lg hover:bg-white/80 transition-colors"
                    title="Edit application"
                  >
                    <Pencil size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Application Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-slate-500">Program Applied</p>
                <p className="font-medium text-slate-700">
                  {admission.program_applied || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Previous School</p>
                <p className="font-medium text-slate-700">
                  {admission.previous_school || "Not specified"}
                </p>
              </div>
              {admission.entrance_exam_score && (
                <div>
                  <p className="text-sm text-slate-500">Entrance Exam Score</p>
                  <p className="font-medium text-slate-700">
                    {admission.entrance_exam_score}
                  </p>
                </div>
              )}
            </div>
          </div>

          {admission.status === "Pending" && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 shadow-sm">
              <p className="text-sm text-slate-600">
                Your application is currently under review. We'll notify you
                once there's an update.
              </p>
            </div>
          )}

          {admission.status === "Accepted" && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
              <p className="text-sm text-slate-600">
                Congratulations! Your admission has been approved. Please wait
                for the next enrollment instructions from the registrar.
              </p>
            </div>
          )}

          {admission.status === "Enrolled" && (
            <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 via-indigo-50 to-white p-6 shadow-sm">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-purple-700 ring-1 ring-purple-200">
                  <GraduationCap size={14} /> Enrollment Confirmed
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    You are enrolled to {enrolledPeriodLabel || "the current semester"}.
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm text-slate-600">
                    Your admission record is complete and tied directly to your student profile.
                  </p>
                </div>
              </div>
            </div>
          )}

          {admission.status === "Rejected" && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 shadow-sm">
              <p className="text-sm text-slate-600">
                Unfortunately, your application was not accepted at this time.
                {admission.remarks && ` Reason: ${admission.remarks}`}
              </p>
            </div>
          )}
        </div>
      )}

      <EnrollmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        mode={modalMode}
        initialData={admission}
      />
    </div>
  );
}
