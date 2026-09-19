// controllers/enrollments.controller.js
import * as enrollmentService from "../services/enrollments.service.js";

// Get all enrollments
export const getAllEnrollments = async (req, res) => {
  try {
    const { course_id, period_id, section_id, student_id, program_id } = req.query;
    const filters = { course_id, period_id, section_id, student_id, program_id };
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
    const { id } = req.params;
    const enrollment = await enrollmentService.getEnrollment(id);
    res.json(enrollment);
  } catch (err) {
    console.error(err);
    res.status(404).json({ message: err.message });
  }
};

// Create new enrollment
export const createEnrollment = async (req, res) => {
  try {
    const enrollment = await enrollmentService.addEnrollment(req.body);
    res.status(201).json(enrollment);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

// Update enrollment
export const updateEnrollment = async (req, res) => {
  try {
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

// Run sectioning: takes every enrolled-but-unsectioned student in a
// course/period and spreads them across that period's sections, evenly.
export const runSectioning = async (req, res) => {
  try {
    const result = await enrollmentService.runSectioning(req.body);
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};