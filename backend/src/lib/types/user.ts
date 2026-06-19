export type UserRole = 'admin' | 'player' | 'captain';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  categoryId: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  categoryId: string | null;
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

export interface AuthPayload {
  userId: string;
  role: UserRole;
}
