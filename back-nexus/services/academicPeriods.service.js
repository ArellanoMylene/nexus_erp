// services/academicPeriods.service.js
import * as academicPeriodModel from "../model/academicPeriods.model.js";

// Get all academic periods
export const listAcademicPeriods = async () => {
  return await academicPeriodModel.getAllAcademicPeriods();
};

// Get single academic period
export const getAcademicPeriod = async (id) => {
  const period = await academicPeriodModel.getAcademicPeriodById(id);
  if (!period) throw new Error("Academic period not found");
  return period;
};

// Get active period
export const getActivePeriod = async () => {
  const period = await academicPeriodModel.getActiveAcademicPeriod();
  if (!period) throw new Error("No active academic period found");
  return period;
};

// Create new academic period
export const addAcademicPeriod = async (data) => {
  // Validate required fields
  if (
    !data.school_year ||
    !data.semester ||
    !data.start_date ||
    !data.end_date
  ) {
    throw new Error(
      "School year, semester, start date, and end date are required"
    );
  }

  // Validate date range
  if (new Date(data.start_date) >= new Date(data.end_date)) {
    throw new Error("End date must be after start date");
  }

  return await academicPeriodModel.createAcademicPeriod(data);
};

// Update academic period
export const editAcademicPeriod = async (id, data) => {
  // Check if period exists
  const existing = await academicPeriodModel.getAcademicPeriodById(id);
  if (!existing) throw new Error("Academic period not found");

  // Validate date range if dates are being updated
  if (data.start_date && data.end_date) {
    if (new Date(data.start_date) >= new Date(data.end_date)) {
      throw new Error("End date must be after start date");
    }
  }

  return await academicPeriodModel.updateAcademicPeriod(id, data);
};

// Delete academic period
export const removeAcademicPeriod = async (id) => {
  // Check if period exists
  const existing = await academicPeriodModel.getAcademicPeriodById(id);
  if (!existing) throw new Error("Academic period not found");

  // Prevent deletion of active period
  if (existing.is_active) {
    throw new Error("Cannot delete active academic period");
  }

  return await academicPeriodModel.deleteAcademicPeriod(id);
};

// Set active period
export const activatePeriod = async (id) => {
  // Check if period exists
  const existing = await academicPeriodModel.getAcademicPeriodById(id);
  if (!existing) throw new Error("Academic period not found");

  return await academicPeriodModel.setActivePeriod(id);
};
