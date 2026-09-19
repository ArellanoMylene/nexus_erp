import db from "../config/db.js";

const LMSDiscussions = {
  // Create a new discussion thread
  createThread: async (threadData) => {
    const {
      faculty_id,
      section_id,
      course_id,
      title,
      content,
      academic_period_id,
      is_pinned,
    } = threadData;

    const query = `
      INSERT INTO lms_discussions 
      (faculty_id, section_id, course_id, title, content, academic_period_id, 
       is_pinned, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'active')
    `;

    const [result] = await db.query(query, [
      faculty_id,
      section_id,
      course_id,
      title,
      content,
      academic_period_id,
      is_pinned || 0,
    ]);

    return result.insertId;
  },

  // Get all discussions by section
  getBySection: async (section_id, academic_period_id) => {
    const query = `
      SELECT 
        ld.*,
        c.title as course_name,
        c.code as course_code,
        CONCAT(u.first_name, ' ', u.last_name) as author_name,
        u.role as author_role,
        COUNT(DISTINCT ldr.id) as reply_count,
        MAX(ldr.created_at) as last_reply_at
      FROM lms_discussions ld
      LEFT JOIN courses c ON ld.course_id = c.course_id
      LEFT JOIN users u ON ld.faculty_id = u.user_id
      LEFT JOIN lms_discussion_replies ldr ON ld.id = ldr.discussion_id
      WHERE ld.section_id = ? AND ld.academic_period_id = ?
      GROUP BY ld.id
      ORDER BY ld.is_pinned DESC, ld.created_at DESC
    `;

    const [rows] = await db.query(query, [section_id, academic_period_id]);
    return rows;
  },

  // Get discussions by faculty
  getByFaculty: async (faculty_id, academic_period_id) => {
    const query = `
      SELECT 
        ld.*,
        c.title as course_name,
        c.code as course_code,
        s.section_name,
        COUNT(DISTINCT ldr.id) as reply_count,
        MAX(ldr.created_at) as last_reply_at
      FROM lms_discussions ld
      LEFT JOIN courses c ON ld.course_id = c.course_id
      LEFT JOIN sections s ON ld.section_id = s.section_id
      LEFT JOIN lms_discussion_replies ldr ON ld.id = ldr.discussion_id
      WHERE ld.faculty_id = ? AND ld.academic_period_id = ?
      GROUP BY ld.id
      ORDER BY ld.created_at DESC
    `;

    const [rows] = await db.query(query, [faculty_id, academic_period_id]);
    return rows;
  },

  // Get discussions for a student based on their enrolled courses
  getByStudent: async (student_id, academic_period_id) => {
    const query = `
      SELECT 
        ld.*,
        c.code as course_code,
        c.title as course_name,
        s.section_name,
        CONCAT(u.first_name, ' ', u.last_name) as author_name,
        u.role as author_role,
        COUNT(DISTINCT ldr.id) as reply_count,
        MAX(ldr.created_at) as last_reply_at
      FROM lms_discussions ld
      INNER JOIN enrollments e ON ld.course_id = e.course_id 
        AND ld.academic_period_id = e.period_id
      LEFT JOIN courses c ON ld.course_id = c.course_id
      LEFT JOIN sections s ON ld.section_id = s.section_id
      LEFT JOIN users u ON ld.faculty_id = u.user_id
      LEFT JOIN lms_discussion_replies ldr ON ld.id = ldr.discussion_id
      WHERE e.student_id = ? 
        AND e.period_id = ? 
        AND e.status = 'Enrolled'
        AND ld.status = 'active'
      GROUP BY ld.id
      ORDER BY ld.is_pinned DESC, ld.created_at DESC
    `;

    const [rows] = await db.query(query, [student_id, academic_period_id]);
    return rows;
  },

  // Get discussion by ID
  getById: async (id) => {
    const query = `
      SELECT 
        ld.*,
        c.title as course_name,
        c.code as course_code,
        s.section_name,
        CONCAT(u.first_name, ' ', u.last_name) as author_name,
        u.role as author_role
      FROM lms_discussions ld
      LEFT JOIN courses c ON ld.course_id = c.course_id
      LEFT JOIN sections s ON ld.section_id = s.section_id
      LEFT JOIN users u ON ld.faculty_id = u.user_id
      WHERE ld.id = ?
    `;

    const [rows] = await db.query(query, [id]);
    return rows[0];
  },

  // Update discussion
  update: async (id, updateData) => {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach((key) => {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    });

    values.push(id);

    const query = `
      UPDATE lms_discussions 
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE id = ?
    `;

    const [result] = await db.query(query, values);
    return result.affectedRows > 0;
  },

  // Delete discussion
  delete: async (id) => {
    const query = "DELETE FROM lms_discussions WHERE id = ?";
    const [result] = await db.query(query, [id]);
    return result.affectedRows > 0;
  },

  // Create a reply
  createReply: async (replyData) => {
    const { discussion_id, user_id, content, parent_reply_id } = replyData;

    const query = `
      INSERT INTO lms_discussion_replies 
      (discussion_id, user_id, content, parent_reply_id, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;

    const [result] = await db.query(query, [
      discussion_id,
      user_id,
      content,
      parent_reply_id || null,
    ]);

    return result.insertId;
  },

  // Get replies for a discussion
  getReplies: async (discussion_id) => {
    const query = `
      SELECT 
        ldr.*,
        CONCAT(u.first_name, ' ', u.last_name) as author_name,
        u.role as author_role
      FROM lms_discussion_replies ldr
      LEFT JOIN users u ON ldr.user_id = u.user_id
      WHERE ldr.discussion_id = ?
      ORDER BY ldr.created_at ASC
    `;

    const [rows] = await db.query(query, [discussion_id]);
    return rows;
  },

  // Update reply
  updateReply: async (id, content) => {
    const query = `
      UPDATE lms_discussion_replies 
      SET content = ?, updated_at = NOW()
      WHERE id = ?
    `;

    const [result] = await db.query(query, [content, id]);
    return result.affectedRows > 0;
  },

  // Delete reply
  deleteReply: async (id) => {
    const query = "DELETE FROM lms_discussion_replies WHERE id = ?";
    const [result] = await db.query(query, [id]);
    return result.affectedRows > 0;
  },

  // Like/unlike a discussion
  toggleLike: async (discussion_id, user_id) => {
    const checkQuery = `
      SELECT id FROM lms_discussion_likes 
      WHERE discussion_id = ? AND user_id = ?
    `;

    const [existing] = await db.query(checkQuery, [discussion_id, user_id]);

    if (existing.length > 0) {
      // Unlike
      const deleteQuery = `
        DELETE FROM lms_discussion_likes 
        WHERE discussion_id = ? AND user_id = ?
      `;
      await db.query(deleteQuery, [discussion_id, user_id]);
      return { liked: false };
    } else {
      // Like
      const insertQuery = `
        INSERT INTO lms_discussion_likes (discussion_id, user_id, created_at)
        VALUES (?, ?, NOW())
      `;
      await db.query(insertQuery, [discussion_id, user_id]);
      return { liked: true };
    }
  },

  // Get like count
  getLikeCount: async (discussion_id) => {
    const query = `
      SELECT COUNT(*) as like_count
      FROM lms_discussion_likes
      WHERE discussion_id = ?
    `;

    const [rows] = await db.query(query, [discussion_id]);
    return rows[0].like_count;
  },
};

export default LMSDiscussions;
