export interface Profile {
  user_id: string;
  skin_type: 'normal' | 'sensitive' | 'oily' | 'dry' | 'combination';
  allergies: string[];
  expertise_level: 'beginner' | 'intermediate' | 'expert';
  concerns: string[];
  updated_at?: string;
}
