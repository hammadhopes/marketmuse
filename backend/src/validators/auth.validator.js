import { z } from "zod";

export const registerSchema = z.object({
    username: z.string().trim().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
    email: z.string().trim().toLowerCase().pipe(z.email("Invalid email address")),
    password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password must be at most 72 characters"),
});

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().pipe(z.email("Invalid email address")),
    password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password must be at most 72 characters"),
});