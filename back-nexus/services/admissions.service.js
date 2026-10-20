// services/admissions.service.js
import db from "../config/db.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import * as admissionModel from "../model/admissions.model.js";
import {
  assignStudentNumberIfMissing,
  createStudentUser,
} from "../model/userModel.js";
import {
  sendAdmissionStatusEmail,
  sendAdmissionSubmittedEmail,
} from "./email.service.js";

export const listAdmissions = async () => {
  return await admissionModel.getAllAdmissions();
};

export const getAdmission = async (id) => {
  const admission = await admissionModel.getAdmissionById(id);
  if (!admission) throw new Error("Admission not found");
  return admission;
};

const ensureStudentAccount = async (admission) => {
  const email = String(admission.email || "").trim();
  if (!email) throw new Error("An email address is required to assign a student ID");

  const [existingUsers] = await db.query(
    `SELECT u.user_id, u.role, sd.student_number
     FROM users u
     LEFT JOIN student_details sd ON sd.user_id = u.user_id
     WHERE u.email = ? COLLATE utf8mb4_unicode_ci
     LIMIT 1`,
    [email],
  );
  if (existingUsers.length) {
    if (existingUsers[0].role !== "Student") {
      throw new Error("This email address is already used by a non-student account");
    }
    if (!existingUsers[0].student_number) {
      existingUsers[0].student_number = await assignStudentNumberIfMissing(existingUsers[0].user_id);
    }
    return existingUsers[0];
  }

  // Applications need a student record for enrollment. Credentials are not
  // issued here; account access is handled separately from assigning the ID.
  const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
  return await createStudentUser({
    email,
    passwordHash,
    firstName: admission.first_name,
    middleName: admission.middle_name,
    lastName: admission.last_name,
    dateOfBirth: admission.date_of_birth,
    gender: admission.gender,
    phone: admission.phone,
    permanentAddress: admission.address,
    courseProgram: admission.program_applied,
    yearLevel: admission.year_level || "1st Year",
    previousSchool: admission.previous_school,
    yearGraduated: admission.year_graduated,
    isVerified: false,
  });
};

export const addAdmission = async (data) => {
  const admission = await admissionModel.createAdmission(data);
  await ensureStudentAccount(admission);
  const linkedAdmission = await getAdmission(admission.admission_id);
  sendAdmissionSubmittedEmail({
    to: linkedAdmission.email,
    firstName: linkedAdmission.first_name,
    program: linkedAdmission.program_applied,
  }).catch((error) => console.error("Admission email failed:", error.message));
  return linkedAdmission;
};

export const editAdmission = async (id, data, options = {}) => {
  const previous = await getAdmission(id);
  const updated = await admissionModel.updateAdmission(id, data);
  const previousStatus = String(previous.status || "").toLowerCase();
  const updatedStatus = String(updated.status || "").toLowerCase();

  if (!options.skipEmail && previousStatus !== updatedStatus && updatedStatus) {
    sendAdmissionStatusEmail({
      to: updated.email,
      firstName: updated.first_name,
      status: updated.status,
      program: updated.program_applied,
      yearLevel: updated.year_level,
      remarks: updated.remarks,
    }).catch((error) => console.error("Admission status email failed:", error.message));
  }

  return updated;
};

export const removeAdmission = async (id) => {
  await getAdmission(id);
  return await admissionModel.deleteAdmission(id);
};

export const bulkEnrollAdmissions = async (
  admissionIds,
  targetYearLevel = null,
  options = {}
) => {
  const { sendEmail = true, remarks = "Official enrollment confirmed. Welcome to NexusERP!" } = options;
  const results = {
    enrolled: 0,
    failed: 0,
    emails_sent: 0,
    emails_failed: 0,
    errors: [],
  };

  for (let i = 0; i < admissionIds.length; i++) {
    const admissionId = admissionIds[i];
    try {
      const admission = await getAdmission(admissionId);
      const effectiveYearLevel = targetYearLevel || admission.year_level || "1st Year";
      const effectiveRemarks = remarks !== undefined && remarks !== null && remarks !== "" ? remarks : admission.remarks;

      // Update admission status to Enrolled; skipEmail: true so we handle sequential Gmail sending with rate pacing
      await editAdmission(
        admissionId,
        {
          ...admission,
          status: "Enrolled",
          year_level: effectiveYearLevel,
          remarks: effectiveRemarks,
        },
        { skipEmail: true }
      );

      // Also sync year_level with student_details if student account exists
      if (admission.email) {
        try {
          await db.query(
            `UPDATE student_details sd
             INNER JOIN users u ON sd.user_id = u.user_id
             SET sd.year_level = ?
             WHERE u.email = ? COLLATE utf8mb4_unicode_ci`,
            [effectiveYearLevel, admission.email]
          );
        } catch (syncErr) {
          console.error("Warning syncing student_details year_level:", syncErr);
        }
      }

      results.enrolled++;

      // Send Gmail confirmation if requested
      if (sendEmail) {
        const recipientEmail = String(admission.email || "").trim();
        if (recipientEmail && recipientEmail.includes("@")) {
          // Pacing delay between sequential emails to avoid Gmail SMTP connection throttling
          if (results.emails_sent > 0 || results.emails_failed > 0) {
            await new Promise((r) => setTimeout(r, 400));
          }

          try {
            const emailResult = await sendAdmissionStatusEmail({
              to: recipientEmail,
              firstName: admission.first_name,
              status: "Enrolled",
              program: admission.program_applied,
              yearLevel: effectiveYearLevel,
              remarks: effectiveRemarks,
            });

            if (emailResult && emailResult.delivered) {
              results.emails_sent++;
            } else {
              results.emails_failed++;
              console.warn(`Gmail delivery failed for ${recipientEmail}:`, emailResult?.error);
            }
          } catch (emailErr) {
            results.emails_failed++;
            console.error(`Error sending Gmail to ${recipientEmail}:`, emailErr.message);
          }
        } else {
          // Missing valid email address for applicant
          results.emails_failed++;
        }
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        admission_id: admissionId,
        error: error.message,
      });
    }
  }

  return results;
};
