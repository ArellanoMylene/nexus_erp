import db from "../config/db.js";

const normalizeAcademicPeriodId = async (academicPeriodId) => {
  try {
    console.log("normalizeAcademicPeriodId input:", academicPeriodId, "(type:", typeof academicPeriodId, ")");
    if (academicPeriodId === null || academicPeriodId === undefined || academicPeriodId === "") {
      return null;
    }

    const numericId = Number(academicPeriodId);
    if (Number.isInteger(numericId) && String(numericId) === String(academicPeriodId).trim()) {
      console.log("normalizeAcademicPeriodId resolved numeric:", numericId);
      return numericId;
    }

    if (typeof academicPeriodId === "string") {
      const label = academicPeriodId.trim();

      const match = label.match(/^(.*?)\s*-\s*(.*?)$/);
      if (match) {
        const [, schoolYear, semester] = match;
        const [rows] = await db.query(
          `SELECT period_id
           FROM academic_periods
           WHERE TRIM(school_year) = ?
             AND TRIM(semester) = ?
           LIMIT 1`,
          [schoolYear.trim(), semester.trim()],
        );
        if (rows.length > 0) {
          console.log("normalizeAcademicPeriodId matched by school_year+semester ->", rows[0].period_id);
          return rows[0].period_id;
        }
      }

      const [rows2] = await db.query(
        `SELECT period_id FROM academic_periods WHERE TRIM(CONCAT(school_year, ' - ', semester)) = ? LIMIT 1`,
        [label],
      );
      if (rows2.length > 0) {
        console.log("normalizeAcademicPeriodId matched by concat label ->", rows2[0].period_id);
        return rows2[0].period_id;
      }

      const [rows3] = await db.query(
        `SELECT period_id FROM academic_periods WHERE CONCAT(school_year, ' - ', semester) LIKE ? LIMIT 1`,
        [`%${label}%`],
      );
      if (rows3.length > 0) {
        console.log("normalizeAcademicPeriodId fuzzy matched ->", rows3[0].period_id);
        return rows3[0].period_id;
      }

      const digits = academicPeriodId.match(/(\d{1,10})/);
      if (digits) {
        const possibleId = Number(digits[0]);
        if (Number.isInteger(possibleId)) {
          const [rows4] = await db.query(`SELECT period_id FROM academic_periods WHERE period_id = ? LIMIT 1`, [possibleId]);
          if (rows4.length > 0) {
            console.log("normalizeAcademicPeriodId extracted numeric id ->", possibleId);
            return possibleId;
          }
        }
      }
    }

    console.warn("normalizeAcademicPeriodId: no match for", academicPeriodId, "— returning null to avoid SQL truncation");
    return null;
  } catch (e) {
    console.error("normalizeAcademicPeriodId error:", e);
    return null;
  }
};

