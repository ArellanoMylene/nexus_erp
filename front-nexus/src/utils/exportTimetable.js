/**
 * exportTimetable.js
 * Baco Community College – Class Schedule (Timetable) PDF Exporter
 *
 * Page size: 8.5 x 11 inch (Letter) — unit: points (pt)
 * 1 inch = 72 pt
 */

import { jsPDF } from "jspdf";

// ─── Page / Layout constants (all in pt) ─────────────────────────────────────
const PW = 8.5 * 72; // 612 pt
const PH = 11 * 72;  // 792 pt
const ML = 40;
const MR = PW - 40;
const BODY_W = MR - ML; // 532 pt

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// ─── Cell drawing helper (same pattern as exportRegistrationForm.js) ────────
function cell(doc, text, x, y, w, h, opts = {}) {
  const {
    align = "left",
    bold = false,
    fontSize = 8,
    fill = null,
    border = true,
    padding = 3,
    valign = "middle",
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
  const str = String(text ?? "");

  if (align === "center") {
    doc.text(str, x + w / 2, textY, { align: "center", maxWidth: maxW });
  } else if (align === "right") {
    doc.text(str, x + w - padding, textY, { align: "right", maxWidth: maxW });
  } else {
    doc.text(str, x + padding, textY, { align: "left", maxWidth: maxW });
  }
}

function safe(val) {
  if (val === null || val === undefined) return "";
  const s = String(val).trim();
  return s === "0" ? "" : s;
}

// ─── Main export function ─────────────────────────────────────────────────────
/**
 * @param {Object} studentInfo - { full_name, student_number }
 * @param {Object} periodMeta  - { school_year, semester, year_level }
 * @param {Array}  timetable   - flat array of { day, subject_code, subject_name,
 *                                start_time, end_time, room, instructor }
 */
export async function exportTimetablePDF(
  studentInfo = {},
  periodMeta = {},
  timetable = [],
) {
  const doc = new jsPDF({
    unit: "pt",
    format: [PW, PH],
    orientation: "portrait",
  });

  let y = 40;

  // ── HEADER ────────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Baco Community College", PW / 2, y, { align: "center" });
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Poblacion Baco, Oriental Mindoro", PW / 2, y, { align: "center" });
  y += 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("CLASS SCHEDULE", PW / 2, y, { align: "center" });
  y += 24;

  // ── STUDENT INFO ROW ────────────────────────────────────────────────────────
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Student Name:", ML, y);
  doc.setFont("helvetica", "normal");
  doc.text(safe(studentInfo.full_name) || "N/A", ML + 80, y);

  doc.setFont("helvetica", "bold");
  doc.text("Student No.:", ML + 280, y);
  doc.setFont("helvetica", "normal");
  doc.text(safe(studentInfo.student_number) || "N/A", ML + 350, y);
  y += 16;

  doc.setFont("helvetica", "bold");
  doc.text("Academic Year:", ML, y);
  doc.setFont("helvetica", "normal");
  doc.text(safe(periodMeta.school_year) || "N/A", ML + 80, y);

  doc.setFont("helvetica", "bold");
  doc.text("Semester:", ML + 280, y);
  doc.setFont("helvetica", "normal");
  doc.text(safe(periodMeta.semester) || "N/A", ML + 350, y);
  y += 16;

  if (periodMeta.year_level) {
    doc.setFont("helvetica", "bold");
    doc.text("Year Level:", ML, y);
    doc.setFont("helvetica", "normal");
    doc.text(safe(periodMeta.year_level), ML + 80, y);
    y += 16;
  }

  y += 8;

  // ── TABLE ────────────────────────────────────────────────────────────────
  const headers = ["Day", "Time", "Code", "Subject", "Room", "Instructor"];
  const colWidths = [62, 92, 60, 150, 60, BODY_W - (62 + 92 + 60 + 150 + 60)];
  const HDR_H = 20;
  const ROW_H = 18;

  const drawHeaderRow = () => {
    let cx = ML;
    headers.forEach((h, i) => {
      cell(doc, h, cx, y, colWidths[i], HDR_H, {
        align: "center",
        bold: true,
        fontSize: 8,
        fill: [210, 210, 210],
        valign: "middle",
      });
      cx += colWidths[i];
    });
    y += HDR_H;
  };

  drawHeaderRow();

  // Sort by day-of-week order, then by start time
  const sorted = [...(timetable || [])].sort((a, b) => {
    const dayDiff = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    return String(a.start_time || "").localeCompare(String(b.start_time || ""));
  });

  if (sorted.length === 0) {
    cell(doc, "No classes scheduled", ML, y, BODY_W, ROW_H, {
      align: "center",
      fontSize: 8,
      valign: "middle",
    });
    y += ROW_H;
  } else {
    sorted.forEach((item) => {
      // Page-break check — re-draw the header row on the new page
      if (y + ROW_H > PH - 50) {
        doc.addPage();
        y = 40;
        drawHeaderRow();
      }

      let cx = ML;
      const rowVals = [
        safe(item.day),
        `${safe(item.start_time)} - ${safe(item.end_time)}`.trim(),
        safe(item.subject_code),
        safe(item.subject_name),
        safe(item.room) || "TBA",
        safe(item.instructor) || "TBA",
      ];
      rowVals.forEach((v, i) => {
        cell(doc, v, cx, y, colWidths[i], ROW_H, {
          align: "center",
          fontSize: 7.5,
          valign: "middle",
        });
        cx += colWidths[i];
      });
      y += ROW_H;
    });
  }

  // ── FOOTER / GENERATED DATE ─────────────────────────────────────────────
  y += 20;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Generated on ${new Date().toLocaleString("en-US")}`,
    ML,
    y,
  );
  doc.setTextColor(0, 0, 0);

  const safeName =
    (studentInfo.full_name || "student")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "") || "student";
  doc.save(`BCC_ClassSchedule_${safeName}.pdf`);
}