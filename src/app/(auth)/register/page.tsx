'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthError, AuthField, AuthShell, AuthSubmit } from '@/components/auth/auth-shell'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return }
    setError(null)
    setLoading(true)
    window.setTimeout(() => { setLoading(false); router.push('/') }, 500)
  }

  return <AuthShell eyebrow="Bắt đầu miễn phí" title="Tạo tài khoản Nexus" description="Thiết lập workspace đầu tiên của bạn và đưa đội ngũ vào cùng một nhịp vận hành." alternateText="Đã có tài khoản?" alternateHref="/login" alternateLabel="Đăng nhập">
    <form onSubmit={handleSubmit} className="grid gap-4">
      <AuthError message={error} />
      <AuthField id="register-name" label="Họ và tên" value={name} onChange={setName} placeholder="Nguyễn Văn A" />
      <AuthField id="register-email" label="Email công việc" type="email" value={email} onChange={setEmail} placeholder="ban@example.com" />
      <AuthField id="register-password" label="Mật khẩu" type="password" value={password} onChange={setPassword} placeholder="Tối thiểu 8 ký tự" minLength={8} />
      <AuthField id="register-confirm-password" label="Xác nhận mật khẩu" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Nhập lại mật khẩu" />
      <p className="text-xs leading-5 text-muted-foreground">Bằng việc tiếp tục, bạn đồng ý với điều khoản sử dụng và chính sách bảo mật của Nexus.</p>
      <AuthSubmit loading={loading}>Tạo tài khoản</AuthSubmit>
    </form>
  </AuthShell>
}
