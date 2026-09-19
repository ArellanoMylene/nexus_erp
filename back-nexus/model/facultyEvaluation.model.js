import db from "../config/db.js";

const FacultyEvaluation = {
  getAll: () => {
    return db.query(`
      SELECT fe.*, 
             CONCAT(f.first_name, ' ', f.last_name) AS faculty_name, 
             CONCAT(ev.first_name, ' ', ev.last_name) AS evaluator_name, 
             fed.employee_id,
             c.code as course_code, c.title as course_title,
             ap.school_year, ap.semester
      FROM faculty_evaluations fe
      INNER JOIN users f ON fe.faculty_user_id = f.user_id
      INNER JOIN employee_details fed ON f.user_id = fed.user_id
      LEFT JOIN users ev ON fe.evaluator_id = ev.user_id
      LEFT JOIN courses c ON fe.course_id = c.course_id
      INNER JOIN academic_periods ap ON fe.academic_period_id = ap.period_id
      ORDER BY fe.evaluation_date DESC
    `);
  },

  getByFacultyId: (facultyUserId) => {
    return db.query(
      `
      SELECT fe.*,
             ev.first_name as evaluator_first_name, ev.last_name as evaluator_last_name,
             c.code as course_code, c.title as course_title,
             ap.school_year, ap.semester
      FROM faculty_evaluations fe
      LEFT JOIN users ev ON fe.evaluator_id = ev.user_id
      LEFT JOIN courses c ON fe.course_id = c.course_id
      INNER JOIN academic_periods ap ON fe.academic_period_id = ap.period_id
      WHERE fe.faculty_user_id = ?
      ORDER BY fe.evaluation_date DESC
    `,
      [facultyUserId],
    );
  },

  getById: (evaluationId) => {
    return db.query(
      `
      SELECT fe.*,
             f.first_name as faculty_first_name, f.last_name as faculty_last_name, fed.employee_id,
             ev.first_name as evaluator_first_name, ev.last_name as evaluator_last_name,
             c.code as course_code, c.title as course_title,
             ap.school_year, ap.semester
      FROM faculty_evaluations fe
      INNER JOIN users f ON fe.faculty_user_id = f.user_id
      INNER JOIN employee_details fed ON f.user_id = fed.user_id
      LEFT JOIN users ev ON fe.evaluator_id = ev.user_id
      LEFT JOIN courses c ON fe.course_id = c.course_id
      INNER JOIN academic_periods ap ON fe.academic_period_id = ap.period_id
      WHERE fe.evaluation_id = ?
    `,
      [evaluationId],
    );
  },

  getByAcademicPeriod: (periodId) => {
    return db.query(
      `
      SELECT fe.*,
             f.first_name as faculty_first_name, f.last_name as faculty_last_name, fed.employee_id,
             c.code as course_code, c.title as course_title
      FROM faculty_evaluations fe
      INNER JOIN users f ON fe.faculty_user_id = f.user_id
      INNER JOIN employee_details fed ON f.user_id = fed.user_id
      LEFT JOIN courses c ON fe.course_id = c.course_id
      WHERE fe.academic_period_id = ?
      ORDER BY f.last_name, f.first_name
    `,
      [periodId],
    );
  },

  create: (evaluationData) => {
    const overall =
      ((evaluationData.teaching_effectiveness || 0) +
        (evaluationData.subject_knowledge || 0) +
        (evaluationData.classroom_management || 0) +
        (evaluationData.communication_skills || 0) +
        (evaluationData.professionalism || 0) +
        (evaluationData.student_engagement || 0)) /
      6;

    return db.query(
      `INSERT INTO faculty_evaluations
       (faculty_user_id, evaluator_id, evaluator_type, academic_period_id, course_id,
        evaluation_date, teaching_effectiveness, subject_knowledge, classroom_management,
        communication_skills, professionalism, student_engagement, overall_rating,
        comments, recommendations, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        evaluationData.faculty_user_id,
        evaluationData.evaluator_id,
        evaluationData.evaluator_type,
        evaluationData.academic_period_id,
        evaluationData.course_id,
        evaluationData.evaluation_date || new Date(),
        evaluationData.teaching_effectiveness,
        evaluationData.subject_knowledge,
        evaluationData.classroom_management,
        evaluationData.communication_skills,
        evaluationData.professionalism,
        evaluationData.student_engagement,
        overall.toFixed(2),
        evaluationData.comments,
        evaluationData.recommendations,
        evaluationData.status || "draft",
      ],
    );
  },

  update: (evaluationId, evaluationData) => {
    const overall =
      ((evaluationData.teaching_effectiveness || 0) +
        (evaluationData.subject_knowledge || 0) +
        (evaluationData.classroom_management || 0) +
        (evaluationData.communication_skills || 0) +
        (evaluationData.professionalism || 0) +
        (evaluationData.student_engagement || 0)) /
      6;

    return db.query(
      `UPDATE faculty_evaluations SET
       faculty_user_id = ?, evaluator_id = ?, evaluator_type = ?, academic_period_id = ?,
       course_id = ?, evaluation_date = ?, teaching_effectiveness = ?,
       subject_knowledge = ?, classroom_management = ?, communication_skills = ?,
       professionalism = ?, student_engagement = ?, overall_rating = ?,
       comments = ?, recommendations = ?, status = ?
       WHERE evaluation_id = ?`,
      [
        evaluationData.faculty_user_id,
        evaluationData.evaluator_id,
        evaluationData.evaluator_type,
        evaluationData.academic_period_id,
        evaluationData.course_id,
        evaluationData.evaluation_date,
        evaluationData.teaching_effectiveness,
        evaluationData.subject_knowledge,
        evaluationData.classroom_management,
        evaluationData.communication_skills,
        evaluationData.professionalism,
        evaluationData.student_engagement,
        overall.toFixed(2),
        evaluationData.comments,
        evaluationData.recommendations,
        evaluationData.status,
        evaluationId,
      ],
    );
  },

  delete: (evaluationId) => {
    return db.query("DELETE FROM faculty_evaluations WHERE evaluation_id = ?", [
      evaluationId,
    ]);
  },

  getAverageRatings: (facultyUserId, academicPeriodId = null) => {
    let query = `
      SELECT 
        AVG(teaching_effectiveness) as avg_teaching,
        AVG(subject_knowledge) as avg_knowledge,
        AVG(classroom_management) as avg_classroom,
        AVG(communication_skills) as avg_communication,
        AVG(professionalism) as avg_professionalism,
        AVG(student_engagement) as avg_engagement,
        AVG(overall_rating) as avg_overall,
        COUNT(*) as evaluation_count
      FROM faculty_evaluations
      WHERE faculty_user_id = ? AND status = 'submitted'
    `;

    const params = [facultyUserId];

    if (academicPeriodId) {
      query += " AND academic_period_id = ?";
      params.push(academicPeriodId);
    }

    return db.query(query, params);
  },
};

export default FacultyEvaluation;
