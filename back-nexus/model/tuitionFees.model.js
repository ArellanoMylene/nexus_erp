import db from "../config/db.js";

const TuitionFee = {
  // Create new tuition fee setup
  create: async (data) => {
    const query = `
      INSERT INTO tuition_fee_setup 
      (program_id, year_level, academic_period_id, tuition_fee, laboratory_fee, 
       library_fee, athletic_fee, registration_fee, id_fee, miscellaneous_fee, 
       other_fees, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(
      query,
      [
        data.program_id,
        data.year_level,
        data.academic_period_id,
        data.tuition_fee,
        data.laboratory_fee || 0,
        data.library_fee || 0,
        data.athletic_fee || 0,
        data.registration_fee || 0,
        data.id_fee || 0,
        data.miscellaneous_fee || 0,
        data.other_fees || 0,
        data.is_active !== undefined ? data.is_active : true,
        data.created_by,
      ]
    );
    return result;
  },

  // Get all tuition fee setups with filters
  getAll: async (filters) => {
    let query = `
      SELECT 
        tfs.*,
        p.name as program_name,
        p.code as program_code,
        ap.school_year,
        ap.semester,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM tuition_fee_setup tfs
      LEFT JOIN programs p ON tfs.program_id = p.program_id
      LEFT JOIN academic_periods ap ON tfs.academic_period_id = ap.period_id
      LEFT JOIN users u ON tfs.created_by = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.program_id) {
      query += " AND tfs.program_id = ?";
      params.push(filters.program_id);
    }
    if (filters.academic_period_id) {
      query += " AND tfs.academic_period_id = ?";
      params.push(filters.academic_period_id);
    }
    if (filters.year_level) {
      query += " AND tfs.year_level = ?";
      params.push(filters.year_level);
    }
    if (filters.is_active !== undefined) {
      query += " AND tfs.is_active = ?";
      params.push(filters.is_active);
    }

    query += " ORDER BY tfs.created_at DESC";
    const [rows] = await db.query(query, params);
    return rows;
  },

  // Get tuition fee by ID
  getById: async (id) => {
    const query = `
      SELECT 
        tfs.*,
        p.name as program_name,
        p.code as program_code,
        ap.school_year,
        ap.semester,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM tuition_fee_setup tfs
      LEFT JOIN programs p ON tfs.program_id = p.program_id
      LEFT JOIN academic_periods ap ON tfs.academic_period_id = ap.period_id
      LEFT JOIN users u ON tfs.created_by = u.user_id
      WHERE tfs.fee_setup_id = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows;
  },

  // Update tuition fee setup
  update: async (id, data) => {
    const query = `
      UPDATE tuition_fee_setup 
      SET program_id = ?, year_level = ?, academic_period_id = ?, 
          tuition_fee = ?, laboratory_fee = ?, library_fee = ?, 
          athletic_fee = ?, registration_fee = ?, id_fee = ?, 
          miscellaneous_fee = ?, other_fees = ?, is_active = ?
      WHERE fee_setup_id = ?
    `;
    const [result] = await db.query(
      query,
      [
        data.program_id,
        data.year_level,
        data.academic_period_id,
        data.tuition_fee,
        data.laboratory_fee || 0,
        data.library_fee || 0,
        data.athletic_fee || 0,
        data.registration_fee || 0,
        data.id_fee || 0,
        data.miscellaneous_fee || 0,
        data.other_fees || 0,
        data.is_active,
        id,
      ]
    );
    return result;
  },

  // Delete tuition fee setup
  delete: async (id) => {
    const query = "DELETE FROM tuition_fee_setup WHERE fee_setup_id = ?";
    const [result] = await db.query(query, [id]);
    return result;
  },

  // Get fee for specific program, year level, and period
  getFeeByDetails: async (program_id, year_level, academic_period_id) => {
    const query = `
      SELECT * FROM tuition_fee_setup 
      WHERE program_id = ? AND year_level = ? AND academic_period_id = ? AND is_active = TRUE
      LIMIT 1
    `;
    const [rows] = await db.query(query, [program_id, year_level, academic_period_id]);
    return rows;
  },

  // Get fee schedule for a specific student based on their current enrollment/details
  getStudentFeeSchedule: async (student_id) => {
    // 1. Get student's program and year level
    const [studentDetails] = await db.query(
      `SELECT sd.course, sd.year_level, p.program_id 
       FROM student_details sd
       LEFT JOIN programs p ON sd.course = p.name
       WHERE sd.user_id = ?`,
      [student_id]
    );

    if (!studentDetails || studentDetails.length === 0) {
      return null;
    }

    const { program_id, year_level } = studentDetails[0];

    // 2. Get active academic period
    const [activePeriod] = await db.query(
      `SELECT period_id, school_year, semester FROM academic_periods WHERE is_active = TRUE LIMIT 1`
    );

    if (!activePeriod || activePeriod.length === 0) {
      return null;
    }

    const { period_id, school_year, semester } = activePeriod[0];

    // 3. Get matching tuition fee setup
    const [feeSetup] = await db.query(
      `SELECT tfs.*, p.name as program_name, ap.school_year, ap.semester
       FROM tuition_fee_setup tfs
       JOIN programs p ON tfs.program_id = p.program_id
       JOIN academic_periods ap ON tfs.academic_period_id = ap.period_id
       WHERE tfs.program_id = ? AND tfs.year_level = ? AND tfs.academic_period_id = ? AND tfs.is_active = TRUE
       LIMIT 1`,
      [program_id, year_level, period_id]
    );

    if (!feeSetup || feeSetup.length === 0) {
      return {
        has_setup: false,
        student_info: studentDetails[0],
        active_period: activePeriod[0]
      };
    }

    return {
      has_setup: true,
      ...feeSetup[0]
    };
  }
};

export default TuitionFee;
