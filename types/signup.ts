import { z } from "zod";

export const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z
    .email("Invalid email")
    .regex(/\.(ac\.uk|edu)$/i, "Must be a university email"),
  phone: z.string().regex(/^[0-9]{10,15}$/, "Invalid phone number"),
  password: z.string().min(6, "Min 6 characters"),
});

export type SignUpForm = z.infer<typeof signUpSchema>;
