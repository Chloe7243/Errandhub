import { z } from "zod";

/**
 * Zod schemas shared between the Expo client and the Express backend so the
 * same validation rules (and therefore the same error messages) are applied
 * on both sides. Inferring form types from the schemas keeps react-hook-form
 * usage in the client strongly typed without duplicating shape definitions.
 */

/**
 * Signup payload schema. Validates name, a university email (UK .ac.uk or
 * US .edu — ErrandHub is student-only), a phone number that normalises to
 * digits-only, and an 8+ char password. The email regex is a cheap
 * eligibility gate; the downstream email-verification step is what actually
 * proves ownership of the address.
 */
export const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z
    .string()
    .email("Invalid email")
    .regex(/\.(ac\.uk|edu)$/i, "Must be a university email")
    .toLowerCase(),
  phone: z
    .string()
    .regex(
      /^\+?[\d\s\-().]{7,20}$/,
      "Invalid phone number",
    )
    .transform((val) => val.replace(/[\s\-().]/g, "")),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * Login payload schema. Password length is only checked for presence here —
 * the strength rule lives on signup; letting existing shorter passwords log
 * in avoids locking legacy accounts out after policy tightening.
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

/**
 * "Forgot password" request schema — email only. The backend deliberately
 * returns a 200 whether or not the email is registered, so validation here
 * is purely formatting.
 */
export const forgetPasswordSchema = z.object({
  email: z.string().email("Invalid email").toLowerCase(),
});

/**
 * Reset-password schema used after the user clicks the emailed link. The
 * token is the single-use reset token; the same 8-char password rule as
 * signup applies.
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SignUpForm = z.infer<typeof signUpSchema>;
export type LoginForm = z.infer<typeof loginSchema>;
export type ForgetPasswordForm = z.infer<typeof forgetPasswordSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
