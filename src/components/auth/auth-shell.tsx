import Link from 'next/link'

// ─── AuthShell ───────────────────────────────────────────────────────────────
interface AuthShellProps {
  eyebrow: string
  title: string
  description: string
  alternateText: string
  alternateHref: string
  alternateLabel: string
  children: React.ReactNode
}

export function AuthShell({
  eyebrow,
  title,
  description,
  alternateText,
  alternateHref,
  alternateLabel,
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ── Left panel – branding ── */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-foreground p-12">
        {/* Radial glow */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[100px]" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-lg">
            N
          </span>
          <span className="text-xl font-semibold text-background">Nexus</span>
        </div>

        {/* Testimonial / tagline */}
        <div className="relative z-10 space-y-6">
          <blockquote className="text-2xl font-semibold leading-snug text-background/90">
            &ldquo;Nexus giúp chúng tôi quản lý toàn bộ hoạt động chỉ trong một nơi — nhanh hơn, rõ ràng hơn.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/30 ring-2 ring-primary/40 flex items-center justify-center text-background text-sm font-semibold">
              TH
            </div>
            <div>
              <p className="text-sm font-medium text-background">Trần Hương</p>
              <p className="text-xs text-background/50">COO tại Vinfuture Labs</p>
            </div>
          </div>
        </div>

        {/* Bottom dots */}
        <div className="relative z-10 flex gap-1.5">
          {[...Array(3)].map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full bg-background transition-all ${i === 0 ? 'w-6 opacity-80' : 'w-1.5 opacity-30'}`}
            />
          ))}
        </div>
      </div>

      {/* ── Right panel – form ── */}
      <div className="flex flex-col items-center justify-center px-6 py-12 bg-background">
        {/* Mobile logo */}
        <div className="mb-10 flex items-center gap-2 lg:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            N
          </span>
          <span className="text-lg font-semibold text-foreground">Nexus</span>
        </div>

        <div className="w-full max-w-[400px] space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {eyebrow}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>

          {/* Slot for form */}
          {children}

          {/* Alternate link */}
          <p className="text-center text-sm text-muted-foreground">
            {alternateText}{' '}
            <Link
              href={alternateHref}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {alternateLabel}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── AuthError ────────────────────────────────────────────────────────────────
interface AuthErrorProps {
  message: string | null
}

export function AuthError({ message }: AuthErrorProps) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive"
    >
      <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <span>{message}</span>
    </div>
  )
}

// ─── AuthField ────────────────────────────────────────────────────────────────
interface AuthFieldProps {
  id: string
  label: string
  type?: React.HTMLInputTypeAttribute
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minLength?: number
  required?: boolean
}

export function AuthField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  minLength,
  required = true,
}: AuthFieldProps) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="h-12 rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
    </div>
  )
}

// ─── AuthSubmit ───────────────────────────────────────────────────────────────
interface AuthSubmitProps {
  loading: boolean
  children: React.ReactNode
}

export function AuthSubmit({ loading, children }: AuthSubmitProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Đang xử lý...
        </>
      ) : (
        children
      )}
    </button>
  )
}
