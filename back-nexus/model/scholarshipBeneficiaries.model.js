import pool from "../config/db.js";

const ScholarshipBeneficiariesModel = {
  // Get all beneficiaries with filters
  async getAllBeneficiaries(filters = {}) {
    let query = `
      SELECT 
        sb.*,
        sp.scholarship_name,
        sp.scholarship_code,
        ap.school_year,
        ap.semester as period_semester,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        s.email as student_email,
        sd.student_number,
        sd.course as student_course,
        sd.year_level as student_year_level,
        sa.application_number,
        (sb.total_grant_amount - sb.total_disbursed) as remaining_balance
      FROM scholarship_beneficiaries sb
      LEFT JOIN scholarship_programs sp ON sb.scholarship_id = sp.scholarship_id
      LEFT JOIN academic_periods ap ON sb.academic_period_id = ap.period_id
      INNER JOIN users s ON sb.student_id = s.user_id
      LEFT JOIN student_details sd ON sb.student_id = sd.user_id
      LEFT JOIN scholarship_applications sa ON sb.application_id = sa.application_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += " AND sb.status = ?";
      params.push(filters.status);
    }

    if (filters.scholarship_id) {
      query += " AND sb.scholarship_id = ?";
      params.push(filters.scholarship_id);
    }

    if (filters.student_id) {
      query += " AND sb.student_id = ?";
      params.push(filters.student_id);
    }

    if (filters.academic_period_id) {
      query += " AND sb.academic_period_id = ?";
      params.push(filters.academic_period_id);
    }

    if (filters.disbursement_status) {
      query += " AND sb.disbursement_status = ?";
      params.push(filters.disbursement_status);
    }

    if (filters.search) {
      query += " AND (sp.scholarship_name LIKE ? OR CONCAT(s.first_name, ' ', s.last_name) LIKE ? OR sd.student_number LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += " ORDER BY sb.created_at DESC";

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Get beneficiary by ID
  async getBeneficiaryById(id) {
    const query = `
      SELECT 
        sb.*,
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
        sa.application_number,
        (sb.total_grant_amount - sb.total_disbursed) as remaining_balance
      FROM scholarship_beneficiaries sb
      LEFT JOIN scholarship_programs sp ON sb.scholarship_id = sp.scholarship_id
      LEFT JOIN academic_periods ap ON sb.academic_period_id = ap.period_id
      INNER JOIN users s ON sb.student_id = s.user_id
      LEFT JOIN student_details sd ON sb.student_id = sd.user_id
      LEFT JOIN scholarship_applications sa ON sb.application_id = sa.application_id
      WHERE sb.beneficiary_id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  },

  // Create beneficiary
  async createBeneficiary(data) {
    const query = `
      INSERT INTO scholarship_beneficiaries (
        application_id, scholarship_id, scholarship_type_id, student_id,
        start_date, end_date, academic_period_id, academic_year, semester,
        total_grant_amount, tuition_discount, allowance_amount, other_benefits,
        total_disbursed, disbursement_status, last_disbursement_date,
        required_gpa, current_gpa, gpa_maintained,
        community_service_hours_required, community_service_hours_completed, service_requirement_met,
        renewable, renewal_application_id, renewal_status,
        status, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      data.application_id,
      data.scholarship_id || null,
      data.scholarship_type_id || null,
      data.student_id,
      data.start_date,
      data.end_date,
      data.academic_period_id || null,
      data.academic_year || null,
      data.semester || null,
      data.total_grant_amount,
      data.tuition_discount || 0.00,
      data.allowance_amount || 0.00,
      data.other_benefits || null,
      data.total_disbursed || 0.00,
      data.disbursement_status || 'Pending',
      data.last_disbursement_date || null,
      data.required_gpa || null,
      data.current_gpa || null,
      data.gpa_maintained !== undefined ? data.gpa_maintained : true,
      data.community_service_hours_required || 0,
      data.community_service_hours_completed || 0,
      data.service_requirement_met !== undefined ? data.service_requirement_met : true,
      data.renewable || false,
      data.renewal_application_id || null,
      data.renewal_status || 'Not Applicable',
      data.status || 'Active',
      data.remarks || null,
    ]);
    return result.insertId;
  },

  // Update beneficiary
  async updateBeneficiary(id, data) {
    const query = `
      UPDATE scholarship_beneficiaries SET
        scholarship_id = ?,
        scholarship_type_id = ?,
        academic_period_id = ?,
        start_date = ?,
        end_date = ?,
        academic_year = ?,
        semester = ?,
        total_grant_amount = ?,
        tuition_discount = ?,
        allowance_amount = ?,
        other_benefits = ?,
        total_disbursed = ?,
        disbursement_status = ?,
        last_disbursement_date = ?,
        required_gpa = ?,
        current_gpa = ?,
        gpa_maintained = ?,
        community_service_hours_required = ?,
        community_service_hours_completed = ?,
        service_requirement_met = ?,
        renewable = ?,
        renewal_application_id = ?,
        renewal_status = ?,
        status = ?,
        revocation_reason = ?,
        revoked_by = ?,
        revoked_date = ?,
        remarks = ?
      WHERE beneficiary_id = ?
    `;
    const [result] = await pool.query(query, [
      data.scholarship_id,
      data.scholarship_type_id,
      data.academic_period_id,
      data.start_date,
      data.end_date,
      data.academic_year,
      data.semester,
      data.total_grant_amount,
      data.tuition_discount,
      data.allowance_amount,
      data.other_benefits,
      data.total_disbursed,
      data.disbursement_status,
      data.last_disbursement_date,
      data.required_gpa,
      data.current_gpa,
      data.gpa_maintained,
      data.community_service_hours_required,
      data.community_service_hours_completed,
      data.service_requirement_met,
      data.renewable,
      data.renewal_application_id,
      data.renewal_status,
      data.status,
      data.revocation_reason,
      data.revoked_by,
      data.revoked_date,
      data.remarks,
      id,
    ]);
    return result.affectedRows;
  },

  // Delete beneficiary
  async deleteBeneficiary(id) {
    const query = "DELETE FROM scholarship_beneficiaries WHERE beneficiary_id = ?";
    const [result] = await pool.query(query, [id]);
    return result.affectedRows;
  },

  // Get statistics
  async getStatistics() {
    const query = `
      SELECT 
        COUNT(*) as total_beneficiaries,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'Revoked' THEN 1 ELSE 0 END) as revoked_count,
        SUM(total_grant_amount) as total_grants,
        SUM(total_disbursed) as total_disbursed,
        SUM(total_grant_amount - total_disbursed) as total_pending,
        SUM(CASE WHEN gpa_maintained = 0 THEN 1 ELSE 0 END) as below_gpa_count
      FROM scholarship_beneficiaries
    `;
    const [rows] = await pool.query(query);
    return rows[0];
  },
};

export default ScholarshipBeneficiariesModel;
