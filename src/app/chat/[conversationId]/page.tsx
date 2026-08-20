"use client"

import { FormEvent, useEffect, useState, useRef, ChangeEvent, DragEvent, ClipboardEvent, useCallback } from "react"
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  CheckCheck,
  CheckSquare,
  ChevronDown,
  Download,
  Eye,
  File,
  FileArchive,
  FileAudio,
  FileSpreadsheet,
  FileText,
  Film,
  ImageIcon,
  Loader2,
  MoreHorizontal,
  Paperclip,
  Smile,
  Trash2,
  Undo2,
  Upload,
  User,
  X,
  ZoomIn,
} from "lucide-react"
import { useParams } from "next/navigation"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Button } from "@/components/ui/button"
import { Message, MessageAvatar, MessageContent, MessageGroup } from "@/components/ui/message"
import { MessageScroller, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport } from "@/components/ui/message-scroller"
import { useSignalR } from "@/hooks/useSignalR"
import { getConversationById, getMessages, markConversationAsReadApi, reactMessageApi, recallMessageApi, sendMessageApi, uploadFilesApi } from "@/services/api/chat"
import { getTasksApi } from "@/services/api/tasks"
import { getCurrentUser } from "@/services/api/auth"
import { formatFileSize, formatMessageTime } from "@/utils/formatters"
import { cn } from "@/utils/cn"
import type { AttachmentInput, AttachmentResponse, ConversationResponse, MessageResponse, ReactionResponse } from "@/types/chat"
import type { TaskResponse } from "@/types/task"
import { CreateTaskModal } from "@/components/chat/create-task-modal"
import { TaskItemBadge } from "@/components/chat/task-item-badge"
import { TaskReminderToast } from "@/components/chat/task-reminder-toast"

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"]

