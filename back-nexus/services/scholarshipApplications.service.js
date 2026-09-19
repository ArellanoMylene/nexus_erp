import ScholarshipApplicationsModel from "../model/scholarshipApplications.model.js";
import Scholarship from "../model/scholarships.model.js";
import { getAcademicPeriodById } from "../model/academicPeriods.model.js";
import pool from "../config/db.js";

const createScholarshipTypeFromProgram = async (scholarshipProgram) => {
  if (!scholarshipProgram?.scholarship_name || !scholarshipProgram?.scholarship_code) {
    return null;
  }

  try {
    await pool.query(
      `
        INSERT INTO scholarship_types (
          scholarship_name,
          scholarship_code,
          description,
          total_budget,
          remaining_budget,
          status,
          created_by
        ) VALUES (?, ?, ?, ?, ?, 'Active', ?)
      `,
      [
        scholarshipProgram.scholarship_name,
        scholarshipProgram.scholarship_code,
        scholarshipProgram.description || null,
        scholarshipProgram.total_budget || 0,
        scholarshipProgram.total_budget || 0,
        scholarshipProgram.created_by || null,
      ],
    );
  } catch (error) {
    // Ignore duplicate errors; we resolve using lookup below.
    if (error?.code !== "ER_DUP_ENTRY") {
      throw error;
    }
  }

  const [rows] = await pool.query(
    `SELECT scholarship_type_id FROM scholarship_types WHERE scholarship_code = ? LIMIT 1`,
    [scholarshipProgram.scholarship_code],
  );

  if (rows.length) return rows[0].scholarship_type_id;

  const [nameRows] = await pool.query(
    `SELECT scholarship_type_id FROM scholarship_types WHERE scholarship_name = ? LIMIT 1`,
    [scholarshipProgram.scholarship_name],
  );

  return nameRows.length ? nameRows[0].scholarship_type_id : null;
};

const resolveScholarshipTypeId = async ({
  scholarshipTypeId,
  scholarshipProgram,
}) => {
  if (scholarshipTypeId) {
    const [rows] = await pool.query(
      `SELECT scholarship_type_id FROM scholarship_types WHERE scholarship_type_id = ? LIMIT 1`,
      [scholarshipTypeId],
    );
    return rows.length ? rows[0].scholarship_type_id : null;
  }

  if (!scholarshipProgram) return null;

  // Primary mapping: program code <-> scholarship type code
  if (scholarshipProgram.scholarship_code) {
    const [codeRows] = await pool.query(
      `SELECT scholarship_type_id FROM scholarship_types WHERE scholarship_code = ? LIMIT 1`,
      [scholarshipProgram.scholarship_code],
    );
    if (codeRows.length) return codeRows[0].scholarship_type_id;
  }

  // Fallback mapping: program name <-> scholarship name
  if (scholarshipProgram.scholarship_name) {
    const [nameRows] = await pool.query(
      `SELECT scholarship_type_id FROM scholarship_types WHERE scholarship_name = ? LIMIT 1`,
      [scholarshipProgram.scholarship_name],
    );
    if (nameRows.length) return nameRows[0].scholarship_type_id;
  }

  // Final fallback: create a scholarship type entry from the program metadata.
  return await createScholarshipTypeFromProgram(scholarshipProgram);

};

