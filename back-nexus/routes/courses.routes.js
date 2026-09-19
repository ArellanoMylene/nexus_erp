// routes/courses.routes.js
import express from "express";
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getEligibleInstructors,
} from "../controllers/coursemanagement.controller.js";

const router = express.Router();

router.get("/courses", getAllCourses);
router.get("/courses/:id", getCourseById);
router.post("/courses", createCourse);
router.put("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);

// optional
router.get("/eligible/instructors", getEligibleInstructors);

export default router;
