// src/modules/auth/validation/auth.schema.ts
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// Helpers to parse and validate request bodies
export const validateRegister = (data: unknown): RegisterInput => {
  const result = registerSchema.safeParse(data);
  if (!result.success) {
    throw new Error(result.error.errors.map(e => e.message).join(", "));
  }
  return result.data;
};

export const validateLogin = (data: unknown): LoginInput => {
  const result = loginSchema.safeParse(data);
  if (!result.success) {
    throw new Error(result.error.errors.map(e => e.message).join(", "));
  }
  return result.data;
};
