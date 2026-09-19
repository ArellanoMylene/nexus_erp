/**
 * Export helper functions (CSV + PDF)
 */

// Field label mappings for readable headers
const FIELD_LABELS = {
  student_id: "Student ID",
  student_number: "Student Number",
  full_name: "Full Name",
  program_applied: "Program Applied",
  student_name: "Student Name",
  student_nu: "Student Number",
  student_na: "Student Name",
  email: "Email",
  phone_number: "Phone Number",
  phone_num: "Phone Number",
  gender: "Gender",
  birth_date: "Birth Date",
  year_level: "Year Level",
  status: "Status",
  program_name: "Program",
  program_n: "Program",
  program_code: "Program Code",
  program_c: "Program Code",
  enrollment_id: "Enrollment ID",
  enrollment: "Enrollment Status",
  total_units: "Units",
  academic_year: "Academic Year",
  academic_y: "Academic Year",
  semester: "Semester",
  total_grade: "Total Grade",
  total_gpa: "GPA",
  gpa: "GPA",
  department: "Department",
  employee_id: "Employee ID",
  employee_name: "Employee Name",
  position: "Position",
  salary: "Salary",
  date_hired: "Date Hired",
  course_code: "Course Code",
  course_name: "Course Name",
  instructor: "Instructor",
  section: "Section",
  attendance_rate: "Attendance Rate",
  prelim_grade: "Prelim Grade",
  midterm_grade: "Midterm Grade",
  finals_grade: "Finals Grade",
  final_grade: "Final Grade",
  remarks: "Remarks",
  created_at: "Created Date",
  updated_at: "Updated Date",

  // Payroll-specific short labels — avoids mid-word wrapping in narrow PDF columns
  employee_number: "Emp. No.",
  basic_pay: "Basic Pay",
  gross_pay: "Gross Pay",
  overtime_pay: "OT Pay",
  holiday_pay: "Holiday Pay",
  night_differential: "Night Diff.",
  allowances: "Allowances",
  bonus: "Bonus",
  sss_deduction: "SSS",
  philhealth_deduction: "PhilHealth",
  pagibig_deduction: "Pag-IBIG",
  tax_deduction: "W/Tax",
  loan_deduction: "Loan",
  other_deductions: "Other Ded.",
  total_deductions: "Total Ded.",
  net_pay: "Net Pay",
  bank_name: "Bank",
  bank_account_number: "Account No.",
};

// Fields treated as currency/numeric — right-aligned + comma-formatted in PDF/CSV
const NUMERIC_FIELDS = new Set([
  "basic_pay",
  "gross_pay",
  "overtime_pay",
  "holiday_pay",
  "night_differential",
  "allowances",
  "bonus",
  "sss_deduction",
  "philhealth_deduction",
  "pagibig_deduction",
  "tax_deduction",
  "loan_deduction",
  "other_deductions",
  "total_deductions",
  "net_pay",
  "salary",
]);

/** Get readable header for a field */
const getFieldLabel = (field) =>
  FIELD_LABELS[field] || field.replace(/_/g, " ").toUpperCase();

/** Format a numeric value with thousands separators, 2 decimals */
const formatNumber = (val) =>
  Number(val).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Escape a single value for CSV.
 */
const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  const escaped = str.replace(/"/g, '""');
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
};

/**
 * Generate CSV content from array data.
 *
 * Letterhead mirrors drawLetterhead() line-for-line:
 *
 *   Col A (logo slot, left)  |  Col B…mid (institution text, centre)  |  Col last (spacer = Col A width)
 *
 *   Row 1 : [BCC Logo]       |  Republic of the Philippines
 *   Row 2 : (empty)          |  Region IV-B MIMAROPA
 *   Row 3 : (empty)          |  BACO COMMUNITY COLLEGE
 *   Row 4 : (empty)          |  Poblacion, Baco, Oriental Mindoro 5201
 *   Row 5 : (empty)          |  Email: bccbaco@gmail.com
 *   Row 6 : ── divider (blank row) ──────────────────────────────────
 *   Row 7 : LIST OF ENROLLED STUDENTS … / <TITLE>  (sub-header, col A)
 *   Row 8 : Generated: …     |  Total Records: …
 *   Row 9 : ── blank spacer before table ────────────────────────────
 *   Row 10: [column headers]
 *   Row 11+: [data rows]
 *
 * The trailing empty spacer column on each letterhead row balances Col A so
 * the institution text appears visually centred when opened in Excel / Sheets.
 */
