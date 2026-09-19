/**
 * gradeExcelExport.js
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Dependencies (add to package.json):
 *   xlsx-js-style  → workbook/sheet plumbing WITH style support (replaces xlsx + xlsx-style)
 *   file-saver     → triggers browser download
 *
 * Install:
 *   npm install xlsx-js-style file-saver
 *
 * Usage:
 *   import { exportGradeEncoding } from "./gradeExcelExport";
 *   exportGradeEncoding({
 *     period, students, grades, maxScores, activityMeta, courseName,
 *     columnCounts: { writtenOutput: 12, performanceTasks: 12 }, // NEW — optional, defaults to 12/12
 *   });
 *
 * ─── CHANGELOG ────────────────────────────────────────────────────────────────
 * The Written Output / Performance Task section widths used to be hard-coded
 * to 12 columns each (COL.WO1..WO12, COL.PT1..PT12). The grading UI now lets
 * faculty add/remove extra activity columns, so the whole column layout is
 * built dynamically per export based on `columnCounts`. Pass the same counts
 * the UI is currently showing (woCount/ptCount) so the exported sheet lines
 * up with what's on screen — and so a later re-import maps back correctly.
 */
import XLSXStyle from "xlsx-js-style";
import { saveAs } from "file-saver";

// ─── Palette (mirrors Tailwind classes used in the UI) ────────────────────────
const P = {
  WO_HEADER:  { fgColor: { rgb: "BFDBFE" } },
  WO_SUBHDR:  { fgColor: { rgb: "DBEAFE" } },
  WO_INPUT:   { fgColor: { rgb: "EFF6FF" } },
  WO_TOTAL:   { fgColor: { rgb: "BFDBFE" } },
  PT_HEADER:  { fgColor: { rgb: "A7F3D0" } },
  PT_SUBHDR:  { fgColor: { rgb: "D1FAE5" } },
  PT_INPUT:   { fgColor: { rgb: "ECFDF5" } },
  PT_TOTAL:   { fgColor: { rgb: "A7F3D0" } },
  EX_HEADER:  { fgColor: { rgb: "FDE68A" } },
  EX_SUBHDR:  { fgColor: { rgb: "FEF3C7" } },
  EX_INPUT:   { fgColor: { rgb: "FFFBEB" } },
  EX_TOTAL:   { fgColor: { rgb: "FDE68A" } },
  FIN_HEADER: { fgColor: { rgb: "DDD6FE" } },
  FIN_CELL:   { fgColor: { rgb: "EDE9FE" } },
  GRP_BG:     { fgColor: { rgb: "1E293B" } },
  SUB_BG:     { fgColor: { rgb: "F1F5F9" } },
  META_BG:    { fgColor: { rgb: "F8FAFC" } },
  NAME_BG:    { fgColor: { rgb: "FFFFFF" } },
  ODD_BG:     { fgColor: { rgb: "FFFFFF" } },
  EVEN_BG:    { fgColor: { rgb: "F8FAFC" } },
  PASS_BG:    { fgColor: { rgb: "DCFCE7" } },
  FAIL_BG:    { fgColor: { rgb: "FEE2E2" } },
  RPT_HDR:    { fgColor: { rgb: "1E293B" } },
  RPT_ODD:    { fgColor: { rgb: "FFFFFF" } },
  RPT_EVEN:   { fgColor: { rgb: "F8FAFC" } },
  RPT_FAIL:   { fgColor: { rgb: "FEE2E2" } },
  WHITE:      { fgColor: { rgb: "FFFFFF" } },
  // School header colors
  SCHOOL_BG:  { fgColor: { rgb: "1E3A5F" } }, // Dark navy blue
  OFFICE_BG:  { fgColor: { rgb: "2D5F8A" } }, // Slightly lighter navy
};

// ─── Font helpers ─────────────────────────────────────────────────────────────
const F = {
  white:      (sz = 9)  => ({ name: "Arial", sz, bold: true,  color: { rgb: "FFFFFF" } }),
  dark:       (sz = 9)  => ({ name: "Arial", sz, bold: false, color: { rgb: "0F172A" } }),
  darkBold:   (sz = 9)  => ({ name: "Arial", sz, bold: true,  color: { rgb: "0F172A" } }),
  muted:      (sz = 8)  => ({ name: "Arial", sz, bold: false, color: { rgb: "64748B" } }),
  mutedBold:  (sz = 8)  => ({ name: "Arial", sz, bold: true,  color: { rgb: "64748B" } }),
  violet:     (sz = 9)  => ({ name: "Arial", sz, bold: true,  color: { rgb: "5B21B6" } }),
  green:      (sz = 9)  => ({ name: "Arial", sz, bold: true,  color: { rgb: "166534" } }),
  red:        (sz = 9)  => ({ name: "Arial", sz, bold: true,  color: { rgb: "991B1B" } }),
  blue:       (sz = 9)  => ({ name: "Arial", sz, bold: true,  color: { rgb: "1E40AF" } }),
  title:      ()        => ({ name: "Arial", sz: 14, bold: true, color: { rgb: "0F172A" } }),
  subtitle:   ()        => ({ name: "Arial", sz: 9,  bold: false, color: { rgb: "64748B" } }),
  schoolName: ()        => ({ name: "Arial", sz: 14, bold: true,  color: { rgb: "FFFFFF" } }),
  schoolSub:  ()        => ({ name: "Arial", sz: 9,  bold: false, color: { rgb: "DBEAFE" } }),
  schoolBold: ()        => ({ name: "Arial", sz: 10, bold: true,  color: { rgb: "FFFFFF" } }),
  officeLabel:()        => ({ name: "Arial", sz: 11, bold: true,  color: { rgb: "FFFFFF" } }),
};

