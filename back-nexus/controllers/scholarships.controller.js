import Scholarship from "../model/scholarships.model.js";

const ALLOWED_SCHOLARSHIP_TYPES = new Set(["Full", "Partial", "Variable"]);
const ALLOWED_DISCOUNT_TYPES = new Set(["Percentage", "Fixed Amount"]);

const normalizeScholarshipType = (value) => {
  if (value === undefined || value === null) return value;
  const raw = String(value).trim();
  if (!raw) return raw;

  const lower = raw.toLowerCase();
  if (ALLOWED_SCHOLARSHIP_TYPES.has(raw)) return raw;

  const mapped = {
    "merit-based": "Partial",
    "need-based": "Partial",
    athletic: "Partial",
    academic: "Partial",
    leadership: "Partial",
    "community service": "Partial",
    government: "Variable",
    private: "Variable",
  }[lower];

  if (mapped) return mapped;
  if (lower === "full") return "Full";
  if (lower === "partial") return "Partial";
  if (lower === "variable") return "Variable";

  return raw;
};

const normalizeDiscountType = (value) => {
  if (value === undefined || value === null) return value;
  const raw = String(value).trim();
  if (!raw) return raw;
  if (ALLOWED_DISCOUNT_TYPES.has(raw)) return raw;

  const lower = raw.toLowerCase();
  if (lower === "percentage") return "Percentage";
  if (lower === "fixed amount") return "Fixed Amount";
  if (lower === "full scholarship") return "Percentage";

  return raw;
};

