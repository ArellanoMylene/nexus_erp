import db from "../config/db.js";

const LMSMaterials = {
  // Create a new learning material
  create: async (materialData) => {
    const {
      faculty_id,
      section_id,
      course_id,
      title,
      description,
      material_type,
      file_url,
      file_name,
      file_size,
      academic_period_id,
    } = materialData;

    const query = `
      INSERT INTO lms_materials 
      (faculty_id, section_id, course_id, title, description, material_type, 
       file_url, file_name, file_size, academic_period_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await db.query(query, [
      faculty_id,
      section_id,
      course_id,
      title,
      description,
      material_type,
      file_url,
      file_name,
      file_size,
      academic_period_id,
    ]);

    return result.insertId;
  },

  // Get all materials by faculty
  getByFaculty: async (faculty_id, academic_period_id) => {
    const query = `
      SELECT 
        lm.*,
        c.title as course_name,
        c.code as course_code,
        s.section_name,
        COUNT(DISTINCT lmv.student_id) as view_count
      FROM lms_materials lm
      LEFT JOIN courses c ON lm.course_id = c.course_id
      LEFT JOIN sections s ON lm.section_id = s.section_id
      LEFT JOIN lms_material_views lmv ON lm.id = lmv.material_id
      WHERE lm.faculty_id = ? AND lm.academic_period_id = ?
      GROUP BY lm.id
      ORDER BY lm.created_at DESC
    `;

    const [rows] = await db.query(query, [faculty_id, academic_period_id]);
    return rows;
  },

  // Get materials by section
  getBySection: async (section_id, academic_period_id) => {
    const query = `
      SELECT 
        lm.*,
        c.title as course_name,
        c.code as course_code,
        CONCAT(u.first_name, ' ', u.last_name) as faculty_name
      FROM lms_materials lm
      LEFT JOIN courses c ON lm.course_id = c.course_id
      LEFT JOIN users u ON lm.faculty_id = u.user_id
      WHERE lm.section_id = ? AND lm.academic_period_id = ?
      ORDER BY lm.created_at DESC
    `;

    const [rows] = await db.query(query, [section_id, academic_period_id]);
    return rows;
  },

  // Get materials for a student based on their enrolled courses
  getByStudent: async (student_id, academic_period_id) => {
    const query = `
      SELECT DISTINCT
        lm.*,
        c.code as course_code,
        c.title as course_name,
        s.section_name,
        CONCAT(u.first_name, ' ', u.last_name) as faculty_name,
        CASE WHEN lmv.id IS NOT NULL THEN 1 ELSE 0 END as is_viewed
      FROM lms_materials lm
      INNER JOIN enrollments e ON lm.course_id = e.course_id 
        AND lm.academic_period_id = e.period_id
      LEFT JOIN courses c ON lm.course_id = c.course_id
      LEFT JOIN sections s ON lm.section_id = s.section_id
      LEFT JOIN users u ON lm.faculty_id = u.user_id
      LEFT JOIN lms_material_views lmv ON lm.id = lmv.material_id AND lmv.student_id = ?
      WHERE e.student_id = ? 
        AND e.period_id = ? 
        AND e.status = 'Enrolled'
        AND (lm.section_id IS NULL OR lm.section_id = e.section_id)
      ORDER BY lm.created_at DESC
    `;

    const [rows] = await db.query(query, [student_id, student_id, academic_period_id]);
    return rows;
  },

  // Get material by ID
  getById: async (id) => {
    const query = `
      SELECT 
        lm.*,
        c.title as course_name,
        c.code as course_code,
        s.section_name,
        CONCAT(u.first_name, ' ', u.last_name) as faculty_name
      FROM lms_materials lm
      LEFT JOIN courses c ON lm.course_id = c.course_id
      LEFT JOIN sections s ON lm.section_id = s.section_id
      LEFT JOIN users u ON lm.faculty_id = u.user_id
      WHERE lm.id = ?
    `;

    const [rows] = await db.query(query, [id]);
    return rows[0];
  },

  // Update material
  update: async (id, updateData) => {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach((key) => {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    });

    values.push(id);

    const query = `
      UPDATE lms_materials 
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE id = ?
    `;

    const [result] = await db.query(query, values);
    return result.affectedRows > 0;
  },

  // Delete material
  delete: async (id) => {
    const query = "DELETE FROM lms_materials WHERE id = ?";
    const [result] = await db.query(query, [id]);
    return result.affectedRows > 0;
  },

  // Track material view
  trackView: async (material_id, student_id) => {
    const query = `
      INSERT INTO lms_material_views (material_id, student_id, viewed_at)
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE viewed_at = NOW()
    `;

    await db.query(query, [material_id, student_id]);
  },

  // Get material views
  getViews: async (material_id) => {
    const query = `
      SELECT 
        lmv.*,
        CONCAT(u.first_name, ' ', u.last_name) as student_name,
        u.student_id
      FROM lms_material_views lmv
      LEFT JOIN users u ON lmv.student_id = u.id
      WHERE lmv.material_id = ?
      ORDER BY lmv.viewed_at DESC
    `;

    const [rows] = await db.query(query, [material_id]);
    return rows;
  },
  // Check if student has any enrollments for period
  hasEnrollments: async (student_id, period_id) => {
    const query = "SELECT 1 FROM enrollments WHERE student_id = ? AND period_id = ? AND status = 'Enrolled' LIMIT 1";
    const [rows] = await db.query(query, [student_id, period_id]);
    return rows.length > 0;
  },
};

export default LMSMaterials;
