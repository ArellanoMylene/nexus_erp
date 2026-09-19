// controllers/courses.controller.js
import * as CourseService from "../services/courses.service.js";
const CoursesController = {
  async getAllCourses(req, res) {
    try {
      const courses = await pool.query(`
        SELECT 
          c.course_id AS id,
          c.code,
          c.title,
          c.description,
          c.department_id,
          c.credits,
          c.status
        FROM courses c
        WHERE c.status = 'Active' OR c.status = 'active'
        ORDER BY c.code ASC
      `);

      res.status(200).json({
        success: true,
        data: courses[0],
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async getCourseById(req, res) {
    try {
      const [course] = await pool.query(
        "SELECT * FROM courses WHERE course_id = ?",
        [req.params.id],
      );

      if (!course[0]) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }

      res.status(200).json({
        success: true,
        data: course[0],
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};

// GET all courses
export const getAllCourses = async (req, res) => {
  try {
    const courses = await CourseService.listCourses();
    res.json(courses);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch courses", error: err.message });
  }
};

// GET course by ID
export const getCourseById = async (req, res) => {
  try {
    const course = await CourseService.getCourse(req.params.id);
    res.json(course);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

// POST create course
export const createCourse = async (req, res) => {
  try {
    console.log(req.body);
    const newCourse = await CourseService.addCourse(req.body);
    res.json(newCourse);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to create course", error: err.message });
  }
};

// PUT update course
export const updateCourse = async (req, res) => {
  try {
    const updated = await CourseService.editCourse(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to update course", error: err.message });
  }
};

// DELETE course
export const deleteCourse = async (req, res) => {
  try {
    await CourseService.removeCourse(req.params.id);
    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to delete course", error: err.message });
  }
};

// GET eligible instructors
export const getEligibleInstructors = async (req, res) => {
  try {
    const instructors = await CourseService.listEligibleInstructors();
    res.json(instructors);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch instructors", error: err.message });
  }
};