export const generateCSV = (data, options = {}) => {
  if (!Array.isArray(data) || data.length === 0) return "";

  const {
    headers = Object.keys(data[0]),
    includeTimestamps = false,
    title = "Report",
    programLabel = "",
  } = options;

  const cols = includeTimestamps
    ? headers
    : headers.filter(
        (h) => !["created_at", "updated_at", "deleted_at"].includes(h),
      );

  const totalCols = Math.max(cols.length, 3); // need at least 3 cols for layout

  // Pad / trim an array of cell values to exactly totalCols, then join as CSV row.
  const makeRow = (cells = []) =>
    Array.from({ length: totalCols }, (_, i) =>
      escapeCsvValue(cells[i] ?? ""),
    ).join(",");

  // Logo in col A | institution text in col B | trailing cols empty (spacer).
  // Col A width ≈ 1 col; trailing spacer also 1 col → text block is centred.
  const lhRow = (logoCell, centreText) => makeRow([logoCell, centreText]);

  // ── Mirrors drawLetterhead() exactly ─────────────────────────────────

  // 1. "Republic of the Philippines"  — small font, centred (line 1 of text block)
  // 2. "Region IV-B MIMAROPA"         — small font, centred
  // 3. "BACO COMMUNITY COLLEGE"       — large bold, centred
  // 4. "Poblacion, Baco…"             — small font, centred
  // 5. "Email: bccbaco@gmail.com"     — small font, centred
  // 6. divider row (blank)
  // 7. sub-header (bold, left-aligned below divider)
  // 8. Generated + Total Records (normal, left-aligned)
  // 9. blank spacer before table

  const subHeaderText = programLabel
    ? `LIST OF ENROLLED STUDENTS IN THE PROGRAM OF ${programLabel.toUpperCase()}`
    : title.toUpperCase();

  const letterhead = [
    lhRow("BCC Logo", "Republic of the Philippines"), // line 1  — small
    lhRow("", "Region IV-B MIMAROPA"), // line 2  — small
    lhRow("", "BACO COMMUNITY COLLEGE"), // line 3  — large bold
    lhRow("", "Poblacion, Baco, Oriental Mindoro 5201"), // line 4 — small
    lhRow("", "Email: bccbaco@gmail.com"), // line 5  — small
    makeRow([]), // divider (blank row)
    makeRow([subHeaderText]), // sub-header bold
    makeRow([
      // Generated | Total Records
      `Generated: ${new Date().toLocaleString("en-PH")}`,
      `Total Records: ${data.length}`,
    ]),
    makeRow([]), // blank spacer → table
  ];

  // ── Column headers + data rows ────────────────────────────────────────
  const headerLine = cols
    .map((h) => escapeCsvValue(getFieldLabel(h)))
    .join(",");
  const rowLines = data.map((row) =>
    cols
      .map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return "";
        if (typeof val === "boolean") return val ? "Yes" : "No";
        if (NUMERIC_FIELDS.has(h) && !isNaN(val)) {
          return escapeCsvValue(formatNumber(val));
        }
        return escapeCsvValue(val);
      })
      .join(","),
  );

  return [...letterhead, headerLine, ...rowLines].join("\n");
};

/**
 * Download CSV content as a file.
 */
export const downloadCSV = (csvContent, filename = "export.csv") => {
  if (!csvContent) return;
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Fetch a remote image URL and convert it to a base64 data URL.
 */
const fetchLogoAsBase64 = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("FileReader failed"));
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("BCC PDF: failed to load logo –", e.message);
    return null;
  }
};

/**
 * Build the letterhead block and return the Y position where content
 * should start, so the table always begins right after the header
 * regardless of how many sub-header lines are rendered.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────┐
 *   │ [LOGO]   Republic of the Philippines          │  ← centred text
 *   │          Region IV-B MIMAROPA                 │
 *   │          BACO COMMUNITY COLLEGE               │
 *   │          Poblacion, Baco…                     │
 *   │          Email: bccbaco@gmail.com             │
 *   ├──────────────────────────────────────────────┤
 *   │ LIST OF ENROLLED STUDENTS …                  │  ← left-aligned sub-header
 *   │ Generated: …   Total Records: …              │
 *   └──────────────────────────────────────────────┘
 *
 * @returns {number} Y coordinate for the first table row
 */
