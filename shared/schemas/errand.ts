import { z } from "zod";

export const errandStatusEnum = z.enum([
  "POSTED",
  "ACCEPTED",
  "IN_PROGRESS",
  "REVIEWING",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
  "DISPUTED",
]);
export const errandTypeEnum = z.enum(["PICKUP_DELIVERY", "SHOPPING", "HANDS_ON_HELP"]);

export const createErrandSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    firstLocation: z.string().min(1, "Pickup location is required"),
    finalLocation: z.string().optional(),
    locationReference: z.string().optional(),
    type: errandTypeEnum,
    estimatedDuration: z.number().positive().optional(),
    firstLat: z.number().optional(),
    firstLng: z.number().optional(),
    finalLat: z.number().optional(),
    finalLng: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "HANDS_ON_HELP" && !data.estimatedDuration) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Estimated duration is required for Hands-On Help",
        path: ["estimatedDuration"],
      });
    }
    if (
      (data.type === "PICKUP_DELIVERY" || data.type === "SHOPPING") &&
      !data.finalLocation
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Drop-off location is required",
        path: ["finalLocation"],
      });
    }
  });

export type ErrandType = z.infer<typeof errandTypeEnum>;
export type ErrandStatus = z.infer<typeof errandStatusEnum>;
export type CreateErrandInput = z.infer<typeof createErrandSchema>;
