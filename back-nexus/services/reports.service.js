import ReportsModel from "../model/reports.model.js";

const ReportsService = {
  // Get student reports
  async getStudentReports(filters) {
    try {
      return await ReportsModel.getStudentReports(filters);
    } catch (error) {
      throw new Error(`Error fetching student reports: ${error.message}`);
    }
  },

  // Get enrollment reports
  async getEnrollmentReports(filters) {
    try {
      return await ReportsModel.getEnrollmentReports(filters);
    } catch (error) {
      throw new Error(`Error fetching enrollment reports: ${error.message}`);
    }
  },

  // Get enrollment trends and forecast
  async getEnrollmentTrends(filters) {
    try {
      return await ReportsModel.getEnrollmentTrends(filters);
    } catch (error) {
      throw new Error(`Error fetching enrollment trends: ${error.message}`);
    }
  },

  // Get enrollment by program
  async getEnrollmentByProgram(filters) {
    try {
      return await ReportsModel.getEnrollmentByProgram(filters);
    } catch (error) {
      throw new Error(`Error fetching enrollment by program: ${error.message}`);
    }
  },

  // Get attendance reports
  async getAttendanceReports(filters) {
    try {
      return await ReportsModel.getAttendanceReports(filters);
    } catch (error) {
      throw new Error(`Error fetching attendance reports: ${error.message}`);
    }
  },

  // Get payroll reports
  async getPayrollReports(filters) {
    try {
      return await ReportsModel.getPayrollReports(filters);
    } catch (error) {
      throw new Error(`Error fetching payroll reports: ${error.message}`);
    }
  },

  // Get summary statistics
  async getSummaryStatistics() {
    try {
      return await ReportsModel.getSummaryStatistics();
    } catch (error) {
      throw new Error(`Error fetching summary statistics: ${error.message}`);
    }
  },

  // Get report templates
  async getReportTemplates() {
    try {
      return await ReportsModel.getReportTemplates();
    } catch (error) {
      throw new Error(`Error fetching report templates: ${error.message}`);
    }
  },

  // Create saved report
  async createSavedReport(data) {
    try {
      const reportId = await ReportsModel.createSavedReport(data);
      return { report_id: reportId, message: "Report saved successfully" };
    } catch (error) {
      throw new Error(`Error saving report: ${error.message}`);
    }
  },

  // Get saved reports
  async getSavedReports(filters) {
    try {
      return await ReportsModel.getSavedReports(filters);
    } catch (error) {
      throw new Error(`Error fetching saved reports: ${error.message}`);
    }
  },

  // Create export log
  async createExportLog(data) {
    try {
      const exportId = await ReportsModel.createExportLog(data);
      return { export_id: exportId, message: "Export logged successfully" };
    } catch (error) {
      throw new Error(`Error logging export: ${error.message}`);
    }
  },

  // Export report data
  async exportReport(type, filters, format) {
    try {
      let data = [];

      switch (type) {
        case "students":
          data = await ReportsModel.getStudentReports(filters);
          break;
        case "enrollments":
          data = await ReportsModel.getEnrollmentReports(filters);
          break;
        case "attendance":
          data = await ReportsModel.getAttendanceReports(filters);
          break;
        case "payroll":
          data = await ReportsModel.getPayrollReports(filters);
          break;
        default:
          throw new Error("Invalid report type");
      }

      return { data, format };
    } catch (error) {
      throw new Error(`Error exporting report: ${error.message}`);
    }
  },
};

export default ReportsService;
