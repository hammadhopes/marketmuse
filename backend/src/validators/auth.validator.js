import { z } from "zod";

const RESERVED_USERNAMES = [
    "admin", "administrator", "root", "support", "help", "staff", "system",
    "moderator", "mod", "owner", "security", "api", "null", "undefined", "marketmuse"
];

const emailField = z.string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Invalid email address"));
const passwordField = z.string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"); 
const usernameField = z.string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers and underscores")
    .refine((username) => !RESERVED_USERNAMES.includes(username), "This username is not available");

export const registerSchema = z.object({ email: emailField, password: passwordField });
export const loginSchema = z.object({ email: emailField, password: passwordField });

export const verifyEmailSchema = z.object({
    email: emailField,
    code: z.string().trim().regex(/^\d{6}$/, "Code must be exactly 6 digits"),
});

export const resendVerificationSchema = z.object({ email: emailField });

export const changeUsernameSchema = z.object({ username: usernameField });