import pool from "../config/db.js";

const GradesModel = {
  // Live-computed: aggregates directly from grade_entries (approved entries
  // only count toward prelim/midterm/finals/final). No physical `grades`
  // row is read anymore — grade_id is a synthetic composite key
  // "{student_id}-{course_id}-{period_id}" so the frontend still has
  // something unique to key/act on.
  getAllGrades: async (filters = {}) => {
    try {
      let query = `
        SELECT
          CONCAT(ge.student_id, '-', ge.course_id, '-', ge.period_id) AS grade_id,
          ge.student_id AS student_user_id,
          ge.course_id,
          ge.period_id,
          CONCAT(u.first_name, ' ', u.last_name) AS student_name,
          u.first_name,
          u.last_name,
          sd.student_number AS student_id,
          c.code AS course_code,
          c.title AS course_title,
          c.units,
          ap.school_year AS period_name,
          ap.semester AS year,
          ROUND(SUM(CASE WHEN ge.label = 'prelim'  AND ge.approval_status = 'approved' THEN ge.weighted_score ELSE 0 END), 2) AS prelim_grade,
          ROUND(SUM(CASE WHEN ge.label = 'midterm' AND ge.approval_status = 'approved' THEN ge.weighted_score ELSE 0 END), 2) AS midterm_grade,
          ROUND(SUM(CASE WHEN ge.label = 'finals'  AND ge.approval_status = 'approved' THEN ge.weighted_score ELSE 0 END), 2) AS finals_grade,
          COUNT(*) AS total_entries,
          SUM(CASE WHEN ge.approval_status = 'approved' THEN 1 ELSE 0 END) AS approved_entries
        FROM grade_entries ge
        LEFT JOIN users u ON ge.student_id = u.user_id
        LEFT JOIN student_details sd ON u.user_id = sd.user_id
        LEFT JOIN courses c ON ge.course_id = c.course_id
        LEFT JOIN academic_periods ap ON ge.period_id = ap.period_id
        WHERE 1=1
      `;
      const params = [];

      if (filters.student_user_id) {
        query += " AND ge.student_id = ?";
        params.push(filters.student_user_id);
      }
      if (filters.course_id) {
        query += " AND ge.course_id = ?";
        params.push(filters.course_id);
      }
      if (filters.period_id) {
        query += " AND ge.period_id = ?";
        params.push(filters.period_id);
      }

      query += " GROUP BY ge.student_id, ge.course_id, ge.period_id ORDER BY MAX(ge.submitted_at) DESC";

      const [rows] = await pool.query(query, params);

      // status/final_grade/remarks are derived in JS, not SQL, so the
      // weighted-average formula lives in one place (see grades.service.js)
      return rows.map((row) => {
        const prelim = Number(row.prelim_grade) || 0;
        const midterm = Number(row.midterm_grade) || 0;
        const finals = Number(row.finals_grade) || 0;
        const hasAnyScore = prelim || midterm || finals;
        const final_grade = hasAnyScore
          ? Number((prelim * 0.3 + midterm * 0.3 + finals * 0.4).toFixed(2))
          : null;
        const remarks = final_grade === null ? null : final_grade >= 75 ? "PASSED" : "FAILED";
        const status = row.total_entries > 0 && row.approved_entries === row.total_entries
          ? "approved"
          : "submitted";

        return {
          ...row,
          prelim_grade: prelim || null,
          midterm_grade: midterm || null,
          finals_grade: finals || null,
          final_grade,
          remarks,
          status,
        };
      });
    } catch (error) {
      throw error;
    }
  },

  // Single computed row, by composite key
  getGradeByComposite: async (studentId, courseId, periodId) => {
    try {
      const rows = await GradesModel.getAllGrades({
        student_user_id: studentId,
        course_id: courseId,
        period_id: periodId,
      });
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  // Bulk-approve every grade_entries row for this student/course/period.
  // This is what "Approve" on GradeManagement now does — it's a shortcut
  // over the per-entry approval flow in GradeEntryApproval.jsx.
  approveAllEntriesFor: async (studentId, courseId, periodId, approvedBy) => {
    try {
      const [result] = await pool.query(
        `UPDATE grade_entries
         SET approval_status = 'approved', approved_by = ?, approved_at = NOW()
         WHERE student_id = ? AND course_id = ? AND period_id = ?
           AND approval_status != 'approved'`,
        [approvedBy, studentId, courseId, periodId],
      );
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  },
};

export default GradesModel;