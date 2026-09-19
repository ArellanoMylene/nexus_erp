import {
  getAllUsersService,
  getUserByIdService,
  registerStudentService,
  registerEmployeeService,
  getNextStudentNumberService,
  loginUserService,
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
    res.status(500).json({ message: error.message || "Failed to fetch users" });
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
    res.status(500).json({ message: error.message || "Failed to fetch user" });
  }
};

// Register student
export const registerStudent = async (req, res) => {
  try {
    // Map frontend field names to backend field names
    const mappedData = {
      ...req.body,
      dateOfBirth: req.body.dob || req.body.dateOfBirth,
      // Remove the frontend-only field
      dob: undefined,
    };

    const { userId, studentNumber } = await registerStudentService(mappedData);
    const token = generateToken({ userId, role: "Student" });

    res.status(201).json({
      message: "Student registered successfully",
      userId,
      studentNumber,
      token,
    });
  } catch (error) {
    console.error("Error registering student:", error);
    const statusCode = error.message.includes("already registered") ? 400 : 500;
    res
      .status(statusCode)
      .json({ message: error.message || "Failed to register student" });
  }
};

// Preview next student number
export const previewStudentNumber = async (_req, res) => {
  try {
    const studentNumber = await getNextStudentNumberService();
    res.status(200).json({ studentNumber });
  } catch (error) {
    console.error("Error previewing student number:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to preview student number" });
  }
};

// Register employee
export const registerEmployee = async (req, res) => {
  try {
    const { userId, role } = await registerEmployeeService(req.body);
    const token = generateToken({ userId, role });

    res.status(201).json({
      message: "Employee registered successfully",
      userId,
      token,
    });
  } catch (error) {
    console.error("Error registering employee:", error);
    const statusCode = error.message.includes("already registered") ? 400 : 500;
    res
      .status(statusCode)
      .json({ message: error.message || "Failed to register employee" });
  }
};

// Login
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
    console.error("Error logging in:", error);
    const statusCode = error.message === "Invalid credentials" ? 400 : 500;
    res.status(statusCode).json({ message: error.message || "Login failed" });
  }
};

// Update student
export const updateStudent = async (req, res) => {
  try {
    const { userId } = req.params;
    await updateStudentService(userId, req.body);

    res.status(200).json({ message: "Student updated successfully" });
  } catch (error) {
    console.error("Error updating student:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to update student" });
  }
};

// Update employee
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

        const uploadDir = path.join(
          __dirname,
          "../public/uploads/profile_pics",
        );
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filename = `user-${userId}-${Date.now()}.png`;
        const filepath = path.join(uploadDir, filename);

        fs.writeFileSync(filepath, buffer);

        // Set the URL for the database
        req.body.profilePictureUrl = `/uploads/profile_pics/${filename}`;

        // Remove base64 data so it doesn't get sent to the service/DB
        delete req.body.profilePictureBase64;
      } catch (err) {
        console.error("Error saving profile picture:", err);
        // Continue without saving image if it fails, or throw error?
        // For now, let's log and continue, maybe the text update can still succeed.
      }
    }

    await updateEmployeeService(userId, req.body);

    res.status(200).json({ message: "Employee updated successfully" });
  } catch (error) {
    console.error("Error updating employee:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to update employee" });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword, newPasswordConfirm } = req.body;

    // Validate that new passwords match
    if (newPassword !== newPasswordConfirm) {
      return res
        .status(400)
        .json({ message: "New passwords do not match" });
    }

    // Validate password strength
    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    await changePasswordService(userId, currentPassword, newPassword);

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    const statusCode = error.message.includes("incorrect")
      ? 401
      : error.message.includes("not found")
        ? 404
        : 500;
    res
      .status(statusCode)
      .json({ message: error.message || "Failed to change password" });
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
    res.status(500).json({ message: error.message || "Failed to delete user" });
  }
};
