import pool from "../config/db.js";

const GradeComputationSettingsModel = {
  // Get all settings with filters
  getAll: async (filters = {}) => {
    let query = `
      SELECT 
        gcs.*,
        c.code AS course_code,
        c.title AS course_name,
        s.section_name,
        ap.school_year,
        ap.semester,
        u.first_name AS creator_first_name,
        u.last_name AS creator_last_name
      FROM grade_computation_settings gcs
      INNER JOIN courses c ON gcs.course_id = c.course_id
      LEFT JOIN sections s ON gcs.section_id = s.section_id
      INNER JOIN academic_periods ap ON gcs.period_id = ap.period_id
      LEFT JOIN users u ON gcs.created_by = u.user_id
      WHERE 1=1
    `;

    const params = [];

    if (filters.course_id) {
      query += " AND gcs.course_id = ?";
      params.push(filters.course_id);
    }

    if (filters.section_id) {
      query += " AND gcs.section_id = ?";
      params.push(filters.section_id);
    }

    if (filters.period_id) {
      query += " AND gcs.period_id = ?";
      params.push(filters.period_id);
    }

    if (filters.component_type) {
      query += " AND gcs.component_type = ?";
      params.push(filters.component_type);
    }

    query += " ORDER BY gcs.course_id, gcs.component_name";

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Get setting by ID
  getById: async (settingId) => {
    const query = `
      SELECT 
        gcs.*,
        c.code AS course_code,
        c.title AS course_name,
        s.section_name,
        ap.school_year,
        ap.semester
      FROM grade_computation_settings gcs
      INNER JOIN courses c ON gcs.course_id = c.course_id
      LEFT JOIN sections s ON gcs.section_id = s.section_id
      INNER JOIN academic_periods ap ON gcs.period_id = ap.period_id
      WHERE gcs.setting_id = ?
    `;
    const [rows] = await pool.query(query, [settingId]);
    return rows[0];
  },

  // Get settings by course and period
  getByCourseAndPeriod: async (courseId, periodId, sectionId = null) => {
    let query = `
      SELECT *
      FROM grade_computation_settings
      WHERE course_id = ? AND period_id = ?
    `;

    const params = [courseId, periodId];

    if (sectionId) {
      query += " AND section_id = ?";
      params.push(sectionId);
    } else {
      query += " AND section_id IS NULL";
    }

    query += " ORDER BY component_name";

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Create new setting
  create: async (settingData) => {
    const query = `
      INSERT INTO grade_computation_settings (
        course_id, section_id, period_id, component_name, component_type,
        weight, passing_percentage, computation_method, drop_lowest,
        is_required, description, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      settingData.course_id,
      settingData.section_id || null,
      settingData.period_id,
      settingData.component_name,
      settingData.component_type,
      settingData.weight,
      settingData.passing_percentage || null,
      settingData.computation_method || "average",
      settingData.drop_lowest || 0,
      settingData.is_required !== undefined ? settingData.is_required : true,
      settingData.description || null,
      settingData.created_by || null,
    ];

    const [result] = await pool.query(query, params);
    return result.insertId;
  },

  // Update setting
  update: async (settingId, settingData) => {
    const query = `
      UPDATE grade_computation_settings SET
        course_id = ?,
        section_id = ?,
        period_id = ?,
        component_name = ?,
        component_type = ?,
        weight = ?,
        passing_percentage = ?,
        computation_method = ?,
        drop_lowest = ?,
        is_required = ?,
        description = ?
      WHERE setting_id = ?
    `;

    const params = [
      settingData.course_id,
      settingData.section_id || null,
      settingData.period_id,
      settingData.component_name,
      settingData.component_type,
      settingData.weight,
      settingData.passing_percentage || null,
      settingData.computation_method,
      settingData.drop_lowest || 0,
      settingData.is_required,
      settingData.description || null,
      settingId,
    ];

    const [result] = await pool.query(query, params);
    return result.affectedRows;
  },

  // Delete setting
  delete: async (settingId) => {
    const query = "DELETE FROM grade_computation_settings WHERE setting_id = ?";
    const [result] = await pool.query(query, [settingId]);
    return result.affectedRows;
  },

  // Validate total weights for a course/section
  validateWeights: async (courseId, periodId, sectionId = null) => {
    let query = `
      SELECT SUM(weight) as total_weight
      FROM grade_computation_settings
      WHERE course_id = ? AND period_id = ?
    `;

    const params = [courseId, periodId];

    if (sectionId) {
      query += " AND section_id = ?";
      params.push(sectionId);
    } else {
      query += " AND section_id IS NULL";
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total_weight || 0;
  },
};

export default GradeComputationSettingsModel;
