// validators/academicEvents.validator.js
import { z } from "zod";

export const createAcademicEventSchema = z.object({
  period_id: z.union([z.number().int().positive(), z.null()]).optional(),
  event_type: z.string().min(1, "Event type is required"),
  event_name: z.string().min(1, "Event name is required").max(255), // ✅ event_name
  description: z.string().max(2000).optional().nullable(),
  start_date: z.string({ required_error: "Start date is required" }),
  end_date: z.string().optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  target_audience: z.string().optional().nullable(),           // ✅ dagdag
});

export const updateAcademicEventSchema = createAcademicEventSchema.partial();