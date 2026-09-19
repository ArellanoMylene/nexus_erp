// controllers/courseTransfers.controller.js
import * as transferService from "../services/courseTransfers.service.js";

export const getAllTransfers = async (req, res) => {
  try {
    const transfers = await transferService.listTransfers();
    res.json(transfers);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to fetch transfers", error: err.message });
  }
};

export const getTransfersByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const transfers = await transferService.listTransfersByStudent(studentId);
    res.json(transfers);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({
        message: "Failed to fetch student transfers",
        error: err.message,
      });
  }
};

export const getTransferById = async (req, res) => {
  try {
    const { id } = req.params;
    const transfer = await transferService.getTransfer(id);
    res.json(transfer);
  } catch (err) {
    console.error(err);
    res.status(404).json({ message: err.message });
  }
};

export const createTransfer = async (req, res) => {
  try {
    const transfer = await transferService.addTransfer(req.body);
    res.status(201).json(transfer);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

export const updateTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const transfer = await transferService.editTransfer(id, req.body);
    res.json(transfer);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

export const deleteTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    await transferService.removeTransfer(id);
    res.json({ message: "Transfer request deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};
