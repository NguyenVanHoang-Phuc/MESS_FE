'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, AlertTriangle, ArrowRight, Bell, Clock, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { TaskReminderDto } from '@/types/task'

interface TaskReminderToastProps {
  reminder: TaskReminderDto | null
  onDismiss?: () => void
}

export function TaskReminderToast({ reminder, onDismiss }: TaskReminderToastProps) {
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [currentReminder, setCurrentReminder] = useState<TaskReminderDto | null>(null)

  useEffect(() => {
    if (reminder) {
      setCurrentReminder(reminder)
      setVisible(true)

      const timer = setTimeout(() => {
        setVisible(false)
        if (onDismiss) onDismiss()
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [reminder, onDismiss])

  if (!visible || !currentReminder) return null

  const isOverdue = currentReminder.type === 'Overdue'
  const isDue1h = currentReminder.type === 'DueSoon1h'

  const borderClass = isOverdue
    ? 'border-rose-500/50 bg-rose-950/80 text-rose-100 shadow-rose-950/50 ring-1 ring-rose-500/30'
    : isDue1h
    ? 'border-amber-500/50 bg-amber-950/80 text-amber-100 shadow-amber-950/50 ring-1 ring-amber-500/30'
    : 'border-blue-500/50 bg-blue-950/80 text-blue-100 shadow-blue-950/50 ring-1 ring-blue-500/30'

  const iconClass = isOverdue
    ? 'text-rose-400 bg-rose-500/20'
    : isDue1h
    ? 'text-amber-400 bg-amber-500/20'
    : 'text-blue-400 bg-blue-500/20'

  const deadlineLocal = (() => {
    if (!currentReminder.deadline) return ''
    try {
      const d = new Date(currentReminder.deadline)
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
    } catch {
      return ''
    }
  })()

  const displayText = (() => {
    if (isOverdue) {
      return `Công việc "${currentReminder.taskTitle}" đã quá hạn hoàn thành${deadlineLocal ? ` lúc ${deadlineLocal}` : ''}!`
    }
    if (isDue1h) {
      return `Công việc "${currentReminder.taskTitle}" sắp đến hạn trong vòng 1 giờ tới${deadlineLocal ? ` (Hạn chót: ${deadlineLocal})` : ''}!`
    }
    return `Công việc "${currentReminder.taskTitle}" sắp đến hạn hoàn thành${deadlineLocal ? ` (Hạn chót: ${deadlineLocal})` : ''}!`
  })()

  function handleNavigate() {
    setVisible(false)
    if (onDismiss) onDismiss()
    if (currentReminder?.conversationId) {
      router.push(`/chat/${currentReminder.conversationId}`)
    }
  }

  return (
    <div className="fixed top-5 right-5 z-50 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-200">
      <div
        className={`flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-md transition ${borderClass}`}
      >
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
          {isOverdue ? (
            <AlertCircle className="size-5 animate-pulse" />
          ) : isDue1h ? (
            <AlertTriangle className="size-5 animate-bounce" />
          ) : (
            <Clock className="size-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">
              {isOverdue ? '🚨 Cảnh báo Quá hạn' : isDue1h ? '⏰ Sắp đến hạn (1 giờ)' : '⏰ Nhắc nhở Task (24h)'}
            </span>
            <button
              type="button"
              onClick={() => {
                setVisible(false)
                if (onDismiss) onDismiss()
              }}
              className="rounded-lg p-0.5 opacity-70 hover:opacity-100 transition cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <p className="mt-1 text-xs font-medium leading-snug break-words">
            {displayText}
          </p>

          {currentReminder.conversationId && (
            <button
              type="button"
              onClick={handleNavigate}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1 text-[11px] font-semibold text-white transition cursor-pointer"
            >
              <span>Xem cuộc trò chuyện</span>
              <ArrowRight className="size-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
