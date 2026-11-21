// services/enrollments.service.js
import * as enrollmentModel from "../model/enrollments.model.js";
import db from "../config/db.js";
import SectionsModel from "../model/sections.model.js";
import SectionsService from "./sections.service.js";
import { sendEnrollmentSubmittedEmail } from "./email.service.js";

// Validate and clean enrollment data.
// section_id is intentionally NOT required here - enrollment is just
// "this student is taking this subject this period." Sections get
// attached later in bulk via runSectioning(), or manually per-student via
// editEnrollment() if a registrar needs to override one student.
const validateEnrollmentData = (data) => {
  const errors = [];

  if (!data.student_id) errors.push("Student ID is required");
  if (!data.course_id) errors.push("Course ID is required");
  if (!data.period_id) errors.push("Academic Period ID is required");
  if (!data.year_level) errors.push("Year Level is required");
  if (!data.enrollment_date) errors.push("Enrollment Date is required");

  if (errors.length > 0) {
    throw new Error(errors.join(", "));
  }

  const cleanData = {
    ...data,
    section_id: data.section_id || null,
    midterm_grade: data.midterm_grade === "" || data.midterm_grade === null ? null : parseFloat(data.midterm_grade),
    final_grade: data.final_grade === "" || data.final_grade === null ? null : parseFloat(data.final_grade),
  };

  if (cleanData.midterm_grade !== null && (isNaN(cleanData.midterm_grade) || cleanData.midterm_grade < 0 || cleanData.midterm_grade > 100)) {
    throw new Error("Midterm Grade must be a valid number between 0 and 100");
  }
  if (cleanData.final_grade !== null && (isNaN(cleanData.final_grade) || cleanData.final_grade < 0 || cleanData.final_grade > 100)) {
    throw new Error("Final Grade must be a valid number between 0 and 100");
  }

  return cleanData;
};

const ensureCourseCurriculum = async (courseIds, curriculumType) => {
  if (!curriculumType || !courseIds.length) return;
  const normalizeCurriculum = (value) => String(value || "Old")
    .trim()
    .replace(/\s+curriculum$/i, "")
    .toLowerCase();
  const placeholders = courseIds.map(() => "?").join(", ");
  const [rows] = await db.query(
    `SELECT course_id, COALESCE(NULLIF(curriculum_type, ''), 'Old') AS curriculum_type
     FROM courses WHERE course_id IN (${placeholders})`,
    courseIds,
  );
  const expected = normalizeCurriculum(curriculumType);
  const mismatched = rows.filter((row) => normalizeCurriculum(row.curriculum_type) !== expected);
  if (mismatched.length) {
    throw new Error(`Selected course(s) do not belong to the ${curriculumType} Curriculum.`);
  }
};

// Get all enrollments
export const listEnrollments = async (filters = {}) => {
  return await enrollmentModel.getAllEnrollments(filters);
};

// Get enrollments by student
export const listEnrollmentsByStudent = async (studentId) => {
  return await enrollmentModel.getEnrollmentsByStudent(studentId);
};

// Get single enrollment
export const getEnrollment = async (id) => {
  const enrollment = await enrollmentModel.getEnrollmentById(id);
  if (!enrollment) throw new Error("Enrollment not found");
  return enrollment;
};

