'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, MessageSquare, X } from 'lucide-react'

export interface ToastNotificationItem {
  id: string
  conversationId: string
  title: string
  senderName: string
  content: string
  time: string
}

interface NotificationToastProps {
  notification: ToastNotificationItem | null
  onClose: () => void
}

export function NotificationToast({ notification, onClose }: NotificationToastProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (notification) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification, onClose])

  if (!notification || !isVisible) return null

  function handleClick() {
    setIsVisible(false)
    router.push(`/chat/${notification?.conversationId}`)
    onClose()
  }

  return (
    <div
      onClick={handleClick}
      className="fixed top-5 right-5 z-50 flex max-w-sm cursor-pointer items-start gap-3 rounded-2xl border bg-card/95 p-4 shadow-2xl backdrop-blur-md transition-all hover:scale-[1.02] hover:bg-card active:scale-[0.98] animate-in slide-in-from-top-4 duration-300"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
        <Bell className="size-5 animate-wiggle" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-semibold text-primary">{notification.title}</p>
          <span className="text-[10px] text-muted-foreground">{notification.time}</span>
        </div>
        <p className="truncate text-xs font-medium text-foreground mt-0.5">
          <span className="text-muted-foreground font-normal">{notification.senderName}: </span>
          {notification.content || 'Đã gửi một tệp đính kèm'}
        </p>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsVisible(false)
          setTimeout(onClose, 300)
        }}
        className="text-muted-foreground hover:text-foreground transition p-0.5 rounded-md hover:bg-muted"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