const drawLetterhead = (
  doc,
  { pageW, margin, logoBase64, title, programLabel, recordCount },
) => {
  // ── Constants ────────────────────────────────────────────────────────────
  const LOGO_SIZE = 22; // logo square (mm)
  const LINE_GAP_SM = 4.5; // gap between small lines (mm)
  const LINE_GAP_LG = 7; // gap after institution name
  const DIVIDER_PAD = 5; // space above & below the rule
  const SUB_LINE_GAP = 5.5; // gap between sub-header lines
  const META_GAP = 4.5; // gap between Generated / Total Records line
  const BOTTOM_PAD = 6; // space below last meta line → table start

  // ── Letterhead text lines ─────────────────────────────────────────────
  const centerX = pageW / 2;

  let y = margin;

  // "Republic of the Philippines"
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.text("Republic of the Philippines", centerX, y, { align: "center" });
  y += LINE_GAP_SM;

  // "Region IV-B MIMAROPA"
  doc.text("Region IV-B MIMAROPA", centerX, y, { align: "center" });
  y += LINE_GAP_LG;

  // "BACO COMMUNITY COLLEGE"
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("BACO COMMUNITY COLLEGE", centerX, y, { align: "center" });
  y += LINE_GAP_LG;

  // "Poblacion, Baco, Oriental Mindoro 5201"
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Poblacion, Baco, Oriental Mindoro 5201", centerX, y, {
    align: "center",
  });
  y += LINE_GAP_SM;

  // "Email: bccbaco@gmail.com"
  doc.text("Email: bccbaco@gmail.com", centerX, y, { align: "center" });

  // ── Logo — vertically centered on the text block ──────────────────────
  const blockTop = margin;
  const blockBot = y;
  const logoY = blockTop + (blockBot - blockTop) / 2 - LOGO_SIZE / 2;

  if (logoBase64) {
    try {
      const fmt = logoBase64.startsWith("data:image/png") ? "PNG" : "JPEG";
      doc.addImage(logoBase64, fmt, margin, logoY, LOGO_SIZE, LOGO_SIZE);
    } catch (e) {
      console.warn("BCC PDF: could not embed logo –", e.message);
    }
  }

  // ── Divider ───────────────────────────────────────────────────────────
  y += DIVIDER_PAD;
  doc.setLineWidth(0.4);
  doc.setDrawColor(0, 0, 0);
  doc.line(margin, y, pageW - margin, y);
  y += DIVIDER_PAD;

  // ── Sub-header: report title / program line ───────────────────────────
  const subText = programLabel
    ? `LIST OF ENROLLED STUDENTS IN THE PROGRAM OF ${programLabel.toUpperCase()}`
    : title.toUpperCase();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);

  // Wrap long program names; each line advances y
  const maxTextWidth = pageW - margin * 2;
  const titleLines = doc.splitTextToSize(subText, maxTextWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * SUB_LINE_GAP;

  // ── Meta lines ────────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString("en-PH")}`, margin, y);
  y += META_GAP;
  doc.text(`Total Records: ${recordCount}`, margin, y);
  y += BOTTOM_PAD;

  return y; // ← first table row starts here
};

/**
 * Download a professional PDF report with school letterhead.
 *
 * @param {Function} jsPDFLib      – jsPDF constructor
 * @param {Function} autoTableLib  – jspdf-autotable function
 * @param {Array}    data          – array of row objects
 * @param {Object}   options
 *   @param {string}   options.title              – report sub-title, e.g. "Students Report"
 *   @param {string}   options.programLabel       – shown in "List of Enrolled Students in the Program of …"
 *                                                  leave blank to omit that line
 *   @param {string}   options.orientation        – "landscape" | "portrait" (default "landscape")
 *   @param {string[]} options.headers            – field keys to include (default: all keys)
 *   @param {boolean}  options.includeTimestamps  – include created_at / updated_at (default false)
 *   @param {string}   options.logoBase64         – optional pre-fetched base64 PNG/JPEG
 *   @param {string}   options.filename           – override auto-generated filename
 *   @param {boolean}  options.showTotals         – append a bold totals row for numeric columns (default true)
 *   @param {number[]} options.headerFillColor    – [r,g,b] header background (default BCC maroon)
 */
