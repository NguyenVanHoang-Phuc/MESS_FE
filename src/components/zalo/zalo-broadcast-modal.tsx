'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Send,
  Users,
  Building2,
  Clock,
  Video,
  Sparkles,
  CheckSquare,
  Square,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  Loader2,
  BookOpen
} from 'lucide-react'
import {
  CustomerRecipient,
  getZaloRecipients,
  sendZaloScheduleNotification,
  ZaloNotificationLogItem
} from '@/lib/zalo-api'

const DEFAULT_MOCK_RECIPIENTS: CustomerRecipient[] = [
  { id: 'c1', fullName: 'Nguyễn Văn A', username: 'userA', phoneNumber: '0912345671', departmentName: 'Phòng Kỹ thuật', positionTitle: 'Trưởng phòng', totalNotificationsReceived: 2 },
  { id: 'c2', fullName: 'Trần Thị B', username: 'userB', phoneNumber: '0912345672', departmentName: 'Phòng Kỹ thuật', positionTitle: 'Kỹ sư cơ khí', totalNotificationsReceived: 1 },
  { id: 'c3', fullName: 'Đỗ Thu Hằng', username: 'ketoan1', phoneNumber: '0912345673', departmentName: 'Phòng Kế toán', positionTitle: 'Kế toán Trưởng', totalNotificationsReceived: 0 },
  { id: 'c4', fullName: 'Vũ Minh Châu', username: 'ketoan2', phoneNumber: '0912345674', departmentName: 'Phòng Kế toán', positionTitle: 'Kế toán viên', totalNotificationsReceived: 0 },
  { id: 'c5', fullName: 'Hoàng Văn Dũng', username: 'epdap1', phoneNumber: '0912345675', departmentName: 'Phân xưởng Ép dập', positionTitle: 'Quản đốc', totalNotificationsReceived: 3 },
  { id: 'c6', fullName: 'Ngô Thành Nam', username: 'epdap2', phoneNumber: '0912345676', departmentName: 'Phân xưởng Ép dập', positionTitle: 'Tổ trưởng', totalNotificationsReceived: 1 },
  { id: 'c7', fullName: 'Bùi Anh Tuấn', username: 'epdap3', phoneNumber: '0912345677', departmentName: 'Phân xưởng Ép dập', positionTitle: 'Kỹ thuật viên', totalNotificationsReceived: 0 },
  { id: 'c8', fullName: 'Trịnh Kim Ngân', username: 'qaqc1', phoneNumber: '0912345678', departmentName: 'Phòng QA/QC', positionTitle: 'Trưởng phòng QA', totalNotificationsReceived: 0 },
  { id: 'c9', fullName: 'Đặng Thái Sơn', username: 'qaqc2', phoneNumber: '0912345679', departmentName: 'Phòng QA/QC', positionTitle: 'Chuyên viên QC', totalNotificationsReceived: 0 },
  { id: 'c10', fullName: 'Phạm Quốc Huy', username: 'ktsx1', phoneNumber: '0912345680', departmentName: 'Phòng Kỹ thuật', positionTitle: 'Kỹ sư tự động hóa', totalNotificationsReceived: 0 }
]

interface ZaloBroadcastModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccessOpenSimulator?: (logs: ZaloNotificationLogItem[]) => void
}

