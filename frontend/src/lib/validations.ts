import { z } from 'zod';

export const profileSchema = z.object({
  skin_type: z.enum(['normal', 'dry', 'oily', 'combination', 'sensitive']),
  expertise_level: z.enum(['beginner', 'intermediate', 'expert']),
  allergies: z.array(z.string()),
  concerns: z.array(z.string()),
});
