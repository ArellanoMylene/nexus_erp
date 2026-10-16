import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx-js-style";
import { unzipSync, zipSync } from "fflate";
import { Download, Save, Upload, Award } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const SHEET_LABEL = "bcc_grading_sheet";
const QUIZ_COUNT = 3;
const COMPONENTS = [
  { key: "performance", title: "Performance", weight: 10, type: "quiz", max: 100 },
  { key: "attendance", title: "Attendance", weight: 10, type: "attendance", max: 100 },
  { key: "project", title: "Project", weight: 10, type: "project", max: 100 },
  { key: "prelim", title: "Prelim Exam", weight: 20, type: "exam", max: 60 },
  { key: "midterm", title: "Midterm Exam", weight: 20, type: "exam", max: 20 },
  { key: "finals", title: "Finals Exam", weight: 20, type: "exam", max: 60 },
];
const QUIZ_WEIGHT = 10;
const DEFAULT_MAX_SCORES = { quizzes: [10, 10, 10], performance: 100, attendance: 100, project: 100, prelim: 60, midterm: 20, finals: 60 };
const EMPTY_ROW = () => ({ quizzes: Array(QUIZ_COUNT).fill(""), performance: "", attendance: "", project: "", prelim: "", midterm: "", finals: "" });
const parseScore = (value) => value === "" || value === null || value === undefined || !Number.isFinite(Number(value)) ? null : Number(value);
const transmuted = (score, max) => score === null || !max ? null : Math.min(100, 30 + (70 * score / max));
const percentageRating = (score, max) => score === null || Number(max) <= 0 ? null : Math.min(100, score / Number(max) * 100);

function getGrade(row, maxScores) {
  const quizTotal = row.quizzes.reduce((sum, value) => sum + (parseScore(value) ?? 0), 0);
  const quizMax = maxScores.quizzes.reduce((sum, value) => sum + (Number(value) || 0), 0);
  const quizEntered = row.quizzes.some((value) => parseScore(value) !== null);
  const quizRating = quizEntered ? transmuted(quizTotal, quizMax) : null;
  const parts = [
    quizRating === null ? null : quizRating * QUIZ_WEIGHT / 100,
    ...COMPONENTS.map(({ key, weight, type }) => {
      const score = parseScore(row[key]);
      if (score === null) return null;
      const rating = type === "exam" ? transmuted(score, Number(maxScores[key])) : percentageRating(score, maxScores[key]);
      return Number.isFinite(rating) ? rating * weight / 100 : null;
    }),
  ];
  const total = parts.reduce((sum, value) => sum + (value ?? 0), 0);
  const complete = parts.every((value) => value !== null);
  const grade = complete ? Number(total.toFixed(2)) : null;
  let equivalent = "-";
  if (grade !== null) {
    if (grade >= 96.5) equivalent = "1.00";
    else if (grade >= 93.5) equivalent = "1.25";
    else if (grade >= 90.5) equivalent = "1.50";
    else if (grade >= 87.5) equivalent = "1.75";
    else if (grade >= 84.5) equivalent = "2.00";
    else if (grade >= 81.5) equivalent = "2.25";
    else if (grade >= 78.5) equivalent = "2.50";
    else if (grade >= 75.5) equivalent = "2.75";
    else if (grade >= 75) equivalent = "3.00";
    else equivalent = "5.00";
  }
  return { quizRating, total: grade, equivalent, remarks: grade === null ? "-" : grade >= 75 ? "PASSED" : "FAILED" };
}

const entryName = (key, index) => key === "quizzes" ? `BCC Quiz / Activity ${index + 1}` : `BCC ${COMPONENTS.find((component) => component.key === key)?.title || key}`;
const entryType = (key) => key === "quizzes" ? "assignment" : COMPONENTS.find((component) => component.key === key)?.type;
const normalizeDepartmentName = (name) => String(name || "").trim().toUpperCase().replace(/\s+/g, " ");
const coordinatorLabelFor = (departmentName) => {
  const name = normalizeDepartmentName(departmentName);
  if (name.includes("PUBLIC ADMINISTRATION") || name === "BPA") return "BPA Coordinator";
  if (name.includes("ARTS IN HISTORY") || name === "BAHISTO") return "BAHISTO Coordinator";
  if (name.includes("TECHNICAL VOCATIONAL TEACHER EDUCATION")) return "BTVTED Coordinator";
  if (name.includes("LIBRARY")) return "Library Coordinator";
  return name ? `${departmentName} Coordinator` : "Program Coordinator";
};
const BCC_COMPONENT_NAMES = new Set([
  ...Array.from({ length: QUIZ_COUNT }, (_, index) => entryName("quizzes", index)),
  ...COMPONENTS.map(({ key }) => entryName(key, 0)),
]);
const isBccGradeEntry = (entry) => entry?.label === SHEET_LABEL || BCC_COMPONENT_NAMES.has(String(entry?.component_name || ""));

const encodeXml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]);

function shiftFormulaRows(formula, firstRow, count) {
  return formula.replace(/(^|[^A-Z0-9_])(\$?[A-Z]{1,3}\$?)(\d+)\b/g, (match, boundary, column, row) => {
    const rowNumber = Number(row);
    return `${boundary}${column}${rowNumber >= firstRow ? rowNumber + count : rowNumber}`;
  });
}

function shiftWorksheetRows(xml, firstRow, count) {
  if (!count) return xml;
  let shifted = xml
    .replace(/(<row\b[^>]*\br=")(\d+)(")/g, (match, before, row, after) => `${before}${Number(row) >= firstRow ? Number(row) + count : row}${after}`)
    .replace(/(<c\b[^>]*\br="[A-Z]{1,3})(\d+)(")/g, (match, before, row, after) => `${before}${Number(row) >= firstRow ? Number(row) + count : row}${after}`)
    .replace(/\b(ref|sqref)="([^"]+)"/g, (match, attribute, refs) => {
      const adjusted = refs.replace(/(\$?[A-Z]{1,3}\$?)(\d+)\b/g, (cellRef, column, row) => {
        const rowNumber = Number(row);
        return `${column}${rowNumber >= firstRow ? rowNumber + count : rowNumber}`;
      });
      return `${attribute}="${adjusted}"`;
    });
  shifted = shifted.replace(/(<f\b[^>]*>)([\s\S]*?)(<\/f>)/g, (match, open, formula, close) => `${open}${shiftFormulaRows(formula, firstRow, count)}${close}`);
  return shifted;
}

