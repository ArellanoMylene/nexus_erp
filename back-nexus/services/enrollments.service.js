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
    throw new Error(`Some selected student/course combinations are already enrolled: ${shownDuplicates}${remaining}`);
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

// Delete enrollment
export const removeEnrollment = async (id) => {
  await getEnrollment(id);
  return await enrollmentModel.deleteEnrollment(id);
};

// Get enrolled students by faculty assignment ID
export const listStudentsByAssignment = async (assignmentId) => {
  return await enrollmentModel.getStudentsByAssignment(assignmentId);
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

  const selectedCourseIds = Array.isArray(course_ids) && course_ids.length
    ? course_ids
    : course_id ? [course_id] : [];

  const unsectioned = await enrollmentModel.getUnsectionedEnrollments(
    selectedCourseIds,
    period_id,
    program_id || null,
    year_level || null,
    curriculum_type || null,
  );

  if (unsectioned.length === 0) {
    return {
      assigned: [],
      failed: [],
      unassigned: [],
      summary: { totalEnrollments: 0, totalStudents: 0, assigned: 0, failed: 0, unassigned: 0 },
    };
  }

  // Group selected enrollment rows by program, then place each student once.
  const enrollmentsByProgram = new Map();
  for (const item of unsectioned) {
    const progKey = item.program_id ? String(item.program_id) : "unspecified";
    if (!enrollmentsByProgram.has(progKey)) {
      enrollmentsByProgram.set(progKey, []);
    }
    enrollmentsByProgram.get(progKey).push(item);
  }

  const assigned = [];
  const failed = [];
  const unassigned = [];
  const plannedAssignments = [];
  const sectionsForPeriod = await SectionsModel.getSectionsForPeriod(period_id, null, year_level);

  for (const [progKey, studentsInProg] of enrollmentsByProgram.entries()) {
    const progId = progKey === "unspecified" ? null : Number(progKey);
    const sections = sectionsForPeriod.filter(
      (section) => String(section.program_id ?? "") === String(progId ?? ""),
    );

    const activeSections = sections.filter((section) => section.status !== "inactive");
    if (!activeSections.length) {
      const progLabel = studentsInProg[0]?.program_code || studentsInProg[0]?.student_course || "Unspecified";
      for (const item of studentsInProg) {
        unassigned.push({
          enrollment_id: item.enrollment_id,
          student_id: item.student_id,
          reason: `No sections available for program ${progLabel}`,
        });
      }
      continue;
    }

    const enrollmentsByStudent = new Map();
    for (const enrollment of studentsInProg) {
      const studentKey = String(enrollment.student_id);
      if (!enrollmentsByStudent.has(studentKey)) enrollmentsByStudent.set(studentKey, []);
      enrollmentsByStudent.get(studentKey).push(enrollment);
    }
    const validSectionIds = new Set(activeSections.map((section) => String(section.section_id)));
    // Remove the selected cohort from current section occupancy before
    // redistributing it, so reruns can correct an earlier uneven split.
    for (const studentEnrollments of enrollmentsByStudent.values()) {
      const previousSections = new Set(studentEnrollments
        .map((enrollment) => String(enrollment.section_id || ""))
        .filter((sectionId) => sectionId && validSectionIds.has(sectionId)));
      for (const previousSectionId of previousSections) {
        const previousSection = activeSections.find(
          (section) => String(section.section_id) === previousSectionId,
        );
        if (previousSection) {
          previousSection.current_enrolled = Math.max(0, Number(previousSection.current_enrolled || 0) - 1);
        }
      }
    }

    const studentIds = [...enrollmentsByStudent.keys()];

    const { assignments, unassigned: unassignedIds } =
      SectionsService.computeBalancedAssignment(activeSections, studentIds);

    for (const assignment of assignments) {
      for (const enrollment of enrollmentsByStudent.get(String(assignment.id)) || []) {
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
    summary: {
      totalEnrollments: unsectioned.length,
      totalStudents: new Set(unsectioned.map((item) => String(item.student_id))).size,
      assigned: assigned.length,
      failed: failed.length,
      unassigned: unassigned.length,
    },
  };
};
