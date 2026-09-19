import db from "../config/db.js";

const FacultyAssignmentSchedule = {
  // Get all schedules for an assignment
  getByAssignmentId: (assignmentId) => {
    return db.query(
      `SELECT * FROM faculty_assignment_schedules WHERE assignment_id = ?`,
      [assignmentId],
    );
  },

  // Create schedules for an assignment (bulk insert)
  createMany: (assignmentId, schedules) => {
    if (!schedules || schedules.length === 0) return Promise.resolve([[]]);
    const values = schedules.map((s) => [
      assignmentId,
      s.schedule_day,
      s.schedule_time_start,
      s.schedule_time_end,
    ]);
    return db.query(
      `INSERT INTO faculty_assignment_schedules (assignment_id, schedule_day, schedule_time_start, schedule_time_end) VALUES ?`,
      [values],
    );
  },

  // Delete all schedules for an assignment
  deleteByAssignmentId: (assignmentId) => {
    return db.query(
      `DELETE FROM faculty_assignment_schedules WHERE assignment_id = ?`,
      [assignmentId],
    );
  },
};

export default FacultyAssignmentSchedule;
