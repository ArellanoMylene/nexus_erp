import * as departmentModel from "../model/departmentModel.js";

// Get all departments
export const listDepartments = async () => {
  return await departmentModel.getAllDepartments();
};

// Get department by ID
export const getDepartment = async (id) => {
  const dept = await departmentModel.getDepartmentById(id);
  if (!dept) throw new Error("Department not found");
  return dept;
};

// Create department
export const addDepartment = async (data) => {
  // Optional: validate head_user_id exists and has correct role
  if (data.head_user_id) {
    const eligibleHeads = await departmentModel.getEligibleHeads();
    const valid = eligibleHeads.some(
      (u) => u.user_id === Number(data.head_user_id)
    );
    if (!valid) throw new Error("Invalid department head");
  }
  return await departmentModel.createDepartment(data);
};

// Update department
export const editDepartment = async (id, data) => {
  if (data.head_user_id) {
    const eligibleHeads = await departmentModel.getEligibleHeads();
    const valid = eligibleHeads.some(
      (u) => u.user_id === Number(data.head_user_id)
    );
    if (!valid) throw new Error("Invalid department head");
  }
  return await departmentModel.updateDepartment(id, data);
};

// Delete department
export const removeDepartment = async (id) => {
  return await departmentModel.deleteDepartment(id);
};

// List eligible heads
export const listEligibleHeads = async () => {
  return await departmentModel.getEligibleHeads();
};
