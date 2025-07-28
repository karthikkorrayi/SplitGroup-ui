export interface User {
  id: number;
  name: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserProfile {
  userId: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  currency: string;
  notifications: boolean;
  theme: 'light' | 'dark';
}

export interface SearchUsersResponse {
  users: User[];
  total: number;
}