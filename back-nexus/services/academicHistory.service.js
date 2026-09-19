// services/academicHistory.service.js
import * as historyModel from "../model/academicHistory.model.js";

export const listAcademicHistory = async () => {
  return await historyModel.getAllAcademicHistory();
};

export const listHistoryByStudent = async (studentId) => {
  return await historyModel.getHistoryByStudent(studentId);
};

export const getHistory = async (id) => {
  const history = await historyModel.getHistoryById(id);
  if (!history) throw new Error("Academic history record not found");
  return history;
};

export const addHistory = async (data) => {
  const exists = await historyModel.checkHistoryExists(
    data.student_id,
    data.period_id
  );
  if (exists) {
    throw new Error(
      "Academic history already exists for this student and period"
    );
  }
  return await historyModel.createHistory(data);
};

export const editHistory = async (id, data) => {
  await getHistory(id);
  return await historyModel.updateHistory(id, data);
};

export const removeHistory = async (id) => {
  await getHistory(id);
  return await historyModel.deleteHistory(id);
};
