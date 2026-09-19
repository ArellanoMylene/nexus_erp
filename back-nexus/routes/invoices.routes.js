import express from "express";
import invoiceController from "../controllers/invoices.controller.js";
import { authenticateToken } from "../helpers/jwt.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create invoice
router.post("/", invoiceController.createInvoice);

// Get all invoices with filters
router.get("/", invoiceController.getAllInvoices);

// Get financial summary
router.get("/summary", invoiceController.getFinancialSummary);

// Get invoices for the currently logged-in student (must be before /:id)
router.get("/my-invoices", invoiceController.getMyInvoices);

// Get invoice by ID
router.get("/:id", invoiceController.getInvoiceById);

// Get invoices by student
router.get("/student/:student_id", invoiceController.getInvoicesByStudent);

// Update invoice
router.put("/:id", invoiceController.updateInvoice);

// Update invoice status
router.patch("/:id/status", invoiceController.updateInvoiceStatus);

// Delete invoice
router.delete("/:id", invoiceController.deleteInvoice);

export default router;
