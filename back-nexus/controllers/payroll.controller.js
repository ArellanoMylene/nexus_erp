import Payroll from "../model/payroll.model.js";

// Payroll Setup Controllers
export const getAllPayrollSetups = async (req, res) => {
  const filters = {
    status: req.query.status,
    start_date: req.query.start_date,
    end_date: req.query.end_date,
  };

  try {
    const results = await Payroll.getAllSetups(filters);
    res.json({ success: true, data: results });
  } catch (err) {
    console.error("Error fetching payroll setups:", err);
    res
      .status(500)
      .json({ message: "Error fetching payroll setups", error: err.message });
  }
};

export const getPayrollSetupById = async (req, res) => {
  try {
    const results = await Payroll.getSetupById(req.params.id);
    if (results.length === 0) {
      return res.status(404).json({ message: "Payroll setup not found" });
    }
    res.json({ success: true, data: results[0] });
  } catch (err) {
    console.error("Error fetching payroll setup:", err);
    res
      .status(500)
      .json({ message: "Error fetching payroll setup", error: err.message });
  }
};

export const createPayrollSetup = async (req, res) => {
  try {
    // Map frontend fields to database columns
    const payrollData = {
      payroll_period_start: req.body.start_date,
      payroll_period_end: req.body.end_date,
      pay_date: req.body.pay_date,
      payroll_type: req.body.period_type,
      status: req.body.status || "Draft",
      notes: req.body.notes,
      created_by: req.body.created_by || req.user?.user_id,
    };

    const result = await Payroll.createSetup(payrollData);
    res.status(201).json({
      success: true,
      message: "Payroll setup created successfully",
      payroll_setup_id: result.insertId,
    });
  } catch (err) {
    console.error("Error creating payroll setup:", err);
    res
      .status(500)
      .json({ message: "Error creating payroll setup", error: err.message });
  }
};

export const updatePayrollSetup = async (req, res) => {
  try {
    // Map frontend fields to database columns
    const payrollData = {
      payroll_period_start: req.body.start_date,
      payroll_period_end: req.body.end_date,
      pay_date: req.body.pay_date,
      payroll_type: req.body.period_type,
      status: req.body.status,
      notes: req.body.notes,
    };

    const result = await Payroll.updateSetup(req.params.id, payrollData);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Payroll setup not found" });
    }
    res.json({ success: true, message: "Payroll setup updated successfully" });
  } catch (err) {
    console.error("Error updating payroll setup:", err);
    res
      .status(500)
      .json({ message: "Error updating payroll setup", error: err.message });
  }
};

export const deletePayrollSetup = async (req, res) => {
  try {
    const result = await Payroll.deleteSetup(req.params.id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Payroll setup not found" });
    }
    res.json({ success: true, message: "Payroll setup deleted successfully" });
  } catch (err) {
    console.error("Error deleting payroll setup:", err);
    res
      .status(500)
      .json({ message: "Error deleting payroll setup", error: err.message });
  }
};

// Payslip Controllers
export const getPayslipsBySetup = async (req, res) => {
  try {
    const results = await Payroll.getPayslipsBySetup(req.params.setupId);
    res.json({ success: true, data: results });
  } catch (err) {
    console.error("Error fetching payslips:", err);
    res
      .status(500)
      .json({ message: "Error fetching payslips", error: err.message });
  }
};

export const getPayslipById = async (req, res) => {
  try {
    const results = await Payroll.getPayslipById(req.params.id);
    if (results.length === 0) {
      return res.status(404).json({ message: "Payslip not found" });
    }
    res.json({ success: true, data: results[0] });
  } catch (err) {
    console.error("Error fetching payslip:", err);
    res
      .status(500)
      .json({ message: "Error fetching payslip", error: err.message });
  }
};

export const createPayslip = async (req, res) => {
  try {
    // Get next payslip number
    const results = await Payroll.getNextPayslipNumber();
    const payslipNumber = results[0]?.next_number || "PAY-000001";
    const payslipData = { ...req.body, payslip_number: payslipNumber };

    const result = await Payroll.createPayslip(payslipData);
    res.status(201).json({
      success: true,
      message: "Payslip created successfully",
      payslip_id: result.insertId,
      payslip_number: payslipNumber,
    });
  } catch (err) {
    console.error("Error creating payslip:", err);
    res
      .status(500)
      .json({ message: "Error creating payslip", error: err.message });
  }
};

export const updatePayslip = async (req, res) => {
  try {
    const result = await Payroll.updatePayslip(req.params.id, req.body);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Payslip not found" });
    }
    res.json({ success: true, message: "Payslip updated successfully" });
  } catch (err) {
    console.error("Error updating payslip:", err);
    res
      .status(500)
      .json({ message: "Error updating payslip", error: err.message });
  }
};

