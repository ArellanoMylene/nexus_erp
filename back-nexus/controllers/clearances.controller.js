// controllers/clearances.controller.js
import * as clearanceService from "../services/clearances.service.js";

export const getAllClearances = async (req, res) => {
  try {
    const clearances = await clearanceService.listClearances();
    res.json(clearances);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to fetch clearances", error: err.message });
  }
};

export const getClearancesByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const clearances = await clearanceService.listClearancesByStudent(
      studentId
    );
    res.json(clearances);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch student clearances",
      error: err.message,
    });
  }
};

export const getClearanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const clearance = await clearanceService.getClearance(id);
    res.json(clearance);
  } catch (err) {
    console.error(err);
    res.status(404).json({ message: err.message });
  }
};

export const createClearance = async (req, res) => {
  try {
    const clearance = await clearanceService.addClearance(req.body);
    res.status(201).json(clearance);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

export const updateClearance = async (req, res) => {
  try {
    const { id } = req.params;
    const clearance = await clearanceService.editClearance(id, req.body);
    res.json(clearance);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

export const deleteClearance = async (req, res) => {
  try {
    const { id } = req.params;
    await clearanceService.removeClearance(id);
    res.json({ message: "Clearance deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};
