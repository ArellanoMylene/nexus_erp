// services/programs.service.js
import * as programModel from "../model/programs.model.js";

// Get all programs
export const listPrograms = async () => {
  return await programModel.getAllPrograms();
};

// Get single program
export const getProgram = async (id) => {
  const program = await programModel.getProgramById(id);
  if (!program) throw new Error("Program not found");
  return program;
};

// Create new program
export const addProgram = async (data) => {
  // Validate required fields
  if (!data.code || !data.name) {
    throw new Error("Program code and name are required");
  }

  return await programModel.createProgram(data);
};

// Update program
export const editProgram = async (id, data) => {
  // Check if program exists
  const existing = await programModel.getProgramById(id);
  if (!existing) throw new Error("Program not found");

  return await programModel.updateProgram(id, data);
};

// Delete program
export const removeProgram = async (id) => {
  // Check if program exists
  const existing = await programModel.getProgramById(id);
  if (!existing) throw new Error("Program not found");

  return await programModel.deleteProgram(id);
};
