import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Save,
  Search,
  Upload,
  Users,
  FileText,
  TableProperties,
  BookOpen,
  ClipboardList,
  Plus,
  Minus,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { exportGradeEncoding } from "../../../utils/gradeExcelExport";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ─── Period config ──────────────────────────────────────────────────────────
const PERIODS = ["midterm", "final"];

const PERIOD_LABELS = {
  midterm: "Midterm",
  final: "Final",
};

const CAMPUS_SECTION_WEIGHTS = {
  writtenOutput: 30,
  performanceTasks: 40,
  midtermExam: 30,   // exam column weight
};

// ─── Dynamic column config ───────────────────────────────────────────────────
const BASE_COLUMN_COUNT = 12;
const MAX_COLUMNS = 20;
const MIN_COLUMNS = 1;

// ─── Empty state helpers ─────────────────────────────────────────────────────
const EMPTY_GRADE = (woCount = BASE_COLUMN_COUNT, ptCount = BASE_COLUMN_COUNT) => ({
  writtenOutput: Array(woCount).fill(""),
  performanceTasks: Array(ptCount).fill(""),
  midtermExam: "",
});

const EMPTY_MAX_SCORE = (woCount = BASE_COLUMN_COUNT, ptCount = BASE_COLUMN_COUNT) => ({
  writtenOutput: Array(woCount).fill(100),
  performanceTasks: Array(ptCount).fill(100),
  midtermExam: 100,
});

const EMPTY_ACTIVITY_META = (woCount = BASE_COLUMN_COUNT, ptCount = BASE_COLUMN_COUNT) => ({
  writtenOutput: Array(woCount).fill(null),
  performanceTasks: Array(ptCount).fill(null),
  midtermExam: null,
});

// ─── Default header max scores ────────────────────────────────────────────────
// null = not yet set by faculty (renders as empty input); falls back to 100 in calculations.
const EMPTY_HEADER_MAX_SCORES = (woCount = BASE_COLUMN_COUNT, ptCount = BASE_COLUMN_COUNT) => ({
  writtenOutput: Array(woCount).fill(null),
  performanceTasks: Array(ptCount).fill(null),
  midtermExam: null,
});

// ─── Grade scale ─────────────────────────────────────────────────────────────
const LETTER_SCALE = [
  { min: 97, letter: "", equivalent: "1.00", status: "PASSED" },
  { min: 94, letter: "", equivalent: "1.25", status: "PASSED" },
  { min: 91, letter: "", equivalent: "1.50", status: "PASSED" },
  { min: 88, letter: "", equivalent: "1.75", status: "PASSED" },
  { min: 85,  letter: "", equivalent: "2.00", status: "PASSED" },
  { min: 82,  letter: "", equivalent: "2.25", status: "PASSED" },
  { min: 79,  letter: "", equivalent: "2.50", status: "PASSED" },
  { min: 76,  letter: "", equivalent: "2.75", status: "PASSED" },
  { min: 70,  letter: "", equivalent: "3.00", status: "FAILED" },
  { min: 65,  letter: "", equivalent: "4.00", status: "FAILED" },
];

// ─── Utility fns ─────────────────────────────────────────────────────────────
const normalizeNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const calculateSectionStats = (scores = [], maxScores = [], sectionWeight = 0) => {
  const totalScore = scores.reduce((sum, score) => sum + (normalizeNumber(score) ?? 0), 0);
  const totalMax = maxScores.reduce((sum, maxScore) => sum + Number(maxScore || 100), 0);
  if (totalMax <= 0) return { totalScore: 0, percent: 0, weightedScore: 0 };
  const percent = (totalScore / totalMax) * 100;
  const weightedScore = percent * (sectionWeight / 100);
  return {
    totalScore:    Number(totalScore.toFixed(2)),
    percent:       Number(percent.toFixed(2)),
    weightedScore: Number(weightedScore.toFixed(2)),
  };
};

const calculateMidtermWeighted = (midtermScore, midtermMax = 100) => {
  const midterm = normalizeNumber(midtermScore) ?? 0;
  const safeMax = Number(midtermMax || 100);
  if (safeMax <= 0) return 0;
  const percent = (midterm / safeMax) * 100;
  return Number((percent * (CAMPUS_SECTION_WEIGHTS.midtermExam / 100)).toFixed(2));
};

const calculateFinalGrade = (gradeRow, maxRow) => {
  const hasWritten     = gradeRow.writtenOutput.some((s) => normalizeNumber(s) !== null);
  const hasPerformance = gradeRow.performanceTasks.some((s) => normalizeNumber(s) !== null);
  const hasExam        = normalizeNumber(gradeRow.midtermExam) !== null;

  if (!hasWritten && !hasPerformance && !hasExam) return null;

  const written     = calculateSectionStats(
    gradeRow.writtenOutput,
    maxRow?.writtenOutput   || Array(gradeRow.writtenOutput.length).fill(100),
    CAMPUS_SECTION_WEIGHTS.writtenOutput,
  );
  const performance = calculateSectionStats(
    gradeRow.performanceTasks,
    maxRow?.performanceTasks || Array(gradeRow.performanceTasks.length).fill(100),
    CAMPUS_SECTION_WEIGHTS.performanceTasks,
  );
  const midtermWeighted = calculateMidtermWeighted(
    gradeRow.midtermExam,
    maxRow?.midtermExam || 100,
  );
  return Number((written.weightedScore + performance.weightedScore + midtermWeighted).toFixed(2));
};

const getLetterInfo = (score) => {
  if (score === null || score === undefined) {
    return { letter: "-", equivalent: "-", status: "-" };
  }
  return (
    LETTER_SCALE.find((range) => score >= range.min) || {
      letter: "",
      equivalent: "5.00",
      status: "FAILED",
    }
  );
};

const getNumericalEquivalent = (grade) => {
  if (grade === null || grade === undefined) return null;
  if (grade >= 97) return 1.00;
  if (grade >= 94) return 1.25;
  if (grade >= 91) return 1.50;
  if (grade >= 88) return 1.75;
  if (grade >= 85) return 2.00;
  if (grade >= 82) return 2.25;
  if (grade >= 79) return 2.50;
  if (grade >= 76) return 2.75;
  if (grade >= 75) return 3.00;
  return 5.00;
};

