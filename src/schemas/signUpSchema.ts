import {z} from "zod"

export const usernameValidation = z
    .string()
    .min(5,"Username must be atleast 5 letters")
    .max(20, "Username mustn't be more than 20 Letters long")
    .regex(/^[a-zA-Z0-9_]+$/, "Username must not contain Special Characters")


export const signUpSchema = z.object({
  username: usernameValidation,

  email: z.email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' }),
});