// Create new enrollment
// No section capacity check here anymore - enrollment always starts
// unsectioned (section_id = null). Sectioning happens afterward, in
// bulk, via runSectioning().
export const addEnrollment = async (data) => {
  const cleanData = validateEnrollmentData(data);
  await ensureCourseCurriculum([cleanData.course_id], cleanData.curriculum_type);

  const exists = await enrollmentModel.checkEnrollmentExists(
    cleanData.student_id,
    cleanData.course_id,
    cleanData.period_id,
  );

  if (exists) {
    throw new Error(
      "Student is already enrolled in this course for this academic period",
    );
  }

  const enrollment = await enrollmentModel.createEnrollment(cleanData);

  try {
    const [studentRows] = await db.query(
      `SELECT email, first_name FROM users WHERE user_id = ?`,
      [cleanData.student_id],
    );

    if (studentRows.length > 0) {
      sendEnrollmentSubmittedEmail({
        to: studentRows[0].email,
        firstName: studentRows[0].first_name,
        course: enrollment.course_title || enrollment.course_code,
        schoolYear: enrollment.school_year,
        semester: enrollment.semester,
      }).catch((error) => console.error("Enrollment email failed:", error.message));
    }
  } catch (err) {
    console.error("Error preparing enrollment email:", err.message);
  }

  // Only relevant for the rare manual case where a section_id was passed
  // in directly (e.g. a legacy caller); normal enrollment leaves this
  // null and skips it entirely.
  if (cleanData.section_id) {
    await SectionsModel.updateEnrollmentCount(cleanData.section_id, true);
  }

  // Update admission status to "Enrolled" when student is first enrolled
  try {
    const [userResult] = await db.query(
      `SELECT email FROM users WHERE user_id = ?`,
      [cleanData.student_id],
    );

    if (userResult && userResult.length > 0) {
      const studentEmail = userResult[0].email;

      await db.query(
        `UPDATE admissions SET status = 'Enrolled' WHERE email = ? AND status = 'Accepted'`,
        [studentEmail],
      );
    }
  } catch (err) {
    console.error("Error updating admission status:", err);
    // Don't throw error - enrollment was already created successfully
  }

  return enrollment;
};

export const addEnrollments = async (data) => {
  const studentIds = [...new Set((data.student_ids || [data.student_id])
    .filter((studentId) => studentId !== null && studentId !== undefined && String(studentId).trim() !== "")
    .map((studentId) => String(studentId)))];
  const courseIds = [...new Set((data.course_ids || [])
    .filter((courseId) => courseId !== null && courseId !== undefined && String(courseId).trim() !== "")
    .map((courseId) => String(courseId)))];
  if (!studentIds.length) throw new Error("At least one Student ID is required");
  if (!courseIds.length) throw new Error("At least one Course ID is required");
  if (!data.curriculum_type) throw new Error("Curriculum Type is required for bulk enrollment");
  await ensureCourseCurriculum(courseIds, data.curriculum_type);

  const cleanEnrollments = studentIds.flatMap((studentId) => courseIds.map((courseId) =>
    validateEnrollmentData({
      ...data,
      student_id: studentId,
      course_id: courseId,
    }),
  ));

  const existingEnrollments = await enrollmentModel.findExistingEnrollments(
    studentIds,
    courseIds,
    cleanEnrollments[0].period_id,
  );
  const duplicates = existingEnrollments.map(
    ({ student_id, course_id }) => `student ${student_id}, course ${course_id}`,
  );
  if (duplicates.length) {
    const shownDuplicates = duplicates.slice(0, 10).join("; ");
    const remaining = duplicates.length > 10 ? `; and ${duplicates.length - 10} more` : "";
    throw new Error(`Some selected student/course combinations are already enrolled: ${shownDuplicates}${remaining}. Use Bulk Edit to update existing enrollments.`);
  }

  const createdEnrollments = await enrollmentModel.createEnrollments(cleanEnrollments);
  const studentIdPlaceholders = studentIds.map(() => "?").join(", ");
  try {
    const [studentRows] = await db.query(
      `SELECT user_id, email, first_name FROM users WHERE user_id IN (${studentIdPlaceholders})`,
      studentIds,
    );
    for (const student of studentRows) {
      const studentEnrollments = createdEnrollments.filter(
        (enrollment) => String(enrollment.student_id) === String(student.user_id),
      );
      if (!student.email || !studentEnrollments.length) continue;
      const courseNames = [...new Set(studentEnrollments.map(
        (enrollment) => enrollment.course_title || enrollment.course_code,
      ).filter(Boolean))];
      sendEnrollmentSubmittedEmail({
        to: student.email,
        firstName: student.first_name,
        course: courseNames.join(", "),
        schoolYear: studentEnrollments[0].school_year,
        semester: studentEnrollments[0].semester,
      }).catch((error) => console.error("Enrollment email failed:", error.message));
    }
  } catch (err) {
    console.error("Error preparing enrollment emails:", err.message);
  }

  const sectionId = cleanEnrollments[0].section_id;
  if (sectionId) {
    await db.query(
      "UPDATE sections SET current_enrolled = current_enrolled + ? WHERE section_id = ?",
      [createdEnrollments.length, sectionId],
    );
  }

  try {
    const studentEmails = [...new Set((await db.query(
      `SELECT email FROM users WHERE user_id IN (${studentIdPlaceholders})`,
      studentIds,
    ))[0].map((user) => user.email).filter(Boolean))];
    if (studentEmails.length) {
      const emailPlaceholders = studentEmails.map(() => "?").join(", ");
      await db.query(
        `UPDATE admissions SET status = 'Enrolled' WHERE email IN (${emailPlaceholders}) AND status = 'Accepted'`,
        studentEmails,
      );
    }
  } catch (err) {
    console.error("Error updating admission status:", err);
  }

  return createdEnrollments;
};

