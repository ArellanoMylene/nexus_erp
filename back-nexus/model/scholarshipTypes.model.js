import pool from "../config/db.js";

const ScholarshipTypesModel = {
  // Get all scholarship types with filters
  async getAllScholarshipTypes(filters = {}) {
    let query = `
      SELECT 
        st.*,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
        (st.total_slots - st.slots_filled) as slots_remaining
      FROM scholarship_types st
      LEFT JOIN users u ON st.created_by = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += " AND st.status = ?";
      params.push(filters.status);
    }

    if (filters.funding_source) {
      query += " AND st.funding_source = ?";
      params.push(filters.funding_source);
    }

    if (filters.search) {
      query += " AND (st.scholarship_name LIKE ? OR st.scholarship_code LIKE ? OR st.description LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += " ORDER BY st.created_at DESC";

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Get scholarship type by ID
  async getScholarshipTypeById(id) {
    const query = `
      SELECT 
        st.*,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM scholarship_types st
      LEFT JOIN users u ON st.created_by = u.user_id
      WHERE st.scholarship_type_id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  },

  // Create new scholarship type
  async createScholarshipType(data) {
    const query = `
      INSERT INTO scholarship_types (
        scholarship_name, scholarship_code, description,
        funding_source, total_budget, allocated_budget, remaining_budget,
        min_gpa, max_family_income, year_level_requirement, course_restriction,
        tuition_coverage_percentage, covers_miscellaneous, covers_books, covers_allowance, monthly_allowance,
        application_start, application_end,
        total_slots, slots_filled, slots_available,
        status, renewable, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      data.scholarship_name,
      data.scholarship_code,
      data.description || null,
      data.funding_source || null,
      data.total_budget || 0.00,
      data.allocated_budget || 0.00,
      data.remaining_budget || data.total_budget || 0.00,
      data.min_gpa || null,
      data.max_family_income || null,
      data.year_level_requirement || null,
      data.course_restriction || null,
      data.tuition_coverage_percentage || 0.00,
      data.covers_miscellaneous || false,
      data.covers_books || false,
      data.covers_allowance || false,
      data.monthly_allowance || 0.00,
      data.application_start || null,
      data.application_end || null,
      data.total_slots || 0,
      data.slots_filled || 0,
      data.slots_available || data.total_slots || 0,
      data.status || 'Active',
      data.renewable || false,
      data.created_by || null,
    ]);
    return result.insertId;
  },

  // Update scholarship type
  async updateScholarshipType(id, data) {
    const query = `
      UPDATE scholarship_types SET
        scholarship_name = ?,
        scholarship_code = ?,
        description = ?,
        funding_source = ?,
        total_budget = ?,
        allocated_budget = ?,
        remaining_budget = ?,
        min_gpa = ?,
        max_family_income = ?,
        year_level_requirement = ?,
        course_restriction = ?,
        tuition_coverage_percentage = ?,
        covers_miscellaneous = ?,
        covers_books = ?,
        covers_allowance = ?,
        monthly_allowance = ?,
        application_start = ?,
        application_end = ?,
        total_slots = ?,
        slots_filled = ?,
        slots_available = ?,
        status = ?,
        renewable = ?
      WHERE scholarship_type_id = ?
    `;
    const [result] = await pool.query(query, [
      data.scholarship_name,
      data.scholarship_code,
      data.description,
      data.funding_source,
      data.total_budget,
      data.allocated_budget,
      data.remaining_budget,
      data.min_gpa,
      data.max_family_income,
      data.year_level_requirement,
      data.course_restriction,
      data.tuition_coverage_percentage,
      data.covers_miscellaneous,
      data.covers_books,
      data.covers_allowance,
      data.monthly_allowance,
      data.application_start,
      data.application_end,
      data.total_slots,
      data.slots_filled,
      data.slots_available,
      data.status,
      data.renewable,
      id,
    ]);
    return result.affectedRows;
  },

  // Delete scholarship type
  async deleteScholarshipType(id) {
    const query = "DELETE FROM scholarship_types WHERE scholarship_type_id = ?";
    const [result] = await pool.query(query, [id]);
    return result.affectedRows;
  },

  // Get statistics
  async getStatistics() {
    const query = `
      SELECT 
        COUNT(*) as total_scholarships,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_scholarships,
        SUM(total_budget) as total_budget,
        SUM(allocated_budget) as total_allocated,
        SUM(remaining_budget) as total_remaining,
        SUM(total_slots) as total_slots,
        SUM(slots_filled) as total_filled,
        SUM(slots_available) as total_available
      FROM scholarship_types
    `;
    const [rows] = await pool.query(query);
    return rows[0];
  },

  // Get funding sources
  async getFundingSources() {
    const query = "SELECT DISTINCT funding_source FROM scholarship_types WHERE funding_source IS NOT NULL ORDER BY funding_source";
    const [rows] = await pool.query(query);
    return rows.map(row => row.funding_source);
  },
};

export default ScholarshipTypesModel;
