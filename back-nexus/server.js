import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import dotenv from "dotenv"; //  ESM import
dotenv.config(); // load env variables
import path from "path";
import { fileURLToPath } from "url";



import departmentRoutes from "./routes/departmentRoutes.js"; 
import courseRoutes from "./routes/courses.routes.js"; 
import programRoutes from "./routes/programs.routes.js"; // programs route file
import academicPeriodRoutes from "./routes/academicPeriods.routes.js"; // academic periods route file
import prerequisiteRoutes from "./routes/prerequisites.routes.js"; // prerequisites route file
import userRoutes from "./routes/user.routes.js"; // user management routes
import enrollmentRoutes from "./routes/enrollments.routes.js"; // enrollment routes
import admissionRoutes from "./routes/admissions.routes.js"; // admissions routes
import courseTransferRoutes from "./routes/courseTransfers.routes.js"; // course transfer routes
import academicHistoryRoutes from "./routes/academicHistory.routes.js"; // academic history routes
import clearanceRoutes from "./routes/clearances.routes.js"; // clearance routes
import facultyRoutes from "./routes/faculty.routes.js"; // faculty management routes
import facultyCourseAssignmentRoutes from "./routes/facultyCourseAssignment.routes.js"; // faculty course assignments
import facultyAdvisoryRoutes from "./routes/facultyAdvisory.routes.js"; // faculty advisory assignments
import facultyEvaluationRoutes from "./routes/facultyEvaluation.routes.js"; // faculty evaluations
import facultyScheduleRoutes from "./routes/facultySchedule.routes.js"; // faculty schedules
import sectionsRoutes from "./routes/sections.routes.js"; // sections management routes
import gradesRoutes from "./routes/grades.routes.js"; // grades management routes
import academicEventsRoutes from "./routes/academicEvents.routes.js"; // academic events/calendar routes
import syllabusRoutes from "./routes/syllabus.routes.js"; // syllabus repository routes
import staffAttendanceRoutes from "./routes/staffAttendance.routes.js"; // staff attendance routes
import studentAttendanceRoutes from "./routes/studentAttendance.routes.js"; // student attendance routes
import rfidCardsRoutes from "./routes/rfidCards.routes.js"; // RFID cards management routes
import absenteeAlertsRoutes from "./routes/absenteeAlerts.routes.js"; // absentee alerts routes
import examsRoutes from "./routes/exams.routes.js"; // exams management routes
import examSchedulesRoutes from "./routes/examSchedules.routes.js"; // exam schedules routes
import gradeEntriesRoutes from "./routes/gradeEntries.routes.js"; // grade entries/approval routes
import gradeComputationSettingsRoutes from "./routes/gradeComputationSettings.routes.js"; // grade computation settings routes
import tuitionFeesRoutes from "./routes/tuitionFees.routes.js"; // tuition fee setup routes
import invoicesRoutes from "./routes/invoices.routes.js"; // invoice management routes
import paymentsRoutes from "./routes/payments.routes.js"; // payment collection routes
import scholarshipsRoutes from "./routes/scholarships.routes.js"; // scholarship routes
import incomeExpensesRoutes from "./routes/incomeExpenses.routes.js"; // income & expenses routes
import accountingRoutes from "./routes/accounting.routes.js"; // accounting routes
import paymentGatewayRoutes from "./routes/paymentGateway.routes.js"; // payment gateway routes
import employeeRecordsRoutes from "./routes/employeeRecords.routes.js"; // employee records routes
import staffLeaveRoutes from "./routes/staffLeave.routes.js"; // staff leave routes
import payrollRoutes from "./routes/payroll.routes.js"; // payroll routes
import deductionsRoutes from "./routes/deductions.routes.js"; // deductions routes
import libraryBooksRoutes from "./routes/libraryBooks.routes.js"; // library books routes
import libraryTransactionsRoutes from "./routes/libraryTransactions.routes.js"; // library transactions routes
import libraryIncidentsRoutes from "./routes/libraryIncidents.routes.js"; // library incidents routes
import digitalLibraryRoutes from "./routes/digitalLibrary.routes.js"; // digital library routes
import scholarshipTypesRoutes from "./routes/scholarshipTypes.routes.js"; // scholarship types routes
import scholarshipApplicationsRoutes from "./routes/scholarshipApplications.routes.js"; // scholarship applications routes
import scholarshipBeneficiariesRoutes from "./routes/scholarshipBeneficiaries.routes.js"; // scholarship beneficiaries routes
import scholarshipEligibilityRoutes from "./routes/scholarshipEligibility.routes.js"; // scholarship eligibility routes
import announcementsRoutes from "./routes/announcements.routes.js"; // announcements routes
import feedbackRoutes from "./routes/feedback.routes.js"; // feedback routes
import eventsRoutes from "./routes/events.routes.js"; // events routes
import schoolCalendarRoutes from "./routes/schoolCalendar.routes.js"; // school calendar routes
import publicEventsRoutes from "./routes/publicEvents.routes.js"; // public events routes
import inventoryRoutes from "./routes/inventory.routes.js"; // inventory assets routes
import reportsRoutes from "./routes/reports.routes.js"; // reports & analytics routes
import systemSettingsRoutes from "./routes/systemSettings.routes.js"; // system settings routes
import lmsMaterialsRoutes from "./routes/lmsMaterials.routes.js"; // LMS materials routes
import lmsAssignmentsRoutes from "./routes/lmsAssignments.routes.js"; // LMS assignments routes
import lmsDiscussionsRoutes from "./routes/lmsDiscussions.routes.js"; // LMS discussions routes
import rbacRoutes from "./routes/rbac.routes.js"; // RBAC routes
import aiRoutes from "./routes/ai.routes.js"; // Nexus AI chat route
import calendarRoutes from "./routes/calendar.routes.js"; // unified calendar routes
import roomsRoutes from "./routes/rooms.routes.js"; // rooms management routes

