'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Building2,
  MessageSquare,
  CheckSquare,
  ShieldCheck,
  Zap,
  ArrowRight,
  Users,
  Sparkles,
  Clock,
  FolderTree,
  BarChart3,
  ChevronRight,
  CheckCircle2,
  Lock,
  Layers,
  Bot,
  Activity,
  ArrowUpRight
} from 'lucide-react'

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user')
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored))
        } catch {}
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      {/* ─── 1. NAVBAR HEADER ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-blue-600 text-primary-foreground font-extrabold shadow-md shadow-primary/20 group-hover:scale-105 transition">
              <Building2 className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                MES <span className="text-primary font-normal text-xs uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-primary/10 ml-1">Platform</span>
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-muted-foreground">
            <a href="#features" className="hover:text-primary transition">Tính năng cốt lõi</a>
            <a href="#org-sync" className="hover:text-primary transition">Cơ cấu Phòng ban & Ca</a>
            <a href="#tasks" className="hover:text-primary transition">Giao việc trong Chat</a>
            <a href="#security" className="hover:text-primary transition">Bảo mật & Tốc độ</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <Link
                  href={currentUser.roleName?.toLowerCase() === 'admin' ? '/dashboard' : '/chat'}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition shadow-sm"
                >
                  <span>{currentUser.roleName?.toLowerCase() === 'admin' ? 'Vào Dashboard' : 'Vào Không gian Chat'}</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/70 transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition shadow-sm shadow-primary/20"
                >
                  <span>Đăng ký ngay</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── 2. HERO SECTION ────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/15 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold shadow-xs animate-in fade-in zoom-in duration-300">
            <Sparkles className="size-3.5 animate-spin text-primary" />
            <span>Hệ sinh thái MES 2.0 — Kết nối Không giới hạn Sản xuất & Điều hành</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.15] text-balance">
              Nền Tảng <span className="bg-gradient-to-r from-primary via-blue-500 to-indigo-600 bg-clip-text text-transparent">Nhắn Tin & Quản Trị</span> Doanh Nghiệp Sản Xuất
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
              Giải pháp all-in-one tích hợp trò chuyện thời gian thực, đồng bộ sơ đồ tổ chức phòng ban/ca tự động và giao việc trực tiếp ngay trong luồng hội thoại.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              href="/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-95 transition shadow-lg shadow-primary/25 flex items-center justify-center gap-2 group"
            >
              <span>Bắt đầu trải nghiệm miễn phí</span>
              <ArrowRight className="size-4 group-hover:translate-x-1 transition" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl border border-border bg-card/80 backdrop-blur-md text-foreground font-bold text-sm hover:bg-muted transition flex items-center justify-center gap-2"
            >
              <Users className="size-4 text-muted-foreground" />
              <span>Đăng nhập hệ thống</span>
            </Link>
          </div>

          {/* Hero App Mockup Display */}
          <div className="mt-12 relative max-w-5xl mx-auto rounded-3xl border border-border/80 bg-card/60 p-2 sm:p-4 shadow-2xl backdrop-blur-xl">
            <div className="rounded-2xl border border-border/50 bg-background overflow-hidden shadow-inner flex flex-col md:flex-row h-[460px] text-left">
              {/* Sidebar Preview */}
              <div className="w-64 border-r border-border bg-muted/20 p-3 hidden md:flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <span className="text-xs font-bold text-foreground">Sơ đồ Tổ chức (MES)</span>
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 text-primary font-semibold">
                    <Building2 className="size-3.5" />
                    <span>Ban Giám Đốc</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:bg-muted/50">
                    <FolderTree className="size-3.5 text-blue-500" />
                    <span>Phòng Kỹ thuật SX (8)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:bg-muted/50">
                    <Clock className="size-3.5 text-amber-500" />
                    <span>Ca 1 - Sáng (14)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:bg-muted/50">
                    <Users className="size-3.5 text-purple-500" />
                    <span>Phân xưởng Ép dập (25)</span>
                  </div>
                </div>
                <div className="mt-auto p-2.5 rounded-xl bg-card border border-border/60 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-bold text-foreground mb-1">
                    <ShieldCheck className="size-3.5 text-primary" />
                    <span>Auto Org Sync</span>
                  </div>
                  Thành viên chuyển phòng ban tự động cập nhật nhóm chat tức thời.
                </div>
              </div>

              {/* Chat Canvas Preview */}
              <div className="flex-1 flex flex-col bg-background/50 justify-between p-4">
                {/* Header preview */}
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xs">
                      KT
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">[Phòng] Kỹ thuật Sản xuất</h4>
                      <p className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-emerald-500" /> 8 nhân sự trực tuyến
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Nhóm Hệ Thống
                  </span>
                </div>

                {/* Message stream preview */}
                <div className="space-y-3 py-4 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="flex size-7 rounded-full bg-blue-500/10 text-blue-600 font-bold items-center justify-center text-[10px]">
                      A
                    </div>
                    <div className="bg-muted/60 p-3 rounded-2xl rounded-tl-xs max-w-sm space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground">Nguyễn Văn A · Trưởng phòng</p>
                      <p className="text-foreground">Đã giao task hiệu chỉnh máy ép dập cho Ca 1. Mọi người kiểm tra nhé!</p>
                    </div>
                  </div>

                  {/* Task Card interactive preview */}
                  <div className="ml-9 max-w-md rounded-2xl border border-primary/20 bg-primary/5 p-3.5 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold text-primary text-xs">
                        <CheckSquare className="size-4" /> TASK #204: Hiệu chuẩn khuôn dập lô #A12
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 text-[10px] font-bold">
                        Đang làm
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Người nhận: <strong>Trần Thị B</strong> · Hạn chót: <strong>16:30 Hôm nay</strong>
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5 justify-end">
                    <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-xs max-w-xs text-right">
                      <p>Đã nhận chỉ đạo! Em đang tiến hành đo đạc thông số ạ.</p>
                      <span className="text-[9px] opacity-75 mt-1 block">10:14 · Đã xem</span>
                    </div>
                  </div>
                </div>

                {/* Input box preview */}
                <div className="p-2.5 rounded-xl border border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
                  <span>Nhập tin nhắn, đính kèm file kỹ thuật hoặc tạo task mới...</span>
                  <div className="flex items-center gap-1.5">
                    <span className="p-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-[10px]">Gửi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. STATS BAR ────────────────────────────────────────────────── */}
      <section className="border-y border-border/70 bg-card/30 backdrop-blur-md py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-black tracking-tight text-primary">100%</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Đồng bộ Nhóm Tổ chức Tự động</p>
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight text-foreground">&lt; 30ms</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Độ trễ truyền tin Real-time</p>
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight text-foreground">99.99%</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Độ khả dụng & Uptime</p>
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight text-foreground">0%</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Rủi ro Thất lạc Chỉ đạo Sản xuất</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. CORE FEATURES SECTION ────────────────────────────────────── */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Tính Năng Đột Phá</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Thiết Kế Chuyên Biệt Cho Vận Hành Doanh Nghiệp</h2>
          <p className="text-sm text-muted-foreground">
            Mọi tính năng được tối ưu để giải quyết triệt để vấn đề phân mảnh thông tin giữa khối văn phòng và hiện trường sản xuất.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between hover:border-primary/40 transition group">
            <div className="space-y-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition">
                <FolderTree className="size-6" />
              </div>
              <h3 className="text-lg font-bold">Danh Bạ & Cơ Cấu Động (MES-015)</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tự động tạo cây thư mục phòng ban và phân xưởng. Khi nhân sự luân chuyển, nhóm chat tự động cập nhật mà không cần Admin thêm thủ công.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/60 flex items-center text-xs font-bold text-primary gap-1">
              <span>Xem sơ đồ tổ chức</span>
              <ChevronRight className="size-3.5" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between hover:border-primary/40 transition group">
            <div className="space-y-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition">
                <CheckSquare className="size-6" />
              </div>
              <h3 className="text-lg font-bold">Giao Việc Trong Khung Chat (MES-008)</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Biến bất kỳ tin nhắn trao đổi thành công việc có hạn chót (Deadline), người phụ trách (Assignee) và nhận thông báo nhắc việc tự động.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/60 flex items-center text-xs font-bold text-blue-500 gap-1">
              <span>Khám phá quản lý Task</span>
              <ChevronRight className="size-3.5" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between hover:border-primary/40 transition group">
            <div className="space-y-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition">
                <BarChart3 className="size-6" />
              </div>
              <h3 className="text-lg font-bold">Dashboard Quản Trị Toàn Diện</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Dành riêng cho Admin theo dõi KPIs nhân sự, cơ cấu phòng ban, quản lý ca làm việc và điều phối quyền truy cập tập trung.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/60 flex items-center text-xs font-bold text-purple-500 gap-1">
              <span>Đến trang Admin</span>
              <ChevronRight className="size-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. ORG SYNC DEEP DIVE SECTION ───────────────────────────────── */}
      <section id="org-sync" className="py-16 bg-muted/20 border-y border-border/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold border border-emerald-500/20">
              <Sparkles className="size-3.5" /> Tự động hóa 100%
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Quản Trị Phòng Ban & Ca Làm Việc Chưa Bao Giờ Dễ Dàng Đến Thế
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mỗi phòng ban và ca trực trong nhà máy đều được khởi tạo một không gian trao đổi mặc định được bảo vệ (`IsSystemGroup`). Không còn tình trạng nhân viên nghỉ việc vẫn còn trong nhóm mật hay nhân viên mới bị bỏ quên.
            </p>

            <div className="space-y-3 text-xs font-medium">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border">
                <CheckCircle2 className="size-4.5 text-emerald-500 shrink-0" />
                <span>Admin đổi phòng ban $\to$ Tự động chuyển nhóm & gửi tin chào mừng</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border">
                <CheckCircle2 className="size-4.5 text-emerald-500 shrink-0" />
                <span>Nhân viên vô hiệu hóa tài khoản $\to$ Tự động rời khỏi toàn bộ nhóm</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border">
                <CheckCircle2 className="size-4.5 text-emerald-500 shrink-0" />
                <span>Tra cứu danh bạ trực quan với trạng thái online thời gian thực</span>
              </div>
            </div>
          </div>

          {/* Flow visual illustration */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-bold flex items-center gap-2">
                <Activity className="size-4 text-primary" /> Chu trình Luân chuyển Nhân sự Tự động
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                Real-time Sync
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">1. Admin cập nhật hồ sơ</p>
                  <p className="text-[11px] text-muted-foreground">Chuyển Nguyễn Văn A từ [Kỹ thuật] sang [Sản xuất Ca 1]</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>

              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between text-primary">
                <div>
                  <p className="font-bold">2. OrgSyncService xử lý ngầm</p>
                  <p className="text-[11px] opacity-90">Rút khỏi nhóm cũ $\to$ Thêm vào nhóm mới $\to$ Gửi tin nhắn thông báo</p>
                </div>
                <Sparkles className="size-4" />
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">3. Thành viên nhận thông báo</p>
                  <p className="text-[11px] text-muted-foreground">Danh bạ cập nhật ngay lập tức không cần tải lại trang</p>
                </div>
                <CheckCircle2 className="size-4 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. BOTTOM CTA BANNER ────────────────────────────────────────── */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8">
        <div className="rounded-3xl bg-gradient-to-tr from-primary/90 via-primary to-blue-600 p-8 sm:p-14 text-primary-foreground shadow-2xl space-y-6 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Sẵn Sàng Nâng Tầm Giao Tiếp Cho Doanh Nghiệp Của Bạn?
            </h2>
            <p className="text-sm opacity-90 leading-relaxed text-balance">
              Trải nghiệm hệ thống nhắn tin & điều hành sản xuất hiện đại nhất hiện nay. Đăng ký tài khoản chỉ mất 30 giây.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white text-primary font-bold text-sm hover:bg-slate-50 transition shadow-lg"
              >
                Đăng ký tài khoản ngay
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-primary-foreground/15 border border-white/20 text-white font-bold text-sm hover:bg-primary-foreground/25 transition backdrop-blur-md"
              >
                Đăng nhập hệ thống
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. FOOTER ───────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-border bg-card/50 py-8 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
              M
            </div>
            <span className="font-bold text-foreground">MES Platform</span>
            <span>— Nền tảng Nhắn tin & Điều hành Doanh nghiệp 2026.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-foreground transition">Đăng nhập</Link>
            <Link href="/register" className="hover:text-foreground transition">Đăng ký</Link>
            <Link href="/dashboard" className="hover:text-foreground transition">Dashboard</Link>
            <Link href="/chat" className="hover:text-foreground transition">Chat Workspace</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
