import { z } from 'zod';

export const feedbackLinkSchema = z.object({
  title: z
    .string()
    .min(3, { message: 'Title must be at least 3 characters long' })
    .max(150, { message: 'Title must be no more than 150 characters long' })
    .trim(),
});