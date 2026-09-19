import EmployeeRecords from "../model/employeeRecords.model.js";

// Get all employee records
export const getAllEmployees = async (req, res) => {
  const filters = {
    department: req.query.department,
    employment_status: req.query.employment_status,
    employment_type: req.query.employment_type,
    search: req.query.search,
  };

  try {
    const results = await EmployeeRecords.getAll(filters);
    res.json({ success: true, data: results });
  } catch (err) {
    console.error("Error fetching employees:", err);
    res
      .status(500)
      .json({ message: "Error fetching employees", error: err.message });
  }
};

// Get employee by ID
export const getEmployeeById = async (req, res) => {
  try {
    const results = await EmployeeRecords.getById(req.params.id);
    if (results.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json({ success: true, data: results[0] });
  } catch (err) {
    console.error("Error fetching employee:", err);
    res
      .status(500)
      .json({ message: "Error fetching employee", error: err.message });
  }
};

// Create employee record
export const createEmployee = async (req, res) => {
  try {
    // Generate employee number
    const employeeNumber = `EMP-${Date.now().toString().slice(-8)}`;
    const employeeData = { ...req.body, employee_number: employeeNumber };

    const result = await EmployeeRecords.create(employeeData);
    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee_id: result.insertId,
    });
  } catch (err) {
    console.error("Error creating employee:", err);
    res
      .status(500)
      .json({ message: "Error creating employee", error: err.message });
  }
};

// Update employee record
export const updateEmployee = async (req, res) => {
  try {
    const result = await EmployeeRecords.update(req.params.id, req.body);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json({ success: true, message: "Employee updated successfully" });
  } catch (err) {
    console.error("Error updating employee:", err);
    res
      .status(500)
      .json({ message: "Error updating employee", error: err.message });
  }
};

// Delete employee record
export const deleteEmployee = async (req, res) => {
  try {
    const result = await EmployeeRecords.delete(req.params.id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json({ success: true, message: "Employee deleted successfully" });
  } catch (err) {
    console.error("Error deleting employee:", err);
    res
      .status(500)
      .json({ message: "Error deleting employee", error: err.message });
  }
};

// Get summary statistics
export const getEmployeeSummary = async (req, res) => {
  try {
    const results = await EmployeeRecords.getSummary();
    res.json({ success: true, data: results[0] });
  } catch (err) {
    console.error("Error fetching summary:", err);
    res
      .status(500)
      .json({ message: "Error fetching summary", error: err.message });
  }
};

// Get employee by user ID
export const getEmployeeByUserId = async (req, res) => {
  try {
    const results = await EmployeeRecords.getByUserId(req.params.userId);
    res.json({ success: true, data: results });
  } catch (err) {
    console.error("Error fetching employee by user ID:", err);
    res
      .status(500)
      .json({ message: "Error fetching employee", error: err.message });
  }
};

export default {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeSummary,
  getEmployeeByUserId,
};
