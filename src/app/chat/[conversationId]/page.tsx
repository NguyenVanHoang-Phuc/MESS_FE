"use client"

import { FormEvent, useEffect, useState, useRef } from "react"
import { ArrowUp, Bot, Check, Paperclip, Plus, User } from "lucide-react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Message, MessageAvatar, MessageContent, MessageGroup } from "@/components/ui/message"
import { MessageScroller, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport } from "@/components/ui/message-scroller"
import { useSignalR } from "@/hooks/useSignalR"
import { getMessages, sendMessageApi } from "@/services/api/chat"
import { getCurrentUser } from "@/services/api/auth"
import { formatMessageTime } from "@/utils/formatters"
import type { MessageResponse } from "@/types/chat"

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const [messages, setMessages] = useState<MessageResponse[]>([])
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const { incomingMessage } = useSignalR(conversationId)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const user = getCurrentUser()
    if (user) setCurrentUser(user)
  }, [])

  // Listen for real-time incoming SignalR messages and prevent duplicates
  useEffect(() => {
    if (!incomingMessage || incomingMessage.conversationId !== conversationId) return

    setMessages((prev) => {
      // 1. If exact message ID already exists, do nothing
      if (prev.some((m) => m.id === incomingMessage.id)) {
        return prev
      }

      // 2. If this is a message from me, check if we have a temporary optimistic message
      const isMyMessage =
        (currentUser?.userId && incomingMessage.senderId === currentUser.userId) ||
        incomingMessage.senderName === currentUser?.fullName ||
        incomingMessage.senderName === "Tôi"

      if (isMyMessage) {
        const tempIndex = prev.findIndex(
          (m) => m.id.startsWith("temp-") && m.content === incomingMessage.content
        )
        if (tempIndex !== -1) {
          const updated = [...prev]
          updated[tempIndex] = incomingMessage
          return updated
        }
      }

      // 3. Otherwise append new message
      return [...prev, incomingMessage]
    })
  }, [incomingMessage, conversationId, currentUser])

  // Load conversation messages
  useEffect(() => {
    async function load() {
      if (!conversationId) return
      setLoading(true)
      const data = await getMessages(conversationId)
      setMessages(data)
      setLoading(false)
    }
    load()
  }, [conversationId])

  async function handleSendMessage(event: FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || !conversationId || isSending) return

    setIsSending(true)
    const tempId = `temp-${Date.now()}`
    const tempMessage: MessageResponse = {
      id: tempId,
      conversationId,
      senderId: currentUser?.userId || 'me',
      senderName: currentUser?.fullName || 'Tôi',
      content: text,
      isRecalled: false,
      sentAt: new Date().toISOString(),
      attachments: [],
      reactions: [],
    }

    // Optimistic UI update
    setMessages((prev) => [...prev, tempMessage])
    setDraft("")

    const sentMessage = await sendMessageApi(conversationId, text)
    if (sentMessage) {
      setMessages((prev) => {
        // If SignalR already pushed this message, just remove the temp message
        const alreadyAddedBySignalR = prev.some((m) => m.id === sentMessage.id)
        if (alreadyAddedBySignalR) {
          return prev.filter((m) => m.id !== tempId)
        }
        // Otherwise replace temp message with backend confirmed message
        return prev.map((m) => (m.id === tempId ? sentMessage : m))
      })
    }
    setIsSending(false)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Đang tải tin nhắn...
      </div>
    )
  }

  return (
    <MessageScrollerProvider>
      <div className="flex h-full flex-col">
        <MessageScroller className="min-h-0 flex-1">
          <MessageScrollerViewport>
            <MessageScrollerContent className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <p className="text-sm font-medium">Chưa có tin nhắn nào trong hội thoại này.</p>
                  <p className="mt-1 text-xs">Hãy gửi tin nhắn đầu tiên để bắt đầu trò chuyện!</p>
                </div>
              ) : (
                <MessageScrollerItem>
                  <MessageGroup>
                    {messages.map((message) => {
                      const isOwn =
                        Boolean(currentUser?.userId && message.senderId === currentUser.userId) ||
                        message.senderName === "Tôi" ||
                        message.senderName === currentUser?.fullName

                      const timeStr = formatMessageTime(message.sentAt)

                      return (
                        <Message
                          key={message.id}
                          align={isOwn ? "end" : "start"}
                          className="mb-5"
                        >
                          <MessageAvatar className="size-8 border bg-card text-xs font-semibold">
                            <span className="sr-only">{isOwn ? "Bạn" : message.senderName}</span>
                            {isOwn
                              ? (currentUser?.fullName ? currentUser.fullName.substring(0, 2).toUpperCase() : "AN")
                              : (message.senderName ? message.senderName.substring(0, 2).toUpperCase() : <User className="size-4" />)}
                          </MessageAvatar>
                          <div className={isOwn ? "flex flex-col items-end max-w-[80%]" : "flex flex-col items-start max-w-[80%]"}>
                            <div className="mb-1 flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
                              <span className="font-medium">{isOwn ? "Bạn" : message.senderName}</span>
                              {timeStr && <span>{timeStr}</span>}
                            </div>
                            <MessageContent
                              className={
                                isOwn
                                  ? "rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground shadow-sm"
                                  : "rounded-2xl rounded-tl-sm border bg-card px-4 py-3 text-sm text-card-foreground shadow-sm"
                              }
                            >
                              <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            </MessageContent>
                          </div>
                        </Message>
                      )
                    })}
                  </MessageGroup>
                </MessageScrollerItem>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
        </MessageScroller>

        <div className="border-t bg-card px-4 py-4 md:px-8">
          <form
            onSubmit={handleSendMessage}
            className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border bg-background p-2 shadow-sm"
          >
            <Button type="button" variant="ghost" size="icon" aria-label="Đính kèm tệp">
              <Paperclip className="size-4 text-muted-foreground" />
            </Button>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
                  event.preventDefault()
                  handleSendMessage(event)
                }
              }}
              placeholder="Nhập tin nhắn..."
              aria-label="Tin nhắn"
              className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Gửi tin nhắn"
              disabled={!draft.trim() || isSending}
              className="rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
            >
              <ArrowUp className="size-4" />
            </Button>
          </form>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-muted-foreground">
            Enter để gửi · Shift + Enter để xuống dòng
          </p>
        </div>
      </div>
    </MessageScrollerProvider>
  )
}