// ─── Border helpers ───────────────────────────────────────────────────────────
const THIN_SIDE  = { style: "thin",   color: { rgb: "CBD5E1" } };
const MED_SIDE   = { style: "medium", color: { rgb: "94A3B8" } };

const border = (style = "thin") => {
  const s = style === "medium" ? MED_SIDE : THIN_SIDE;
  return { top: s, bottom: s, left: s, right: s };
};

const noBorder = () => ({
  top:    { style: "none" },
  bottom: { style: "none" },
  left:   { style: "none" },
  right:  { style: "none" },
});

// ─── Alignment helpers ────────────────────────────────────────────────────────
const AC  = { horizontal: "center", vertical: "center", wrapText: true };
const AL  = { horizontal: "left",   vertical: "center", wrapText: false };

// ─── Build a styled cell object ───────────────────────────────────────────────
function cell(value, { fill, font: fnt, alignment = AC, border: brd = border() } = {}) {
  const c = { v: value ?? "", t: typeof value === "number" ? "n" : "s" };
  c.s = {};
  if (fill)      c.s.fill      = { patternType: "solid", ...fill };
  if (fnt)       c.s.font      = fnt;
  if (alignment) c.s.alignment = alignment;
  if (brd)       c.s.border    = brd;
  return c;
}

function numCell(value, { fill, font: fnt, alignment = AC, border: brd = border(), fmt = "0.00" } = {}) {
  if (value === null || value === undefined || value === "") {
    return cell("-", { fill, font: fnt, alignment, border: brd });
  }
  const v = typeof value === "number" ? value : Number(value);
  const c = { v, t: "n", z: fmt };
  c.s = {};
  if (fill)      c.s.fill      = { patternType: "solid", ...fill };
  if (fnt)       c.s.font      = fnt;
  if (alignment) c.s.alignment = alignment;
  if (brd)       c.s.border    = brd;
  return c;
}

// ─── Column layout (1-based) — now built dynamically from column counts ──────
// Was previously a fixed 12/12 object; the Written Output and Performance
// Task sections can each have a different number of activity columns now,
// so we compute the layout fresh for every export call.
const DEFAULT_COLUMN_COUNTS = { writtenOutput: 12, performanceTasks: 12 };

function buildColumnLayout(woCount = 12, ptCount = 12) {
  const STUDENT = 1;
  const ID      = 2;
  const WO1     = 3;
  const WO_TOT  = WO1 + woCount;
  const WO_RAT  = WO_TOT + 1;
  const WO_PCT  = WO_RAT + 1;
  const PT1     = WO_PCT + 1;
  const PT_TOT  = PT1 + ptCount;
  const PT_RAT  = PT_TOT + 1;
  const PT_PCT  = PT_RAT + 1;
  const EX_SCORE = PT_PCT + 1;
  const EX_RAT   = EX_SCORE + 1;
  const EX_PCT   = EX_RAT + 1;
  const FINAL    = EX_PCT + 1;
  const EQUIV    = FINAL + 1;
  const STATUS   = EQUIV + 1;

  return {
    STUDENT, ID, WO1, WO_TOT, WO_RAT, WO_PCT,
    PT1, PT_TOT, PT_RAT, PT_PCT,
    EX_SCORE, EX_RAT, EX_PCT,
    FINAL, EQUIV, STATUS,
    TOTAL_COLS: STATUS,
  };
}

const colLetter = (n) => {
  let result = "";
  while (n > 0) {
    result = String.fromCharCode(65 + ((n - 1) % 26)) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
};

const W = { WO: 30, PT: 40, EX: 30 };

// ─── Grade scale ──────────────────────────────────────────────────────────────
const LETTER_SCALE = [
  { min: 97, letter: "", equivalent: "1.00", status: "PASSED" },
  { min: 94, letter: "", equivalent: "1.25", status: "PASSED" },
  { min: 91, letter: "", equivalent: "1.50", status: "PASSED" },
  { min: 88, letter: "", equivalent: "1.75", status: "PASSED" },
  { min: 85, letter: "", equivalent: "2.00", status: "PASSED" },
  { min: 82, letter: "", equivalent: "2.25", status: "PASSED" },
  { min: 79, letter: "", equivalent: "2.50", status: "PASSED" },
  { min: 76, letter: "", equivalent: "2.75", status: "PASSED" },
  { min: 70, letter: "", equivalent: "3.00", status: "FAILED" },
  { min: 65, letter: "", equivalent: "4.00", status: "FAILED" },
];

function getLetterInfo(score) {
  if (score === null || score === undefined) {
    return { letter: "-", equivalent: "-", status: "-" };
  }
  return (
    LETTER_SCALE.find((r) => score >= r.min) || {
      letter: "",
      equivalent: "5.00",
      status: "FAILED",
    }
  );
}

function normalizeNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const p = Number(value);
  return Number.isFinite(p) ? p : null;
}

function calcSection(scores = [], maxScores = [], weight = 0) {
  const total  = scores.reduce((sum, score) => sum + (normalizeNumber(score) ?? 0), 0);
  const maxTot = maxScores.reduce((sum, maxScore) => sum + Number(maxScore || 100), 0);
  if (maxTot <= 0) return { total: 0, pct: 0, weighted: 0 };
  const pct      = (total / maxTot) * 100;
  const weighted = pct * (weight / 100);
  return {
    total:    Number(total.toFixed(2)),
    pct:      Number(pct.toFixed(2)),
    weighted: Number(weighted.toFixed(2)),
  };
}

