/**
 * exportRegistrationForm.js
 * Baco Community College – Official Registration Form PDF Exporter
 *
 * Page size: 8.5 x 11 inch (Letter) — unit: points (pt)
 * 1 inch = 72 pt
 */

import { jsPDF } from "jspdf";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Header image — place this file in the /public folder (served at root)
const HEADER_IMG_URL    = `${import.meta.env.BASE_URL}bccheader.jpg`;
const HEADER_IMG_FORMAT = "JPEG";

// ─── Page / Layout constants (all in pt) ─────────────────────────────────────
const PW     = 8.5 * 72;  // 612 pt
const PH     = 11  * 72;  // 792 pt
const ML     = 10;
const MR     = PW - 10;
const BODY_W = MR - ML;   // 592 pt

// ─── Build fee list from an invoice object ───────────────────────────────────
// Call this with a real invoice row to get the assessment box rows.
// NOTE: this list is fees only (things that ADD to the subtotal).
// Discounts/scholarships are handled separately as deductions — see
// discountAmount/scholarshipAmount below — so they don't get mixed into
// this list and mis-signed.
const buildFeeList = (invoice = {}) => [
  { label: "Admission Fee",            amount: invoice.admission_fee      ?? 0 },
  { label: "Entrance Fee",             amount: invoice.entrance_fee       ?? 0 },
  { label: "Guidance Fees:",           amount: invoice.guidance_fee       ?? 0 },
  { label: "Laboratory Fee",           amount: invoice.laboratory_fee     ?? 0 },
  { label: "Library Fee:",             amount: invoice.library_fee        ?? 0 },
  { label: "Handbook fee:",            amount: invoice.handbook_fee       ?? 0 },
  { label: "Medical and Dental Fees:", amount: invoice.medical_dental_fee ?? 0 },
  { label: "School ID Fee:",           amount: invoice.id_fee             ?? 0 },
  { label: "Registration Fee:",        amount: invoice.registration_fee   ?? 0 },
  { label: "Athletic Fees",            amount: invoice.athletic_fee       ?? 0 },
  { label: "Computer Fees:",           amount: invoice.computer_fee       ?? 0 },
  { label: "Cultural Fees",            amount: invoice.cultural_fee       ?? 0 },
  { label: "Development Fees",         amount: invoice.development_fee    ?? 0 },
  { label: "NSTP 82.5 per unit",       amount: invoice.nstp_fee           ?? 0 },
  { label: "Tuition Fee 165 per unit", amount: invoice.tuition_fee        ?? 0 },
];

// ─── Fallback/default fee list (all zeros) used when no invoice is passed ────
const DEFAULT_FEES = buildFeeList({});

// ─── Image loader ──────────────────────────────────────────────────────────────
// Loads an image from a URL and resolves with a ready-to-use HTMLImageElement
// (which jsPDF's addImage() accepts directly).
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

