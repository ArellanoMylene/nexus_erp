// services/courseTransfers.service.js
import * as transferModel from "../model/courseTransfers.model.js";

export const listTransfers = async () => {
  return await transferModel.getAllTransfers();
};

export const listTransfersByStudent = async (studentId) => {
  return await transferModel.getTransfersByStudent(studentId);
};

export const getTransfer = async (id) => {
  const transfer = await transferModel.getTransferById(id);
  if (!transfer) throw new Error("Transfer request not found");
  return transfer;
};

export const addTransfer = async (data) => {
  return await transferModel.createTransfer(data);
};

export const editTransfer = async (id, data) => {
  await getTransfer(id);
  return await transferModel.updateTransfer(id, data);
};

export const removeTransfer = async (id) => {
  await getTransfer(id);
  return await transferModel.deleteTransfer(id);
};
