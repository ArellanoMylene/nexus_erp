import pool from "../config/db.js";
import * as tf from "@tensorflow/tfjs";

const formatAcademicPeriodLabel = (period) => {
  if (!period) return "Unknown period";

  const parts = [];
  if (period.academic_year) parts.push(period.academic_year);
  if (period.semester) parts.push(period.semester);

  return parts.length ? parts.join(" - ") : `Period ${period.period_id ?? "Unknown"}`;
};

const calculateEnrollmentForecast = async (series) => {
  if (!Array.isArray(series) || series.length < 2) {
    const latestCount = series?.[series.length - 1]?.enrollment_count || 0;
    return {
      predicted_next_enrollment: latestCount,
      method: "fallback_last_value",
      confidence: 0,
    };
  }

  const xValues = series.map((_, index) => index);
  const yValues = series.map((point) => Number(point.enrollment_count || 0));

  const xTensor = tf.tensor2d(xValues.map((value) => [value]), [xValues.length, 1]);
  const yTensor = tf.tensor2d(yValues.map((value) => [value]), [yValues.length, 1]);

  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
  model.compile({
    loss: "meanSquaredError",
    optimizer: tf.train.adam(0.1),
  });

  await model.fit(xTensor, yTensor, {
    epochs: Math.min(200, 40 + xValues.length * 10),
    verbose: 0,
  });

  const predictionTensor = model.predict(tf.tensor2d([[xValues.length]], [1, 1]));
  const predictionValues = await predictionTensor.data();
  const regressionPrediction = Number(predictionValues[0] || 0);

  const recentWindow = yValues.slice(-3);
  const weightedAverage =
    recentWindow.length === 1
      ? recentWindow[0]
      : recentWindow.reduce((sum, value, index) => sum + value * (index + 1), 0) /
        recentWindow.reduce((sum, _, index) => sum + (index + 1), 0);

  const mixedPrediction = regressionPrediction * 0.6 + weightedAverage * 0.4;
  const predictedNextEnrollment = Math.max(0, Math.round(mixedPrediction));

  const yMean = yValues.reduce((sum, value) => sum + value, 0) / yValues.length;
  const variance = yValues.reduce((sum, value) => sum + (value - yMean) ** 2, 0) / yValues.length;
  const confidence = Math.max(0, Math.min(1, 1 - Math.sqrt(variance) / (yMean + 1)));

  tf.dispose([xTensor, yTensor, predictionTensor]);
  model.dispose();

  return {
    predicted_next_enrollment: predictedNextEnrollment,
    method: "linear_regression_weighted_average",
    confidence: Number(confidence.toFixed(2)),
  };
};