const app = express();
const PORT = process.env.PORT || 5000;


// CORS 
app.use(
  cors({
    origin: "https://nexusbacocommunitycollege.com/", // Adjust this to your frontend's origin https://nexusbacocommunitycollege.com/
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
    exposedHeaders: ["Authorization"],
  }),
);
app.use(helmet());
// Rate limiter
// server.js — fix the global limiter (place it BEFORE all routes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,           // Reasonable for all API calls combined
  message: { message: "Too many requests from this IP, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});


app.use(globalLimiter); // ✅ Move this UP, before all app.use("/api", ...) calls



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json({ limit: "25mb" }));
app.use(bodyParser.urlencoded({ limit: "25mb", extended: true }));
// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Root route
app.get("/", (req, res) => res.send("ERP Backendsdsds running"));

// Auth routes

app.use("/api", userRoutes); // New structured user management routes
app.use("/api/dept", departmentRoutes);
app.use("/api/course", courseRoutes);
app.use("/api", programRoutes);
app.use("/api", academicPeriodRoutes);

app.use("/api", prerequisiteRoutes);
app.use("/api", enrollmentRoutes);
app.use("/api", admissionRoutes);
app.use("/api", courseTransferRoutes);
app.use("/api/academic-history", academicHistoryRoutes); //
app.use("/api", clearanceRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/faculty-assignments", facultyCourseAssignmentRoutes);
app.use("/api/faculty-advisory", facultyAdvisoryRoutes);
app.use("/api/faculty-evaluations", facultyEvaluationRoutes);
app.use("/api/faculty-schedules", facultyScheduleRoutes);
app.use("/api/sections", sectionsRoutes);
app.use("/api/grades", gradesRoutes);
app.use("/api/academic-events", academicEventsRoutes);
app.use("/api/syllabus", syllabusRoutes);
app.use("/api/staff-attendance", staffAttendanceRoutes);
app.use("/api/student-attendance", studentAttendanceRoutes);
app.use("/api/rfid-cards", rfidCardsRoutes);
app.use("/api/absentee-alerts", absenteeAlertsRoutes);
app.use("/api/exams", examsRoutes);
app.use("/api/exam-schedules", examSchedulesRoutes);
app.use("/api/grade-entries", gradeEntriesRoutes);
app.use("/api/grade-computation-settings", gradeComputationSettingsRoutes);

// Financial & Accounting routes
app.use("/api/tuition-fees", tuitionFeesRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/scholarships", scholarshipsRoutes);
app.use("/api/income-expenses", incomeExpensesRoutes);
app.use("/api/accounting", accountingRoutes);
app.use("/api/payment-gateway", paymentGatewayRoutes);

// HR & Payroll routes
app.use("/api/employees", employeeRecordsRoutes);
app.use("/api/staff-leave", staffLeaveRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/deductions", deductionsRoutes);

// Library Management routes
app.use("/api/library/books", libraryBooksRoutes);
app.use("/api/library/transactions", libraryTransactionsRoutes);
app.use("/api/library/incidents", libraryIncidentsRoutes);
app.use("/api/library/digital", digitalLibraryRoutes);

// Scholarship & Grants routes
app.use("/api/scholarships/types", scholarshipTypesRoutes);
app.use("/api/scholarships/applications", scholarshipApplicationsRoutes);
app.use("/api/scholarships/beneficiaries", scholarshipBeneficiariesRoutes);
app.use("/api/scholarships/screening", scholarshipEligibilityRoutes);

// Events & Communication routes
app.use("/api/events/announcements", announcementsRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/events/scheduling", eventsRoutes);
app.use("/api/events/calendar", schoolCalendarRoutes);
app.use("/api/events/public", publicEventsRoutes);

// Unified Calendar routes
app.use("/api/calendar", calendarRoutes);

// Rooms Management routes
app.use("/api/rooms", roomsRoutes);

// Inventory Management routes
app.use("/api/inventory", inventoryRoutes);

// Reports & Analytics routes
app.use("/api/reports", reportsRoutes);

// System Settings routes
app.use("/api/system-settings", systemSettingsRoutes);

// RBAC routes
app.use("/api", rbacRoutes);

// LMS routes
app.use("/api/lms/materials", lmsMaterialsRoutes);
app.use("/api/lms/assignments", lmsAssignmentsRoutes);
app.use("/api/lms/discussions", lmsDiscussionsRoutes);

// Nexus AI routes
app.use("/api", aiRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
