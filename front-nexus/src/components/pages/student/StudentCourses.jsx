import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import api from "../../../api/axios"; // authenticated instance (adds Bearer token) — needed for endpoints that require auth, e.g. /api/invoices
import {
  BookOpen,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  AlertCircle,
  Info,
  Download,
  Printer,
  FileText,
  GraduationCap,
  ArrowRight,
  X,
} from "lucide-react";
import { exportRegistrationFormPDF } from "../../../utils/exportRegistrationForm";
import { exportTimetablePDF } from "../../../utils/exportTimetable";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Map day abbreviations to full day names
const parseDayAbbreviations = (dayString) => {
  if (!dayString) return [];

  const dayMap = {
    M: "Monday",
    T: "Tuesday",
    W: "Wednesday",
    TH: "Thursday",
    F: "Friday",
    S: "Saturday",
  };

  const days = [];
  let i = 0;
  while (i < dayString.length) {
    if (dayString.substring(i, i + 2) === "TH") {
      days.push(dayMap["TH"]);
      i += 2;
    } else {
      const char = dayString[i];
      if (dayMap[char]) {
        days.push(dayMap[char]);
      }
      i += 1;
    }
  }

  return days;
};

const isDroppedStatus = (status) => {
  return String(status || "").trim().toLowerCase() === "dropped";
};

const isActiveEnrollment = (enrollment) => {
  return !isDroppedStatus(enrollment?.status);
};