const scholarshipController = {
  // ========== SCHOLARSHIP PROGRAMS ==========

  // Create scholarship program
  createProgram: async (req, res) => {
    try {
      const data = {
        ...req.body,
        created_by: req.user.user_id,
      };

      data.scholarship_type = normalizeScholarshipType(data.scholarship_type);
      data.discount_type = normalizeDiscountType(data.discount_type);

      if (!ALLOWED_SCHOLARSHIP_TYPES.has(data.scholarship_type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid scholarship_type. Allowed values: Full, Partial, Variable.",
        });
      }

      if (!ALLOWED_DISCOUNT_TYPES.has(data.discount_type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid discount_type. Allowed values: Percentage, Fixed Amount.",
        });
      }

      if (data.scholarship_type === "Full") {
        data.discount_type = "Percentage";
        data.discount_value = 100;
      }

      const result = await Scholarship.createProgram(data);

      res.status(201).json({
        success: true,
        message: "Scholarship program created successfully",
        data: { scholarship_id: result.insertId },
      });
    } catch (err) {
      console.error("Error creating scholarship program:", err);
      res.status(500).json({
        success: false,
        message: "Failed to create scholarship program",
        error: err.message,
      });
    }
  },

  // Get all scholarship programs
  getAllPrograms: async (req, res) => {
    try {
      const filters = {
        scholarship_type: req.query.scholarship_type,
        academic_period_id: req.query.academic_period_id,
        is_active: req.query.is_active,
        search: req.query.search,
      };

      const results = await Scholarship.getAllPrograms(filters);

      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (err) {
      console.error("Error fetching scholarship programs:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch scholarship programs",
        error: err.message,
      });
    }
  },

  // Get scholarship program by ID
  getProgramById: async (req, res) => {
    try {
      const { id } = req.params;
      const results = await Scholarship.getProgramById(id);

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Scholarship program not found",
        });
      }

      res.status(200).json({
        success: true,
        data: results[0],
      });
    } catch (err) {
      console.error("Error fetching scholarship program:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch scholarship program",
        error: err.message,
      });
    }
  },

  // Update scholarship program
  updateProgram: async (req, res) => {
    try {
      const { id } = req.params;
      const data = {
        ...req.body,
      };

      data.scholarship_type = normalizeScholarshipType(data.scholarship_type);
      data.discount_type = normalizeDiscountType(data.discount_type);

      if (!ALLOWED_SCHOLARSHIP_TYPES.has(data.scholarship_type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid scholarship_type. Allowed values: Full, Partial, Variable.",
        });
      }

      if (!ALLOWED_DISCOUNT_TYPES.has(data.discount_type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid discount_type. Allowed values: Percentage, Fixed Amount.",
        });
      }

      if (data.scholarship_type === "Full") {
        data.discount_type = "Percentage";
        data.discount_value = 100;
      }

      const result = await Scholarship.updateProgram(id, data);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Scholarship program not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Scholarship program updated successfully",
      });
    } catch (err) {
      console.error("Error updating scholarship program:", err);
      res.status(500).json({
        success: false,
        message: "Failed to update scholarship program",
        error: err.message,
      });
    }
  },

  // Delete scholarship program
  deleteProgram: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await Scholarship.deleteProgram(id);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Scholarship program not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Scholarship program deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting scholarship program:", err);
      res.status(500).json({
        success: false,
        message: "Failed to delete scholarship program",
        error: err.message,
      });
    }
  },

  // ========== SCHOLARSHIP ALLOCATIONS ==========

  // Create scholarship allocation
  createAllocation: async (req, res) => {
    try {
      const data = {
        ...req.body,
        created_by: req.user.user_id,
      };

      const result = await Scholarship.createAllocation(data);

      res.status(201).json({
        success: true,
        message: "Scholarship allocation created successfully",
        data: { allocation_id: result.insertId },
      });
    } catch (err) {
      console.error("Error creating scholarship allocation:", err);
      res.status(500).json({
        success: false,
        message: "Failed to create scholarship allocation",
        error: err.message,
      });
    }
  },

  // Get all scholarship allocations
  getAllAllocations: async (req, res) => {
    try {
      const filters = {
        scholarship_id: req.query.scholarship_id,
        student_id: req.query.student_id,
        academic_period_id: req.query.academic_period_id,
        status: req.query.status,
        search: req.query.search,
        limit: req.query.limit || 50,
        offset: req.query.offset || 0,
      };

      const results = await Scholarship.getAllAllocations(filters);

      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (err) {
      console.error("Error fetching scholarship allocations:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch scholarship allocations",
        error: err.message,
      });
    }
  },

  // Get allocation by ID
  getAllocationById: async (req, res) => {
    try {
      const { id } = req.params;
      const results = await Scholarship.getAllocationById(id);

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Scholarship allocation not found",
        });
      }

      res.status(200).json({
        success: true,
        data: results[0],
      });
    } catch (err) {
      console.error("Error fetching scholarship allocation:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch scholarship allocation",
        error: err.message,
      });
    }
  },

  // Update scholarship allocation
  updateAllocation: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const result = await Scholarship.updateAllocation(id, data);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Scholarship allocation not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Scholarship allocation updated successfully",
      });
    } catch (err) {
      console.error("Error updating scholarship allocation:", err);
      res.status(500).json({
        success: false,
        message: "Failed to update scholarship allocation",
        error: err.message,
      });
    }
  },

  // Approve scholarship allocation
  approveAllocation: async (req, res) => {
    try {
      const { id } = req.params;
      const { approval_notes } = req.body;
      const approved_by = req.user.user_id;

      const result = await Scholarship.approveAllocation(id, approved_by, approval_notes);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Scholarship allocation not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Scholarship allocation approved successfully",
      });
    } catch (err) {
      console.error("Error approving scholarship allocation:", err);
      res.status(500).json({
        success: false,
        message: "Failed to approve scholarship allocation",
        error: err.message,
      });
    }
  },

  // Delete scholarship allocation
  deleteAllocation: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await Scholarship.deleteAllocation(id);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Scholarship allocation not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Scholarship allocation deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting scholarship allocation:", err);
      res.status(500).json({
        success: false,
        message: "Failed to delete scholarship allocation",
        error: err.message,
      });
    }
  },

  // Get scholarship summary
  getScholarshipSummary: async (req, res) => {
    try {
      const filters = {
        academic_period_id: req.query.academic_period_id,
      };

      const results = await Scholarship.getScholarshipSummary(filters);

      res.status(200).json({
        success: true,
        data: results[0] || {},
      });
    } catch (err) {
      console.error("Error fetching scholarship summary:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch scholarship summary",
        error: err.message,
      });
    }
  },

  // Get student scholarships
  getStudentScholarships: async (req, res) => {
    try {
      const { student_id } = req.params;
      const results = await Scholarship.getStudentScholarships(student_id);

      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (err) {
      console.error("Error fetching student scholarships:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch student scholarships",
        error: err.message,
      });
    }
  },
};

export default scholarshipController;
