// controllers/academicPeriods.controller.js
import * as AcademicPeriodService from "../services/academicPeriods.service.js";

// GET all academic periods
export const getAllAcademicPeriods = async (req, res) => {
  try {
    const periods = await AcademicPeriodService.listAcademicPeriods();
    res.json(periods);
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Failed to fetch academic periods",
        error: err.message,
      });
  }
};

// GET academic period by ID
export const getAcademicPeriodById = async (req, res) => {
  try {
    const period = await AcademicPeriodService.getAcademicPeriod(req.params.id);
    res.json(period);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

// GET active academic period
export const getActivePeriod = async (req, res) => {
  try {
    const period = await AcademicPeriodService.getActivePeriod();
    res.json(period);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

// POST create academic period
export const createAcademicPeriod = async (req, res) => {
  try {
    console.log("Creating academic period:", req.body);
    const newPeriod = await AcademicPeriodService.addAcademicPeriod(req.body);
    res.json(newPeriod);
  } catch (err) {
    res
      .status(400)
      .json({
        message: "Failed to create academic period",
        error: err.message,
      });
  }
};

// PUT update academic period
export const updateAcademicPeriod = async (req, res) => {
  try {
    const updated = await AcademicPeriodService.editAcademicPeriod(
      req.params.id,
      req.body
    );
    res.json(updated);
  } catch (err) {
    res
      .status(400)
      .json({
        message: "Failed to update academic period",
        error: err.message,
      });
  }
};

// DELETE academic period
export const deleteAcademicPeriod = async (req, res) => {
  try {
    await AcademicPeriodService.removeAcademicPeriod(req.params.id);
    res.json({ message: "Academic period deleted successfully" });
  } catch (err) {
    res
      .status(400)
      .json({
        message: "Failed to delete academic period",
        error: err.message,
      });
  }
};

// POST set active period
export const setActivePeriod = async (req, res) => {
  try {
    const period = await AcademicPeriodService.activatePeriod(req.params.id);
    res.json(period);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to set active period", error: err.message });
  }
};