const formatTime = (timeString) => {
  if (!timeString) return "";

  const [hours, minutes] = timeString.split(":").slice(0, 2);
  const hour = parseInt(hours, 10);
  const minute = minutes || "00";

  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${ampm}`;
};

const StudentCourses = () => {
  const [activeTab, setActiveTab] = useState("enlistment");

  // Enlistment state
  const [enrolledSubjects, setEnrolledSubjects] = useState([]);
  const [droppedEnrollments, setDroppedEnrollments] = useState([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Period/registration-form metadata (captured from the student's own
  // active enrollments so the Download button can build the PDF)
  const [periodMeta, setPeriodMeta] = useState(null);
  const [downloadingForm, setDownloadingForm] = useState(false);

  // Timetable state
  const [timetable, setTimetable] = useState([]);
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [downloadingTimetable, setDownloadingTimetable] = useState(false);

  const fetchEnrollmentStatus = useCallback(async () => {
    try {
      const studentId = localStorage.getItem("userId");
      if (!studentId) return;
      const response = await axios.get(
        `${API_BASE}/api/enrollments/student/${studentId}`,
      );
      const enrollments = (response.data || []).filter(isActiveEnrollment);
      setEnrollmentStatus({
        isOpen: true,
        message: "Enrollment is currently open",
        maxUnits: 24,
        currentUnits: enrollments.reduce((sum, e) => sum + (e.units || 0), 0),
      });
    } catch (error) {
      console.error("Error fetching enrollment status:", error);
    }
  }, []);

  const fetchEnlistmentData = useCallback(async () => {
    try {
      const studentId = localStorage.getItem("userId");
      if (!studentId) return;
      const enrolledRes = await axios.get(
        `${API_BASE}/api/enrollments/student/${studentId}`,
      );
      const enrollments = enrolledRes.data || [];
      console.log("📚 Enrolled data from API:", enrollments);

      const activeEnrollments = enrollments.filter(isActiveEnrollment);
      const dropped = enrollments.filter((enrollment) =>
        isDroppedStatus(enrollment.status),
      );

      setDroppedEnrollments(dropped);

      // Capture period/registration metadata for the registration-form PDF.
      // exportRegistrationFormPDF only needs one enrollment row's
      // student_id/period_id — it fetches all of that student's subjects
      // for the period itself.
      //
      // NOTE: activeEnrollments[0].student_id is the *actual* student_id
      // used by the invoices table. It is NOT guaranteed to be the same
      // value as localStorage's "userId" (which is the logged-in user's
      // account id). Always prefer activeEnrollments[0].student_id here.
      setPeriodMeta(
        activeEnrollments.length > 0
          ? {
              student_id:
                activeEnrollments[0].student_id || studentId,
              period_id: activeEnrollments[0].period_id,
              school_year: activeEnrollments[0].school_year,
              semester: activeEnrollments[0].semester,
              enrollment_date: activeEnrollments[0].enrollment_date,
              year_level: activeEnrollments[0].year_level,
            }
          : null,
      );

      setEnrolledSubjects(
        activeEnrollments.map((enrollment) => {
          let schedule = "TBA";

          if (
            Array.isArray(enrollment.schedules) &&
            enrollment.schedules.length > 0
          ) {
            schedule = enrollment.schedules
              .map(
                (s) =>
                  `${s.schedule_day || ""} ${formatTime(s.schedule_time_start || "")}-${formatTime(s.schedule_time_end || "")}`.trim(),
              )
              .filter((s) => s && s !== "-")
              .join(", ");
          } else if (
            enrollment.final_schedule_day &&
            enrollment.final_schedule_day.trim()
          ) {
            schedule = `${enrollment.final_schedule_day} ${formatTime(enrollment.final_schedule_time_start || "")}-${formatTime(enrollment.final_schedule_time_end || "")}`.trim();
          } else if (enrollment.schedule_day && enrollment.schedule_day.trim()) {
            schedule = `${enrollment.schedule_day} ${formatTime(enrollment.schedule_time_start || "")}-${formatTime(enrollment.schedule_time_end || "")}`.trim();
          } else if (enrollment.schedule && enrollment.schedule.trim()) {
            schedule = enrollment.schedule;
          }

          return {
            enrollment_id: enrollment.enrollment_id,
            subject_id: enrollment.course_id,
            subject_code: enrollment.course_code,
            subject_name: enrollment.course_title,
            units: enrollment.units || 3,
            schedule,
            instructor: enrollment.instructor_name || "TBA",
          };
        }),
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, []);

  const fetchTimetable = useCallback(async () => {
    try {
      const studentId = localStorage.getItem("userId");
      if (!studentId) return;

      console.log("📅 Fetching timetable for student:", studentId);

      const response = await axios.get(
        `${API_BASE}/api/enrollments/student/${studentId}`,
      );

      const enrollments = (response.data || []).filter(isActiveEnrollment);
      console.log("Fetched enrollments:", enrollments);

      const scheduleData = [];

      enrollments.forEach((enrollment) => {
        if (
          Array.isArray(enrollment.schedules) &&
          enrollment.schedules.length > 0
        ) {
          enrollment.schedules.forEach((schedule) => {
            const scheduleDay = schedule.schedule_day;
            const scheduleStart = schedule.schedule_time_start;
            const scheduleEnd = schedule.schedule_time_end;

            console.log(
              `📚 ${enrollment.course_code}: Day=${scheduleDay}, Time=${scheduleStart}-${scheduleEnd}`,
            );

            if (scheduleDay && scheduleStart && scheduleEnd) {
              const days = parseDayAbbreviations(scheduleDay);
              days.forEach((day) => {
                scheduleData.push({
                  day,
                  subject_name: enrollment.course_title,
                  subject_code: enrollment.course_code,
                  start_time: formatTime(scheduleStart),
                  end_time: formatTime(scheduleEnd),
                  room: enrollment.room || "TBA",
                  instructor: enrollment.instructor_name || "TBA",
                });
              });
            }
          });
        } else {
          const scheduleDay =
            enrollment.final_schedule_day || enrollment.schedule_day;
          const scheduleStart =
            enrollment.final_schedule_time_start ||
            enrollment.schedule_time_start;
          const scheduleEnd =
            enrollment.final_schedule_time_end || enrollment.schedule_time_end;

          console.log(
            `📚 ${enrollment.course_code}: Day=${scheduleDay}, Time=${scheduleStart}-${scheduleEnd}`,
          );

          if (scheduleDay && scheduleStart && scheduleEnd) {
            const days = parseDayAbbreviations(scheduleDay);
            days.forEach((day) => {
              scheduleData.push({
                day,
                subject_name: enrollment.course_title,
                subject_code: enrollment.course_code,
                start_time: formatTime(scheduleStart),
                end_time: formatTime(scheduleEnd),
                room: enrollment.room || "TBA",
                instructor: enrollment.instructor_name || "TBA",
              });
            });
          } else {
            console.log(
              `⚠️ No schedule for ${enrollment.course_code}, using Monday fallback`,
            );
            scheduleData.push({
              day: "Monday",
              subject_name: enrollment.course_title,
              subject_code: enrollment.course_code,
              start_time: "TBA",
              end_time: "TBA",
              room: enrollment.room || "TBA",
              instructor: enrollment.instructor_name || "TBA",
            });
          }
        }
      });

      console.log(
        `✅ Total schedule entries: ${scheduleData.length}`,
        scheduleData,
      );
      setTimetable(scheduleData);
    } catch (error) {
      console.error("❌ Error fetching timetable:", error);
      setTimetable([]);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "enlistment") {
      fetchEnlistmentData();
      fetchEnrollmentStatus();
    } else {
      fetchTimetable();
    }
  }, [activeTab, fetchEnlistmentData, fetchEnrollmentStatus, fetchTimetable]);

  const confirmEnlist = async () => {
    try {
      await axios.post(`${API_BASE}/api/enrollments`, {
        course_id: selectedSubject.subject_id,
      });
      fetchEnlistmentData();
      fetchEnrollmentStatus();
      setShowConfirmModal(false);
      setSelectedSubject(null);
    } catch (error) {
      console.error("Error enlisting:", error);
    }
  };

  const handleDrop = async (enrollmentId) => {
    if (!confirm("Are you sure you want to drop this subject?")) return;

    try {
      await axios.delete(`${API_BASE}/api/enrollments/${enrollmentId}`);
      fetchEnlistmentData();
      fetchEnrollmentStatus();
    } catch (error) {
      console.error("Error dropping:", error);
    }
  };

  // Builds and downloads the same "Official Registration Form" PDF used
  // in the admin Enrollment Records screen, but for the logged-in student's
  // own currently enrolled subjects/period.
  const handleDownloadEnrollment = async () => {
    if (downloadingForm) return;

    const studentId = localStorage.getItem("userId");
    if (!studentId) return;

    if (!periodMeta) {
      alert("No enrolled subjects to export.");
      return;
    }

    setDownloadingForm(true);
    try {
      // Student's own profile
      // Uses the authenticated `api` instance (adds Bearer token) since
      // this endpoint may require auth just like /api/invoices below.
      let studentInfo = {};
      try {
        const res = await api.get(`/api/users/${studentId}`);
        const u = res.data;
        studentInfo = {
          student_number: u.student_number,
          full_name: `${u.first_name} ${u.last_name}`,
          address: u.address || "",
          birthday: u.birthday || "",
          age: u.age || "",
          gender: u.gender || "",
          civil_status: u.civil_status || "",
          religion: u.religion || "",
          nationality: u.nationality || "",
          cell_phone: u.phone || "",
          email: u.email || "",
          program_year: `${u.program || "N/A"} / ${periodMeta.year_level || ""}`,
        };
      } catch (error) {
        console.error("Error fetching student profile:", error);
      }

      // Invoice for this student/period (drives the assessment box)
      //
      // FIX: match invoices using periodMeta.student_id (the real
      // student_id used by the invoices table), NOT the raw
      // localStorage "userId". These two ids are not guaranteed to be
      // the same, and matching against the wrong one silently returns
      // no invoice — which is why the assessment box came out blank
      // on the student side while the admin side (which correctly
      // matches on enrollment.student_id) worked fine.
      let invoice = {};
      try {
        // FIX: use the authenticated `api` instance instead of raw axios.
        // Raw axios has no Authorization header, so this endpoint was
        // returning 401 Unauthorized — which is why the invoice never
        // loaded even after correcting the student_id match.
        const res = await api.get(`/api/invoices`, {
          params: { academic_period_id: periodMeta.period_id },
        });
        const invoices = res.data?.data || res.data || [];
        invoice =
          invoices.find(
            (inv) => String(inv.student_id) === String(periodMeta.student_id),
          ) || {};

        if (Object.keys(invoice).length === 0) {
          console.warn(
            "⚠️ No matching invoice found for student_id:",
            periodMeta.student_id,
            "period_id:",
            periodMeta.period_id,
            "— assessment box will be blank.",
          );
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
      }

      // currentUser left as {} so exportRegistrationFormPDF falls back to
      // its default registrar name/title — the signature block belongs to
      // the registrar, not the student downloading their own form.
      await exportRegistrationFormPDF(periodMeta, studentInfo, {}, invoice);
    } catch (error) {
      console.error("Error downloading enrollment form:", error);
    } finally {
      setDownloadingForm(false);
    }
  };

  // Builds and downloads a PDF of the student's own class schedule
  // (all days, not just the currently selected day tab).
  const handleDownloadTimetable = async () => {
    if (downloadingTimetable) return;

    if (!timetable || timetable.length === 0) {
      alert("No class schedule to export.");
      return;
    }

    const studentId = localStorage.getItem("userId");

    setDownloadingTimetable(true);
    try {
      // Student's own profile — same auth-required endpoint as the
      // registration form download, so use the authenticated `api`
      // instance (adds Bearer token) instead of raw axios.
      let studentInfo = {};
      if (studentId) {
        try {
          const res = await api.get(`/api/users/${studentId}`);
          const u = res.data;
          studentInfo = {
            student_number: u.student_number,
            full_name: `${u.first_name} ${u.last_name}`,
          };
        } catch (error) {
          console.error("Error fetching student profile:", error);
        }
      }

      await exportTimetablePDF(studentInfo, periodMeta || {}, timetable);
    } catch (error) {
      console.error("Error downloading timetable:", error);
    } finally {
      setDownloadingTimetable(false);
    }
  };

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const groupedByDay = days.reduce((acc, day) => {
    acc[day] = timetable
      .filter((t) => t.day === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    return acc;
  }, {});

  const tabs = [
    { id: "enlistment", label: "Subject Enlistment", icon: BookOpen },
    { id: "timetable", label: "Timetable", icon: Calendar },
  ];

  return (
   <div className="dark:bg-slate-900 px-4 py-3 transition-colors duration-500">
      <div className="w-full space-y-2 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen size={24} className="text-indigo-600" />
            My Courses
          </h2>
          {activeTab === "enlistment" && (
            <div className="flex gap-2">
              <button
                onClick={handleDownloadEnrollment}
                disabled={downloadingForm || !periodMeta}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors"
              >
                <Download size={14} />
                {downloadingForm ? "Generating..." : "Download"}
              </button>
            </div>
          )}
          {activeTab === "timetable" && (
            <div className="flex gap-2">
              <button
                onClick={handleDownloadTimetable}
                disabled={downloadingTimetable || timetable.length === 0}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors"
              >
                <Download size={14} />
                {downloadingTimetable ? "Generating..." : "Download"}
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-0 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "enlistment" ? (
          // Subject Enlistment Tab
          <div className="space-y-4">
            {droppedEnrollments.length > 0 && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200 p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-white rounded-full p-2 shadow-sm">
                    <X size={18} className="text-red-500" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-slate-800 mb-2">
                      Dropped subject update
                    </h2>
                    <p className="text-sm text-slate-700 mb-3">
                      You were dropped from the following subject
                      {droppedEnrollments.length > 1 ? "s" : ""}. This does
                      not change your semester enrollment:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {droppedEnrollments.map((enrollment) => (
                        <span
                          key={enrollment.enrollment_id}
                          className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-red-700 border border-red-200"
                        >
                          <span className="font-semibold">
                            {enrollment.course_title || enrollment.course_code || enrollment.course || "the course"}
                          </span>
                          {enrollment.school_year && enrollment.semester && (
                            <span className="text-red-500">
                              {enrollment.school_year} - {enrollment.semester}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enrollment Status Banner */}
            {enrollmentStatus && (
              <div
                className={`rounded-lg p-4 border ${
                  enrollmentStatus.isOpen
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  {enrollmentStatus.isOpen ? (
                    <CheckCircle size={20} className="text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle size={20} className="text-amber-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                      {enrollmentStatus.isOpen
                        ? "Enrollment Period Active"
                        : "Enrollment Period Closed"}
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {enrollmentStatus.message ||
                        "Check with the registrar for enrollment schedules"}
                    </p>
                    {enrollmentStatus.deadline && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Deadline:{" "}
                        {new Date(
                          enrollmentStatus.deadline,
                        ).toLocaleDateString()}
                      </p>
                    )}
                    {enrollmentStatus.maxUnits && (
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Units:{" "}
                          {enrolledSubjects.reduce(
                            (sum, s) => sum + (s.units || 0),
                            0,
                          )}{" "}
                          / {enrollmentStatus.maxUnits}
                        </span>
                        <div className="flex-1 max-w-xs bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min((enrolledSubjects.reduce((sum, s) => sum + (s.units || 0), 0) / enrollmentStatus.maxUnits) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Enrolled Subjects Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-5 text-white shadow-lg">
                <p className="text-xs font-medium text-indigo-100 uppercase mb-1">
                  Enrolled Subjects
                </p>
                <p className="text-3xl font-bold">{enrolledSubjects.length}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-5 text-white shadow-lg">
                <p className="text-xs font-medium text-green-100 uppercase mb-1">
                  Total Units
                </p>
                <p className="text-3xl font-bold">
                  {enrolledSubjects.reduce((sum, s) => sum + (s.units || 0), 0)}
                </p>
              </div>
            </div>

            {/* Enrolled Subjects Table */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Currently Enrolled
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {enrolledSubjects.length} subject
                  {enrolledSubjects.length !== 1 ? "s" : ""}
                </span>
              </div>
              {enrolledSubjects.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-10">
                  No subjects enrolled yet
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-700/50 text-left">
                        <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 w-8">
                          #
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                          Subject Name
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                          Code
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-center">
                          Units
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                          Schedule
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                          Instructor
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-center">
                          Status
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-center">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {enrolledSubjects.map((subject, index) => (
                        <tr
                          key={subject.enrollment_id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                            {subject.subject_name}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">
                            {subject.subject_code}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">
                            {subject.units}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                            {subject.schedule || "TBA"}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                            {subject.instructor || "TBA"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                              <CheckCircle size={11} />
                              Enrolled
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDrop(subject.enrollment_id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded-md text-xs font-medium transition-colors"
                            >
                              Drop
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700">
                        <td
                          colSpan={3}
                          className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 text-right"
                        >
                          Total Units:
                        </td>
                        <td className="px-4 py-2 text-center font-bold text-slate-900 dark:text-white">
                          {enrolledSubjects.reduce(
                            (sum, s) => sum + (s.units || 0),
                            0,
                          )}
                        </td>
                        <td colSpan={4} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Timetable Tab with Day Selection
          <div className="space-y-4">
            {/* Day Filter Buttons */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-md font-medium text-sm whitespace-nowrap transition-colors ${
                    selectedDay === day
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Selected Day Table View */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar size={18} />
                  {selectedDay}
                </h3>
              </div>

              {groupedByDay[selectedDay]?.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-slate-500 dark:text-slate-400">
                    No classes scheduled
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 text-sm">
                          Time
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 text-sm">
                          Subject
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 text-sm">
                          Code
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 text-sm">
                          Room
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 text-sm">
                          Instructor
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {groupedByDay[selectedDay]?.map((item, index) => (
                        <tr
                          key={index}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                              {item.start_time} - {item.end_time}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {item.subject_name}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                              {item.subject_code}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                              <MapPin
                                size={14}
                                className="text-indigo-600 flex-shrink-0"
                              />
                              {item.room}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {item.instructor}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && selectedSubject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6 shadow-xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-full p-2">
                  <FileText size={24} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                    Confirm Enrollment
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Review the subject details before enrolling
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-4 space-y-2">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Subject Name
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {selectedSubject.subject_name}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Subject Code
                    </p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {selectedSubject.subject_code}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Units
                    </p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {selectedSubject.units}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Schedule
                  </p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {selectedSubject.schedule}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Instructor
                  </p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {selectedSubject.instructor}
                  </p>
                </div>
                {selectedSubject.prerequisites &&
                  selectedSubject.prerequisites.length > 0 && (
                    <div className="border-t border-slate-200 dark:border-slate-600 pt-2 mt-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        Prerequisites Required
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedSubject.prerequisites.map((prereq, index) => (
                          <span
                            key={index}
                            className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded"
                          >
                            {prereq}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {enrollmentStatus && !enrollmentStatus.isOpen && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-600" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Enrollment period is currently closed. Contact the
                      registrar for assistance.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedSubject(null);
                  }}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEnlist}
                  disabled={enrollmentStatus && !enrollmentStatus.isOpen}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Confirm Enlist
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCourses;