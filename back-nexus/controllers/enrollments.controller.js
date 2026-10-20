// controllers/enrollments.controller.js
import * as enrollmentService from "../services/enrollments.service.js";

const isStudent = (req) => String(req.user?.role || "").toLowerCase() === "student";
const isAdmin = (req) => String(req.user?.role || "").toLowerCase() === "admin";
const canReviewEnrollments = (req) => ["admin", "faculty", "hr", "accounting"].includes(String(req.user?.role || "").toLowerCase());
const denyEnrollmentAccess = (res) => res.status(403).json({ message: "You do not have permission to access this enrollment" });

// Get all enrollments
export const getAllEnrollments = async (req, res) => {
  try {
    if (!isStudent(req) && !canReviewEnrollments(req)) return denyEnrollmentAccess(res);
    const { course_id, period_id, section_id, student_id, program_id } = req.query;
    const filters = {
      course_id,
      period_id,
      section_id,
      student_id: isStudent(req) ? req.user.userId : student_id,
      program_id,
    };
    const enrollments = await enrollmentService.listEnrollments(filters);
    res.json(enrollments);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to fetch enrollments", error: err.message });
  }
};

// Get enrollments by student
export const getEnrollmentsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (isStudent(req) && String(studentId) !== String(req.user.userId)) return denyEnrollmentAccess(res);
    const enrollments =
      await enrollmentService.listEnrollmentsByStudent(studentId);
    res.json(enrollments);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch student enrollments",
      error: err.message,
    });
  }
};

// Get single enrollment
export const getEnrollmentById = async (req, res) => {
  try {
    if (!isStudent(req) && !canReviewEnrollments(req)) return denyEnrollmentAccess(res);
    const { id } = req.params;
    const enrollment = await enrollmentService.getEnrollment(id);
    if (isStudent(req) && String(enrollment.student_id) !== String(req.user.userId)) return denyEnrollmentAccess(res);
    res.json(enrollment);
  } catch (err) {
    console.error(err);
    res.status(404).json({ message: err.message });
  }
};

// Create new enrollment
export const createEnrollment = async (req, res) => {
  try {
    if (!isStudent(req) && !isAdmin(req)) return denyEnrollmentAccess(res);
    const data = isStudent(req) ? { ...req.body, student_id: req.user.userId } : req.body;
    const isAdminCourseBatch = isAdmin(req) && Array.isArray(data.course_ids);
    const enrollment = isAdminCourseBatch
      ? await enrollmentService.addEnrollments(data)
      : await enrollmentService.addEnrollment(data);
    res.status(201).json(enrollment);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

// Update enrollment
export const updateEnrollment = async (req, res) => {
  try {
    if (!isAdmin(req)) return denyEnrollmentAccess(res);
    const { id } = req.params;
    const enrollment = await enrollmentService.editEnrollment(id, req.body);
    res.json(enrollment);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

// Delete enrollment
export const deleteEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    if (isStudent(req)) {
      const enrollment = await enrollmentService.getEnrollment(id);
      if (String(enrollment.student_id) !== String(req.user.userId)) return denyEnrollmentAccess(res);
    } else if (!isAdmin(req)) {
      return denyEnrollmentAccess(res);
    }
    await enrollmentService.removeEnrollment(id);
    res.json({ message: "Enrollment deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

// Get enrolled students by faculty assignment ID
export const getStudentsByAssignment = async (req, res) => {
  try {
    if (!canReviewEnrollments(req)) return denyEnrollmentAccess(res);
    const { assignmentId } = req.params;
    const students =
      await enrollmentService.listStudentsByAssignment(assignmentId);
    res.json({ success: true, data: students });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch students for assignment",
      error: err.message,
    });
  }
};

// Run sectioning: assigns each student to one section and applies that
// section to the student's matching course enrollments for the period.
export const runSectioning = async (req, res) => {
  try {
    if (!isAdmin(req)) return denyEnrollmentAccess(res);
    const result = await enrollmentService.runSectioning(req.body);
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};
