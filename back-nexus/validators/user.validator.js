import { z } from "zod";

/* ==========================================
   REUSABLE FIELD DEFINITIONS
   ========================================== */

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const phoneField = z
  .string()
  .min(7, "Phone number too short")
  .max(20, "Phone number too long")
  .optional()
  .nullable();

const nameField = (label) =>
  z.string().min(1, `${label} is required`).max(100, `${label} too long`);

const optionalString = z.string().optional().nullable();

/* ==========================================
   AUTH SCHEMAS
   ========================================== */

export const loginSchema = z.object({
  email: z.string().min(1, "Email or ID is required"),
  password: z.string().min(1, "Password is required"),
});

export const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email format"),
  code: z.string().trim().length(6, "Verification code must be 6 digits"),
});

export const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordField,
    newPasswordConfirm: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: "Passwords do not match",
    path: ["newPasswordConfirm"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

/* ==========================================
   STUDENT SCHEMAS
   ========================================== */

export const registerStudentSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: passwordField,
  // confirmPassword removed — frontend validates match client-side and doesn't send it

  firstName: nameField("First name"),
  middleName: optionalString,
  lastName: nameField("Last name"),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  phone: phoneField,

  permanentAddress: optionalString,
  studentNumber: optionalString,

  academicYear: z.string().min(1, "Academic year is required"),
  semester: z.string().min(1, "Semester is required"),
  courseProgram: z.string().min(1, "Course/Program is required"), // renamed from `course`
  yearLevel: z.string().min(1, "Year level is required"),
  dateRegistered: optionalString,

  civilStatus: optionalString,
  religion: optionalString,
  isPwd: optionalString,
  indigenousPeople: optionalString,
  zipCode: optionalString,
  birthPlace: optionalString,
  citizenship: optionalString,
  studentType: optionalString,

  elementarySchool: optionalString,
  elementaryYearGraduated: optionalString,
  juniorHighSchool: optionalString,
  juniorHighYearGraduated: optionalString,
  seniorHighSchool: optionalString,
  seniorHighYearGraduated: optionalString,
  collegeProgramAttended: optionalString,
  schoolYearAttended: optionalString,

  fatherName: optionalString,
  fatherStatus: optionalString,
  fatherResidenceStreet: optionalString,
  fatherResidenceBarangay: optionalString,
  fatherResidenceCity: optionalString,
  fatherResidenceProvince: optionalString,
  fatherResidenceZipCode: optionalString,
  fatherOccupation: optionalString,
  fatherPhone: optionalString,

  motherName: optionalString,
  motherStatus: optionalString,
  motherResidenceStreet: optionalString,
  motherResidenceBarangay: optionalString,
  motherResidenceCity: optionalString,
  motherResidenceProvince: optionalString,
  motherResidenceZipCode: optionalString,
  motherOccupation: optionalString,
  motherPhone: optionalString,

  guardianName: optionalString,
  guardianRelationship: optionalString,
  guardianResidenceStreet: optionalString,
  guardianResidenceBarangay: optionalString,
  guardianResidenceCity: optionalString,
  guardianResidenceProvince: optionalString,
  guardianResidenceZipCode: optionalString,
  guardianOccupation: optionalString,
  guardianPhone: optionalString,

  otherFinancialAssistance: optionalString,
  scholarshipAssistance1: optionalString,
  scholarshipAssistance2: optionalString,
  scholarshipAssistance3: optionalString,
});

export const updateStudentSchema = z.object({
  email: z.string().email("Invalid email format").optional(),
  password: passwordField.optional(),           // ← DAGDAG ITO
  confirmPassword: z.string().optional(),
  firstName: nameField("First name").optional(),
  middleName: optionalString,
  lastName: nameField("Last name").optional(),
  suffix: z.enum(["", "Jr.", "Sr.", "III", "IV"]).optional().nullable(),
   dateOfBirth: optionalString, // dob → dateOfBirth
  gender: z
    .enum(["Male", "Female", "Non-Binary", "Prefer not to say", ""])
    .optional()
    .nullable(),
  phone: phoneField,
  parentPhone: phoneField,
  permanentAddress: optionalString,
  mailingAddress: optionalString,
  fatherName: optionalString,
  motherName: optionalString,
  studentNumber: optionalString,
  course: optionalString,
  major: optionalString,
  yearLevel: optionalString,
  previousSchool: optionalString,
  yearGraduated: optionalString,
});

/* ==========================================
   EMPLOYEE SCHEMAS
   ========================================== */

export const registerEmployeeSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: passwordField,
  firstName: nameField("First name"),
  middleName: optionalString,
  lastName: nameField("Last name"),
  suffix: z.enum(["", "Jr.", "Sr.", "III", "IV"]).optional().nullable(),
  dateOfBirth: optionalString,
  gender: z
    .enum(["Male", "Female", "Non-Binary", "Prefer not to say", ""])
    .optional()
    .nullable(),
  phone: phoneField,
  permanentAddress: optionalString,
  role: z
    .enum(["Admin", "Faculty", "Staff", "HR", "Accounting"])
    .default("Staff"),
  employeeId: z.string().min(1, "Employee ID is required"),
  department: optionalString,
  positionTitle: optionalString,
  dateHired: optionalString,
  specialization: optionalString,
  educationalAttainment: optionalString,
  licenseNumber: optionalString,
  accessLevel: optionalString,
});
export const updateEmployeeSchema = z.object({
  email: z.string().email("Invalid email format").optional(),
  password: passwordField.optional(),           // ← DAGDAG ITO
  confirmPassword: z.string().optional(),        // ← DAGDAG ITO (optional)
  firstName: optionalString,
  middleName: optionalString,
  lastName: optionalString,
  suffix: z.enum(["", "Jr.", "Sr.", "III", "IV"]).optional().nullable(),
  dateOfBirth: optionalString,
  gender: optionalString,
  phone: phoneField,
  permanentAddress: optionalString,
  profilePictureBase64: optionalString,
  status: z.enum(["Active", "Inactive", "Leave", "Terminated"]).optional(),
  employeeId: optionalString,
  department: optionalString,
  positionTitle: optionalString,
  dateHired: optionalString,
  specialization: optionalString,
  educationalAttainment: optionalString,
  licenseNumber: optionalString,
  accessLevel: optionalString,
});