function calcFinal(gradeRow, maxRow) {
  const hasWritten     = gradeRow.writtenOutput.some((s) => normalizeNumber(s) !== null);
  const hasPerformance = gradeRow.performanceTasks.some((s) => normalizeNumber(s) !== null);
  const hasExam        = normalizeNumber(gradeRow.midtermExam) !== null;

  if (!hasWritten && !hasPerformance && !hasExam) return null;

  const wo     = calcSection(gradeRow.writtenOutput,    maxRow.writtenOutput,    W.WO);
  const pt     = calcSection(gradeRow.performanceTasks, maxRow.performanceTasks, W.PT);
  const midRaw = normalizeNumber(gradeRow.midtermExam) ?? 0;
  const midMax = Number(maxRow.midtermExam || 100);
  const exPct  = midMax > 0 ? (midRaw / midMax) * 100 : 0;
  const exW    = exPct * (W.EX / 100);
  return Number((wo.weighted + pt.weighted + exW).toFixed(2));
}

// ─── Empty row helpers — now accept dynamic column counts ────────────────────
const EMPTY_GRADE = (woCount = 12, ptCount = 12) => ({
  writtenOutput: Array(woCount).fill(""),
  performanceTasks: Array(ptCount).fill(""),
  midtermExam: "",
});
const EMPTY_MAX = (woCount = 12, ptCount = 12) => ({
  writtenOutput: Array(woCount).fill(100),
  performanceTasks: Array(ptCount).fill(100),
  midtermExam: 100,
});

// ─── Sheet helpers ────────────────────────────────────────────────────────────
function setCell(ws, row, col, cellObj) {
  const addr = `${colLetter(col)}${row}`;
  ws[addr] = cellObj;
}

function merge(ws, r1, c1, r2, c2) {
  if (!ws["!merges"]) ws["!merges"] = [];
  ws["!merges"].push({ s: { r: r1 - 1, c: c1 - 1 }, e: { r: r2 - 1, c: c2 - 1 } });
}

// ─── School header block ──────────────────────────────────────────────────────
// Renders the official school letterhead at the very top of the sheet,
// centered across all columns, before the grade encoding title.
function buildSchoolHeader(ws, totalCols) {
  const TC = totalCols;
  let row = 1;

  // Helper: fill all cells in a merged row with the background
  const fillRow = (r, fill) => {
    for (let c = 1; c <= TC; c++) {
      setCell(ws, r, c, cell("", { fill, border: noBorder() }));
    }
  };

  // ── Row 1: Republic of the Philippines ──────────────────────────────────
  fillRow(row, P.SCHOOL_BG);
  setCell(ws, row, 1, cell("Republic of the Philippines", {
    fill: P.SCHOOL_BG,
    font: F.schoolSub(),
    alignment: { horizontal: "center", vertical: "center", wrapText: false },
    border: noBorder(),
  }));
  merge(ws, row, 1, row, TC);
  row++;

  // ── Row 2: Region IV-B MIMAROPA ─────────────────────────────────────────
  fillRow(row, P.SCHOOL_BG);
  setCell(ws, row, 1, cell("Region IV-B MIMAROPA", {
    fill: P.SCHOOL_BG,
    font: F.schoolSub(),
    alignment: { horizontal: "center", vertical: "center", wrapText: false },
    border: noBorder(),
  }));
  merge(ws, row, 1, row, TC);
  row++;

  // ── Row 3: BACO COMMUNITY COLLEGE (large) ───────────────────────────────
  fillRow(row, P.SCHOOL_BG);
  setCell(ws, row, 1, cell("BACO COMMUNITY COLLEGE", {
    fill: P.SCHOOL_BG,
    font: F.schoolName(),
    alignment: { horizontal: "center", vertical: "center", wrapText: false },
    border: noBorder(),
  }));
  merge(ws, row, 1, row, TC);
  row++;

  // ── Row 4: Address ───────────────────────────────────────────────────────
  fillRow(row, P.SCHOOL_BG);
  setCell(ws, row, 1, cell("Poblacion, Baco, Oriental Mindoro, 5201", {
    fill: P.SCHOOL_BG,
    font: F.schoolSub(),
    alignment: { horizontal: "center", vertical: "center", wrapText: false },
    border: noBorder(),
  }));
  merge(ws, row, 1, row, TC);
  row++;

  // ── Row 5: Email ─────────────────────────────────────────────────────────
  fillRow(row, P.SCHOOL_BG);
  setCell(ws, row, 1, cell("Email: bccbaco@gmail.com", {
    fill: P.SCHOOL_BG,
    font: F.schoolSub(),
    alignment: { horizontal: "center", vertical: "center", wrapText: false },
    border: noBorder(),
  }));
  merge(ws, row, 1, row, TC);
  row++;

  // ── Row 6: Thin separator ────────────────────────────────────────────────
  for (let c = 1; c <= TC; c++) {
    setCell(ws, row, c, cell("", {
      fill: { fgColor: { rgb: "DBEAFE" } },
      border: noBorder(),
    }));
  }
  merge(ws, row, 1, row, TC);
  row++;

  // ── Row 7: Office of the Registrar ──────────────────────────────────────
  fillRow(row, P.OFFICE_BG);
  setCell(ws, row, 1, cell("Office of the Registrar", {
    fill: P.OFFICE_BG,
    font: F.officeLabel(),
    alignment: { horizontal: "center", vertical: "center", wrapText: false },
    border: noBorder(),
  }));
  merge(ws, row, 1, row, TC);
  row++;

  // ── Row 8: Another thin separator before grade title ────────────────────
  for (let c = 1; c <= TC; c++) {
    setCell(ws, row, c, cell("", {
      fill: P.META_BG,
      border: noBorder(),
    }));
  }
  merge(ws, row, 1, row, TC);
  row++;

  return row; // caller starts its own content from this row
}

