import api from '@/lib/axios'
import type {
  LoginRequest,
  LoginResponse,
  SendOtpRequest,
  SendOtpResponse,
  UserProfile,
  VerifyOtpRequest,
} from '@/types/auth'

export interface AuthResult {
  success: boolean
  data?: LoginResponse
  message?: string
}

export interface SendOtpResult {
  success: boolean
  data?: SendOtpResponse
  message?: string
}

export async function loginUser(credentials: LoginRequest): Promise<AuthResult> {
  try {
    const response = await api.post<{ success: boolean; data: LoginResponse }>('/auth/login', credentials)
    
    if (response.data?.success && response.data.data) {
      const authData = response.data.data
      
      // Save token and user profile in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', authData.accessToken)
        localStorage.setItem(
          'user',
          JSON.stringify({
            userId: authData.userId,
            username: authData.username,
            fullName: authData.fullName,
            roleName: authData.roleName,
            departmentName: authData.departmentName,
          })
        )
      }

      return { success: true, data: authData }
    }

    return { success: false, message: 'Đăng nhập không thành công.' }
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại.'
    return { success: false, message: errorMessage }
  }
}

export async function sendRegistrationOtpApi(request: SendOtpRequest): Promise<SendOtpResult> {
  try {
    const response = await api.post<{ success: boolean; data: SendOtpResponse }>(
      '/auth/register/send-otp',
      request
    )

    if (response.data?.success && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.data.message || 'Mã OTP đã được gửi đến email của bạn.',
      }
    }

    return { success: false, message: 'Không thể gửi mã xác thực. Vui lòng thử lại.' }
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Không thể gửi mã xác thực. Vui lòng kiểm tra lại.'
    return { success: false, message: errorMessage }
  }
}

export async function verifyRegistrationOtpApi(request: VerifyOtpRequest): Promise<AuthResult> {
  try {
    const response = await api.post<{ success: boolean; data: LoginResponse }>(
      '/auth/register/verify-otp',
      request
    )

    if (response.data?.success && response.data.data) {
      const authData = response.data.data

      // Save token and user profile in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', authData.accessToken)
        localStorage.setItem(
          'user',
          JSON.stringify({
            userId: authData.userId,
            username: authData.username,
            fullName: authData.fullName,
            roleName: authData.roleName,
            departmentName: authData.departmentName,
          })
        )
      }

      return { success: true, data: authData }
    }

    return { success: false, message: 'Xác thực OTP không thành công.' }
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Mã OTP không hợp lệ hoặc đã hết hạn.'
    return { success: false, message: errorMessage }
  }
}

export function getCurrentUser(): UserProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const userJson = localStorage.getItem('user')
    return userJson ? JSON.parse(userJson) : null
  } catch {
    return null
  }
}

export function logoutUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}