export function ZaloBroadcastModal({
  isOpen,
  onClose,
  onSuccessOpenSimulator
}: ZaloBroadcastModalProps) {
  const [recipients, setRecipients] = useState<CustomerRecipient[]>(DEFAULT_MOCK_RECIPIENTS)
  const [selectedIds, setSelectedIds] = useState<string[]>(DEFAULT_MOCK_RECIPIENTS.map(r => r.id))
  const [loadingRecipients, setLoadingRecipients] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Form Fields
  const [courseName, setCourseName] = useState('Khóa học Kỹ năng Vận hành & Quản trị MES')
  const [shiftTime, setShiftTime] = useState('08:30 - 11:30 Hôm nay')
  const [roomUrl, setRoomUrl] = useState('https://zoom.us/j/9821234891')
  const [teacherName, setTeacherName] = useState('ThS. Nguyễn Văn A')
  const [customNote, setCustomNote] = useState('Học viên chuẩn bị tài liệu bài giảng trước 10 phút.')

  useEffect(() => {
    if (isOpen) {
      setLoadingRecipients(true)
      getZaloRecipients()
        .then((data) => {
          if (data && data.length > 0) {
            setRecipients(data)
            setSelectedIds(data.slice(0, 10).map((r) => r.id))
          } else {
            setRecipients(DEFAULT_MOCK_RECIPIENTS)
            setSelectedIds(DEFAULT_MOCK_RECIPIENTS.map((r) => r.id))
          }
        })
        .catch(() => {
          setRecipients(DEFAULT_MOCK_RECIPIENTS)
          setSelectedIds(DEFAULT_MOCK_RECIPIENTS.map((r) => r.id))
        })
        .finally(() => setLoadingRecipients(false))
    }
  }, [isOpen])

  if (!isOpen) return null

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSelectFirst10 = () => {
    setSelectedIds(recipients.slice(0, 10).map((r) => r.id))
  }

  const handleSelectAll = () => {
    setSelectedIds(recipients.map((r) => r.id))
  }

  const handleDeselectAll = () => {
    setSelectedIds([])
  }

  const handleSendBroadcast = async () => {
    if (selectedIds.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất một khách hàng để gửi thông báo.')
      return
    }
    if (!courseName.trim() || !shiftTime.trim()) {
      setErrorMessage('Vui lòng nhập tên khóa học và thời gian ca học.')
      return
    }

    setErrorMessage(null)
    setIsSending(true)

    try {
      let resultLogs: ZaloNotificationLogItem[] = []
      try {
        const result = await sendZaloScheduleNotification({
          customerIds: selectedIds,
          courseName: courseName.trim(),
          shiftTime: shiftTime.trim(),
          roomUrl: roomUrl.trim(),
          teacherName: teacherName.trim(),
          customNote: customNote.trim(),
        })
        if (result && result.results && result.results.length > 0) {
          resultLogs = result.results
        }
      } catch {
        // Fallback simulation logs if offline
      }

      if (resultLogs.length === 0) {
        // Generate simulated log items
        const selectedList = recipients.filter(r => selectedIds.includes(r.id))
        resultLogs = selectedList.map((r) => ({
          id: 'sim-' + Math.random(),
          customerId: r.id,
          customerName: r.fullName,
          customerPhone: r.phoneNumber,
          courseName: courseName.trim(),
          shiftTime: shiftTime.trim(),
          roomUrl: roomUrl.trim(),
          teacherName: teacherName.trim(),
          customNote: customNote.trim(),
          sentByUserId: 'user-admin',
          sentByUserName: 'Quản trị viên Hệ thống',
          status: 'SUCCESS',
          channel: 'ZALO_ZNS_SIMULATOR',
          messageId: `ZNS-${Date.now().toString().slice(-8)}`,
          sentAt: new Date().toISOString()
        }))
      }

      onClose()
      if (onSuccessOpenSimulator && resultLogs.length > 0) {
        onSuccessOpenSimulator(resultLogs)
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Có lỗi xảy ra trong quá trình gửi tin Zalo.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#0068FF] text-white font-bold text-xs shadow-sm">
              Zalo
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-foreground">Đẩy Thông Báo Ca Học Qua Zalo OA</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold border border-emerald-500/20">
                  Simulator 100% Free
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Gửi thông báo ca học đồng loạt cho danh sách khách hàng quản lý
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SECTION 1: CUSTOMER SELECTION */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="font-bold text-foreground flex items-center gap-1.5">
                <Users className="size-4 text-primary" />
                <span>1. Chọn khách hàng nhận thông báo ({selectedIds.length}/{recipients.length} đã chọn):</span>
              </label>
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectFirst10}
                  className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold hover:bg-primary/20 transition"
                >
                  Chọn 10 KH mẫu
                </button>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2 py-1 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition"
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            {/* Recipient list */}
            <div className="border border-border rounded-2xl p-2 max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-muted/20">
              {loadingRecipients ? (
                <div className="col-span-2 py-6 text-center text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Đang tải danh sách học viên...
                </div>
              ) : recipients.length === 0 ? (
                <div className="col-span-2 py-6 text-center text-muted-foreground">
                  Chưa có dữ liệu khách hàng.
                </div>
              ) : (
                recipients.map((r) => {
                  const isChecked = selectedIds.includes(r.id)
                  return (
                    <div
                      key={r.id}
                      onClick={() => toggleSelect(r.id)}
                      className={`cursor-pointer p-2 rounded-xl border flex items-center justify-between transition ${
                        isChecked
                          ? 'bg-primary/10 border-primary/30 text-primary font-semibold'
                          : 'bg-card border-border hover:bg-muted text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isChecked ? (
                          <CheckSquare className="size-4 text-primary shrink-0" />
                        ) : (
                          <Square className="size-4 text-muted-foreground shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-xs">{r.fullName}</p>
                          <p className="text-[10px] text-muted-foreground">{r.phoneNumber} · {r.departmentName}</p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* SECTION 2: COURSE & SHIFT DETAILS */}
          <div className="space-y-3 pt-2 border-t border-border">
            <label className="font-bold text-foreground flex items-center gap-1.5">
              <BookOpen className="size-4 text-primary" />
              <span>2. Chi tiết Ca học & Nội dung thông báo:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground">Tên Khóa học / Chuyên đề:</span>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="VD: Khóa học Quản trị Vận hành MES"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground">Thời gian ca học:</span>
                <input
                  type="text"
                  value={shiftTime}
                  onChange={(e) => setShiftTime(e.target.value)}
                  placeholder="VD: 08:30 - 11:30 Hôm nay"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground">Giảng viên / Phụ trách:</span>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="VD: ThS. Nguyễn Văn A"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground">Link phòng học / Zoom:</span>
                <input
                  type="text"
                  value={roomUrl}
                  onChange={(e) => setRoomUrl(e.target.value)}
                  placeholder="VD: https://zoom.us/j/12345678"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="col-span-1 sm:col-span-2 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground">Ghi chú thêm gửi học viên:</span>
                <textarea
                  rows={2}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Nhập lời dặn dò, tài liệu chuẩn bị..."
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/20">
          <p className="text-[11px] text-muted-foreground hidden sm:block">
            Đã sẵn sàng gửi cho <strong>{selectedIds.length}</strong> khách hàng qua Zalo OA.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleSendBroadcast}
              disabled={isSending || selectedIds.length === 0}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#0068FF] hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Đang đẩy thông báo...</span>
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  <span>Đẩy thông báo Zalo OA ({selectedIds.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
