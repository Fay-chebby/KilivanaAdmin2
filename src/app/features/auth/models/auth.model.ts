export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  verificationStatus: string;
  createdAt: string;
}

export interface AuthData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number | null;
  user: AuthUser;
}

export interface ApiError {
  code: string;
  details: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  error: ApiError | null;
}
