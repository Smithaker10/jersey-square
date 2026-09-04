import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}
