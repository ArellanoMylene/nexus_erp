import Payment from "../model/payments.model.js";
import Invoice from "../model/invoices.model.js";

const paymentController = {
  // Create new payment
  createPayment: async (req, res) => {
    try {
      // Generate payment reference
      const results = await Payment.generatePaymentReference();

      let paymentRef = "PAY-000001";
      if (results.length > 0 && results[0].payment_reference) {
        const lastNumber = parseInt(results[0].payment_reference.split("-")[1]);
        paymentRef = `PAY-${String(lastNumber + 1).padStart(6, "0")}`;
      }

      const data = {
        payment_reference: paymentRef,
        ...req.body,
        collected_by: req.user.user_id,
      };

      data.payment_status =
        data.payment_status ||
        (data.payment_method === "Cash" ? "Verified" : "Pending");

      const result = await Payment.create(data);

      // Update invoice payment amount
      try {
        await Invoice.updatePayment(data.invoice_id, data.amount_paid);

        // Check if invoice is fully paid and update status
        const invoiceResults = await Invoice.getById(data.invoice_id);
        if (invoiceResults && invoiceResults.length > 0) {
          const invoice = invoiceResults[0];
          let newStatus = "Partially Paid";
          if (invoice.total_amount - invoice.amount_paid <= 0) {
            newStatus = "Paid";
          }
          await Invoice.updateStatus(data.invoice_id, newStatus);
        }
      } catch (invoiceErr) {
        console.error("Error updating invoice after payment:", invoiceErr);
      }

      res.status(201).json({
        success: true,
        message: "Payment recorded successfully",
        data: {
          payment_id: result.insertId,
          payment_reference: paymentRef,
        },
      });
    } catch (err) {
      console.error("Error creating payment:", err);
      res.status(500).json({
        success: false,
        message: "Failed to create payment",
        error: err.message,
      });
    }
  },

  // Get all payments
  getAllPayments: async (req, res) => {
    try {
      const filters = {
        student_id: req.query.student_id,
        invoice_id: req.query.invoice_id,
        payment_method: req.query.payment_method,
        payment_status: req.query.payment_status,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        search: req.query.search,
        limit: req.query.limit || 50,
        offset: req.query.offset || 0,
      };

      const results = await Payment.getAll(filters);

      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (err) {
      console.error("Error fetching payments:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payments",
        error: err.message,
      });
    }
  },

  // Get payment by ID
  getPaymentById: async (req, res) => {
    try {
      const { id } = req.params;
      const results = await Payment.getById(id);

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      res.status(200).json({
        success: true,
        data: results[0],
      });
    } catch (err) {
      console.error("Error fetching payment:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment",
        error: err.message,
      });
    }
  },

  // Get payments by student
  getPaymentsByStudent: async (req, res) => {
    try {
      const { student_id } = req.params;
      const results = await Payment.getByStudent(student_id);

      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (err) {
      console.error("Error fetching student payments:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch student payments",
        error: err.message,
      });
    }
  },

  // Get payments by invoice
  getPaymentsByInvoice: async (req, res) => {
    try {
      const { invoice_id } = req.params;
      const results = await Payment.getByInvoice(invoice_id);

      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (err) {
      console.error("Error fetching invoice payments:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch invoice payments",
        error: err.message,
      });
    }
  },

  // Update payment
  updatePayment: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const result = await Payment.update(id, data);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Payment updated successfully",
      });
    } catch (err) {
      console.error("Error updating payment:", err);
      res.status(500).json({
        success: false,
        message: "Failed to update payment",
        error: err.message,
      });
    }
  },

  // Verify payment
  verifyPayment: async (req, res) => {
    try {
      const { id } = req.params;
      const verified_by = req.user.user_id;

      const result = await Payment.verify(id, verified_by);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Payment verified successfully",
      });
    } catch (err) {
      console.error("Error verifying payment:", err);
      res.status(500).json({
        success: false,
        message: "Failed to verify payment",
        error: err.message,
      });
    }
  },

  // Delete payment
  deletePayment: async (req, res) => {
    try {
      const { id } = req.params;

      const results = await Payment.getById(id);
      if (!results || results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      const payment = results[0];
      const result = await Payment.delete(id);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      try {
        await Invoice.updatePayment(payment.invoice_id, -payment.amount_paid);
      } catch (invoiceErr) {
        console.error("Error updating invoice after payment deletion:", invoiceErr);
      }

      res.status(200).json({
        success: true,
        message: "Payment deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting payment:", err);
      res.status(500).json({
        success: false,
        message: "Failed to delete payment",
        error: err.message,
      });
    }
  },

  // Get payment summary
  getPaymentSummary: async (req, res) => {
    try {
      const filters = {
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        payment_method: req.query.payment_method,
      };

      const results = await Payment.getPaymentSummary(filters);

      res.status(200).json({
        success: true,
        data: results[0] || {},
      });
    } catch (err) {
      console.error("Error fetching payment summary:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment summary",
        error: err.message,
      });
    }
  },

  // Get daily collection report
  getDailyCollection: async (req, res) => {
    try {
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: "Date parameter is required",
        });
      }

      const results = await Payment.getDailyCollection(date);

      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (err) {
      console.error("Error fetching daily collection:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch daily collection",
        error: err.message,
      });
    }
  },
};

export default paymentController;
