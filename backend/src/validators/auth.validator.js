import { z } from "zod";

const emailField = z.string().trim().toLowerCase().pipe(z.email("Invalid email address"));
const passwordField = z.string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"); 

export const registerSchema = z.object({ email: emailField, password: passwordField });
export const loginSchema = z.object({ email: emailField, password: passwordField });

export const verifyEmailSchema = z.object({
    email: emailField,
    code: z.string().trim().regex(/^\d{6}$/, "Code must be exactly 6 digits"),
});

export const resendVerificationSchema = z.object({ email: emailField });