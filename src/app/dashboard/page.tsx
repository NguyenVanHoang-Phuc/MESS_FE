'use client'

import { useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Search,
  Settings,
  ShoppingBag,
  Users,
  X,
} from 'lucide-react'

const stats = [
  { label: 'Tổng doanh thu', value: '₫128.4M', change: '+12.8%', note: 'so với tháng trước', icon: CircleDollarSign, trend: 'up' },
  { label: 'Đơn hàng', value: '1,284', change: '+8.4%', note: 'so với tháng trước', icon: ShoppingBag, trend: 'up' },
  { label: 'Khách hàng mới', value: '482', change: '+18.2%', note: 'so với tháng trước', icon: Users, trend: 'up' },
  { label: 'Tỷ lệ chuyển đổi', value: '6.24%', change: '-2.1%', note: 'so với tháng trước', icon: Activity, trend: 'down' },
]

const orders = [
  { id: '#DH-10482', customer: 'Nguyễn Minh Anh', product: 'Gói Pro hàng tháng', amount: '₫1.290.000', status: 'Đã thanh toán', time: '12 phút trước' },
  { id: '#DH-10481', customer: 'Trần Hoàng Nam', product: 'Gói Business', amount: '₫2.990.000', status: 'Đang xử lý', time: '34 phút trước' },
  { id: '#DH-10480', customer: 'Lê Phương Thảo', product: 'Gói Pro hàng tháng', amount: '₫1.290.000', status: 'Đã thanh toán', time: '1 giờ trước' },
  { id: '#DH-10479', customer: 'Phạm Đức Long', product: 'Gói Starter', amount: '₫490.000', status: 'Đã hủy', time: '2 giờ trước' },
]

