import {
  getAllUsersService,
  getUserByIdService,
  registerStudentService,
  registerEmployeeService,
  getNextStudentNumberService,
  getNextEmployeeIdService,  // ← dagdag
  loginUserService,
  verifyEmailService,
  resendVerificationService,
  updateStudentService,
  updateEmployeeService,
  changePasswordService,
  deleteUserService,
} from "../services/user.service.js";

import { generateToken } from "../helpers/jwt.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const users = await getAllUsersService(role);
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await getUserByIdService(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

// Register student — req.body already validated & sanitized by middleware
export const registerStudent = async (req, res) => {
  try {
    const mappedData = {
      ...req.body,
      dateOfBirth: req.body.dob || req.body.dateOfBirth,
      dob: undefined,
    };

    const result = await registerStudentService(mappedData);

    res.status(201).json({
      message: "Registration initiated. Please verify your email with the 6-digit code sent to your inbox to complete registration.",
      userId: result.userId,
      studentNumber: result.studentNumber,
      email: result.email,
      requireVerification: true,
    });
  } catch (error) {
    console.error("Error registering student:", error);
    const statusCode = error.message.includes("already registered") ? 400 : 500;
    res.status(statusCode).json({ message: error.message || "Failed to register student" });
  }
};

// Preview next student number
export const previewStudentNumber = async (_req, res) => {
  try {
    const studentNumber = await getNextStudentNumberService();
    res.status(200).json({ studentNumber });
  } catch (error) {
    console.error("Error previewing student number:", error);
    res.status(500).json({ message: "Failed to preview student number" });
  }
};

// Register employee — req.body already validated & sanitized by middleware
export const registerEmployee = async (req, res) => {
  try {
    const result = await registerEmployeeService(req.body);

    res.status(201).json({
      message: result.requireVerification
        ? "Registration initiated. Please verify your email with the 6-digit code sent to your inbox to complete registration."
        : "Employee registered successfully",
      userId: result.userId,
      employeeId: result.employeeId,
      role: result.role,
      email: result.email,
      requireVerification: result.requireVerification,
    });
  } catch (error) {
    console.error("Error registering employee:", error);
    const statusCode = error.message.includes("already registered") ? 400 : 500;
    res.status(statusCode).json({ message: error.message || "Failed to register employee" });
  }
};

// Verify Email endpoint — validates 6-digit OTP and activates account
export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    const result = await verifyEmailService(email, code);

    // Provide token so user can optionally proceed immediately or log in
    const token = generateToken({
      userId: result.user.user_id,
      role: result.user.role,
    });

    res.status(200).json({
      message: "Email verified successfully! Registration is now complete.",
      success: true,
      alreadyVerified: result.alreadyVerified,
      token,
      userId: result.user.user_id,
      role: result.user.role,
      firstName: result.user.first_name,
      lastName: result.user.last_name,
    });
  } catch (error) {
    console.error("Error verifying email:", error.message);
    const isExpected =
      error.message.includes("Invalid") ||
      error.message.includes("expired") ||
      error.message.includes("not found") ||
      error.message.includes("required");

    res.status(isExpected ? 400 : 500).json({
      message: error.message || "Failed to verify email.",
    });
  }
};

// Resend verification code endpoint
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await resendVerificationService(email);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error resending verification code:", error.message);
    const isExpected =
      error.message.includes("already verified") ||
      error.message.includes("not found") ||
      error.message.includes("required");

    res.status(isExpected ? 400 : 500).json({
      message: error.message || "Failed to resend verification code.",
    });
  }
};

// Login — req.body already validated & sanitized by middleware
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await loginUserService(email, password);
    const token = generateToken({ userId: user.userId, role: user.role });

    res.status(200).json({
      message: "Login successful",
      token,
      role: user.role,
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  } catch (error) {
    console.error("Error logging in:", error.message);

    // Handle unverified email error with clear directive & prompt for verification
    if (error.name === "EmailNotVerifiedError" || error.message.includes("Email not verified")) {
      return res.status(403).json({
        message: "Your email is not verified yet. Please verify your email to complete registration.",
        requireVerification: true,
        email: error.email || req.body.email,
      });
    }

    // Don't leak specific error details for standard auth failures
    const statusCode = error.message === "Invalid credentials" ? 401 : 500;
    res.status(statusCode).json({
      message: statusCode === 401 ? "Invalid credentials" : "Login failed",
    });
  }
};

// Update student — req.body already validated & sanitized by middleware
export const updateStudent = async (req, res) => {
  try {
    const { userId } = req.params;
    await updateStudentService(userId, req.body);
    res.status(200).json({ message: "Student updated successfully" });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ message: "Failed to update student" });
  }
};

// Update employee — req.body already validated & sanitized by middleware
export const updateEmployee = async (req, res) => {
  try {
    const { userId } = req.params;

    // Handle profile picture upload (Base64)
    if (req.body.profilePictureBase64) {
      try {
        const base64Data = req.body.profilePictureBase64.replace(
          /^data:image\/\w+;base64,/,
          "",
        );
        const buffer = Buffer.from(base64Data, "base64");

        const uploadDir = path.join(__dirname, "../public/uploads/profile_pics");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filename = `user-${userId}-${Date.now()}.png`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, buffer);

        req.body.profilePictureUrl = `/uploads/profile_pics/${filename}`;
        delete req.body.profilePictureBase64;
      } catch (err) {
        console.error("Error saving profile picture:", err);
      }
    }

    await updateEmployeeService(userId, req.body);
    res.status(200).json({ message: "Employee updated successfully" });
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({ message: "Failed to update employee" });
  }
};

// Change password — req.body already validated & sanitized by middleware
export const changePassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;
    // confirmPassword match already checked by Zod schema — no need to recheck here

    await changePasswordService(userId, currentPassword, newPassword);
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    const statusCode = error.message.includes("incorrect")
      ? 401
      : error.message.includes("not found")
        ? 404
        : 500;
    res.status(statusCode).json({ message: error.message || "Failed to change password" });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await deleteUserService(userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};
export const previewEmployeeId = async (req, res) => {
  try {
    const employeeId = await getNextEmployeeIdService();
    res.json({ employeeId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};