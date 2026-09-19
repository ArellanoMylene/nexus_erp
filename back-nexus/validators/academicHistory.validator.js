// validators/academicHistory.validator.js
import { z } from "zod";

const gpaField = z
  .number()
  .min(0, "GPA cannot be negative")
  .max(5, "GPA cannot exceed 5.0")
  .optional()
  .nullable();

const unitsField = z
  .number()
  .int()
  .min(0, "Units cannot be negative")
  .optional()
  .nullable();

const unitsConstraint = (data) =>
  data.units_passed === undefined ||
  data.units_taken === undefined ||
  data.units_passed <= data.units_taken;

const unitsRefinement = {
  message: "Units passed cannot exceed units taken",
  path: ["units_passed"],
};

/* ==========================================
   BASE — no .refine() here so .omit() works
   ========================================== */
const academicHistoryBaseSchema = z.object({
  student_id: z
    .number({ required_error: "Student ID is required" })
    .int()
    .positive(),
  period_id: z
    .number({ required_error: "Period ID is required" })
    .int()
    .positive(),
  year_level: z.string().min(1, "Year level is required"),
  semester_gpa: gpaField,
  cumulative_gpa: gpaField,
  units_taken: unitsField,
  units_passed: unitsField,
  academic_status: z
    .enum(["Regular", "Probation", "Dismissed", "Graduated", "Leave of Absence"])
    .default("Regular"),
  honors: z.string().max(255).optional().nullable(),
  remarks: z.string().max(1000).optional().nullable(),
});

/* ==========================================
   CREATE — add .refine() after base
   ========================================== */
export const createHistorySchema = academicHistoryBaseSchema
  .refine(unitsConstraint, unitsRefinement);

/* ==========================================
   UPDATE — .omit() and .partial() first on
   the base, THEN .refine() at the end
   ========================================== */
export const updateHistorySchema = academicHistoryBaseSchema
  .omit({ student_id: true, period_id: true })
  .partial()
  .refine(unitsConstraint, unitsRefinement);