import Invoice from "../model/invoices.model.js";

const invoiceController = {
  // Create new invoice
  createInvoice: async (req, res) => {
    try {
      console.log("createInvoice incoming academic_period_id:", req.body?.academic_period_id, "(type:", typeof req.body?.academic_period_id, ")");

      const results = await Invoice.generateInvoiceNumber();

      let invoiceNumber = "INV-000001";
      if (results.length > 0 && results[0].invoice_number) {
        const lastNumber = parseInt(results[0].invoice_number.split("-")[1]);
        invoiceNumber = `INV-${String(lastNumber + 1).padStart(6, "0")}`;
      }

      const data = {
        invoice_number: invoiceNumber,
        ...req.body,
        created_by: req.user.user_id,
      };
      console.log("createInvoice prepared payload (academic_period_id):", data.academic_period_id);

      const result = await Invoice.create(data);

      res.status(201).json({
        success: true,
        message: "Invoice created successfully",
        data: {
          invoice_id: result.insertId,
          invoice_number: invoiceNumber,
        },
      });
    } catch (err) {
      console.error("Error creating invoice:", err);
      res.status(500).json({
        success: false,
        message: "Failed to create invoice",
        error: err.message,
      });
    }
  },

  // Get all invoices
  getAllInvoices: async (req, res) => {
    try {
      const filters = {
        student_id:         req.query.student_id,
        academic_period_id: req.query.academic_period_id,
        status:             req.query.status,
        search:             req.query.search,
        limit:              req.query.limit  || 50,
        offset:             req.query.offset || 0,
      };

      const results = await Invoice.getAll(filters);

      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (err) {
      console.error("Error fetching invoices:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch invoices",
        error: err.message,
      });
    }
  },

  // Get invoice by ID
  getInvoiceById: async (req, res) => {
    try {
      const { id } = req.params;
      const results = await Invoice.getById(id);

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      res.status(200).json({
        success: true,
        data: results[0],
      });
    } catch (err) {
      console.error("Error fetching invoice:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch invoice",
        error: err.message,
      });
    }
  },

  // Get invoices by student
  getInvoicesByStudent: async (req, res) => {
    try {
      const { student_id } = req.params;
      const results = await Invoice.getByStudent(student_id);

      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (err) {
      console.error("Error fetching student invoices:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch student invoices",
        error: err.message,
      });
    }
  },

  // Update invoice
  updateInvoice: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const result = await Invoice.update(id, data);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Invoice updated successfully",
      });
    } catch (err) {
      console.error("Error updating invoice:", err);
      res.status(500).json({
        success: false,
        message: "Failed to update invoice",
        error: err.message,
      });
    }
  },

  // Update invoice status
  updateInvoiceStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
        });
      }

      const result = await Invoice.updateStatus(id, status);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Invoice status updated successfully",
      });
    } catch (err) {
      console.error("Error updating invoice status:", err);
      res.status(500).json({
        success: false,
        message: "Failed to update invoice status",
        error: err.message,
      });
    }
  },

  // Delete invoice
  deleteInvoice: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await Invoice.delete(id);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Invoice deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting invoice:", err);
      res.status(500).json({
        success: false,
        message: "Failed to delete invoice",
        error: err.message,
      });
    }
  },

  // Get invoices for the currently logged-in student
  getMyInvoices: async (req, res) => {
    try {
      const studentId = req.user.user_id;
      const results = await Invoice.getByStudent(studentId);
      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (err) {
      console.error("Error fetching my invoices:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch invoices",
        error: err.message,
      });
    }
  },

  // Get financial summary
  getFinancialSummary: async (req, res) => {
    try {
      const filters = {
        academic_period_id: req.query.academic_period_id,
        start_date:         req.query.start_date,
        end_date:           req.query.end_date,
      };

      const results = await Invoice.getFinancialSummary(filters);

      res.status(200).json({
        success: true,
        data: results[0] || {},
      });
    } catch (err) {
      console.error("Error fetching financial summary:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch financial summary",
        error: err.message,
      });
    }
  },

  // Bulk create invoices from fee setup
  bulkCreateFromFeeSetup: async (req, res) => {
    try {
      const { fee_setup_id } = req.body;

      if (!fee_setup_id) {
        return res.status(400).json({
          success: false,
          message: "fee_setup_id is required",
        });
      }

      const result = await Invoice.bulkCreateFromFeeSetup(fee_setup_id, req.user.user_id);

      res.status(201).json({
        success: true,
        message: `Bulk invoice creation complete. Created: ${result.created}, Skipped: ${result.skipped}`,
        data: result,
      });
    } catch (err) {
      console.error("Error bulk creating invoices:", err);
      res.status(500).json({
        success: false,
        message: "Failed to bulk create invoices",
        error: err.message,
      });
    }
  },
};

export default invoiceController;