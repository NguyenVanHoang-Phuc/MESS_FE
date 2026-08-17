'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { Bot, Edit, Menu, MessageSquare, Plus, Settings, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'

const conversations = [
  { id: 'marketing-plan', title: 'Kế hoạch marketing Q4', time: 'Hôm nay' },
  { id: 'email-partner', title: 'Viết email cho đối tác', time: 'Hôm qua' },
  { id: 'blog-outline', title: 'Tạo outline bài viết', time: 'Hôm qua' },
  { id: 'code-review', title: 'Review code React', time: 'Tuần trước' },
]

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { conversationId } = useParams()

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-muted/30 transition-transform duration-300 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bot className="size-5" />
            </div>
            <span>Nexus AI</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="p-4">
          <Button className="w-full justify-start gap-2" variant="outline">
            <Plus className="size-4" />
            Cuộc trò chuyện mới
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          <div className="space-y-1">
            <p className="px-2 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Gần đây
            </p>
            {conversations.map((chat) => {
              const isActive = conversationId === chat.id
              return (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.id}`}
                  className={cn(
                    'group flex items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-muted font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <MessageSquare className="size-4 shrink-0" />
                    <span className="truncate">{chat.title}</span>
                  </div>
                  {isActive && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0 opacity-0 group-hover:opacity-100"
                    >
                      <Edit className="size-3" />
                    </Button>
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
            <Settings className="size-4" />
            Cài đặt AI
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col min-w-0">
        {/* Mobile Header (only visible on mobile to open sidebar) */}
        <div className="flex h-16 shrink-0 items-center border-b px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="size-5" />
          </Button>
          <span className="ml-4 font-semibold">Nexus AI</span>
        </div>
        
        {/* Chat Content */}
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </main>
    </div>
  )
}
