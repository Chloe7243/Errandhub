import { z } from "zod";

export const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z
    .string()
    .email("Invalid email")
    .regex(/\.(ac\.uk|edu)$/i, "Must be a university email")
    .toLowerCase(),
  phone: z.string().regex(/^[0-9]{10,15}$/, "Invalid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const forgetPasswordSchema = z.object({
  email: z.string().email("Invalid email").toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SignUpForm = z.infer<typeof signUpSchema>;
export type LoginForm = z.infer<typeof loginSchema>;
export type ForgetPasswordForm = z.infer<typeof forgetPasswordSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
