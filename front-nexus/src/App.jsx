import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import SharedLayout from "./layouts/SharedLayout";

import AdminDashboard from "./components/pages/admin/AdminDashboard";
import LoginLayout from "./components/shared/LoginLayout";
import DepartmentMngt from "./components/pages/admin/DepartmentMngt";
import UserManagement from "./components/pages/admin/UserManagement";

import Department from "./components/pages/admin/Department";
import CourseManagement from "./components/pages/admin/CourseManagement";
import Prerequisites from "./components/pages/admin/Prerequisites";
import ProgramsOffering from "./components/pages/admin/ProgramsOffering";
import AcademicSem from "./components/pages/admin/AcademicSem";
import AdminStudentMngt from "./components/pages/admin/AdminStudentMngt";
import Admission from "./components/pages/admin/Admission";
import EnrollmentRecords from "./components/pages/admin/EnrollmentRecords";
import CourseTransfer from "./components/pages/admin/CourseTransfer";
import AcademicHistory from "./components/pages/admin/AcademicHistory";
import IDGenerator from "./components/pages/admin/IDGenerator";
import ClearanceProcessing from "./components/pages/admin/ClearanceProcessing";
import FacultyManagement from "./components/pages/admin/FacultyManagement";
import FacultyAssignCourse from "./components/pages/admin/FacultyAssignCourse";
import FacultyAdvisoryAssignment from "./components/pages/admin/FacultyAdvisoryAssignment";
import FacultyEvaluation from "./components/pages/admin/FacultyEvaluation";
/* import FacultyScheduling from "./components/pages/admin/FacultyScheduling"; */
import SubjectSections from "./components/pages/admin/SubjectSections";
import TimetableBuilder from "./components/pages/admin/TimetableBuilder";
import AcademicCalendar from "./components/pages/admin/AcademicCalendar";
import ClassCapacityMonitor from "./components/pages/admin/ClassCapacityMonitor";
import GradeManagement from "./components/pages/admin/GradeManagement";
import SyllabusRepository from "./components/pages/admin/SyllabusRepository";
import StaffAttendance from "./components/pages/admin/StaffAttendance";
import AdminStudentAttendance from "./components/pages/admin/StudentAttendance";
import RFIDIntegration from "./components/pages/admin/RFIDIntegration";
import AbsenteeAlerts from "./components/pages/admin/AbsenteeAlerts";
import ExamSetup from "./components/pages/admin/ExamSetup";
import GradeEntryApproval from "./components/pages/admin/GradeEntryApproval";
import GradeComputationSetup from "./components/pages/admin/GradeComputationSetup";
import ExamScheduleBuilder from "./components/pages/admin/ExamScheduleBuilder";
import TuitionFeeSetup from "./components/pages/accounting/TuitionFeeSetup";
import PaymentCollection from "./components/pages/accounting/PaymentCollection";
import InvoiceManagement from "./components/pages/accounting/InvoiceManagement";
import ScholarshipFundAllocation from "./components/pages/accounting/ScholarshipFundAllocation";
import IncomeExpensesReports from "./components/pages/accounting/IncomeExpensesReports";
import EmployeeRecords from "./components/pages/hr/EmployeeRecords";
import StaffLeave from "./components/pages/hr/StaffLeave";
import PayslipGenerator from "./components/pages/hr/PayslipGenerator";
import DeductionManagement from "./components/pages/hr/DeductionManagement";
import PayrollReports from "./components/pages/hr/PayrollReports";
import HRDashboard from "./components/pages/hr/HRDashboard";
import HRProfile from "./components/pages/hr/HRProfile";
import MyPayslips from "./components/pages/employee/MyPayslips";
import EmployeeLeavePortal from "./components/pages/employee/EmployeeLeavePortal";
import PaymentGateway from "./components/pages/accounting/PaymentGateway";
import BookCatalog from "./components/pages/staff/BookCatalog";
import BorrowReturn from "./components/pages/staff/BorrowReturn";
import LostDamageLogs from "./components/pages/staff/LostDamageLogs";
import DigitalLibrary from "./components/pages/staff/DigitalLibrary";
import ScholarshipTypeSetup from "./components/pages/accounting/ScholarshipTypeSetup";
import ApplicationForms from "./components/pages/accounting/ApplicationForms";
import BeneficiaryList from "./components/pages/accounting/BeneficiaryList";
import EligibilityScreening from "./components/pages/accounting/EligibilityScreening";
import AnnouncementCenter from "./components/pages/admin/AnnouncementCenter";
import EventScheduling from "./components/pages/admin/EventScheduling";
import SchoolCalendar from "./components/pages/admin/SchoolCalendar";
import PublicEventPosting from "./components/pages/admin/PublicEventPosting";
import InventoryAssetManagement from "./components/pages/admin/InventoryAssetManagement";
import StudentReports from "./components/pages/admin/StudentReports";
import AdminAnalytics from "./components/pages/admin/AdminAnalytics";
import GeneralSettings from "./components/pages/admin/GeneralSettings_New";
import EmailSMSGateway from "./components/pages/admin/EmailSMSGateway";
import SystemLogs from "./components/pages/admin/SystemLogs";

