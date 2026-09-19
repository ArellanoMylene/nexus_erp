import db from "../config/db.js";

const Scholarship = {
  // Create new scholarship program
  createProgram: async (data) => {
    const query = `
      INSERT INTO scholarship_programs 
      (scholarship_name, scholarship_code, scholarship_type, discount_type,
       discount_value, description, eligibility_criteria, required_gpa,
       required_income_level, total_budget, max_beneficiaries, is_active,
       academic_period_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(
      query,
      [
        data.scholarship_name,
        data.scholarship_code,
        data.scholarship_type,
        data.discount_type,
        data.discount_value,
        data.description,
        data.eligibility_criteria,
        data.required_gpa,
        data.required_income_level,
        data.total_budget,
        data.max_beneficiaries,
        data.is_active !== undefined ? data.is_active : true,
        data.academic_period_id,
        data.created_by,
      ]
    );
    return result;
  },

  // Get all scholarship programs
  getAllPrograms: async (filters) => {
    let query = `
      SELECT 
        sp.*,
        ap.school_year,
        ap.semester,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM scholarship_programs sp
      LEFT JOIN academic_periods ap ON sp.academic_period_id = ap.period_id
      LEFT JOIN users u ON sp.created_by = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.scholarship_type) {
      query += " AND sp.scholarship_type = ?";
      params.push(filters.scholarship_type);
    }
    if (filters.academic_period_id) {
      query += " AND sp.academic_period_id = ?";
      params.push(filters.academic_period_id);
    }
    if (filters.is_active !== undefined) {
      query += " AND sp.is_active = ?";
      params.push(filters.is_active);
    }
    if (filters.search) {
      query += ` AND (sp.scholarship_name LIKE ? OR sp.scholarship_code LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += " ORDER BY sp.created_at DESC";
    const [rows] = await db.query(query, params);
    return rows;
  },

  // Get scholarship program by ID
  getProgramById: async (id) => {
    const query = `
      SELECT 
        sp.*,
        ap.school_year,
        ap.semester,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM scholarship_programs sp
      LEFT JOIN academic_periods ap ON sp.academic_period_id = ap.period_id
      LEFT JOIN users u ON sp.created_by = u.user_id
      WHERE sp.scholarship_id = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows;
  },

  // Update scholarship program
  updateProgram: async (id, data) => {
    const query = `
      UPDATE scholarship_programs 
      SET scholarship_name = ?, scholarship_code = ?, scholarship_type = ?, discount_type = ?,
          discount_value = ?, description = ?, eligibility_criteria = ?,
          required_gpa = ?, required_income_level = ?, total_budget = ?,
          max_beneficiaries = ?, is_active = ?, academic_period_id = ?
      WHERE scholarship_id = ?
    `;
    const [result] = await db.query(
      query,
      [
        data.scholarship_name,
        data.scholarship_code,
        data.scholarship_type,
        data.discount_type,
        data.discount_value,
        data.description,
        data.eligibility_criteria,
        data.required_gpa,
        data.required_income_level,
        data.total_budget,
        data.max_beneficiaries,
        data.is_active,
        data.academic_period_id,
        id,
      ]
    );
    return result;
  },

  // Delete scholarship program
  deleteProgram: async (id) => {
    const query = "DELETE FROM scholarship_programs WHERE scholarship_id = ?";
    const [result] = await db.query(query, [id]);
    return result;
  },

  // Create scholarship allocation
  createAllocation: async (data) => {
    const query = `
      INSERT INTO scholarship_allocations 
      (scholarship_id, student_id, academic_period_id, allocated_amount,
       allocation_date, start_date, end_date, status, application_notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(
      query,
      [
        data.scholarship_id,
        data.student_id,
        data.academic_period_id,
        data.allocated_amount,
        data.allocation_date,
        data.start_date,
        data.end_date,
        data.status || "Pending",
        data.application_notes,
        data.created_by,
      ]
    );
    return result;
  },

  // Get all allocations
  getAllAllocations: async (filters) => {
    let query = `
      SELECT 
        sa.*,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        sd.student_number,
        sp.scholarship_name,
        sp.scholarship_code,
        ap.school_year,
        ap.semester,
        CONCAT(approver.first_name, ' ', approver.last_name) as approved_by_name
      FROM scholarship_allocations sa
      INNER JOIN users s ON sa.student_id = s.user_id
      LEFT JOIN student_details sd ON s.user_id = sd.user_id
      INNER JOIN scholarship_programs sp ON sa.scholarship_id = sp.scholarship_id
      LEFT JOIN academic_periods ap ON sa.academic_period_id = ap.period_id
      LEFT JOIN users approver ON sa.approved_by = approver.user_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.scholarship_id) {
      query += " AND sa.scholarship_id = ?";
      params.push(filters.scholarship_id);
    }
    if (filters.student_id) {
      query += " AND sa.student_id = ?";
      params.push(filters.student_id);
    }
    if (filters.academic_period_id) {
      query += " AND sa.academic_period_id = ?";
      params.push(filters.academic_period_id);
    }
    if (filters.status) {
      query += " AND sa.status = ?";
      params.push(filters.status);
    }
    if (filters.search) {
      query += ` AND (CONCAT(s.first_name, ' ', s.last_name) LIKE ? OR 
                      sd.student_number LIKE ? OR 
                      sp.scholarship_name LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += " ORDER BY sa.created_at DESC";

    if (filters.limit) {
      query += " LIMIT ? OFFSET ?";
      params.push(parseInt(filters.limit), parseInt(filters.offset || 0));
    }

    const [rows] = await db.query(query, params);
    return rows;
  },

  // Get allocation by ID
  getAllocationById: async (id) => {
    const query = `
      SELECT 
        sa.*,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        s.email as student_email,
        sd.student_number,
        sd.year_level,
        sp.scholarship_name,
        sp.scholarship_code,
        sp.scholarship_type,
        sp.discount_type,
        sp.discount_value,
        ap.school_year,
        ap.semester,
        CONCAT(approver.first_name, ' ', approver.last_name) as approved_by_name,
        CONCAT(creator.first_name, ' ', creator.last_name) as created_by_name
      FROM scholarship_allocations sa
      INNER JOIN users s ON sa.student_id = s.user_id
      LEFT JOIN student_details sd ON s.user_id = sd.user_id
      INNER JOIN scholarship_programs sp ON sa.scholarship_id = sp.scholarship_id
      LEFT JOIN academic_periods ap ON sa.academic_period_id = ap.period_id
      LEFT JOIN users approver ON sa.approved_by = approver.user_id
      LEFT JOIN users creator ON sa.created_by = creator.user_id
      WHERE sa.allocation_id = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows;
  },

  // Update allocation
  updateAllocation: async (id, data) => {
    const query = `
      UPDATE scholarship_allocations 
      SET scholarship_id = ?, student_id = ?, academic_period_id = ?,
          allocated_amount = ?, start_date = ?, end_date = ?,
          status = ?, application_notes = ?
      WHERE allocation_id = ?
    `;
    const [result] = await db.query(
      query,
      [
        data.scholarship_id,
        data.student_id,
        data.academic_period_id,
        data.allocated_amount,
        data.start_date,
        data.end_date,
        data.status,
        data.application_notes,
        id,
      ]
    );
    return result;
  },

  // Approve allocation
  approveAllocation: async (id, approved_by, approval_notes) => {
    const query = `
      UPDATE scholarship_allocations 
      SET status = 'Approved', approved_by = ?, approval_date = CURDATE(),
          approval_notes = ?
      WHERE allocation_id = ?
    `;
    const [result] = await db.query(query, [approved_by, approval_notes, id]);
    return result;
  },

  // Update allocation status
  updateAllocationStatus: async (id, status) => {
    const query =
      "UPDATE scholarship_allocations SET status = ? WHERE allocation_id = ?";
    const [result] = await db.query(query, [status, id]);
    return result;
  },

  // Update disbursed amount
  updateDisbursement: async (id, amount) => {
    const query = `
      UPDATE scholarship_allocations 
      SET disbursed_amount = disbursed_amount + ?
      WHERE allocation_id = ?
    `;
    const [result] = await db.query(query, [amount, id]);
    return result;
  },

  // Delete allocation
  deleteAllocation: async (id) => {
    const query = "DELETE FROM scholarship_allocations WHERE allocation_id = ?";
    const [result] = await db.query(query, [id]);
    return result;
  },

  // Get scholarship summary
  getScholarshipSummary: async (filters) => {
    let query = `
      SELECT 
        COUNT(DISTINCT sp.scholarship_id) as total_programs,
        COUNT(DISTINCT sa.allocation_id) as total_allocations,
        SUM(sp.total_budget) as total_budget,
        SUM(sp.allocated_amount) as total_allocated,
        SUM(sa.disbursed_amount) as total_disbursed,
        COUNT(DISTINCT CASE WHEN sa.status = 'Active' THEN sa.student_id END) as active_beneficiaries
      FROM scholarship_programs sp
      LEFT JOIN scholarship_allocations sa ON sp.scholarship_id = sa.scholarship_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.academic_period_id) {
      query += " AND sp.academic_period_id = ?";
      params.push(filters.academic_period_id);
    }

    const [rows] = await db.query(query, params);
    return rows;
  },

  // Get student scholarships
  getStudentScholarships: async (student_id) => {
    const query = `
      (
        SELECT 
          sa.application_id as id,
          sa.scholarship_id,
          'Application' as source,
          sp.scholarship_name as program_name,
          sp.scholarship_code,
          sp.discount_type,
          sp.discount_value,
          COALESCE(sb.tuition_discount, st.tuition_coverage_percentage, 0) as tuition_discount,
          COALESCE(sb.allowance_amount, st.monthly_allowance, 0) as allowance_amount,
          sp.required_gpa,
          COALESCE(st.monthly_allowance, 0) as program_allowance_amount,
          st.tuition_coverage_percentage as program_tuition_discount,
          ap.school_year,
          ap.semester,
          sa.status,
          sa.created_at as record_date
        FROM scholarship_applications sa
        INNER JOIN scholarship_programs sp ON sa.scholarship_id = sp.scholarship_id
        LEFT JOIN scholarship_types st ON sa.scholarship_type_id = st.scholarship_type_id
        LEFT JOIN academic_periods ap ON sa.academic_period_id = ap.period_id
        LEFT JOIN scholarship_beneficiaries sb ON sa.application_id = sb.application_id
        WHERE sa.student_id = ?
      )
      UNION ALL
      (
        SELECT 
          sb.beneficiary_id as id,
          sb.scholarship_id,
          'Grant' as source,
          sp.scholarship_name as program_name,
          sp.scholarship_code,
          sp.discount_type,
          sp.discount_value,
          sb.tuition_discount,
          sb.allowance_amount,
          sp.required_gpa,
          COALESCE(st.monthly_allowance, 0) as program_allowance_amount,
          st.tuition_coverage_percentage as program_tuition_discount,
          ap.school_year,
          ap.semester,
          sb.status,
          sb.created_at as record_date
        FROM scholarship_beneficiaries sb
        INNER JOIN scholarship_programs sp ON sb.scholarship_id = sp.scholarship_id
        LEFT JOIN scholarship_types st ON sb.scholarship_type_id = st.scholarship_type_id
        LEFT JOIN academic_periods ap ON sb.academic_period_id = ap.period_id
        WHERE sb.student_id = ? AND sb.application_id IS NULL
      )
      ORDER BY record_date DESC
    `;
    const [rows] = await db.query(query, [student_id, student_id]);
    return rows;
  },
};

export default Scholarship;
