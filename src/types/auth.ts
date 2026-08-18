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
}

export interface UserProfile {
  userId: string
  username: string
  fullName: string
  roleName?: string
  departmentName?: string
}
