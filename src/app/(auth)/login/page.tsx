'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthError, AuthField, AuthShell, AuthSubmit } from '@/components/auth/auth-shell'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    window.setTimeout(() => { setLoading(false); router.push('/') }, 500)
  }

  return <AuthShell eyebrow="Chào mừng trở lại" title="Đăng nhập vào Nexus" description="Tiếp tục quản lý hoạt động kinh doanh của bạn trong một không gian tập trung." alternateText="Chưa có tài khoản?" alternateHref="/register" alternateLabel="Đăng ký ngay">
    <form onSubmit={handleSubmit} className="grid gap-5">
      <AuthError message={error} />
      <AuthField id="login-email" label="Email công việc" type="email" value={email} onChange={setEmail} placeholder="ban@example.com" />
      <div className="grid gap-2"><div className="flex items-center justify-between"><label htmlFor="login-password" className="text-sm font-medium">Mật khẩu</label><button type="button" className="text-xs font-medium text-primary hover:underline">Quên mật khẩu?</button></div><input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu của bạn" required className="h-12 rounded-xl border border-input bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/10" /></div>
      <AuthSubmit loading={loading}>Đăng nhập</AuthSubmit>
    </form>
  </AuthShell>
}
