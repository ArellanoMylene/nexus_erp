import express from "express";
import paymentController from "../controllers/payments.controller.js";
import { authenticateToken } from "../helpers/jwt.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create payment
router.post("/", paymentController.createPayment);

// Get all payments with filters
router.get("/", paymentController.getAllPayments);

// Get payment summary
router.get("/summary", paymentController.getPaymentSummary);

// Get daily collection report
router.get("/daily-collection", paymentController.getDailyCollection);

// Get payment by ID
router.get("/:id", paymentController.getPaymentById);

// Get payments by student
router.get("/student/:student_id", paymentController.getPaymentsByStudent);

// Get payments by invoice
router.get("/invoice/:invoice_id", paymentController.getPaymentsByInvoice);

// Update payment
router.put("/:id", paymentController.updatePayment);

// Verify payment
router.patch("/:id/verify", paymentController.verifyPayment);

// Delete payment
router.delete("/:id", paymentController.deletePayment);

export default router;
