import db from "../config/db.js";

const parseQuizOptions = (optionsValue, questionType) => {
  if (Array.isArray(optionsValue)) return optionsValue;

  if (optionsValue === null || optionsValue === undefined) {
    return questionType === "true_false" ? ["True", "False"] : [];
  }

  if (typeof optionsValue === "object") {
    return [];
  }

  const raw = String(optionsValue).trim();
  if (!raw) {
    return questionType === "true_false" ? ["True", "False"] : [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === "string") return parsed ? [parsed] : [];
    return [];
  } catch {
    if (questionType === "true_false") return ["True", "False"];
    return [];
  }
};

const serializeQuizOptions = (optionsValue, questionType) => {
  if (Array.isArray(optionsValue)) return JSON.stringify(optionsValue);

  if (typeof optionsValue === "string") {
    const trimmed = optionsValue.trim();
    if (!trimmed) {
      return JSON.stringify(questionType === "true_false" ? ["True", "False"] : []);
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return JSON.stringify(parsed);
      if (typeof parsed === "string") return JSON.stringify([parsed]);
      return JSON.stringify([]);
    } catch {
      return JSON.stringify([]);
    }
  }

  return JSON.stringify(questionType === "true_false" ? ["True", "False"] : []);
};

const LMSAssignments = {
  // Create a new assignment
  create: async (assignmentData) => {
    const {
      faculty_id,
      section_id,
      course_id,
      title,
      description,
      assignment_type,
      total_points,
      due_date,
      academic_period_id,
      allow_late_submission,
      instructions,
      model_answer,
      model_answer_file_url,
    } = assignmentData;

    const query = `
      INSERT INTO lms_assignments 
      (faculty_id, section_id, course_id, title, description, assignment_type, 
       total_points, due_date, academic_period_id, allow_late_submission, 
       instructions, model_answer, model_answer_file_url, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'active')
    `;

    const [result] = await db.query(query, [
      faculty_id,
      section_id,
      course_id,
      title,
      description,
      assignment_type,
      total_points,
      due_date,
      academic_period_id,
      allow_late_submission || 0,
      instructions,
      model_answer || null,
      model_answer_file_url || "",
    ]);

    return result.insertId;
  },

  // Get all assignments by faculty
  getByFaculty: async (faculty_id, academic_period_id) => {
    const query = `
      SELECT 
        la.*,
        c.title as course_name,
        c.code as course_code,
        s.section_name,
        COUNT(DISTINCT las.student_id) as submission_count,
        COUNT(DISTINCT CASE WHEN las.status = 'graded' THEN las.student_id END) as graded_count
      FROM lms_assignments la
      LEFT JOIN courses c ON la.course_id = c.course_id
      LEFT JOIN sections s ON la.section_id = s.section_id
      LEFT JOIN lms_assignment_submissions las ON la.id = las.assignment_id
      WHERE la.faculty_id = ? AND la.academic_period_id = ?
      GROUP BY la.id
      ORDER BY la.created_at DESC
    `;

    const [rows] = await db.query(query, [faculty_id, academic_period_id]);
    return rows;
  },

  // Get assignments by section
  getBySection: async (section_id, academic_period_id) => {
    const query = `
      SELECT 
        la.*,
        c.title as course_name,
        c.code as course_code,
        CONCAT(u.first_name, ' ', u.last_name) as faculty_name
      FROM lms_assignments la
      LEFT JOIN courses c ON la.course_id = c.course_id
      LEFT JOIN users u ON la.faculty_id = u.user_id
      WHERE la.section_id = ? AND la.academic_period_id = ?
      ORDER BY la.due_date ASC
    `;

    const [rows] = await db.query(query, [section_id, academic_period_id]);
    return rows;
  },

  // Get assignments for a student based on their enrolled courses
  getByStudent: async (student_id, academic_period_id) => {
    const query = `
      SELECT DISTINCT
        la.*,
        c.code as course_code,
        c.title as course_name,
        s.section_name,
        CONCAT(u.first_name, ' ', u.last_name) as faculty_name,
        las.id as submission_id,
        las.status as submission_status,
        las.score as submission_score,
        las.submitted_at,
        las.submission_text,
        las.feedback,
        las.graded_at,
        CONCAT(grader.first_name, ' ', grader.last_name) as graded_by_name,
        -- Guarantee instructions exists (la.instructions is part of la.* but ensure not null on client)
        COALESCE(la.instructions, '') as instructions,
        -- Prefer assignment-level attachment, fall back to student's submitted file if present
        COALESCE(la.model_answer_file_url, las.file_url, '') as file_url,
        CASE
          WHEN la.model_answer_file_url IS NOT NULL AND la.model_answer_file_url <> ''
            THEN SUBSTRING_INDEX(la.model_answer_file_url, '/', -1)
          ELSE COALESCE(las.file_name, '')
        END as file_name
      FROM lms_assignments la
      INNER JOIN enrollments e ON la.course_id = e.course_id 
        AND la.academic_period_id = e.period_id
      LEFT JOIN courses c ON la.course_id = c.course_id
      LEFT JOIN sections s ON la.section_id = s.section_id
      LEFT JOIN users u ON la.faculty_id = u.user_id
      LEFT JOIN lms_assignment_submissions las ON la.id = las.assignment_id AND las.student_id = ?
      LEFT JOIN users grader ON las.graded_by = grader.user_id
      WHERE e.student_id = ? 
        AND e.period_id = ? 
        AND e.status = 'Enrolled'
        AND la.status = 'active'
      ORDER BY la.due_date ASC
    `;
    const [rows] = await db.query(query, [student_id, student_id, academic_period_id]);
    return rows;
  },

  // Get assignment by ID
  getById: async (id) => {
    const query = `
      SELECT 
        la.*,
        c.title as course_name,
        c.code as course_code,
        s.section_name,
        CONCAT(u.first_name, ' ', u.last_name) as faculty_name
      FROM lms_assignments la
      LEFT JOIN courses c ON la.course_id = c.course_id
      LEFT JOIN sections s ON la.section_id = s.section_id
      LEFT JOIN users u ON la.faculty_id = u.user_id
      WHERE la.id = ?
    `;

    const [rows] = await db.query(query, [id]);
    return rows[0];
  },

  // Update assignment
  update: async (id, updateData) => {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach((key) => {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    });

    values.push(id);

    const query = `
      UPDATE lms_assignments 
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE id = ?
    `;

    const [result] = await db.query(query, values);
    return result.affectedRows > 0;
  },

  // Delete assignment
  delete: async (id) => {
    const query = "DELETE FROM lms_assignments WHERE id = ?";
    const [result] = await db.query(query, [id]);
    return result.affectedRows > 0;
  },

  // Submit assignment
  submitAssignment: async (submissionData) => {
    const {
      assignment_id,
      student_id,
      submission_text,
      file_url,
      file_name,
    } = submissionData;

    const query = `
      INSERT INTO lms_assignment_submissions 
      (assignment_id, student_id, submission_text, file_url, file_name, 
       submitted_at, status)
      VALUES (?, ?, ?, ?, ?, NOW(), 'submitted')
      ON DUPLICATE KEY UPDATE 
        submission_text = VALUES(submission_text),
        file_url = VALUES(file_url),
        file_name = VALUES(file_name),
        submitted_at = NOW(),
        status = 'submitted',
        id = LAST_INSERT_ID(id)
    `;

    const [result] = await db.query(query, [
      assignment_id,
      student_id,
      submission_text,
      file_url,
      file_name,
    ]);

    if (result.insertId) {
      return result.insertId;
    }

    const [rows] = await db.query(
      `SELECT id FROM lms_assignment_submissions WHERE assignment_id = ? AND student_id = ? LIMIT 1`,
      [assignment_id, student_id]
    );

    return rows[0]?.id || null;
  },

  // Get submissions for an assignment
  getSubmissions: async (assignment_id) => {
    const query = `
      SELECT 
        las.*,
        CONCAT(u.first_name, ' ', u.last_name) as student_name,
        u.user_id as student_id,
        u.email
      FROM lms_assignment_submissions las
      LEFT JOIN users u ON las.student_id = u.user_id
      WHERE las.assignment_id = ?
      ORDER BY las.submitted_at DESC
    `;

    const [rows] = await db.query(query, [assignment_id]);
    return rows;
  },

  // Grade submission
  gradeSubmission: async (submission_id, gradeData) => {
    const { score, feedback, graded_by } = gradeData;

    const query = `
      UPDATE lms_assignment_submissions 
      SET score = ?, feedback = ?, graded_by = ?, graded_at = NOW(), status = 'graded'
      WHERE id = ?
    `;

    const [result] = await db.query(query, [score, feedback, graded_by, submission_id]);
    return result.affectedRows > 0;
  },

  // Get student submission
  getStudentSubmission: async (assignment_id, student_id) => {
    const query = `
      SELECT * FROM lms_assignment_submissions
      WHERE assignment_id = ? AND student_id = ?
    `;

    const [rows] = await db.query(query, [assignment_id, student_id]);
    return rows[0];
  },

  // Create quiz questions
  createQuizQuestion: async (questionData) => {
    const {
      assignment_id,
      question_text,
      question_type,
      options,
      correct_answer,
      points,
      order_num,
    } = questionData;

    const query = `
      INSERT INTO lms_quiz_questions 
      (assignment_id, question_text, question_type, options, correct_answer, points, order_num)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [
      assignment_id,
      question_text,
      question_type,
      serializeQuizOptions(options, question_type),
      correct_answer,
      points,
      order_num,
    ]);

    return result.insertId;
  },

  // Get quiz questions (for students - NO ANSWERS)
  getQuizQuestions: async (assignment_id) => {
    const query = `
      SELECT id, assignment_id, question_text, question_type, options, points, order_num 
      FROM lms_quiz_questions
      WHERE assignment_id = ?
      ORDER BY order_num ASC
    `;

    const [rows] = await db.query(query, [assignment_id]);
    return rows.map((row) => ({
      ...row,
      options: parseQuizOptions(row.options, row.question_type),
    }));
  },

  // Get quiz questions WITH answers (for grading/faculty)
  getQuizQuestionsWithAnswers: async (assignment_id) => {
    const query = `
      SELECT * FROM lms_quiz_questions
      WHERE assignment_id = ?
      ORDER BY order_num ASC
    `;

    const [rows] = await db.query(query, [assignment_id]);
    return rows.map((row) => ({
      ...row,
      options: parseQuizOptions(row.options, row.question_type),
    }));
  },
};

export default LMSAssignments;
