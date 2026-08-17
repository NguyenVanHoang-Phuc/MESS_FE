"use client"

import { FormEvent, useState } from "react"
import { ArrowUp, Bot, Paperclip, Plus, User } from "lucide-react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Message, MessageAvatar, MessageContent, MessageGroup } from "@/components/ui/message"
import { MessageScroller, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport } from "@/components/ui/message-scroller"

const initialMessages = [
  { role: "assistant", text: "Xin chào! Mình có thể giúp gì cho bạn hôm nay?" },
  { role: "user", text: "Mình muốn lên kế hoạch marketing cho quý 4." },
  { role: "assistant", text: "Tuyệt vời. Hãy bắt đầu bằng việc xác định mục tiêu, nhóm khách hàng và ngân sách. Bạn muốn ưu tiên kênh nào?" },
]

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState("")
  const title = conversationId === "marketing-plan" ? "Kế hoạch marketing Q4" : "Cuộc trò chuyện mới"
  function sendMessage(event: FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    setMessages((current) => [...current, { role: "user", text }])
    setDraft("")
  }
  return <MessageScrollerProvider><div className="flex h-full flex-col"><header className="flex h-16 shrink-0 items-center border-b px-6"><div><p className="text-sm font-semibold">{title}</p><p className="text-xs text-muted-foreground">Nexus AI</p></div></header><MessageScroller className="min-h-0 flex-1"><MessageScrollerViewport><MessageScrollerContent className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8"><MessageScrollerItem><MessageGroup>{messages.map((message, index) => <Message key={`${message.role}-${index}`} align={message.role === "user" ? "end" : "start"} className="mb-5"><MessageAvatar className="size-8 border bg-card"><span className="sr-only">{message.role === "user" ? "Bạn" : "Nexus AI"}</span>{message.role === "user" ? <User /> : <Bot />}</MessageAvatar><MessageContent className={message.role === "user" ? "max-w-[80%] rounded-2xl bg-primary px-4 py-3 text-primary-foreground" : "max-w-[80%] rounded-2xl border bg-card px-4 py-3"}><p className="leading-6">{message.text}</p></MessageContent></Message>)}</MessageGroup></MessageScrollerItem></MessageScrollerContent></MessageScrollerViewport></MessageScroller><div className="border-t bg-background px-4 py-4 md:px-8"><form onSubmit={sendMessage} className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm"><Button type="button" variant="ghost" size="icon" aria-label="Đính kèm tệp"><Paperclip /></Button><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); sendMessage(event) } }} placeholder="Nhắn tin cho Nexus AI..." aria-label="Tin nhắn" className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground" rows={1} /><Button type="button" variant="ghost" size="icon" aria-label="Thêm công cụ"><Plus /></Button><Button type="submit" size="icon" aria-label="Gửi tin nhắn" disabled={!draft.trim()}><ArrowUp /></Button></form><p className="mx-auto mt-2 max-w-3xl text-center text-xs text-muted-foreground">Nexus AI có thể tạo ra thông tin chưa chính xác. Hãy kiểm tra các thông tin quan trọng.</p></div></div></MessageScrollerProvider>
}
