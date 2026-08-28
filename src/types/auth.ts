export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  userId: string
  username: string
  fullName: string
  roleName?: string
  departmentName?: string
  avatarUrl?: string
  avatarBg?: string
  avatarEmoji?: string
  email?: string
}

export interface UserProfile {
  userId: string
  username: string
  fullName: string
  roleName?: string
  departmentName?: string
  avatarUrl?: string
  avatarBg?: string
  avatarEmoji?: string
  email?: string
}

export interface SendOtpRequest {
  email: string
  fullName: string
  password: string
}

export interface SendOtpResponse {
  email: string
  expiresInSeconds: number
  message: string
}

export interface VerifyOtpRequest {
  email: string
  otpCode: string
}

export type User = UserProfile
export type AuthResponse = LoginResponse
export interface RegisterRequest {
  email: string
  fullName: string
  password: string
}

