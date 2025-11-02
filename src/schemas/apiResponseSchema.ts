import { z } from 'zod';

// This is a generic schema to standardize your API responses.
// It ensures a consistent structure for both successful and error responses.
export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  // You can extend this to include data, errors, or other fields as needed
  // For example:
  // data: z.any().optional(),
  // errors: z.array(z.string()).optional()
});
