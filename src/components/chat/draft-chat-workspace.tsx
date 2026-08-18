'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Send,
  User,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { sendDirectMessageApi, uploadFilesApi } from '@/services/api/chat'
import { formatFileSize } from '@/utils/formatters'
import type { AttachmentInput, ConversationResponse, UserSummaryResponse } from '@/types/chat'

interface DraftChatWorkspaceProps {
  recipient: UserSummaryResponse
  onConversationCreated: (newConversation: ConversationResponse) => void
  onCancel: () => void
}

export function DraftChatWorkspace({
  recipient,
  onConversationCreated,
  onCancel,
}: DraftChatWorkspaceProps) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<AttachmentInput[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (attachments.length + files.length > 30) {
      setError('Tối đa 30 tệp mỗi lần gửi.')
      return
    }

    setUploadingFiles(true)
    setError(null)
    try {
      const fileArray = Array.from(files)
      const uploaded = await uploadFilesApi(fileArray)
      const newAtts: AttachmentInput[] = uploaded.map((f) => ({
        fileUrl: f.fileUrl,
        fileType: f.fileType,
        fileSize: f.fileSize,
      }))
      setAttachments((prev) => [...prev, ...newAtts])
    } catch (err: any) {
      setError(err?.message || 'Tải tệp lên thất bại.')
    } finally {
      setUploadingFiles(false)
      e.target.value = ''
    }
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed && attachments.length === 0) return

    setSending(true)
    setError(null)

    const clientOpId = `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    try {
      const res = await sendDirectMessageApi({
        recipientId: recipient.id,
        content: trimmed || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
        clientOperationId: clientOpId,
      })

      if (res && res.conversation) {
        onConversationCreated(res.conversation)
        router.push(`/chat/${res.conversation.id}`)
      } else {
        setError('Không thể gửi tin nhắn. Vui lòng thử lại.')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi gửi tin nhắn.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col h-full bg-background overflow-hidden">
      {/* Draft Header */}
      <div className="flex h-[73px] items-center justify-between border-b bg-card px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {recipient.fullName ? recipient.fullName.substring(0, 2).toUpperCase() : 'NV'}
          </div>
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              {recipient.fullName}
              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-normal text-muted-foreground">
                Tin nhắn mới
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">
              {recipient.departmentName || recipient.roleName || recipient.username}
            </p>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition"
          title="Đóng nháp"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Empty State / Welcome Guide */}
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-4 shadow-sm">
          <User className="size-8" />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          Bắt đầu cuộc trò chuyện với {recipient.fullName}
        </h3>
        <p className="max-w-sm mt-1 text-xs text-muted-foreground leading-relaxed">
          Cuộc trò chuyện này đang ở chế độ nháp. Hội thoại sẽ chỉ được tạo chính thức trên hệ thống sau khi bạn gửi tin nhắn đầu tiên.
        </p>
      </div>

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="px-6 py-2 border-t bg-card/60 flex items-center gap-2 overflow-x-auto">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-xl border bg-card px-3 py-1.5 text-xs text-foreground shadow-xs shrink-0"
            >
              <FileText className="size-3.5 text-primary" />
              <span className="max-w-[120px] truncate text-[11px] font-medium">
                {att.fileUrl.split('/').pop() || 'Tệp đính kèm'}
              </span>
              {att.fileSize && (
                <span className="text-[10px] text-muted-foreground">({formatFileSize(att.fileSize)})</span>
              )}
              <button
                type="button"
                onClick={() => removeAttachment(idx)}
                className="text-muted-foreground hover:text-destructive p-0.5 rounded"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div className="mx-6 mb-2 rounded-xl border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-destructive">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-4 border-t bg-card">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          {/* File Upload Button */}
          <label className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploadingFiles || sending}
            />
            {uploadingFiles ? <Loader2 className="size-5 animate-spin text-primary" /> : <Paperclip className="size-5" />}
          </label>

          {/* Textarea */}
          <div className="min-w-0 flex-1 rounded-2xl border bg-background px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/20">
            <textarea
              rows={1}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={`Nhập tin nhắn gửi đến ${recipient.fullName}...`}
              className="w-full resize-none bg-transparent text-xs outline-none placeholder:text-muted-foreground max-h-28"
            />
          </div>

          {/* Send Button */}
          <Button
            type="submit"
            size="icon"
            disabled={sending || (!content.trim() && attachments.length === 0)}
            className="size-10 shrink-0 rounded-xl"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </form>
      </div>
    </div>
  )
}
