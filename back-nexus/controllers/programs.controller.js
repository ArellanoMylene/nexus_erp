// controllers/programs.controller.js
import * as ProgramService from "../services/programs.service.js";

// GET all programs
export const getAllPrograms = async (req, res) => {
  try {
    const programs = await ProgramService.listPrograms();
    res.json(programs);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch programs", error: err.message });
  }
};

// GET program by ID
export const getProgramById = async (req, res) => {
  try {
    const program = await ProgramService.getProgram(req.params.id);
    res.json(program);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

// POST create program
export const createProgram = async (req, res) => {
  try {
    console.log("Creating program:", req.body);
    const newProgram = await ProgramService.addProgram(req.body);
    res.json(newProgram);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to create program", error: err.message });
  }
};

// PUT update program
export const updateProgram = async (req, res) => {
  try {
    const updated = await ProgramService.editProgram(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to update program", error: err.message });
  }
};

// DELETE program
export const deleteProgram = async (req, res) => {
  try {
    await ProgramService.removeProgram(req.params.id);
    res.json({ message: "Program deleted successfully" });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to delete program", error: err.message });
  }
};
