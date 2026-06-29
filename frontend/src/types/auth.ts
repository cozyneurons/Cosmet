export interface User {
  id: string;
  email: string;
  name: string;
  age_group: string;
  sex: string;
  country?: string;
  created_at: string;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

