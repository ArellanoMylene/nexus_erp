import GradeEntriesModel from "../model/gradeEntries.model.js";

const GradeEntriesService = {
  getAllEntries: async (filters) => {
    try {
      const entries = await GradeEntriesModel.getAll(filters);
      return { success: true, data: entries };
    } catch (error) {
      console.error("Error in getAllEntries service:", error);
      throw error;
    }
  },

  getEntryById: async (entryId) => {
    try {
      const entry = await GradeEntriesModel.getById(entryId);
      if (!entry) {
        return { success: false, message: "Grade entry not found" };
      }
      return { success: true, data: entry };
    } catch (error) {
      console.error("Error in getEntryById service:", error);
      throw error;
    }
  },

  createEntry: async (entryData) => {
    try {
      // Check if entry with same label already exists
      const allEntries = await GradeEntriesModel.getAll({
        student_id: entryData.student_id,
        course_id: entryData.course_id,
        period_id: entryData.period_id,
        component_type: entryData.component_type,
      });

      const label = entryData.label || "midterm";
      const existingEntry = allEntries.find(
        (e) => e.component_name === entryData.component_name && e.label === label
      );

      if (existingEntry) {
        // If entry exists with same label, update it instead
        return await this.updateEntry(existingEntry.entry_id, entryData);
      }

      // Calculate percentage if raw_score and max_score are provided
      if (entryData.raw_score && entryData.max_score) {
        entryData.percentage =
          (entryData.raw_score / entryData.max_score) * 100;
      }

      // Calculate weighted score if percentage and weight are provided
      if (entryData.percentage && entryData.weight) {
        entryData.weighted_score =
          (entryData.percentage * entryData.weight) / 100;
      }

      const entryId = await GradeEntriesModel.create(entryData);
      return {
        success: true,
        entryId,
        message: "Grade entry created successfully",
      };
    } catch (error) {
      console.error("Error in createEntry service:", error);
      throw error;
    }
  },

  updateEntry: async (entryId, entryData) => {
    try {
      // Check if entry is locked before allowing update
      const existingEntry = await GradeEntriesModel.getById(entryId);
      if (existingEntry && existingEntry.is_locked) {
        throw new Error("This grade entry is locked and cannot be modified. Contact an administrator to unlock it.");
      }

      // Recalculate percentage and weighted score
      if (entryData.raw_score && entryData.max_score) {
        entryData.percentage =
          (entryData.raw_score / entryData.max_score) * 100;
      }

      if (entryData.percentage && entryData.weight) {
        entryData.weighted_score =
          (entryData.percentage * entryData.weight) / 100;
      }

      const affectedRows = await GradeEntriesModel.update(entryId, entryData);
      if (affectedRows === 0) {
        return {
          success: false,
          message: "Grade entry not found or no changes made",
        };
      }
      return { success: true, message: "Grade entry updated successfully" };
    } catch (error) {
      console.error("Error in updateEntry service:", error);
      throw error;
    }
  },

  deleteEntry: async (entryId) => {
    try {
      const affectedRows = await GradeEntriesModel.delete(entryId);
      if (affectedRows === 0) {
        return { success: false, message: "Grade entry not found" };
      }
      return { success: true, message: "Grade entry deleted successfully" };
    } catch (error) {
      console.error("Error in deleteEntry service:", error);
      throw error;
    }
  },

  approveEntry: async (entryId, approvedBy) => {
    try {
      const affectedRows = await GradeEntriesModel.approve(entryId, approvedBy);
      if (affectedRows === 0) {
        return { success: false, message: "Grade entry not found" };
      }
      return { success: true, message: "Grade entry approved successfully" };
    } catch (error) {
      console.error("Error in approveEntry service:", error);
      throw error;
    }
  },

  rejectEntry: async (entryId, approvedBy, rejectionReason) => {
    try {
      const affectedRows = await GradeEntriesModel.reject(
        entryId,
        approvedBy,
        rejectionReason
      );
      if (affectedRows === 0) {
        return { success: false, message: "Grade entry not found" };
      }
      return { success: true, message: "Grade entry rejected successfully" };
    } catch (error) {
      console.error("Error in rejectEntry service:", error);
      throw error;
    }
  },

  getPendingCount: async () => {
    try {
      const count = await GradeEntriesModel.getPendingCount();
      return { success: true, count };
    } catch (error) {
      console.error("Error in getPendingCount service:", error);
      throw error;
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // syncFromSubmissions
  //
  // Fixed two bugs that caused duplicate grade_entries rows:
  //
  // 1. The submissions query could return more than one row per actual
  //    submission when a student had more than one matching row in
  //    `enrollments` for the same course (re-enrollment, multiple sections,
  //    etc.) — the JOIN multiplies rows in that case. Fixed with
  //    `GROUP BY las.id` so each submission is processed exactly once per
  //    sync run.
  //
  // 2. The old "SELECT to check existence, then INSERT/UPDATE" pattern is
  //    NOT atomic. If two sync calls overlap (e.g. the frontend's old
  //    auto-sync effect firing while a manual sync was still running), both
  //    could pass the existence check before either finished writing,
  //    producing two rows for the same component. Fixed by wrapping each
  //    submission's check+write in a transaction with `SELECT ... FOR
  //    UPDATE`, which serializes concurrent syncs against the same row.
  //
  //    NOTE: `SELECT ... FOR UPDATE` only protects rows that already exist.
  //    Two *first-time* inserts for the same (student, course, period,
  //    component_type, component_name, label) racing at the same instant
  //    can still both succeed, because there's nothing to lock yet. The
  //    fully correct fix is a UNIQUE constraint in the database, e.g.:
  //
  //      ALTER TABLE grade_entries
  //        ADD UNIQUE KEY uniq_grade_entry
  //        (student_id, course_id, period_id, component_type, component_name(191), label);
  //
  //    With that constraint in place, switch the INSERT below to
  //    `INSERT ... ON DUPLICATE KEY UPDATE raw_score = VALUES(raw_score),
  //    percentage = VALUES(percentage), submitted_at = NOW()` for a fully
  //    race-proof upsert. Until the migration is applied, the transaction
  //    below removes the duplication in the common case (sequential syncs,
  //    including the "click sync twice quickly" case), which was the
  //    scenario in your logs.
  // ─────────────────────────────────────────────────────────────────────────
  syncFromSubmissions: async (courseId, periodId, submittedBy) => {
    try {
      const pool = await import("../config/db.js");
      const db = pool.default;

      // Query to get all graded submissions for this course and period.
      // GROUP BY las.id collapses any duplicate rows introduced by the
      // enrollments JOIN so each submission is only processed once.
      const submissionsQuery = `
        SELECT 
          las.id as submission_id,
          las.student_id,
          la.id as assignment_id,
          las.score,
          la.title as assignment_name,
          la.assignment_type as assignment_type,
          COALESCE(la.total_points, 100) as max_score,
          MIN(e.enrollment_id) as enrollment_id
        FROM lms_assignment_submissions las
        INNER JOIN lms_assignments la ON las.assignment_id = la.id
        INNER JOIN enrollments e ON las.student_id = e.student_id AND la.course_id = e.course_id
        WHERE la.course_id = ? 
          AND e.period_id = ?
          AND (las.score IS NOT NULL OR las.status = 'submitted')
        GROUP BY las.id, las.student_id, la.id, las.score, la.title, la.assignment_type, la.total_points
        ORDER BY las.student_id, la.title
      `;

      const [submissions] = await db.query(submissionsQuery, [courseId, periodId]);
      console.log(`[Grade Sync] Found ${submissions?.length || 0} submissions for course ${courseId}, period ${periodId}`);

      if (!submissions || submissions.length === 0) {
        return {
          success: true,
          message: "No submissions found to sync",
          synced: 0,
        };
      }

      let syncedCount = 0;
      let skippedCount = 0;

      for (const submission of submissions) {
        // Skip if no score
        if (submission.score === null || submission.score === undefined) {
          console.log(`[Grade Sync] Skipping ${submission.assignment_name} for student ${submission.student_id} - no score`);
          skippedCount++;
          continue;
        }

        // Determine component type based on assignment type
        let componentType = "assignment";
        if (submission.assignment_type && submission.assignment_type.toLowerCase() === "quiz") {
          componentType = "quiz";
        } else if (submission.assignment_type && submission.assignment_type.toLowerCase() === "exam") {
          componentType = "exam";
        }

        // Calculate percentage
        const maxScore = submission.max_score || 100;
        const percentage = (submission.score / maxScore) * 100;
        const componentName = String(submission.assignment_name || "").trim();

        // Run the check + write as one transaction so a concurrent sync
        // call can't slip in between the SELECT and the INSERT/UPDATE and
        // create a duplicate row for the same component.
        const connection = await db.getConnection();
        try {
          await connection.beginTransaction();

          // TRIM both sides so stray whitespace in a stored vs. incoming
          // title can't cause a false "doesn't exist yet" match.
          const checkQuery = `
            SELECT entry_id FROM grade_entries 
            WHERE student_id = ? 
              AND course_id = ? 
              AND period_id = ?
              AND component_type = ?
              AND TRIM(component_name) = TRIM(?)
            FOR UPDATE
          `;

          const [existing] = await connection.query(checkQuery, [
            submission.student_id,
            courseId,
            periodId,
            componentType,
            componentName,
          ]);

          if (existing.length > 0) {
            // Update existing entry
            const updateQuery = `
              UPDATE grade_entries 
              SET raw_score = ?, percentage = ?, submitted_at = NOW()
              WHERE entry_id = ?
            `;

            await connection.query(updateQuery, [
              submission.score,
              percentage,
              existing[0].entry_id,
            ]);
            console.log(`[Grade Sync] Updated grade for ${componentName} - student ${submission.student_id}`);
          } else {
            // Create new entry
            const insertQuery = `
              INSERT INTO grade_entries (
                student_id, course_id, period_id, component_name, 
                component_type, raw_score, max_score, percentage, submitted_by, label, submitted_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;

            await connection.query(insertQuery, [
              submission.student_id,
              courseId,
              periodId,
              componentName,
              componentType,
              submission.score,
              maxScore,
              percentage,
              submittedBy,
              "midterm",
            ]);
            console.log(`[Grade Sync] Created grade for ${componentName} (${componentType}) - student ${submission.student_id}, score: ${submission.score}/${maxScore}`);
          }

          await connection.commit();
        } catch (txError) {
          await connection.rollback();
          throw txError;
        } finally {
          connection.release();
        }

        syncedCount++;
      }

      return {
        success: true,
        message: `Synced ${syncedCount} grades${skippedCount > 0 ? ` (skipped ${skippedCount} without scores)` : ''}`,
        synced: syncedCount,
        skipped: skippedCount,
      };
    } catch (error) {
      console.error("Error in syncFromSubmissions service:", error);
      throw error;
    }
  },
};

export default GradeEntriesService;