// Update enrollment
// section_id is optional here too. If a registrar manually sets/changes
// a section through the edit form, we still run the same capacity check
// and current_enrolled bookkeeping as before - just now it also covers
// the "going from no section to a section" case (oldSectionId is null),
// and the "clearing a section back to none" case.
export const editEnrollment = async (id, data) => {
  const cleanData = validateEnrollmentData(data);

  const existingEnrollment = await getEnrollment(id);
  const oldSectionId = existingEnrollment.section_id;
  const newSectionId = cleanData.section_id;

  const sectionChanged =
    newSectionId && String(oldSectionId || "") !== String(newSectionId);
  const sectionCleared = !!oldSectionId && !newSectionId;

  if (sectionChanged) {
    const targetSection = await SectionsModel.getSectionById(newSectionId);
    if (!targetSection) {
      throw new Error("Selected section does not exist");
    }
    if (targetSection.current_enrolled >= targetSection.max_capacity) {
      throw new Error("Selected section is already full");
    }
  }

  const updated = await enrollmentModel.updateEnrollment(id, cleanData);

  if (sectionChanged) {
    if (oldSectionId) {
      await SectionsModel.updateEnrollmentCount(oldSectionId, false); // -1 old
    }
    await SectionsModel.updateEnrollmentCount(newSectionId, true); // +1 new
  } else if (sectionCleared) {
    await SectionsModel.updateEnrollmentCount(oldSectionId, false);
  }

  return updated;
};

export const bulkEditEnrollments = async ({ student_ids, course_ids, period_id, updates = {} }) => {
  if (!period_id) throw new Error("Academic Period is required");
  if (!Array.isArray(student_ids) || !student_ids.length) throw new Error("Select at least one student");
  if (!Array.isArray(course_ids) || !course_ids.length) throw new Error("Select at least one course");

  const cleanUpdates = {};
  if (updates.enrollment_date) cleanUpdates.enrollment_date = updates.enrollment_date;
  if (updates.status) {
    const validStatuses = new Set(["Enrolled", "Dropped", "Completed", "Failed"]);
    if (!validStatuses.has(updates.status)) throw new Error("Invalid enrollment status");
    cleanUpdates.status = updates.status;
  }
  for (const field of ["midterm_grade", "final_grade"]) {
    if (updates[field] === undefined || updates[field] === null || updates[field] === "") continue;
    const grade = Number(updates[field]);
    if (!Number.isFinite(grade) || grade < 0 || grade > 100) {
      throw new Error(`${field === "midterm_grade" ? "Midterm" : "Final"} Grade must be between 0 and 100`);
    }
    cleanUpdates[field] = grade;
  }
  if (typeof updates.remarks === "string" && updates.remarks.trim()) {
    cleanUpdates.remarks = updates.remarks.trim();
  }
  if (!Object.keys(cleanUpdates).length) {
    throw new Error("Enter at least one field to update");
  }

  return enrollmentModel.bulkUpdateEnrollments({
    student_ids,
    course_ids,
    period_id,
    updates: cleanUpdates,
  });
};

// Delete enrollment
export const removeEnrollment = async (id) => {
  await getEnrollment(id);
  return await enrollmentModel.deleteEnrollment(id);
};

export const transferStudentSection = async (data) => {
  const { student_id, period_id, program_id, year_level, section_id } = data;
  if (!student_id || !period_id || !program_id || !year_level || !section_id) {
    throw new Error("Student, academic period, program, year level, and section are required");
  }
  const targetSection = await SectionsModel.getSectionById(section_id);
  if (!targetSection || targetSection.status === "inactive") {
    throw new Error("Selected section is unavailable");
  }
  return enrollmentModel.transferStudentSection({
    student_id, period_id, program_id, year_level, section_id,
  });
};

