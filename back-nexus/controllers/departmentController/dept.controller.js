import * as departmentService from "../../services/departmentService.js";

// GET /departments
export const getDepartments = async (req, res) => {
  try {
    const data = await departmentService.listDepartments();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /departments/:id
export const getDepartmentById = async (req, res) => {
  try {
    const dept = await departmentService.getDepartment(req.params.id);
    res.json(dept);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

// POST /departments
export const createDepartment = async (req, res) => {
  try {
    const dept = await departmentService.addDepartment(req.body);
    res.status(201).json(dept);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /departments/:id
export const updateDepartment = async (req, res) => {
  try {
    const dept = await departmentService.editDepartment(
      req.params.id,
      req.body
    );
    res.json(dept);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /departments/:id
export const deleteDepartment = async (req, res) => {
  try {
    await departmentService.removeDepartment(req.params.id);
    res.json({ message: "Department deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /departments/eligible-heads
export const eligibleHeads = async (req, res) => {
  try {
    const users = await departmentService.listEligibleHeads();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
