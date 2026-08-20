'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthError, AuthField, AuthShell, AuthSubmit } from '@/components/auth/auth-shell'
import { loginUser } from '@/services/api/auth'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await loginUser({
        username: username.trim(),
        password: password,
      })

      if (result.success) {
        // Navigate to chat which will auto-redirect to latest conversation
        router.push('/chat')
      } else {
        setError(result.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.')
      }
    } catch (err: any) {
      setError('Đã xảy ra lỗi khi kết nối đến máy chủ.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Chào mừng trở lại"
      title="Đăng nhập vào MES"
      description="Tiếp tục quản lý hoạt động và trao đổi tin nhắn trong không gian tập trung."
      alternateText="Chưa có tài khoản?"
      alternateHref="/register"
      alternateLabel="Đăng ký ngay"
    >
      <form onSubmit={handleSubmit} className="grid gap-5">
        <AuthError message={error} />
        <AuthField
          id="login-username"
          label="Tên đăng nhập / Email"
          type="text"
          value={username}
          onChange={setUsername}
          placeholder="Nhập username của bạn"
        />
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-medium">
              Mật khẩu
            </label>
            <button type="button" className="text-xs font-medium text-primary hover:underline">
              Quên mật khẩu?
            </button>
          </div>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Nhập mật khẩu của bạn"
            required
            className="h-12 rounded-xl border border-input bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <AuthSubmit loading={loading}>Đăng nhập</AuthSubmit>
      </form>
    </AuthShell>
  )
}
