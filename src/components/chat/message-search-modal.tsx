'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Clock,
  FileText,
  Filter,
  Loader2,
  MessageSquare,
  Paperclip,
  Search,
  User,
  Users,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getUsers, searchMessagesApi } from '@/services/api/chat'
import { formatMessageTime } from '@/utils/formatters'
import type { MessageSearchResultItem, UserSummaryResponse } from '@/types/chat'

interface MessageSearchModalProps {
  isOpen: boolean
  onClose: () => void
  initialConversationId?: string
}

export function MessageSearchModal({
  isOpen,
  onClose,
  initialConversationId,
}: MessageSearchModalProps) {
  const router = useRouter()

  const [keyword, setKeyword] = useState('')
  const [senderId, setSenderId] = useState<string>('')
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7days' | '30days'>('all')
  const [hasAttachments, setHasAttachments] = useState<boolean>(false)

  const [users, setUsers] = useState<UserSummaryResponse[]>([])
  const [results, setResults] = useState<MessageSearchResultItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Load users for sender filter
  useEffect(() => {
    if (isOpen) {
      getUsers().then(setUsers).catch(() => {})
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(() => {
      executeSearch()
    }, 300)

    return () => clearTimeout(timer)
  }, [isOpen, keyword, senderId, datePreset, hasAttachments])

  async function executeSearch() {
    if (!keyword.trim() && !senderId && datePreset === 'all' && !hasAttachments) {
      setResults([])
      setTotalCount(0)
      setHasSearched(false)
      return
    }

    setLoading(true)
    setHasSearched(true)

    let fromDate: string | undefined
    const now = new Date()

    if (datePreset === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      fromDate = today.toISOString()
    } else if (datePreset === '7days') {
      const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      fromDate = d.toISOString()
    } else if (datePreset === '30days') {
      const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      fromDate = d.toISOString()
    }

    try {
      const data = await searchMessagesApi({
        q: keyword.trim() || undefined,
        senderId: senderId || undefined,
        conversationId: initialConversationId || undefined,
        fromDate: fromDate,
        hasAttachments: hasAttachments ? true : undefined,
        pageSize: 30,
      })
      setResults(data.items || [])
      setTotalCount(data.totalCount || 0)
    } catch (err) {
      console.error('Failed to search messages', err)
    } finally {
      setLoading(false)
    }
  }

  function handleSelectResult(item: MessageSearchResultItem) {
    onClose()
    router.push(`/chat/${item.conversationId}`)
  }

  // Highlight matching keyword
  function renderHighlightedText(text?: string, query?: string) {
    if (!text) return <span className="italic text-muted-foreground">Không có nội dung văn bản</span>
    if (!query || !query.trim()) return text

    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="rounded bg-amber-500/25 text-amber-600 dark:text-amber-400 font-semibold px-0.5 py-0.2">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-2xl bg-card border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
              <Search className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Tìm kiếm tin nhắn</h3>
              <p className="text-xs text-muted-foreground">Tìm kiếm nhanh theo từ khóa, người gửi, và thời gian</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-6 border-b space-y-3 bg-muted/20">
          {/* Main Keyword Input */}
          <div className="flex items-center gap-2 rounded-xl border bg-background px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-primary/20">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Nhập từ khóa nội dung tin nhắn cần tìm..."
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground font-medium"
              autoFocus
            />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword('')}
                className="text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            {/* Sender Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border bg-background px-3 py-1.5 text-muted-foreground">
              <User className="size-3.5 text-primary shrink-0" />
              <select
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                className="bg-transparent text-foreground outline-none text-xs cursor-pointer"
              >
                <option value="">Tất cả người gửi</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Preset Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border bg-background px-3 py-1.5 text-muted-foreground">
              <Calendar className="size-3.5 text-primary shrink-0" />
              <select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value as any)}
                className="bg-transparent text-foreground outline-none text-xs cursor-pointer"
              >
                <option value="all">Mọi khoảng thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="7days">7 ngày qua</option>
                <option value="30days">30 ngày qua</option>
              </select>
            </div>

            {/* Has Attachments Filter Toggle */}
            <button
              type="button"
              onClick={() => setHasAttachments((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                hasAttachments
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              <Paperclip className="size-3.5" />
              <span>Có tệp đính kèm</span>
            </button>

            {/* Reset Filters button */}
            {(senderId || datePreset !== 'all' || hasAttachments || keyword) && (
              <button
                type="button"
                onClick={() => {
                  setKeyword('')
                  setSenderId('')
                  setDatePreset('all')
                  setHasAttachments(false)
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground underline ml-auto"
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[380px] p-6 divide-y divide-border/60">
          {loading && (
            <div className="flex flex-col items-center justify-center p-12 text-xs text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary mb-2" />
              Đang tìm kiếm tin nhắn...
            </div>
          )}

          {!loading && !hasSearched && (
            <div className="flex flex-col items-center justify-center p-12 text-center text-xs text-muted-foreground">
              <MessageSquare className="size-8 text-muted-foreground/50 mb-2" />
              <p>Nhập từ khóa hoặc chọn bộ lọc để bắt đầu tìm kiếm trong lịch sử tin nhắn</p>
            </div>
          )}

          {!loading && hasSearched && results.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-center text-xs text-muted-foreground">
              <Search className="size-8 text-muted-foreground/50 mb-2" />
              <p className="font-medium text-foreground">Không tìm thấy tin nhắn nào phù hợp</p>
              <p className="mt-1 text-[11px]">Hãy thử tìm bằng từ khóa khác hoặc điều chỉnh bộ lọc</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-medium pb-1">
                Tìm thấy <strong className="text-foreground">{totalCount}</strong> kết quả:
              </p>

              {results.map((item) => (
                <div
                  key={item.messageId}
                  onClick={() => handleSelectResult(item)}
                  className="group flex flex-col gap-2 rounded-xl border bg-card p-3.5 transition hover:border-primary/40 hover:bg-accent/40 cursor-pointer shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                        {item.senderName ? item.senderName.substring(0, 2).toUpperCase() : 'NV'}
                      </div>
                      <span className="font-semibold text-xs text-foreground truncate">{item.senderName}</span>
                      <span className="text-[10px] text-muted-foreground">trong</span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground truncate max-w-[140px]">
                        {item.conversationType === 'Group' ? <Users className="size-3" /> : <User className="size-3" />}
                        {item.conversationTitle || 'Hội thoại'}
                      </span>
                    </div>

                    <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatMessageTime(item.sentAt)}
                    </span>
                  </div>

                  <p className="text-xs text-foreground/90 leading-relaxed line-clamp-2">
                    {renderHighlightedText(item.content, keyword)}
                  </p>

                  {item.attachments && item.attachments.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      {item.attachments.map((att, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 rounded-lg border bg-background px-2 py-0.5 text-[10px] text-muted-foreground"
                        >
                          <FileText className="size-3 text-primary" />
                          <span className="truncate max-w-[120px]">{att.fileName || 'Tệp đính kèm'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t px-6 py-3 bg-muted/10">
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}
