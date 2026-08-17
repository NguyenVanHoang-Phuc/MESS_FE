// Dashboard layout — passthrough shell.
// The page component handles its own sidebar + header layout internally.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
