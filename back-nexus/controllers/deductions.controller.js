import Deductions from "../model/deductions.model.js";

// Get all deductions
export const getAllDeductions = (req, res) => {
  const filters = {
    employee_id: req.query.employee_id,
    deduction_type: req.query.deduction_type,
    is_active: req.query.is_active,
  };

  Deductions.getAll(filters, (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error fetching deductions", error: err });
    }
    res.json({ success: true, data: results });
  });
};

// Get deduction by ID
export const getDeductionById = (req, res) => {
  Deductions.getById(req.params.id, (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error fetching deduction", error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "Deduction not found" });
    }
    res.json({ success: true, data: results[0] });
  });
};

// Get deductions by employee
export const getDeductionsByEmployee = (req, res) => {
  Deductions.getByEmployee(req.params.employeeId, (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error fetching employee deductions", error: err });
    }
    res.json({ success: true, data: results });
  });
};

// Create deduction
export const createDeduction = (req, res) => {
  Deductions.create(req.body, (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error creating deduction", error: err });
    }
    res.status(201).json({
      success: true,
      message: "Deduction created successfully",
      deduction_id: result.insertId,
    });
  });
};

// Update deduction
export const updateDeduction = (req, res) => {
  Deductions.update(req.params.id, req.body, (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error updating deduction", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Deduction not found" });
    }
    res.json({ success: true, message: "Deduction updated successfully" });
  });
};

// Update deduction balance
export const updateDeductionBalance = (req, res) => {
  const { remaining_balance } = req.body;

  Deductions.updateBalance(req.params.id, remaining_balance, (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error updating balance", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Deduction not found" });
    }
    res.json({ success: true, message: "Balance updated successfully" });
  });
};

// Delete deduction
export const deleteDeduction = (req, res) => {
  Deductions.delete(req.params.id, (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error deleting deduction", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Deduction not found" });
    }
    res.json({ success: true, message: "Deduction deleted successfully" });
  });
};

// Get deduction summary
export const getDeductionSummary = (req, res) => {
  Deductions.getSummary((err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error fetching summary", error: err });
    }
    res.json({ success: true, data: results[0] });
  });
};

export default {
  getAllDeductions,
  getDeductionById,
  getDeductionsByEmployee,
  createDeduction,
  updateDeduction,
  updateDeductionBalance,
  deleteDeduction,
  getDeductionSummary,
};
