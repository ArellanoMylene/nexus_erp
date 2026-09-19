import pool from "../config/db.js";

const tests = [
  {
    name: "payroll stats",
    q: `SELECT COUNT(DISTINCT ps.payroll_setup_id) as total_payroll_records,
          SUM(p.gross_pay) as total_gross
        FROM payroll_setup ps
        INNER JOIN payslips p ON ps.payroll_setup_id = p.payroll_setup_id
        WHERE YEAR(ps.payroll_period_start) = YEAR(CURDATE())
          AND MONTH(ps.payroll_period_start) = MONTH(CURDATE())`,
  },
  {
    name: "student reports",
    q: `SELECT u.user_id, sd.student_number,
          CONCAT(u.first_name,' ',u.last_name) AS student_name,
          sd.year_level, u.status, p.code as program_code,
          AVG(g.numerical_grade) as gpa
        FROM users u
        INNER JOIN student_details sd ON u.user_id = sd.user_id
        LEFT JOIN programs p ON sd.course = p.name
        LEFT JOIN enrollments e ON u.user_id = e.student_id
        LEFT JOIN academic_periods ap ON e.academic_period_id = ap.academic_period_id
        LEFT JOIN grades g ON u.user_id = g.student_id
        WHERE u.role = 'Student'
        GROUP BY u.user_id, e.enrollment_id, ap.academic_period_id
        LIMIT 2`,
  },
  {
    name: "enrollment reports",
    q: `SELECT e.enrollment_id, CONCAT(u.first_name,' ',u.last_name) AS student_name,
          p.code as program_code, ap.academic_year, ap.semester,
          COUNT(DISTINCT ec.course_id) as enrolled_courses, SUM(c.units) as total_units
        FROM enrollments e
        INNER JOIN users u ON e.student_id = u.user_id
        INNER JOIN student_details sd ON u.user_id = sd.user_id
        LEFT JOIN programs p ON sd.course = p.name
        LEFT JOIN academic_periods ap ON e.academic_period_id = ap.academic_period_id
        LEFT JOIN enrollment_courses ec ON e.enrollment_id = ec.enrollment_id
        LEFT JOIN courses c ON ec.course_id = c.course_id
        WHERE 1=1
        GROUP BY e.enrollment_id
        LIMIT 2`,
  },
  {
    name: "student attendance",
    q: `SELECT sa.attendance_id, sa.attendance_date, sa.time_in, sa.status,
          CONCAT(u.first_name,' ',u.last_name) AS student_name,
          sd.student_number, c.course_code
        FROM student_attendance sa
        INNER JOIN users u ON sa.student_id = u.user_id
        INNER JOIN student_details sd ON u.user_id = sd.user_id
        LEFT JOIN courses c ON sa.course_id = c.course_id
        ORDER BY sa.attendance_date DESC
        LIMIT 2`,
  },
  {
    name: "grades",
    q: `SELECT * FROM grades LIMIT 2`,
  },
  {
    name: "enrollment_courses table exists",
    q: `SELECT COUNT(*) as cnt FROM enrollment_courses LIMIT 1`,
  },
];

for (const t of tests) {
  try {
    const [r] = await pool.query(t.q);
    console.log(`✓ ${t.name}: OK (${r.length} rows)`);
  } catch (e) {
    console.error(`✗ ${t.name}: FAIL — ${e.message}`);
  }
}

process.exit(0);
