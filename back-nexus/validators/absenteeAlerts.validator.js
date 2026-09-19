// validators/absenteeAlerts.validator.js
import { z } from "zod";

export const createAbsenteeAlertSchema = z.object({
  user_id: z.number({ required_error: "user_id is required" }).int().positive(),
  user_type: z.enum(["Student", "Staff", "Faculty"], {
    required_error: "user_type is required",
  }),
  alert_type: z.string().min(1, "alert_type is required"),
  status: z.enum(["Pending", "Acknowledged", "Resolved"]).default("Pending"),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
  period_id: z.number().int().positive().optional().nullable(),
  message: z.string().min(1, "Message is required").max(1000),
  resolution_notes: z.string().max(1000).optional().nullable(),
});

export const updateAbsenteeAlertSchema = createAbsenteeAlertSchema.partial();
// .partial() makes ALL fields optional — perfect for PUT/PATCH updates

export const acknowledgeAlertSchema = z.object({
  acknowledged_by: z.number({ required_error: "acknowledged_by is required" }).int().positive(),
  resolution_notes: z.string().max(1000).optional().nullable(),
});

export const resolveAlertSchema = z.object({
  acknowledged_by: z.number({ required_error: "acknowledged_by is required" }).int().positive(),
  resolution_notes: z.string().min(1, "resolution_notes is required").max(1000),
});