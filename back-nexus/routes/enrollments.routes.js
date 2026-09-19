// routes/enrollments.routes.js
import express from "express";
import {
  getAllEnrollments,
  getEnrollmentsByStudent,
  getEnrollmentById,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  getStudentsByAssignment,
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
router.get("/enrollments/:id", getEnrollmentById);
router.post("/enrollments", createEnrollment);
router.put("/enrollments/:id", updateEnrollment);
router.delete("/enrollments/:id", deleteEnrollment);

// Get students by faculty assignment ID - MUST be before export
router.get('/enrollments/assignment/:assignmentId/students', getStudentsByAssignment);

export default router;