// ─── Fetch all subjects for student in a period ───────────────────────────────
async function fetchStudentSubjects(studentId, periodId) {
  try {
    const res = await axios.get(`${API_BASE}/api/enrollments`, {
      params: { student_id: studentId, period_id: periodId },
    });
    const rows = (res.data || []).filter((e) => {
      const sameStudent = String(e.student_id) === String(studentId);
      const samePeriod  = periodId ? String(e.period_id) === String(periodId) : true;
      return sameStudent && samePeriod;
    });
    return rows.map((e) => ({
      subject_code: e.course_code  || "N/A",
      subject_name: e.course_title || e.course_name || "N/A",
      units:        Number(e.units) || 3,
      section_code: e.section_name || e.section_code || "",
      room:         e.room         || "",
    }));
  } catch {
    return [];
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cell(doc, text, x, y, w, h, opts = {}) {
  const {
    align    = "left",
    bold     = false,
    fontSize = 8,
    fill     = null,
    border   = true,
    padding  = 2,
    valign   = "top",
  } = opts;

  if (fill) {
    doc.setFillColor(...fill);
    doc.rect(x, y, w, h, "F");
  }
  if (border) {
    doc.setLineWidth(0.4);
    doc.setDrawColor(0);
    doc.rect(x, y, w, h, "S");
  }

  doc.setFontSize(fontSize);
  doc.setFont("helvetica", bold ? "bold" : "normal");

  const textY =
    valign === "middle"
      ? y + h / 2 + fontSize * 0.35
      : y + padding + fontSize * 0.52;

  const maxW = w - padding * 2;
  const str  = String(text ?? "");

  if (align === "center") {
    doc.text(str, x + w / 2, textY, { align: "center", maxWidth: maxW });
  } else if (align === "right") {
    doc.text(str, x + w - padding, textY, { align: "right", maxWidth: maxW });
  } else {
    doc.text(str, x + padding, textY, { align: "left", maxWidth: maxW });
  }
}

// safe display — turns 0 / "0" / null / undefined into ""
function safe(val) {
  if (val === null || val === undefined) return "";
  const s = String(val).trim();
  return s === "0" ? "" : s;
}

// ─── Draw one copy ────────────────────────────────────────────────────────────
function drawCopy(doc, data, startY, isCopy, headerImg) {
  const {
    studentNo, studentName, address, birthday, age, gender,
    civilStatus, religion, pwd, nationality, courseYear,
    indigenousPeople, cellPhone, email,
    date, academicYear, term,
    subjects,
    fees,
    discountAmount,
    scholarshipAmount,
    registrar, registrarTitle,
  } = data;

  const feeList = Array.isArray(fees) && fees.length > 0 ? fees : DEFAULT_FEES;

  let y = startY;

  // ── HEADER (image, full content-width, fixed height) ────────────────────
  if (headerImg) {
    const HEADER_H = 50; // fixed height — image is stretched to fill full width

    // Spans exactly from ML to MR (BODY_W = 592pt), no extra side margins.
    doc.addImage(headerImg, HEADER_IMG_FORMAT, ML, y, BODY_W, HEADER_H);
    y += HEADER_H + 10; // 10pt space below header before next content
  } else {
    // Fallback if the header image fails to load
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Baco Community College", PW / 2, y, { align: "center" });
    y += 13;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Poblacion Baco, Oriental Mindoro", PW / 2, y, { align: "center" });
    y += 12;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("OFFICE OF THE REGISTRAR", PW / 2, y, { align: "center" });
  y += 10;
  doc.text("OFFICIAL REGISTRATION FORM", PW / 2, y, { align: "center" });
  y += 16;

  // ── INFO BLOCK ────────────────────────────────────────────────────────────
  const INFO_FS  = 8;
  const INFO_LH  = 11.5;
  const LBL_W    = 74;
  const infoY    = y;

  const leftLabels = ["Student No.:", "Student Name:", "Address:", "Birthday:", "Civil Status:", "Nationality:"];
  const leftValues = [safe(studentNo), safe(studentName), safe(address), safe(birthday), safe(civilStatus), safe(nationality)];

  leftLabels.forEach((lbl, i) => {
    const ry = infoY + i * INFO_LH;
    doc.setFontSize(INFO_FS);
    doc.setFont("helvetica", "bold");
    doc.text(lbl, ML, ry);
    doc.setFont("helvetica", "normal");
    doc.text(leftValues[i], ML + LBL_W, ry);
  });

  const RIGHT_X     = 410;
  const RIGHT_LBL_W = 88;
  const MID_X       = 198;
  const MID_X2      = 322;

  // Row 3: Age | Gender
  doc.setFontSize(INFO_FS);
  doc.setFont("helvetica", "bold");
  doc.text("Age:",    MID_X,      infoY + 3 * INFO_LH);
  doc.setFont("helvetica", "normal");
  doc.text(safe(age), MID_X + 22, infoY + 3 * INFO_LH);

  doc.setFont("helvetica", "bold");
  doc.text("Gender:", MID_X2,        infoY + 3 * INFO_LH);
  doc.setFont("helvetica", "normal");
  doc.text(safe(gender), MID_X2 + 32, infoY + 3 * INFO_LH);

  // Row 4: Religion | PWD
  doc.setFont("helvetica", "bold");
  doc.text("Religion:", MID_X,        infoY + 4 * INFO_LH);
  doc.setFont("helvetica", "normal");
  doc.text(safe(religion), MID_X + 34, infoY + 4 * INFO_LH);

  doc.setFont("helvetica", "bold");
  doc.text("PWD:",    MID_X2,        infoY + 4 * INFO_LH);
  doc.setFont("helvetica", "normal");
  doc.text(safe(pwd) || "-", MID_X2 + 24, infoY + 4 * INFO_LH);

  const rightLabels = ["Date:", "Academic Year:", "Term:", "Indigenous People:", "CellPhone no.:", "Email Address"];
  const rightValues = [safe(date), safe(academicYear), safe(term), safe(indigenousPeople) || "-", safe(cellPhone), safe(email)];

  rightLabels.forEach((lbl, i) => {
    const ry = infoY + i * INFO_LH;
    doc.setFontSize(INFO_FS);
    doc.setFont("helvetica", "bold");
    doc.text(lbl, RIGHT_X, ry);
    doc.setFont("helvetica", "normal");
    doc.text(rightValues[i], RIGHT_X + RIGHT_LBL_W, ry);
  });

  y = infoY + 6 * INFO_LH + 6;

  // ── COURSE / YEAR ─────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Course/Year:", ML, y);
  doc.text(safe(courseYear) || "N/A", ML + 64, y);
  y += 14;

  // ── SUBJECTS TABLE + ASSESSMENT BOX ──────────────────────────────────────
  const GAP       = 8;
  const ASS_W     = 155;
  const TBL_RIGHT = MR - GAP - ASS_W;
  const TBL_W     = TBL_RIGHT - ML;   // ~337 pt

  const CW    = [70, 110, 30, 100, 27]; // must sum to TBL_W (337)
  const HDR_H = 18;
  const ROW_H = 11;

  const hdrs = [
    "Subject Code",
    "Subject Description",
    "Units",
    isCopy ? "Prof. Signature" : "Section Code",
    "Room",
  ];

  let cx = ML;
  hdrs.forEach((h, i) => {
    cell(doc, h, cx, y, CW[i], HDR_H, {
      align: "center", bold: true, fontSize: 7.5, fill: [210, 210, 210], valign: "middle",
    });
    cx += CW[i];
  });
  const tableTopY = y;
  y += HDR_H;

  const MIN_ROWS  = 7;
  const totalRows = Math.max((subjects || []).length, MIN_ROWS);

  for (let i = 0; i < totalRows; i++) {
    const s  = (subjects || [])[i] || {};
    cx = ML;
    const rowCells = [
      { text: safe(s.subject_code), align: "center" },
      { text: safe(s.subject_name), align: "center" },
      { text: s.units > 0 ? String(s.units) : "", align: "center" },
      { text: (!isCopy && safe(s.section_code)) || "", align: "center" },
      { text: safe(s.room), align: "center" },
    ];
    rowCells.forEach((rc, ci) => {
      cell(doc, rc.text, cx, y, CW[ci], ROW_H, { align: "center", fontSize: 7.5, valign: "middle" });
      cx += CW[ci];
    });
    y += ROW_H;
  }

  // Total units row
  const totalUnits = (subjects || []).reduce((s, r) => s + (Number(r.units) || 0), 0);
  cx = ML;
  CW.forEach((w, i) => {
    cell(doc, i === 2 && totalUnits > 0 ? String(totalUnits) : "", cx, y, w, ROW_H, {
      align: "center", bold: i === 2, fontSize: 8, valign: "top",
    });
    cx += w;
  });
  const tableBottomY = y + ROW_H;

  // ── ASSESSMENT BOX ────────────────────────────────────────────────────────
  const ASS_X    = TBL_RIGHT + GAP;
  const FEE_H    = 8;
  const ASS_HDR  = 14;
  const LBL_FRAC = 0.62;

  let ay = tableTopY;

  cell(doc, "A S S E S S M E N T", ASS_X, ay, ASS_W, ASS_HDR, {
    align: "center", bold: true, fontSize: 7.5, fill: [210, 210, 210], valign: "middle",
  });
  ay += ASS_HDR;

  feeList.forEach((fee) => {
    const amtTxt = fee.amount != null && fee.amount !== 0
      ? Number(fee.amount).toFixed(2)
      : "-";

    cell(doc, fee.label, ASS_X, ay, ASS_W * LBL_FRAC, FEE_H, {
      align: "left", fontSize: 7, padding: 2, valign: "top",
    });
    cell(doc, amtTxt, ASS_X + ASS_W * LBL_FRAC, ay, ASS_W * (1 - LBL_FRAC), FEE_H, {
      align: "right", fontSize: 7, padding: 2, valign: "top",
    });
    ay += FEE_H;
  });

  // Subtotal (sum of fees only, before deductions)
  const subtotal = feeList.reduce((s, f) => s + (Number(f.amount) || 0), 0);

  // ── DISCOUNTS / SCHOLARSHIP (deductions) ──────────────────────────────────
  // These come from the invoice's discount_amount / scholarship_amount
  // columns (same values shown in the Accounting "Edit Invoice" screen)
  // and were previously NOT reflected anywhere in this PDF — the TOTAL was
  // just the raw fee sum. Now we list each deduction (if > 0) and subtract
  // it from the subtotal, mirroring the Accounting UI's
  // Subtotal / Total Discounts / Total breakdown.
  const discAmt  = Number(discountAmount)    || 0;
  const scholAmt = Number(scholarshipAmount) || 0;
  const totalDeductions = discAmt + scholAmt;

  if (discAmt > 0) {
    cell(doc, "Less: Discount", ASS_X, ay, ASS_W * LBL_FRAC, FEE_H, {
      align: "left", fontSize: 7, padding: 2, valign: "top",
    });
    cell(doc, `-${discAmt.toFixed(2)}`, ASS_X + ASS_W * LBL_FRAC, ay, ASS_W * (1 - LBL_FRAC), FEE_H, {
      align: "right", fontSize: 7, padding: 2, valign: "top",
    });
    ay += FEE_H;
  }

  if (scholAmt > 0) {
    cell(doc, "Less: Scholarship", ASS_X, ay, ASS_W * LBL_FRAC, FEE_H, {
      align: "left", fontSize: 7, padding: 2, valign: "top",
    });
    cell(doc, `-${scholAmt.toFixed(2)}`, ASS_X + ASS_W * LBL_FRAC, ay, ASS_W * (1 - LBL_FRAC), FEE_H, {
      align: "right", fontSize: 7, padding: 2, valign: "top",
    });
    ay += FEE_H;
  }

  // TOTAL row — now subtotal minus discounts/scholarship
  const total = subtotal - totalDeductions;
  cell(doc, "TOTAL", ASS_X, ay, ASS_W * LBL_FRAC, FEE_H + 2, {
    align: "right", bold: true, fontSize: 7.5, fill: [210, 210, 210], padding: 2, valign: "middle",
  });
  cell(doc, total.toFixed(2), ASS_X + ASS_W * LBL_FRAC, ay, ASS_W * (1 - LBL_FRAC), FEE_H + 2, {
    align: "right", bold: true, fontSize: 7.5, fill: [210, 210, 210], padding: 2, valign: "middle",
  });
  ay += FEE_H + 2;

  if (isCopy) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6);
    doc.setTextColor(0, 120, 0);
    doc.text("Free TUITION FEE Under R.A.10931", ASS_X + 2, ay + 7);
    doc.setTextColor(0, 0, 0);
    ay += 13;
  }

  // ── SIGNATURES ────────────────────────────────────────────────────────────
  const contentBottom = Math.max(tableBottomY, ay);
  const sigY = contentBottom + 20;

  doc.setLineWidth(0.75);
  doc.line(ML, sigY, ML + 120, sigY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Student Name", ML + 22, sigY + 9);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(registrar, PW / 2, sigY - 4, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(registrarTitle, PW / 2, sigY + 9, { align: "center" });

  if (isCopy) {
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.75);
    doc.rect(MR - 72, sigY - 10, 70, 18, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Student Copy", MR - 37, sigY + 2, { align: "center" });
    doc.setDrawColor(0);
  }

  return sigY + 18;
}

// ─── Main export function ─────────────────────────────────────────────────────
/**
 * @param {Object} enrollment   - one enrollment row
 * @param {Object} studentInfo  - optional richer student profile
 * @param {Object} currentUser  - { full_name, position }
 * @param {Object} invoice      - invoice row from student_invoices (contains all fee columns
 *                                 plus discount_amount / scholarship_amount)
 */
export async function exportRegistrationFormPDF(
  enrollment  = {},
  studentInfo = {},
  currentUser = {},
  invoice     = {},
) {
  // Build fee list from the actual invoice data; fall back to all-zero defaults
  const fees = Object.keys(invoice).length > 0
    ? buildFeeList(invoice)
    : DEFAULT_FEES;

  // Deductions from the invoice — same fields as the Accounting "Edit
  // Invoice" screen's Discount Amount / Scholarship Amount inputs.
  const discountAmount    = Number(invoice.discount_amount)    || 0;
  const scholarshipAmount = Number(invoice.scholarship_amount) || 0;

  const subjects = await fetchStudentSubjects(
    enrollment.student_id,
    enrollment.period_id,
  );

  const registrar      = currentUser.full_name || currentUser.name || "MARICRIS R. AMORADO, LPT";
  const registrarTitle = currentUser.position  || currentUser.role || "Registrar I";

  const formData = {
    studentNo:        studentInfo.student_number || String(enrollment.student_id || ""),
    studentName:      studentInfo.full_name      || enrollment.student_name || "",
    address:          studentInfo.address        || "",
    birthday:         studentInfo.birthday       || "",
    age:              studentInfo.age            || "",
    gender:           studentInfo.gender         || "",
    civilStatus:      studentInfo.civil_status   || "",
    religion:         studentInfo.religion       || "",
    pwd:              studentInfo.pwd            || "-",
    nationality:      studentInfo.nationality    || "",
    courseYear:
      studentInfo.program_year ||
      `${studentInfo.program || "N/A"} / ${enrollment.year_level || ""}`,
    indigenousPeople: studentInfo.indigenous_people || "-",
    cellPhone:        studentInfo.cell_phone     || "",
    email:            studentInfo.email          || "",
    date:
      enrollment.enrollment_date
        ? new Date(enrollment.enrollment_date).toLocaleDateString("en-US")
        : new Date().toLocaleDateString("en-US"),
    academicYear: enrollment.school_year || "",
    term:         enrollment.semester    || "",
    subjects,
    fees,
    discountAmount,
    scholarshipAmount,
    registrar,
    registrarTitle,
  };

  // Load the header image once — reused for both copies.
  // If it fails to load (e.g. file missing from /public), fall back to text header.
  let headerImg = null;
  try {
    headerImg = await loadImage(HEADER_IMG_URL);
  } catch (err) {
    console.warn("Registration form header image not loaded:", err.message);
  }

  const doc = new jsPDF({
    unit:        "pt",
    format:      [PW, PH],
    orientation: "portrait",
  });

  // Copy 1: Office copy
  const divY = drawCopy(doc, formData, 10, false, headerImg);

  // Dashed cut line
  doc.setLineWidth(0.6);
  doc.setLineDash([4, 3]);
  doc.line(ML - 8, divY + 6, MR + 8, divY + 6);
  doc.setLineDash([]);

  // Copy 2: Student copy
  drawCopy(doc, formData, divY + 16, true, headerImg);

  const safeName =
    formData.studentName
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "") || "student";
  doc.save(`BCC_RegistrationForm_${safeName}.pdf`);
}