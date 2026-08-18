'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, MessageSquarePlus, MessagesSquare } from 'lucide-react'
import { getConversations } from '@/services/api/chat'
import { Button } from '@/components/ui/button'

export default function ChatIndexPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [hasConversations, setHasConversations] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        const conversations = await getConversations()
        if (conversations && conversations.length > 0) {
          setHasConversations(true)
          // Redirect immediately to the most recent conversation
          router.replace(`/chat/${conversations[0].id}`)
        } else {
          setLoading(false)
        }
      } catch (err) {
        setLoading(false)
      }
    }
    init()
  }, [router])

  if (loading) {
    return (
      <div className="flex flex-1 h-full items-center justify-center text-muted-foreground text-sm gap-2">
        <Loader2 className="size-5 animate-spin text-primary" />
        <span>Đang mở cuộc hội thoại gần nhất...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-1 h-full flex-col items-center justify-center p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-4">
        <MessagesSquare className="size-8" />
      </div>
      <h2 className="text-lg font-semibold tracking-tight">Chào mừng bạn đến với Nexus Chat</h2>
      <p className="mt-1 text-xs text-muted-foreground max-w-sm">
        Bạn chưa có cuộc hội thoại nào hoặc chưa chọn đoạn chat. Hãy chọn một cuộc trò chuyện từ thanh bên trái hoặc tạo nhóm chat mới!
      </p>
    </div>
  )
}
