import express from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../middleware/validate.js";
import {
  loginSchema, changePasswordSchema,
  registerStudentSchema, registerEmployeeSchema,
  updateStudentSchema, updateEmployeeSchema,
  verifyEmailSchema, resendVerificationSchema,
} from "../validators/user.validator.js";
import {
  getAllUsers, getUserById,
  registerStudent, registerEmployee,
  previewStudentNumber, previewEmployeeId,
  verifyEmail, resendVerification,
  loginUser, updateStudent, updateEmployee,
  changePassword, deleteUser,
} from "../controllers/user.controller.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { message: "Too many login attempts. Please wait 15 minutes." },
  standardHeaders: true, legacyHeaders: false,
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 10,
  message: { message: "Too many registration attempts. Try again later." },
  standardHeaders: true, legacyHeaders: false,
});
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { message: "Too many verification attempts. Please wait a few minutes." },
  standardHeaders: true, legacyHeaders: false,
});
const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  message: { message: "Too many resend attempts. Please wait 15 minutes before requesting again." },
  standardHeaders: true, legacyHeaders: false,
});
const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  message: { message: "Too many password change attempts. Please wait 15 minutes." },
  standardHeaders: true, legacyHeaders: false,
});

// USER ROUTES — static routes BEFORE /:userId
router.get("/users", getAllUsers);
router.get("/users/student/next-number", previewStudentNumber);
router.get("/users/employee/next-id", previewEmployeeId);
router.get("/users/:userId", getUserById);

router.post("/users/student",  registerLimiter, validate(registerStudentSchema),  registerStudent);
router.post("/users/employee", registerLimiter, validate(registerEmployeeSchema), registerEmployee);

router.put("/users/student/:userId",  registerLimiter, validate(updateStudentSchema),  updateStudent);
router.put("/users/employee/:userId", registerLimiter, validate(updateEmployeeSchema), updateEmployee);

router.delete("/users/:userId", deleteUser);

// AUTH ROUTES
router.post("/auth/login",                    loginLimiter,    validate(loginSchema),              loginUser);
router.post("/auth/register",                 registerLimiter, validate(registerStudentSchema),     registerStudent);
router.post("/auth/verify-email",             verifyLimiter,   validate(verifyEmailSchema),        verifyEmail);
router.post("/auth/resend-verification",      resendLimiter,   validate(resendVerificationSchema), resendVerification);
router.post("/auth/change-password/:userId",  passwordLimiter, validate(changePasswordSchema),      changePassword);

export default router;