const Invoice = {
  // Create new invoice
  create: async (data) => {
    const academicPeriodId = await normalizeAcademicPeriodId(data.academic_period_id);
    const query = `
      INSERT INTO student_invoices 
      (invoice_number, student_id, enrollment_id, academic_period_id, 
       tuition_fee, laboratory_fee, library_fee, athletic_fee, 
       registration_fee, id_fee, miscellaneous_fee, other_fees,
       admission_fee, entrance_fee, guidance_fee, handbook_fee,
       medical_dental_fee, computer_fee, cultural_fee, development_fee, nstp_fee,
       subtotal, discount_amount, scholarship_amount, total_amount, 
       invoice_date, due_date, status, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [
      data.invoice_number,
      data.student_id,
      data.enrollment_id,
      academicPeriodId,
      data.tuition_fee        || 0,
      data.laboratory_fee     || 0,
      data.library_fee        || 0,
      data.athletic_fee       || 0,
      data.registration_fee   || 0,
      data.id_fee             || 0,
      data.miscellaneous_fee  || 0,
      data.other_fees         || 0,
      data.admission_fee      || 0,
      data.entrance_fee       || 0,
      data.guidance_fee       || 0,
      data.handbook_fee       || 0,
      data.medical_dental_fee || 0,
      data.computer_fee       || 0,
      data.cultural_fee       || 0,
      data.development_fee    || 0,
      data.nstp_fee           || 0,
      data.subtotal,
      data.discount_amount    || 0,
      data.scholarship_amount || 0,
      data.total_amount,
      data.invoice_date,
      data.due_date,
      data.status || "Pending",
      data.notes,
      data.created_by,
    ]);
    return result;
  },

  // Get all invoices with filters
  getAll: async (filters) => {
    let query = `
      SELECT 
        si.*,
        (si.total_amount - COALESCE(si.amount_paid, 0)) AS balance,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        sd.student_number,
        p.name as program_name,
        ap.school_year,
        ap.semester,
        CONCAT(c.first_name, ' ', c.last_name) as created_by_name
      FROM student_invoices si
      INNER JOIN users s ON si.student_id = s.user_id
      LEFT JOIN student_details sd ON s.user_id = sd.user_id
      LEFT JOIN enrollments e ON si.enrollment_id = e.enrollment_id
      LEFT JOIN programs p ON sd.course = p.name
      LEFT JOIN academic_periods ap ON si.academic_period_id = ap.period_id
      LEFT JOIN users c ON si.created_by = c.user_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.student_id) {
      query += " AND si.student_id = ?";
      params.push(filters.student_id);
    }
    if (filters.academic_period_id) {
      query += " AND si.academic_period_id = ?";
      params.push(filters.academic_period_id);
    }
    if (filters.status) {
      if (filters.status.includes(",")) {
        const statuses = filters.status.split(",");
        query += " AND si.status IN (?)";
        params.push(statuses);
      } else {
        query += " AND si.status = ?";
        params.push(filters.status);
      }
    }
    if (filters.search) {
      query += ` AND (si.invoice_number LIKE ? OR 
                      CONCAT(s.first_name, ' ', s.last_name) LIKE ? OR 
                      sd.student_number LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += " ORDER BY si.created_at DESC";

    if (filters.limit) {
      query += " LIMIT ? OFFSET ?";
      params.push(parseInt(filters.limit), parseInt(filters.offset || 0));
    }

    const [rows] = await db.query(query, params);
    return rows;
  },

  // Get invoice by ID
  getById: async (id) => {
    const query = `
      SELECT 
        si.*,
        (si.total_amount - si.amount_paid) AS balance,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        s.email as student_email,
        sd.student_number,
        sd.year_level,
        p.name as program_name,
        p.code as program_code,
        ap.school_year,
        ap.semester,
        CONCAT(c.first_name, ' ', c.last_name) as created_by_name
      FROM student_invoices si
      INNER JOIN users s ON si.student_id = s.user_id
      LEFT JOIN student_details sd ON s.user_id = sd.user_id
      LEFT JOIN enrollments e ON si.enrollment_id = e.enrollment_id
      LEFT JOIN programs p ON sd.course = p.name
      LEFT JOIN academic_periods ap ON si.academic_period_id = ap.period_id
      LEFT JOIN users c ON si.created_by = c.user_id
      WHERE si.invoice_id = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows;
  },

  // Get invoices by student
  getByStudent: async (student_id) => {
    const query = `
      SELECT 
        si.*,
        (si.total_amount - COALESCE(si.amount_paid, 0)) AS balance,
        ap.school_year,
        ap.semester
      FROM student_invoices si
      LEFT JOIN academic_periods ap ON si.academic_period_id = ap.period_id
      WHERE si.student_id = ?
      ORDER BY si.invoice_date DESC
    `;
    const [rows] = await db.query(query, [student_id]);
    return rows;
  },

  // Update invoice
  update: async (id, data) => {
    const academicPeriodId = await normalizeAcademicPeriodId(data.academic_period_id);
    const query = `
      UPDATE student_invoices 
      SET student_id = ?, enrollment_id = ?, academic_period_id = ?,
          tuition_fee = ?, laboratory_fee = ?, library_fee = ?, athletic_fee = ?,
          registration_fee = ?, id_fee = ?, miscellaneous_fee = ?, other_fees = ?,
          admission_fee = ?, entrance_fee = ?, guidance_fee = ?, handbook_fee = ?,
          medical_dental_fee = ?, computer_fee = ?, cultural_fee = ?, development_fee = ?, nstp_fee = ?,
          subtotal = ?, discount_amount = ?, scholarship_amount = ?, 
          total_amount = ?, due_date = ?, status = ?, notes = ?
      WHERE invoice_id = ?
    `;
    const [result] = await db.query(query, [
      data.student_id,
      data.enrollment_id,
      academicPeriodId,
      data.tuition_fee        || 0,
      data.laboratory_fee     || 0,
      data.library_fee        || 0,
      data.athletic_fee       || 0,
      data.registration_fee   || 0,
      data.id_fee             || 0,
      data.miscellaneous_fee  || 0,
      data.other_fees         || 0,
      data.admission_fee      || 0,
      data.entrance_fee       || 0,
      data.guidance_fee       || 0,
      data.handbook_fee       || 0,
      data.medical_dental_fee || 0,
      data.computer_fee       || 0,
      data.cultural_fee       || 0,
      data.development_fee    || 0,
      data.nstp_fee           || 0,
      data.subtotal,
      data.discount_amount    || 0,
      data.scholarship_amount || 0,
      data.total_amount,
      data.due_date,
      data.status,
      data.notes,
      id,
    ]);
    return result;
  },

  // Update payment amount
  updatePayment: async (id, amount) => {
    const query = `
      UPDATE student_invoices 
      SET amount_paid = amount_paid + ?
      WHERE invoice_id = ?
    `;
    const [result] = await db.query(query, [amount, id]);
    return result;
  },

  // Update invoice status
  updateStatus: async (id, status) => {
    const query = "UPDATE student_invoices SET status = ? WHERE invoice_id = ?";
    const [result] = await db.query(query, [status, id]);
    return result;
  },

  // Delete invoice
  delete: async (id) => {
    const query = "DELETE FROM student_invoices WHERE invoice_id = ?";
    const [result] = await db.query(query, [id]);
    return result;
  },

  // Generate invoice number
  generateInvoiceNumber: async () => {
    const query = `
      SELECT invoice_number FROM student_invoices 
      ORDER BY invoice_id DESC LIMIT 1
    `;
    const [rows] = await db.query(query);
    return rows;
  },

  // Bulk-create invoices for all enrolled students matching a fee setup
  bulkCreateFromFeeSetup: async (fee_setup_id, created_by) => {
    const [feeRows] = await db.query(
      `SELECT tfs.*, p.name as program_name
       FROM tuition_fee_setup tfs
       JOIN programs p ON tfs.program_id = p.program_id
       WHERE tfs.fee_setup_id = ?`,
      [fee_setup_id],
    );

    if (!feeRows || feeRows.length === 0) {
      throw new Error("Fee setup not found");
    }

    const fee = feeRows[0];
    const subtotal =
      parseFloat(fee.tuition_fee        || 0) +
      parseFloat(fee.laboratory_fee     || 0) +
      parseFloat(fee.library_fee        || 0) +
      parseFloat(fee.athletic_fee       || 0) +
      parseFloat(fee.registration_fee   || 0) +
      parseFloat(fee.id_fee             || 0) +
      parseFloat(fee.miscellaneous_fee  || 0) +
      parseFloat(fee.other_fees         || 0) +
      parseFloat(fee.admission_fee      || 0) +
      parseFloat(fee.entrance_fee       || 0) +
      parseFloat(fee.guidance_fee       || 0) +
      parseFloat(fee.handbook_fee       || 0) +
      parseFloat(fee.medical_dental_fee || 0) +
      parseFloat(fee.computer_fee       || 0) +
      parseFloat(fee.cultural_fee       || 0) +
      parseFloat(fee.development_fee    || 0) +
      parseFloat(fee.nstp_fee           || 0);

    const [students] = await db.query(
      `SELECT DISTINCT sd.user_id, e.enrollment_id
       FROM student_details sd
       JOIN programs p ON sd.course = p.name
       LEFT JOIN enrollments e 
         ON e.student_id = sd.user_id 
         AND e.academic_period_id = ?
         AND e.status IN ('Enrolled','Active')
       WHERE p.program_id = ? AND sd.year_level = ?`,
      [fee.academic_period_id, fee.program_id, fee.year_level],
    );

    if (!students || students.length === 0) {
      return { created: 0, skipped: 0, message: "No matching students found" };
    }

    const [lastInv] = await db.query(
      `SELECT invoice_number FROM student_invoices ORDER BY invoice_id DESC LIMIT 1`,
    );
    let lastNum = 0;
    if (lastInv.length > 0 && lastInv[0].invoice_number) {
      lastNum = parseInt(lastInv[0].invoice_number.split("-")[1]) || 0;
    }

    let created = 0;
    let skipped = 0;
    const today = new Date().toISOString().split("T")[0];

    for (const student of students) {
      const [existing] = await db.query(
        `SELECT invoice_id FROM student_invoices 
         WHERE student_id = ? AND academic_period_id = ?`,
        [student.user_id, fee.academic_period_id],
      );

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      lastNum++;
      const invoiceNumber = `INV-${String(lastNum).padStart(6, "0")}`;

      await db.query(
        `INSERT INTO student_invoices 
         (invoice_number, student_id, enrollment_id, academic_period_id,
          tuition_fee, laboratory_fee, library_fee, athletic_fee,
          registration_fee, id_fee, miscellaneous_fee, other_fees,
          admission_fee, entrance_fee, guidance_fee, handbook_fee,
          medical_dental_fee, computer_fee, cultural_fee, development_fee, nstp_fee,
          subtotal, discount_amount, scholarship_amount, total_amount,
          invoice_date, due_date, status, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, 'Pending', ?, ?)`,
        [
          invoiceNumber,
          student.user_id,
          student.enrollment_id || null,
          fee.academic_period_id,
          fee.tuition_fee        || 0,
          fee.laboratory_fee     || 0,
          fee.library_fee        || 0,
          fee.athletic_fee       || 0,
          fee.registration_fee   || 0,
          fee.id_fee             || 0,
          fee.miscellaneous_fee  || 0,
          fee.other_fees         || 0,
          fee.admission_fee      || 0,
          fee.entrance_fee       || 0,
          fee.guidance_fee       || 0,
          fee.handbook_fee       || 0,
          fee.medical_dental_fee || 0,
          fee.computer_fee       || 0,
          fee.cultural_fee       || 0,
          fee.development_fee    || 0,
          fee.nstp_fee           || 0,
          subtotal,
          subtotal,
          today,
          today,
          `Auto-generated from fee setup: ${fee.program_name} ${fee.year_level}`,
          created_by,
        ],
      );
      created++;
    }

    return { created, skipped, total: students.length };
  },

  // Get financial summary
  getFinancialSummary: async (filters) => {
    let query = `
      SELECT 
        COUNT(*) as total_invoices,
        SUM(total_amount) as total_billed,
        SUM(amount_paid) as total_paid,
        SUM(total_amount - amount_paid) as total_balance,
        SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END) as overdue_count
      FROM student_invoices
      WHERE 1=1
    `;
    const params = [];

    if (filters.academic_period_id) {
      query += " AND academic_period_id = ?";
      params.push(filters.academic_period_id);
    }
    if (filters.start_date && filters.end_date) {
      query += " AND invoice_date BETWEEN ? AND ?";
      params.push(filters.start_date, filters.end_date);
    }

    const [rows] = await db.query(query, params);
    return rows;
  },
};

export default Invoice;