function cloneWorksheetRow(rowXml, sourceRow, targetRow, formulaSourceRow, formulaTargetRow) {
  return rowXml
    .replace(/(<row\b[^>]*\br=")(\d+)(")/, `$1${targetRow}$3`)
    .replace(/(<c\b[^>]*\br="[A-Z]{1,3})(\d+)(")/g, (match, before, row, after) => `${before}${Number(row) === sourceRow ? targetRow : row}${after}`)
    .replace(/(<f\b[^>]*>)([\s\S]*?)(<\/f>)/g, (match, open, formula, close) => {
      const translated = formula.replace(/(^|[^A-Z0-9_])(\$?[A-Z]{1,3}\$?)(\d+)\b/g, (ref, boundary, column, row) => `${boundary}${column}${Number(row) === formulaSourceRow ? formulaTargetRow : row}`);
      return `${open}${translated}${close}`;
    });
}

function insertWorksheetRows(xml, firstRow, count, sourceRow, formulaSourceRow, formulaTargetStart) {
  if (!count) return xml;
  const sourceMatch = xml.match(new RegExp(`<row\\b(?=[^>]*\\br="${sourceRow}")[^>]*>[\\s\\S]*?</row>`));
  if (!sourceMatch) throw new Error(`Template row ${sourceRow} could not be copied.`);
  const clones = Array.from({ length: count }, (_, index) => cloneWorksheetRow(
    sourceMatch[0], sourceRow, firstRow + index, formulaSourceRow, formulaTargetStart + index,
  )).join("");
  const shifted = shiftWorksheetRows(xml, firstRow, count);
  return shifted.replace(/<sheetData>([\s\S]*?)<\/sheetData>/, (whole, rowsXml) => {
    const insertBeforeRow = firstRow + count;
    const nextRow = new RegExp(`<row\\b(?=[^>]*\\br="${insertBeforeRow}")[^>]*>`);
    return nextRow.test(rowsXml)
      ? whole.replace(rowsXml, rowsXml.replace(nextRow, `${clones}$&`))
      : whole.replace(rowsXml, `${rowsXml}${clones}`);
  });
}

function setWorksheetCell(xml, address, value) {
  const column = address.match(/^[A-Z]+/)?.[0];
  const row = address.match(/\d+$/)?.[0];
  const type = typeof value === "number" ? "n" : "inlineStr";
  const contents = type === "n"
    ? `<v>${value}</v>`
    : value === "" || value === null || value === undefined ? "" : `<is><t xml:space="preserve">${encodeXml(value)}</t></is>`;
  const cell = new RegExp(`<c\\b([^>]*\\br="${address}"[^>]*?)(?:\\s*/>|>([\\s\\S]*?)</c>)`);
  const match = xml.match(cell);
  if (match) {
    const attrs = match[1].replace(/\s+t="[^"]*"/g, "");
    return xml.replace(cell, () => `<c${attrs}${type === "inlineStr" && contents ? ` t="inlineStr"` : type === "n" ? ` t="n"` : ""}>${contents}</c>`);
  }
  const newCell = `<c r="${address}"${type === "inlineStr" && contents ? ` t="inlineStr"` : type === "n" ? ` t="n"` : ""}>${contents}</c>`;
  const rowPattern = new RegExp(`(<row\\b(?=[^>]*\\br="${row}")[^>]*>)([\\s\\S]*?)(</row>)`);
  return xml.replace(rowPattern, (whole, open, cells, close) => {
    const columnNumber = (letters) => [...letters].reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0);
    const laterCell = new RegExp(`<c\\b[^>]*\\br="([A-Z]{1,3})${row}"`);
    const cellMatch = cells.match(laterCell);
    if (cellMatch && columnNumber(cellMatch[1]) > columnNumber(column)) {
      const position = cells.indexOf(cellMatch[0]);
      return `${open}${cells.slice(0, position)}${newCell}${cells.slice(position)}${close}`;
    }
    return `${open}${cells}${newCell}${close}`;
  });
}

function setWorksheetFormula(xml, address, formula, cachedValue = 0) {
  const cell = new RegExp(`<c\\b([^>]*\\br="${address}"[^>]*?)(?:\\s*/>|>([\\s\\S]*?)</c>)`);
  const match = xml.match(cell);
  if (!match) throw new Error(`Template cell ${address} could not be found.`);
  const attrs = match[1].replace(/\s+t="[^"]*"/g, "");
  const resultType = typeof cachedValue === "string" ? ' t="str"' : "";
  // Excel requires t="str" when a formula's cached result is text. Numeric
  // formula cells omit the type, matching the source BCC template.
  // Use a callback so JavaScript does not interpret formula tokens such as
  // $G$13 as replacement-string references like $1.
  return xml.replace(cell, () => `<c${attrs}${resultType}><f>${encodeXml(formula)}</f><v>${encodeXml(cachedValue)}</v></c>`);
}

