import StaffLeave from "../model/staffLeave.model.js";
import EmployeeRecords from "../model/employeeRecords.model.js";

const isHr = (req) => ["admin", "hr"].includes(String(req.user?.role || "").toLowerCase());
const canRequestLeave = (req) => ["staff", "faculty", "employee", "accounting"].includes(String(req.user?.role || "").toLowerCase());
const denyLeave = (res) => res.status(403).json({ message: "You do not have permission to access this leave request" });
const getCurrentEmployeeId = async (req) => {
  const rows = await EmployeeRecords.getByUserId(req.user.userId || req.user.user_id);
  return rows?.[0]?.employee_id ?? null;
};

// Get all leave requests
export const getAllLeaveRequests = async (req, res) => {
  if (!isHr(req) && !canRequestLeave(req)) return denyLeave(res);
  try {
    const filters = {
      employee_id: isHr(req) ? req.query.employee_id : await getCurrentEmployeeId(req),
      status: req.query.status,
      leave_type: req.query.leave_type,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
    };
    const results = await StaffLeave.getAll(filters);
    res.json({ success: true, data: results });
  } catch (err) {
    console.error("Error fetching leave requests:", err);
    res
      .status(500)
      .json({ message: "Error fetching leave requests", error: err.message });
  }
};

// Get leave request by ID
export const getLeaveById = async (req, res) => {
  try {
    const results = await StaffLeave.getById(req.params.id);
    if (results.length === 0) {
      return res.status(404).json({ message: "Leave request not found" });
    }
    if (!isHr(req) && (!canRequestLeave(req) || String(results[0].employee_id) !== String(await getCurrentEmployeeId(req)))) {
      return denyLeave(res);
    }
    res.json({ success: true, data: results[0] });
  } catch (err) {
    console.error("Error fetching leave request:", err);
    res
      .status(500)
      .json({ message: "Error fetching leave request", error: err.message });
  }
};

// Create leave request
export const createLeaveRequest = async (req, res) => {
  try {
    // user_id from form (admin selecting an employee) or logged-in user
    if (!isHr(req) && !canRequestLeave(req)) return denyLeave(res);
    const userId = isHr(req) ? (req.body.user_id || req.user.userId) : req.user.userId;

    // Look up employee record by user_id
    let employees = await EmployeeRecords.getByUserId(userId);

    // Auto-create employee record if not found (every staff user is an employee)
    if (!employees || employees.length === 0) {
      const employeeNumber = `EMP-${Date.now().toString().slice(-8)}`;
      await EmployeeRecords.create({
        user_id: userId,
        employee_number: employeeNumber,
        department: "",
        position: "",
        employment_type: "Full-time",
        employment_status: "Active",
        hire_date: new Date().toISOString().split("T")[0],
        basic_salary: 0,
        allowances: 0,
      });
      employees = await EmployeeRecords.getByUserId(userId);
    }

    const employeeId = employees[0].employee_id;

    const leaveData = {
      ...req.body,
      employee_id: employeeId,
    };

    const result = await StaffLeave.create(leaveData);
    res.status(201).json({
      success: true,
      message: "Leave request created successfully",
      leave_id: result.insertId,
    });
  } catch (err) {
    console.error("Error creating leave request:", err);
    res
      .status(500)
      .json({ message: "Error processing leave request", error: err.message });
  }
};

// Update leave request
export const updateLeaveRequest = async (req, res) => {
  try {
    let leaveData = req.body;
    if (!isHr(req)) {
      if (!canRequestLeave(req)) return denyLeave(res);
      const rows = await StaffLeave.getById(req.params.id);
      const leave = rows?.[0];
      if (!leave || String(leave.employee_id) !== String(await getCurrentEmployeeId(req))) return denyLeave(res);
      if (String(leave.status).toLowerCase() !== "pending") {
        return res.status(409).json({ message: "Only pending leave requests can be edited" });
      }
      leaveData = { ...req.body, status: "Pending" };
    }
    const result = await StaffLeave.update(req.params.id, leaveData);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Leave request not found" });
    }
    res.json({ success: true, message: "Leave request updated successfully" });
  } catch (err) {
    console.error("Error updating leave request:", err);
    res
      .status(500)
      .json({ message: "Error updating leave request", error: err.message });
  }
};

// Approve leave request
export const approveLeave = async (req, res) => {
  if (!isHr(req)) return denyLeave(res);
  const approvedBy = req.user?.userId || req.user?.user_id;

  try {
    const result = await StaffLeave.approve(req.params.id, approvedBy);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Leave request not found" });
    }
    res.json({ success: true, message: "Leave request approved successfully" });
  } catch (err) {
    console.error("Error approving leave request:", err);
    res
      .status(500)
      .json({ message: "Error approving leave request", error: err.message });
  }
};

// Reject leave request
export const rejectLeave = async (req, res) => {
  if (!isHr(req)) return denyLeave(res);
  const approvedBy = req.user?.userId || req.user?.user_id;
  const rejectionReason = req.body.rejection_reason;

  try {
    const result = await StaffLeave.reject(
      req.params.id,
      approvedBy,
      rejectionReason
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Leave request not found" });
    }
    res.json({
      success: true,
      message: "Leave request rejected successfully",
    });
  } catch (err) {
    console.error("Error rejecting leave request:", err);
    res
      .status(500)
      .json({ message: "Error rejecting leave request", error: err.message });
  }
};

// Delete leave request
export const deleteLeaveRequest = async (req, res) => {
  try {
    if (!isHr(req)) {
      if (!canRequestLeave(req)) return denyLeave(res);
      const rows = await StaffLeave.getById(req.params.id);
      const leave = rows?.[0];
      if (!leave || String(leave.employee_id) !== String(await getCurrentEmployeeId(req))) return denyLeave(res);
      if (String(leave.status).toLowerCase() !== "pending") {
        return res.status(409).json({ message: "Only pending leave requests can be deleted" });
      }
    }
    const result = await StaffLeave.delete(req.params.id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Leave request not found" });
    }
    res.json({ success: true, message: "Leave request deleted successfully" });
  } catch (err) {
    console.error("Error deleting leave request:", err);
    res
      .status(500)
      .json({ message: "Error deleting leave request", error: err.message });
  }
};

// Get leave summary
export const getLeaveSummary = async (req, res) => {
  if (!isHr(req)) return denyLeave(res);
  const filters = {
    start_date: req.query.start_date,
    end_date: req.query.end_date,
  };

  try {
    const results = await StaffLeave.getSummary(filters);
    res.json({ success: true, data: results[0] });
  } catch (err) {
    console.error("Error fetching summary:", err);
    res
      .status(500)
      .json({ message: "Error fetching summary", error: err.message });
  }
};

export default {
  getAllLeaveRequests,
  getLeaveById,
  createLeaveRequest,
  updateLeaveRequest,
  approveLeave,
  rejectLeave,
  deleteLeaveRequest,
  getLeaveSummary,
};