interface SelectedFileItem {
  id: string
  file: File
  previewUrl?: string
  type: "image" | "video" | "audio" | "doc"
  name: string
  size: number
}

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const [messages, setMessages] = useState<MessageResponse[]>([])
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileItem[]>([])
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null)

  // Task Integration States (MES-009 & MES-010)
  const [tasks, setTasks] = useState<TaskResponse[]>([])
  const [isTasksHubOpen, setIsTasksHubOpen] = useState(false)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [createTaskSourceMessage, setCreateTaskSourceMessage] = useState<MessageResponse | null>(null)
  const [conversationDetails, setConversationDetails] = useState<ConversationResponse | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const { 
    incomingMessage, 
    readEvent, 
    recalledEvent, 
    reactionEvent, 
    typingEvent, 
    incomingTask, 
    taskUpdatedEvent, 
    taskDeletedEvent, 
    taskReminderEvent,
    sendTyping 
  } = useSignalR(conversationId)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [hiddenMessageIds, setHiddenMessageIds] = useState<string[]>([])
  const [recallingMessageId, setRecallingMessageId] = useState<string | null>(null)
  const [confirmRecallId, setConfirmRecallId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Live Typing Indicators
  const [typingUsers, setTypingUsers] = useState<{ userId: string; userName: string }[]>([])
  const typingTimerRef = useRef<{ [key: string]: NodeJS.Timeout }>({})
  const isSelfTypingRef = useRef(false)
  const selfTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cursor Pagination States (Performance Optimization)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [isLoadingOlder, setIsLoadingOlder] = useState<boolean>(false)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [newMessageCount, setNewMessageCount] = useState(0)

  const visibleMessages = messages.filter((m) => !hiddenMessageIds.includes(m.id))

  // Virtualized List (Windowing for high performance 60fps rendering)
  const rowVirtualizer = useVirtualizer({
    count: visibleMessages.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => 90,
    overscan: 8,
  })

  // Safe measureElement ref callback to prevent React 18/19 flushSync inside lifecycle warning
  const measureElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return
      queueMicrotask(() => {
        rowVirtualizer.measureElement(node)
      })
    },
    [rowVirtualizer]
  )

  // Scroll to the very last message
  function scrollToBottom() {
    if (visibleMessages.length > 0) {
      rowVirtualizer.scrollToIndex(visibleMessages.length - 1, { align: 'end', behavior: 'auto' })
    } else {
      const el = viewportRef.current
      if (el) el.scrollTop = el.scrollHeight
    }
    setIsAtBottom(true)
    setNewMessageCount(0)
  }

  useEffect(() => {
    const user = getCurrentUser()
    if (user) setCurrentUser(user)
    if (conversationId) {
      try {
        const saved = localStorage.getItem(`hidden_messages_${conversationId}`)
        if (saved) setHiddenMessageIds(JSON.parse(saved))
      } catch {}
    }
  }, [conversationId])

  // Mark conversation as read on load and when receiving new message
  useEffect(() => {
    if (conversationId) {
      markConversationAsReadApi(conversationId)
    }
  }, [conversationId, incomingMessage])

  // Handle incoming realtime Typing Events from other participants
  useEffect(() => {
    if (!typingEvent || typingEvent.conversationId !== conversationId) return
    const isMe =
      (currentUser?.userId && typingEvent.userId === currentUser.userId) ||
      (currentUser?.fullName && typingEvent.userName === currentUser.fullName)

    if (isMe) return

    const { userId, userName, isTyping } = typingEvent
    const key = userId || userName

    if (isTyping) {
      setTypingUsers((prev) => {
        if (prev.some((u) => u.userId === userId || u.userName === userName)) return prev
        return [...prev, { userId, userName }]
      })

      // Auto-clear typing status after 3.5 seconds if user stops typing without firing stop event
      if (typingTimerRef.current[key]) {
        clearTimeout(typingTimerRef.current[key])
      }
      typingTimerRef.current[key] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => (u.userId ? u.userId !== userId : u.userName !== userName)))
      }, 3500)
    } else {
      if (typingTimerRef.current[key]) {
        clearTimeout(typingTimerRef.current[key])
      }
      setTypingUsers((prev) => prev.filter((u) => (u.userId ? u.userId !== userId : u.userName !== userName)))
    }
  }, [typingEvent, conversationId, currentUser])

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
          (m) =>
            m.id.startsWith("temp-") &&
            (m.content === incomingMessage.content ||
             (m.attachments && m.attachments.length > 0 && incomingMessage.attachments && incomingMessage.attachments.length > 0))
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

  // Listen for real-time read receipts from SignalR
  useEffect(() => {
    if (!readEvent || readEvent.conversationId !== conversationId) return

    setMessages((prev) =>
      prev.map((msg) => {
        if (readEvent.messageIds.includes(msg.id)) {
          const existingReads = msg.reads || []
          if (!existingReads.some((r) => r.userId === readEvent.readerId)) {
            return {
              ...msg,
              reads: [
                ...existingReads,
                {
                  userId: readEvent.readerId,
                  userName: readEvent.readerName,
                  fullName: readEvent.readerName,
                  readAt: readEvent.readAt,
                },
              ],
            }
          }
        }
        return msg
      })
    )
  }, [readEvent, conversationId])

  // Listen for real-time message recalled from SignalR (MES-007)
  useEffect(() => {
    if (!recalledEvent || recalledEvent.conversationId !== conversationId) return

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === recalledEvent.messageId
          ? { ...msg, isRecalled: true, content: undefined, attachments: [] }
          : msg
      )
    )
  }, [recalledEvent, conversationId])

  // Listen for real-time reactions from SignalR (MES-008)
  useEffect(() => {
    if (!reactionEvent || reactionEvent.conversationId !== conversationId) return

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === reactionEvent.messageId
          ? { ...msg, reactions: reactionEvent.reactions }
          : msg
      )
    )
  }, [reactionEvent, conversationId])

  // Listen for real-time Task creation & updates from SignalR (MES-009 & MES-010)
  useEffect(() => {
    if (!incomingTask) return
    if (
      incomingTask.conversationId === conversationId ||
      (incomingTask.sourceMessageId && messages.some((m) => m.id === incomingTask.sourceMessageId))
    ) {
      setTasks((prev) => {
        const exists = prev.some((t) => t.id === incomingTask.id)
        if (exists) return prev.map((t) => (t.id === incomingTask.id ? incomingTask : t))
        return [incomingTask, ...prev]
      })
    }
  }, [incomingTask, conversationId, messages])

  useEffect(() => {
    if (!taskUpdatedEvent) return
    setTasks((prev) => prev.map((t) => (t.id === taskUpdatedEvent.id ? taskUpdatedEvent : t)))
  }, [taskUpdatedEvent])

  useEffect(() => {
    if (!taskDeletedEvent) return
    if (!taskDeletedEvent.conversationId || taskDeletedEvent.conversationId === conversationId) {
      setTasks((prev) => prev.filter((t) => t.id !== taskDeletedEvent.taskId))
    }
  }, [taskDeletedEvent, conversationId])

  function handleTaskCreated(newTask: TaskResponse) {
    setTasks((prev) => [newTask, ...prev.filter((t) => t.id !== newTask.id)])
  }

  function handleTaskUpdated(updatedTask: TaskResponse) {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)))
  }

  function handleTaskDeleted(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  // Load initial conversation messages and tasks
  useEffect(() => {
    async function load() {
      if (!conversationId) return
      setLoading(true)
      setNewMessageCount(0)
      setIsAtBottom(true)

      try {
        const [msgRes, convRes, taskList] = await Promise.all([
          getMessages(conversationId, null, 30),
          getConversationById(conversationId),
          getTasksApi({ conversationId }),
        ])

        setMessages(msgRes.items)
        setNextCursor(msgRes.nextCursor || null)
        setHasMore(msgRes.hasMore)
        if (convRes) setConversationDetails(convRes)
        setTasks(taskList)
      } catch (err) {
        console.warn("Failed to load conversation details / tasks:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [conversationId])

  // Auto-scroll to bottom after initial load
  useEffect(() => {
    if (!loading && visibleMessages.length > 0) {
      // Small delay to let virtualizer measure items before scrolling
      const t = setTimeout(() => {
        rowVirtualizer.scrollToIndex(visibleMessages.length - 1, { align: 'end', behavior: 'auto' })
      }, 60)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  // When new message arrives via SignalR: scroll if at bottom, else show badge
  useEffect(() => {
    if (!incomingMessage || incomingMessage.conversationId !== conversationId) return
    if (isAtBottom) {
      const t = setTimeout(() => {
        rowVirtualizer.scrollToIndex(visibleMessages.length - 1, { align: 'end', behavior: 'smooth' })
      }, 30)
      return () => clearTimeout(t)
    } else {
      setNewMessageCount((c) => c + 1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingMessage])

  // Load older historical messages on scroll up (Cursor Pagination)
  async function handleLoadOlderMessages() {
    if (!conversationId || !hasMore || isLoadingOlder || !nextCursor) return
    setIsLoadingOlder(true)

    // Snapshot: which item index was at the top of the visible area right now
    const anchorIndex = rowVirtualizer.range?.startIndex ?? 0

    try {
      const res = await getMessages(conversationId, nextCursor, 30)
      if (res.items.length > 0) {
        // Calculate deduplicated new items BEFORE updating state
        // so we know exactly how many items will be prepended
        let newItemCount = 0
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id))
          const newItems = res.items.filter((m) => !existingIds.has(m.id))
          newItemCount = newItems.length
          return [...newItems, ...prev]
        })
        setNextCursor(res.nextCursor || null)
        setHasMore(res.hasMore)

        // After React flushes the new items, restore scroll so the previously-visible
        // item is still at the same position (pin anchor = anchorIndex + newItemCount)
        requestAnimationFrame(() => {
          rowVirtualizer.scrollToIndex(anchorIndex + newItemCount, {
            align: 'start',
            behavior: 'auto',
          })
        })
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error("Failed to load older messages", err)
    } finally {
      setIsLoadingOlder(false)
    }
  }

  async function handleRecallMessage(messageId: string) {
    setRecallingMessageId(messageId)
    setConfirmRecallId(null)
    try {
      await recallMessageApi(messageId)
      // Optimistically update
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, isRecalled: true, content: undefined, attachments: [] }
            : m
        )
      )
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Không thể thu hồi tin nhắn.")
    } finally {
      setRecallingMessageId(null)
    }
  }

  function handleDeleteForMe(messageId: string) {
    const next = [...hiddenMessageIds, messageId]
    setHiddenMessageIds(next)
    try {
      localStorage.setItem(`hidden_messages_${conversationId}`, JSON.stringify(next))
    } catch {}
  }

  async function handleReact(messageId: string, emoji: string) {
    // Optimistic toggle
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg
        const curReactions = msg.reactions || []
        const myName = currentUser?.fullName || "Bạn"
        const myId = currentUser?.userId || ""

        const existingReaction = curReactions.find((r) =>
          (myId && r.userIds?.includes(myId)) || r.userNames.includes(myName)
        )

        let updated: ReactionResponse[] = []
        if (existingReaction) {
          if (existingReaction.emoji === emoji) {
            // Remove
            updated = curReactions
              .map((r) =>
                r.emoji === emoji
                  ? {
                      ...r,
                      count: r.count - 1,
                      userNames: r.userNames.filter((n) => n !== myName),
                      userIds: r.userIds?.filter((id) => id !== myId),
                    }
                  : r
              )
              .filter((r) => r.count > 0)
          } else {
            // Switch emoji
            const withoutOld = curReactions
              .map((r) =>
                r.emoji === existingReaction.emoji
                  ? {
                      ...r,
                      count: r.count - 1,
                      userNames: r.userNames.filter((n) => n !== myName),
                      userIds: r.userIds?.filter((id) => id !== myId),
                    }
                  : r
              )
              .filter((r) => r.count > 0)

            const targetIdx = withoutOld.findIndex((r) => r.emoji === emoji)
            if (targetIdx !== -1) {
              updated = withoutOld.map((r, i) =>
                i === targetIdx
                  ? {
                      ...r,
                      count: r.count + 1,
                      userNames: [...r.userNames, myName],
                      userIds: myId ? [...(r.userIds || []), myId] : r.userIds,
                    }
                  : r
              )
            } else {
              updated = [
                ...withoutOld,
                { emoji, count: 1, userNames: [myName], userIds: myId ? [myId] : [] },
              ]
            }
          }
        } else {
          // Add new
          const targetIdx = curReactions.findIndex((r) => r.emoji === emoji)
          if (targetIdx !== -1) {
            updated = curReactions.map((r, i) =>
              i === targetIdx
                ? {
                    ...r,
                    count: r.count + 1,
                    userNames: [...r.userNames, myName],
                    userIds: myId ? [...(r.userIds || []), myId] : r.userIds,
                  }
                : r
            )
          } else {
            updated = [
              ...curReactions,
              { emoji, count: 1, userNames: [myName], userIds: myId ? [myId] : [] },
            ]
          }
        }

        return { ...msg, reactions: updated }
      })
    )

    try {
      const serverReactions = await reactMessageApi(messageId, emoji)
      if (serverReactions) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions: serverReactions } : m))
        )
      }
    } catch (err) {
      console.error("Failed to react to message", err)
    }
  }

  function determineFileType(file: File): "image" | "video" | "audio" | "doc" {
    if (file.type.startsWith("image/")) return "image"
    if (file.type.startsWith("video/")) return "video"
    if (file.type.startsWith("audio/")) return "audio"
    return "doc"
  }

  function handleAddFiles(filesList: FileList | File[]) {
    setUploadError(null)
    const rawFiles = Array.from(filesList)

    if (selectedFiles.length + rawFiles.length > 30) {
      setUploadError("Bạn chỉ có thể gửi tối đa 30 tệp mỗi lần.")
      return
    }

    const newItems: SelectedFileItem[] = []
    for (const file of rawFiles) {
      if (file.size === 0) {
        setUploadError(`Tệp "${file.name}" bị rỗng (0 KB). Vui lòng chọn tệp hợp lệ.`)
        return
      }
      if (file.size > 25 * 1024 * 1024) {
        setUploadError(`Tệp "${file.name}" vượt quá dung lượng tối đa 25MB.`)
        return
      }

      const fileType = determineFileType(file)
      const previewUrl = fileType === "image" ? URL.createObjectURL(file) : undefined

      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl,
        type: fileType,
        name: file.name,
        size: file.size,
      })
    }

    setSelectedFiles((prev) => [...prev, ...newItems])
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files.length > 0) {
      handleAddFiles(event.target.files)
      event.target.value = ""
    }
  }

  function handleRemoveFile(id: string) {
    setSelectedFiles((prev) => {
      const item = prev.find((f) => f.id === id)
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl)
      }
      return prev.filter((f) => f.id !== id)
    })
  }

  function handleClearAllFiles() {
    selectedFiles.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl)
    })
    setSelectedFiles([])
    setUploadError(null)
  }

  // Drag and Drop handlers
  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files)
    }
  }

  // Paste image from clipboard handler
  function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData.items
    const pastedFiles: File[] = []

    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === "file") {
        const file = items[i].getAsFile()
        if (file) pastedFiles.push(file)
      }
    }

    if (pastedFiles.length > 0) {
      handleAddFiles(pastedFiles)
    }
  }

  async function handleSendMessage(event: FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if ((!text && selectedFiles.length === 0) || !conversationId || isSending) return

    setIsSending(true)
    setUploadError(null)

    let uploadedAttachments: AttachmentInput[] = []

    // 1. Upload files if any
    if (selectedFiles.length > 0) {
      try {
        const uploadResult = await uploadFilesApi(selectedFiles.map((item) => item.file))
        uploadedAttachments = uploadResult.map((u) => ({
          fileUrl: u.fileUrl,
          fileType: u.fileType,
          fileSize: Number(u.fileSize),
        }))
      } catch (err: any) {
        setUploadError(err.message || "Tải tệp lên thất bại. Vui lòng thử lại.")
        setIsSending(false)
        return
      }
    }

    // 2. Optimistic UI update
    const tempId = `temp-${Date.now()}`
    const tempMessage: MessageResponse = {
      id: tempId,
      conversationId,
      senderId: currentUser?.userId || "me",
      senderName: currentUser?.fullName || "Tôi",
      content: text || undefined,
      isRecalled: false,
      sentAt: new Date().toISOString(),
      attachments: uploadedAttachments.map((a) => ({
        fileName: a.fileUrl.split("/").pop() || "attachment",
        fileUrl: a.fileUrl,
        fileType: a.fileType || "",
        fileSize: a.fileSize,
      })),
      reactions: [],
      reads: [],
    }

    // Stop typing indicator immediately on send
    if (selfTypingTimeoutRef.current) {
      clearTimeout(selfTypingTimeoutRef.current)
    }
    isSelfTypingRef.current = false
    sendTyping(false, currentUser?.fullName || "Tôi")

    setMessages((prev) => [...prev, tempMessage])
    setDraft("")
    handleClearAllFiles()

    // 3. Send message with attachments to backend
    const sentMessage = await sendMessageApi(conversationId, text, uploadedAttachments)
    if (sentMessage) {
      if (typeof window !== "undefined" && sentMessage.attachments && sentMessage.attachments.length > 0) {
        window.dispatchEvent(new CustomEvent("nexus:messageSent", { detail: sentMessage }))
      }
      setMessages((prev) => {
        const alreadyAddedBySignalR = prev.some((m) => m.id === sentMessage.id)
        if (alreadyAddedBySignalR) {
          return prev.filter((m) => m.id !== tempId)
        }
        return prev.map((m) => (m.id === tempId ? sentMessage : m))
      })
    }
    setIsSending(false)
  }

  function getFileFullUrl(fileUrl: string): string {
    if (!fileUrl) return ""
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://") || fileUrl.startsWith("blob:")) {
      return fileUrl
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5011"
    return `${baseUrl}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`
  }

  function renderDocumentIcon(fileName: string) {
    const ext = fileName.split(".").pop()?.toLowerCase() || ""
    if (["pdf"].includes(ext)) return <FileText className="size-5 text-red-500" />
    if (["xls", "xlsx", "csv"].includes(ext)) return <FileSpreadsheet className="size-5 text-emerald-500" />
    if (["doc", "docx", "txt"].includes(ext)) return <FileText className="size-5 text-blue-500" />
    if (["zip", "rar", "7z"].includes(ext)) return <FileArchive className="size-5 text-amber-500" />
    if (["mp3", "wav", "ogg"].includes(ext)) return <FileAudio className="size-5 text-purple-500" />
    return <File className="size-5 text-muted-foreground" />
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin text-primary mr-2" />
        <span>Đang tải tin nhắn...</span>
      </div>
    )
  }

  return (
    <MessageScrollerProvider>
      {/* Lightbox Full-screen Image Viewer */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeLightboxImage}
              alt="Xem ảnh lớn"
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            />
            <div className="mt-3 flex items-center gap-3">
              <a
                href={activeLightboxImage}
                target="_blank"
                rel="noreferrer"
                download
                className="flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-xs font-medium text-white hover:bg-white/30 backdrop-blur transition"
              >
                <Download className="size-3.5" /> Tải về máy
              </a>
              <button
                onClick={() => setActiveLightboxImage(null)}
                className="flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-xs font-medium text-white hover:bg-white/30 backdrop-blur transition"
              >
                <X className="size-3.5" /> Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z,.mp4,.webm,.mov,.png,.jpg,.jpeg,.gif,.webp"
      />
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
        accept="image/*,video/*"
      />

      <div
        className="relative flex h-full flex-col"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag & Drop Visual Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-primary/10 backdrop-blur-sm border-2 border-dashed border-primary rounded-2xl m-2 pointer-events-none animate-in fade-in">
            <div className="flex size-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-lg mb-3">
              <Upload className="size-8 animate-bounce" />
            </div>
            <p className="text-base font-semibold text-primary">Thả tệp vào đây để đính kèm</p>
            <p className="text-xs text-muted-foreground mt-1">Hỗ trợ tối đa 30 tệp · dung lượng lên tới 25MB/tệp</p>
          </div>
        )}

        {/* Messages List Area */}
        <MessageScroller className="min-h-0 flex-1 relative">
          {/* Floating Scroll-to-Bottom Button */}
          {!isAtBottom && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                type="button"
                onClick={scrollToBottom}
                className="flex items-center gap-2 rounded-full border border-border bg-card/95 backdrop-blur-sm px-4 py-2 text-xs font-medium text-foreground shadow-lg hover:bg-muted transition cursor-pointer"
              >
                {newMessageCount > 0 ? (
                  <span className="flex items-center gap-1.5">
                    <span className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                      {newMessageCount > 9 ? '9+' : newMessageCount}
                    </span>
                    <span>Tin nhắn mới</span>
                  </span>
                ) : (
                  <span>Tin nhắn mới nhất</span>
                )}
                <ArrowDown className="size-3.5" />
              </button>
            </div>
          )}

          {/* Conversation Task Hub Bar (MES-009 & MES-010) */}
          {tasks.length > 0 && (
            <div className="border-b bg-card/70 backdrop-blur-xs px-4 py-2 text-xs transition z-10 shrink-0">
              <div className="mx-auto flex max-w-3xl items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsTasksHubOpen((prev) => !prev)}
                  className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition cursor-pointer select-none"
                >
                  <CheckSquare className="size-4 text-primary" />
                  <span>Công việc ({tasks.length})</span>
                  <span className="flex items-center gap-1.5 font-normal text-[11px] text-muted-foreground">
                    <span>· {tasks.filter(t => t.status === 'InProgress').length} đang làm</span>
                    <span>· {tasks.filter(t => t.status === 'Todo').length} chưa làm</span>
                    <span>· {tasks.filter(t => t.status === 'Done').length} xong</span>
                  </span>
                  <ChevronDown className={cn("size-3.5 text-muted-foreground transition duration-200", isTasksHubOpen && "rotate-180")} />
                </button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCreateTaskSourceMessage(null)
                    setIsCreateTaskOpen(true)
                  }}
                  className="h-7 px-2.5 text-[11px] gap-1 text-primary hover:bg-primary/10 cursor-pointer"
                >
                  <CheckSquare className="size-3" /> + Giao việc
                </Button>
              </div>

              {/* Expanded Task List Drawer */}
              {isTasksHubOpen && (
                <div className="mx-auto max-w-3xl pt-2.5 pb-1 animate-in slide-in-from-top-2 duration-150 border-t border-border/40 mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1 pb-20">
                    {tasks.map((task) => (
                      <TaskItemBadge
                        key={task.id}
                        task={task}
                        participants={conversationDetails?.participants || []}
                        currentUserId={currentUser?.userId}
                        onTaskUpdated={handleTaskUpdated}
                        onTaskDeleted={handleTaskDeleted}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <MessageScrollerViewport
            ref={viewportRef}
            onScroll={(e) => {
              const target = e.currentTarget
              // Detect scroll to bottom
              const atBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 60
              setIsAtBottom(atBottom)
              if (atBottom) setNewMessageCount(0)
              // Load older on scroll to top
              if (target.scrollTop < 60 && hasMore && !isLoadingOlder) {
                handleLoadOlderMessages()
              }
            }}
            className="p-4 sm:p-6"
          >
            <MessageScrollerContent className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
              {visibleMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <p className="text-sm font-medium">Chưa có tin nhắn nào trong hội thoại này.</p>
                  <p className="mt-1 text-xs">Hãy gửi tin nhắn hoặc đính kèm tài liệu đầu tiên để bắt đầu trò chuyện!</p>
                </div>
              ) : (
                <MessageScrollerItem>
                  {/* Older Messages Loader Banner (Cursor Pagination) */}
                  {hasMore && (
                    <div className="flex justify-center pb-4 pt-1">
                      <button
                        type="button"
                        onClick={handleLoadOlderMessages}
                        disabled={isLoadingOlder}
                        className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-2xs hover:bg-muted hover:text-foreground transition disabled:opacity-50 cursor-pointer"
                      >
                        {isLoadingOlder ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin text-primary" />
                            <span>Đang tải tin nhắn cũ...</span>
                          </>
                        ) : (
                          <span>Tải thêm tin nhắn cũ hơn</span>
                        )}
                      </button>
                    </div>
                  )}
                  {!hasMore && visibleMessages.length > 25 && (
                    <div className="flex justify-center pb-4 pt-1 text-[11px] text-muted-foreground/60 select-none">
                      <span>Đã hiển thị toàn bộ lịch sử trò chuyện</span>
                    </div>
                  )}

                  {/* Virtualized Message Windowing Container */}
                  <div
                    style={{
                      height: `${rowVirtualizer.getTotalSize()}px`,
                      width: "100%",
                      position: "relative",
                    }}
                  >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const message = visibleMessages[virtualRow.index]
                      if (!message) return null

                      const isOwn =
                        Boolean(currentUser?.userId && message.senderId === currentUser.userId) ||
                        message.senderName === "Tôi" ||
                        message.senderName === currentUser?.fullName

                      const timeStr = formatMessageTime(message.sentAt)
                      const attachments = message.attachments || []

                      // Date separator: show when date changes between consecutive messages
                      const prevMessage = virtualRow.index > 0 ? visibleMessages[virtualRow.index - 1] : null
                      const nextMessage = virtualRow.index < visibleMessages.length - 1 ? visibleMessages[virtualRow.index + 1] : null

                      const showDateSeparator = (() => {
                        if (!message.sentAt) return false
                        if (!prevMessage?.sentAt) return virtualRow.index === 0
                        const curr = new Date(message.sentAt)
                        const prev = new Date(prevMessage.sentAt)
                        return (
                          curr.getFullYear() !== prev.getFullYear() ||
                          curr.getMonth() !== prev.getMonth() ||
                          curr.getDate() !== prev.getDate()
                        )
                      })()

                      // Consecutive message grouping (no time limit - all consecutive messages from same sender)
                      const isSameSenderAsNext = Boolean(
                        nextMessage &&
                        ((message.senderId && nextMessage.senderId && message.senderId === nextMessage.senderId) ||
                         (message.senderName && nextMessage.senderName && message.senderName === nextMessage.senderName))
                      )

                      const nextHasDateSeparator = (() => {
                        if (!nextMessage?.sentAt || !message?.sentAt) return false
                        const curr = new Date(message.sentAt)
                        const next = new Date(nextMessage.sentAt)
                        return (
                          curr.getFullYear() !== next.getFullYear() ||
                          curr.getMonth() !== next.getMonth() ||
                          curr.getDate() !== next.getDate()
                        )
                      })()

                      // isLastInGroup: True if this is the last consecutive message from this sender before someone else talks or date changes
                      const isLastInGroup = !isSameSenderAsNext || nextHasDateSeparator

                      const dateSeparatorLabel = (() => {
                        if (!message.sentAt) return ""
                        const d = new Date(message.sentAt)
                        const now = new Date()
                        const isToday =
                          d.getDate() === now.getDate() &&
                          d.getMonth() === now.getMonth() &&
                          d.getFullYear() === now.getFullYear()
                        const yesterday = new Date(now)
                        yesterday.setDate(now.getDate() - 1)
                        const isYesterday =
                          d.getDate() === yesterday.getDate() &&
                          d.getMonth() === yesterday.getMonth() &&
                          d.getFullYear() === yesterday.getFullYear()
                        if (isToday) return "Hôm nay"
                        if (isYesterday) return "Hôm qua"
                        return d.toLocaleDateString("vi-VN", {
                          weekday: "long",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      })()

                      // Filter other readers (excluding myself)
                      const readers = (message.reads || []).filter(
                        (r) => r.userId && r.userId !== currentUser?.userId && r.fullName !== currentUser?.fullName
                      )
                      const isReadByOthers = readers.length > 0

                      const imageAttachments = attachments.filter((a) => {
                        const url = a.fileUrl.toLowerCase()
                        const type = (a.fileType || "").toLowerCase()
                        return type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(url)
                      })

                      const videoAttachments = attachments.filter((a) => {
                        const url = a.fileUrl.toLowerCase()
                        const type = (a.fileType || "").toLowerCase()
                        return type.startsWith("video/") || /\.(mp4|webm|mov|avi|mkv)$/i.test(url)
                      })

                      const docAttachments = attachments.filter(
                        (a) => !imageAttachments.includes(a) && !videoAttachments.includes(a)
                      )

                      return (
                        <div
                          key={message.id || virtualRow.key}
                          data-index={virtualRow.index}
                          ref={measureElementRef}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          {/* Date Separator */}
                          {showDateSeparator && (
                            <div className="flex items-center gap-3 px-2 py-3 select-none">
                              <div className="h-px flex-1 bg-border/60" />
                              <span className="shrink-0 rounded-full border border-border bg-card px-3 py-0.5 text-[11px] font-medium text-muted-foreground shadow-xs">
                                {dateSeparatorLabel}
                              </span>
                              <div className="h-px flex-1 bg-border/60" />
                            </div>
                          )}

                          <Message
                            align={isOwn ? "end" : "start"}
                            className={cn("relative", isLastInGroup ? "mb-4" : "mb-1")}
                          >
                            {isLastInGroup ? (
                              <MessageAvatar className="size-8 border bg-card text-xs font-semibold shrink-0">
                                <span className="sr-only">{isOwn ? "Bạn" : message.senderName}</span>
                                {isOwn
                                  ? (currentUser?.fullName ? currentUser.fullName.substring(0, 2).toUpperCase() : "AN")
                                  : (message.senderName ? message.senderName.substring(0, 2).toUpperCase() : <User className="size-4" />)}
                              </MessageAvatar>
                            ) : (
                              <div className="size-8 shrink-0" aria-hidden="true" />
                            )}
                            <div className={isOwn ? "flex flex-col items-end max-w-[80%] relative" : "flex flex-col items-start max-w-[80%] relative"}>
                              {isLastInGroup && (
                                <div className="mb-1 flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
                                  <span className="font-medium">{isOwn ? "Bạn" : message.senderName}</span>
                                  {timeStr && <span>{timeStr}</span>}

                                  {/* Message Status Tick (For sender) */}
                                  {isOwn && !message.isRecalled && (
                                    <span className="inline-flex items-center ml-0.5" title={isReadByOthers ? "Đã đọc" : "Đã gửi"}>
                                      {isReadByOthers ? (
                                        <CheckCheck className="size-3.5 text-emerald-500 font-bold" />
                                      ) : (
                                        <Check className="size-3 text-muted-foreground" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Recalled Message State */}
                              {message.isRecalled ? (
                                <div className="relative group/bubble">
                                  <div className="flex items-center gap-2 italic text-muted-foreground text-xs py-2 px-3.5 rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/20 shadow-2xs">
                                    <Undo2 className="size-3.5 opacity-60 shrink-0" />
                                    <span>Tin nhắn đã được thu hồi</span>
                                  </div>

                                  {/* Delete button on recalled message */}
                                  <div
                                    className={cn(
                                      "absolute -top-7.5 z-20 flex items-center rounded-full border bg-card/95 p-1 shadow-md opacity-0 group-hover/bubble:opacity-100 transition duration-150 backdrop-blur-xs",
                                      isOwn ? "right-0" : "left-0"
                                    )}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(message.id)}
                                      className="size-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition duration-100 cursor-pointer"
                                      title="Xóa ở phía tôi"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* Normal Message Content Container with Actions */
                                <div className="relative group/bubble">
                                  {/* Floating Action Bar on Hover (MES-007 & MES-008) */}
                                  <div
                                    className={cn(
                                      "absolute -top-9.5 z-20 flex items-center gap-0.5 rounded-full border bg-card/95 p-1 shadow-md opacity-0 group-hover/bubble:opacity-100 transition duration-150 backdrop-blur-xs",
                                      isOwn ? "right-0" : "left-0"
                                    )}
                                  >
                                    {/* Hover Timestamp */}
                                    {timeStr && (
                                      <span className="text-[10px] text-muted-foreground px-1.5 font-medium select-none border-r border-border pr-2 mr-0.5">
                                        {timeStr}
                                      </span>
                                    )}

                                    {/* Quick Reaction Emojis (MES-008) */}
                                    <div className="flex items-center gap-0.5 px-1">
                                      {QUICK_REACTIONS.map((emoji) => (
                                        <button
                                          key={emoji}
                                          type="button"
                                          onClick={() => handleReact(message.id, emoji)}
                                          className="size-6.5 flex items-center justify-center rounded-full hover:scale-125 hover:bg-muted text-xs transition duration-100 cursor-pointer"
                                          title={`Thả ${emoji}`}
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>

                                    <div className="h-4 w-px bg-border mx-0.5" />

                                    {/* Create Task Action (MES-009) */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCreateTaskSourceMessage(message)
                                        setIsCreateTaskOpen(true)
                                      }}
                                      className="size-6.5 flex items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition duration-100 cursor-pointer"
                                      title="Tạo Task từ tin nhắn này"
                                    >
                                      <CheckSquare className="size-3.5 text-primary" />
                                    </button>

                                    {/* Recall Action (MES-007) - Sender only */}
                                    {isOwn && (
                                      <button
                                        type="button"
                                        onClick={() => setConfirmRecallId(message.id)}
                                        className="size-6.5 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition duration-100 cursor-pointer"
                                        title="Thu hồi tin nhắn với mọi người"
                                      >
                                        <Undo2 className="size-3.5" />
                                      </button>
                                    )}

                                    {/* Delete for Me Action (MES-007) */}
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(message.id)}
                                      className="size-6.5 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition duration-100 cursor-pointer"
                                      title="Xóa ở phía tôi"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>

                                  {(() => {
                                    const isOnlyMedia = (!message.content || message.content.trim() === '') && docAttachments.length === 0 && (imageAttachments.length > 0 || videoAttachments.length > 0)
                                    return (
                                      <MessageContent
                                        className={cn(
                                          "flex flex-col gap-2 transition",
                                          isOnlyMedia
                                            ? "p-0 bg-transparent border-0 shadow-none"
                                            : isOwn
                                              ? "p-3 shadow-sm rounded-2xl rounded-tr-sm bg-primary text-primary-foreground"
                                              : "p-3 shadow-sm rounded-2xl rounded-tl-sm border bg-card text-card-foreground"
                                        )}
                                      >
                                        {/* Text content if present */}
                                        {message.content && (
                                          <p className="leading-relaxed whitespace-pre-wrap text-sm">{message.content}</p>
                                        )}

                                        {/* Images Gallery */}
                                        {imageAttachments.length > 0 && (
                                          <div
                                            className={cn(
                                              "overflow-hidden rounded-2xl",
                                              imageAttachments.length === 1
                                                ? "w-fit"
                                                : imageAttachments.length === 2
                                                ? "grid grid-cols-2 gap-1.5"
                                                : "grid grid-cols-2 sm:grid-cols-3 gap-1.5"
                                            )}
                                          >
                                            {imageAttachments.map((img, idx) => {
                                              const fullUrl = getFileFullUrl(img.fileUrl)
                                              return (
                                                <div
                                                  key={img.id || idx}
                                                  onClick={() => setActiveLightboxImage(fullUrl)}
                                                  className={cn(
                                                    "group relative cursor-pointer overflow-hidden rounded-2xl transition duration-200",
                                                    imageAttachments.length === 1
                                                      ? "bg-transparent shadow-xs hover:shadow-md"
                                                      : "bg-black/5 aspect-square"
                                                  )}
                                                >
                                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                                  <img
                                                    src={fullUrl}
                                                    alt={img.fileName || "Ảnh đính kèm"}
                                                    className={cn(
                                                      "rounded-2xl transition duration-300 group-hover:scale-[1.02]",
                                                      imageAttachments.length === 1
                                                        ? "max-h-80 max-w-xs sm:max-w-sm md:max-w-md w-auto h-auto object-contain"
                                                        : "size-full object-cover"
                                                    )}
                                                  />
                                                  <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition group-hover:opacity-100 rounded-2xl">
                                                    <ZoomIn className="size-6 text-white" />
                                                  </div>
                                                </div>
                                              )
                                            })}
                                          </div>
                                        )}

                                        {/* Videos Player */}
                                        {videoAttachments.length > 0 && (
                                          <div className="space-y-2">
                                            {videoAttachments.map((vid, idx) => (
                                              <div key={vid.id || idx} className="overflow-hidden rounded-2xl bg-black max-w-xs sm:max-w-md">
                                                <video
                                                  controls
                                                  src={getFileFullUrl(vid.fileUrl)}
                                                  className="max-h-64 w-full rounded-2xl"
                                                />
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {/* Document & Files Attachments */}
                                        {docAttachments.length > 0 && (
                                          <div className="space-y-1.5 w-full">
                                            {docAttachments.map((doc, idx) => {
                                              const fullUrl = getFileFullUrl(doc.fileUrl)
                                              return (
                                                <div
                                                  key={doc.id || idx}
                                                  className={cn(
                                                    "flex items-center justify-between gap-3 rounded-xl p-2.5 transition",
                                                    isOwn
                                                      ? "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                                                      : "bg-muted/70 text-foreground hover:bg-muted"
                                                  )}
                                                >
                                                  <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background/80 shadow-xs">
                                                      {renderDocumentIcon(doc.fileName)}
                                                    </div>
                                                    <div className="min-w-0">
                                                      <p className="truncate text-xs font-medium">{doc.fileName}</p>
                                                      {doc.fileSize && (
                                                        <p className={cn("text-[10px]", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                                          {formatFileSize(doc.fileSize)}
                                                        </p>
                                                      )}
                                                    </div>
                                                  </div>

                                                  <a
                                                    href={fullUrl}
                                                    download={doc.fileName}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title={`Tải xuống ${doc.fileName}`}
                                                    className={cn(
                                                      "flex size-8 shrink-0 items-center justify-center rounded-lg transition",
                                                      isOwn
                                                        ? "hover:bg-primary-foreground/20 text-primary-foreground"
                                                        : "hover:bg-accent text-primary"
                                                    )}
                                                  >
                                                    <Download className="size-4" />
                                                  </a>
                                                </div>
                                              )
                                            })}
                                          </div>
                                        )}
                                      </MessageContent>
                                    )
                                  })()}
                                </div>
                              )}

                              {/* Message Reactions Badges Row (MES-008) */}
                              {message.reactions && message.reactions.length > 0 && (
                                <div className={cn("flex flex-wrap items-center gap-1 mt-1 z-10", isOwn ? "justify-end" : "justify-start")}>
                                  {message.reactions.map((r, rIdx) => {
                                    const myId = currentUser?.userId || ""
                                    const myName = currentUser?.fullName || ""
                                    const hasReacted = Boolean(
                                      (myId && r.userIds?.includes(myId)) ||
                                      (myName && r.userNames?.includes(myName))
                                    )

                                    return (
                                      <button
                                        key={rIdx}
                                        type="button"
                                        onClick={() => handleReact(message.id, r.emoji)}
                                        title={`${r.userNames.join(', ')} đã thả ${r.emoji}`}
                                        className={cn(
                                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition border shadow-2xs cursor-pointer select-none",
                                          hasReacted
                                            ? "border-primary/40 bg-primary/15 font-semibold text-primary"
                                            : "border-border bg-card hover:bg-muted text-foreground"
                                        )}
                                      >
                                        <span>{r.emoji}</span>
                                        <span className="text-[10px] font-medium">{r.count}</span>
                                      </button>
                                    )
                                  })}
                                </div>
                              )}

                              {/* Linked Task Badge (MES-009 & MES-010) */}
                              {(() => {
                                const linkedTask = tasks.find((t) => t.sourceMessageId === message.id)
                                if (!linkedTask) return null
                                return (
                                  <TaskItemBadge
                                    task={linkedTask}
                                    participants={conversationDetails?.participants || []}
                                    currentUserId={currentUser?.userId}
                                    onTaskUpdated={handleTaskUpdated}
                                    onTaskDeleted={handleTaskDeleted}
                                  />
                                )
                              })()}

                              {/* Small Reader Avatars Stack (When Read) */}
                              {isOwn && isReadByOthers && isLastInGroup && (
                                <div className="mt-1 flex items-center justify-end gap-1 px-1">
                                  {readers.length === 1 && (
                                    <div
                                      title={`Đã xem bởi: ${readers[0].fullName || readers[0].userName}`}
                                      className="flex size-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[8px] font-bold border border-background shadow-xs ring-1 ring-emerald-500/30"
                                    >
                                      {(readers[0].fullName || readers[0].userName || "U").substring(0, 2).toUpperCase()}
                                    </div>
                                  )}

                                  {readers.length === 2 && (
                                    <div className="flex items-center -space-x-1.5">
                                      {readers.map((r, i) => (
                                        <div
                                          key={r.userId || i}
                                          title={`Đã xem bởi: ${r.fullName || r.userName}`}
                                          className="flex size-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[8px] font-bold border border-background shadow-xs ring-1 ring-emerald-500/30"
                                        >
                                          {(r.fullName || r.userName || "U").substring(0, 2).toUpperCase()}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {readers.length > 2 && (
                                    <div
                                      title={`Đã xem bởi: ${readers.map((r) => r.fullName || r.userName).join(", ")}`}
                                      className="flex items-center gap-1"
                                    >
                                      <div className="flex items-center -space-x-1.5">
                                        {readers.slice(-2).map((r, i) => (
                                          <div
                                            key={r.userId || i}
                                            className="flex size-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[8px] font-bold border border-background shadow-xs ring-1 ring-emerald-500/30"
                                          >
                                            {(r.fullName || r.userName || "U").substring(0, 2).toUpperCase()}
                                          </div>
                                        ))}
                                      </div>
                                      <span className="flex items-center justify-center rounded-full bg-emerald-500/10 px-1 py-0.2 text-[8px] font-semibold text-emerald-600 border border-emerald-500/20">
                                        +{readers.length - 2}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </Message>
                        </div>
                      )
                    })}
                  </div>
                </MessageScrollerItem>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
        </MessageScroller>

        {/* Input & Pre-send Attachment Area */}
        <div className="border-t bg-card px-4 py-4 md:px-8">
          {/* Upload Error Banner */}
          {uploadError && (
            <div className="mx-auto mb-3 flex max-w-3xl items-center justify-between gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
              <button onClick={() => setUploadError(null)} className="hover:opacity-70">
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {/* Selected Attachments Preview Bar */}
          {selectedFiles.length > 0 && (
            <div className="mx-auto mb-3 max-w-3xl rounded-2xl border bg-muted/40 p-3 shadow-xs animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between pb-2 text-xs text-muted-foreground border-b border-border/50">
                <span className="font-medium">Đính kèm ({selectedFiles.length}/30 tệp)</span>
                <button
                  onClick={handleClearAllFiles}
                  className="flex items-center gap-1 text-[11px] text-destructive hover:underline"
                >
                  <Trash2 className="size-3" /> Xóa tất cả
                </button>
              </div>

              <div className="flex gap-2.5 overflow-x-auto pt-2.5 pb-1">
                {selectedFiles.map((item) => (
                  <div
                    key={item.id}
                    className="group relative flex shrink-0 items-center gap-2 rounded-xl border bg-background p-2 shadow-xs pr-7"
                  >
                    {item.type === "image" && item.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.previewUrl}
                        alt={item.name}
                        className="size-10 rounded-lg object-cover"
                      />
                    ) : item.type === "video" ? (
                      <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-primary">
                        <Film className="size-5" />
                      </div>
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
                        {renderDocumentIcon(item.name)}
                      </div>
                    )}

                    <div className="max-w-[110px]">
                      <p className="truncate text-xs font-medium">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatFileSize(item.size)}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFile(item.id)}
                      className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition"
                      title="Bỏ chọn tệp này"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="mx-auto mb-2 flex max-w-3xl items-center gap-2 px-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                {typingUsers[0].userName.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-card border px-3 py-1.5 text-xs text-muted-foreground shadow-2xs">
                <span className="font-medium text-foreground">
                  {typingUsers.length === 1 ? typingUsers[0].userName : `${typingUsers.length} người`}
                </span>
                <span>đang nhập tin nhắn...</span>
                <div className="flex items-center gap-1 py-0.5 ml-0.5">
                  <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <span className="size-1.5 rounded-full bg-primary animate-bounce" />
                </div>
              </div>
            </div>
          )}

          {/* Form Input Box */}
          <form
            onSubmit={handleSendMessage}
            className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border bg-background p-2 shadow-sm"
          >
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => imageInputRef.current?.click()}
                aria-label="Gửi ảnh hoặc video"
                title="Gửi hình ảnh/video"
                disabled={isSending}
                className="size-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <ImageIcon className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Đính kèm tệp tài liệu"
                title="Đính kèm tài liệu, PDF, Excel, ZIP (Tối đa 30 tệp)"
                disabled={isSending}
                className="size-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Paperclip className="size-4" />
              </Button>
              {/* Create Task Button from Input Toolbar (Flow 2) */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setCreateTaskSourceMessage(null)
                  setIsCreateTaskOpen(true)
                }}
                aria-label="Giao việc / Tạo Task mới"
                title="Giao việc / Tạo Task mới trong cuộc trò chuyện"
                disabled={isSending}
                className="size-9 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition shrink-0 cursor-pointer"
              >
                <CheckSquare className="size-4 text-primary" />
              </Button>
            </div>

            <textarea
              value={draft}
              onChange={(event) => {
                const val = event.target.value
                setDraft(val)
                if (conversationId) {
                  const myName = currentUser?.fullName || "Tôi"
                  if (!isSelfTypingRef.current && val.trim().length > 0) {
                    isSelfTypingRef.current = true
                    sendTyping(true, myName)
                  }
                  if (selfTypingTimeoutRef.current) {
                    clearTimeout(selfTypingTimeoutRef.current)
                  }
                  selfTypingTimeoutRef.current = setTimeout(() => {
                    isSelfTypingRef.current = false
                    sendTyping(false, myName)
                  }, 2500)
                }
              }}
              onPaste={handlePaste}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
                  event.preventDefault()
                  handleSendMessage(event)
                }
              }}
              placeholder={selectedFiles.length > 0 ? "Thêm chú thích cho tệp đính kèm..." : "Nhập tin nhắn (hoặc kéo thả / dán ảnh)..."}
              aria-label="Tin nhắn"
              className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
              rows={1}
            />

            <Button
              type="submit"
              size="icon"
              aria-label="Gửi tin nhắn"
              disabled={(!draft.trim() && selectedFiles.length === 0) || isSending}
              className="size-9 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 shrink-0"
            >
              {isSending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowUp className="size-4" />
              )}
            </Button>
          </form>

          <div className="mx-auto mt-2 flex max-w-3xl items-center justify-between px-1 text-[10px] text-muted-foreground">
            <span>Enter để gửi · Shift + Enter để xuống dòng</span>
            <span>Hỗ trợ kéo thả hoặc Paste ảnh từ Clipboard</span>
          </div>
        </div>

        {/* Create Task Modal (MES-009 & MES-010) */}
        <CreateTaskModal
          isOpen={isCreateTaskOpen}
          onClose={() => {
            setIsCreateTaskOpen(false)
            setCreateTaskSourceMessage(null)
          }}
          conversationId={conversationId}
          sourceMessage={createTaskSourceMessage}
          participants={conversationDetails?.participants || []}
          currentUserId={currentUser?.userId}
          conversationTitle={conversationDetails?.title}
          onTaskCreated={handleTaskCreated}
        />

        {/* Task Due & Overdue Reminder Toast (MES-013) */}
        <TaskReminderToast reminder={taskReminderEvent} />

        {/* Centralized Recall Message Confirmation Modal */}
        {confirmRecallId && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setConfirmRecallId(null)}
          >
            <div 
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <Undo2 className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Thu hồi tin nhắn này?</h3>
                <p className="text-xs text-muted-foreground">
                  Tin nhắn sẽ bị thu hồi với tất cả thành viên trong cuộc trò chuyện.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmRecallId(null)}
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const msgId = confirmRecallId
                    setConfirmRecallId(null)
                    if (msgId) await handleRecallMessage(msgId)
                  }}
                  disabled={Boolean(recallingMessageId)}
                  className="flex-1 rounded-xl bg-destructive text-destructive-foreground px-4 py-2 text-xs font-semibold hover:bg-destructive/90 transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {recallingMessageId ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Undo2 className="size-3.5" />
                  )}
                  <span>Thu hồi</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Centralized Delete for Me Confirmation Modal */}
        {confirmDeleteId && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setConfirmDeleteId(null)}
          >
            <div 
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <Trash2 className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Xóa tin nhắn ở phía bạn?</h3>
                <p className="text-xs text-muted-foreground">
                  Tin nhắn này sẽ bị ẩn khỏi thiết bị của bạn nhưng vẫn hiển thị với các thành viên khác.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const msgId = confirmDeleteId
                    setConfirmDeleteId(null)
                    if (msgId) handleDeleteForMe(msgId)
                  }}
                  className="flex-1 rounded-xl bg-destructive text-destructive-foreground px-4 py-2 text-xs font-semibold hover:bg-destructive/90 transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MessageScrollerProvider>
  )
}