const ReportsModel = {
  // Get student reports with filters
  async getStudentReports(filters = {}) {
    let query = `
      SELECT 
        u.user_id as student_id,
        sd.student_number,
        CONCAT(u.first_name, ' ', IFNULL(u.middle_name, ''), ' ', u.last_name) AS student_name,
        u.email,
        u.phone as phone_number,
        u.gender,
        u.date_of_birth as birth_date,
        sd.year_level,
        u.status,
        p.name as program_name,
        COALESCE(p.code, sd.course) as program_code,
        e.enrollment_id,
        e.enrollment_date,
        e.status AS enrollment_status,
        ap.school_year as academic_year,
        ap.semester,
        COUNT(DISTINCT g.grade_id) as total_grades,
        AVG(g.final_grade) as gpa
      FROM users u
      INNER JOIN student_details sd ON u.user_id = sd.user_id
      LEFT JOIN programs p ON sd.course = p.name OR sd.course = p.code
      LEFT JOIN enrollments e ON u.user_id = e.student_id
      LEFT JOIN academic_periods ap ON e.period_id = ap.period_id
      LEFT JOIN grades g ON u.user_id = g.student_user_id
      WHERE u.role = 'Student'
    `;

    const params = [];

    if (filters.program_id) {
      query += ` AND p.program_id = ?`;
      params.push(filters.program_id);
    }

    if (filters.year_level) {
      query += ` AND sd.year_level = ?`;
      params.push(filters.year_level);
    }

    if (filters.status) {
      query += ` AND u.status = ?`;
      params.push(filters.status);
    }

    if (filters.search) {
      query += ` AND (sd.student_number LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters.date_from) {
      query += ` AND e.enrollment_date >= ?`;
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ` AND e.enrollment_date <= ?`;
      params.push(filters.date_to);
    }

    query += ` GROUP BY u.user_id, sd.student_number, sd.year_level, u.email, u.phone, u.gender, u.date_of_birth, u.status, u.first_name, u.middle_name, u.last_name, p.name, p.code, sd.course, e.enrollment_id, e.enrollment_date, e.status, ap.school_year, ap.semester, ap.period_id ORDER BY sd.student_number ASC`;

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Get enrollment reports with filters
  async getEnrollmentReports(filters = {}) {
    let query = `
      SELECT 
        e.enrollment_id,
        e.enrollment_date,
        e.status AS enrollment_status,
        e.year_level,
        CONCAT(u.first_name, ' ', u.last_name) AS student_name,
        sd.student_number,
        u.email,
        p.name as program_name,
        p.code as program_code,
        ap.school_year as academic_year,
        ap.semester,
        ap.start_date,
        ap.end_date,
        c.code as course_code,
        c.title as course_title,
        c.units as total_units
      FROM enrollments e
      INNER JOIN users u ON e.student_id = u.user_id
      INNER JOIN student_details sd ON u.user_id = sd.user_id
      LEFT JOIN programs p ON sd.course = p.name
      LEFT JOIN academic_periods ap ON e.period_id = ap.period_id
      LEFT JOIN courses c ON e.course_id = c.course_id
      WHERE 1=1
    `;

    const params = [];

    if (filters.academic_period_id) {
      query += ` AND e.period_id = ?`;
      params.push(filters.academic_period_id);
    }

    if (filters.program_id) {
      query += ` AND p.program_id = ?`;
      params.push(filters.program_id);
    }

    if (filters.status) {
      query += ` AND e.status = ?`;
      params.push(filters.status);
    }

    if (filters.date_from) {
      query += ` AND e.enrollment_date >= ?`;
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ` AND e.enrollment_date <= ?`;
      params.push(filters.date_to);
    }

    query += ` ORDER BY e.enrollment_date DESC`;

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Get enrollment trend data for analytics and forecasting
  async getEnrollmentTrends(filters = {}) {
    let query = `
      SELECT
        ap.period_id,
        ap.school_year AS academic_year,
        ap.semester,
        p.program_id,
        p.code AS program_code,
        p.name AS program_name,
        COUNT(DISTINCT e.enrollment_id) AS enrollment_count
      FROM enrollments e
      INNER JOIN academic_periods ap ON e.period_id = ap.period_id
      INNER JOIN users u ON e.student_id = u.user_id
      INNER JOIN student_details sd ON u.user_id = sd.user_id
      LEFT JOIN programs p ON sd.course = p.name OR sd.course = p.code
      WHERE 1=1
    `;

    const params = [];

    if (filters.program_id) {
      query += ` AND p.program_id = ?`;
      params.push(filters.program_id);
    } else if (filters.program_code) {
      query += ` AND p.code = ?`;
      params.push(filters.program_code);
    }

    if (filters.date_from) {
      query += ` AND e.enrollment_date >= ?`;
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ` AND e.enrollment_date <= ?`;
      params.push(filters.date_to);
    }

    query += `
      GROUP BY ap.period_id, ap.school_year, ap.semester, p.program_id, p.code, p.name
      ORDER BY ap.start_date ASC, p.name ASC
    `;

    const [rows] = await pool.query(query, params);

    const periodMap = new Map();
    const programMap = new Map();

    for (const row of rows) {
      const periodKey = row.period_id;
      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, {
          period_id: row.period_id,
          academic_year: row.academic_year,
          semester: row.semester,
          period_label: formatAcademicPeriodLabel(row),
          total_enrollment_count: 0,
          programs: [],
        });
      }

      const normalizedCount = Number(row.enrollment_count || 0);
      const existingPeriod = periodMap.get(periodKey);
      existingPeriod.total_enrollment_count += normalizedCount;
      existingPeriod.programs.push({
        program_id: row.program_id,
        program_code: row.program_code,
        program_name: row.program_name,
        enrollment_count: normalizedCount,
      });

      if (row.program_id) {
        const programKey = row.program_id;
        if (!programMap.has(programKey)) {
          programMap.set(programKey, {
            program_id: row.program_id,
            program_code: row.program_code,
            program_name: row.program_name,
            series: [],
          });
        }

        programMap.get(programKey).series.push({
          period_id: row.period_id,
          academic_year: row.academic_year,
          semester: row.semester,
          period_label: formatAcademicPeriodLabel(row),
          enrollment_count: normalizedCount,
        });
      }
    }

    const periods = [...periodMap.values()];
    const programs = [...programMap.values()].map((program) => ({
      ...program,
      total_enrollment_count: program.series.reduce((sum, item) => sum + Number(item.enrollment_count || 0), 0),
    }));

    let trendSeries = periods.map((period) => ({
      period_id: period.period_id,
      academic_year: period.academic_year,
      semester: period.semester,
      period_label: period.period_label,
      total_enrollment_count: period.total_enrollment_count,
      programs: period.programs,
    }));

    let selectedProgram = null;
    let forecast = null;

    if (filters.program_id || filters.program_code) {
      selectedProgram = programs.find((program) =>
        filters.program_id
          ? String(program.program_id) === String(filters.program_id)
          : String(program.program_code || "").toLowerCase() === String(filters.program_code || "").toLowerCase(),
      ) || null;

      if (selectedProgram) {
        trendSeries = selectedProgram.series;
        forecast = await calculateEnrollmentForecast(selectedProgram.series);
      }
    } else {
      forecast = await calculateEnrollmentForecast(
        trendSeries.map((period) => ({
          enrollment_count: period.total_enrollment_count,
        })),
      );
    }

    const nextPeriodLabel = trendSeries.length
      ? `Next after ${trendSeries[trendSeries.length - 1].period_label}`
      : "Next period";

    return {
      series: trendSeries,
      programs,
      selected_program: selectedProgram,
      forecast: {
        ...forecast,
        target_period_label: nextPeriodLabel,
      },
    };
  },

  // Get attendance reports (student or staff)
  async getAttendanceReports(filters = {}) {
    if (filters.type === "student") {
      let query = `
        SELECT 
          sa.attendance_id,
          sa.attendance_date,
          sa.time_in,
          sa.status,
          sa.remarks,
          CONCAT(u.first_name, ' ', u.last_name) AS student_name,
          sd.student_number,
          c.code AS course_code,
          c.title AS course_name,
          sec.section_name,
          CONCAT(f.first_name, ' ', f.last_name) AS marked_by_name
        FROM student_attendance sa
        INNER JOIN users u ON sa.student_id = u.user_id
        INNER JOIN student_details sd ON u.user_id = sd.user_id
        LEFT JOIN courses c ON sa.course_id = c.course_id
        LEFT JOIN sections sec ON sa.section_id = sec.section_id
        LEFT JOIN users f ON sa.marked_by = f.user_id
        WHERE 1=1
      `;

      const params = [];

      if (filters.date_from) {
        query += ` AND sa.attendance_date >= ?`;
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        query += ` AND sa.attendance_date <= ?`;
        params.push(filters.date_to);
      }

      if (filters.status) {
        query += ` AND sa.status = ?`;
        params.push(filters.status);
      }

      if (filters.section_id) {
        query += ` AND sa.section_id = ?`;
        params.push(filters.section_id);
      }

      query += ` ORDER BY sa.attendance_date DESC, sd.student_number ASC`;

      const [rows] = await pool.query(query, params);
      return rows;
    } else if (filters.type === "staff") {
      let query = `
        SELECT 
          sa.attendance_id,
          sa.attendance_date,
          sa.time_in,
          sa.time_out,
          sa.status,
          sa.remarks,
          sa.attendance_method,
          CONCAT(u.first_name, ' ', u.last_name) AS staff_name,
          er.employee_number,
          er.department,
          TIMESTAMPDIFF(HOUR, sa.time_in, sa.time_out) as hours_worked
        FROM staff_attendance sa
        INNER JOIN users u ON sa.user_id = u.user_id
        LEFT JOIN employee_records er ON u.user_id = er.user_id
        WHERE 1=1
      `;

      const params = [];

      if (filters.date_from) {
        query += ` AND sa.attendance_date >= ?`;
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        query += ` AND sa.attendance_date <= ?`;
        params.push(filters.date_to);
      }

      if (filters.status) {
        query += ` AND sa.status = ?`;
        params.push(filters.status);
      }

      if (filters.department) {
        query += ` AND er.department = ?`;
        params.push(filters.department);
      }

      query += ` ORDER BY sa.attendance_date DESC`;

      const [rows] = await pool.query(query, params);
      return rows;
    }

    return [];
  },

  // Get payroll reports
  async getPayrollReports(filters = {}) {
    let query = `
      SELECT 
        ps.payroll_setup_id as payroll_id,
        ps.payroll_period_start as pay_period_start,
        ps.payroll_period_end as pay_period_end,
        ps.payment_date,
        p.gross_pay as gross_salary,
        p.total_deductions,
        p.net_pay as net_salary,
        ps.status,
        ps.payment_method,
        CONCAT(u.first_name, ' ', u.last_name) AS employee_name,
        ed.employee_id,
        ed.department,
        ed.position_title as position,
        GROUP_CONCAT(DISTINCT d.deduction_type) as deductions_list
      FROM payroll_setup ps
      INNER JOIN payslips p ON ps.payroll_setup_id = p.payroll_setup_id
      INNER JOIN users u ON p.employee_id = u.user_id
      INNER JOIN employee_details ed ON u.user_id = ed.user_id
      LEFT JOIN deductions d ON p.employee_id = d.employee_id
      WHERE 1=1
    `;

    const params = [];

    if (filters.date_from) {
      query += ` AND ps.payroll_period_start >= ?`;
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ` AND ps.payroll_period_end <= ?`;
      params.push(filters.date_to);
    }

    if (filters.department) {
      query += ` AND ed.department = ?`;
      params.push(filters.department);
    }

    if (filters.status) {
      query += ` AND ps.status = ?`;
      params.push(filters.status);
    }

    query += ` GROUP BY ps.payroll_setup_id, p.payslip_id, ps.payroll_period_start, ps.payroll_period_end, ps.payment_date, p.gross_pay, p.total_deductions, p.net_pay, ps.status, ps.payment_method, u.first_name, u.last_name, ed.employee_id, ed.department, ed.position_title ORDER BY ps.payroll_period_start DESC`;

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Get summary statistics
  async getSummaryStatistics() {
    const [studentStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_students,
        SUM(CASE WHEN u.status = 'Active' THEN 1 ELSE 0 END) as active_students,
        SUM(CASE WHEN u.status = 'Inactive' THEN 1 ELSE 0 END) as inactive_students,
        SUM(CASE WHEN u.gender = 'Male' THEN 1 ELSE 0 END) as male_students,
        SUM(CASE WHEN u.gender = 'Female' THEN 1 ELSE 0 END) as female_students
      FROM users u
      WHERE u.role = 'Student'
    `);

    const [enrollmentStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_enrollments,
        SUM(CASE WHEN status = 'enrolled' THEN 1 ELSE 0 END) as enrolled,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'dropped' THEN 1 ELSE 0 END) as dropped
      FROM enrollments
    `);

    // Count admissions marked as enrolled (admissions.status uses 'Enrolled')
    const [admissionsStats] = await pool.query(`
      SELECT
        COUNT(*) as enrolled
      FROM admissions
      WHERE status = 'Enrolled'
    `);

    const [attendanceStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_attendance_records,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
      FROM student_attendance
      WHERE DATE(attendance_date) = CURDATE()
    `);

    const [payrollStats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT ps.payroll_setup_id) as total_payroll_records,
        SUM(p.gross_pay) as total_gross,
        SUM(p.total_deductions) as total_deductions,
        SUM(p.net_pay) as total_net
      FROM payroll_setup ps
      INNER JOIN payslips p ON ps.payroll_setup_id = p.payroll_setup_id
      WHERE YEAR(ps.payroll_period_start) = YEAR(CURDATE())
        AND MONTH(ps.payroll_period_start) = MONTH(CURDATE())
    `);

    return {
      students: studentStats[0],
      enrollments: enrollmentStats[0],
      admissions: admissionsStats[0] || { enrolled: 0 },
      attendance: attendanceStats[0],
      payroll: payrollStats[0],
    };
  },

  // Get report templates
  async getReportTemplates() {
    const [rows] = await pool.query(
      "SELECT * FROM report_templates WHERE is_active = 1 ORDER BY template_name",
    );
    return rows;
  },

  // Create saved report
  async createSavedReport(data) {
    const [result] = await pool.query(
      `INSERT INTO saved_reports (
        report_name, report_type, template_id, generated_by,
        parameters, filters_applied, file_path, file_format,
        file_size, data_snapshot, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.report_name,
        data.report_type,
        data.template_id,
        data.generated_by,
        JSON.stringify(data.parameters || {}),
        JSON.stringify(data.filters_applied || {}),
        data.file_path,
        data.file_format,
        data.file_size,
        JSON.stringify(data.data_snapshot || {}),
        data.status || "completed",
      ],
    );
    return result.insertId;
  },

  // Get saved reports
  async getSavedReports(filters = {}) {
    let query = `
      SELECT 
        sr.*,
        CONCAT(u.first_name, ' ', u.last_name) AS generated_by_name
      FROM saved_reports sr
      LEFT JOIN users u ON sr.generated_by = u.user_id
      WHERE 1=1
    `;

    const params = [];

    if (filters.report_type) {
      query += " AND sr.report_type = ?";
      params.push(filters.report_type);
    }

    if (filters.generated_by) {
      query += " AND sr.generated_by = ?";
      params.push(filters.generated_by);
    }

    query += " ORDER BY sr.generated_date DESC";

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Create export log
  async createExportLog(data) {
    const [result] = await pool.query(
      `INSERT INTO report_exports (
        report_id, export_type, export_format, exported_by,
        record_count, file_size, file_path, filters_applied
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.report_id,
        data.export_type,
        data.export_format,
        data.exported_by,
        data.record_count,
        data.file_size,
        data.file_path,
        JSON.stringify(data.filters_applied || {}),
      ],
    );
    return result.insertId;
  },

  // Get enrollment by program (aggregated view)
  async getEnrollmentByProgram(filters = {}) {
    let query = `
      SELECT
        p.program_id,
        p.code AS program_code,
        p.name AS program_name,
        COUNT(DISTINCT e.enrollment_id) AS enrollment_count,
        COUNT(DISTINCT e.student_id) AS unique_students
      FROM enrollments e
      INNER JOIN users u ON e.student_id = u.user_id
      INNER JOIN student_details sd ON u.user_id = sd.user_id
      LEFT JOIN programs p ON sd.course = p.name OR sd.course = p.code
      WHERE 1=1
    `;

    const params = [];

    if (filters.program_id) {
      query += ` AND p.program_id = ?`;
      params.push(filters.program_id);
    }

    if (filters.date_from) {
      query += ` AND e.enrollment_date >= ?`;
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ` AND e.enrollment_date <= ?`;
      params.push(filters.date_to);
    }

    if (filters.status) {
      query += ` AND e.status = ?`;
      params.push(filters.status);
    }

    query += `
      GROUP BY p.program_id, p.code, p.name
      ORDER BY enrollment_count DESC
    `;

    const [rows] = await pool.query(query, params);

    return rows.map((row) => ({
      program_id: row.program_id,
      program_code: row.program_code,
      name: row.program_name || "Unknown Program",
      count: Number(row.enrollment_count || 0),
      unique_students: Number(row.unique_students || 0),
    }));
  },
};

export default ReportsModel;
