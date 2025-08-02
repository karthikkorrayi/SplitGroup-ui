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
  bio?: string;
  location?: string;
  dateOfBirth?: Date;
  isActive?: boolean;
  lastLoginAt?: Date;
}

export interface UserPreferences {
  currency: string;
  notifications: boolean;
  theme: 'light' | 'dark';
  language: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  autoSettleReminders: boolean;
}

export interface SearchUsersResponse {
  users: User[];
  total: number;
  hasMore?: boolean;
  nextCursor?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  bio?: string;
  location?: string;
  dateOfBirth?: Date;
}

export interface UploadAvatarResponse {
  avatarUrl: string;
  message: string;
  fileSize: number;
}