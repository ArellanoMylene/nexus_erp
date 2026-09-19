import ReportsService from "../services/reports.service.js";

// Get Student Reports with filters
export const getStudentReports = async (req, res) => {
  try {
    const filters = {
      program_id: req.query.program_id,
      year_level: req.query.year_level,
      status: req.query.status,
      search: req.query.search,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
    };

    const students = await ReportsService.getStudentReports(filters);
    res.json({ success: true, data: students });
  } catch (error) {
    console.error("Error fetching student reports:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Enrollment Reports
export const getEnrollmentReports = async (req, res) => {
  try {
    const filters = {
      academic_period_id: req.query.academic_period_id,
      program_id: req.query.program_id,
      status: req.query.status,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
    };

    const enrollments = await ReportsService.getEnrollmentReports(filters);
    res.json({ success: true, data: enrollments });
  } catch (error) {
    console.error("Error fetching enrollment reports:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Enrollment Trends + Forecast
export const getEnrollmentTrends = async (req, res) => {
  try {
    const filters = {
      program_id: req.query.program_id,
      program_code: req.query.program_code,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
    };

    const trends = await ReportsService.getEnrollmentTrends(filters);
    res.json({ success: true, data: trends });
  } catch (error) {
    console.error("Error fetching enrollment trends:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Enrollment by Program
export const getEnrollmentByProgram = async (req, res) => {
  try {
    const filters = {
      program_id: req.query.program_id,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      status: req.query.status,
    };

    const enrollmentByProgram = await ReportsService.getEnrollmentByProgram(filters);
    res.json({ success: true, data: enrollmentByProgram });
  } catch (error) {
    console.error("Error fetching enrollment by program:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Attendance Reports
export const getAttendanceReports = async (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      status: req.query.status,
      section_id: req.query.section_id,
      department: req.query.department,
    };

    if (!filters.type) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid type. Use 'student' or 'staff'" 
      });
    }

    const attendance = await ReportsService.getAttendanceReports(filters);
    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error("Error fetching attendance reports:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get HR & Payroll Reports
export const getPayrollReports = async (req, res) => {
  try {
    const filters = {
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      department: req.query.department,
      status: req.query.status,
    };

    const payroll = await ReportsService.getPayrollReports(filters);
    res.json({ success: true, data: payroll });
  } catch (error) {
    console.error("Error fetching payroll reports:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Summary Statistics
export const getSummaryStatistics = async (req, res) => {
  try {
    const statistics = await ReportsService.getSummaryStatistics();
    res.json({ success: true, data: statistics });
  } catch (error) {
    console.error("Error fetching summary statistics:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export report data (returns formatted data for CSV/Excel export)
export const exportReport = async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'csv', ...filters } = req.query;

    const result = await ReportsService.exportReport(type, filters, format);
    res.json({ success: true, data: result.data, format: result.format });
  } catch (error) {
    console.error("Error exporting report:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
