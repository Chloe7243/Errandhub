import { z } from "zod";

export const roleEnum = z.enum(["helper", "requester"]);
export type Role = z.infer<typeof roleEnum>;

export const roleSelectionSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: roleEnum,
});

export type roleSelectionData = z.infer<typeof roleSelectionSchema>;