export const downloadPDF = async (jsPDFLib, autoTableLib, data, options = {}) => {
  if (!data || data.length === 0) return;

  const {
    title = "Report",
    programLabel = "",
    orientation = "landscape",
    headers = Object.keys(data[0]),
    includeTimestamps = false,
    logoBase64: passedLogo = null,
    filename: customFilename = null,
    showTotals = true,
    headerFillColor = [128, 0, 32], // BCC maroon — change to match brand color
    officeLabel: passedOfficeLabel = null, // e.g. "Registrar Office" | "HR Office"
  } = options;

  // ── Resolve footer office label ─────────────────────────────────────────
  // Explicit option always wins. Otherwise auto-detect from the report
  // title / program label: payroll reports → HR Office, everything else
  // (enrollment, students, grades, etc.) → Registrar Office.
  const officeLabel =
    passedOfficeLabel ||
    (/payroll/i.test(`${title} ${programLabel}`) ? "HR Office" : "Registrar Office");

  // ── Resolve logo ────────────────────────────────────────────────────────
  const BCC_LOGO_URL =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT3u0c9J31s_J2gtizcwzb-YcqU5Rr25m9Irw&s";

  const logoBase64 = passedLogo ?? (await fetchLogoAsBase64(BCC_LOGO_URL));

  // ── Column filter ───────────────────────────────────────────────────────
  const cols = includeTimestamps
    ? headers
    : headers.filter(
        (h) => !["created_at", "updated_at", "deleted_at"].includes(h),
      );

  const doc = new jsPDFLib({ orientation, unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;

  // ── Draw letterhead and get dynamic table start Y ──────────────────────
  const tableStartY = drawLetterhead(doc, {
    pageW,
    margin,
    logoBase64,
    title,
    programLabel,
    recordCount: data.length,
  });

  // Column styles: right-align + auto width for numeric fields, left for text
  const columnStyles = Object.fromEntries(
    cols.map((h, i) => [
      i,
      NUMERIC_FIELDS.has(h)
        ? { halign: "right", cellWidth: "auto" }
        : { halign: "left", cellWidth: "auto" },
    ]),
  );

  // ── Body rows ────────────────────────────────────────────────────────────
  const bodyRows = data.map((row) =>
    cols.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      if (typeof val === "boolean") return val ? "Yes" : "No";
      if (NUMERIC_FIELDS.has(h) && !isNaN(val)) return formatNumber(val);
      return String(val);
    }),
  );

  // ── Grand totals — appended as the LAST row of the SAME table so its
  //    column widths always match the data rows above it exactly. A
  //    separate autoTable() call recomputes "auto" widths independently
  //    and can drift out of alignment with the main table above it —
  //    that's what was causing the TOTAL row to look off. ──────────────────
  const hasNumericCol = cols.some((h) => NUMERIC_FIELDS.has(h));
  const includeTotalsRow = showTotals && hasNumericCol;

  if (includeTotalsRow) {
    const totalsRow = cols.map((h, i) => {
      if (!NUMERIC_FIELDS.has(h)) return i === 0 ? "TOTAL" : "";
      const sum = data.reduce((s, row) => s + (Number(row[h]) || 0), 0);
      return formatNumber(sum);
    });
    bodyRows.push(totalsRow);
  }

  const totalsRowIndex = includeTotalsRow ? bodyRows.length - 1 : -1;

  // ── Table ────────────────────────────────────────────────────────────────
  autoTableLib(doc, {
    startY: tableStartY,
    margin: { left: margin, right: margin },
    head: [cols.map((h) => getFieldLabel(h))],
    body: bodyRows,
    styles: {
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      overflow: "linebreak",
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      valign: "middle",
    },
    headStyles: {
      fillColor: headerFillColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      fontSize: 7.5,
      lineWidth: 0.1,
      lineColor: [0, 0, 0],
    },
    columnStyles,
    tableWidth: "auto",
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    tableLineColor: [0, 0, 0],
    tableLineWidth: 0.1,
    // Bold the totals row and give it a heavier top border — without
    // touching column widths, so it stays perfectly aligned with the body.
    didParseCell: (hookData) => {
      if (
        includeTotalsRow &&
        hookData.section === "body" &&
        hookData.row.index === totalsRowIndex
      ) {
        hookData.cell.styles.fontStyle = "bold";
        hookData.cell.styles.fillColor = [255, 255, 255];
        hookData.cell.styles.lineWidth = {
          top: 0.5,
          bottom: 0.1,
          left: 0.1,
          right: 0.1,
        };
      }
    },
    // Re-draw the letterhead on every subsequent page
    didAddPage: (hookData) => {
      if (hookData.pageNumber > 1) {
        drawLetterhead(doc, {
          pageW,
          margin,
          logoBase64,
          title,
          programLabel,
          recordCount: data.length,
        });
      }
    },
    didDrawPage: (hookData) => {
      const pg = hookData.pageNumber;
      const total = doc.internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      doc.text(`Page ${pg} of ${total}`, pageW / 2, pageH - 6, {
        align: "center",
      });
      doc.text("Baco Community College – Registrar Office", margin, pageH - 6);
    },
  });

  // ── Save ─────────────────────────────────────────────────────────────────
  const safeTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const dateStr = new Date().toISOString().split("T")[0];
  const outFile = customFilename || `BCC_${safeTitle}_${dateStr}.pdf`;
  doc.save(outFile);
};

/**
 * Format date for display
 */
export const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount) => {
  if (!amount) return "₱0.00";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};