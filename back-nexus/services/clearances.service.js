// services/clearances.service.js
import * as clearanceModel from "../model/clearances.model.js";

export const listClearances = async () => {
  return await clearanceModel.getAllClearances();
};

export const listClearancesByStudent = async (studentId) => {
  return await clearanceModel.getClearancesByStudent(studentId);
};

export const getClearance = async (id) => {
  const clearance = await clearanceModel.getClearanceById(id);
  if (!clearance) throw new Error("Clearance record not found");
  return clearance;
};

export const addClearance = async (data) => {
  const exists = await clearanceModel.checkClearanceExists(
    data.student_id,
    data.period_id
  );
  if (exists) {
    throw new Error("Clearance already exists for this student and period");
  }
  return await clearanceModel.createClearance(data);
};

export const editClearance = async (id, data) => {
  await getClearance(id);
  return await clearanceModel.updateClearance(id, data);
};

export const removeClearance = async (id) => {
  await getClearance(id);
  return await clearanceModel.deleteClearance(id);
};
