// routes/enrollments.routes.js
import express from "express";
import {
  getAllEnrollments,
  getEnrollmentsByStudent,
  getEnrollmentById,
  createEnrollment,
  bulkUpdateEnrollments,
  updateEnrollment,
  deleteEnrollment,
  transferStudentSection,
  deleteStudentPeriodEnrollments,
  getStudentsByAssignment,
  getStudentsByFaculty,
runSectioning
} from "../controllers/enrollments.controller.js";

const router = express.Router();


router.get("/enrollments", getAllEnrollments);
// dapat NASA UNA ito bago ang /enrollments/:id routes
router.post("/enrollments/run-sectioning",runSectioning);

// yung mga existing dapat nasa BABA nito:
// router.get("/enrollments/:id", enrollmentsController.getEnrollmentById);
// router.put("/enrollments/:id", enrollmentsController.updateEnrollment);
// router.delete("/enrollments/:id", enrollmentsController.deleteEnrollment);
router.get("/enrollments/student/:studentId", getEnrollmentsByStudent);
router.put("/enrollments/student/:studentId/section", transferStudentSection);
router.delete("/enrollments/student/:studentId/period/:periodId", deleteStudentPeriodEnrollments);
router.get("/enrollments/:id", getEnrollmentById);
router.post("/enrollments", createEnrollment);
router.put("/enrollments/bulk", bulkUpdateEnrollments);
router.put("/enrollments/:id", updateEnrollment);
router.delete("/enrollments/:id", deleteEnrollment);

// Get students by faculty assignment ID - MUST be before export
router.get('/enrollments/assignment/:assignmentId/students', getStudentsByAssignment);
router.get('/enrollments/faculty/:facultyId/students', getStudentsByFaculty);

export default router;