const extractComponentOrder = (name = "") => {
  const match = String(name).match(/(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const GradeEncoding = () => {
  const [loading, setLoading]           = useState(false);
  const [courses, setCourses]           = useState([]);
  const [students, setStudents]         = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState("");
  const [searchTerm, setSearchTerm]     = useState("");
  const [currentPage, setCurrentPage]   = useState(1);
  const [activePeriodId, setActivePeriodId] = useState("");
  const [entryMap, setEntryMap]         = useState({});
  const [lockedEntries, setLockedEntries] = useState({});
  const [activityMeta, setActivityMeta] = useState(EMPTY_ACTIVITY_META());

  const [period, setPeriod] = useState("midterm");
  const [view, setView]     = useState("encoding");

  const [gradesMap, setGradesMap]       = useState({ midterm: {}, final: {} });
  const [maxScoresMap, setMaxScoresMap] = useState({ midterm: {}, final: {} });

  // ─── Dynamic column counts ────────────────────────────────────────────────
  const [colCounts, setColCounts] = useState({
    writtenOutput: BASE_COLUMN_COUNT,
    performanceTasks: BASE_COLUMN_COUNT,
  });

  // ─── NEW: Header-level max scores (one value per column, shared across all students) ──
  // BUGFIX: this used to be a single shared object, so a max score typed
  // into the Final tab would also show up on Midterm (and vice versa) —
  // switching tabs looked like it "inherited" the other period's values.
  // It's now keyed by period, exactly like gradesMap/maxScoresMap, so each
  // period keeps its own independent set of column max scores.
  const [headerMaxScoresMap, setHeaderMaxScoresMap] = useState({
    midterm: EMPTY_HEADER_MAX_SCORES(BASE_COLUMN_COUNT, BASE_COLUMN_COUNT),
    final:   EMPTY_HEADER_MAX_SCORES(BASE_COLUMN_COUNT, BASE_COLUMN_COUNT),
  });

  const lastAutoSyncRef = useRef(null);
  const itemsPerPage = 10;

  const grades    = gradesMap[period] || {};
  const maxScores = maxScoresMap[period] || {};
  const woCount = colCounts.writtenOutput;
  const ptCount = colCounts.performanceTasks;

  // headerMaxScores always reflects the CURRENTLY selected period's own values.
  const headerMaxScores = headerMaxScoresMap[period] || EMPTY_HEADER_MAX_SCORES(woCount, ptCount);

  const LABEL_MAP = { midterm: "midterm", final: "tentative_final" };
  const currentLabel = LABEL_MAP[period] || "midterm";

  // ─── Single source of truth for max scores ──────────────────────────────
  // headerMaxScores is what's shown and edited at the top of each column.
  // Previously, each student's row calculation read from a SEPARATE
  // per-student maxScoresMap entry, which was populated independently when
  // grades were loaded from the database (each grade_entries row carries
  // its own stored max_score). Those two values were supposed to always
  // match, but could silently drift apart — e.g. a leftover max_score from
  // an earlier LMS sync stayed on a student's stored entry even after the
  // header input was changed to 100, so that student's percentage/weighted
  // score was computed against a different denominator than what the
  // header displayed.
  //
  // Fix: every calculation and every on-screen percentage now reads from
  // this single derived row instead of the per-student maxScoresMap, so
  // "what you see in the header" and "what's used to compute the grade"
  // can never disagree again.
  // Single source of truth for max scores used in calculations.
  //
  // IMPORTANT: an unset column ("—" in the header — no max score has been
  // assigned yet) is excluded entirely from the total, NOT counted as 100.
  // Treating an unset column as worth 100 would silently inflate the
  // section's total possible points for every column the teacher hasn't
  // activated yet, unfairly deflating every student's percentage until all
  // 12 columns are filled in. The header's own "Total" display already
  // only sums the columns that have a value — this now matches that.
  // effectiveMaxRowFor(p) derives the calculation row for a SPECIFIC period
  // from that period's own headerMaxScoresMap entry — this is what makes
  // Midterm and Final genuinely independent instead of sharing one row.
  const effectiveMaxRowFor = useCallback((p) => {
    const hms = headerMaxScoresMap[p] || EMPTY_HEADER_MAX_SCORES(woCount, ptCount);
    return {
      writtenOutput: hms.writtenOutput.slice(0, woCount).filter((v) => v !== null),
      performanceTasks: hms.performanceTasks.slice(0, ptCount).filter((v) => v !== null),
      // The midterm/final exam is a single required value (not a column
      // series like the two arrays above), so it still falls back to 100 if
      // unset — an exam score entered with no max set yet is assumed to be
      // out of 100 until the teacher specifies otherwise.
      midtermExam: hms.midtermExam ?? 100,
    };
  }, [headerMaxScoresMap, woCount, ptCount]);

  // The row for whichever period is currently selected in the UI.
  const effectiveMaxRow = useMemo(
    () => effectiveMaxRowFor(period),
    [effectiveMaxRowFor, period],
  );

  // Same idea, reshaped for the Excel export util, which expects a
  // per-student, per-period maxScoresMap. Midterm students get Midterm's
  // own effective row and Final students get Final's own row, so the
  // exported sheet matches what's on screen for EACH period independently.
  const effectiveMaxScoresMap = useMemo(() => {
    const midtermRow = effectiveMaxRowFor("midterm");
    const finalRow    = effectiveMaxRowFor("final");
    const midtermPerStudent = {};
    const finalPerStudent   = {};
    students.forEach((s) => {
      midtermPerStudent[s.id] = midtermRow;
      finalPerStudent[s.id]   = finalRow;
    });
    return { midterm: midtermPerStudent, final: finalPerStudent };
  }, [students, effectiveMaxRowFor]);

  const setGrades = (updater) =>
    setGradesMap((prev) => {
      const next = typeof updater === "function" ? updater(prev[period] || {}) : updater;
      return { ...prev, [period]: next };
    });

  const setMaxScores = (updater) =>
    setMaxScoresMap((prev) => {
      const next = typeof updater === "function" ? updater(prev[period] || {}) : updater;
      return { ...prev, [period]: next };
    });

  // Updates ONLY the currently selected period's headerMaxScores bucket —
  // same shape/API as before (`updater(currentPeriodHeaderMaxScores)`), so
  // every existing call site (loadExistingGradeEntries, growColumns, etc.)
  // keeps working unchanged, it just no longer leaks across periods.
  const setHeaderMaxScores = useCallback((updater) => {
    setHeaderMaxScoresMap((prev) => {
      const current = prev[period] || EMPTY_HEADER_MAX_SCORES(woCount, ptCount);
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...prev, [period]: next };
    });
  }, [period, woCount, ptCount]);

  // ─── Handle header max score change ──────────────────────────────────────
  // Updates the header display value AND propagates to all students so that
  // grade calculations (calculateSectionStats) use the correct per-column max.
  const handleHeaderMaxScoreChange = useCallback((section, index, rawValue) => {
    // Allow the field to be fully cleared (null = unset); only enforce min:1 when a number is provided.
    const isEmpty = rawValue === "" || rawValue === null || rawValue === undefined;
    const val = isEmpty ? null : Math.max(1, Number(rawValue) || 1);
    // For propagation to student rows, fall back to 100 when unset so calculations stay valid.
    const calcVal = val ?? 100;

    // 1. Update the header display state for the CURRENT period only.
    //    Previously this wrote into a single object shared by both periods,
    //    so editing a max score on Final would also change it on Midterm.
    setHeaderMaxScores((prev) => {
      if (section === "midtermExam") {
        return { ...prev, midtermExam: val };
      }
      const arr = [...prev[section]];
      arr[index] = val;
      return { ...prev, [section]: arr };
    });

    // 2. Propagate the effective value (100 fallback) to every student's
    //    maxScores row for THIS period only. Midterm and Final are
    //    independent now, so a Final-tab edit must not touch Midterm data.
    setMaxScoresMap((prev) => {
      const periodData = { ...(prev[period] || {}) };
      Object.keys(periodData).forEach((sid) => {
        const row = { ...periodData[sid] };
        if (section === "midtermExam") {
          periodData[sid] = { ...row, midtermExam: calcVal };
        } else {
          const arr = [...(row[section] || [])];
          arr[index] = calcVal;
          periodData[sid] = { ...row, [section]: arr };
        }
      });
      return { ...prev, [period]: periodData };
    });
  }, [period, setHeaderMaxScores]);

  // ─── Grow columns ─────────────────────────────────────────────────────────
  const growColumns = useCallback((section, targetCount) => {
    setColCounts((prev) => (targetCount > prev[section] ? { ...prev, [section]: targetCount } : prev));

    // Grow headerMaxScoresMap for this section in BOTH periods — column
    // COUNT is shared across Midterm/Final, but each period keeps its own
    // independent max-score VALUES, so both buckets need to stay the same
    // length. New slots default to null (empty) in each period separately.
    setHeaderMaxScoresMap((prev) => {
      const next = { ...prev };
      PERIODS.forEach((p) => {
        const periodHms = prev[p];
        if (periodHms && targetCount > periodHms[section].length) {
          const extra = Array(targetCount - periodHms[section].length).fill(null);
          next[p] = { ...periodHms, [section]: [...periodHms[section], ...extra] };
        }
      });
      return next;
    });

    setGradesMap((prev) => {
      const next = {};
      PERIODS.forEach((p) => {
        const periodData = { ...(prev[p] || {}) };
        Object.keys(periodData).forEach((sid) => {
          const row = periodData[sid];
          const arr = row[section];
          if (arr.length < targetCount) {
            periodData[sid] = { ...row, [section]: [...arr, ...Array(targetCount - arr.length).fill("")] };
          }
        });
        next[p] = periodData;
      });
      return next;
    });
    setMaxScoresMap((prev) => {
      const next = {};
      PERIODS.forEach((p) => {
        const periodData = { ...(prev[p] || {}) };
        Object.keys(periodData).forEach((sid) => {
          const row = periodData[sid];
          const arr = row[section];
          if (arr.length < targetCount) {
            periodData[sid] = { ...row, [section]: [...arr, ...Array(targetCount - arr.length).fill(100)] };
          }
        });
        next[p] = periodData;
      });
      return next;
    });
  }, []);

  // ─── Add/remove columns ───────────────────────────────────────────────────
  const handleAddColumn = (section) => {
    const current = colCounts[section];
    if (current >= MAX_COLUMNS) {
      alert(`You can have at most ${MAX_COLUMNS} ${section === "writtenOutput" ? "written output" : "performance task"} items.`);
      return;
    }
    growColumns(section, current + 1);
    // growColumns already appends null to headerMaxScores, so no extra step needed here.
    setActivityMeta((prev) => ({ ...prev, [section]: [...(prev[section] || []), null] }));
  };

  const handleRemoveColumn = (section) => {
    const current = colCounts[section];
    if (current <= MIN_COLUMNS) return;
    const label = section === "writtenOutput" ? "written output" : "performance task";
    if (!window.confirm(`Remove the last ${label} column? Any scores already entered in it (for both Midterm and Final) will be lost.`)) {
      return;
    }
    setColCounts((prev) => ({ ...prev, [section]: current - 1 }));

    // Shrink headerMaxScoresMap for this section in BOTH periods — column
    // count is shared across Midterm/Final, so both buckets must stay the
    // same length even though their values are independent.
    setHeaderMaxScoresMap((prev) => {
      const next = { ...prev };
      PERIODS.forEach((p) => {
        const periodHms = prev[p];
        if (periodHms) next[p] = { ...periodHms, [section]: periodHms[section].slice(0, -1) };
      });
      return next;
    });

    setGradesMap((prev) => {
      const next = {};
      PERIODS.forEach((p) => {
        const periodData = { ...(prev[p] || {}) };
        Object.keys(periodData).forEach((sid) => {
          const row = periodData[sid];
          if (row[section].length > MIN_COLUMNS) {
            periodData[sid] = { ...row, [section]: row[section].slice(0, -1) };
          }
        });
        next[p] = periodData;
      });
      return next;
    });
    setMaxScoresMap((prev) => {
      const next = {};
      PERIODS.forEach((p) => {
        const periodData = { ...(prev[p] || {}) };
        Object.keys(periodData).forEach((sid) => {
          const row = periodData[sid];
          if (row[section].length > MIN_COLUMNS) {
            periodData[sid] = { ...row, [section]: row[section].slice(0, -1) };
          }
        });
        next[p] = periodData;
      });
      return next;
    });
    setActivityMeta((prev) => ({ ...prev, [section]: (prev[section] || []).slice(0, -1) }));
  };

  // ─── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => { fetchCoursesAndStudents(); }, []);

  const fetchCoursesAndStudents = async () => {
    setLoading(true);
    try {
      const [coursesRes, enrollmentsRes, activePeriodRes] = await Promise.all([
        axios.get(`${API_BASE}/api/course/courses`),
        axios.get(`${API_BASE}/api/enrollments`),
        axios.get(`${API_BASE}/api/academic-periods/active`).catch(() => ({ data: null })),
      ]);

      const courseRows = Array.isArray(coursesRes.data) ? coursesRes.data : (coursesRes.data?.data || []);
      const mappedCourses = courseRows.map((c) => ({
        id: c.course_id || c.id,
        code: c.code || c.course_code || "",
        name: c.title || c.name || c.course_name || "",
        section: c.section || "A",
      }));

      const enrollmentRows = Array.isArray(enrollmentsRes.data) ? enrollmentsRes.data : (enrollmentsRes.data?.data || []);
      const mappedStudents = enrollmentRows.map((e, i) => ({
        id:         e.enrollment_id || e.student_id || e.user_id || i + 1,
        userId:     e.student_id || e.user_id || null,
        studentId:  e.student_number || e.student_id || e.user_id || `STU-${i + 1}`,
        firstName:  e.first_name || e.student_name?.split(" ")?.[0] || e.name?.split(" ")?.[0] || "Student",
        lastName:   e.last_name  || e.student_name?.split(" ")?.[1] || e.name?.split(" ")?.[1] || "",
        courseId:   e.course_id || null,
        course:     e.course_code || mappedCourses.find((c) => c.id === e.course_id)?.code || "N/A",
        sectionId:  e.section_id || null,
        section:    e.section_name || e.section_id || "N/A",
        yearLevel:  e.year_level || e.year_level === 0 ? e.year_level : e.year_level || e.year_level,
      }));

      const activePeriod = activePeriodRes.data?.period || activePeriodRes.data || null;
      if (activePeriod) {
        const periodId = activePeriod.period_id ?? activePeriod.id ?? activePeriod.periodId ?? null;
        if (periodId) setActivePeriodId(String(periodId));
      }

      setCourses(mappedCourses);
      setStudents(mappedStudents);

      setGradesMap((prev) => {
        const next = { ...prev };
        PERIODS.forEach((p) => {
          const periodData = { ...(next[p] || {}) };
          mappedStudents.forEach((s) => { if (!periodData[s.id]) periodData[s.id] = EMPTY_GRADE(colCounts.writtenOutput, colCounts.performanceTasks); });
          next[p] = periodData;
        });
        return next;
      });
      setMaxScoresMap((prev) => {
        const next = { ...prev };
        PERIODS.forEach((p) => {
          const periodData = { ...(next[p] || {}) };
          mappedStudents.forEach((s) => { if (!periodData[s.id]) periodData[s.id] = EMPTY_MAX_SCORE(colCounts.writtenOutput, colCounts.performanceTasks); });
          next[p] = periodData;
        });
        return next;
      });

      setEntryMap({});
    } catch (error) {
      console.error("Error fetching grade encoding data:", error);
      setCourses([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Grade change ──────────────────────────────────────────────────────────
  const handleGradeChange = (studentId, section, index, value) => {
    setGrades((prev) => {
      const existing = prev[studentId] || EMPTY_GRADE(woCount, ptCount);
      if (section === "midtermExam") {
        return { ...prev, [studentId]: { ...existing, midtermExam: value } };
      }
      const updated = [...existing[section]];
      updated[index] = value;
      return { ...prev, [studentId]: { ...existing, [section]: updated } };
    });
  };

  // ─── Filtering / pagination ────────────────────────────────────────────────
  useEffect(() => {
    setSelectedSection("");
    setSelectedYearLevel("");
  }, [selectedCourse]);

  const courseStudents = useMemo(() => {
    if (!selectedCourse) return students;
    return students.filter((s) => String(s.courseId) === String(selectedCourse));
  }, [students, selectedCourse]);

  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return courseStudents.filter((s) => {
      const matchesSection   = !selectedSection   || String(s.section)   === String(selectedSection)   || String(s.sectionId) === String(selectedSection);
      const matchesYearLevel = !selectedYearLevel || String(s.yearLevel) === String(selectedYearLevel);
      const matchesSearch    =
        !term ||
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(term) ||
        String(s.studentId).toLowerCase().includes(term);
      return matchesSection && matchesYearLevel && matchesSearch;
    });
  }, [courseStudents, selectedSection, selectedYearLevel, searchTerm]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedCourse, period, view]);

  const currentStudents  = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages       = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));

  const availableSections = useMemo(() => {
    const values = new Set();
    courseStudents.forEach((student) => {
      if (student.section !== null && student.section !== undefined && String(student.section).trim() !== "") values.add(String(student.section));
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [courseStudents]);

  const availableYearLevels = useMemo(() => {
    const values = new Set();
    courseStudents.forEach((student) => {
      if (student.yearLevel !== null && student.yearLevel !== undefined && String(student.yearLevel).trim() !== "") values.add(String(student.yearLevel));
    });
    return Array.from(values).sort((a, b) => Number(a) - Number(b));
  }, [courseStudents]);

  // ─── Load grade entries ────────────────────────────────────────────────────
  const loadExistingGradeEntries = useCallback(async () => {
    if (!selectedCourse || !activePeriodId || students.length === 0) return;
    try {
      const response = await axios.get(`${API_BASE}/api/grade-entries`, {
        params: { course_id: selectedCourse, period_id: activePeriodId },
      });
      const entries = response.data?.data || [];
      const gradeLabel     = LABEL_MAP[period] || "midterm";
      const filteredEntries = entries.filter((e) => String(e.label || "").toLowerCase() === String(gradeLabel).toLowerCase());

      console.log(`[GradeEncoding] Loaded ${entries.length} total entries, filtered to ${filteredEntries.length} for label "${gradeLabel}"`);

      const studentByUserId = new Map(students.filter((s) => s.userId).map((s) => [String(s.userId), s]));

      const grouped = {};
      filteredEntries.forEach((entry) => {
        const key = String(entry.student_id);
        if (!grouped[key]) grouped[key] = { assignment: [], quiz: [], exam: [] };
        const componentType = entry.component_type || "assignment";
        if (grouped[key][componentType] !== undefined) {
          grouped[key][componentType].push(entry);
        } else {
          console.warn(`[GradeEncoding] Unknown component_type: "${componentType}" for entry:`, entry);
        }
      });

      let neededWo = colCounts.writtenOutput;
      let neededPt = colCounts.performanceTasks;
      Object.values(grouped).forEach((components) => {
        components.assignment.forEach((e) => {
          const m = String(e.component_name || "").match(/(\d+)/);
          if (m) neededWo = Math.max(neededWo, Math.min(Number(m[1]), MAX_COLUMNS));
        });
        components.quiz.forEach((e) => {
          const m = String(e.component_name || "").match(/(\d+)/);
          if (m) neededPt = Math.max(neededPt, Math.min(Number(m[1]), MAX_COLUMNS));
        });
      });
      if (neededWo > colCounts.writtenOutput) growColumns("writtenOutput", neededWo);
      if (neededPt > colCounts.performanceTasks) growColumns("performanceTasks", neededPt);

      const nextGrades        = {};
      const nextMaxScores     = {};
      const nextEntryMap      = {};
      const nextLockedEntries = {};

      // Track per-column max scores from loaded entries to sync into headerMaxScores
      const loadedWoMax = Array(neededWo).fill(null);
      const loadedPtMax = Array(neededPt).fill(null);
      let loadedExamMax = null;

      Object.entries(grouped).forEach(([studentUserId, components]) => {
        const localStudent = studentByUserId.get(studentUserId);
        if (!localStudent) return;

        const assignmentEntries = [...components.assignment].sort((a, b) => {
          const diff = extractComponentOrder(a.component_name) - extractComponentOrder(b.component_name);
          return diff !== 0 ? diff : new Date(a.submitted_at) - new Date(b.submitted_at);
        });
        const quizEntries = [...components.quiz].sort((a, b) => {
          const diff = extractComponentOrder(a.component_name) - extractComponentOrder(b.component_name);
          return diff !== 0 ? diff : new Date(a.submitted_at) - new Date(b.submitted_at);
        });
        const examEntries = [...components.exam].sort((a, b) => {
          const ap = String(a.component_name || "").toLowerCase().includes("midterm") ? 0 : 1;
          const bp = String(b.component_name || "").toLowerCase().includes("midterm") ? 0 : 1;
          return ap !== bp ? ap - bp : new Date(a.submitted_at) - new Date(b.submitted_at);
        });

        const gradeRow = EMPTY_GRADE(neededWo, neededPt);
        const maxRow   = EMPTY_MAX_SCORE(neededWo, neededPt);

        assignmentEntries.forEach((entry) => {
          const nameStr = String(entry.component_name || "").trim();
          let colIdx = null;
          const compMatch = nameStr.match(/(\d+)/);
          if (compMatch) {
            const n = Number(compMatch[1]);
            if (n >= 1 && n <= neededWo) colIdx = n - 1;
          }
          if (colIdx === null) {
            const lower = nameStr.toLowerCase();
            const meta = activityMeta || EMPTY_ACTIVITY_META(neededWo, neededPt);
            for (let i = 0; i < (meta.writtenOutput || []).length; i++) {
              const label = String(meta.writtenOutput[i]?.label || "").toLowerCase();
              if (label && lower.includes(label)) { colIdx = i; break; }
            }
          }
          if (colIdx === null) {
            for (let i = 0; i < neededWo; i++) {
              if (gradeRow.writtenOutput[i] === "" || gradeRow.writtenOutput[i] === null) { colIdx = i; break; }
            }
          }

          if (colIdx !== null && colIdx >= 0 && colIdx < neededWo) {
            gradeRow.writtenOutput[colIdx] = entry.raw_score ?? "";
            const entryMax = Number(entry.max_score || 100);
            maxRow.writtenOutput[colIdx]   = entryMax;
            // Track the max score for this column to update headerMaxScores later
            if (loadedWoMax[colIdx] === null) loadedWoMax[colIdx] = entryMax;
            const key = `${localStudent.id}:writtenOutput:${colIdx}:${gradeLabel}`;
            nextEntryMap[key] = entry.entry_id;
            if (entry.is_locked) nextLockedEntries[key] = true;
          } else {
            console.warn(`[GradeEncoding] Could not load assignment "${entry.component_name}" - could not resolve a valid column index`, entry);
          }
        });

        quizEntries.forEach((entry) => {
          const nameStr = String(entry.component_name || "").trim();
          let colIdx = null;
          const compMatch = nameStr.match(/(\d+)/);
          if (compMatch) {
            const n = Number(compMatch[1]);
            if (n >= 1 && n <= neededPt) colIdx = n - 1;
          }
          if (colIdx === null) {
            const lower = nameStr.toLowerCase();
            const meta = activityMeta || EMPTY_ACTIVITY_META(neededWo, neededPt);
            for (let i = 0; i < (meta.performanceTasks || []).length; i++) {
              const label = String(meta.performanceTasks[i]?.label || "").toLowerCase();
              if (label && lower.includes(label)) { colIdx = i; break; }
            }
          }
          if (colIdx === null) {
            for (let i = 0; i < neededPt; i++) {
              if (gradeRow.performanceTasks[i] === "" || gradeRow.performanceTasks[i] === null) { colIdx = i; break; }
            }
          }

          if (colIdx !== null && colIdx >= 0 && colIdx < neededPt) {
            gradeRow.performanceTasks[colIdx] = entry.raw_score ?? "";
            const entryMax = Number(entry.max_score || 100);
            maxRow.performanceTasks[colIdx]   = entryMax;
            if (loadedPtMax[colIdx] === null) loadedPtMax[colIdx] = entryMax;
            const key = `${localStudent.id}:performanceTasks:${colIdx}:${gradeLabel}`;
            nextEntryMap[key] = entry.entry_id;
            if (entry.is_locked) nextLockedEntries[key] = true;
          } else {
            console.warn(`[GradeEncoding] Could not load quiz "${entry.component_name}" - could not resolve a valid column index`, entry);
          }
        });

        if (examEntries.length > 0) {
          gradeRow.midtermExam = examEntries[0].raw_score ?? "";
          const entryMax = Number(examEntries[0].max_score || 100);
          maxRow.midtermExam   = entryMax;
          if (loadedExamMax === null) loadedExamMax = entryMax;
          const key = `${localStudent.id}:midtermExam:${gradeLabel}`;
          nextEntryMap[key] = examEntries[0].entry_id;
          if (examEntries[0].is_locked) nextLockedEntries[key] = true;
        }

        nextGrades[localStudent.id]    = gradeRow;
        nextMaxScores[localStudent.id] = maxRow;
      });

      // Sync loaded max scores into headerMaxScores
      setHeaderMaxScores((prev) => {
        const nextWo = [...prev.writtenOutput];
        const nextPt = [...prev.performanceTasks];
        loadedWoMax.forEach((v, i) => { if (v !== null && i < nextWo.length) nextWo[i] = v; });
        loadedPtMax.forEach((v, i) => { if (v !== null && i < nextPt.length) nextPt[i] = v; });
        return {
          writtenOutput: nextWo,
          performanceTasks: nextPt,
          midtermExam: loadedExamMax !== null ? loadedExamMax : prev.midtermExam,
        };
      });

      if (Object.keys(nextGrades).length > 0)    setGrades((prev)    => ({ ...prev, ...nextGrades }));
      if (Object.keys(nextMaxScores).length > 0) setMaxScores((prev) => ({ ...prev, ...nextMaxScores }));
      setEntryMap(nextEntryMap);
      setLockedEntries(nextLockedEntries);

      console.log(`[GradeEncoding] Successfully loaded grades for ${Object.keys(nextGrades).length} students`);
    } catch (error) {
      console.error("Error loading grade entries:", error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse, activePeriodId, students, period, colCounts, growColumns]);

  const fetchActivityMeta = useCallback(async () => {
    if (!selectedCourse || !activePeriodId) return;
    try {
      const facultyId = Number(localStorage.getItem("userId") || localStorage.getItem("user_id") || 0);
      const response  = await axios.get(`${API_BASE}/api/lms/assignments/faculty`, {
        params: { faculty_id: facultyId, academic_period_id: activePeriodId },
      });
      const assignments = response.data?.assignments || [];
      const courseAssignments = assignments
        .filter((item) => String(item.course_id) === String(selectedCourse))
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

      const assignmentCount = courseAssignments.filter((i) => String(i.assignment_type || "assignment").toLowerCase() === "assignment").length;
      const quizCount       = courseAssignments.filter((i) => String(i.assignment_type || "").toLowerCase() === "quiz").length;
      const neededWo = Math.min(MAX_COLUMNS, Math.max(colCounts.writtenOutput, assignmentCount));
      const neededPt = Math.min(MAX_COLUMNS, Math.max(colCounts.performanceTasks, quizCount));
      if (neededWo > colCounts.writtenOutput) growColumns("writtenOutput", neededWo);
      if (neededPt > colCounts.performanceTasks) growColumns("performanceTasks", neededPt);

      const nextMeta = EMPTY_ACTIVITY_META(neededWo, neededPt);
      let wi = 0, pi = 0;
      courseAssignments.forEach((item) => {
        const type     = String(item.assignment_type || "assignment").toLowerCase();
        const label    = item.title || item.assignment_name || "Activity";
        const maxScore = Number(item.total_points || 100);
        if (type === "quiz")       { if (pi < neededPt) { nextMeta.performanceTasks[pi++] = { label, maxScore }; } return; }
        if (type === "exam")       { nextMeta.midtermExam = { label, maxScore }; return; }
        if (type === "assignment") { if (wi < neededWo) { nextMeta.writtenOutput[wi++]    = { label, maxScore }; } }
      });
      setActivityMeta(nextMeta);
    } catch (error) {
      console.error("[GradeEncoding] failed to load activity meta:", error);
      setActivityMeta(EMPTY_ACTIVITY_META(colCounts.writtenOutput, colCounts.performanceTasks));
    }
  }, [selectedCourse, activePeriodId, colCounts, growColumns]);

  useEffect(() => { loadExistingGradeEntries(); }, [loadExistingGradeEntries]);
  useEffect(() => { fetchActivityMeta(); },         [fetchActivityMeta]);

  // ─── LMS sync ─────────────────────────────────────────────────────────────
  const syncFromLMS = useCallback(async () => {
    if (!selectedCourse)  { alert("Please select a course before syncing."); return; }
    if (!activePeriodId)  { alert("❌ Error: No active academic period found."); return; }
    try {
      setLoading(true);
      const facultyId = Number(localStorage.getItem("userId") || localStorage.getItem("user_id") || 0);
      const response  = await axios.post(
        `${API_BASE}/api/grade-entries/sync/submissions?course_id=${selectedCourse}&period_id=${activePeriodId}`,
        { submitted_by: facultyId },
      );
      if (response.data?.success) {
        await loadExistingGradeEntries();
      } else {
        alert(response.data?.message || "Sync completed but no records were synced");
      }
    } catch (error) {
      console.error("Error syncing from LMS:", error);
      alert(`❌ Sync failed:\n${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, activePeriodId, loadExistingGradeEntries]);

  // Auto-sync on mount/refresh was removed intentionally: it was firing on
  // every page load (lastAutoSyncRef resets on refresh since it's in-memory)
  // and silently overwriting manually-entered/adjusted grades with raw LMS
  // submission scores. Faculty must now click "Sync from LMS" explicitly.
  // lastAutoSyncRef is no longer used but left in place in case a future
  // session-scoped auto-sync (e.g. gated by sessionStorage) is reintroduced.

  // ─── Save ──────────────────────────────────────────────────────────────────
  // NOTE: Locked entries (lockedEntries[...] === true) are now skipped entirely —
  // we never build or send a request for them. Sending a PUT for a locked entry
  // always fails on the backend ("This grade entry is locked and cannot be
  // modified"), so filtering them out here removes those failures and avoids
  // wasted network calls. A `skippedLocked` counter is surfaced in the final
  // alert so faculty know some cells were intentionally not saved.
  const handleSave = async () => {
    if (!selectedCourse)  { alert("Please select a course before saving."); return; }
    if (!activePeriodId)  { alert("No active academic period found."); return; }
    const facultyId = Number(localStorage.getItem("userId") || localStorage.getItem("user_id") || 0);
    if (!facultyId) { alert("Faculty account not detected. Please log in again."); return; }

    const labelMap   = { midterm: "midterm", final: "tentative_final" };
    const gradeLabel = labelMap[period] || "midterm";

    try {
      setLoading(true);
      const requests = [];
      let skippedLocked = 0;

      filteredStudents.forEach((student) => {
        if (!student.userId) return;
        const gradeRow = grades[student.id] || EMPTY_GRADE(woCount, ptCount);

        const writtenItemWeight     = CAMPUS_SECTION_WEIGHTS.writtenOutput   / (gradeRow.writtenOutput.length || 1);
        const performanceItemWeight = CAMPUS_SECTION_WEIGHTS.performanceTasks / (gradeRow.performanceTasks.length || 1);

        gradeRow.writtenOutput.forEach((score, idx) => {
          const normalized = normalizeNumber(score);
          if (normalized === null) return;

          // Skip locked entries — sending these always fails on the backend.
          const lockKey = `${student.id}:writtenOutput:${idx}:${gradeLabel}`;
          if (lockedEntries[lockKey]) { skippedLocked++; return; }

          const payload = {
            student_id: student.userId, course_id: Number(selectedCourse), period_id: Number(activePeriodId),
            component_name: `Written Output ${idx + 1}`, component_type: "assignment",
            raw_score: normalized,
            // Use the header max score for this column
            max_score: headerMaxScores.writtenOutput[idx] ?? 100,
            weight: Number(writtenItemWeight.toFixed(2)),
            submitted_by: facultyId,
            label: gradeLabel,
          };
          const existingId = entryMap[lockKey];
          requests.push(existingId
            ? axios.put(`${API_BASE}/api/grade-entries/${existingId}`, payload)
            : axios.post(`${API_BASE}/api/grade-entries`, payload));
        });

        gradeRow.performanceTasks.forEach((score, idx) => {
          const normalized = normalizeNumber(score);
          if (normalized === null) return;

          // Skip locked entries — sending these always fails on the backend.
          const lockKey = `${student.id}:performanceTasks:${idx}:${gradeLabel}`;
          if (lockedEntries[lockKey]) { skippedLocked++; return; }

          const payload = {
            student_id: student.userId, course_id: Number(selectedCourse), period_id: Number(activePeriodId),
            component_name: `Performance Task ${idx + 1}`, component_type: "quiz",
            raw_score: normalized,
            // Use the header max score for this column
            max_score: headerMaxScores.performanceTasks[idx] ?? 100,
            weight: Number(performanceItemWeight.toFixed(2)),
            submitted_by: facultyId,
            label: gradeLabel,
          };
          const existingId = entryMap[lockKey];
          requests.push(existingId
            ? axios.put(`${API_BASE}/api/grade-entries/${existingId}`, payload)
            : axios.post(`${API_BASE}/api/grade-entries`, payload));
        });

        const midterm = normalizeNumber(gradeRow.midtermExam);
        if (midterm !== null) {
          // Skip a locked exam entry — sending it always fails on the backend.
          const lockKey = `${student.id}:midtermExam:${gradeLabel}`;
          if (lockedEntries[lockKey]) {
            skippedLocked++;
          } else {
            const payload = {
              student_id: student.userId, course_id: Number(selectedCourse), period_id: Number(activePeriodId),
              component_name: "Midterm Exam", component_type: "exam",
              raw_score: midterm,
              // Use the header max score for the exam
              max_score: headerMaxScores.midtermExam ?? 100,
              weight: CAMPUS_SECTION_WEIGHTS.midtermExam, submitted_by: facultyId,
              label: gradeLabel,
            };
            const existingId = entryMap[lockKey];
            requests.push(existingId
              ? axios.put(`${API_BASE}/api/grade-entries/${existingId}`, payload)
              : axios.post(`${API_BASE}/api/grade-entries`, payload));
          }
        }
      });

      if (requests.length === 0) {
        // Simplified per request: no more "X locked entries were skipped"
        // baked into the message — just a plain, centered toast.
        toast.info("No grade entries to save.", { position: "top-center" });
        return;
      }
      const results = await Promise.allSettled(requests);
      const failed  = results.filter((r) => r.status === "rejected").length;

      if (failed > 0) {
        toast.error(`Grades saved with ${failed} failed request(s). Check console for details.`, {
          position: "top-center",
        });
      } else {
        // GANTO LANG: just "Grades saved successfully." — no locked-entry
        // count appended. That detail still gets logged to the console for
        // debugging, it's just not shown to the user anymore.
        toast.success("Grades saved successfully.", { position: "top-center" });
      }
      if (skippedLocked > 0) {
        console.log(`[GradeEncoding] ${skippedLocked} locked entr${skippedLocked === 1 ? "y was" : "ies were"} skipped on save.`);
      }
      await loadExistingGradeEntries();
    } catch (error) {
      console.error("Error saving grades:", error);
      toast.error(error.response?.data?.error || error.message || "Failed to save grades", {
        position: "top-center",
      });
    } finally {
      setLoading(false);
    }
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const safeActivityMeta     = activityMeta || EMPTY_ACTIVITY_META(woCount, ptCount);

  // Compute header totals — only sum columns where faculty has actually entered a value.
  // Show "—" when no column in the section has been set yet.
  const woMaxValues   = headerMaxScores.writtenOutput.slice(0, woCount);
  const ptMaxValues   = headerMaxScores.performanceTasks.slice(0, ptCount);
  const woAnySet      = woMaxValues.some((v) => v !== null);
  const ptAnySet      = ptMaxValues.some((v) => v !== null);
  const writtenHeaderTotal     = woAnySet ? woMaxValues.reduce((s, v) => s + (v !== null ? Number(v) : 0), 0) : null;
  const performanceHeaderTotal = ptAnySet ? ptMaxValues.reduce((s, v) => s + (v !== null ? Number(v) : 0), 0) : null;

  const getCourseName = () => {
    if (!selectedCourse) return "All Courses";
    const course = courses.find((c) => String(c.id) === String(selectedCourse));
    return course ? `${course.code ? `${course.code} - ` : ""}${course.name}` : "Selected Course";
  };

  const getScopeLabel = () => {
    const parts = [];
    if (selectedSection)   parts.push(`Section ${selectedSection}`);
    if (selectedYearLevel) parts.push(`Year ${selectedYearLevel}`);
    return parts.join(" | ");
  };

  // ─── Export to Excel ───────────────────────────────────────────────────────
  const handleExportToExcel = async () => {
    try {
      const scopeLabel = getScopeLabel();
      await exportGradeEncoding({
        courseName: scopeLabel ? `${getCourseName()} - ${scopeLabel}` : getCourseName(),
        students: filteredStudents,
        gradesMap,
        // Use the reconciled per-student map (built from the same header
        // max scores shown on screen) so the exported file can't disagree
        // with what faculty see in the encoding table.
        maxScoresMap: effectiveMaxScoresMap,
        activityMeta: safeActivityMeta,
        mode: "all",
        columnCounts: { writtenOutput: woCount, performanceTasks: ptCount },
      });
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export grades: " + error.message);
    }
  };

  // ─── Import Excel ──────────────────────────────────────────────────────────
  const handleImportExcel = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const data      = await file.arrayBuffer();
      const workbook  = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows      = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
      const headerIndex = rows.findIndex((row) => String(row?.[0] || "").toLowerCase() === "student");
      if (headerIndex === -1) throw new Error("Could not find the grade table header in the Excel file");

      const woStart = 2;
      const ptStart = woStart + woCount + 3;
      const examCol = ptStart + ptCount + 3;
      const woColumns = Array.from({ length: woCount }, (_, i) => woStart + i);
      const ptColumns = Array.from({ length: ptCount }, (_, i) => ptStart + i);

      const importedGrades = {};
      rows.slice(headerIndex + 2).forEach((row) => {
        const studentName = row?.[0];
        if (!studentName) return;
        const matchingStudent = filteredStudents.find(
          (s) => `${s.lastName}, ${s.firstName}`.trim().toLowerCase() === String(studentName).toLowerCase()
        );
        if (!matchingStudent) return;
        importedGrades[matchingStudent.id] = {
          writtenOutput:    woColumns.map((c) => (row[c] === "" ? "" : row[c])),
          performanceTasks: ptColumns.map((c) => (row[c] === "" ? "" : row[c])),
          midtermExam: row[examCol] === "" ? "" : row[examCol],
        };
      });

      setGrades((prev) => ({ ...prev, ...importedGrades }));
      alert("Grades imported successfully.");
    } catch (error) {
      console.error("Error importing Excel file:", error);
      alert(`Failed to import Excel file: ${error.message}`);
    }
  };

  // ─── Grading report data ───────────────────────────────────────────────────
  const getReportRow = (student) => {
    const mGradeRow      = (gradesMap["midterm"]   || {})[student.id] || EMPTY_GRADE(woCount, ptCount);
    const fGradeRow      = (gradesMap["final"]      || {})[student.id] || EMPTY_GRADE(woCount, ptCount);

    // Midterm and Final now each keep their OWN header max scores (no
    // longer shared/inherited between tabs), so each grade must be computed
    // against ITS OWN period's effective max row — not whichever tab
    // happens to be selected in the UI right now. Otherwise, viewing the
    // report while on the Midterm tab would silently use Midterm's max
    // scores to grade the Final period too.
    const midtermGrade   = calculateFinalGrade(mGradeRow, effectiveMaxRowFor("midterm"));
    const tentativeFinal = calculateFinalGrade(fGradeRow, effectiveMaxRowFor("final"));

    const combinedFinal =
      midtermGrade !== null && tentativeFinal !== null
        ? Number(((midtermGrade + tentativeFinal) / 2).toFixed(2))
        : null;

    const numEquiv = getNumericalEquivalent(combinedFinal);
    return { midtermGrade, tentativeFinal, combinedFinal, numEquiv };
  };

  const handleSaveReportGrades = async () => {
    if (!selectedCourse) { alert("Please select a course before saving report grades."); return; }
    if (!activePeriodId) { alert("No active academic period found."); return; }

    try {
      setLoading(true);
      const reportGrades = filteredStudents
        .map((student) => {
          if (!student.userId) return null;

          const { midtermGrade, tentativeFinal, combinedFinal, numEquiv } = getReportRow(student);
          if (midtermGrade === null && tentativeFinal === null && combinedFinal === null) return null;

          return {
            student_user_id: student.userId,
            course_id: Number(selectedCourse),
            period_id: Number(activePeriodId),
            midterm_grade: midtermGrade,
            finals_grade: tentativeFinal,
            final_grade: combinedFinal,
            remarks: numEquiv === null ? null : numEquiv <= 4 ? "PASSED" : "FAILED",
            status: combinedFinal === null ? "draft" : "submitted",
          };
        })
        .filter(Boolean);

      if (reportGrades.length === 0) {
        alert("No report grades to save.");
        return;
      }

      const response = await axios.post(`${API_BASE}/api/grades/bulk/upsert`, {
        grades: reportGrades,
      });

      alert(response.data?.message || "Report grades saved successfully.");
    } catch (error) {
      console.error("Error saving report grades:", error);
      alert(error.response?.data?.error || error.message || "Failed to save report grades");
    } finally {
      setLoading(false);
    }
  };

  // ─── Column header add/remove control ──────────────────────────────────────
  const ColumnControls = ({ section }) => {
    if (view !== "encoding") return null;
    return (
      <span className="ml-2 inline-flex items-center gap-1 align-middle">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleAddColumn(section); }}
          title={`Add ${section === "writtenOutput" ? "written output" : "performance task"} column`}
          className="inline-flex h-5 w-5 items-center justify-center rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <Plus size={12} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleRemoveColumn(section); }}
          disabled={colCounts[section] <= MIN_COLUMNS}
          title={`Remove last ${section === "writtenOutput" ? "written output" : "performance task"} column`}
          className="inline-flex h-5 w-5 items-center justify-center rounded bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus size={12} />
        </button>
      </span>
    );
  };

  const totalColumns = woCount + ptCount + 14;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-4">
      {/* Renders the toast.success/toast.error notifications used by
          handleSave, etc. Only needs to exist once per app — if a
          <ToastContainer /> is already mounted higher up (e.g. in App.jsx),
          this one is redundant and can be removed. */}
      <ToastContainer position="top-center" autoClose={3000} />

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Grade Encoding</h1>
          <p className="text-sm text-slate-500">Campus grading sheet with editable Excel import/export</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Users size={16} />
          {filteredStudents.length} students
        </div>
      </div>

      {/* ── Period + View toggles ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          <span className="px-3 py-2 text-xs font-medium text-slate-500 border-r border-slate-200 flex items-center gap-1">
            <BookOpen size={14} /> Period
          </span>
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                period === p ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setView("encoding")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
              view === "encoding" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <TableProperties size={14} /> Grade Encoding
          </button>
          <button
            type="button"
            onClick={() => setView("report")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-l border-slate-200 ${
              view === "report" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <ClipboardList size={14} /> Grading Report
          </button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student ID or name"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code ? `${c.code} - ` : ""}{c.name}
              </option>
            ))}
          </select>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            disabled={!selectedCourse}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="">All Sections</option>
            {availableSections.map((section) => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
          <select
            value={selectedYearLevel}
            onChange={(e) => setSelectedYearLevel(e.target.value)}
            disabled={!selectedCourse}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="">All Year Levels</option>
            {availableYearLevels.map((yearLevel) => (
              <option key={yearLevel} value={yearLevel}>{yearLevel}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {view === "encoding" && (
            <>
              <button type="button" onClick={() => setGrades({})} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Reset
              </button>
              <button
                type="button"
                onClick={syncFromLMS}
                disabled={loading || !selectedCourse}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={16} /> Sync from LMS
              </button>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Upload size={16} /> Import Excel
                <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
              </label>
            </>
          )}
          {view === "report" && (
            <button
              type="button"
              onClick={handleSaveReportGrades}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save size={16} /> {loading ? "Saving..." : "Save Grade"}
            </button>
          )}
          <button type="button" onClick={handleExportToExcel} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Download size={16} /> Export Excel
          </button>
          {view === "encoding" && (
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save size={16} /> {loading ? "Saving..." : "Save Grades"}
            </button>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  VIEW: GRADE ENCODING                                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {view === "encoding" && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table
            className="w-full border-collapse text-xs"
            style={{ minWidth: `${900 + (woCount + ptCount) * 70}px` }}
          >
            <thead>
              {/* ── Row 1: Section group headers ── */}
              <tr className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <th rowSpan="3" className="border border-slate-200 px-3 py-3 text-left whitespace-nowrap">Student</th>
                <th rowSpan="3" className="border border-slate-200 px-3 py-3 text-left whitespace-nowrap">ID Number</th>
                <th colSpan={woCount + 3} className="border border-slate-200 px-3 py-2 text-center bg-blue-50">
                  <span className="whitespace-nowrap">
                    Written Output {CAMPUS_SECTION_WEIGHTS.writtenOutput}%
                    <ColumnControls section="writtenOutput" />
                  </span>
                </th>
                <th colSpan={ptCount + 3} className="border border-slate-200 px-3 py-2 text-center bg-emerald-50">
                  <span className="whitespace-nowrap">
                    Performance Task {CAMPUS_SECTION_WEIGHTS.performanceTasks}%
                    <ColumnControls section="performanceTasks" />
                  </span>
                </th>
                <th colSpan="3" className="border border-slate-200 px-3 py-2 text-center bg-amber-50">
                  {PERIOD_LABELS[period]} Exam {CAMPUS_SECTION_WEIGHTS.midtermExam}%
                </th>
                <th rowSpan="3" className="border border-slate-200 px-3 py-3 text-center bg-violet-50 whitespace-nowrap">Final</th>
                <th rowSpan="3" className="border border-slate-200 px-3 py-3 text-center whitespace-nowrap">Equiv.</th>
                <th rowSpan="3" className="border border-slate-200 px-3 py-3 text-center whitespace-nowrap">Status</th>
              </tr>

              {/* ── Row 2: Column index numbers + subtotals ── */}
              <tr className="bg-slate-50 text-xs text-slate-500 text-center">
                {Array.from({ length: woCount }).map((_, i) => (
                  <th key={`wh-${i}`} className="border border-slate-200 px-2 py-2">{i + 1}</th>
                ))}
                <th className="border border-slate-200 px-2 py-2 bg-blue-50 whitespace-nowrap">Total</th>
                <th className="border border-slate-200 px-2 py-2 bg-blue-50 whitespace-nowrap">Rating</th>
                <th className="border border-slate-200 px-2 py-2 bg-blue-50 whitespace-nowrap">%</th>
                {Array.from({ length: ptCount }).map((_, i) => (
                  <th key={`ph-${i}`} className="border border-slate-200 px-2 py-2">{i + 1}</th>
                ))}
                <th className="border border-slate-200 px-2 py-2 bg-emerald-50 whitespace-nowrap">Total</th>
                <th className="border border-slate-200 px-2 py-2 bg-emerald-50 whitespace-nowrap">Rating</th>
                <th className="border border-slate-200 px-2 py-2 bg-emerald-50 whitespace-nowrap">%</th>
                <th className="border border-slate-200 px-2 py-2 bg-amber-50 whitespace-nowrap">Score</th>
                <th className="border border-slate-200 px-2 py-2 bg-amber-50 whitespace-nowrap">Rating</th>
                <th className="border border-slate-200 px-2 py-2 bg-amber-50 whitespace-nowrap">%</th>
              </tr>

              {/* ── Row 3: EDITABLE max score inputs per column ── */}
              <tr className="bg-white text-[11px] text-slate-500 text-center">
                {/* Written Output max score inputs — empty until faculty sets a value */}
                {Array.from({ length: woCount }).map((_, i) => (
                  <th key={`wm-${i}`} className="border border-slate-200 px-1 py-1">
                    <input
                      type="number"
                      min="1"
                      value={headerMaxScores.writtenOutput[i] ?? ""}
                      placeholder="—"
                      onChange={(e) => handleHeaderMaxScoreChange("writtenOutput", i, e.target.value)}
                      className="w-14 rounded border border-slate-300 bg-white px-1 py-0.5 text-center text-[11px] text-slate-700 font-semibold placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 hover:border-indigo-400 transition-colors"
                      title={`Max score for Written Output ${i + 1} — click to set`}
                    />
                  </th>
                ))}
                {/* Written Output subtotal cells */}
                <th className="border border-slate-200 px-2 py-1 bg-blue-50 font-semibold text-slate-500">
                  {writtenHeaderTotal !== null ? writtenHeaderTotal : "—"}
                </th>
                <th className="border border-slate-200 px-2 py-1 bg-blue-50 font-semibold">100</th>
                <th className="border border-slate-200 px-2 py-1 bg-blue-50 font-semibold">{CAMPUS_SECTION_WEIGHTS.writtenOutput}%</th>

                {/* Performance Task max score inputs — empty until faculty sets a value */}
                {Array.from({ length: ptCount }).map((_, i) => (
                  <th key={`pm-${i}`} className="border border-slate-200 px-1 py-1">
                    <input
                      type="number"
                      min="1"
                      value={headerMaxScores.performanceTasks[i] ?? ""}
                      placeholder="—"
                      onChange={(e) => handleHeaderMaxScoreChange("performanceTasks", i, e.target.value)}
                      className="w-14 rounded border border-slate-300 bg-white px-1 py-0.5 text-center text-[11px] text-slate-700 font-semibold placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 hover:border-indigo-400 transition-colors"
                      title={`Max score for Performance Task ${i + 1} — click to set`}
                    />
                  </th>
                ))}
                {/* Performance Task subtotal cells */}
                <th className="border border-slate-200 px-2 py-1 bg-emerald-50 font-semibold text-slate-500">
                  {performanceHeaderTotal !== null ? performanceHeaderTotal : "—"}
                </th>
                <th className="border border-slate-200 px-2 py-1 bg-emerald-50 font-semibold">100</th>
                <th className="border border-slate-200 px-2 py-1 bg-emerald-50 font-semibold">{CAMPUS_SECTION_WEIGHTS.performanceTasks}%</th>

                {/* Exam max score input — empty until faculty sets a value */}
                <th className="border border-slate-200 px-1 py-1 bg-amber-50">
                  <input
                    type="number"
                    min="1"
                    value={headerMaxScores.midtermExam ?? ""}
                    placeholder="—"
                    onChange={(e) => handleHeaderMaxScoreChange("midtermExam", null, e.target.value)}
                    className="w-14 rounded border border-slate-300 bg-white px-1 py-0.5 text-center text-[11px] text-slate-700 font-semibold placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 hover:border-indigo-400 transition-colors"
                    title="Max score for exam — click to set"
                  />
                </th>
                <th className="border border-slate-200 px-2 py-1 bg-amber-50 font-semibold">100</th>
                <th className="border border-slate-200 px-2 py-1 bg-amber-50 font-semibold">{CAMPUS_SECTION_WEIGHTS.midtermExam}%</th>
              </tr>
            </thead>

            <tbody>
              {currentStudents.length === 0 ? (
                <tr>
                  <td colSpan={totalColumns} className="px-4 py-8 text-center text-sm text-slate-500">
                    {loading ? "Loading grade data..." : "No students found"}
                  </td>
                </tr>
              ) : (
                currentStudents.map((student) => {
                  const gradeRow        = grades[student.id] || EMPTY_GRADE(woCount, ptCount);
                  // Always use the single shared effectiveMaxRow (derived from
                  // the header inputs) rather than a per-student stored max —
                  // see the effectiveMaxRow comment above for why.
                  const maxRow          = effectiveMaxRow;
                  const written         = calculateSectionStats(gradeRow.writtenOutput,    maxRow.writtenOutput,    CAMPUS_SECTION_WEIGHTS.writtenOutput);
                  const performance     = calculateSectionStats(gradeRow.performanceTasks, maxRow.performanceTasks, CAMPUS_SECTION_WEIGHTS.performanceTasks);
                  const midtermWeighted = calculateMidtermWeighted(gradeRow.midtermExam, maxRow.midtermExam);
                  const finalGrade      = calculateFinalGrade(gradeRow, maxRow);
                  const letterInfo      = getLetterInfo(finalGrade);
                  const midtermRaw      = normalizeNumber(gradeRow.midtermExam);

                  return (
                    <tr key={student.id} className="border-t border-slate-200 text-xs hover:bg-slate-50">
                      <td className="border border-slate-200 px-3 py-2 font-medium text-slate-900 whitespace-nowrap">
                        {student.lastName}, {student.firstName}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-600 whitespace-nowrap">{student.studentId}</td>

                      {/* Written Output — dynamic input cells */}
                      {Array.from({ length: woCount }).map((_, idx) => {
                        const lockKey  = `${student.id}:writtenOutput:${idx}:${currentLabel}`;
                        const isLocked = lockedEntries[lockKey];
                        return (
                          <td key={`w-${idx}`} className={`border border-slate-200 px-1 py-1 ${isLocked ? "bg-gray-100" : "bg-blue-50"} text-center`}>
                            <input
                              type="number" min="0"
                              max={headerMaxScores.writtenOutput[idx] ?? 100}
                              value={gradeRow.writtenOutput[idx] ?? ""}
                              onChange={(e) => handleGradeChange(student.id, "writtenOutput", idx, e.target.value)}
                              disabled={isLocked}
                              className={`w-14 rounded border ${isLocked ? "border-gray-300 bg-gray-200 cursor-not-allowed" : "border-slate-300"} px-1 py-1 text-center text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20`}
                              title={isLocked ? "This grade is locked and cannot be edited" : `Max: ${headerMaxScores.writtenOutput[idx] ?? 100}`}
                            />
                          </td>
                        );
                      })}
                      <td className="border border-slate-200 bg-blue-100 px-2 py-2 text-center font-semibold text-slate-700">
                        {written.totalScore.toFixed(2)}
                      </td>
                      <td className="border border-slate-200 bg-blue-100 px-2 py-2 text-center font-semibold text-slate-700">
                        {written.percent.toFixed(2)}
                      </td>
                      <td className="border border-slate-200 bg-blue-100 px-2 py-2 text-center font-semibold text-slate-700">
                        {written.weightedScore.toFixed(2)}
                      </td>

                      {/* Performance Tasks — dynamic input cells */}
                      {Array.from({ length: ptCount }).map((_, idx) => {
                        const lockKey  = `${student.id}:performanceTasks:${idx}:${currentLabel}`;
                        const isLocked = lockedEntries[lockKey];
                        return (
                          <td key={`p-${idx}`} className={`border border-slate-200 px-1 py-1 ${isLocked ? "bg-gray-100" : "bg-emerald-50"} text-center`}>
                            <input
                              type="number" min="0"
                              max={headerMaxScores.performanceTasks[idx] ?? 100}
                              value={gradeRow.performanceTasks[idx] ?? ""}
                              onChange={(e) => handleGradeChange(student.id, "performanceTasks", idx, e.target.value)}
                              disabled={isLocked}
                              className={`w-14 rounded border ${isLocked ? "border-gray-300 bg-gray-200 cursor-not-allowed" : "border-slate-300"} px-1 py-1 text-center text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20`}
                              title={isLocked ? "This grade is locked and cannot be edited" : `Max: ${headerMaxScores.performanceTasks[idx] ?? 100}`}
                            />
                          </td>
                        );
                      })}
                      <td className="border border-slate-200 bg-emerald-100 px-2 py-2 text-center font-semibold text-slate-700">
                        {performance.totalScore.toFixed(2)}
                      </td>
                      <td className="border border-slate-200 bg-emerald-100 px-2 py-2 text-center font-semibold text-slate-700">
                        {performance.percent.toFixed(2)}
                      </td>
                      <td className="border border-slate-200 bg-emerald-100 px-2 py-2 text-center font-semibold text-slate-700">
                        {performance.weightedScore.toFixed(2)}
                      </td>

                      {/* Exam input */}
                      {(() => {
                        const lockKey  = `${student.id}:midtermExam:${currentLabel}`;
                        const isLocked = lockedEntries[lockKey];
                        return (
                          <td className={`border border-slate-200 px-1 py-1 ${isLocked ? "bg-gray-100" : "bg-amber-50"} text-center`}>
                            <input
                              type="number" min="0"
                              max={headerMaxScores.midtermExam ?? 100}
                              value={gradeRow.midtermExam ?? ""}
                              onChange={(e) => handleGradeChange(student.id, "midtermExam", null, e.target.value)}
                              disabled={isLocked}
                              className={`w-16 rounded border ${isLocked ? "border-gray-300 bg-gray-200 cursor-not-allowed" : "border-slate-300"} px-1 py-1 text-center text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20`}
                              title={isLocked ? "This grade is locked and cannot be edited" : `Max: ${headerMaxScores.midtermExam ?? 100}`}
                            />
                          </td>
                        );
                      })()}
                      <td className="border border-slate-200 bg-amber-100 px-2 py-2 text-center font-semibold text-slate-700">
                        {midtermRaw === null ? "-" : ((midtermRaw / (maxRow.midtermExam || 100)) * 100).toFixed(2)}
                      </td>
                      <td className="border border-slate-200 bg-amber-100 px-2 py-2 text-center font-semibold text-slate-700">
                        {midtermWeighted.toFixed(2)}
                      </td>

                      {/* Final / Equiv / Status */}
                      <td className="border border-slate-200 bg-violet-50 px-3 py-2 text-center font-bold text-violet-700">
                        {finalGrade === null ? "-" : finalGrade.toFixed(2)}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-center text-slate-700">
                        {letterInfo.equivalent}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-center">
                        <span className={`rounded px-2 py-1 text-xs font-semibold ${
                          letterInfo.status === "PASSED" ? "bg-green-100 text-green-800" :
                          letterInfo.status === "FAILED" ? "bg-red-100 text-red-800" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {letterInfo.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  VIEW: GRADING REPORT                                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {view === "report" && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[900px] w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800 text-white text-xs font-semibold uppercase tracking-wide">
                <th className="border border-slate-600 px-3 py-3 text-center w-10">#</th>
                <th className="border border-slate-600 px-3 py-3 text-left">
                  Student Name
                  <div className="text-[10px] font-normal text-slate-400 normal-case tracking-normal">(Last Name, First Name Middle Name)</div>
                </th>
                <th className="border border-slate-600 px-3 py-3 text-center whitespace-nowrap">I.D. Number</th>
                <th className="border border-slate-600 px-3 py-3 text-center whitespace-nowrap">Midterm Grade</th>
                <th className="border border-slate-600 px-3 py-3 text-center whitespace-nowrap">
                  Tentative Final<br />Grade
                </th>
                <th className="border border-slate-600 px-3 py-3 text-center whitespace-nowrap">
                  Final Grade<br />(MG + TFG)/2
                </th>
                <th className="border border-slate-600 px-3 py-3 text-center whitespace-nowrap">Numerical<br />Equivalent</th>
                <th className="border border-slate-600 px-3 py-3 text-center whitespace-nowrap">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {currentStudents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-sm text-slate-500">
                    {loading ? "Loading..." : "No students found"}
                  </td>
                </tr>
              ) : (
                currentStudents.map((student, i) => {
                  const { midtermGrade, tentativeFinal, combinedFinal, numEquiv } = getReportRow(student);
                  const isPassed = numEquiv !== null && numEquiv <= 4;
                  const isFailed = numEquiv !== null && numEquiv > 4;
                  const rowNum   = (currentPage - 1) * itemsPerPage + i + 1;

                  return (
                    <tr key={student.id} className={`border-t border-slate-200 text-xs ${i % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-blue-50`}>
                      <td className="border border-slate-200 px-3 py-2 text-center text-slate-500 font-medium">{rowNum}</td>
                      <td className="border border-slate-200 px-3 py-2 font-medium text-slate-900 uppercase">
                        {student.lastName}, {student.firstName}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-center text-slate-700">{student.studentId}</td>
                      <td className="border border-slate-200 px-3 py-2 text-center font-semibold text-slate-800">
                        {midtermGrade !== null ? midtermGrade.toFixed(0) : "-"}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-center font-semibold text-slate-800">
                        {tentativeFinal !== null ? tentativeFinal.toFixed(0) : "-"}
                      </td>
                      <td className={`border border-slate-200 px-3 py-2 text-center font-semibold ${isFailed ? "bg-red-50 text-red-700" : "text-slate-800"}`}>
                        {combinedFinal !== null ? combinedFinal.toFixed(0) : "-"}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-center font-semibold text-slate-700">
                        {numEquiv !== null ? numEquiv.toFixed(2) : "-"}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-center">
                        <span className={`rounded px-2 py-1 text-xs font-bold border ${
                          isPassed ? "bg-green-50 text-green-700 border-green-300" :
                          isFailed ? "bg-red-50 text-red-700 border-red-300" :
                          "bg-slate-100 text-slate-500 border-slate-300"
                        }`}>
                          {numEquiv !== null ? (isPassed ? "PASSED" : "FAILED") : "-"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        <div>
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredStudents.length)}–
          {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1 rounded border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <span className="px-2 font-medium text-slate-900">{currentPage}</span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="inline-flex items-center gap-1 rounded border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GradeEncoding;