// Faculty Pages
import FacultyDashboard from "./components/pages/faculty/FacultyDashboard";
import FacultyProfile from "./components/pages/faculty/FacultyProfile";
import AssignedSubjects from "./components/pages/faculty/AssignedSubjects";
import SyllabusUpload from "./components/pages/faculty/SyllabusUpload";
import StudentList from "./components/pages/faculty/StudentList";
import MarkAttendance from "./components/pages/faculty/MarkAttendance";
import FacultyAbsenteeAlerts from "./components/pages/faculty/AbsenteeAlerts";
import GradeEncoding from "./components/pages/faculty/GradeEncoding";
import GradeReview from "./components/pages/faculty/GradeReview";
import LMSMaterials from "./components/pages/faculty/LMSMaterials";
import LMSAssignments from "./components/pages/faculty/LMSAssignments";
import LMSDiscussion from "./components/pages/faculty/LMSDiscussion";
import FacultyAnnouncements from "./components/pages/faculty/Announcements";
import Messaging from "./components/pages/faculty/Messaging";
import EmailStudent from "./components/pages/faculty/EmailStudent";
import GradeReports from "./components/pages/faculty/GradeReports";
import AttendanceReports from "./components/pages/faculty/AttendanceReports";
import ClassPerformance from "./components/pages/faculty/ClassPerformance";

// Student Pages
import StudentDashboard from "./components/pages/student/StudentDashboard";
import StudentProfile from "./components/pages/student/StudentProfile";
import StudentCourses from "./components/pages/student/StudentCourses";
import StudentAcademic from "./components/pages/student/StudentAcademic";
import StudentEnrollment from "./components/pages/student/StudentEnrollment";
import StudentFinance from "./components/pages/student/StudentFinance";
import StudentFinanceBalance from "./components/pages/student/StudentFinanceBalance";
import StudentFinanceReceipts from "./components/pages/student/StudentFinanceReceipts";
import StudentLMS from "./components/pages/student/StudentLMS";
import StudentAttendance from "./components/pages/student/StudentAttendance";
import StudentCalendar from "./components/pages/student/StudentCalendar";
import StudentAnnouncements from "./components/pages/student/StudentAnnouncements";
import StudentCommunication from "./components/pages/student/StudentCommunication";
import StudentScholarships from "./components/pages/student/StudentScholarships";
import StaffDashboard from "./components/pages/staff/StaffDashboard";
import AccountingDashboard from "./components/pages/accounting/AccountingDashboard";

