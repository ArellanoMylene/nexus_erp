import pool from "../config/db.js";

const ScholarshipApplicationsModel = {
  // Get all applications with filters
  async getAllApplications(filters = {}) {
    let query = `
      SELECT 
        sa.*,
        sp.scholarship_name,
        sp.scholarship_code,
        ap.school_year,
        ap.semester as period_semester,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        s.email as student_email,
        sd.student_number,
        sd.course as student_course,
        sd.year_level as student_year_level,
        CONCAT(r.first_name, ' ', r.last_name) as reviewer_name,
        CONCAT(a.first_name, ' ', a.last_name) as approver_name
      FROM scholarship_applications sa
      LEFT JOIN scholarship_programs sp ON sa.scholarship_id = sp.scholarship_id
      LEFT JOIN academic_periods ap ON sa.academic_period_id = ap.period_id
      INNER JOIN users s ON sa.student_id = s.user_id
      LEFT JOIN student_details sd ON sa.student_id = sd.user_id
      LEFT JOIN users r ON sa.reviewed_by = r.user_id
      LEFT JOIN users a ON sa.approved_by = a.user_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += " AND sa.status = ?";
      params.push(filters.status);
    }

    if (filters.scholarship_id) {
      query += " AND sa.scholarship_id = ?";
      params.push(filters.scholarship_id);
    }

    if (filters.student_id) {
      query += " AND sa.student_id = ?";
      params.push(filters.student_id);
    }

    if (filters.academic_period_id) {
      query += " AND sa.academic_period_id = ?";
      params.push(filters.academic_period_id);
    }

    if (filters.search) {
      query += " AND (sa.application_number LIKE ? OR sp.scholarship_name LIKE ? OR CONCAT(s.first_name, ' ', s.last_name) LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += " ORDER BY sa.application_date DESC";

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Get application by ID
  async getApplicationById(id) {
    const query = `
      SELECT 
        sa.*,
        sp.scholarship_name,
        sp.scholarship_code,
        ap.school_year,
        ap.semester as period_semester,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        s.email as student_email,
        s.phone as student_phone,
        sd.student_number,
        sd.course as student_course,
        sd.year_level as student_year_level,
        CONCAT(r.first_name, ' ', r.last_name) as reviewer_name,
        CONCAT(a.first_name, ' ', a.last_name) as approver_name
      FROM scholarship_applications sa
      LEFT JOIN scholarship_programs sp ON sa.scholarship_id = sp.scholarship_id
      LEFT JOIN academic_periods ap ON sa.academic_period_id = ap.period_id
      INNER JOIN users s ON sa.student_id = s.user_id
      LEFT JOIN student_details sd ON sa.student_id = sd.user_id
      LEFT JOIN users r ON sa.reviewed_by = r.user_id
      LEFT JOIN users a ON sa.approved_by = a.user_id
      WHERE sa.application_id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  },

  // Create application
  async createApplication(data) {
    const query = `
      INSERT INTO scholarship_applications (
        scholarship_id, scholarship_type_id, student_id, application_number, application_date,
        academic_period_id, academic_year, semester, current_gpa, current_year_level, current_course, units_enrolled,
        family_income, number_of_siblings, working_student,
        grade_sheet_submitted, income_certificate_submitted, recommendation_letter_submitted, essay_submitted, other_documents,
        status, priority_score, approved_amount, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      data.scholarship_id || null,
      data.scholarship_type_id || null,
      data.student_id,
      data.application_number,
      data.application_date,
      data.academic_period_id || null,
      data.academic_year || null,
      data.semester,
      data.current_gpa || null,
      data.current_year_level || null,
      data.current_course || null,
      data.units_enrolled || null,
      data.family_income || null,
      data.number_of_siblings || null,
      data.working_student || false,
      data.grade_sheet_submitted || false,
      data.income_certificate_submitted || false,
      data.recommendation_letter_submitted || false,
      data.essay_submitted || false,
      data.other_documents || null,
      data.status || 'Pending',
      data.priority_score || null,
      data.approved_amount || null,
      data.remarks || null,
    ]);
    return result.insertId;
  },

  // Update application
  async updateApplication(id, data) {
    const query = `
      UPDATE scholarship_applications SET
        scholarship_id = ?,
        scholarship_type_id = ?,
        academic_period_id = ?,
        academic_year = ?,
        semester = ?,
        current_gpa = ?,
        current_year_level = ?,
        current_course = ?,
        units_enrolled = ?,
        family_income = ?,
        number_of_siblings = ?,
        working_student = ?,
        grade_sheet_submitted = ?,
        income_certificate_submitted = ?,
        recommendation_letter_submitted = ?,
        essay_submitted = ?,
        other_documents = ?,
        status = ?,
        priority_score = ?,
        reviewed_by = ?,
        review_date = ?,
        review_notes = ?,
        rejection_reason = ?,
        approved_by = ?,
        approval_date = ?,
        approved_amount = ?,
        remarks = ?
      WHERE application_id = ?
    `;
    const [result] = await pool.query(query, [
      data.scholarship_id,
      data.scholarship_type_id,
      data.academic_period_id,
      data.academic_year,
      data.semester,
      data.current_gpa,
      data.current_year_level,
      data.current_course,
      data.units_enrolled,
      data.family_income,
      data.number_of_siblings,
      data.working_student,
      data.grade_sheet_submitted,
      data.income_certificate_submitted,
      data.recommendation_letter_submitted,
      data.essay_submitted,
      data.other_documents,
      data.status,
      data.priority_score,
      data.reviewed_by,
      data.review_date,
      data.review_notes,
      data.rejection_reason,
      data.approved_by,
      data.approval_date,
      data.approved_amount,
      data.remarks,
      id,
    ]);
    return result.affectedRows;
  },

  // Delete application
  async deleteApplication(id) {
    const query = "DELETE FROM scholarship_applications WHERE application_id = ?";
    const [result] = await pool.query(query, [id]);
    return result.affectedRows;
  },

  // Get statistics
  async getStatistics() {
    const query = `
      SELECT 
        COUNT(*) as total_applications,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'Under Review' THEN 1 ELSE 0 END) as under_review_count,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(approved_amount) as total_approved_amount
      FROM scholarship_applications
    `;
    const [rows] = await pool.query(query);
    return rows[0];
  },

  // Generate application number
  async generateApplicationNumber() {
    const query = "SELECT MAX(CAST(SUBSTRING(application_number, 5) AS UNSIGNED)) as max_num FROM scholarship_applications WHERE application_number LIKE 'APP-%'";
    const [rows] = await pool.query(query);
    const nextNum = (rows[0].max_num || 0) + 1;
    return `APP-${String(nextNum).padStart(6, '0')}`;
  },
};

export default ScholarshipApplicationsModel;
