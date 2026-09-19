import pool from "../config/db.js";

const EligibilityScreeningModel = {
  // Get all screening records with filters
  async getAllScreenings(filters = {}) {
    let query = `
      SELECT 
        se.*,
        sa.application_number,
        sp.scholarship_name,
        sp.scholarship_code,
        ap.school_year,
        ap.semester as period_semester,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        s.email as student_email,
        sd.student_number,
        CONCAT(sc.first_name, ' ', sc.last_name) as screener_name
      FROM scholarship_eligibility_screening se
      INNER JOIN scholarship_applications sa ON se.application_id = sa.application_id
      LEFT JOIN scholarship_programs sp ON se.scholarship_id = sp.scholarship_id
      LEFT JOIN academic_periods ap ON se.academic_period_id = ap.period_id
      INNER JOIN users s ON se.student_id = s.user_id
      LEFT JOIN student_details sd ON se.student_id = sd.user_id
      LEFT JOIN users sc ON se.screened_by = sc.user_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.screening_status) {
      query += " AND se.screening_status = ?";
      params.push(filters.screening_status);
    }

    if (filters.application_id) {
      query += " AND se.application_id = ?";
      params.push(filters.application_id);
    }

    if (filters.scholarship_id) {
      query += " AND se.scholarship_id = ?";
      params.push(filters.scholarship_id);
    }

    if (filters.academic_period_id) {
      query += " AND se.academic_period_id = ?";
      params.push(filters.academic_period_id);
    }

    if (filters.student_id) {
      query += " AND se.student_id = ?";
      params.push(filters.student_id);
    }

    if (filters.search) {
      query += " AND (sa.application_number LIKE ? OR sp.scholarship_name LIKE ? OR CONCAT(s.first_name, ' ', s.last_name) LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += " ORDER BY se.screening_date DESC";

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Get screening by ID
  async getScreeningById(id) {
    const query = `
      SELECT 
        se.*,
        sa.application_number,
        sp.scholarship_name,
        sp.scholarship_code,
        ap.school_year,
        ap.semester as period_semester,
        CONCAT(s.first_name, ' ', last_name) as student_name,
        s.email as student_email,
        sd.student_number,
        sd.course as student_course,
        sd.year_level as student_year_level,
        CONCAT(sc.first_name, ' ', sc.last_name) as screener_name
      FROM scholarship_eligibility_screening se
      INNER JOIN scholarship_applications sa ON se.application_id = sa.application_id
      LEFT JOIN scholarship_programs sp ON se.scholarship_id = sp.scholarship_id
      LEFT JOIN academic_periods ap ON se.academic_period_id = ap.period_id
      INNER JOIN users s ON se.student_id = s.user_id
      LEFT JOIN student_details sd ON se.student_id = sd.user_id
      LEFT JOIN users sc ON se.screened_by = sc.user_id
      WHERE se.screening_id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  },

  // Create screening record
  async createScreening(data) {
    const query = `
      INSERT INTO scholarship_eligibility_screening (
        application_id, scholarship_id, academic_period_id, student_id, screening_date, screened_by,
        gpa_requirement_met, gpa_value, gpa_required,
        year_level_eligible, year_level_value, year_level_required,
        course_eligible, course_value, course_required,
        income_requirement_met, family_income, max_income_allowed,
        documents_complete, documents_checklist, missing_documents,
        interview_required, interview_completed, interview_date, interview_score, interview_notes,
        overall_eligible, eligibility_score, screening_status,
        disqualification_reasons, conditional_requirements, recommendations, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      data.application_id,
      data.scholarship_id,
      data.academic_period_id,
      data.student_id,
      data.screening_date,
      data.screened_by,
      data.gpa_requirement_met || false,
      data.gpa_value || null,
      data.gpa_required || null,
      data.year_level_eligible || false,
      data.year_level_value || null,
      data.year_level_required || null,
      data.course_eligible || false,
      data.course_value || null,
      data.course_required || null,
      data.income_requirement_met || false,
      data.family_income || null,
      data.max_income_allowed || null,
      data.documents_complete || false,
      data.documents_checklist || null,
      data.missing_documents || null,
      data.interview_required || false,
      data.interview_completed || false,
      data.interview_date || null,
      data.interview_score || null,
      data.interview_notes || null,
      data.overall_eligible || false,
      data.eligibility_score || null,
      data.screening_status || 'Pending Review',
      data.disqualification_reasons || null,
      data.conditional_requirements || null,
      data.recommendations || null,
      data.remarks || null,
    ]);
    return result.insertId;
  },

  // Update screening
  async updateScreening(id, data) {
    const query = `
      UPDATE scholarship_eligibility_screening SET
        screening_date = ?,
        screened_by = ?,
        gpa_requirement_met = ?,
        gpa_value = ?,
        gpa_required = ?,
        year_level_eligible = ?,
        year_level_value = ?,
        year_level_required = ?,
        course_eligible = ?,
        course_value = ?,
        course_required = ?,
        income_requirement_met = ?,
        family_income = ?,
        max_income_allowed = ?,
        documents_complete = ?,
        documents_checklist = ?,
        missing_documents = ?,
        interview_required = ?,
        interview_completed = ?,
        interview_date = ?,
        interview_score = ?,
        interview_notes = ?,
        overall_eligible = ?,
        eligibility_score = ?,
        screening_status = ?,
        disqualification_reasons = ?,
        conditional_requirements = ?,
        recommendations = ?,
        remarks = ?
      WHERE screening_id = ?
    `;
    const [result] = await pool.query(query, [
      data.screening_date,
      data.screened_by,
      data.gpa_requirement_met,
      data.gpa_value,
      data.gpa_required,
      data.year_level_eligible,
      data.year_level_value,
      data.year_level_required,
      data.course_eligible,
      data.course_value,
      data.course_required,
      data.income_requirement_met,
      data.family_income,
      data.max_income_allowed,
      data.documents_complete,
      data.documents_checklist,
      data.missing_documents,
      data.interview_required,
      data.interview_completed,
      data.interview_date,
      data.interview_score,
      data.interview_notes,
      data.overall_eligible,
      data.eligibility_score,
      data.screening_status,
      data.disqualification_reasons,
      data.conditional_requirements,
      data.recommendations,
      data.remarks,
      id,
    ]);
    return result.affectedRows;
  },

  // Delete screening
  async deleteScreening(id) {
    const query = "DELETE FROM scholarship_eligibility_screening WHERE screening_id = ?";
    const [result] = await pool.query(query, [id]);
    return result.affectedRows;
  },

  // Get statistics
  async getStatistics() {
    const query = `
      SELECT 
        COUNT(*) as total_screenings,
        SUM(CASE WHEN screening_status = 'Passed' THEN 1 ELSE 0 END) as passed_count,
        SUM(CASE WHEN screening_status = 'Failed' THEN 1 ELSE 0 END) as failed_count,
        SUM(CASE WHEN screening_status = 'Pending Review' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN screening_status = 'Conditional' THEN 1 ELSE 0 END) as conditional_count,
        SUM(CASE WHEN overall_eligible = 1 THEN 1 ELSE 0 END) as eligible_count,
        AVG(eligibility_score) as average_score
      FROM scholarship_eligibility_screening
    `;
    const [rows] = await pool.query(query);
    return rows[0];
  },
};

export default EligibilityScreeningModel;
