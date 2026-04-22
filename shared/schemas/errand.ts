import { z } from "zod";

/**
 * Lifecycle states an errand can occupy, from initial posting through to a
 * terminal state. Kept in lockstep with the Prisma enum of the same name so
 * Zod-parsed API responses are assignment-compatible with Prisma models.
 */
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
/**
 * The three supported errand categories. Each has subtly different form
 * requirements (see createErrandSchema.superRefine) and different pricing
 * rules on the backend — hands-on help is billed by time, the others by
 * flat fee plus distance.
 */
export const errandTypeEnum = z.enum([
  "PICKUP_DELIVERY",
  "SHOPPING",
  "HANDS_ON_HELP",
]);

/**
 * Validation schema for the requester's "post errand" form. Enforces
 * cross-field rules that depend on the errand type:
 *   - HANDS_ON_HELP must carry an estimatedDuration (used for time-based pricing).
 *   - PICKUP_DELIVERY and SHOPPING must carry a finalLocation (drop-off).
 * Returned as a Zod effect object so both client and server reject the same
 * inputs with identical, field-scoped error messages.
 */
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
  // superRefine is used here because these rules depend on multiple fields together —
  // standard .refine() attaches errors to the root object, not a specific field, which
  // breaks per-field error display in the form. superRefine lets us set the path explicitly.
  .superRefine((data, ctx) => {
    // Duration is required for time-billed work so finalCost can be computed on completion.
    if (data.type === "HANDS_ON_HELP" && !data.estimatedDuration) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Estimated duration is required for Hands-On Help",
        path: ["estimatedDuration"],
      });
    }
    // Delivery/shopping types inherently have a separate destination; hands-on help does not.
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
