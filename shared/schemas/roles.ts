import { z } from "zod";

/**
 * Two-role model used throughout the app: a helper fulfils errands and a
 * requester posts them. A user account can switch between roles in-app, but
 * any given JWT is scoped to exactly one role so role-based route guards on
 * the backend don't need to re-read the DB on every request.
 */
export const roleEnum = z.enum(["helper", "requester"]);
export type Role = z.infer<typeof roleEnum>;

/**
 * Schema for the post-signup role-selection screen. The backend only mints
 * the real JWT after this call completes, so the userId is passed
 * explicitly in the body rather than pulled from an auth header.
 */
export const roleSelectionSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: roleEnum,
});

export type roleSelectionData = z.infer<typeof roleSelectionSchema>;