const ScholarshipApplicationsService = {
  async getAllApplications(filters) {
    return await ScholarshipApplicationsModel.getAllApplications(filters);
  },

  async getApplicationById(id) {
    const application =
      await ScholarshipApplicationsModel.getApplicationById(id);
    if (!application) {
      throw new Error("Application not found");
    }
    return application;
  },

  async createApplication(data) {
    // Validate required fields
    if (!data.scholarship_id || !data.student_id || !data.academic_period_id) {
      throw new Error(
        "Scholarship program, student, and academic period are required",
      );
    }

    // Fetch academic period to populate year and semester
    const period = await getAcademicPeriodById(data.academic_period_id);
    if (!period) {
      throw new Error("Academic period not found");
    }
    data.academic_year = period.school_year;
    data.semester = period.semester;

    // Check if scholarship program exists and has available slots
    const results = await Scholarship.getProgramById(data.scholarship_id);
    if (!results || results.length === 0) {
      throw new Error("Scholarship program not found");
    }
    const scholarshipProgram = results[0];

    if (!scholarshipProgram.is_active) {
      throw new Error("This scholarship program is not currently active");
    }

    if (
      scholarshipProgram.available_amount <= 0 &&
      scholarshipProgram.total_budget > 0
    ) {
      // Optional: Budget check, though maybe slots are more important
    }

    if (
      scholarshipProgram.current_beneficiaries >=
        scholarshipProgram.max_beneficiaries &&
      scholarshipProgram.max_beneficiaries > 0
    ) {
      throw new Error("No slots available for this scholarship program");
    }

    data.scholarship_type_id = await resolveScholarshipTypeId({
      scholarshipTypeId: data.scholarship_type_id,
      scholarshipProgram,
    });

    if (!data.scholarship_type_id) {
      throw new Error(
        "Unable to resolve scholarship_type_id for the selected scholarship program. Make sure scholarship code/name exists in Scholarship Types setup.",
      );
    }

    // Generate application number
    if (!data.application_number) {
      data.application_number =
        await ScholarshipApplicationsModel.generateApplicationNumber();
    }

    // Set application date if not provided
    if (!data.application_date) {
      data.application_date = new Date().toISOString().split("T")[0];
    }

    const id = await ScholarshipApplicationsModel.createApplication(data);
    return await ScholarshipApplicationsModel.getApplicationById(id);
  },

  async updateApplication(id, data) {
    const existing = await ScholarshipApplicationsModel.getApplicationById(id);
    if (!existing) {
      throw new Error("Application not found");
    }

    const scholarshipId = data.scholarship_id || existing.scholarship_id;
    let scholarshipProgram = null;
    if (scholarshipId) {
      const results = await Scholarship.getProgramById(scholarshipId);
      scholarshipProgram = results && results.length ? results[0] : null;
    }

    data.scholarship_type_id = await resolveScholarshipTypeId({
      scholarshipTypeId: data.scholarship_type_id || existing.scholarship_type_id,
      scholarshipProgram,
    });

    if (!data.scholarship_type_id) {
      throw new Error(
        "Unable to resolve scholarship_type_id for this application. Make sure scholarship code/name exists in Scholarship Types setup.",
      );
    }

    // If approving, validate approved_amount
    if (data.status === "Approved" && !data.approved_amount) {
      throw new Error("Approved amount is required when approving application");
    }

    // If academic_period_id is updated, refresh year and semester
    if (
      data.academic_period_id &&
      data.academic_period_id !== existing.academic_period_id
    ) {
      const period = await getAcademicPeriodById(data.academic_period_id);
      if (period) {
        data.academic_year = period.school_year;
        data.semester = period.semester;
      }
    }

    // Set review/approval dates
    if (data.status === "Under Review" && !data.review_date) {
      data.review_date = new Date()
        .toISOString()
        .replace("T", " ")
        .substring(0, 19);
    }

    if (data.status === "Approved" && !data.approval_date) {
      data.approval_date = new Date()
        .toISOString()
        .replace("T", " ")
        .substring(0, 19);
    }

    await ScholarshipApplicationsModel.updateApplication(id, data);
    return await ScholarshipApplicationsModel.getApplicationById(id);
  },

  async deleteApplication(id) {
    const existing = await ScholarshipApplicationsModel.getApplicationById(id);
    if (!existing) {
      throw new Error("Application not found");
    }

    // Prevent deletion of approved applications
    if (existing.status === "Approved") {
      throw new Error("Cannot delete approved applications");
    }

    return await ScholarshipApplicationsModel.deleteApplication(id);
  },

  async getStatistics() {
    return await ScholarshipApplicationsModel.getStatistics();
  },
};

export default ScholarshipApplicationsService;
