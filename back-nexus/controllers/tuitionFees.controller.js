import TuitionFee from "../model/tuitionFees.model.js";
import Invoice from "../model/invoices.model.js";

const tuitionFeeController = {
  // Create new tuition fee setup
  createTuitionFee: async (req, res) => {
    try {
      const data = {
        ...req.body,
        created_by: req.user.user_id,
      };

      const result = await TuitionFee.create(data);

      res.status(201).json({
        success: true,
        message: "Tuition fee setup created successfully",
        data: { fee_setup_id: result.insertId },
      });
    } catch (err) {
      console.error("Error creating tuition fee:", err);
      res.status(500).json({
        success: false,
        message: "Failed to create tuition fee setup",
        error: err.message,
      });
    }
  },

  // Get all tuition fees
  getAllTuitionFees: async (req, res) => {
    try {
      const filters = {
        program_id: req.query.program_id,
        academic_period_id: req.query.academic_period_id,
        year_level: req.query.year_level,
        is_active: req.query.is_active,
      };

      const results = await TuitionFee.getAll(filters);

      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (err) {
      console.error("Error fetching tuition fees:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch tuition fees",
        error: err.message,
      });
    }
  },

  // Get tuition fee by ID
  getTuitionFeeById: async (req, res) => {
    try {
      const { id } = req.params;

      const results = await TuitionFee.getById(id);

      if (!results || results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Tuition fee setup not found",
        });
      }

      res.status(200).json({
        success: true,
        data: results[0],
      });
    } catch (err) {
      console.error("Error fetching tuition fee:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch tuition fee",
        error: err.message,
      });
    }
  },

  // Get fee for specific criteria
  getFeeByDetails: async (req, res) => {
    try {
      const { program_id, year_level, academic_period_id } = req.query;

      if (!program_id || !year_level || !academic_period_id) {
        return res.status(400).json({
          success: false,
          message:
            "program_id, year_level, and academic_period_id are required",
        });
      }

      const results = await TuitionFee.getFeeByDetails(
        program_id,
        year_level,
        academic_period_id,
      );

      if (!results || results.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "No active tuition fee setup found for the specified criteria",
        });
      }

      res.status(200).json({
        success: true,
        data: results[0],
      });
    } catch (err) {
      console.error("Error fetching tuition fee by details:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch tuition fee",
        error: err.message,
      });
    }
  },

  // Update tuition fee
  updateTuitionFee: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const result = await TuitionFee.update(id, data);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Tuition fee setup not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Tuition fee setup updated successfully",
      });
    } catch (err) {
      console.error("Error updating tuition fee:", err);
      res.status(500).json({
        success: false,
        message: "Failed to update tuition fee",
        error: err.message,
      });
    }
  },

  // Delete tuition fee
  deleteTuitionFee: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await TuitionFee.delete(id);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Tuition fee setup not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Tuition fee setup deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting tuition fee:", err);
      res.status(500).json({
        success: false,
        message: "Failed to delete tuition fee",
        error: err.message,
      });
    }
  },
  // Get fee schedule for current student
  getStudentSchedule: async (req, res) => {
    try {
      // If student, use their own ID. If admin/staff, can provide student_id parameter
      let studentId = req.user.user_id;
      if (req.user.role !== "Student" && req.query.student_id) {
        studentId = req.query.student_id;
      }

      const schedule = await TuitionFee.getStudentFeeSchedule(studentId);

      if (!schedule) {
        return res.status(200).json({
          success: true,
          data: null,
          message:
            "No active academic period or fee schedule found for this student",
        });
      }

      res.status(200).json({
        success: true,
        data: schedule,
      });
    } catch (err) {
      console.error("Error fetching student schedule:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch student fee schedule",
        error: err.message,
      });
    }
  },
  // Generate invoices for all enrolled students matching a fee setup
  generateInvoicesForSetup: async (req, res) => {
    try {
      const { id } = req.params;
      const created_by = req.user.user_id;

      const result = await Invoice.bulkCreateFromFeeSetup(id, created_by);

      res.status(200).json({
        success: true,
        message: `Generated ${result.created} invoice(s). ${result.skipped} student(s) already had invoices.`,
        data: result,
      });
    } catch (err) {
      console.error("Error generating invoices:", err);
      res.status(500).json({
        success: false,
        message: "Failed to generate invoices",
        error: err.message,
      });
    }
  },
};

export default tuitionFeeController;
