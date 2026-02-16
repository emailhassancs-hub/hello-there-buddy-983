import { z } from "zod"

const passwordRequirements = [
  {
    regex: /.{8,}/,
    message: "Password must be at least 8 characters long",
  },
  {
    regex: /[A-Z]/,
    message: "Password must contain at least one uppercase letter",
  },
  {
    regex: /[a-z]/,
    message: "Password must contain at least one lowercase letter",
  },
  {
    regex: /[0-9]/,
    message: "Password must contain at least one number",
  },
  {
    regex: /[\W_]/,
    message: "Password must contain at least one special character",
  },
];

export const loginSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter your valid email" }),
  password: z
    .string()
    .min(1, { message: "Password is required" }),
});

export const signupSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter your valid email" }),
  password: z
    .string()
    .superRefine((val, ctx) => {
      for (const rule of passwordRequirements) {
        if (!rule.regex.test(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: rule.message,
          });
        }
      }
    }),
  name: z.string().min(6, { message: "Username must be at least 6 characters long" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .superRefine((val, ctx) => {
      for (const rule of passwordRequirements) {
        if (!rule.regex.test(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: rule.message,
          });
        }
      }
    }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type SignupSchema = z.infer<typeof signupSchema>
export type LoginSchema = z.infer<typeof loginSchema>
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>