export const removeStudentPeriodEnrollments = async (student_id, period_id) => {
  if (!student_id || !period_id) throw new Error("Student and academic period are required");
  const deleted = await enrollmentModel.deleteStudentPeriodEnrollments(student_id, period_id);
  if (!deleted) throw new Error("No enrollment records were found for this student and period");
  return deleted;
};

// Get enrolled students by faculty assignment ID
export const listStudentsByAssignment = async (assignmentId) => {
  return await enrollmentModel.getStudentsByAssignment(assignmentId);
};

export const listStudentsByFaculty = async (facultyUserId) => {
  return await enrollmentModel.getStudentsByFaculty(facultyUserId);
};

// --- Sectioning (runs AFTER enrollment) ---
// Groups unsectioned students and assigns them to sections tied to their program.
// Ensures BPA students only go to BPA sections, BAHISTO students only to BAHISTO sections, etc.
export const runSectioning = async ({
  course_id,
  course_ids,
  period_id,
  program_id,
  year_level,
  curriculum_type,
}) => {
  if (!period_id) throw new Error("Academic Period ID is required");
  if (!year_level) throw new Error("Year Level is required to run sectioning");
  if (!curriculum_type) throw new Error("Curriculum Type is required to run sectioning");

  // Load the cohort first so we can replace its courses with the selected
  // curriculum's complete course set before assigning sections.
  const cohortEnrollments = await enrollmentModel.getUnsectionedEnrollments(
    [],
    period_id,
    program_id || null,
    year_level || null,
    null,
  );

  if (cohortEnrollments.length === 0) {
    return {
      assigned: [],
      failed: [],
      unassigned: [],
      skipped: [],
      summary: { totalEnrollments: 0, totalStudents: 0, assigned: 0, failed: 0, unassigned: 0 },
    };
  }

  // Group selected enrollment rows by program, then place each student once.
  const enrollmentsByProgram = new Map();
  for (const item of cohortEnrollments) {
    const progKey = item.program_id ? String(item.program_id) : "unspecified";
    if (!enrollmentsByProgram.has(progKey)) {
      enrollmentsByProgram.set(progKey, []);
    }
    enrollmentsByProgram.get(progKey).push(item);
  }

  const assigned = [];
  const failed = [];
  const unassigned = [];
  const skipped = [];
  const plannedAssignments = [];
  let synchronizedEnrollments = 0;
  let removedEnrollments = 0;
  // Fetch all sections for the period so legacy sections with a NULL
  // year_level remain eligible. The migration may not have been able to
  // infer a year from every existing section name.
  const sectionsForPeriod = await SectionsModel.getSectionsForPeriod(period_id);
  const requestedCourseIds = Array.isArray(course_ids) && course_ids.length
    ? course_ids
    : course_id ? [course_id] : [];

  for (const [progKey, studentsInProg] of enrollmentsByProgram.entries()) {
    const progId = progKey === "unspecified" ? null : Number(progKey);
    const candidateStudentIds = [...new Set(studentsInProg.map((item) => String(item.student_id)))];
    const selectedCourseIds = await enrollmentModel.getSectioningCourseIds(
      progId,
      candidateStudentIds,
      period_id,
      year_level,
      curriculum_type,
      requestedCourseIds,
    );
    if (!selectedCourseIds.length) {
      throw new Error(`No ${curriculum_type} Curriculum courses are available for this program, year level, and semester.`);
    }
    const syncResult = await enrollmentModel.synchronizeCohortCurriculum(
      candidateStudentIds, selectedCourseIds, period_id, year_level,
    );
    synchronizedEnrollments += syncResult.added;
    removedEnrollments += syncResult.removed;
    const curriculumEnrollments = await enrollmentModel.getUnsectionedEnrollments(
      selectedCourseIds,
      period_id,
      progId,
      year_level,
      curriculum_type,
    );
    const existingSections = await enrollmentModel.getExistingSectionAssignments(
      candidateStudentIds,
      period_id,
      progId,
      year_level,
    );
    const eligibleEnrollments = curriculumEnrollments;
    if (!eligibleEnrollments.length) continue;

    const sections = sectionsForPeriod.filter(
      (section) => String(section.program_id ?? "") === String(progId ?? "")
        && (!section.year_level || String(section.year_level).trim().toLowerCase() === String(year_level).trim().toLowerCase()),
    );

    const activeSections = sections.filter((section) => section.status !== "inactive");
    if (!activeSections.length) {
      const progLabel = eligibleEnrollments[0]?.program_code || eligibleEnrollments[0]?.student_course || "Unspecified";
      for (const item of eligibleEnrollments) {
        unassigned.push({
          enrollment_id: item.enrollment_id,
          student_id: item.student_id,
          reason: `No sections available for program ${progLabel}`,
        });
      }
      continue;
    }

    const enrollmentsByStudent = new Map();
    for (const enrollment of eligibleEnrollments) {
      const studentKey = String(enrollment.student_id);
      if (!enrollmentsByStudent.has(studentKey)) enrollmentsByStudent.set(studentKey, []);
      enrollmentsByStudent.get(studentKey).push(enrollment);
    }
    const validSectionIds = new Set(activeSections.map((section) => String(section.section_id)));
    const existingRowsByStudent = new Map();
    const currentCohortBySection = new Map();
    for (const existing of existingSections) {
      const studentKey = String(existing.student_id);
      if (!existingRowsByStudent.has(studentKey)) existingRowsByStudent.set(studentKey, []);
      existingRowsByStudent.get(studentKey).push(existing);
      if (!existing.section_id || !validSectionIds.has(String(existing.section_id))) continue;
      if (!currentCohortBySection.has(String(existing.section_id))) {
        currentCohortBySection.set(String(existing.section_id), new Set());
      }
      currentCohortBySection.get(String(existing.section_id)).add(studentKey);
    }

    // Remove this cohort's current occupancy before balancing the full cohort
    // so a rerun can redistribute both existing and newly enrolled students.
    const balancingSections = activeSections.map((section) => ({
      ...section,
      current_enrolled: Math.max(
        0,
        (Number(section.current_enrolled) || 0)
          - (currentCohortBySection.get(String(section.section_id))?.size || 0),
      ),
    }));
    const studentsToPlace = [...enrollmentsByStudent.keys()];

    const { assignments, unassigned: unassignedIds } =
      SectionsService.computeBalancedAssignment(balancingSections, studentsToPlace);

    for (const assignment of assignments) {
      const studentKey = String(assignment.id);
      const rowsToUpdate = new Map();
      for (const enrollment of enrollmentsByStudent.get(studentKey) || []) {
        rowsToUpdate.set(String(enrollment.enrollment_id), enrollment);
      }
      // The selected curriculum chooses the students to section. Reassign all
      // of those students' semester course rows together, including courses
      // that were previously enrolled under the other curriculum.
      for (const enrollment of existingRowsByStudent.get(studentKey) || []) {
        rowsToUpdate.set(String(enrollment.enrollment_id), enrollment);
      }
      for (const enrollment of rowsToUpdate.values()) {
        plannedAssignments.push({
          enrollment_id: enrollment.enrollment_id,
          student_id: enrollment.student_id,
          section_id: assignment.section_id,
          section_name: assignment.section_name,
        });
      }
    }

    for (const studentId of unassignedIds) {
      for (const enrollment of enrollmentsByStudent.get(String(studentId)) || []) {
        unassigned.push({
          enrollment_id: enrollment.enrollment_id,
          student_id: enrollment.student_id,
          reason: "Program sections are full",
        });
      }
    }
  }

  if (plannedAssignments.length) {
    try {
      await enrollmentModel.setEnrollmentSections(plannedAssignments, period_id);
      assigned.push(...plannedAssignments);
    } catch (err) {
      for (const assignment of plannedAssignments) {
        failed.push({ enrollment_id: assignment.enrollment_id, reason: err.message });
      }
    }
  }

  return {
    assigned,
    failed,
    unassigned,
    skipped,
    synchronizedEnrollments,
    removedEnrollments,
    summary: {
      totalEnrollments: assigned.length + failed.length + unassigned.length,
      totalStudents: new Set(assigned.map((item) => String(item.student_id))).size
        + new Set(unassigned.map((item) => String(item.student_id))).size,
      assigned: assigned.length,
      failed: failed.length,
      unassigned: unassigned.length,
      skippedStudents: new Set(skipped.map((item) => String(item.student_id))).size,
      synchronizedEnrollments,
      removedEnrollments,
    },
  };
};