// ─── Build one encoding sheet (Midterm or Final) ──────────────────────────────
function buildEncodingSheet(ws, { period, students, grades, maxScores, activityMeta, courseName, columnCounts }) {
  const periodLabel = period === "midterm" ? "Midterm" : "Final";
  const woCount = columnCounts?.writtenOutput    ?? DEFAULT_COLUMN_COUNTS.writtenOutput;
  const ptCount = columnCounts?.performanceTasks ?? DEFAULT_COLUMN_COUNTS.performanceTasks;
  const COL = buildColumnLayout(woCount, ptCount);
  const WO_INPUT_COLS = Array.from({ length: woCount }, (_, i) => COL.WO1 + i);
  const PT_INPUT_COLS = Array.from({ length: ptCount }, (_, i) => COL.PT1 + i);

  // ── School letterhead first ────────────────────────────────────────────
  let row = buildSchoolHeader(ws, COL.TOTAL_COLS);

  // ── Title block ───────────────────────────────────────────────────────────
  const titleStyle = { fill: P.GRP_BG, font: F.white(12), alignment: AL, border: border() };
  const subStyle   = { fill: P.META_BG, font: F.subtitle(), alignment: AL, border: border() };

  setCell(ws, row, 1, cell(`${periodLabel.toUpperCase()} GRADE ENCODING SHEET`, titleStyle));
  for (let c = 2; c <= COL.TOTAL_COLS; c++) setCell(ws, row, c, cell("", { fill: P.GRP_BG, border: border() }));
  merge(ws, row, 1, row, COL.TOTAL_COLS);
  row++;

  setCell(ws, row, 1, cell(`Course: ${courseName}`, subStyle));
  for (let c = 2; c <= COL.TOTAL_COLS; c++) setCell(ws, row, c, cell("", { fill: P.META_BG, border: border() }));
  merge(ws, row, 1, row, COL.TOTAL_COLS);
  row++;

  setCell(ws, row, 1, cell(`Generated: ${new Date().toLocaleString()}`, subStyle));
  for (let c = 2; c <= COL.TOTAL_COLS; c++) setCell(ws, row, c, cell("", { fill: P.META_BG, border: border() }));
  merge(ws, row, 1, row, COL.TOTAL_COLS);
  row++;

  for (let c = 1; c <= COL.TOTAL_COLS; c++) setCell(ws, row, c, cell("", { border: border() }));
  row++;

  // ── Header rows ───────────────────────────────────────────────────────────
  const HDR_ROW  = row;
  const SUB_ROW  = row + 1;
  const META_ROW = row + 2;

  // Student + ID
  setCell(ws, HDR_ROW, COL.STUDENT, cell("STUDENT",   { fill: P.GRP_BG, font: F.white(), alignment: AC, border: border("medium") }));
  setCell(ws, HDR_ROW, COL.ID,      cell("ID NUMBER", { fill: P.GRP_BG, font: F.white(), alignment: AC, border: border("medium") }));
  merge(ws, HDR_ROW, COL.STUDENT, META_ROW, COL.STUDENT);
  merge(ws, HDR_ROW, COL.ID,      META_ROW, COL.ID);

  // Written Output group
  setCell(ws, HDR_ROW, COL.WO1, cell(`WRITTEN OUTPUT ${W.WO}%`, {
    fill: P.WO_HEADER,
    font: { name: "Arial", sz: 9, bold: true, color: { rgb: "0F172A" } },
    alignment: AC, border: border("medium"),
  }));
  for (let c = COL.WO1 + 1; c <= COL.WO_PCT; c++) {
    setCell(ws, HDR_ROW, c, cell("", { fill: P.WO_HEADER, border: border("medium") }));
  }
  merge(ws, HDR_ROW, COL.WO1, HDR_ROW, COL.WO_PCT);

  // Performance Task group
  setCell(ws, HDR_ROW, COL.PT1, cell(`PERFORMANCE TASK ${W.PT}%`, {
    fill: P.PT_HEADER,
    font: { name: "Arial", sz: 9, bold: true, color: { rgb: "0F172A" } },
    alignment: AC, border: border("medium"),
  }));
  for (let c = COL.PT1 + 1; c <= COL.PT_PCT; c++) {
    setCell(ws, HDR_ROW, c, cell("", { fill: P.PT_HEADER, border: border("medium") }));
  }
  merge(ws, HDR_ROW, COL.PT1, HDR_ROW, COL.PT_PCT);

  // Exam group
  setCell(ws, HDR_ROW, COL.EX_SCORE, cell(`${periodLabel.toUpperCase()} EXAM ${W.EX}%`, {
    fill: P.EX_HEADER,
    font: { name: "Arial", sz: 9, bold: true, color: { rgb: "0F172A" } },
    alignment: AC, border: border("medium"),
  }));
  for (let c = COL.EX_SCORE + 1; c <= COL.EX_PCT; c++) {
    setCell(ws, HDR_ROW, c, cell("", { fill: P.EX_HEADER, border: border("medium") }));
  }
  merge(ws, HDR_ROW, COL.EX_SCORE, HDR_ROW, COL.EX_PCT);

  // Summary cols
  const finCols = [
    { col: COL.FINAL,  label: "FINAL",  fill: P.FIN_HEADER },
    { col: COL.EQUIV,  label: "EQUIV.", fill: P.SUB_BG },
    { col: COL.STATUS, label: "STATUS", fill: P.SUB_BG },
  ];
  finCols.forEach(({ col, label, fill }) => {
    setCell(ws, HDR_ROW, col, cell(label, { fill, font: F.darkBold(), alignment: AC, border: border("medium") }));
    merge(ws, HDR_ROW, col, META_ROW, col);
  });

  // ── Sub-header row ────────────────────────────────────────────────────────
  const sub = (val, fillP) => cell(val, { fill: fillP, font: F.mutedBold(8), alignment: AC, border: border() });

  for (let i = 0; i < woCount; i++) setCell(ws, SUB_ROW, COL.WO1 + i, sub(String(i + 1), P.WO_SUBHDR));
  setCell(ws, SUB_ROW, COL.WO_TOT, sub("Total",  P.WO_SUBHDR));
  setCell(ws, SUB_ROW, COL.WO_RAT, sub("Rating", P.WO_SUBHDR));
  setCell(ws, SUB_ROW, COL.WO_PCT, sub("%",      P.WO_SUBHDR));

  for (let i = 0; i < ptCount; i++) setCell(ws, SUB_ROW, COL.PT1 + i, sub(String(i + 1), P.PT_SUBHDR));
  setCell(ws, SUB_ROW, COL.PT_TOT, sub("Total",  P.PT_SUBHDR));
  setCell(ws, SUB_ROW, COL.PT_RAT, sub("Rating", P.PT_SUBHDR));
  setCell(ws, SUB_ROW, COL.PT_PCT, sub("%",      P.PT_SUBHDR));

  setCell(ws, SUB_ROW, COL.EX_SCORE, sub("Score",  P.EX_SUBHDR));
  setCell(ws, SUB_ROW, COL.EX_RAT,   sub("Rating", P.EX_SUBHDR));
  setCell(ws, SUB_ROW, COL.EX_PCT,   sub("%",      P.EX_SUBHDR));

  // ── Max-score meta row ────────────────────────────────────────────────────
  const meta   = (val, fillP) => cell(val, { fill: fillP, font: F.mutedBold(8), alignment: AC, border: border() });
  const safe   = activityMeta || {};
  const woMeta = safe.writtenOutput    || Array(woCount).fill(null);
  const ptMeta = safe.performanceTasks || Array(ptCount).fill(null);

  for (let i = 0; i < woCount; i++) {
    setCell(ws, META_ROW, COL.WO1 + i, meta(woMeta[i] ? woMeta[i].maxScore : 100, P.WO_INPUT));
  }
  const woMetaTotal = woMeta.reduce((s, x) => s + (x ? Number(x.maxScore) : 100), 0);
  setCell(ws, META_ROW, COL.WO_TOT, meta(woMetaTotal, P.WO_TOTAL));
  setCell(ws, META_ROW, COL.WO_RAT, meta("100",        P.WO_TOTAL));
  setCell(ws, META_ROW, COL.WO_PCT, meta(`${W.WO}%`,   P.WO_TOTAL));

  for (let i = 0; i < ptCount; i++) {
    setCell(ws, META_ROW, COL.PT1 + i, meta(ptMeta[i] ? ptMeta[i].maxScore : 100, P.PT_INPUT));
  }
  const ptMetaTotal = ptMeta.reduce((s, x) => s + (x ? Number(x.maxScore) : 100), 0);
  setCell(ws, META_ROW, COL.PT_TOT, meta(ptMetaTotal, P.PT_TOTAL));
  setCell(ws, META_ROW, COL.PT_RAT, meta("100",        P.PT_TOTAL));
  setCell(ws, META_ROW, COL.PT_PCT, meta(`${W.PT}%`,   P.PT_TOTAL));

  const exMax = safe.midtermExam ? safe.midtermExam.maxScore : 100;
  setCell(ws, META_ROW, COL.EX_SCORE, meta(exMax,      P.EX_INPUT));
  setCell(ws, META_ROW, COL.EX_RAT,   meta("100",      P.EX_TOTAL));
  setCell(ws, META_ROW, COL.EX_PCT,   meta(`${W.EX}%`, P.EX_TOTAL));

  row = META_ROW + 1;

  // ── Data rows ─────────────────────────────────────────────────────────────
  students.forEach((student, idx) => {
    const isEven   = idx % 2 === 1;
    const rowBg    = isEven ? P.EVEN_BG : P.ODD_BG;
    const gradeRow = (grades && grades[student.id]) || EMPTY_GRADE(woCount, ptCount);
    const maxRow   = (maxScores && maxScores[student.id]) || EMPTY_MAX(woCount, ptCount);

    const wo = calcSection(gradeRow.writtenOutput,    maxRow.writtenOutput,    W.WO);
    const pt = calcSection(gradeRow.performanceTasks, maxRow.performanceTasks, W.PT);

    const exRaw      = normalizeNumber(gradeRow.midtermExam);
    const exMaxVal   = Number(maxRow.midtermExam || 100);
    const exRating   = exRaw !== null ? (exRaw / exMaxVal) * 100 : null;
    const exWeighted = exRating !== null ? exRating * (W.EX / 100) : null;

    const finalGrade = calcFinal(gradeRow, maxRow);
    const letterInfo = getLetterInfo(finalGrade);
    const isPassed   = letterInfo.status === "PASSED";
    const isFailed   = letterInfo.status === "FAILED";

    const R = row;

    // Written Output
    WO_INPUT_COLS.forEach((col, i) => {
      const val = normalizeNumber(gradeRow.writtenOutput[i]);
      setCell(ws, R, col, numCell(val, { fill: P.WO_INPUT, font: F.dark(), alignment: AC, fmt: "0.##" }));
    });
    setCell(ws, R, COL.WO_TOT, numCell(wo.total,    { fill: P.WO_TOTAL, font: F.blue(),   alignment: AC }));
    setCell(ws, R, COL.WO_RAT, numCell(wo.pct,      { fill: P.WO_TOTAL, font: F.blue(),   alignment: AC }));
    setCell(ws, R, COL.WO_PCT, numCell(wo.weighted, { fill: P.WO_TOTAL, font: F.blue(),   alignment: AC }));

    // Performance Tasks
    PT_INPUT_COLS.forEach((col, i) => {
      const val = normalizeNumber(gradeRow.performanceTasks[i]);
      setCell(ws, R, col, numCell(val, { fill: P.PT_INPUT, font: F.dark(), alignment: AC, fmt: "0.##" }));
    });
    const ptFnt = { name: "Arial", sz: 9, bold: true, color: { rgb: "065F46" } };
    setCell(ws, R, COL.PT_TOT, numCell(pt.total,    { fill: P.PT_TOTAL, font: ptFnt, alignment: AC }));
    setCell(ws, R, COL.PT_RAT, numCell(pt.pct,      { fill: P.PT_TOTAL, font: ptFnt, alignment: AC }));
    setCell(ws, R, COL.PT_PCT, numCell(pt.weighted, { fill: P.PT_TOTAL, font: ptFnt, alignment: AC }));

    // Exam
    const exFnt = { name: "Arial", sz: 9, bold: true, color: { rgb: "92400E" } };
    setCell(ws, R, COL.EX_SCORE, numCell(exRaw,      { fill: P.EX_INPUT, font: F.dark(), alignment: AC, fmt: "0.##" }));
    setCell(ws, R, COL.EX_RAT,   numCell(exRating,   { fill: P.EX_TOTAL, font: exFnt,   alignment: AC }));
    setCell(ws, R, COL.EX_PCT,   numCell(exWeighted, { fill: P.EX_TOTAL, font: exFnt,   alignment: AC }));

    // FINAL → EQUIV → STATUS
    setCell(ws, R, COL.FINAL, numCell(finalGrade, { fill: P.FIN_CELL, font: F.violet(), alignment: AC }));
    setCell(ws, R, COL.EQUIV, cell(letterInfo.equivalent, { fill: rowBg, font: F.dark(), alignment: AC, border: border() }));

    const statusFill = isFailed ? P.FAIL_BG : isPassed ? P.PASS_BG : rowBg;
    const statusFont = isFailed
      ? { name: "Arial", sz: 9, bold: true, color: { rgb: "991B1B" } }
      : isPassed
      ? { name: "Arial", sz: 9, bold: true, color: { rgb: "166534" } }
      : F.muted();
    setCell(ws, R, COL.STATUS, cell(letterInfo.status, { fill: statusFill, font: statusFont, alignment: AC, border: border() }));

    // Student + ID
    setCell(ws, R, COL.STUDENT, cell(`${student.lastName}, ${student.firstName}`, {
      fill: rowBg,
      font: { name: "Arial", sz: 9, bold: false, color: { rgb: "0F172A" } },
      alignment: AL,
      border: border(),
    }));
    setCell(ws, R, COL.ID, cell(String(student.studentId), {
      fill: rowBg, font: F.dark(), alignment: AC, border: border(),
    }));

    row++;
  });

  // ── Column widths — built to match the dynamic column count ────────────────
  ws["!cols"] = [
    { wch: 26 }, { wch: 14 },
    ...Array(woCount).fill({ wch: 6 }),
    { wch: 8 }, { wch: 8 }, { wch: 6 },
    ...Array(ptCount).fill({ wch: 6 }),
    { wch: 8 }, { wch: 8 }, { wch: 6 },
    { wch: 8 }, { wch: 8 }, { wch: 6 },
    { wch: 8 }, { wch: 7 }, { wch: 9 },
  ];

  // Row heights: school header rows (8 rows) + encoding header rows + data
  ws["!rows"] = [
    { hpt: 18 }, // Republic of the Philippines
    { hpt: 18 }, // Region IV-B MIMAROPA
    { hpt: 28 }, // BACO COMMUNITY COLLEGE (larger)
    { hpt: 18 }, // Address
    { hpt: 18 }, // Email
    { hpt: 6  }, // Separator
    { hpt: 22 }, // Office of the Registrar
    { hpt: 6  }, // Separator
    // Encoding title block rows:
    { hpt: 28 }, { hpt: 16 }, { hpt: 16 }, { hpt: 8 },
    // Header rows:
    { hpt: 28 }, { hpt: 20 }, { hpt: 18 },
  ];

  ws["!ref"] = `A1:${colLetter(COL.TOTAL_COLS)}${row - 1}`;
  return ws;
}

