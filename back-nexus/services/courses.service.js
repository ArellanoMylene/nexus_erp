// services/courses.service.js
import * as courseModel from "../model/courses.model.js";

// Get all courses
export const listCourses = async () => {
  return await courseModel.getAllCourses();
};

// Get single course
export const getCourse = async (id) => {
  const course = await courseModel.getCourseById(id);
  if (!course) throw new Error("Course not found");
  return course;
};

// Create new course
export const addCourse = async (data) => {
  // Optional: validate instructor_id exists
  if (data.instructor_id) {
    const instructors = await courseModel.getEligibleInstructors();
    const valid = instructors.some(
      (u) => u.user_id === Number(data.instructor_id)
    );
    if (!valid) throw new Error("Invalid instructor");
  }

  return await courseModel.createCourse(data);
};

// Update course
export const editCourse = async (id, data) => {
  if (data.instructor_id) {
    const instructors = await courseModel.getEligibleInstructors();
    const valid = instructors.some(
      (u) => u.user_id === Number(data.instructor_id)
    );
    if (!valid) throw new Error("Invalid instructor");
  }

  return await courseModel.updateCourse(id, data);
};

// Delete course
export const removeCourse = async (id) => {
  return await courseModel.deleteCourse(id);
};

// List all eligible instructors
export const listEligibleInstructors = async () => {
  return await courseModel.getEligibleInstructors();
};
