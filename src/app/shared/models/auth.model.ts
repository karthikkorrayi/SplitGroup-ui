export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  name: string;
  userId: number;
  message: string;
}

export interface RefreshTokenResponse {
  token: string;
  message: string;
}