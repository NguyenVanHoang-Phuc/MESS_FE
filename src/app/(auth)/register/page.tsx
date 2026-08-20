'use client'

import { useState, useEffect, useRef, FormEvent, ClipboardEvent, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Mail, RefreshCw, ShieldCheck } from 'lucide-react'
import { AuthError, AuthField, AuthShell, AuthSubmit } from '@/components/auth/auth-shell'
import { sendRegistrationOtpApi, verifyRegistrationOtpApi } from '@/services/api/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'info' | 'otp'>('info')

  // Step 1 states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Step 2 states
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState<number>(300)
  const [resendCooldown, setResendCooldown] = useState<number>(60)

  // Status states
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for OTP
  useEffect(() => {
    if (step !== 'otp') return

    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(interval)
  }, [step])

  // Focus first OTP input when transitioning to OTP step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus()
      }, 100)
    }
  }, [step])

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Handle Step 1 Submit (Send OTP)
  async function handleSendOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!name.trim()) {
      setError('Vui lòng nhập họ và tên của bạn.')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Vui lòng nhập địa chỉ email hợp lệ.')
      return
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có độ dài tối thiểu 6 ký tự.')
      return
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.')
      return
    }

    setLoading(true)

    const result = await sendRegistrationOtpApi({
      email: email.trim(),
      fullName: name.trim(),
      password,
    })

    setLoading(false)

    if (result.success) {
      setStep('otp')
      setCountdown(300)
      setResendCooldown(60)
      setOtpDigits(['', '', '', '', '', ''])
      setSuccessMessage(result.message || 'Mã OTP đã được gửi đến email của bạn.')
    } else {
      setError(result.message || 'Không thể gửi mã xác thực. Vui lòng thử lại.')
    }
  }

  // Handle Step 2 Resend OTP
  async function handleResendOtp() {
    if (resendCooldown > 0 || isResending) return
    setError(null)
    setIsResending(true)

    const result = await sendRegistrationOtpApi({
      email: email.trim(),
      fullName: name.trim(),
      password,
    })

    setIsResending(false)

    if (result.success) {
      setCountdown(300)
      setResendCooldown(60)
      setSuccessMessage('Mã OTP mới đã được gửi vào hộp thư của bạn.')
    } else {
      setError(result.message || 'Không thể gửi lại mã OTP.')
    }
  }

  // Handle OTP digit changes
  function handleOtpChange(index: number, value: string) {
    const cleanValue = value.replace(/\D/g, '')
    if (!cleanValue) {
      const newDigits = [...otpDigits]
      newDigits[index] = ''
      setOtpDigits(newDigits)
      return
    }

    const digit = cleanValue.slice(-1)
    const newDigits = [...otpDigits]
    newDigits[index] = digit
    setOtpDigits(newDigits)

    // Auto move focus to next input
    if (index < 5 && digit) {
      otpInputsRef.current[index + 1]?.focus()
    }
  }

  // Handle Backspace navigation
  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus()
    }
  }

  // Handle Paste 6 digits
  function handlePasteOtp(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pastedData) return

    const newDigits = [...otpDigits]
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i]
    }
    setOtpDigits(newDigits)

    const nextIndex = Math.min(pastedData.length, 5)
    otpInputsRef.current[nextIndex]?.focus()
  }

  // Handle Step 2 Submit (Verify OTP & Register)
  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const otpCode = otpDigits.join('')
    if (otpCode.length !== 6) {
      setError('Vui lòng nhập đủ 6 chữ số của mã xác thực OTP.')
      return
    }

    setLoading(true)

    const result = await verifyRegistrationOtpApi({
      email: email.trim(),
      otpCode,
    })

    setLoading(false)

    if (result.success) {
      // Auto logged in -> Redirect to chat
      router.push('/chat')
    } else {
      setError(result.message || 'Mã xác thực OTP không chính xác hoặc đã hết hạn.')
    }
  }

  return (
    <AuthShell
      eyebrow={step === 'info' ? 'Bắt đầu miễn phí' : 'Bảo mật & Xác thực'}
      title={step === 'info' ? 'Tạo tài khoản MES' : 'Nhập mã xác thực OTP'}
      description={
        step === 'info'
          ? 'Thiết lập tài khoản của bạn để kết nối và làm việc cùng đồng đội.'
          : `Chúng tôi đã gửi mã 6 chữ số đến email ${email}. Vui lòng nhập mã để hoàn tất đăng ký.`
      }
      alternateText="Đã có tài khoản?"
      alternateHref="/login"
      alternateLabel="Đăng nhập"
    >
      {step === 'info' ? (
        // ─── STEP 1: Registration Info Form ───
        <form onSubmit={handleSendOtp} className="grid gap-4">
          <AuthError message={error} />
          <AuthField
            id="register-name"
            label="Họ và tên"
            value={name}
            onChange={setName}
            placeholder="Nguyễn Văn A"
          />
          <AuthField
            id="register-email"
            label="Email công việc"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="ban@example.com"
          />
          <AuthField
            id="register-password"
            label="Mật khẩu"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Tối thiểu 6 ký tự"
            minLength={6}
          />
          <AuthField
            id="register-confirm-password"
            label="Xác nhận mật khẩu"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Nhập lại mật khẩu"
            minLength={6}
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Bằng việc tiếp tục, bạn đồng ý với điều khoản sử dụng và chính sách bảo mật của MES.
          </p>
          <AuthSubmit loading={loading}>Tiếp tục & Nhận mã OTP</AuthSubmit>
        </form>
      ) : (
        // ─── STEP 2: OTP Verification Form ───
        <form onSubmit={handleVerifyOtp} className="grid gap-5">
          <AuthError message={error} />

          {successMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-2.5 text-xs text-muted-foreground border">
            <div className="flex items-center gap-2 truncate">
              <Mail className="size-4 shrink-0 text-primary" />
              <span className="font-medium truncate text-foreground">{email}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep('info')
                setError(null)
                setSuccessMessage(null)
              }}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0"
            >
              <ArrowLeft className="size-3" /> Đổi email
            </button>
          </div>

          {/* 6-digit OTP Inputs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Mã xác thực 6 chữ số</span>
              <span className={countdown <= 60 ? 'font-semibold text-destructive' : 'font-medium'}>
                Hiệu lực: {formatTime(countdown)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 sm:gap-3">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputsRef.current[idx] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePasteOtp}
                  className="size-12 rounded-xl border-2 border-input bg-background text-center text-xl font-bold text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 sm:size-13"
                />
              ))}
            </div>
          </div>

          <AuthSubmit loading={loading}>
            <ShieldCheck className="size-4" /> Xác thực & Đăng nhập
          </AuthSubmit>

          {/* Resend OTP button */}
          <div className="flex items-center justify-center pt-2">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || isResending}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition disabled:opacity-50 disabled:hover:text-muted-foreground"
            >
              <RefreshCw className={`size-3.5 ${isResending ? 'animate-spin' : ''}`} />
              {resendCooldown > 0
                ? `Gửi lại mã sau (${resendCooldown}s)`
                : isResending
                ? 'Đang gửi...'
                : 'Chưa nhận được mã? Gửi lại'}
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  )
}
