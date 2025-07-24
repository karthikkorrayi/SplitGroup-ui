export interface User {
  userId: number;
  email: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  name: string;
  userId: number;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}