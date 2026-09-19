import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  createStudentUser,
  createEmployeeUser,
  findUserByEmail,
  findUserById,
  getAllUsers,
  previewNextStudentNumber,
  previewNextEmployeeId,
  updateStudentUser,
  updateEmployeeUser,
  deleteUser,
  updateUserVerificationCode,
  verifyUserEmailInDb,
  getUserVerificationStatus,
} from "../model/userModel.js";
import { sendVerificationEmail } from "./email.service.js";

/**
 * Generate a secure 6-digit numeric OTP code.
 */
const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Calculate OTP expiry timestamp (defaults to 15 minutes from now).
 */
const getVerificationExpiry = (minutes = 15) => {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + minutes);
  return expires;
};

export const getAllUsersService = async (role = null) => {
  return await getAllUsers(role);
};

export const getUserByIdService = async (userId) => {
  return await findUserById(userId);
};

export const registerStudentService = async (studentData) => {
  const { email, password } = studentData;
  if (!email || !password || !studentData.firstName || !studentData.lastName) {
    throw new Error("Email, password, first name, and last name are required");
  }
  const existingUser = await findUserByEmail(email);
  if (existingUser) throw new Error("Email already registered");
  
  const passwordHash = await bcrypt.hash(password, 10);
  const verificationCode = generateVerificationCode();
  const verificationExpiresAt = getVerificationExpiry(15);

  const { userId, studentNumber } = await createStudentUser({
    ...studentData,
    passwordHash,
    isVerified: false,
    verificationCode,
    verificationExpiresAt,
  });

  // Send verification email asynchronously
  sendVerificationEmail({
    to: email,
    firstName: studentData.firstName,
    code: verificationCode,
    expiresMinutes: 15,
  }).catch((err) => {
    console.error("Failed to send initial verification email:", err.message);
  });

  return {
    userId,
    studentNumber,
    email,
    requireVerification: true,
  };
};

export const getNextStudentNumberService = async () => {
  return await previewNextStudentNumber();
};

export const getNextEmployeeIdService = async () => {
  return await previewNextEmployeeId();
};

export const registerEmployeeService = async (employeeData) => {
  const { email, password, firstName, lastName, role } = employeeData;
  if (!email || !password || !firstName || !lastName) {
    throw new Error("Email, password, first name, and last name are required");
  }
  const existingUser = await findUserByEmail(email);
  if (existingUser) throw new Error("Email already registered");

  const passwordHash = await bcrypt.hash(password, 10);
  const shouldVerify = employeeData.isVerified !== true;
  const verificationCode = shouldVerify ? generateVerificationCode() : null;
  const verificationExpiresAt = shouldVerify ? getVerificationExpiry(15) : null;

  const result = await createEmployeeUser({
    ...employeeData,
    passwordHash,
    role: role || "Staff",
    isVerified: !shouldVerify,
    verificationCode,
    verificationExpiresAt,
  });

  if (shouldVerify) {
    sendVerificationEmail({
      to: email,
      firstName,
      code: verificationCode,
      expiresMinutes: 15,
    }).catch((err) => {
      console.error("Failed to send employee verification email:", err.message);
    });
  }

  return {
    userId: result.userId,
    employeeId: result.employeeId,
    role: role || "Staff",
    email,
    requireVerification: shouldVerify,
  };
};

export const loginUserService = async (email, password) => {
  if (!email || !password) throw new Error("Email and password are required");
  const user = await findUserByEmail(email);
  if (!user) throw new Error("Invalid credentials");
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw new Error("Invalid credentials");

  // Check if email has been verified
  if (user.is_verified === 0 || user.is_verified === false) {
    const unverifiedError = new Error("Email not verified. Please verify your email before logging in.");
    unverifiedError.name = "EmailNotVerifiedError";
    unverifiedError.email = user.email;
    throw unverifiedError;
  }

  return {
    userId: user.user_id,
    role: user.role,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
  };
};

export const verifyEmailService = async (email, code) => {
  if (!email || !code) throw new Error("Email and verification code are required");
  const result = await verifyUserEmailInDb(email, code);

  if (!result.success) {
    if (result.reason === "USER_NOT_FOUND") {
      throw new Error("No account found with this email address.");
    }
    if (result.reason === "CODE_EXPIRED") {
      throw new Error("Verification code has expired. Please request a new code.");
    }
    if (result.reason === "INVALID_CODE") {
      throw new Error("Invalid 6-digit verification code. Please try again.");
    }
    throw new Error("Failed to verify email. Please try again.");
  }

  return {
    success: true,
    alreadyVerified: result.alreadyVerified || false,
    user: result.user,
  };
};

export const resendVerificationService = async (email) => {
  if (!email) throw new Error("Email is required");
  const user = await getUserVerificationStatus(email);
  if (!user) {
    throw new Error("No account found with this email address.");
  }

  if (user.is_verified === 1 || user.is_verified === true) {
    throw new Error("This account is already verified. You can log in directly.");
  }

  const verificationCode = generateVerificationCode();
  const verificationExpiresAt = getVerificationExpiry(15);

  await updateUserVerificationCode(email, verificationCode, verificationExpiresAt);

  // Send verification email
  await sendVerificationEmail({
    to: email,
    firstName: user.first_name,
    code: verificationCode,
    expiresMinutes: 15,
  });

  return {
    success: true,
    message: "A new verification code has been sent to your email.",
  };
};

export const updateStudentService = async (userId, studentData) => {
  const { password } = studentData;
  if (password) {
    studentData.passwordHash = await bcrypt.hash(password, 10);
    delete studentData.password;
  }
  await updateStudentUser(userId, studentData);
  return true;
};

export const updateEmployeeService = async (userId, employeeData) => {
  const { password } = employeeData;
  if (password) {
    employeeData.passwordHash = await bcrypt.hash(password, 10);
    delete employeeData.password;
  }
  await updateEmployeeUser(userId, employeeData);
  return true;
};

export const changePasswordService = async (userId, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) throw new Error("Current password and new password are required");
  if (currentPassword === newPassword) throw new Error("New password must be different from current password");
  const user = await findUserById(userId);
  if (!user) throw new Error("User not found");
  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) throw new Error("Current password is incorrect");
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await updateEmployeeUser(userId, { passwordHash });
  return true;
};

export const deleteUserService = async (userId) => {
  if (!userId) throw new Error("User ID is required");
  await deleteUser(userId);
  return true;
};