// controllers/prerequisites.controller.js
import * as PrerequisiteService from "../services/prerequisites.service.js";

// GET all prerequisites
export const getAllPrerequisites = async (req, res) => {
  try {
    const prerequisites = await PrerequisiteService.listAllPrerequisites();
    res.json(prerequisites);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch prerequisites", error: err.message });
  }
};

// GET prerequisites by course ID
export const getPrerequisitesByCourse = async (req, res) => {
  try {
    const prerequisites = await PrerequisiteService.listPrerequisitesByCourse(
      req.params.courseId
    );
    res.json(prerequisites);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch prerequisites for course",
      error: err.message,
    });
  }
};

// GET prerequisite by ID
export const getPrerequisiteById = async (req, res) => {
  try {
    const prerequisite = await PrerequisiteService.getPrerequisite(
      req.params.id
    );
    res.json(prerequisite);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

// POST create prerequisite
export const createPrerequisite = async (req, res) => {
  try {
    const newPrerequisite = await PrerequisiteService.addPrerequisite(req.body);
    res.json(newPrerequisite);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to create prerequisite", error: err.message });
  }
};

// PUT update prerequisite
export const updatePrerequisite = async (req, res) => {
  try {
    const updated = await PrerequisiteService.editPrerequisite(
      req.params.id,
      req.body
    );
    res.json(updated);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to update prerequisite", error: err.message });
  }
};

// DELETE prerequisite
export const deletePrerequisite = async (req, res) => {
  try {
    await PrerequisiteService.removePrerequisite(req.params.id);
    res.json({ message: "Prerequisite deleted successfully" });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to delete prerequisite", error: err.message });
  }
};

// DELETE all prerequisites for a course
export const deletePrerequisitesByCourse = async (req, res) => {
  try {
    await PrerequisiteService.removeAllPrerequisitesByCourse(
      req.params.courseId
    );
    res.json({ message: "All prerequisites deleted successfully" });
  } catch (err) {
    res.status(400).json({
      message: "Failed to delete prerequisites",
      error: err.message,
    });
  }
};
