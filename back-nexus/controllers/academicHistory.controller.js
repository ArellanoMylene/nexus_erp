/* // controllers/academicHistory.controller.js
import * as historyService from "../services/academicHistory.service.js";

export const getAllAcademicHistory = async (req, res) => {
  try {
    const history = await historyService.listAcademicHistory();
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch academic history",
      error: err.message,
    });
  }
};

export const getHistoryByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const history = await historyService.listHistoryByStudent(studentId);
    res.json(history);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to fetch student history", error: err.message });
  }
};

export const getHistoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await historyService.getHistory(id);
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(404).json({ message: err.message });
  }
};

export const createHistory = async (req, res) => {
  try {
    const history = await historyService.addHistory(req.body);
    res.status(201).json(history);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

export const updateHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await historyService.editHistory(id, req.body);
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

export const deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;
    await historyService.removeHistory(id);
    res.json({ message: "Academic history deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};
 */
// controllers/academicHistory.controller.js
import * as historyService from "../services/academicHistory.service.js";

export const getAllAcademicHistory = async (req, res) => {
  try {
    const history = await historyService.listAcademicHistory();
    res.status(200).json({ success: true, data: history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch academic history" });
  }
};

export const getHistoryByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const history = await historyService.listHistoryByStudent(studentId);
    res.status(200).json({ success: true, data: history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch student history" });
  }
};

export const getHistoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await historyService.getHistory(id);
    res.status(200).json({ success: true, data: history });
  } catch (err) {
    console.error(err);
    res.status(404).json({ success: false, message: err.message });
  }
};

export const createHistory = async (req, res) => {
  try {
    // req.body already validated & sanitized by Zod middleware
    const history = await historyService.addHistory(req.body);
    res.status(201).json({ success: true, message: "Academic history created successfully", data: history });
  } catch (err) {
    console.error(err);
    const statusCode = err.message.includes("already exists") ? 409 : 400;
    res.status(statusCode).json({ success: false, message: err.message });
  }
};

export const updateHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await historyService.editHistory(id, req.body);
    res.status(200).json({ success: true, message: "Academic history updated successfully", data: history });
  } catch (err) {
    console.error(err);
    const statusCode = err.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({ success: false, message: err.message });
  }
};

export const deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;
    await historyService.removeHistory(id);
    res.status(200).json({ success: true, message: "Academic history deleted successfully" });
  } catch (err) {
    console.error(err);
    const statusCode = err.message.includes("not found") ? 404 : 400;
    res.status(400).json({ success: false, message: err.message });
  }
};