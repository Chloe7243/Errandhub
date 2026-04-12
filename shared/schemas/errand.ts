import { z } from "zod";

export const errandStatusEnum = z.enum([
  "POSTED",
  "ACCEPTED",
  "IN_PROGRESS",
  "REVIEWING",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
]);
export const errandTypeEnum = z.enum(["PICKUP_DELIVERY", "SHOPPING"]);

export const createErrandSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  pickupLocation: z.string().min(1, "Pickup location is required"),
  dropoffLocation: z.string().min(1, "Dropoff location is required"),
  pickupReference: z.string().optional(),
  type: errandTypeEnum,
});

export type ErrandType = z.infer<typeof errandTypeEnum>;

export type ErrandStatus = z.infer<typeof errandStatusEnum>;

export type CreateErrandInput = z.infer<typeof createErrandSchema>;
