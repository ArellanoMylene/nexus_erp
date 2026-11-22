import db from "../config/db.js";

export const getHrDashboard = async (req, res) => {
  if (!["admin", "hr"].includes(String(req.user?.role || "").toLowerCase())) {
    return res.status(403).json({ message: "You do not have permission to view the HR dashboard" });
  }

  try {
    const [[employeeCount], [pendingLeaveCount], [processedPayrollCount], [activeDeductionCount], [leaves], [payrolls], [deductions], [upcomingPayrolls]] = await Promise.all([
      db.query("SELECT COUNT(*) AS count FROM users WHERE LOWER(TRIM(role)) <> 'student'"),
      db.query("SELECT COUNT(*) AS count FROM staff_leave WHERE LOWER(TRIM(status)) = 'pending'"),
      db.query("SELECT COUNT(*) AS count FROM payroll_setup WHERE LOWER(TRIM(status)) IN ('processed', 'completed')"),
      db.query("SELECT COUNT(*) AS count FROM deductions WHERE is_active = TRUE"),
      db.query("SELECT leave_id, leave_type, status, created_at FROM staff_leave ORDER BY created_at DESC LIMIT 8"),
      db.query("SELECT payroll_setup_id, payroll_type, status, created_at FROM payroll_setup ORDER BY created_at DESC LIMIT 8"),
      db.query("SELECT deduction_id, deduction_name, deduction_type, created_at FROM deductions ORDER BY created_at DESC LIMIT 8"),
      db.query("SELECT payroll_setup_id, payroll_type, status, pay_date FROM payroll_setup WHERE pay_date >= CURRENT_DATE AND LOWER(TRIM(status)) <> 'cancelled' ORDER BY pay_date ASC LIMIT 5"),
    ]);

    const activities = [
      ...leaves.map((item) => ({ id: `leave-${item.leave_id}`, type: "leave", title: `Leave ${item.status || "request"}`, description: item.leave_type || "Staff leave", timestamp: item.created_at })),
      ...payrolls.map((item) => ({ id: `payroll-${item.payroll_setup_id}`, type: "payroll", title: `Payroll ${item.status || "updated"}`, description: item.payroll_type || "Payroll run", timestamp: item.created_at })),
      ...deductions.map((item) => ({ id: `deduction-${item.deduction_id}`, type: "deduction", title: "Deduction updated", description: item.deduction_name || item.deduction_type || "Employee deduction", timestamp: item.created_at })),
    ].filter((item) => item.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 8);

    res.json({
      success: true,
      data: {
        stats: {
          totalEmployees: Number(employeeCount[0]?.count) || 0,
          pendingLeaves: Number(pendingLeaveCount[0]?.count) || 0,
          payrollsProcessed: Number(processedPayrollCount[0]?.count) || 0,
          deductionRequests: Number(activeDeductionCount[0]?.count) || 0,
        },
        recentActivities: activities,
        upcomingPayrolls,
      },
    });
  } catch (error) {
    console.error("Error fetching HR dashboard data:", error);
    res.status(500).json({ message: "Unable to load HR dashboard data" });
  }
};

export default { getHrDashboard };
