'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Calendar,
  CheckSquare,
  Clock,
  Flag,
  Loader2,
  MessageSquareQuote,
  Sparkles,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createTaskApi } from '@/services/api/tasks'
import type { TaskPriority, TaskResponse } from '@/types/task'
import type { MessageResponse, ParticipantResponse } from '@/types/chat'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  conversationId?: string
  sourceMessage?: MessageResponse | null
  participants: ParticipantResponse[]
  currentUserId?: string
  conversationTitle?: string
  onTaskCreated: (task: TaskResponse) => void
}

const PRIORITIES: { value: TaskPriority; label: string; color: string; badge: string }[] = [
  { value: 'Low', label: 'Thấp', color: 'text-emerald-400', badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
  { value: 'Medium', label: 'Trung bình', color: 'text-amber-400', badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  { value: 'High', label: 'Cao', color: 'text-orange-400', badge: 'border-orange-500/30 bg-orange-500/10 text-orange-300' },
  { value: 'Urgent', label: 'Khẩn cấp', color: 'text-rose-400', badge: 'border-rose-500/30 bg-rose-500/10 text-rose-300' },
]

export function CreateTaskModal({
  isOpen,
  onClose,
  conversationId,
  sourceMessage,
  participants,
  currentUserId,
  conversationTitle,
  onTaskCreated,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([])
  const [priority, setPriority] = useState<TaskPriority>('Medium')
  const [deadlineDate, setDeadlineDate] = useState('')
  const [deadlineTime, setDeadlineTime] = useState('18:00')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize values when modal opens or sourceMessage changes
  useEffect(() => {
    if (!isOpen) return

    setError(null)
    setLoading(false)

    if (sourceMessage) {
      const rawText = sourceMessage.content?.trim() || ''
      // Extract title from first line / sentence
      const firstLine = rawText.split('\n')[0].replace(/^[#\-\*•\s]+/, '').trim()
      const initialTitle = firstLine ? (firstLine.length > 80 ? firstLine.substring(0, 77) + '...' : firstLine) : 'Công việc từ tin nhắn'
      
      setTitle(initialTitle)
      setDescription(rawText)

      // Default assignee logic (MES-010):
      if (sourceMessage.senderId && sourceMessage.senderId !== currentUserId) {
        setSelectedAssigneeIds([sourceMessage.senderId])
      } else {
        const other = participants.find((p) => p.userId !== currentUserId)
        setSelectedAssigneeIds(other ? [other.userId] : currentUserId ? [currentUserId] : [])
      }
    } else {
      // Flow 2: Created from chat input toolbar
      setTitle('')
      setDescription('')
      const other = participants.find((p) => p.userId !== currentUserId)
      setSelectedAssigneeIds(other ? [other.userId] : currentUserId ? [currentUserId] : [])
    }

    // Default deadline to tomorrow 18:00
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yyyy = tomorrow.getFullYear()
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0')
    const dd = String(tomorrow.getDate()).padStart(2, '0')
    setDeadlineDate(`${yyyy}-${mm}-${dd}`)
    setDeadlineTime('18:00')
    setPriority('Medium')
  }, [isOpen, sourceMessage, participants, currentUserId])

  // Toggle single assignee
  function toggleAssignee(userId: string) {
    setSelectedAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  // Quick deadline helpers
  function setQuickDeadline(daysAhead: number) {
    const d = new Date()
    d.setDate(d.getDate() + daysAhead)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    setDeadlineDate(`${yyyy}-${mm}-${dd}`)
    if (daysAhead === 0) {
      const now = new Date()
      const futureHour = Math.min(23, now.getHours() + 2)
      setDeadlineTime(`${String(futureHour).padStart(2, '0')}:00`)
    }
  }

  const todayYyyyMmDd = (() => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  })()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Vui lòng nhập tiêu đề công việc.')
      return
    }

    let deadlineIso: string | undefined = undefined
    if (deadlineDate) {
      try {
        const [yyyy, mm, dd] = deadlineDate.split('-').map(Number)
        const [hh, min] = (deadlineTime || '18:00').split(':').map(Number)
        const dateObj = new Date(yyyy, mm - 1, dd, hh, min, 0)
        if (!isNaN(dateObj.getTime())) {
          if (dateObj.getTime() <= Date.now()) {
            setError('Hạn chót (Deadline) của công việc phải lớn hơn thời gian hiện tại.')
            return
          }
          deadlineIso = dateObj.toISOString()
        }
      } catch {
        // ignore date format error
      }
    }

    setLoading(true)
    setError(null)

    try {
      const created = await createTaskApi({
        conversationId,
        sourceMessageId: sourceMessage ? sourceMessage.id : undefined,
        assigneeId: selectedAssigneeIds.length > 0 ? selectedAssigneeIds[0] : undefined,
        assigneeIds: selectedAssigneeIds,
        title: trimmedTitle,
        description: description.trim() || undefined,
        deadline: deadlineIso,
        priority,
      })

      onTaskCreated(created)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Không thể tạo task. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <CheckSquare className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
                {sourceMessage ? 'Tạo Task từ tin nhắn' : 'Giao việc / Tạo Task mới'}
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                  Giai đoạn 2
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                {sourceMessage
                  ? `Liên kết với tin nhắn của ${sourceMessage.senderName}`
                  : `Trong hội thoại ${conversationTitle || 'này'}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Source Message Preview (MES-009) */}
          {sourceMessage && (
            <div className="rounded-xl border border-border/80 bg-muted/30 p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <MessageSquareQuote className="size-3.5 text-primary" />
                  Tin nhắn nguồn ({sourceMessage.senderName})
                </span>
                <span className="text-[10px]">{new Date(sourceMessage.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-muted-foreground italic line-clamp-3 text-[11px] bg-background/60 p-2 rounded-lg border border-border/40">
                "{sourceMessage.content || '[Hình ảnh/Tệp đính kèm]'}"
              </p>
              {sourceMessage.attachments && sourceMessage.attachments.length > 0 && (
                <p className="text-[10px] text-primary/80 font-medium">
                  📎 Kèm theo {sourceMessage.attachments.length} tệp đính kèm
                </p>
              )}
            </div>
          )}

          {/* Title Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Tiêu đề công việc <span className="text-destructive">*</span></span>
              <span className="text-[10px] text-muted-foreground font-normal">Tự động trích xuất từ tin nhắn</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Thiết kế mockup trang sản phẩm..."
              className="w-full h-9 px-3 rounded-lg border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
              required
              autoFocus
            />
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Mô tả chi tiết</span>
              <span className="text-[10px] text-muted-foreground font-normal">Có thể chỉnh sửa</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập nội dung chi tiết hoặc yêu cầu cụ thể..."
              rows={3}
              className="w-full p-3 rounded-lg border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Multi-Assignee Selection (MES-010) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Users className="size-3.5 text-primary" />
                <span>Người phụ trách ({selectedAssigneeIds.length} người)</span>
              </label>
              <div className="flex items-center gap-1.5 text-[11px]">
                {currentUserId && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedAssigneeIds.includes(currentUserId)) {
                        setSelectedAssigneeIds([...selectedAssigneeIds, currentUserId])
                      }
                    }}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    + Gán cho tôi
                  </button>
                )}
                <span className="text-muted-foreground">·</span>
                <button
                  type="button"
                  onClick={() => setSelectedAssigneeIds(participants.map((p) => p.userId))}
                  className="text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
                >
                  Tất cả
                </button>
                <span className="text-muted-foreground">·</span>
                <button
                  type="button"
                  onClick={() => setSelectedAssigneeIds([])}
                  className="text-muted-foreground hover:text-destructive hover:underline cursor-pointer"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto rounded-xl border p-2 bg-muted/20">
              {participants.map((p) => {
                const isSelected = selectedAssigneeIds.includes(p.userId)
                return (
                  <button
                    key={p.userId}
                    type="button"
                    onClick={() => toggleAssignee(p.userId)}
                    className={`flex items-center gap-2 rounded-lg p-2 text-left text-xs transition border cursor-pointer ${
                      isSelected
                        ? 'border-primary/40 bg-primary/10 text-primary font-medium shadow-2xs'
                        : 'border-transparent hover:bg-muted text-foreground'
                    }`}
                  >
                    <div
                      className={`size-4 rounded flex items-center justify-center border text-[10px] shrink-0 transition ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-muted-foreground/40 bg-background'
                      }`}
                    >
                      {isSelected && '✓'}
                    </div>
                    <div className="flex-1 truncate">
                      <span className="truncate">{p.fullName || p.username}</span>
                      {p.userId === currentUserId && <span className="ml-1 text-[10px] opacity-70">(Tôi)</span>}
                    </div>
                  </button>
                )
              })}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Có thể chọn nhiều người cùng phụ trách. Tất cả người được chọn sẽ nhận thông báo qua SignalR.
            </p>
          </div>

          {/* Priority & Deadline Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Flag className="size-3.5 text-amber-500" />
                <span>Mức độ ưu tiên</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`px-2 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      priority === p.value
                        ? `${p.badge} ring-1 ring-primary/40 font-semibold shadow-xs`
                        : 'border-border/60 text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="size-3.5 text-blue-400" />
                <span>Hạn hoàn thành (Deadline)</span>
              </label>
              <div className="flex gap-1.5">
                <input
                  type="date"
                  min={todayYyyyMmDd}
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border bg-background text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary flex-1 cursor-pointer"
                />
                <input
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  className="h-9 px-2 rounded-lg border bg-background text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary w-24"
                />
              </div>
              {/* Quick chips */}
              <div className="flex items-center gap-1 pt-0.5">
                <button
                  type="button"
                  onClick={() => setQuickDeadline(0)}
                  className="px-2 py-0.5 rounded text-[10px] border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDeadline(1)}
                  className="px-2 py-0.5 rounded text-[10px] border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  Ngày mai
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDeadline(3)}
                  className="px-2 py-0.5 rounded text-[10px] border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  +3 ngày
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDeadline(7)}
                  className="px-2 py-0.5 rounded text-[10px] border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  +1 tuần
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !title.trim()}
              className="text-xs gap-1.5 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Đang tạo task...
                </>
              ) : (
                <>
                  <CheckSquare className="size-3.5" />
                  Tạo Task công việc
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
