import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  age_group: z.string().min(1, 'Age group is required'),
  sex: z.string(),
  country: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const profileSchema = z.object({
  skin_type: z.enum(['normal', 'dry', 'oily', 'combination', 'sensitive']),
  expertise_level: z.enum(['beginner', 'intermediate', 'expert']),
  allergies: z.array(z.string()),
  concerns: z.array(z.string()),
});
