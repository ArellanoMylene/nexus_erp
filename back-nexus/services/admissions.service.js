// services/admissions.service.js
import * as admissionModel from "../model/admissions.model.js";
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

export const addAdmission = async (data) => {
  const admission = await admissionModel.createAdmission(data);
  sendAdmissionSubmittedEmail({
    to: admission.email,
    firstName: admission.first_name,
    program: admission.program_applied,
  }).catch((error) => console.error("Admission email failed:", error.message));
  return admission;
};

export const editAdmission = async (id, data) => {
  const previous = await getAdmission(id);
  const updated = await admissionModel.updateAdmission(id, data);
  const previousStatus = String(previous.status || "").toLowerCase();
  const updatedStatus = String(updated.status || "").toLowerCase();

  if (previousStatus !== updatedStatus && updatedStatus) {
    sendAdmissionStatusEmail({
      to: updated.email,
      firstName: updated.first_name,
      status: updated.status,
      program: updated.program_applied,
      remarks: updated.remarks,
    }).catch((error) => console.error("Admission status email failed:", error.message));
  }

  return updated;
};

export const removeAdmission = async (id) => {
  await getAdmission(id);
  return await admissionModel.deleteAdmission(id);
};

export const bulkEnrollAdmissions = async (admissionIds) => {
  const results = {
    enrolled: 0,
    failed: 0,
    errors: [],
  };

  for (const admissionId of admissionIds) {
    try {
      const admission = await getAdmission(admissionId);

      // Update admission status to Enrolled
      await editAdmission(admissionId, {
        ...admission,
        status: "Enrolled",
      });

      results.enrolled++;
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
