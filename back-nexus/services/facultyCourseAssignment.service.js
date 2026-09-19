import FacultyCourseAssignment from "../model/facultyCourseAssignment.model.js";
import FacultyAssignmentSchedule from "../model/facultyAssignmentSchedule.model.js";

const FacultyCourseAssignmentService = {
  // Get all course assignments
  async getAllAssignments() {
    try {
      const [assignments] = await FacultyCourseAssignment.getAll();
      // Fetch schedules for each assignment
      const assignmentsWithSchedules = await Promise.all(
        assignments.map(async (a) => {
          const [schedules] = await FacultyAssignmentSchedule.getByAssignmentId(
            a.assignment_id,
          );
          return { ...a, schedules };
        }),
      );
      return { success: true, data: assignmentsWithSchedules };
    } catch (error) {
      console.error("Error getting all assignments:", error);
      return {
        success: false,
        message: "Failed to retrieve course assignments",
      };
    }
  },

  // Get assignments by faculty ID
  async getAssignmentsByFacultyId(facultyUserId) {
    try {
      const [assignments] =
        await FacultyCourseAssignment.getByFacultyId(facultyUserId);
      console.log(
        "Backend assignments fetched for facultyUserId:",
        facultyUserId,
        assignments,
      );
      const assignmentsWithSchedules = await Promise.all(
        assignments.map(async (a) => {
          const [schedules] = await FacultyAssignmentSchedule.getByAssignmentId(
            a.assignment_id,
          );
          return { ...a, schedules };
        }),
      );
      return { success: true, data: assignmentsWithSchedules };
    } catch (error) {
      console.error("Error getting assignments by faculty:", error);
      return { success: false, message: "Failed to retrieve assignments" };
    }
  },

  // Get assignments by academic period
  async getAssignmentsByAcademicPeriod(periodId) {
    try {
      const [assignments] =
        await FacultyCourseAssignment.getByAcademicPeriod(periodId);
      const assignmentsWithSchedules = await Promise.all(
        assignments.map(async (a) => {
          const [schedules] = await FacultyAssignmentSchedule.getByAssignmentId(
            a.assignment_id,
          );
          return { ...a, schedules };
        }),
      );
      return { success: true, data: assignmentsWithSchedules };
    } catch (error) {
      console.error("Error getting assignments by period:", error);
      return { success: false, message: "Failed to retrieve assignments" };
    }
  },

  // Get assignment by ID
  async getAssignmentById(assignmentId) {
    try {
      const [assignment] = await FacultyCourseAssignment.getById(assignmentId);
      if (assignment.length === 0) {
        return { success: false, message: "Assignment not found" };
      }
      const [schedules] =
        await FacultyAssignmentSchedule.getByAssignmentId(assignmentId);
      return { success: true, data: { ...assignment[0], schedules } };
    } catch (error) {
      console.error("Error getting assignment by ID:", error);
      return { success: false, message: "Failed to retrieve assignment" };
    }
  },

  // Create new course assignment
  async createAssignment(assignmentData) {
    try {
      // Check for schedule conflicts for each schedule
      for (const sched of assignmentData.schedules || []) {
        const [conflicts] = await FacultyCourseAssignment.checkConflict(
          assignmentData.faculty_user_id,
          assignmentData.academic_period_id,
          sched.schedule_day,
          sched.schedule_time_start,
          sched.schedule_time_end,
        );
        if (conflicts.length > 0) {
          return {
            success: false,
            message: `Schedule conflict detected for ${sched.schedule_day} ${sched.schedule_time_start}-${sched.schedule_time_end}. Faculty already has a class at this time.`,
          };
        }
      }
      // Remove schedule fields from main assignment
      const assignmentMain = { ...assignmentData };
      delete assignmentMain.schedules;
      assignmentMain.schedule_day = null;
      assignmentMain.schedule_time_start = null;
      assignmentMain.schedule_time_end = null;
      const [result] = await FacultyCourseAssignment.create(assignmentMain);
      // Insert schedules
      await FacultyAssignmentSchedule.createMany(
        result.insertId,
        assignmentData.schedules || [],
      );
      return {
        success: true,
        message: "Course assignment created successfully",
        data: { assignment_id: result.insertId },
      };
    } catch (error) {
      console.error("Error creating assignment:", error);
      return { success: false, message: "Failed to create course assignment" };
    }
  },

  // Update course assignment
  async updateAssignment(assignmentId, assignmentData) {
    try {
      // Check for schedule conflicts for each schedule (excluding current assignment)
      for (const sched of assignmentData.schedules || []) {
        const [conflicts] = await FacultyCourseAssignment.checkConflict(
          assignmentData.faculty_user_id,
          assignmentData.academic_period_id,
          sched.schedule_day,
          sched.schedule_time_start,
          sched.schedule_time_end,
          assignmentId,
        );
        if (conflicts.length > 0) {
          return {
            success: false,
            message: `Schedule conflict detected for ${sched.schedule_day} ${sched.schedule_time_start}-${sched.schedule_time_end}. Faculty already has a class at this time.`,
          };
        }
      }
      // Remove schedule fields from main assignment
      const assignmentMain = { ...assignmentData };
      delete assignmentMain.schedules;
      assignmentMain.schedule_day = null;
      assignmentMain.schedule_time_start = null;
      assignmentMain.schedule_time_end = null;
      const [result] = await FacultyCourseAssignment.update(
        assignmentId,
        assignmentMain,
      );
      if (result.affectedRows === 0) {
        return { success: false, message: "Assignment not found" };
      }
      // Delete old schedules and insert new
      await FacultyAssignmentSchedule.deleteByAssignmentId(assignmentId);
      await FacultyAssignmentSchedule.createMany(
        assignmentId,
        assignmentData.schedules || [],
      );
      return {
        success: true,
        message: "Course assignment updated successfully",
      };
    } catch (error) {
      console.error("Error updating assignment:", error);
      return { success: false, message: "Failed to update course assignment" };
    }
  },

  // Delete course assignment
  async deleteAssignment(assignmentId) {
    try {
      const [result] = await FacultyCourseAssignment.delete(assignmentId);
      if (result.affectedRows === 0) {
        return { success: false, message: "Assignment not found" };
      }
      return {
        success: true,
        message: "Course assignment deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting assignment:", error);
      return { success: false, message: "Failed to delete course assignment" };
    }
  },
};

export default FacultyCourseAssignmentService;
