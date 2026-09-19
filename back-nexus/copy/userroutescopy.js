

/* import express from "express";
import {
  getAllUsers,
  getUserById,
  registerStudent,
  registerEmployee,
  previewStudentNumber,
  loginUser,
  updateStudent,
  updateEmployee,
  changePassword,
  deleteUser,
} from "../controllers/user.controller.js";

const router = express.Router();

// Get all users
router.get("/users", getAllUsers);

// Get user by ID
router.get("/users/:userId", getUserById);

// Register student
router.post("/users/student", registerStudent);

// Preview next student number
router.get("/users/student/next-number", previewStudentNumber);

// Register employee (Admin, Faculty, Staff)
router.post("/users/employee", registerEmployee);

// Login
router.post("/auth/login", loginUser);

// Register (unified endpoint for student registration from frontend)
router.post("/auth/register", registerStudent);

// Change password
router.post("/auth/change-password/:userId", changePassword);

// Update student
router.put("/users/student/:userId", updateStudent);

// Update employee
router.put("/users/employee/:userId", updateEmployee);

// Delete user
router.delete("/users/:userId", deleteUser);

export default router;
 */

import express from "express";
import rateLimit from "express-rate-limit";
import {
  getAllUsers,
  getUserById,
  registerStudent,
  registerEmployee,
  previewStudentNumber,
  loginUser,
  updateStudent,
  updateEmployee,
  changePassword,
  deleteUser,
} from "../controllers/user.controller.js";

const router = express.Router();

/* ==========================================
   RATE LIMITERS
   ========================================== */

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts per IP
  message: { message: "Too many login attempts. Please wait 15 minutes and try again." },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,                    // 5 registrations per IP per hour
  message: { message: "Too many registration attempts. Please try again after an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // 5 attempts per IP
  message: { message: "Too many password change attempts. Please wait 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ==========================================
   USER ROUTES
   ========================================== */

// Get all users
router.get("/users", getAllUsers);

// Get user by ID
router.get("/users/:userId", getUserById);

// Preview next student number — must be before /users/:userId to avoid param conflict
router.get("/users/student/next-number", previewStudentNumber);

// Register student
router.post("/users/student", registerLimiter, registerStudent);

// Register employee (Admin, Faculty, Staff)
router.post("/users/employee", registerLimiter, registerEmployee);

/* ==========================================
   AUTH ROUTES
   ========================================== */

// Login
router.post("/auth/login", loginLimiter, loginUser);

// Register (unified endpoint for student registration from frontend)
router.post("/auth/register", registerLimiter, registerStudent);

// Change password
router.post("/auth/change-password/:userId", passwordLimiter, changePassword);

/* ==========================================
   UPDATE / DELETE ROUTES
   ========================================== */

// Update student
router.put("/users/student/:userId", updateStudent);

// Update employee
router.put("/users/employee/:userId", updateEmployee);

// Delete user
router.delete("/users/:userId", deleteUser);

export default router;