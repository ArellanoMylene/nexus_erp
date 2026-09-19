// services/prerequisites.service.js
import * as prerequisiteModel from "../model/prerequisites.model.js";

// Get all prerequisites for a specific course
export const listPrerequisitesByCourse = async (courseId) => {
  return await prerequisiteModel.getPrerequisitesByCourse(courseId);
};

// Get all prerequisites
export const listAllPrerequisites = async () => {
  return await prerequisiteModel.getAllPrerequisites();
};

// Get single prerequisite
export const getPrerequisite = async (id) => {
  const prerequisite = await prerequisiteModel.getPrerequisiteById(id);
  if (!prerequisite) throw new Error("Prerequisite not found");
  return prerequisite;
};

// Create new prerequisite
export const addPrerequisite = async (data) => {
  // Validate required fields
  if (!data.course_id || !data.prereq_course_id) {
    throw new Error("Course ID and Prerequisite Course ID are required");
  }

  // Check if course is trying to be its own prerequisite
  if (data.course_id === data.prereq_course_id) {
    throw new Error("A course cannot be its own prerequisite");
  }

  // Check if prerequisite already exists
  const exists = await prerequisiteModel.checkPrerequisiteExists(
    data.course_id,
    data.prereq_course_id
  );
  if (exists) {
    throw new Error("This prerequisite already exists");
  }

  return await prerequisiteModel.createPrerequisite(data);
};

// Update prerequisite
export const editPrerequisite = async (id, data) => {
  // Check if prerequisite exists
  const existing = await prerequisiteModel.getPrerequisiteById(id);
  if (!existing) throw new Error("Prerequisite not found");

  // Check if course is trying to be its own prerequisite
  if (data.course_id === data.prereq_course_id) {
    throw new Error("A course cannot be its own prerequisite");
  }

  return await prerequisiteModel.updatePrerequisite(id, data);
};

// Delete prerequisite
export const removePrerequisite = async (id) => {
  // Check if prerequisite exists
  const existing = await prerequisiteModel.getPrerequisiteById(id);
  if (!existing) throw new Error("Prerequisite not found");

  return await prerequisiteModel.deletePrerequisite(id);
};

// Delete all prerequisites for a course
export const removeAllPrerequisitesByCourse = async (courseId) => {
  return await prerequisiteModel.deletePrerequisitesByCourse(courseId);
};
