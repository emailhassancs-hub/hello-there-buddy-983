import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const signupSchema = loginSchema.extend({
  name: z.string().min(2),
})

export type SignupSchema = z.infer<typeof signupSchema>
export type LoginSchema = z.infer<typeof loginSchema>

