'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Bell,
  Clock,
  Video,
  ExternalLink,
  Users,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  MoreVertical,
  Volume2,
  VolumeX,
  Share2,
  Copy,
  Check
} from 'lucide-react'
import { ZaloNotificationLogItem } from '@/lib/zalo-api'

interface ZaloPhoneSimulatorProps {
  isOpen: boolean
  onClose: () => void
  notifications: ZaloNotificationLogItem[]
  selectedCustomerName?: string
}

export function ZaloPhoneSimulator({
  isOpen,
  onClose,
  notifications,
  selectedCustomerName,
}: ZaloPhoneSimulatorProps) {
  const [selectedLogIndex, setSelectedLogIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'inapp' | 'lockscreen'>('inapp')
  const [copied, setCopied] = useState(false)
  const [currentTime, setCurrentTime] = useState('10:30')

  useEffect(() => {
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    setCurrentTime(`${hours}:${minutes}`)
  }, [isOpen])

  if (!isOpen || notifications.length === 0) return null

  const currentLog = notifications[selectedLogIndex] || notifications[0]

  const handleCopyLink = (url: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh]">
        
        {/* LEFT PANEL: Khách hàng & Bảng điều khiển giả lập */}
        <div className="w-full md:w-80 border-r border-border bg-muted/20 p-5 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Smartphone className="size-4.5" />
                <span>Zalo Simulator Hub</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                Live Preview
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Mô phỏng 100% giao diện nhận tin nhắn Zalo OA của khách hàng trên điện thoại di động.
            </p>

            {/* Toggle View Mode */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground">Chế độ hiển thị điện thoại:</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setViewMode('inapp')}
                  className={`py-1.5 rounded-lg transition ${
                    viewMode === 'inapp'
                      ? 'bg-card text-primary shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Trong App Zalo
                </button>
                <button
                  onClick={() => setViewMode('lockscreen')}
                  className={`py-1.5 rounded-lg transition ${
                    viewMode === 'lockscreen'
                      ? 'bg-card text-primary shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Màn hình khóa
                </button>
              </div>
            </div>

            {/* Customer Switcher */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Chọn máy của học viên ({notifications.length}):</span>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {notifications.map((item, idx) => (
                  <button
                    key={item.id || idx}
                    onClick={() => setSelectedLogIndex(idx)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition border flex items-center justify-between ${
                      selectedLogIndex === idx
                        ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-xs'
                        : 'bg-card border-border hover:bg-muted text-foreground'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="truncate text-xs">{item.customerName}</p>
                      <p className="text-[10px] text-muted-foreground">{item.customerPhone}</p>
                    </div>
                    <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4 text-[11px] text-muted-foreground space-y-1">
            <p><strong>Kênh gửi:</strong> Zalo ZNS Simulator</p>
            <p><strong>Message ID:</strong> <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{currentLog?.messageId}</code></p>
          </div>
        </div>

        {/* RIGHT PANEL: PHONE SHELL DISPLAY */}
        <div className="flex-1 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 flex items-center justify-center relative overflow-hidden">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 size-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="size-4" />
          </button>

          {/* SMARTPHONE FRAME (iPhone Mockup Style) */}
          <div className="relative w-[340px] sm:w-[360px] h-[640px] bg-black rounded-[48px] p-3 shadow-2xl border-4 border-slate-700/80 ring-1 ring-white/10 flex flex-col justify-between overflow-hidden">
            
            {/* Dynamic Island / Camera Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-between px-3">
              <div className="size-2 rounded-full bg-slate-900 border border-slate-800" />
              <div className="size-2.5 rounded-full bg-blue-950/60 border border-blue-900" />
            </div>

            {/* Phone Screen Canvas */}
            <div className="w-full h-full bg-[#f4f6f9] text-slate-900 rounded-[38px] overflow-hidden flex flex-col relative select-none">
              
              {/* Status Bar */}
              <div className="h-10 px-6 flex items-center justify-between text-[11px] font-bold text-slate-800 z-20 pt-1">
                <span>{currentTime}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px]">5G</span>
                  <div className="w-5 h-2.5 border border-slate-700 rounded-xs p-0.5 flex items-center">
                    <div className="h-full w-full bg-slate-800 rounded-2xs" />
                  </div>
                </div>
              </div>

              {/* ─── SCREEN CONTENT ───────────────────────────── */}
              {viewMode === 'lockscreen' ? (
                /* LOCK SCREEN VIEW */
                <div className="flex-1 bg-gradient-to-b from-blue-900/40 via-indigo-950/60 to-slate-950 p-4 flex flex-col justify-between text-white relative">
                  <div className="text-center pt-8 space-y-1">
                    <span className="text-5xl font-extralight tracking-tight">{currentTime}</span>
                    <p className="text-xs opacity-80">Thứ Hai, 24 tháng 8</p>
                  </div>

                  {/* Push Notification Banner */}
                  <div
                    onClick={() => setViewMode('inapp')}
                    className="cursor-pointer rounded-2xl bg-white/85 backdrop-blur-xl p-3.5 text-slate-900 shadow-xl border border-white/40 space-y-1.5 transform hover:scale-[1.02] transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="size-5 rounded-md bg-[#0068FF] text-white font-bold flex items-center justify-center text-[10px]">
                          Z
                        </div>
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          Trung Tâm Đào Tạo MES
                          <ShieldCheck className="size-3.5 text-amber-500 fill-amber-500 inline" />
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">Vừa xong</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900">
                      THÔNG BÁO CA HỌC MỚI: {currentLog?.courseName}
                    </p>
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      Chào {currentLog?.customerName}, bạn có ca học mới bắt đầu lúc {currentLog?.shiftTime}. Bấm để xem chi tiết...
                    </p>
                  </div>

                  <div className="text-center pb-2">
                    <p className="text-[10px] opacity-70">Chạm vào thông báo để mở Zalo</p>
                  </div>
                </div>
              ) : (
                /* IN-APP ZALO CHAT VIEW */
                <div className="flex-1 flex flex-col bg-[#e8ecf2] justify-between overflow-hidden">
                  {/* Zalo OA Header */}
                  <div className="bg-[#0068FF] text-white px-3 py-2.5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <ChevronLeft className="size-5 shrink-0" />
                      <div className="size-8 rounded-full bg-white text-[#0068FF] font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                        MES
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h4 className="text-xs font-bold truncate">Trung Tâm MES OA</h4>
                          <span className="size-3.5 rounded-full bg-amber-400 text-slate-900 text-[9px] font-black flex items-center justify-center">
                            ✓
                          </span>
                        </div>
                        <p className="text-[9px] text-blue-100 flex items-center gap-1">
                          <span className="size-1 rounded-full bg-emerald-400" /> Doanh nghiệp xác thực
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <Share2 className="size-4" />
                      <MoreVertical className="size-4" />
                    </div>
                  </div>

                  {/* Chat Message Scroll Body */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-3">
                    <div className="text-center">
                      <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-slate-300/80 text-slate-600 font-medium">
                        Hôm nay {currentTime}
                      </span>
                    </div>

                    {/* ZALO OA RICH CARD (ZNS TEMPLATE) */}
                    <div className="rounded-2xl bg-white shadow-md border border-slate-200/80 overflow-hidden text-left animate-in zoom-in-95 duration-200">
                      {/* Card Banner Header */}
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-blue-200">
                          <span>Thông Báo Ca Học Mới</span>
                          <span className="px-1.5 py-0.2 rounded bg-white/20 text-white text-[9px]">
                            ZNS Verified
                          </span>
                        </div>
                        <h3 className="text-sm font-extrabold text-white leading-snug">
                          {currentLog?.courseName}
                        </h3>
                      </div>

                      {/* Card Details Body */}
                      <div className="p-3.5 space-y-2.5 text-xs text-slate-700">
                        <p className="text-slate-600 text-[11px]">
                          Kính gửi học viên <strong>{currentLog?.customerName}</strong>, hệ thống xin gửi thông tin ca học hôm nay của bạn:
                        </p>

                        <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Khóa học:</span>
                            <span className="font-bold text-slate-900 text-right">{currentLog?.courseName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Thời gian:</span>
                            <span className="font-bold text-blue-600 text-right">{currentLog?.shiftTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Giảng viên:</span>
                            <span className="font-semibold text-slate-800 text-right">{currentLog?.teacherName}</span>
                          </div>
                          {currentLog?.customNote && (
                            <div className="flex justify-between border-t border-slate-200/60 pt-1.5">
                              <span className="text-slate-500">Ghi chú:</span>
                              <span className="font-medium text-amber-700 text-right">{currentLog?.customNote}</span>
                            </div>
                          )}
                        </div>

                        {/* Action CTA Button inside Card */}
                        <div className="space-y-1.5 pt-1">
                          <a
                            href={currentLog?.roomUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2.5 rounded-xl bg-[#0068FF] hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                          >
                            <Video className="size-3.5" />
                            <span>Vào Lớp Học Ngay</span>
                          </a>

                          <button
                            onClick={() => handleCopyLink(currentLog?.roomUrl || '')}
                            className="w-full py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold text-[10px] flex items-center justify-center gap-1 transition"
                          >
                            {copied ? (
                              <>
                                <Check className="size-3 text-emerald-600" />
                                <span className="text-emerald-600">Đã sao chép link phòng học!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="size-3" />
                                <span>Sao chép link Zoom / Phòng học</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Footer Badge */}
                      <div className="bg-slate-50/80 px-3 py-1.5 border-t border-slate-100 text-[9px] text-slate-400 flex items-center justify-between">
                        <span>Tin nhắn tự động từ Zalo OA</span>
                        <span>{currentTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Zalo Input bar dummy */}
                  <div className="bg-white p-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400 px-3">
                    <span>Nhập tin nhắn phản hồi cho OA...</span>
                    <div className="size-6 rounded-full bg-blue-50 text-[#0068FF] flex items-center justify-center font-bold text-xs">
                      ➤
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Home Indicator Bar */}
            <div className="w-28 h-1 bg-slate-600 rounded-full mx-auto mt-2" />
          </div>
        </div>
      </div>
    </div>
  )
}
