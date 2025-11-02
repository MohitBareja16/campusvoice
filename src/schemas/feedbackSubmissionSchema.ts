import { z } from 'zod';

export const feedbackSubmissionSchema = z.object({
  content: z
    .string()
    .min(10, { message: 'Feedback must be at least 10 characters long' })
    .max(1000, { message: 'Feedback must be no more than 1000 characters long' }),
});