export default function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [active, setActive] = useState('Tổng quan')

  return (
    <main className="min-h-screen bg-background text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-sidebar px-4 py-5 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8 flex items-center justify-between px-2">
          <div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><span className="text-lg font-bold">N</span></div><span className="text-lg font-semibold tracking-tight">Nexus</span></div>
          <button className="rounded-lg p-2 text-muted-foreground lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Đóng menu"><X /></button>
        </div>
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Không gian làm việc</p>
        <nav className="flex flex-col gap-1">
          {[['Tổng quan', LayoutDashboard], ['Đơn hàng', ShoppingBag], ['Khách hàng', Users], ['Báo cáo', FileText]].map(([label, Icon]) => <button key={label as string} onClick={() => { setActive(label as string); setSidebarOpen(false) }} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${active === label ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}><Icon className="size-[18px]" />{label as string}</button>)}
        </nav>
        <p className="mb-3 mt-8 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Hệ thống</p>
        <button className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"><Settings className="size-[18px]" />Cài đặt</button>
        <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-4"><p className="text-sm font-medium">Nâng cấp gói của bạn</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Mở khóa thêm tính năng cho đội ngũ.</p><button className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">Xem các gói</button></div>
        <div className="mt-4 flex items-center gap-3 border-t border-sidebar-border px-2 pt-4"><div className="flex size-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">MA</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">Minh Anh</p><p className="truncate text-xs text-muted-foreground">admin@nexus.vn</p></div><ChevronDown className="size-4 text-muted-foreground" /></div>
      </aside>
      {sidebarOpen && <button className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Đóng menu" />}
      <section className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-md md:px-8"><div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 hover:bg-muted lg:hidden" aria-label="Mở menu"><Menu /></button><div><p className="text-xs text-muted-foreground">Thứ Hai, 17 tháng 8, 2026</p><h1 className="text-base font-semibold md:text-lg">{active}</h1></div></div><div className="flex items-center gap-2"><button className="hidden items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground md:flex"><Search className="size-4" />Tìm kiếm <kbd className="ml-3 rounded border border-border px-1.5 text-[10px]">⌘ K</kbd></button><button className="relative rounded-lg p-2.5 text-muted-foreground hover:bg-muted" aria-label="Thông báo"><Bell className="size-[18px]" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" /></button></div></header>
        <div className="mx-auto max-w-[1400px] p-5 md:p-8"><div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="mb-2 text-sm font-medium text-primary">Chào buổi sáng, Minh Anh</p><h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Tổng quan kinh doanh</h2><p className="mt-2 text-sm text-muted-foreground">Theo dõi hiệu suất và hoạt động mới nhất của bạn.</p></div><button className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm shadow-sm hover:bg-muted"><span className="size-2 rounded-full bg-primary" />01 – 31 Tháng 8, 2026<ChevronDown className="size-4 text-muted-foreground" /></button></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, change, note, icon: Icon, trend }) => <div key={label} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-start justify-between"><div className="rounded-xl bg-muted p-2.5"><Icon className="size-5 text-muted-foreground" /></div><span className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-primary' : 'text-muted-foreground'}`}>{trend === 'up' ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}{change}</span></div><p className="mt-5 text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></div>)}</div>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]"><div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Doanh thu</h3><p className="mt-1 text-sm text-muted-foreground">Hiệu suất doanh thu theo thời gian</p></div><button className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground">Theo tháng <ChevronDown className="ml-1 inline size-3" /></button></div><div className="mt-6 flex h-56 items-end gap-2 border-b border-border px-1 pb-0 sm:gap-4">{[35, 48, 42, 58, 52, 70, 64, 76, 68, 88, 78, 94].map((height, i) => <div key={i} className="group flex h-full flex-1 flex-col justify-end"><div className="relative rounded-t-md bg-primary/80 transition-all group-hover:bg-primary" style={{ height: `${height}%` }}><span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 text-[10px] text-muted-foreground group-hover:block">{height}M</span></div></div>)}</div><div className="mt-3 flex justify-between text-[11px] text-muted-foreground"><span>T.01</span><span>T.03</span><span>T.05</span><span>T.07</span><span>T.09</span><span>T.11</span></div></div><div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Phân bổ khách hàng</h3><p className="mt-1 text-sm text-muted-foreground">Theo nhóm khách hàng</p></div><MoreHorizontal className="size-5 text-muted-foreground" /></div><div className="mt-7 flex items-center gap-6"><div className="relative flex size-36 shrink-0 items-center justify-center rounded-full" style={{ background: 'conic-gradient(var(--primary) 0 62%, var(--muted) 62% 84%, color-mix(in oklch, var(--primary) 45%, var(--muted)) 84% 100%)' }}><div className="flex size-24 flex-col items-center justify-center rounded-full bg-card"><strong className="text-xl">2,486</strong><span className="text-[10px] text-muted-foreground">Tổng khách hàng</span></div></div><div className="flex flex-col gap-3 text-xs"><span><i className="mr-2 inline-block size-2 rounded-full bg-primary" />Khách hàng mới <b className="ml-2">62%</b></span><span><i className="mr-2 inline-block size-2 rounded-full bg-muted" />Quay lại <b className="ml-2">22%</b></span><span><i className="mr-2 inline-block size-2 rounded-full bg-primary/50" />Khác <b className="ml-2">16%</b></span></div></div></div></div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><div className="flex items-center justify-between border-b border-border p-5 md:p-6"><div><h3 className="font-semibold">Đơn hàng gần đây</h3><p className="mt-1 text-sm text-muted-foreground">Các giao dịch mới nhất trong hệ thống</p></div><button className="text-sm font-medium text-primary hover:underline">Xem tất cả</button></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-6 py-3 font-medium">Mã đơn</th><th className="px-6 py-3 font-medium">Khách hàng</th><th className="px-6 py-3 font-medium">Sản phẩm</th><th className="px-6 py-3 font-medium">Giá trị</th><th className="px-6 py-3 font-medium">Trạng thái</th><th className="px-6 py-3 font-medium">Thời gian</th></tr></thead><tbody className="divide-y divide-border">{orders.map(order => <tr key={order.id} className="transition-colors hover:bg-muted/30"><td className="px-6 py-4 font-medium">{order.id}</td><td className="px-6 py-4">{order.customer}</td><td className="px-6 py-4 text-muted-foreground">{order.product}</td><td className="px-6 py-4 font-medium">{order.amount}</td><td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${order.status === 'Đã thanh toán' ? 'bg-primary/10 text-primary' : order.status === 'Đang xử lý' ? 'bg-muted text-foreground' : 'bg-muted text-muted-foreground'}`}>{order.status}</span></td><td className="px-6 py-4 text-muted-foreground">{order.time}</td></tr>)}</tbody></table></div></div>
        </div>
      </section>
    </main>
  )
}
