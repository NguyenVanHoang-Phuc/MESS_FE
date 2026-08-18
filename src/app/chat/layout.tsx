"use client"

import { ChatWorkspace } from "@/components/chat/chat-workspace"

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <ChatWorkspace>{children}</ChatWorkspace>
}