function setStudentColumnWidths(xml, students) {
  const longestText = (values) => values.reduce((longest, value) => Math.max(longest, String(value ?? "").trim().length), 0);
  const studentIdWidth = Math.max(10, longestText(students.map((student) => student.studentId)) + 2);
  const studentNameWidth = Math.max(48 - studentIdWidth, longestText(students.map((student) => `${student.lastName}, ${student.firstName}`)) + 2);
  const setWidth = (worksheetXml, column, width) => {
    const pattern = new RegExp(`<col\\b(?=[^>]*\\bmin="${column}")(?=[^>]*\\bmax="${column}")[^>]*/>`);
    return worksheetXml.replace(pattern, (col) => col
      .replace(/\bwidth="[^"]*"/, `width="${width.toFixed(2)}"`)
      .replace(/\s+bestFit="[^"]*"/g, ""));
  };
  return setWidth(setWidth(xml, 1, studentIdWidth), 2, studentNameWidth);
}

function updateBccHeader(files, headerBytes) {
  [1, 2].forEach((index) => {
    const relationshipPath = `xl/drawings/_rels/drawing${index}.xml.rels`;
    const relationshipXml = new TextDecoder().decode(files[relationshipPath])
      .replace(/Target="\.\.\/media\/[^\"]+"/g, 'Target="../media/bccheader.jpg"');
    files[relationshipPath] = new TextEncoder().encode(relationshipXml);
  });
  files["xl/media/bccheader.jpg"] = headerBytes;
  let types = new TextDecoder().decode(files["[Content_Types].xml"]);
  if (!types.includes('Extension="jpg"')) types = types.replace("</Types>", '<Default Extension="jpg" ContentType="image/jpeg"/></Types>');
  files["[Content_Types].xml"] = new TextEncoder().encode(types);
}

export default function BCCGradeEncoding() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [periodLabel, setPeriodLabel] = useState("");
  const [rows, setRows] = useState({});
  const [entryIds, setEntryIds] = useState({});
  const [locked, setLocked] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [maxScores, setMaxScores] = useState(DEFAULT_MAX_SCORES);
  const savingRowsRef = useRef(new Set());

  useEffect(() => {
    if (!courseId || !periodId) return;
    try {
      const saved = JSON.parse(localStorage.getItem(`bcc-grade-max:${courseId}:${periodId}`) || "null");
      setMaxScores(saved?.quizzes?.length === QUIZ_COUNT ? { ...DEFAULT_MAX_SCORES, ...saved } : DEFAULT_MAX_SCORES);
    } catch { setMaxScores(DEFAULT_MAX_SCORES); }
  }, [courseId, periodId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const facultyUserId = localStorage.getItem("userId") || localStorage.getItem("user_id") || sessionStorage.getItem("userId");
        const [assignmentResponse, enrollmentResponse, periodResponse, departmentResponse] = await Promise.all([
          facultyUserId ? axios.get(`${API_BASE}/api/faculty-assignments/faculty/${facultyUserId}`) : Promise.resolve({ data: { data: [] } }),
          axios.get(`${API_BASE}/api/enrollments`),
          axios.get(`${API_BASE}/api/academic-periods/active`).catch(() => ({ data: null })),
          axios.get(`${API_BASE}/api/dept/departments`).catch(() => ({ data: [] })),
        ]);
        const list = Array.isArray(assignmentResponse.data) ? assignmentResponse.data : assignmentResponse.data?.data || [];
        const active = periodResponse.data?.period || periodResponse.data || null;
        const activePeriodId = String(active?.period_id ?? active?.id ?? active?.periodId ?? "");
        const currentAssignments = list.filter((item) => !activePeriodId || String(item.academic_period_id) === activePeriodId);
        const departments = Array.isArray(departmentResponse.data)
          ? departmentResponse.data
          : departmentResponse.data?.data || [];
        const departmentById = new Map(departments.map((department) => [
          String(department.id ?? department.department_id),
          department,
        ]));
        const departmentByName = new Map(departments.map((department) => [
          normalizeDepartmentName(department.name),
          department,
        ]));
        const periodInfo = active || currentAssignments[0] || {};
        const semester = String(periodInfo.semester || "").toUpperCase();
        const schoolYear = periodInfo.school_year || "";
        setPeriodLabel([semester, schoolYear ? `F.Y. ${schoolYear}` : ""].filter(Boolean).join(" "));
        const assignmentSections = new Map();
        currentAssignments.forEach((item) => {
          const id = String(item.course_id);
          if (!assignmentSections.has(id)) assignmentSections.set(id, new Set());
          assignmentSections.get(id).add(String(item.section || ""));
        });
        const coursesById = new Map();
        currentAssignments.forEach((item) => {
          const id = String(item.course_id);
          if (!coursesById.has(id)) {
            const department = departmentById.get(String(item.department_id))
              || departmentByName.get(normalizeDepartmentName(item.department_name));
            coursesById.set(id, {
              id: item.course_id,
              code: item.course_code || "Course",
              title: item.course_title || "",
              facultyName: item.faculty_name || [item.first_name, item.last_name].filter(Boolean).join(" "),
              departmentId: item.department_id,
              departmentName: department?.name || item.department_name || "",
              departmentHeadName: department ? (department.head || "") : (item.department_head_name || ""),
              sections: [],
            });
          }
          const course = coursesById.get(id);
          if (item.section && !course.sections.includes(String(item.section))) course.sections.push(String(item.section));
        });
        const courseList = [...coursesById.values()].map((course) => ({
          ...course,
          label: `${course.code} - ${course.title}${course.sections?.length ? ` (Section ${course.sections.join(", ")})` : ""}`,
        }));
        setCourses(courseList);
        const savedCourseId = localStorage.getItem(`bcc-grade-course:${activePeriodId}`);
        const initialCourseId = savedCourseId && courseList.some((course) => String(course.id) === savedCourseId)
          ? savedCourseId
          : String(courseList[0]?.id ?? "");
        setCourseId(initialCourseId);
        if (initialCourseId) localStorage.setItem(`bcc-grade-course:${activePeriodId}`, initialCourseId);
        const enrollmentList = Array.isArray(enrollmentResponse.data) ? enrollmentResponse.data : enrollmentResponse.data?.data || [];
        const enrolled = enrollmentList.map((item, index) => ({
          userId: item.student_id || item.user_id,
          id: item.enrollment_id || item.student_id || item.user_id || index,
          studentId: item.student_number || item.student_id || item.user_id || "",
          firstName: item.first_name || item.student_name?.split(" ")?.[0] || item.name?.split(" ")?.[0] || "",
          lastName: item.last_name || item.student_name?.split(" ")?.slice(1).join(" ") || item.name?.split(" ")?.slice(1).join(" ") || "",
          courseId: item.course_id,
          periodId: item.period_id || item.academic_period_id,
          section: item.section_name || item.section || "",
          sectionId: item.section_id || null,
        }));
        setStudents(enrolled.filter((student) => {
          const sections = assignmentSections.get(String(student.courseId));
          return sections && (!activePeriodId || String(student.periodId) === activePeriodId) && sections.has(String(student.section));
        }));
        setPeriodId(String(active?.period_id ?? active?.id ?? active?.periodId ?? ""));
      } catch (error) {
        console.error("Unable to load faculty grading data", error);
        toast.error("Unable to load courses and students.");
      } finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!courseId || !periodId || !students.length) { setRows({}); setEntryIds({}); setLocked({}); return; }
    let cancelled = false;
    const loadEntries = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE}/api/grade-entries`, { params: { course_id: courseId, period_id: periodId } });
        const entries = response.data?.data || [];
        const current = entries.filter(isBccGradeEntry);
        const nextRows = {};
        const nextIds = {};
        const nextLocks = {};
        const studentByUserId = new Map(students.map((student) => [String(student.userId), student]));
        current.forEach((entry) => {
          const student = studentByUserId.get(String(entry.student_id));
          if (!student) return;
          const row = nextRows[student.id] || EMPTY_ROW();
          const quizMatch = String(entry.component_name).match(/^BCC Quiz \/ Activity (\d+)$/i);
          if (quizMatch) {
            const index = Number(quizMatch[1]) - 1;
            if (index >= 0 && index < QUIZ_COUNT) row.quizzes[index] = entry.raw_score ?? "";
            if (index >= 0 && index < QUIZ_COUNT && Number(entry.max_score) > 0) {
              setMaxScores((prev) => ({ ...prev, quizzes: prev.quizzes.map((value, i) => i === index ? Number(entry.max_score) : value) }));
            }
          } else {
            const component = COMPONENTS.find((item) => entry.component_name === `BCC ${item.title}`);
            if (component) {
              row[component.key] = entry.raw_score ?? "";
              if (Number(entry.max_score) > 0) setMaxScores((prev) => ({ ...prev, [component.key]: Number(entry.max_score) }));
            }
          }
          nextRows[student.id] = row;
          const key = `${student.id}:${entry.component_name}`;
          nextIds[key] = entry.entry_id;
          if (entry.is_locked) nextLocks[key] = true;
        });
        if (!cancelled) { setRows(nextRows); setEntryIds(nextIds); setLocked(nextLocks); }
      } catch (error) {
        console.error("Unable to load saved BCC grade entries", error);
        toast.error("Unable to load saved grades.");
      } finally { if (!cancelled) setLoading(false); }
    };
    loadEntries();
    return () => { cancelled = true; };
  }, [courseId, periodId, students]);

  const visibleStudents = useMemo(() => courseId ? students.filter((student) => String(student.courseId) === String(courseId) && `${student.firstName} ${student.lastName} ${student.studentId}`.toLowerCase().includes(search.toLowerCase())) : [], [students, courseId, search]);
  const updateRow = (studentId, key, index, value) => setRows((prev) => {
    const row = { ...(prev[studentId] || EMPTY_ROW()) };
    if (key === "quizzes") { row.quizzes = [...row.quizzes]; row.quizzes[index] = value; }
    else row[key] = value;
    return { ...prev, [studentId]: row };
  });
  const updateMax = (key, index, value) => setMaxScores((prev) => {
    const next = key === "quizzes"
      ? { ...prev, quizzes: prev.quizzes.map((max, i) => i === index ? (value === "" ? "" : Math.max(1, Number(value))) : max) }
      : { ...prev, [key]: value === "" ? "" : Math.max(1, Number(value)) };
    if (courseId && periodId) localStorage.setItem(`bcc-grade-max:${courseId}:${periodId}`, JSON.stringify(next));
    return next;
  });

  const saveStudentRow = async (student) => {
    if (!courseId || !periodId) { toast.warning("Select a course and make sure an academic period is active."); return false; }
    const facultyId = Number(localStorage.getItem("userId") || localStorage.getItem("user_id") || 0);
    if (!facultyId) { toast.warning("Faculty account not detected. Please log in again."); return false; }
    if (savingRowsRef.current.has(student.id)) return false;
    savingRowsRef.current.add(student.id);
    try {
      const row = rows[student.id] || EMPTY_ROW();
      const entries = [
        ...row.quizzes.map((score, index) => ({ key: "quizzes", index, score, max: maxScores.quizzes[index], weight: QUIZ_WEIGHT / QUIZ_COUNT })),
        ...COMPONENTS.map(({ key, weight }) => ({ key, index: null, score: row[key], max: maxScores[key], weight })),
      ];
      const operations = [];
      entries.forEach(({ key, index, score, max, weight }) => {
        const name = entryName(key, index ?? 0);
        const idKey = `${student.id}:${name}`;
        if (locked[idKey]) return;
        const rawScore = parseScore(score);
        if (rawScore === null) {
          if (entryIds[idKey]) operations.push({ promise: axios.delete(`${API_BASE}/api/grade-entries/${entryIds[idKey]}`), componentName: name, delete: true });
          return;
        }
        const payload = {
          student_id: student.userId, course_id: Number(courseId), section_id: student.sectionId,
          period_id: Number(periodId), component_name: name, component_type: entryType(key),
          raw_score: rawScore, max_score: Number(max) || 100, weight, submitted_by: facultyId,
        };
        operations.push({
          promise: entryIds[idKey]
            ? axios.put(`${API_BASE}/api/grade-entries/${entryIds[idKey]}`, payload)
            : axios.post(`${API_BASE}/api/grade-entries`, payload),
          componentName: name, rawScore,
        });
      });
      if (!operations.length) return true;
      const results = await Promise.allSettled(operations.map(({ promise }) => promise));
      const refresh = await axios.get(`${API_BASE}/api/grade-entries`, { params: { course_id: courseId, period_id: periodId } });
      const saved = (refresh.data?.data || []).filter(isBccGradeEntry);
      const studentEntries = saved.filter((entry) => String(entry.student_id) === String(student.userId));
      const savedByComponent = new Map(studentEntries.map((entry) => [entry.component_name, entry]));
      const failed = results.some((result) => result.status === "rejected" || result.value?.data?.success === false);
      const mismatches = operations.filter((operation) => {
        const stored = savedByComponent.get(operation.componentName);
        return operation.delete ? Boolean(stored) : !stored || Number(stored.raw_score) !== operation.rawScore;
      });
      const idPrefix = `${student.id}:`;
      setEntryIds((previous) => {
        const next = Object.fromEntries(Object.entries(previous).filter(([key]) => !key.startsWith(idPrefix)));
        studentEntries.forEach((entry) => { next[`${student.id}:${entry.component_name}`] = entry.entry_id; });
        return next;
      });
      setLocked((previous) => {
        const next = Object.fromEntries(Object.entries(previous).filter(([key]) => !key.startsWith(idPrefix)));
        studentEntries.filter((entry) => entry.is_locked).forEach((entry) => { next[`${student.id}:${entry.component_name}`] = true; });
        return next;
      });
      if (failed || mismatches.length) {
        const failedResult = results.find((result) => result.status === "rejected" || result.value?.data?.success === false);
        const detail = failedResult?.reason?.response?.data?.message
          || failedResult?.reason?.response?.data?.error
          || failedResult?.reason?.message
          || failedResult?.value?.data?.message
          || failedResult?.value?.data?.error;
        const mismatchNames = mismatches.map((operation) => operation.componentName).join(", ");
        toast.error(`Could not confirm all grades for ${student.studentId || student.firstName}.${detail ? ` ${detail}` : mismatchNames ? ` Not confirmed: ${mismatchNames}.` : ""} Your inputs are still on screen; press Enter to retry.`);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Unable to save student grades", error);
      toast.error(error.response?.data?.error || error.response?.data?.message || "Could not save this student's grades. Your inputs are still on screen; press Enter to retry.");
      return false;
    } finally {
      savingRowsRef.current.delete(student.id);
    }
  };

  const save = async () => {
    if (!courseId || !periodId) { toast.warning("Select a course and make sure an academic period is active."); return; }
    const facultyId = Number(localStorage.getItem("userId") || localStorage.getItem("user_id") || 0);
    if (!facultyId) { toast.warning("Faculty account not detected. Please log in again."); return; }
    setLoading(true);
    try {
      const operations = [];
      visibleStudents.forEach((student) => {
        if (!student.userId) return;
        const row = rows[student.id] || EMPTY_ROW();
        const entries = [
          ...row.quizzes.map((score, index) => ({ key: "quizzes", index, score, max: maxScores.quizzes[index], weight: QUIZ_WEIGHT / QUIZ_COUNT })),
          ...COMPONENTS.map(({ key, weight }) => ({ key, index: null, score: row[key], max: maxScores[key], weight })),
        ];
        entries.forEach(({ key, index, score, max, weight }) => {
          const name = entryName(key, index ?? 0);
          const idKey = `${student.id}:${name}`;
          if (locked[idKey]) return;
          const rawScore = parseScore(score);
          if (rawScore === null) {
            if (entryIds[idKey]) operations.push({ promise: axios.delete(`${API_BASE}/api/grade-entries/${entryIds[idKey]}`), studentId: student.userId, componentName: name, delete: true });
            return;
          }
          const payload = {
            student_id: student.userId, course_id: Number(courseId), section_id: student.sectionId,
            period_id: Number(periodId),
            component_name: name, component_type: entryType(key), raw_score: rawScore,
            max_score: Number(max) || 100, weight, submitted_by: facultyId,
          };
          operations.push({
            promise: entryIds[idKey]
              ? axios.put(`${API_BASE}/api/grade-entries/${entryIds[idKey]}`, payload)
              : axios.post(`${API_BASE}/api/grade-entries`, payload),
            studentId: student.userId, componentName: name, rawScore,
          });
        });
      });
      if (!operations.length) {
        toast.info("No grade changes to save.");
        return;
      }
      const results = await Promise.allSettled(operations.map((operation) => operation.promise));
      const failed = results.filter((result) => result.status === "rejected" || result.value?.data?.success === false);
      const successfulCount = results.length - failed.length;
      const refresh = await axios.get(`${API_BASE}/api/grade-entries`, { params: { course_id: courseId, period_id: periodId } });
      const saved = (refresh.data?.data || []).filter(isBccGradeEntry);
      const savedByStudentAndComponent = new Map(saved.map((entry) => [`${entry.student_id}:${entry.component_name}`, entry]));
      const mismatches = operations.filter((operation) => {
        const stored = savedByStudentAndComponent.get(`${operation.studentId}:${operation.componentName}`);
        return operation.delete ? Boolean(stored) : !stored || Number(stored.raw_score) !== operation.rawScore;
      });
      const ids = {};
      const locks = {};
      saved.forEach((entry) => {
        const student = students.find((item) => String(item.userId) === String(entry.student_id));
        if (!student) return;
        const key = `${student.id}:${entry.component_name}`;
        ids[key] = entry.entry_id;
        if (entry.is_locked) locks[key] = true;
      });
      setEntryIds(ids); setLocked(locks);
      if (failed.length || mismatches.length) {
        const failedResultIndex = results.findIndex((result) => result.status === "rejected" || result.value?.data?.success === false);
        const firstFailed = failedResultIndex >= 0 ? results[failedResultIndex] : null;
        const reason = firstFailed?.reason || { response: { data: firstFailed?.value?.data } };
        const detail = reason?.response?.data?.message || reason?.response?.data?.error;
        toast.error(`${successfulCount} request(s) succeeded, ${failed.length} failed, ${mismatches.length} not confirmed in the database.${detail ? ` ${detail}` : ""}`);
      } else toast.success("BCC grading sheet saved.");
    } catch (error) {
      console.error("Unable to save BCC grades", error);
      toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to save grades.");
    } finally { setLoading(false); }
  };

  const exportSheet = async () => {
    try {
      const templateResponse = await fetch(`${import.meta.env.BASE_URL}BCC-GRADING-SHEETS-TEMPLATE.xlsx`);
      if (!templateResponse.ok) throw new Error("The BCC grading template could not be loaded.");
      const templateBytes = await templateResponse.arrayBuffer();
      const headerResponse = await fetch(`${import.meta.env.BASE_URL}bccheader.jpg`);
      if (!headerResponse.ok) throw new Error("The BCC header image could not be loaded.");
      const headerBytes = new Uint8Array(await headerResponse.arrayBuffer());
      const files = unzipSync(new Uint8Array(templateBytes));
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let gradingXml = decoder.decode(files["xl/worksheets/sheet1.xml"]);
      let ratingXml = decoder.decode(files["xl/worksheets/sheet2.xml"]);
      if (!gradingXml || !ratingXml) throw new Error("The BCC workbook is missing a required sheet.");
      gradingXml = setStudentColumnWidths(gradingXml, visibleStudents);
      const rosterTemplateRows = 21;
      const extraRows = Math.max(0, visibleStudents.length - rosterTemplateRows);
      gradingXml = insertWorksheetRows(gradingXml, 35, extraRows, 34, 34, 35);
      ratingXml = insertWorksheetRows(ratingXml, 34, extraRows, 33, 34, 35);

      const selectedCourse = courses.find((course) => String(course.id) === String(courseId));
      const courseCode = selectedCourse?.code || "";
      const courseTitle = selectedCourse?.title || selectedCourse?.label || "";
      if (periodLabel) {
        gradingXml = setWorksheetCell(gradingXml, "A9", `GRADING SHEET FOR ${periodLabel}`);
        ratingXml = setWorksheetCell(ratingXml, "A8", `RATING SHEET FOR ${periodLabel}`);
      }
      gradingXml = setWorksheetCell(gradingXml, "A10", `Course Code ${courseCode}`);
      gradingXml = setWorksheetCell(gradingXml, "A11", `Subject Title: ${courseTitle.toUpperCase()}`);
      const assignedSections = Array.isArray(selectedCourse?.sections) ? selectedCourse.sections : [];
      gradingXml = setWorksheetCell(gradingXml, "A13", assignedSections.length ? assignedSections.join(", ") : "-");
      const signatureNameRow = 41 + extraRows;
      const signatureTitleRow = 42 + extraRows;
      gradingXml = setWorksheetCell(gradingXml, `B${signatureNameRow}`, String(selectedCourse?.facultyName || "").toUpperCase());
      gradingXml = setWorksheetCell(gradingXml, `G${signatureNameRow}`, String(selectedCourse?.departmentHeadName || "").toUpperCase());
      gradingXml = setWorksheetCell(gradingXml, `G${signatureTitleRow}`, coordinatorLabelFor(selectedCourse?.departmentName));
      ["D", "E", "F"].forEach((column, index) => { gradingXml = setWorksheetCell(gradingXml, `${column}13`, Number(maxScores.quizzes[index]) || 10); });
      [["J", maxScores.performance], ["L", maxScores.attendance], ["O", maxScores.project], ["Q", maxScores.prelim], ["T", maxScores.midterm], ["W", maxScores.finals]]
        .forEach(([column, value]) => { gradingXml = setWorksheetCell(gradingXml, `${column}13`, Number(value) || 100); });

      const rowCount = Math.max(rosterTemplateRows, visibleStudents.length);
      for (let index = 0; index < rowCount; index += 1) {
        const student = visibleStudents[index];
        const row = student ? (rows[student.id] || EMPTY_ROW()) : EMPTY_ROW();
        const excelRow = 14 + index;
        gradingXml = setWorksheetCell(gradingXml, `A${excelRow}`, student ? String(student.studentId) : "");
        gradingXml = setWorksheetCell(gradingXml, `B${excelRow}`, student ? `${student.lastName}, ${student.firstName}` : "");
        ["D", "E", "F"].forEach((column, quizIndex) => { gradingXml = setWorksheetCell(gradingXml, `${column}${excelRow}`, row.quizzes[quizIndex] === "" ? "" : Number(row.quizzes[quizIndex])); });
        [["J", "performance"], ["L", "attendance"], ["O", "project"], ["Q", "prelim"], ["T", "midterm"], ["W", "finals"]]
          .forEach(([column, key]) => { gradingXml = setWorksheetCell(gradingXml, `${column}${excelRow}`, row[key] === "" ? "" : Number(row[key])); });
        const equivalentFormula = [[96.5, "1.00"], [93.5, "1.25"], [90.5, "1.50"], [87.5, "1.75"], [84.5, "2.00"], [81.5, "2.25"], [78.5, "2.50"], [75.5, "2.75"], [75, "3.00"]]
          .reduceRight((formula, [threshold, equivalent]) => `IF(Z${excelRow}>=${threshold},"${equivalent}",${formula})`, '"5.00"');
        const computedGrade = getGrade(row, maxScores);
        const performanceRating = percentageRating(parseScore(row.performance), maxScores.performance);
        const attendanceRating = percentageRating(parseScore(row.attendance), maxScores.attendance);
        const projectRating = percentageRating(parseScore(row.project), maxScores.project);
        const prelimRating = transmuted(parseScore(row.prelim), Number(maxScores.prelim));
        const midtermRating = transmuted(parseScore(row.midterm), Number(maxScores.midterm));
        const finalsRating = transmuted(parseScore(row.finals), Number(maxScores.finals));
        const cachedValues = {
          G: row.quizzes.reduce((sum, score) => sum + (parseScore(score) ?? 0), 0),
          H: computedGrade.quizRating ?? "",
          I: computedGrade.quizRating === null ? "" : computedGrade.quizRating * 0.1,
          K: performanceRating === null ? "" : performanceRating * 0.1,
          M: attendanceRating === null ? "" : attendanceRating * 0.1,
          N: [computedGrade.quizRating, performanceRating, attendanceRating].every((value) => value !== null)
            ? (computedGrade.quizRating + performanceRating + attendanceRating) * 0.1 : "",
          P: projectRating === null ? "" : projectRating * 0.1,
          R: prelimRating ?? "", S: prelimRating === null ? "" : prelimRating * 0.2,
          U: midtermRating ?? "", V: midtermRating === null ? "" : midtermRating * 0.2,
          X: finalsRating ?? "", Y: finalsRating === null ? "" : finalsRating * 0.2,
          Z: computedGrade.total ?? "", AA: computedGrade.total === null ? "" : computedGrade.equivalent,
          AB: computedGrade.total === null ? "" : computedGrade.remarks,
        };
        const formulas = {
          G: `SUM(D${excelRow}:F${excelRow})`, H: `IF(COUNT(D${excelRow}:F${excelRow})=0,"",MIN(100,G${excelRow}/$G$13*70+30))`, I: `IF(H${excelRow}="","",H${excelRow}*0.1)`,
          K: `IF(J${excelRow}="","",MIN(100,J${excelRow}/$J$13*100)*0.1)`, M: `IF(L${excelRow}="","",MIN(100,L${excelRow}/$L$13*100)*0.1)`,
          N: `IF(COUNT(I${excelRow},K${excelRow},M${excelRow})<3,"",I${excelRow}+K${excelRow}+M${excelRow})`, P: `IF(O${excelRow}="","",MIN(100,O${excelRow}/$O$13*100)*0.1)`,
          R: `IF(Q${excelRow}="","",MIN(100,Q${excelRow}/$Q$13*70+30))`, S: `IF(R${excelRow}="","",R${excelRow}*0.2)`,
          U: `IF(T${excelRow}="","",MIN(100,T${excelRow}/$T$13*70+30))`, V: `IF(U${excelRow}="","",U${excelRow}*0.2)`,
          X: `IF(W${excelRow}="","",MIN(100,W${excelRow}/$W$13*70+30))`, Y: `IF(X${excelRow}="","",X${excelRow}*0.2)`,
          Z: `IF(OR(N${excelRow}="",P${excelRow}="",S${excelRow}="",V${excelRow}="",Y${excelRow}=""),"",N${excelRow}+P${excelRow}+S${excelRow}+V${excelRow}+Y${excelRow})`,
          AA: `IF(Z${excelRow}="","",${equivalentFormula})`,
          AB: `IF(AA${excelRow}="","",IF(Z${excelRow}>=75,"PASSED","FAILED"))`,
        };
        Object.entries(formulas).forEach(([column, formula]) => {
          const cachedValue = cachedValues[column];
          gradingXml = setWorksheetFormula(gradingXml, `${column}${excelRow}`, formula, cachedValue);
        });
      }

      files["xl/worksheets/sheet1.xml"] = encoder.encode(gradingXml);
      files["xl/worksheets/sheet2.xml"] = encoder.encode(ratingXml);
      delete files["xl/calcChain.xml"];
      const relationshipPath = "xl/_rels/workbook.xml.rels";
      files[relationshipPath] = encoder.encode(decoder.decode(files[relationshipPath])
        .replace(/<Relationship\b(?=[^>]*calcChain)[^>]*\/>/g, ""));
      files["[Content_Types].xml"] = encoder.encode(decoder.decode(files["[Content_Types].xml"])
        .replace(/<Override\b(?=[^>]*calcChain)[^>]*\/>/g, ""));
      let workbookXml = decoder.decode(files["xl/workbook.xml"]);
      workbookXml = workbookXml.replace(/<calcPr\b[^>]*\/>/, '<calcPr calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/>');
      if (extraRows) workbookXml = workbookXml.replace(/(grading sheet'!\$A\$1:\$AD\$)(\d+)/, (match, prefix, end) => `${prefix}${Number(end) + extraRows}`)
        .replace(/(RATING SHEET'!\$A\$1:\$G\$)(\d+)/, (match, prefix, end) => `${prefix}${Number(end) + extraRows}`);
      files["xl/workbook.xml"] = encoder.encode(workbookXml);
      updateBccHeader(files, headerBytes);
      const finalBytes = zipSync(files, { level: 6 });
      const downloadUrl = URL.createObjectURL(new Blob([finalBytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }));
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = "BCC-Grading-Sheet.xlsx";
      downloadLink.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Unable to export the BCC template", error);
      toast.error(error.message || "Could not export the BCC grading sheet.");
    }
  };

  const importSheet = async (event) => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames.find((name) => name.toLowerCase() === "grading sheet") || workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      const headerIndex = data.findIndex((line) => String(line[0]).toLowerCase().includes("name of students"));
      if (headerIndex < 0) throw new Error("Could not find the BCC student table.");
      const imported = {};
      const isAppExport = String(data[headerIndex]?.[1] || "").toLowerCase().includes("student id");
      const maxRow = data[headerIndex + 1] || [];
      const importedMaxScores = isAppExport
        ? { quizzes: [Number(maxRow[2]) || 10, Number(maxRow[3]) || 10, Number(maxRow[4]) || 10], performance: Number(maxRow[8]) || 100, attendance: Number(maxRow[11]) || 100, project: Number(maxRow[14]) || 100, prelim: Number(maxRow[16]) || 60, midterm: Number(maxRow[19]) || 20, finals: Number(maxRow[22]) || 60 }
        : { quizzes: [Number(maxRow[3]) || 10, Number(maxRow[4]) || 10, Number(maxRow[5]) || 10], performance: Number(maxRow[9]) || 100, attendance: Number(maxRow[11]) || 100, project: Number(maxRow[14]) || 100, prelim: Number(maxRow[16]) || 60, midterm: Number(maxRow[19]) || 20, finals: Number(maxRow[22]) || 60 };
      setMaxScores(importedMaxScores);
      if (courseId && periodId) localStorage.setItem(`bcc-grade-max:${courseId}:${periodId}`, JSON.stringify(importedMaxScores));
      data.slice(headerIndex + 2).forEach((line, rowIndex) => {
        const name = String(line[0] || "").trim().toLowerCase(); if (!name) return;
        const student = isAppExport
          ? visibleStudents.find((item) => `${item.lastName}, ${item.firstName}`.trim().toLowerCase() === name || String(item.studentId) === String(line[1]))
          : visibleStudents.find((item) => String(item.studentId) === String(line[1]) || `${item.lastName}, ${item.firstName}`.trim().toLowerCase() === name)
            || (Number(line[0]) > 0 ? visibleStudents[Number(line[0]) - 1] : visibleStudents[rowIndex]);
        if (!student) return;
        imported[student.id] = isAppExport
          ? { quizzes: [line[2] ?? "", line[3] ?? "", line[4] ?? ""], performance: line[8] ?? "", attendance: line[11] ?? "", project: line[14] ?? "", prelim: line[16] ?? "", midterm: line[19] ?? "", finals: line[22] ?? "" }
          : { quizzes: [line[3] ?? "", line[4] ?? "", line[5] ?? ""], performance: line[9] ?? "", attendance: line[11] ?? "", project: line[14] ?? "", prelim: line[16] ?? "", midterm: line[19] ?? "", finals: line[22] ?? "" };
      });
      setRows((prev) => ({ ...prev, ...imported }));
      toast.success(`Imported grades for ${Object.keys(imported).length} students.`);
    } catch (error) { toast.error(`Import failed: ${error.message}`); }
  };

  const input = (student, key, index, max) => {
    const row = rows[student.id] || EMPTY_ROW();
    const componentKey = key === "quizzes" ? `${student.id}:${entryName(key, index)}` : `${student.id}:${entryName(key, 0)}`;
    return <input type="number" min="0" max={max} value={key === "quizzes" ? row.quizzes[index] : row[key]} disabled={locked[componentKey]} onChange={(event) => updateRow(student.id, key, index, event.target.value)} onKeyDown={async (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      const inputs = Array.from(event.currentTarget.closest("tr")?.querySelectorAll('input[type="number"]:not(:disabled)') || []);
      const nextInput = inputs[inputs.indexOf(event.currentTarget) + 1];
      await saveStudentRow(student);
      nextInput?.focus();
    }} className="w-16 rounded border border-slate-300 px-1 py-1 text-center disabled:bg-slate-100" />;
  };
  const maxInput = (key, index, title) => <input aria-label={`${title} maximum score`} type="number" min="1" value={key === "quizzes" ? maxScores.quizzes[index] : maxScores[key]} onChange={(event) => updateMax(key, index, event.target.value)} className="w-14 rounded border border-slate-300 px-1 py-1 text-center" />;
  const selectedCourse = courses.find((course) => String(course.id) === String(courseId));

  return <div className="p-4 space-y-4">
    <ToastContainer position="top-right" />
    <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
      <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Award className="text-indigo-600" /> BCC Grading Sheet</h2>
      <div className="flex gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm"><Upload size={16} /> Import BCC Excel<input type="file" accept=".xlsx,.xls" onChange={importSheet} className="hidden" /></label>
        <button onClick={exportSheet} disabled={!courseId || loading} className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"><Download size={16} /> Download Live BCC Template</button>
        <button onClick={save} disabled={loading} className="inline-flex items-center gap-2 rounded bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50"><Save size={16} /> {loading ? "Saving..." : "Save Grades"}</button>
      </div>
    </div>
    <div className="flex flex-wrap gap-3">
      <select value={courseId} onChange={(event) => { const value = event.target.value; setCourseId(value); if (periodId) localStorage.setItem(`bcc-grade-course:${periodId}`, value); }} className="min-w-64 rounded border px-3 py-2 text-sm"><option value="">Select course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.label}</option>)}</select>
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search students" className="rounded border px-3 py-2 text-sm" />
      <span className="self-center text-xs text-slate-500">Press Enter in a grade field to save that student's row and move to the next input. Quiz/exam rating: 30 + (score ÷ maximum × 70). Other ratings use score ÷ maximum × 100. Passing starts at 75.</span>
    </div>
    <div className="overflow-x-auto rounded border border-slate-300 bg-white">
      <table className="min-w-full border-collapse text-xs">
        <thead className="bg-slate-100">
          <tr><th colSpan="29" className="border px-2 py-1 bg-black text-center font-bold text-white">GRADING SHEET FOR {periodLabel || ""}</th></tr>
          <tr><th colSpan="29" className="border p-0">
            <div className="grid grid-cols-[22%_1fr] text-left font-semibold">
              <div className="border-r bg-yellow-300 px-2 py-1">Course Code {selectedCourse?.code || ""}</div>
              <div className="bg-yellow-300 px-2 py-1">Subject Title: {(selectedCourse?.title || "").toUpperCase()}</div>
            </div>
          </th></tr>
          <tr>
            <th colSpan="2" rowSpan="3" className="border px-2 py-2 text-center">Name of Students</th>
            <th colSpan="11" className="border px-2 py-2 bg-blue-600 text-white">CLASS STANDING</th>
            <th colSpan="2" rowSpan="2" className="border px-2 py-2 bg-green-500">PROJECT</th>
            <th colSpan="9" className="border px-2 py-2 bg-orange-400">MAJOR EXAM</th>
            <th rowSpan="3" className="border px-2 py-2 bg-stone-200"><span className="[writing-mode:vertical-rl] rotate-180">Final Grade</span></th>
            <th rowSpan="3" className="border px-2 py-2 bg-stone-200"><span className="[writing-mode:vertical-rl] rotate-180">Net Equivalent</span></th>
            <th rowSpan="3" className="border px-2 py-2 bg-stone-200"><span className="[writing-mode:vertical-rl] rotate-180">Remarks</span></th>
            <th colSpan="2" className="border px-2 py-2 bg-stone-200">REMOVAL</th>
          </tr>
          <tr>
            <th colSpan="6" className="border px-2 py-2 bg-blue-100">Quizzes / Activities 10%</th>
            <th colSpan="2" className="border px-2 py-2 bg-emerald-100">Performance 10%</th>
            <th colSpan="2" className="border px-2 py-2 bg-amber-100">Attendance 10%</th>
            <th rowSpan="2" className="border px-2 py-2 bg-blue-200"><span className="[writing-mode:vertical-rl] rotate-180">Class Standing 30%</span></th>
            <th colSpan="3" className="border px-2 py-2 bg-violet-100">Prelims</th>
            <th colSpan="3" className="border px-2 py-2 bg-orange-100">Midterm</th>
            <th colSpan="3" className="border px-2 py-2 bg-rose-100">Finals</th>
            <th rowSpan="2" className="border px-2 py-2 bg-stone-200">Final Grade</th>
            <th rowSpan="2" className="border px-2 py-2 bg-stone-200">Net Equivalent</th>
          </tr>
          <tr className="bg-white">
            {[0, 1, 2].map((index) => <th key={index} className="border p-1">{maxInput("quizzes", index, `Quiz / Activity ${index + 1}`)}</th>)}
            <th className="border px-2">Total</th><th className="border px-2">Rating</th><th className="border px-2">10%</th>
            <th className="border p-1">{maxInput("performance", null, "Performance")}</th><th className="border px-2">10%</th>
            <th className="border p-1">{maxInput("attendance", null, "Attendance")}</th><th className="border px-2">10%</th>
            <th className="border p-1">{maxInput("project", null, "Project")}</th><th className="border px-2">10%</th>
            <th className="border p-1">{maxInput("prelim", null, "Prelim")}</th><th className="border px-2">Rating</th><th className="border px-2">20%</th>
            <th className="border p-1">{maxInput("midterm", null, "Midterm")}</th><th className="border px-2">Rating</th><th className="border px-2">20%</th>
            <th className="border p-1">{maxInput("finals", null, "Finals")}</th><th className="border px-2">Rating</th><th className="border px-2">20%</th>
          </tr>
        </thead>
        <tbody>{visibleStudents.length ? visibleStudents.map((student) => {
          const row = rows[student.id] || EMPTY_ROW(); const grade = getGrade(row, maxScores);
          const quizTotal = row.quizzes.reduce((sum, value) => sum + (parseScore(value) ?? 0), 0);
          const quizRating = grade.quizRating;
          const performanceRating = percentageRating(parseScore(row.performance), maxScores.performance);
          const attendanceRating = percentageRating(parseScore(row.attendance), maxScores.attendance);
          const projectRating = percentageRating(parseScore(row.project), maxScores.project);
          const prelimRating = transmuted(parseScore(row.prelim), Number(maxScores.prelim));
          const midtermRating = transmuted(parseScore(row.midterm), Number(maxScores.midterm));
          const finalsRating = transmuted(parseScore(row.finals), Number(maxScores.finals));
          const standingWeighted = [quizRating, performanceRating, attendanceRating].every((value) => value !== null)
            ? (quizRating + performanceRating + attendanceRating) * .1
            : null;
          const weighted = (rating, weight) => rating === null ? "-" : (rating * weight / 100).toFixed(2);
          const shown = (rating) => rating === null ? "-" : rating.toFixed(2);
          return <tr key={student.id} className="hover:bg-slate-50">
            <td className="border px-2 py-2 whitespace-nowrap">{student.studentId}</td><td className="border px-2 py-2 whitespace-nowrap">{student.lastName}, {student.firstName}</td>
            {[0, 1, 2].map((index) => <td key={index} className="border bg-blue-50 p-1 text-center">{input(student, "quizzes", index, maxScores.quizzes[index])}</td>)}
            <td className="border bg-blue-100 px-2 text-center">{quizTotal || "-"}</td><td className="border bg-blue-100 px-2 text-center">{shown(quizRating)}</td><td className="border bg-blue-100 px-2 text-center">{weighted(quizRating, 10)}</td>
            <td className="border bg-emerald-50 p-1 text-center">{input(student, "performance", null, maxScores.performance)}</td><td className="border bg-emerald-100 px-2 text-center">{weighted(performanceRating, 10)}</td>
            <td className="border bg-amber-50 p-1 text-center">{input(student, "attendance", null, maxScores.attendance)}</td><td className="border bg-amber-100 px-2 text-center">{weighted(attendanceRating, 10)}</td>
            <td className="border bg-blue-100 px-2 text-center font-semibold">{standingWeighted?.toFixed(2) ?? "-"}</td>
            <td className="border bg-green-50 p-1 text-center">{input(student, "project", null, maxScores.project)}</td><td className="border bg-green-100 px-2 text-center">{weighted(projectRating, 10)}</td>
            <td className="border bg-violet-50 p-1 text-center">{input(student, "prelim", null, maxScores.prelim)}</td><td className="border bg-violet-100 px-2 text-center">{shown(prelimRating)}</td><td className="border bg-violet-100 px-2 text-center">{weighted(prelimRating, 20)}</td>
            <td className="border bg-orange-50 p-1 text-center">{input(student, "midterm", null, maxScores.midterm)}</td><td className="border bg-orange-100 px-2 text-center">{shown(midtermRating)}</td><td className="border bg-orange-100 px-2 text-center">{weighted(midtermRating, 20)}</td>
            <td className="border bg-rose-50 p-1 text-center">{input(student, "finals", null, maxScores.finals)}</td><td className="border bg-rose-100 px-2 text-center">{shown(finalsRating)}</td><td className="border bg-rose-100 px-2 text-center">{weighted(finalsRating, 20)}</td>
            <td className="border px-2 text-center font-bold">{grade.total ?? "-"}</td><td className="border px-2 text-center">{grade.equivalent}</td>
            <td className={`border px-2 text-center font-semibold ${grade.remarks === "PASSED" ? "text-green-700" : grade.remarks === "FAILED" ? "text-red-700" : "text-slate-400"}`}>{grade.remarks}</td><td className="border px-2 text-center">-</td><td className="border px-2 text-center">-</td>
          </tr>;
        }) : <tr><td colSpan="29" className="px-4 py-8 text-center text-slate-500">{courseId ? "No students found for this course." : "Select a course to view enrolled students."}</td></tr>}</tbody>
      </table>
    </div>
  </div>;
}
