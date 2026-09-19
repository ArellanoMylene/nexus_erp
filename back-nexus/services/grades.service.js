import GradesModel from "../model/grades.model.js";

const GradesService = {
  getAllGrades: async (filters) => {
    try {
      return await GradesModel.getAllGrades(filters);
    } catch (error) {
      throw new Error(`Error fetching grades: ${error.message}`);
    }
  },

  // id is now the composite key "{student_id}-{course_id}-{period_id}"
  getGradeById: async (id) => {
    try {
      const [studentId, courseId, periodId] = String(id).split("-");
      if (!studentId || !courseId || !periodId) {
        throw new Error("Invalid grade id");
      }
      const grade = await GradesModel.getGradeByComposite(studentId, courseId, periodId);
      if (!grade) {
        throw new Error("Grade not found");
      }
      return grade;
    } catch (error) {
      throw new Error(`Error fetching grade: ${error.message}`);
    }
  },

  // "Approve" here bulk-approves every grade_entries row for this
  // student/course/period — a shortcut over the per-entry approval flow
  // in GradeEntryApproval.jsx.
  approveGrade: async (id, approvedBy) => {
    try {
      const [studentId, courseId, periodId] = String(id).split("-");
      if (!studentId || !courseId || !periodId) {
        throw new Error("Invalid grade id");
      }

      const affectedRows = await GradesModel.approveAllEntriesFor(
        studentId,
        courseId,
        periodId,
        approvedBy,
      );

      if (affectedRows === 0) {
        throw new Error("No pending entries found to approve for this student/course/period");
      }

      return await GradesModel.getGradeByComposite(studentId, courseId, periodId);
    } catch (error) {
      throw new Error(`Error approving grade: ${error.message}`);
    }
  },
};

export default GradesService;