// ─── Build Grading Report sheet ───────────────────────────────────────────────
// (Unaffected by dynamic WO/PT column counts — this sheet only shows summary
// grades, not individual activity items.)
function buildReportSheet(ws, { students, midtermGradesMap, finalGradesMap, midtermMaxMap, finalMaxMap, courseName, columnCounts }) {
  const woCount = columnCounts?.writtenOutput    ?? DEFAULT_COLUMN_COUNTS.writtenOutput;
  const ptCount = columnCounts?.performanceTasks ?? DEFAULT_COLUMN_COUNTS.performanceTasks;

  const COLS_RPT = {
    NUM: 1, NAME: 2, ID: 3,
    MG: 4, TFG: 5, FG: 6, NE: 7, REMARKS: 8,
    TOTAL: 8,
  };

  // ── School letterhead first ────────────────────────────────────────────
  let row = buildSchoolHeader(ws, COLS_RPT.TOTAL);

  // ── Title block ───────────────────────────────────────────────────────────
  const rptTitleStyle = { fill: P.RPT_HDR, font: F.white(12), alignment: AL, border: border() };
  const rptSubStyle   = { fill: P.META_BG, font: F.subtitle(), alignment: AL, border: border() };

  setCell(ws, row, 1, cell("GRADING REPORT", rptTitleStyle));
  for (let c = 2; c <= COLS_RPT.TOTAL; c++) setCell(ws, row, c, cell("", { fill: P.RPT_HDR, border: border() }));
  merge(ws, row, 1, row, COLS_RPT.TOTAL);
  row++;

  setCell(ws, row, 1, cell(`Course: ${courseName}`, rptSubStyle));
  for (let c = 2; c <= COLS_RPT.TOTAL; c++) setCell(ws, row, c, cell("", { fill: P.META_BG, border: border() }));
  merge(ws, row, 1, row, COLS_RPT.TOTAL);
  row++;

  setCell(ws, row, 1, cell(`Generated: ${new Date().toLocaleString()}`, rptSubStyle));
  for (let c = 2; c <= COLS_RPT.TOTAL; c++) setCell(ws, row, c, cell("", { fill: P.META_BG, border: border() }));
  merge(ws, row, 1, row, COLS_RPT.TOTAL);
  row++;

  for (let c = 1; c <= COLS_RPT.TOTAL; c++) setCell(ws, row, c, cell("", { border: border() }));
  row++;

  // ── Header ────────────────────────────────────────────────────────────────
  const HDR = row;
  const hdrStyle = (label) => cell(label, {
    fill: P.RPT_HDR,
    font: F.white(9),
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: border("medium"),
  });

  setCell(ws, HDR, COLS_RPT.NUM,     hdrStyle("#"));
  setCell(ws, HDR, COLS_RPT.NAME,    hdrStyle("STUDENT NAME\n(Last Name, First Name Middle Name)"));
  setCell(ws, HDR, COLS_RPT.ID,      hdrStyle("I.D. Number"));
  setCell(ws, HDR, COLS_RPT.MG,      hdrStyle("Midterm Grade"));
  setCell(ws, HDR, COLS_RPT.TFG,     hdrStyle("Tentative Final Grade"));
  setCell(ws, HDR, COLS_RPT.FG,      hdrStyle("Final Grade\n(MG + TFG)/2"));
  setCell(ws, HDR, COLS_RPT.NE,      hdrStyle("Numerical Equivalent"));
  setCell(ws, HDR, COLS_RPT.REMARKS, hdrStyle("Remarks"));
  row++;

  // ── Data rows ─────────────────────────────────────────────────────────────
  students.forEach((student, idx) => {
    const isEven = idx % 2 === 1;
    const R = row;

    const mGrade = (midtermGradesMap && midtermGradesMap[student.id]) || EMPTY_GRADE(woCount, ptCount);
    const mMax   = (midtermMaxMap    && midtermMaxMap[student.id])    || EMPTY_MAX(woCount, ptCount);
    const fGrade = (finalGradesMap   && finalGradesMap[student.id])   || EMPTY_GRADE(woCount, ptCount);
    const fMax   = (finalMaxMap      && finalMaxMap[student.id])      || EMPTY_MAX(woCount, ptCount);

    const midtermFinal   = calcFinal(mGrade, mMax);
    const tentativeFinal = calcFinal(fGrade, fMax);

    const combined =
      midtermFinal !== null && tentativeFinal !== null
        ? Number(((midtermFinal + tentativeFinal) / 2).toFixed(2))
        : null;

    const numEquiv = combined !== null
      ? LETTER_SCALE.find((r) => combined >= r.min)?.equivalent ?? "5.00"
      : null;

    const isPassed = numEquiv !== null && parseFloat(numEquiv) <= 4;
    const isFailed = numEquiv !== null && parseFloat(numEquiv) > 4;

    const rowBg = isEven ? P.RPT_EVEN : P.RPT_ODD;
    const fgBg  = isFailed ? P.RPT_FAIL : rowBg;

    const baseFnt = F.dark(9);
    const failFnt = { name: "Arial", sz: 9, bold: true, color: { rgb: "DC2626" } };

    setCell(ws, R, COLS_RPT.NUM,  cell(String(idx + 1), { fill: rowBg, font: F.muted(9), alignment: AC, border: border() }));
    setCell(ws, R, COLS_RPT.NAME, cell(`${student.lastName}, ${student.firstName}`.toUpperCase(), {
      fill: rowBg, font: F.darkBold(9), alignment: AL, border: border(),
    }));
    setCell(ws, R, COLS_RPT.ID,  cell(String(student.studentId), { fill: rowBg, font: baseFnt, alignment: AC, border: border() }));
    setCell(ws, R, COLS_RPT.MG,  numCell(midtermFinal,   { fill: rowBg, font: baseFnt, alignment: AC, fmt: "0" }));
    setCell(ws, R, COLS_RPT.TFG, numCell(tentativeFinal, { fill: rowBg, font: baseFnt, alignment: AC, fmt: "0" }));
    setCell(ws, R, COLS_RPT.FG,  numCell(combined,       { fill: fgBg,  font: isFailed ? failFnt : F.darkBold(9), alignment: AC, fmt: "0" }));
    setCell(ws, R, COLS_RPT.NE,  numCell(numEquiv !== null ? parseFloat(numEquiv) : null, {
      fill: fgBg, font: isFailed ? failFnt : baseFnt, alignment: AC, fmt: "0.00",
    }));

    const statusFill = isFailed ? P.FAIL_BG : isPassed ? P.PASS_BG : rowBg;
    const statusFnt  = isFailed
      ? { name: "Arial", sz: 9, bold: true, color: { rgb: "991B1B" } }
      : isPassed
      ? { name: "Arial", sz: 9, bold: true, color: { rgb: "166534" } }
      : F.muted();
    setCell(ws, R, COLS_RPT.REMARKS, cell(
      numEquiv !== null ? (isPassed ? "PASSED" : "FAILED") : "-",
      { fill: statusFill, font: statusFnt, alignment: AC, border: border() },
    ));

    row++;
  });

  ws["!cols"] = [
    { wch: 5  },
    { wch: 36 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 12 },
  ];

  ws["!rows"] = [
    { hpt: 18 }, // Republic of the Philippines
    { hpt: 18 }, // Region IV-B MIMAROPA
    { hpt: 28 }, // BACO COMMUNITY COLLEGE
    { hpt: 18 }, // Address
    { hpt: 18 }, // Email
    { hpt: 6  }, // Separator
    { hpt: 22 }, // Office of the Registrar
    { hpt: 6  }, // Separator
    // Report title block:
    { hpt: 28 }, { hpt: 16 }, { hpt: 16 }, { hpt: 8 }, { hpt: 36 },
  ];

  ws["!ref"] = `A1:${colLetter(COLS_RPT.TOTAL)}${row - 1}`;
  return ws;
}

