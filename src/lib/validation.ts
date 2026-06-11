import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "nameShort"),
  email: z.string().trim().email("emailInvalid"),
  password: z.string().min(6, "passwordShort"),
  role: z.enum(["professional", "employer"]),
});

export const loginSchema = z.object({
  email: z.string().trim().email("emailInvalid"),
  password: z.string().min(1, "invalidCredentials"),
});

export function validationMessageKey(error: z.ZodError): string {
  return error.errors[0]?.message || "validation";
}
