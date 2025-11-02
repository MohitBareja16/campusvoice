import { z } from 'zod';

export const classSchema = z.object({
  className: z
    .string()
    .min(2, { message: 'Class name must be at least 2 characters long' })
    .max(100, { message: 'Class name must be no more than 100 characters long' })
    .trim(),
  semester: z
    .string()
    .max(50, { message: 'Semester must be no more than 50 characters' })
    .optional(),
});