// ─── Main export function ─────────────────────────────────────────────────────
/**
 * @param {Object} params
 * @param {string}   params.courseName
 * @param {Array}    params.students
 * @param {Object}   params.gradesMap         — { midterm: {[id]: gradeRow}, final: {[id]: gradeRow} }
 * @param {Object}   params.maxScoresMap      — { midterm: {[id]: maxRow},  final: {[id]: maxRow}  }
 * @param {Object}   params.activityMeta
 * @param {string}   [params.mode]            — "midterm" | "final" | "all" (default: "all")
 * @param {Object}   [params.columnCounts]    — { writtenOutput, performanceTasks } — NEW.
 *   Pass the same counts the grading UI is currently showing so the exported
 *   sheet's columns line up with what's on screen. Defaults to 12/12 if omitted.
 */
export async function exportGradeEncoding({
  courseName = "Course",
  students = [],
  gradesMap = {},
  maxScoresMap = {},
  activityMeta = null,
  mode = "all",
  columnCounts = DEFAULT_COLUMN_COUNTS,
}) {
  const wb = { SheetNames: [], Sheets: {} };

  const addSheet = (name, ws) => {
    wb.SheetNames.push(name);
    wb.Sheets[name] = ws;
  };

  if (mode === "all" || mode === "midterm") {
    const ws = {};
    buildEncodingSheet(ws, {
      period: "midterm",
      students,
      grades:    gradesMap["midterm"]    || {},
      maxScores: maxScoresMap["midterm"] || {},
      activityMeta,
      courseName,
      columnCounts,
    });
    addSheet("Midterm Encoding", ws);
  }

  if (mode === "all" || mode === "final") {
    const ws = {};
    buildEncodingSheet(ws, {
      period: "final",
      students,
      grades:    gradesMap["final"]    || {},
      maxScores: maxScoresMap["final"] || {},
      activityMeta,
      courseName,
      columnCounts,
    });
    addSheet("Final Encoding", ws);
  }

  if (mode === "all" || mode === "report") {
    const ws = {};
    buildReportSheet(ws, {
      students,
      midtermGradesMap: gradesMap["midterm"]    || {},
      finalGradesMap:   gradesMap["final"]      || {},
      midtermMaxMap:    maxScoresMap["midterm"] || {},
      finalMaxMap:      maxScoresMap["final"]   || {},
      courseName,
      columnCounts,
    });
    addSheet("Grading Report", ws);
  }

  const safeName = courseName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
  const fileName = `Grade_${safeName}_${Date.now()}.xlsx`;

  // ── xlsx-js-style handles styles natively — no fallback needed ─────────
  const wbout = XLSXStyle.write(wb, { bookType: "xlsx", type: "binary" });
  const buf   = new ArrayBuffer(wbout.length);
  const view  = new Uint8Array(buf);
  for (let i = 0; i < wbout.length; i++) view[i] = wbout.charCodeAt(i) & 0xff;
  saveAs(new Blob([buf], { type: "application/octet-stream" }), fileName);
}