export const deletePayslip = async (req, res) => {
  try {
    const result = await Payroll.deletePayslip(req.params.id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Payslip not found" });
    }
    res.json({ success: true, message: "Payslip deleted successfully" });
  } catch (err) {
    console.error("Error deleting payslip:", err);
    res
      .status(500)
      .json({ message: "Error deleting payslip", error: err.message });
  }
};

export const getPayrollSummary = async (req, res) => {
  try {
    const setupId = req.params.setupId;

    const summaryResults = await Payroll.getPayrollSummary(setupId);
    const payslips = await Payroll.getPayslipsBySetup(setupId);
    const responseData = { ...summaryResults[0], payslips };

    res.json({ success: true, data: responseData });
  } catch (err) {
    console.error("Error fetching payroll summary:", err);
    res
      .status(500)
      .json({ message: "Error fetching payroll summary", error: err.message });
  }
};

// Auto-create payslips for all eligible non-student users
export const autoCreatePayslips = async (req, res) => {
  try {
    const setupId = req.params.setupId;
    const skipExisting = req.body.skipExisting !== false;

    // Validate setup exists
    const setupResults = await Payroll.getSetupById(setupId);
    if (!setupResults || setupResults.length === 0) {
      return res.status(404).json({ message: "Payroll setup not found" });
    }

    // Get all users with non-student roles (Admin, Faculty, HR, Accounting, Staff, Employee)
    // This now includes users without employee records
    const usersResults = await Payroll.getAllNonStudentUsers();

    if (!usersResults || usersResults.length === 0) {
      return res.json({
        success: true,
        message: "No eligible users found for payslips",
        created: 0,
        skipped: 0,
      });
    }

    let created = 0;
    let skipped = 0;

    for (const user of usersResults) {
      try {
        // Check if payslip already exists for this user in this setup
        if (skipExisting && user.employee_id) {
          const existingPayslips = await Payroll.checkPayslipExists(
            setupId,
            user.employee_id,
          );
          if (existingPayslips && existingPayslips.length > 0) {
            skipped++;
            continue;
          }
        }

        // Get next payslip number
        const numberResults = await Payroll.getNextPayslipNumber();
        const payslipNumber = numberResults[0]?.next_number || "PAY-000001";

        // Create payslip with default values
        await Payroll.createPayslip({
          payroll_setup_id: setupId,
          employee_id: user.employee_id || null, // May be null for non-employee users
          user_id: user.user_id, // Set user_id directly
          payslip_number: payslipNumber,
          basic_salary: user.basic_salary || 0,
          allowances: user.allowances || 0,
          overtime_pay: 0,
          bonus: 0,
          other_earnings: 0,
          sss_deduction: 0,
          philhealth_deduction: 0,
          pagibig_deduction: 0,
          withholding_tax: 0,
          loan_deduction: 0,
          other_deductions: 0,
          days_worked: 0,
          overtime_hours: 0,
          late_hours: 0,
          absences: 0,
          remarks: "Auto-created for payroll period",
        });

        created++;
      } catch (userErr) {
        console.error(
          `Error creating payslip for user ${user.user_id}:`,
          userErr,
        );
        // Continue with next user
      }
    }

    res.json({
      success: true,
      message: `Auto-created payslips for ${created} employees`,
      created,
      skipped,
      total_users: usersResults.length,
    });
  } catch (err) {
    console.error("Error auto-creating payslips:", err);
    res
      .status(500)
      .json({ message: "Error auto-creating payslips", error: err.message });
  }
};

// Get current user's payslips
export const getMyPayslips = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.user_id;
    console.log("👤 Requesting payslips for user ID:", userId);
    console.log("🔐 User object:", req.user);

    // Get payslips for the current user through their employee record
    const payslips = await Payroll.getPayslipsByUserId(userId);

    console.log("📊 Payslips found:", payslips);
    console.log("✅ Total payslips for user:", payslips.length);

    res.json({ success: true, data: payslips });
  } catch (err) {
    console.error("❌ Error fetching user payslips:", err);
    res
      .status(500)
      .json({ message: "Error fetching payslips", error: err.message });
  }
};

export const getEligibleUsers = async (req, res) => {
  try {
    const users = await Payroll.getAllNonStudentUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    console.error("Error fetching eligible users:", err);
    res
      .status(500)
      .json({ message: "Error fetching eligible users", error: err.message });
  }
};

export default {
  getAllPayrollSetups,
  getPayrollSetupById,
  createPayrollSetup,
  updatePayrollSetup,
  deletePayrollSetup,
  getPayslipsBySetup,
  getPayslipById,
  createPayslip,
  updatePayslip,
  deletePayslip,
  getPayrollSummary,
  autoCreatePayslips,
  getMyPayslips,
  getEligibleUsers,
};