function AppWrapper() {
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log("Logging out...");
    localStorage.clear(); // clear token/role info
    navigate("/", { replace: true });
  };

  // Function to navigate based on role
  const handleNavigateByRole = (role) => {
    if (role === "Admin") {
      navigate("/admin/dashboard", { replace: true });
    } else if (role === "Faculty") {
      navigate("/faculty/dashboard", { replace: true });
    } else if (role === "Student") {
      navigate("/student/dashboard", { replace: true });
    } else if (role === "Hr") {
      navigate("/hr/dashboard", { replace: true });
    } else if (role === "Accounting") {
      navigate("/accounting/dashboard", { replace: true });
    } else if (role === "Staff") {
      navigate("/staff/dashboard", { replace: true });
    }
  };

  return (
    <Routes>
      {/* Public Route: Login page */}
      <Route
        path="/"
        element={<LoginLayout onNavigateByRole={handleNavigateByRole} />}
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin/*"
        element={<SharedLayout role="Admin" handleLogout={handleLogout} />}
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="admin_department_managent" element={<Department />} />
        <Route path="admin_course_management" element={<CourseManagement />} />
        <Route path="admin_prerequisite" element={<Prerequisites />} />
      
        <Route path="admin_manage_users" element={<UserManagement />} />
        <Route path="admin_program_offerings" element={<ProgramsOffering />} />
        <Route path="admin_academic_year" element={<AcademicSem />} />
        <Route path="admin_student_management" element={<AdminStudentMngt />} />
        <Route path="admin_admission" element={<Admission />} />
        <Route path="admin_enrollment" element={<EnrollmentRecords />} />
        <Route path="admin_course_transfer" element={<CourseTransfer />} />
        <Route path="admin_academic_history" element={<AcademicHistory />} />
        <Route path="admin_id_generator" element={<IDGenerator />} />
        <Route
          path="admin_clearance_processing"
          element={<ClearanceProcessing />}
        />
        <Route
          path="admin_faculty_management"
          element={<FacultyManagement />}
        />
        <Route
          path="admin_faculty_assign_course"
          element={<FacultyAssignCourse />}
        />
        <Route
          path="admin_faculty_advisory_assignment"
          element={<FacultyAdvisoryAssignment />}
        />
        <Route
          path="admin_faculty_evaluation"
          element={<FacultyEvaluation />}
        />
        {/*   <Route
          path="admin_faculty_scheduling"
          element={<FacultyScheduling />}
        /> */}
        <Route path="admin_subject_sections" element={<SubjectSections />} />
        <Route path="admin_timetable" element={<TimetableBuilder />} />
        <Route path="admin_academic_calendar" element={<AcademicCalendar />} />
        <Route
          path="admin_capacity_monitor"
          element={<ClassCapacityMonitor />}
        />
        <Route path="admin_grademanagement" element={<GradeManagement />} />
        <Route
          path="admin_syllabus_repository"
          element={<SyllabusRepository />}
        />
        <Route path="admin_library_management" element={<BookCatalog />} />
        <Route path="admin_borrow_return" element={<BorrowReturn />} />
        <Route path="admin_lost_damage_logs" element={<LostDamageLogs />} />
        <Route path="admin_digital_library" element={<DigitalLibrary />} />
        <Route
          path="admin_scholar_type_setup"
          element={<ScholarshipTypeSetup />}
        />
        <Route path="admin_application_forms" element={<ApplicationForms />} />
        <Route path="admin_benefeciary_list" element={<BeneficiaryList />} />
        <Route
          path="admin_eligibility_screening"
          element={<EligibilityScreening />}
        />
        <Route
          path="admin_announcement_center"
          element={<AnnouncementCenter />}
        />
        <Route path="admin_event_scheduling" element={<EventScheduling />} />
        <Route path="admin_school_calendar" element={<SchoolCalendar />} />
        <Route
          path="admin_public_event_posting"
          element={<PublicEventPosting />}
        />
        <Route
          path="admin_inventory_asset_management"
          element={<InventoryAssetManagement />}
        />
        <Route path="admin_general_setting" element={<GeneralSettings />} />
        <Route path="admin_email_sms_gateway" element={<EmailSMSGateway />} />
        <Route path="admin_system_logs" element={<SystemLogs />} />
        <Route path="admin_staff_attendance" element={<StaffAttendance />} />
        <Route
          path="admin_student_attendance"
          element={<AdminStudentAttendance />}
        />
        <Route path="admin_rfid_integration" element={<RFIDIntegration />} />
        <Route path="admin_absentee" element={<AbsenteeAlerts />} />
        <Route path="admin_student_reports" element={<StudentReports />} />
        <Route path="admin_analytics" element={<AdminAnalytics />} />
        <Route path="admin_exam_setup" element={<ExamSetup />} />
        <Route path="admin_grade_entry" element={<GradeEntryApproval />} />
        <Route
          path="admin_grade_computation"
          element={<GradeComputationSetup />}
        />
        <Route
          path="admin_exam_schedule_builder"
          element={<ExamScheduleBuilder />}
        />
        <Route path="admin_tuition_fee_setup" element={<TuitionFeeSetup />} />
        <Route
          path="admin_payment_collection"
          element={<PaymentCollection />}
        />
        <Route
          path="admin_invoice_management"
          element={<InvoiceManagement />}
        />
        <Route
          path="admin_scholarship_fund"
          element={<ScholarshipFundAllocation />}
        />
        <Route
          path="admin_income_expenses"
          element={<IncomeExpensesReports />}
        />
        <Route path="admin_payment_gateway" element={<PaymentGateway />} />
        <Route path="admin_employee_records" element={<EmployeeRecords />} />
        <Route path="admin_leave" element={<EmployeeLeavePortal />} />
        <Route path="admin_staff_leave" element={<StaffLeave />} />
        <Route path="admin_payslip_generator" element={<PayslipGenerator />} />
        <Route
          path="admin_deduction_management"
          element={<DeductionManagement />}
        />
        <Route path="admin_payroll_reports" element={<PayrollReports />} />
        <Route path="my_payslips" element={<MyPayslips />} />
      </Route>

      {/* Student Routes */}
      <Route
        path="/student/*"
        element={<SharedLayout role="Student" handleLogout={handleLogout} />}
      >
        {/* Dashboard & Profile */}
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="student_dashboard" element={<StudentDashboard />} />
        <Route path="student_profile" element={<StudentProfile />} />
        {/* My Courses */}
        <Route path="student_courses" element={<StudentCourses />} />
        {/* Academic */}
        <Route path="student_academic" element={<StudentAcademic />} />
        {/* Enrollment */}
        <Route path="student_enrollment" element={<StudentEnrollment />} />
        {/* LMS */}
        <Route path="student_lms_lessons" element={<StudentLMS />} />
        <Route path="student_lms_quizzes" element={<StudentLMS />} />
        <Route path="student_lms_assignments" element={<StudentLMS />} />
        {/* Attendance */}
        <Route path="student_attendance_logs" element={<StudentAttendance />} />
        <Route
          path="student_attendance_records"
          element={<StudentAttendance />}
        />
        {/* Announcements */}
        <Route path="student_feedback" element={<StudentAnnouncements />} />
        <Route
          path="student_notifications"
          element={<StudentAnnouncements />}
        />
        {/* Calendar */}
        <Route path="student_calendar_exams" element={<StudentCalendar />} />
        <Route path="student_calendar_events" element={<StudentCalendar />} />
        {/* Communication */}
        <Route
          path="student_communication"
          element={<StudentCommunication />}
        />
        {/* Finance */}
        <Route path="student_finance" element={<StudentFinance />} />

        {/* Scholarships */}
        <Route path="student_scholarships" element={<StudentScholarships />} />
      </Route>

      {/* Faculty Routes */}
      <Route
        path="/faculty/*"
        element={<SharedLayout role="Faculty" handleLogout={handleLogout} />}
      >
        <Route path="dashboard" element={<FacultyDashboard />} />
        <Route path="faculty_dashboard" element={<FacultyDashboard />} />

        {/* Profile */}
        <Route path="faculty_profile" element={<FacultyProfile />} />

        {/* My Courses */}
        <Route
          path="faculty_assigned_subjects"
          element={<AssignedSubjects />}
        />
        <Route
          path="faculty_syllabus_upload"
          element={<SyllabusRepository />}
        />
        <Route path="faculty_student_list" element={<StudentList />} />

        {/* Attendance */}
        <Route path="faculty_mark_attendance" element={<MarkAttendance />} />
        <Route
          path="faculty_absentee_alerts"
          element={<FacultyAbsenteeAlerts />}
        />

        {/* Grades */}
        <Route path="faculty_grade_encoding" element={<GradeEncoding />} />
        <Route path="faculty_grade_review" element={<GradeReview />} />

        {/* LMS */}
        <Route path="faculty_lms_materials" element={<LMSMaterials />} />
        <Route path="faculty_lms_assignments" element={<LMSAssignments />} />
        <Route path="faculty_lms_discussion" element={<LMSDiscussion />} />

        {/* Communication */}
        <Route
          path="faculty_announcements"
          element={<FacultyAnnouncements />}
        />
        <Route path="faculty_messaging" element={<Messaging />} />
        <Route path="faculty_email_student" element={<EmailStudent />} />

        {/* Reports */}
        <Route path="faculty_report_grades" element={<GradeReports />} />
        <Route
          path="faculty_report_attendance"
          element={<AttendanceReports />}
        />
        <Route
          path="faculty_report_performance"
          element={<ClassPerformance />}
        />
        <Route path="faculty_leave" element={<EmployeeLeavePortal />} />
        <Route path="my_payslips" element={<MyPayslips />} />
      </Route>

      {/* Staff Routes */}
      <Route
        path="/staff/*"
        element={<SharedLayout role="Staff" handleLogout={handleLogout} />}
      >
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="staff_dashboard" element={<StaffDashboard />} />
        <Route path="staff_library_management" element={<BookCatalog />} />
        <Route path="staff_borrow_return" element={<BorrowReturn />} />
        <Route path="staff_lost_damage_logs" element={<LostDamageLogs />} />
        <Route path="staff_digital_library" element={<DigitalLibrary />} />
        <Route path="staff_leave" element={<EmployeeLeavePortal />} />
        <Route path="my_payslips" element={<MyPayslips />} />
        {/* Add more staff routes here as needed */}
      </Route>

      {/* Accounting Routes */}
      <Route
        path="/accounting/*"
        element={<SharedLayout role="Accounting" handleLogout={handleLogout} />}
      >
        <Route path="dashboard" element={<AccountingDashboard />} />
        <Route path="accounting_dashboard" element={<AccountingDashboard />} />
        <Route
          path="accounting_tuition_fee_setup"
          element={<TuitionFeeSetup />}
        />
        <Route
          path="accounting_payment_collection"
          element={<PaymentCollection />}
        />
        <Route
          path="accounting_invoice_management"
          element={<InvoiceManagement />}
        />
        <Route
          path="accounting_scholarship_fund_allocation"
          element={<ScholarshipFundAllocation />}
        />
        <Route
          path="accounting_income_expenses"
          element={<IncomeExpensesReports />}
        />
        <Route path="accounting_payment_gateway" element={<PaymentGateway />} />
        <Route
          path="accounting_scholar_type_setup"
          element={<ScholarshipTypeSetup />}
        />
        <Route
          path="accounting_application_forms"
          element={<ApplicationForms />}
        />
        <Route
          path="accounting_benefeciary_list"
          element={<BeneficiaryList />}
        />
        <Route
          path="accounting_eligibility_screening"
          element={<EligibilityScreening />}
        />
        <Route
          path="accounting_scholarship_fund"
          element={<ScholarshipFundAllocation />}
        />
        <Route path="accounting_leave" element={<EmployeeLeavePortal />} />
        <Route path="my_payslips" element={<MyPayslips />} />
      </Route>

      {/* HR Routes */}
      <Route
        path="/hr/*"
        element={<SharedLayout role="HR" handleLogout={handleLogout} />}
      >
        <Route path="dashboard" element={<HRDashboard />} />
        <Route path="hr_dashboard" element={<HRDashboard />} />
        <Route path="hr_employee_records" element={<EmployeeRecords />} />
        <Route path="hr_staff_leave" element={<StaffLeave />} />
        <Route path="hr_payslip_generator" element={<PayslipGenerator />} />
        <Route
          path="hr_deduction_management"
          element={<DeductionManagement />}
        />
        <Route path="hr_payroll_reports" element={<PayrollReports />} />
        <Route path="hr_profile" element={<HRProfile />} />
        <Route path="my_payslips" element={<MyPayslips />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}
