"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  AlertTriangle,
  Bell,
  BellOff,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  File,
  FileArchive,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  Info,
  Loader2,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Video,
  X,
} from "lucide-react"
import { cn } from "@/utils/cn"
import { deleteConversationApi, getConversations, getMessages, removeParticipantApi, searchUsersApi } from "@/services/api/chat"
import { getCurrentUser, logoutUser } from "@/services/api/auth"
import { useSignalR } from "@/hooks/useSignalR"
import { formatCleanFileName, formatFileSize, formatMessageTime } from "@/utils/formatters"
import { playNotificationSound } from "@/utils/sound"
import { CreateGroupModal } from "@/components/chat/create-group-modal"
import { AddMembersModal } from "@/components/chat/add-members-modal"
import { DraftChatWorkspace } from "@/components/chat/draft-chat-workspace"
import { MessageSearchModal } from "@/components/chat/message-search-modal"
import { NotificationToast, type ToastNotificationItem } from "@/components/chat/notification-toast"
import { Button } from "@/components/ui/button"
import type { AttachmentResponse, ConversationResponse, ParticipantResponse, UserSummaryResponse } from "@/types/chat"

export function ChatWorkspace({ children }: { children?: React.ReactNode }) {
  const params = useParams()
  const router = useRouter()
  const conversationId = params?.conversationId as string | undefined

  const [conversations, setConversations] = useState<ConversationResponse[]>([])
  const [activeTab, setActiveTab] = useState("Hội thoại")
  const [showDetails, setShowDetails] = useState(true)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false)
  const [isSearchMessagesOpen, setIsSearchMessagesOpen] = useState(false)
  const [draftRecipient, setDraftRecipient] = useState<UserSummaryResponse | null>(null)
  const [peopleList, setPeopleList] = useState<UserSummaryResponse[]>([])
  const [loadingPeople, setLoadingPeople] = useState(false)
  const [showDisbandConfirm, setShowDisbandConfirm] = useState(false)
  const [disbanding, setDisbanding] = useState(false)
  const [searchSidebar, setSearchSidebar] = useState("")
  const [mutedConversations, setMutedConversations] = useState<string[]>([])
  const [toastNotification, setToastNotification] = useState<ToastNotificationItem | null>(null)
  const [showGallery, setShowGallery] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [showDocumentsModal, setShowDocumentsModal] = useState(false)
  const [docSearchQuery, setDocSearchQuery] = useState("")

  const { incomingMessage, incomingConversation, deletedConversationId, typingEvent, onlineUserIds } = useSignalR(conversationId)
  const lastHandledMessageIdRef = useRef<string | null>(null)
  const [headerTypingUser, setHeaderTypingUser] = useState<string | null>(null)
  const headerTypingTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!typingEvent || typingEvent.conversationId !== conversationId) return
    const isMe =
      (currentUser?.userId && typingEvent.userId === currentUser.userId) ||
      (currentUser?.fullName && typingEvent.userName === currentUser.fullName)
    if (isMe) return

    if (typingEvent.isTyping) {
      setHeaderTypingUser(typingEvent.userName)
      if (headerTypingTimerRef.current) clearTimeout(headerTypingTimerRef.current)
      headerTypingTimerRef.current = setTimeout(() => {
        setHeaderTypingUser(null)
      }, 3500)
    } else {
      setHeaderTypingUser(null)
      if (headerTypingTimerRef.current) clearTimeout(headerTypingTimerRef.current)
    }
  }, [typingEvent, conversationId, currentUser])

  // Realtime: Listen to local message sent events with attachments
  useEffect(() => {
    const handleLocalSent = (e: any) => {
      const atts = e.detail?.attachments || []
      if (atts.length > 0) {
        setConversationAttachments((prev) => {
          const existingUrls = new Set(prev.map((a) => a.fileUrl))
          const newAtts = atts.filter((a: any) => !existingUrls.has(a.fileUrl))
          return [...prev, ...newAtts]
        })
      }
    }
    window.addEventListener('nexus:messageSent', handleLocalSent)
    return () => window.removeEventListener('nexus:messageSent', handleLocalSent)
  }, [])

  // Initialize muted conversations and request native notification permission
  useEffect(() => {
    try {
      const saved = localStorage.getItem('muted_conversations')
      if (saved) setMutedConversations(JSON.parse(saved))
    } catch {}

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {})
      }
    }
  }, [])

  function toggleMuteConversation(convId: string) {
    setMutedConversations((prev) => {
      const isMuted = prev.includes(convId)
      const next = isMuted ? prev.filter((id) => id !== convId) : [...prev, convId]
      try {
        localStorage.setItem('muted_conversations', JSON.stringify(next))
      } catch {}
      return next
    })
  }

  // Real-time update sidebar when invited to a new group
  useEffect(() => {
    if (incomingConversation) {
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === incomingConversation.id)
        if (exists) {
          return prev.map((c) => (c.id === incomingConversation.id ? incomingConversation : c))
        }
        return [incomingConversation, ...prev]
      })
    }
  }, [incomingConversation])

  // Real-time handle incoming messages (Unread counts, Sound, Push, In-App Toast)
  useEffect(() => {
    if (!incomingMessage || lastHandledMessageIdRef.current === incomingMessage.id) return
    lastHandledMessageIdRef.current = incomingMessage.id

    const isFromMe =
      (currentUser?.userId && incomingMessage.senderId === currentUser.userId) ||
      incomingMessage.senderName === currentUser?.fullName ||
      incomingMessage.senderName === "Tôi"

    let convTitle = incomingMessage.senderName || "Tin nhắn mới"

    // 1. Always update conversation item in sidebar (last message & unread count)
    setConversations((prev) => {
      const target = prev.find((c) => c.id === incomingMessage.conversationId)
      if (target?.title) convTitle = target.title

      if (!target) {
        loadConversations()
        return prev
      }

      const isCurrentOpen = conversationId === incomingMessage.conversationId
      const newCount = isCurrentOpen || isFromMe ? 0 : (target.unreadCount || 0) + 1

      const messagePreview =
        incomingMessage.content && incomingMessage.content.trim()
          ? incomingMessage.content
          : (incomingMessage.attachments && incomingMessage.attachments.length > 0
              ? (incomingMessage.attachments.some((a) => (a.fileType || '').startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(a.fileUrl))
                  ? (incomingMessage.attachments.length > 1 ? `[Đã gửi ${incomingMessage.attachments.length} hình ảnh]` : "[Hình ảnh]")
                  : incomingMessage.attachments.some((a) => (a.fileType || '').startsWith('video/') || /\.(mp4|mov)$/i.test(a.fileUrl))
                    ? "[Video]"
                    : (incomingMessage.attachments.length > 1 ? `[Đã gửi ${incomingMessage.attachments.length} tệp đính kèm]` : `[Tệp] ${incomingMessage.attachments[0].fileName || 'Đính kèm'}`))
              : "[Đã gửi một hình ảnh/tệp]")

      const updatedItem: ConversationResponse = {
        ...target,
        lastMessage: {
          id: incomingMessage.id,
          content: messagePreview,
          senderName: incomingMessage.senderName,
          sentAt: incomingMessage.sentAt,
        },
        unreadCount: newCount,
      }

      const rest = prev.filter((c) => c.id !== incomingMessage.conversationId)
      return [updatedItem, ...rest]
    })

    // 2. Business Rule: DO NOT notify if user is currently looking at this conversation
    if (conversationId === incomingMessage.conversationId) return

    // 3. Do not notify if sent by me
    if (isFromMe) return

    // 4. Do not notify if conversation is muted
    const isMuted = mutedConversations.includes(incomingMessage.conversationId)
    if (isMuted) return

    // 5. Play chime sound
    playNotificationSound()

    // 6. Set In-App Toast notification
    const messagePreviewForToast =
      incomingMessage.content && incomingMessage.content.trim()
        ? incomingMessage.content
        : (incomingMessage.attachments && incomingMessage.attachments.length > 0
            ? (incomingMessage.attachments.some((a) => (a.fileType || '').startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(a.fileUrl))
                ? (incomingMessage.attachments.length > 1 ? `[Đã gửi ${incomingMessage.attachments.length} hình ảnh]` : "[Hình ảnh]")
                : "[Tệp đính kèm]")
            : "[Đã gửi một hình ảnh/tệp]")

    setToastNotification({
      id: incomingMessage.id,
      conversationId: incomingMessage.conversationId,
      title: convTitle,
      senderName: incomingMessage.senderName,
      content: messagePreviewForToast,
      time: formatMessageTime(incomingMessage.sentAt),
    })

    // 7. Native Browser Notification (if document is hidden / on another tab)
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      if (document.hidden) {
        try {
          const nativeNotif = new Notification(`${convTitle} · ${incomingMessage.senderName}`, {
            body: incomingMessage.content || "Đã gửi một tệp đính kèm",
            icon: "/favicon.ico",
          })
          nativeNotif.onclick = () => {
            window.focus()
            router.push(`/chat/${incomingMessage.conversationId}`)
          }
        } catch {}
      }
    }
  }, [incomingMessage, conversationId, currentUser, mutedConversations, router])

  // Reset unread count & draft recipient when opening a conversation
  useEffect(() => {
    if (conversationId) {
      setDraftRecipient(null)
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
      )
    }
  }, [conversationId])

  // Fetch people list when Tab is "Người" or searching
  useEffect(() => {
    if (activeTab === "Người" || searchSidebar.trim()) {
      setLoadingPeople(true)
      const timer = setTimeout(async () => {
        try {
          const data = await searchUsersApi(searchSidebar)
          setPeopleList(data)
        } catch {
          setPeopleList([])
        } finally {
          setLoadingPeople(false)
        }
      }, 250)
      return () => clearTimeout(timer)
    }
  }, [activeTab, searchSidebar])

  function handleSelectPerson(person: UserSummaryResponse) {
    const existingDirect = conversations.find(
      (c) =>
        c.type === "Direct" &&
        c.participants?.some(
          (p) =>
            p.userId === person.id ||
            p.username === person.username ||
            p.fullName === person.fullName
        )
    )
    if (existingDirect) {
      setDraftRecipient(null)
      router.push(`/chat/${existingDirect.id}`)
    } else {
      // Navigate to /chat to clear any open conversation before showing draft
      setDraftRecipient(person)
      if (conversationId) {
        router.push('/chat')
      }
    }
  }

  // Update browser tab title with total unread count
  useEffect(() => {
    const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
    document.title = totalUnread > 0 ? `(${totalUnread}) Nexus — Trò chuyện` : "Nexus — Trò chuyện"
  }, [conversations])

  // Real-time remove conversation when disbanded
  useEffect(() => {
    if (deletedConversationId) {
      setConversations((prev) => prev.filter((c) => c.id !== deletedConversationId))
      if (conversationId === deletedConversationId) {
        router.replace("/chat")
      }
    }
  }, [deletedConversationId, conversationId, router])

  const [conversationAttachments, setConversationAttachments] = useState<AttachmentResponse[]>([])

  useEffect(() => {
    async function loadAttachments() {
      if (!conversationId) {
        setConversationAttachments([])
        return
      }
      const res = await getMessages(conversationId)
      const allAtts = (res.items || []).flatMap((m) => m.attachments || [])
      setConversationAttachments(allAtts)
    }
    loadAttachments()
  }, [conversationId, incomingConversation])

  // Realtime: update sidebar attachments immediately when new message with images arrives
  useEffect(() => {
    if (!incomingMessage || incomingMessage.conversationId !== conversationId) return
    if (!incomingMessage.attachments || incomingMessage.attachments.length === 0) return
    setConversationAttachments((prev) => {
      const existingIds = new Set(prev.map((a) => a.id))
      const newAtts = incomingMessage.attachments!.filter((a) => !existingIds.has(a.id))
      return [...prev, ...newAtts]
    })
  }, [incomingMessage, conversationId])

  async function loadConversations() {
    const user = getCurrentUser()
    if (user) setCurrentUser(user)
    const data = await getConversations()
    setConversations(data)
    setLoading(false)
  }

  useEffect(() => {
    loadConversations()
  }, [])

  const selected = conversations.find((item) => item.id === conversationId)

  // Determine kind/name from ConversationResponse
  function getConversationInfo(item: ConversationResponse) {
    const isGroup = item.type === "Group"

    // For Direct chat, find the OTHER participant (not current user)
    const otherParticipant = item.participants?.find(
      (p) =>
        (currentUser?.userId && p.userId !== currentUser.userId) ||
        (currentUser?.username && p.username !== currentUser.username) ||
        (currentUser?.fullName && p.fullName !== currentUser.fullName)
    )

    let name = ""
    if (isGroup) {
      name = item.title || item.participants?.map((p) => p.fullName).join(", ") || "Nhóm chat"
    } else {
      name = otherParticipant?.fullName || item.title || item.participants?.[0]?.fullName || "Hội thoại"
    }

    const avatarText = isGroup
      ? "GR"
      : (otherParticipant?.fullName ? otherParticipant.fullName.substring(0, 2).toUpperCase() : name.substring(0, 2).toUpperCase())

    let preview = "Chưa có tin nhắn"
    if (item.lastMessage) {
      const isFromMe =
        (currentUser?.userId && item.lastMessage.senderId === currentUser.userId) ||
        item.lastMessage.senderName === currentUser?.fullName ||
        item.lastMessage.senderName === "Tôi"

      let text = item.lastMessage.content?.trim() || ""

      if (!text) {
        text = "📷 [Hình ảnh]"
      } else if (text === "[Hình ảnh]" || text.includes("hình ảnh")) {
        text = text.startsWith("📷") ? text : `📷 ${text}`
      } else if (text === "[Video]" || text.includes("video")) {
        text = text.startsWith("🎥") ? text : `🎥 ${text}`
      } else if (text.startsWith("[Tệp") || text.includes("tệp") || text.startsWith("📁 [Tệp")) {
        if (text.startsWith("[Tệp] ")) {
          const rawFileName = text.substring(6)
          const cleanFileName = formatCleanFileName(rawFileName)
          text = `📁 [Tệp] ${cleanFileName}`
        } else if (text.startsWith("📁 [Tệp] ")) {
          const rawFileName = text.substring(9)
          const cleanFileName = formatCleanFileName(rawFileName)
          text = `📁 [Tệp] ${cleanFileName}`
        } else {
          text = text.startsWith("📁") ? text : `📁 ${text}`
        }
      }

      if (isFromMe) {
        preview = `Bạn: ${text}`
      } else if (isGroup && item.lastMessage.senderName) {
        preview = `${item.lastMessage.senderName}: ${text}`
      } else {
        preview = text
      }
    }
    const time = formatMessageTime(item.lastMessage?.sentAt)
    const members = item.participants?.length || 2
    return { isGroup, name, avatarText, preview, time, members, otherParticipant }
  }

  const selectedInfo = selected ? getConversationInfo(selected) : null

  // Check strictly if current user is admin of selected conversation
  const isCurrentUserAdmin = Boolean(
    selected?.type === "Group" &&
    selected?.participants?.some(
      (p) =>
        ((currentUser?.userId && p.userId === currentUser.userId) ||
          (currentUser?.fullName && p.fullName === currentUser.fullName) ||
          (currentUser?.username && p.username === currentUser.username)) &&
        p.role === "Admin"
    )
  )

  function handleGroupCreated(newConv: ConversationResponse) {
    setConversations((prev) => {
      if (prev.some((c) => c.id === newConv.id)) return prev
      return [newConv, ...prev]
    })
    router.push(`/chat/${newConv.id}`)
  }

  async function handleRemoveMember(participantId: string) {
    if (!selected || !isCurrentUserAdmin) return
    const updatedParticipants = selected.participants.filter(
      (p) => p.userId !== participantId
    )
    const updatedConv = { ...selected, participants: updatedParticipants }
    setConversations((prev) =>
      prev.map((c) => (c.id === selected.id ? updatedConv : c))
    )
    await removeParticipantApi(selected.id, participantId)
  }

  async function handleDisbandGroup() {
    if (!selected || !isCurrentUserAdmin) return
    setDisbanding(true)
    const currentId = selected.id

    // Optimistically remove from state
    setConversations((prev) => prev.filter((c) => c.id !== currentId))
    setShowDisbandConfirm(false)
    setDisbanding(false)

    router.replace('/chat')
    await deleteConversationApi(currentId)
  }

  // Deduplicate conversations by ID
  const uniqueConversations = Array.from(
    new Map(conversations.map((c) => [c.id, c])).values()
  )

  const filteredConversations = uniqueConversations.filter((item) => {
    const info = getConversationInfo(item)
    const matchesSearch =
      info.name.toLowerCase().includes(searchSidebar.toLowerCase()) ||
      info.preview.toLowerCase().includes(searchSidebar.toLowerCase())

    const matchesTab =
      activeTab === "Hội thoại" ||
      (activeTab === "Nhóm" ? item.type === "Group" : item.type === "Direct")

    return matchesSearch && matchesTab
  })

  return (
    <div className="flex h-dvh min-h-[620px] overflow-hidden bg-background text-foreground">
      {/* Real-time In-App Notification Toast */}
      <NotificationToast
        notification={toastNotification}
        onClose={() => setToastNotification(null)}
      />

      {/* Message Search Modal (MES-006) */}
      <MessageSearchModal
        isOpen={isSearchMessagesOpen}
        onClose={() => setIsSearchMessagesOpen(false)}
        initialConversationId={conversationId}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onSuccess={handleGroupCreated}
      />

      {/* Add Members to Current Group Modal */}
      <AddMembersModal
        isOpen={isAddMembersOpen}
        onClose={() => setIsAddMembersOpen(false)}
        conversation={selected || null}
        onSuccess={(updatedConv) => {
          setConversations((prev) =>
            prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
          )
        }}
      />

      {/* Disband Group Confirmation Modal */}
      {showDisbandConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col w-full max-w-md bg-card border rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-destructive">
              <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base">Giải tán nhóm chat?</h3>
                <p className="text-xs text-muted-foreground">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Bạn có chắc chắn muốn giải tán nhóm <strong>{selectedInfo?.name}</strong> không? Toàn bộ tin nhắn, tài liệu và lịch sử cuộc trò chuyện sẽ bị xóa vĩnh viễn đối với tất cả thành viên.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDisbandConfirm(false)}
                disabled={disbanding}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDisbandGroup}
                disabled={disbanding}
                className="gap-1.5"
              >
                {disbanding ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Đang giải tán...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" /> Giải tán nhóm
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar */}
      <aside className="hidden w-[292px] shrink-0 flex-col border-r bg-card lg:flex">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">MES</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">Tin nhắn</h1>
          </div>
          <button
            onClick={() => setIsCreateGroupOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition shadow-sm"
            title="Tạo nhóm mới"
          >
            <Plus className="size-3.5" />
            <span>Tạo nhóm</span>
          </button>
        </div>

        <div className="flex gap-1 border-b px-3 pt-3">
          {["Hội thoại", "Người", "Nhóm"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 rounded-t-lg px-2 py-2 text-xs font-medium transition",
                activeTab === tab
                  ? "border-b-2 border-primary text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="px-4 py-3">
          <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              value={searchSidebar}
              onChange={(e) => setSearchSidebar(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              placeholder={activeTab === "Người" ? "Tìm nhân viên để nhắn tin..." : "Tìm kiếm cuộc trò chuyện..."}
            />
            {searchSidebar && (
              <button onClick={() => setSearchSidebar("")} className="text-muted-foreground hover:text-foreground">
                <X className="size-3" />
              </button>
            )}
            <button
              onClick={() => setIsSearchMessagesOpen(true)}
              className="text-muted-foreground hover:text-primary transition p-0.5 rounded"
              title="Tìm kiếm tin nhắn nâng cao (MES-006)"
            >
              <Search className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {activeTab === "Người" ? (
            /* People List for Direct Messaging (Section 13) */
            <div className="flex flex-col gap-1 pt-1">
              <div className="flex items-center justify-between px-3 pb-2">
                <span className="text-xs font-medium text-muted-foreground">Nhân viên</span>
                <span className="text-[10px] text-muted-foreground">{peopleList.length} người</span>
              </div>

              {loadingPeople && <p className="p-3 text-xs text-muted-foreground text-center">Đang tìm kiếm...</p>}
              {!loadingPeople && peopleList.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Không tìm thấy nhân viên phù hợp
                </div>
              )}
              {peopleList.map((person) => {
                const isSelectedDraft = draftRecipient?.id === person.id
                const isPersonOnline = Boolean(
                  (person.id && onlineUserIds.includes(person.id)) ||
                  ((person as any).userId && onlineUserIds.includes((person as any).userId))
                )
                return (
                  <button
                    key={person.id}
                    onClick={() => handleSelectPerson(person)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                      isSelectedDraft ? "bg-accent font-medium text-accent-foreground" : "hover:bg-muted/70 text-foreground"
                    )}
                  >
                    <div className="relative shrink-0">
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                        {person.fullName ? person.fullName.substring(0, 2).toUpperCase() : "NV"}
                      </div>
                      {isPersonOnline && (
                        <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card shadow-xs animate-pulse" title="Đang hoạt động" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{person.fullName}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {person.departmentName || person.roleName || person.username}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            /* Conversations List */
            <>
              <div className="flex items-center justify-between px-3 pb-2">
                <span className="text-xs font-medium text-muted-foreground">Gần đây</span>
                <button
                  onClick={() => setIsCreateGroupOpen(true)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition"
                  aria-label="Tạo hội thoại"
                  title="Tạo nhóm chat mới"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              <div className="flex flex-col gap-1">
                {loading && <p className="p-3 text-xs text-muted-foreground text-center">Đang tải...</p>}
                {!loading && filteredConversations.length === 0 && (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    Chưa có hội thoại nào
                  </div>
                )}
                {filteredConversations.map((item) => {
                  const info = getConversationInfo(item)
                  const isActive = conversationId === item.id && !draftRecipient
                  const isMuted = mutedConversations.includes(item.id)
                  const isOtherOnline = !info.isGroup && Boolean(
                    info.otherParticipant?.userId && onlineUserIds.includes(info.otherParticipant.userId)
                  )

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setDraftRecipient(null)
                        router.push(`/chat/${item.id}`)
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition relative",
                        isActive ? "bg-accent text-accent-foreground font-medium" : "hover:bg-muted/70 text-foreground"
                      )}
                    >
                      <div className="relative shrink-0">
                        <div
                          className={cn(
                            "flex size-10 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground",
                            info.isGroup ? "bg-chart-3" : "bg-primary"
                          )}
                        >
                          {info.isGroup ? <Users className="size-4" /> : info.avatarText}
                        </div>
                        {isOtherOnline && (
                          <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card shadow-xs animate-pulse" title="Đang hoạt động" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-medium">{info.name}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {isMuted && <span title="Đã tắt thông báo"><BellOff className="size-3 text-muted-foreground" /></span>}
                            <span className="text-[10px] text-muted-foreground">{info.time}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="truncate text-[11px] text-muted-foreground flex-1">{info.preview}</p>
                          {item.unreadCount && item.unreadCount > 0 && !isActive ? (
                            <span className="flex size-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-xs animate-in zoom-in-50 shrink-0">
                              {item.unreadCount > 99 ? "99+" : item.unreadCount}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* User Profile Bar */}
        <div className="border-t p-3 bg-card">
          <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/50 transition">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {currentUser?.fullName ? currentUser.fullName.substring(0, 2).toUpperCase() : "AN"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{currentUser?.fullName || "Anh Nguyễn"}</p>
              <p className="text-[10px] text-muted-foreground">{currentUser?.roleName || currentUser?.departmentName || "Đang hoạt động"}</p>
            </div>
            <button
              onClick={() => {
                logoutUser()
                router.push('/login')
              }}
              title="Đăng xuất"
              aria-label="Đăng xuất"
              className="text-muted-foreground hover:text-destructive p-1 rounded transition"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex min-w-0 flex-1 flex-col bg-background relative">
        <header className="flex h-[73px] shrink-0 items-center justify-between border-b bg-card px-4 sm:px-6 z-10">
          <div className="flex min-w-0 items-center gap-3">
            <button className="rounded-lg p-2 text-muted-foreground hover:bg-accent lg:hidden" aria-label="Mở danh sách">
              <Menu className="size-5" />
            </button>
            {/* Show draft recipient info when in draft mode */}
            {draftRecipient && (
              <>
                <div className="flex size-10 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {draftRecipient.fullName ? draftRecipient.fullName.substring(0, 2).toUpperCase() : "NV"}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold">{draftRecipient.fullName}</h2>
                  <p className="text-xs text-muted-foreground italic">Tin nhắn mới</p>
                </div>
                <button
                  onClick={() => setDraftRecipient(null)}
                  className="ml-1 flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition"
                  title="Đóng draft"
                >
                  <X className="size-3.5" />
                </button>
              </>
            )}
            {/* Show real conversation info only when NOT in draft mode */}
            {!draftRecipient && selectedInfo && (() => {
              const isOtherOnline = !selectedInfo.isGroup && Boolean(
                selectedInfo.otherParticipant?.userId && onlineUserIds.includes(selectedInfo.otherParticipant.userId)
              )
              return (
                <>
                  <div className="relative shrink-0">
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground shadow-xs",
                        selectedInfo.isGroup ? "bg-chart-3" : "bg-primary"
                      )}
                    >
                      {selectedInfo.isGroup ? <Users className="size-5" /> : selectedInfo.avatarText}
                    </div>
                    {isOtherOnline && (
                      <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card shadow-xs animate-pulse" title="Đang hoạt động" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">{selectedInfo.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {headerTypingUser ? (
                        <span className="text-primary font-medium flex items-center gap-1.5 animate-pulse">
                          <span className="size-1.5 rounded-full bg-primary animate-ping" />
                          <span>{headerTypingUser} đang nhập tin nhắn...</span>
                        </span>
                      ) : selectedInfo.isGroup ? (
                        `${selectedInfo.members} thành viên ${isCurrentUserAdmin ? '· Bạn là Quản trị viên' : ''}`
                      ) : isOtherOnline ? (
                        <span className="text-emerald-500 font-medium flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Đang hoạt động</span>
                        </span>
                      ) : (
                        <span>Ngoại tuyến</span>
                      )}
                    </p>
                  </div>
                </>
              )
            })()}
            {!draftRecipient && !selectedInfo && <h2 className="text-sm font-semibold text-muted-foreground">Chọn một hội thoại</h2>}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsSearchMessagesOpen(true)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition"
              aria-label="Tìm kiếm tin nhắn"
              title="Tìm kiếm tin nhắn (MES-006)"
            >
              <Search className="size-4" />
            </button>
            {selected && (
              <button
                onClick={() => toggleMuteConversation(selected.id)}
                className={cn(
                  "rounded-lg p-2 transition hover:bg-accent",
                  mutedConversations.includes(selected.id)
                    ? "text-destructive bg-destructive/10 hover:bg-destructive/20"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Tắt / Bật thông báo"
                title={mutedConversations.includes(selected.id) ? "Bật lại thông báo" : "Tắt thông báo cuộc trò chuyện này"}
              >
                {mutedConversations.includes(selected.id) ? <BellOff className="size-4" /> : <Bell className="size-4" />}
              </button>
            )}
            <button
              onClick={() => setShowDetails((value) => !value)}
              className={cn(
                "rounded-lg p-2 transition hover:bg-accent hover:text-foreground",
                showDetails ? "text-primary bg-primary/10" : "text-muted-foreground"
              )}
              aria-label="Thông tin hội thoại"
              title="Xem thông tin & thành viên"
            >
              <Info className="size-4" />
            </button>
            <button
              onClick={() => setIsCreateGroupOpen(true)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Tạo nhóm mới"
              title="Tạo nhóm mới"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative flex flex-col">
          {draftRecipient ? (
            <DraftChatWorkspace
              recipient={draftRecipient}
              onConversationCreated={(newConv) => {
                setConversations((prev) => {
                  if (prev.some((c) => c.id === newConv.id)) return prev
                  return [newConv, ...prev]
                })
                setDraftRecipient(null)
                router.push(`/chat/${newConv.id}`)
              }}
              onCancel={() => setDraftRecipient(null)}
            />
          ) : (
            children
          )}
        </div>
      </main>

      {/* Right Details Sidebar */}
      {showDetails && selectedInfo && (
        <aside className="hidden w-[310px] shrink-0 border-l bg-card xl:flex xl:flex-col overflow-y-auto">
          <div className="flex h-[73px] items-center justify-between border-b px-5">
            <h3 className="font-semibold text-sm">Chi tiết cuộc trò chuyện</h3>
            <button
              onClick={() => setShowDetails(false)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Đóng chi tiết"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Group / Person Profile Header */}
          <div className="flex flex-col items-center border-b px-5 py-6">
            {(() => {
              const isOtherOnline = !selectedInfo.isGroup && Boolean(
                selectedInfo.otherParticipant?.userId && onlineUserIds.includes(selectedInfo.otherParticipant.userId)
              )
              return (
                <div className="relative">
                  <div
                    className={cn(
                      "flex size-16 items-center justify-center rounded-2xl text-base font-semibold text-primary-foreground shadow-sm",
                      selectedInfo.isGroup ? "bg-chart-3" : "bg-primary"
                    )}
                  >
                    {selectedInfo.isGroup ? <Users className="size-7" /> : selectedInfo.avatarText}
                  </div>
                  {isOtherOnline && (
                    <span className="absolute bottom-0 right-0 size-3.5 rounded-full bg-emerald-500 ring-2 ring-card shadow-xs animate-pulse" title="Đang hoạt động" />
                  )}
                </div>
              )
            })()}
            <h3 className="mt-3 text-sm font-semibold text-center">{selectedInfo.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedInfo.isGroup ? "Nhóm làm việc" : (
                selectedInfo.otherParticipant?.userId && onlineUserIds.includes(selectedInfo.otherParticipant.userId) ? (
                  <span className="text-emerald-500 font-medium flex items-center justify-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500" /> Đang hoạt động
                  </span>
                ) : (
                  "Ngoại tuyến"
                )
              )}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => selected && toggleMuteConversation(selected.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition shadow-xs",
                  selected && mutedConversations.includes(selected.id)
                    ? "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
                    : "border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {selected && mutedConversations.includes(selected.id) ? (
                  <>
                    <BellOff className="size-3.5" /> Bật thông báo
                  </>
                ) : (
                  <>
                    <Bell className="size-3.5" /> Tắt thông báo
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Members List Section */}
          {selectedInfo.isGroup && (
            <div className="p-5 border-b space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Thành viên ({selected?.participants?.length || 0})
                </p>
                {/* Only Admin can add members */}
                {isCurrentUserAdmin && (
                  <button
                    onClick={() => setIsAddMembersOpen(true)}
                    className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                    title="Thêm thành viên vào nhóm này"
                  >
                    <UserPlus className="size-3" /> Thêm
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto divide-y divide-border/50">
                {selected?.participants?.map((participant) => {
                  const isAdmin = participant.role === "Admin"
                  const isMe =
                    (currentUser?.userId && participant.userId === currentUser.userId) ||
                    (currentUser?.fullName && participant.fullName === currentUser.fullName) ||
                    (currentUser?.username && participant.username === currentUser.username)
                  const isMemberOnline = isMe || (participant.userId && onlineUserIds.includes(participant.userId))

                  return (
                    <div key={participant.userId || participant.username} className="flex items-center justify-between py-2 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <div className="flex size-7 items-center justify-center rounded-full bg-muted font-medium text-[10px]">
                            {participant.fullName.substring(0, 2).toUpperCase()}
                          </div>
                          {isMemberOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-1 ring-card shadow-xs" title="Đang hoạt động" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate flex items-center gap-1.5">
                            <span>{participant.fullName} {isMe && '(Bạn)'}</span>
                            {isMemberOnline && <span className="size-1.5 rounded-full bg-emerald-500" title="Online" />}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">{participant.role || 'Thành viên'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isAdmin ? (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-semibold">
                            <ShieldCheck className="size-3" /> Admin
                          </span>
                        ) : (
                          /* ONLY Admin can see the remove button, regular members NEVER see it */
                          isCurrentUserAdmin && (
                            <button
                              onClick={() => handleRemoveMember(participant.userId)}
                              title="Xóa khỏi nhóm"
                              aria-label={`Xóa ${participant.fullName} khỏi nhóm`}
                              className="p-1 text-muted-foreground hover:text-destructive transition rounded hover:bg-destructive/10"
                            >
                              <UserMinus className="size-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Group Admin Actions: Disband Group */}
          {selectedInfo.isGroup && isCurrentUserAdmin && (
            <div className="p-5 border-b space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quản trị nhóm
              </p>
              <button
                onClick={() => setShowDisbandConfirm(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive hover:text-destructive-foreground transition"
              >
                <Trash2 className="size-3.5" />
                <span>Giải tán nhóm chat</span>
              </button>
            </div>
          )}

          {/* Files & Media Section */}
          <div className="flex flex-col gap-5 p-5">
            {/* Shared Media */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ảnh &amp; Video đã chia sẻ ({conversationAttachments.filter((a) => (a.fileType || '').startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(a.fileUrl)).length})
                </p>
                {conversationAttachments.filter((a) => (a.fileType || '').startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(a.fileUrl)).length > 0 && (
                  <button
                    onClick={() => { setGalleryIndex(0); setShowGallery(true) }}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 transition"
                    title="Xem tất cả ảnh"
                  >
                    <Plus className="size-3" />
                    <span>Xem tất cả</span>
                  </button>
                )}
              </div>
              {conversationAttachments.filter((a) => (a.fileType || '').startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(a.fileUrl)).length === 0 ? (
                <p className="mt-2 text-[11px] text-muted-foreground">Chưa có ảnh hoặc video nào</p>
              ) : (
                <div className="mt-2.5 grid grid-cols-3 gap-1.5 overflow-hidden rounded-xl">
                  {conversationAttachments
                    .filter((a) => (a.fileType || '').startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(a.fileUrl))
                    .slice(0, 6)
                    .map((att, idx) => {
                      const fullUrl = att.fileUrl.startsWith('http') || att.fileUrl.startsWith('blob')
                        ? att.fileUrl
                        : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5011'}${att.fileUrl.startsWith('/') ? '' : '/'}${att.fileUrl}`
                      const isLast = idx === 5
                      const totalImages = conversationAttachments.filter((a) => (a.fileType || '').startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(a.fileUrl)).length
                      const remainingCount = totalImages - 6
                      return (
                        <button
                          key={att.id || idx}
                          onClick={() => { setGalleryIndex(idx); setShowGallery(true) }}
                          className="group relative block aspect-square overflow-hidden rounded-lg bg-muted"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={fullUrl}
                            alt={att.fileName}
                            className="size-full object-cover transition group-hover:scale-105"
                          />
                          {/* Overlay for last item showing remaining count */}
                          {isLast && remainingCount > 0 && (
                            <div
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); setGalleryIndex(5); setShowGallery(true) }}
                              className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px] cursor-pointer"
                            >
                              <span className="text-white font-bold text-base">+{remainingCount}</span>
                            </div>
                          )}
                        </button>
                      )
                    })}
                </div>
              )}
            </div>

            {/* Shared Documents */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tệp &amp; Tài liệu ({conversationAttachments.filter((a) => !(a.fileType || '').startsWith('image/') && !/\.(jpg|jpeg|png|gif|webp)$/i.test(a.fileUrl)).length})
                </p>
                {conversationAttachments.filter((a) => !(a.fileType || '').startsWith('image/') && !/\.(jpg|jpeg|png|gif|webp)$/i.test(a.fileUrl)).length > 0 && (
                  <button
                    onClick={() => { setDocSearchQuery(""); setShowDocumentsModal(true) }}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 transition cursor-pointer"
                    title="Mở rộng xem toàn bộ tệp & tài liệu"
                  >
                    <Plus className="size-3.5" />
                    <span>Xem tất cả</span>
                  </button>
                )}
              </div>
              {conversationAttachments.filter((a) => !(a.fileType || '').startsWith('image/') && !/\.(jpg|jpeg|png|gif|webp)$/i.test(a.fileUrl)).length === 0 ? (
                <p className="mt-2 text-[11px] text-muted-foreground">Chưa có tệp tài liệu nào</p>
              ) : (
                <div className="mt-2.5 space-y-2">
                  {conversationAttachments
                    .filter((a) => !(a.fileType || '').startsWith('image/') && !/\.(jpg|jpeg|png|gif|webp)$/i.test(a.fileUrl))
                    .slice(0, 5)
                    .map((att, idx) => {
                      const fullUrl = att.fileUrl.startsWith('http') || att.fileUrl.startsWith('blob')
                        ? att.fileUrl
                        : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5011'}${att.fileUrl.startsWith('/') ? '' : '/'}${att.fileUrl}`
                      const cleanName = formatCleanFileName(att.fileName || att.fileUrl)
                      return (
                        <div
                          key={att.id || idx}
                          className="flex items-center justify-between gap-2.5 rounded-xl border p-2.5 bg-muted/30 hover:bg-muted/60 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                              <FileText className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium" title={cleanName}>{cleanName}</p>
                              {att.fileSize && (
                                <p className="text-[10px] text-muted-foreground">{formatFileSize(att.fileSize)}</p>
                              )}
                            </div>
                          </div>
                          <a
                            href={fullUrl}
                            download={cleanName}
                            target="_blank"
                            rel="noreferrer"
                            title={`Tải xuống ${cleanName}`}
                            className="p-1.5 text-muted-foreground hover:text-primary transition rounded"
                          >
                            <Download className="size-3.5" />
                          </a>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Full Gallery Lightbox Modal */}
      {showGallery && (() => {
        const allImages = conversationAttachments
          .filter((a) => (a.fileType || '').startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(a.fileUrl))
          .map((att) =>
            att.fileUrl.startsWith('http') || att.fileUrl.startsWith('blob')
              ? att.fileUrl
              : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5011'}${att.fileUrl.startsWith('/') ? '' : '/'}${att.fileUrl}`
          )
        const current = allImages[galleryIndex]
        return (
          <div
            className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowGallery(false)}
          >
            {/* Top bar */}
            <div
              className="flex items-center justify-between px-5 py-3 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-sm font-medium text-white/80">
                {galleryIndex + 1} / {allImages.length} &mdash; Ảnh &amp; Video đã chia sẻ
              </span>
              <button
                onClick={() => setShowGallery(false)}
                className="flex size-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Main image viewer */}
            <div
              className="flex flex-1 items-center justify-center relative min-h-0 px-14"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Prev */}
              {galleryIndex > 0 && (
                <button
                  onClick={() => setGalleryIndex((i) => i - 1)}
                  className="absolute left-3 flex size-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                >
                  <ChevronLeft className="size-6" />
                </button>
              )}

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={current}
                src={current}
                alt={`Ảnh ${galleryIndex + 1}`}
                className="max-h-full max-w-full rounded-xl object-contain shadow-2xl animate-in zoom-in-95 duration-150"
              />

              {/* Next */}
              {galleryIndex < allImages.length - 1 && (
                <button
                  onClick={() => setGalleryIndex((i) => i + 1)}
                  className="absolute right-3 flex size-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                >
                  <ChevronRight className="size-6" />
                </button>
              )}
            </div>

            {/* Thumbnails strip */}
            <div
              className="flex shrink-0 gap-1.5 overflow-x-auto px-5 py-3 scrollbar-thin"
              onClick={(e) => e.stopPropagation()}
            >
              {allImages.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setGalleryIndex(idx)}
                  className={`shrink-0 size-14 overflow-hidden rounded-lg border-2 transition ${
                    idx === galleryIndex ? 'border-primary scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Ảnh ${idx + 1}`} className="size-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Full Shared Documents Modal */}
      {showDocumentsModal && (() => {
        const allDocs = conversationAttachments.filter(
          (a) => !(a.fileType || '').startsWith('image/') && !/\.(jpg|jpeg|png|gif|webp)$/i.test(a.fileUrl)
        )
        const filteredDocs = docSearchQuery.trim()
          ? allDocs.filter((d) => d.fileName?.toLowerCase().includes(docSearchQuery.toLowerCase()))
          : allDocs

        const getDocIcon = (fileName: string) => {
          const ext = fileName?.split('.').pop()?.toLowerCase() || ''
          if (['pdf'].includes(ext)) return <FileText className="size-5 text-red-500" />
          if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet className="size-5 text-emerald-500" />
          if (['doc', 'docx'].includes(ext)) return <FileText className="size-5 text-blue-500" />
          if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <FileArchive className="size-5 text-amber-500" />
          return <File className="size-5 text-muted-foreground" />
        }

        return (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setShowDocumentsModal(false)}
          >
            <div
              className="flex flex-col w-full max-w-2xl max-h-[85vh] bg-card border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">Tệp &amp; Tài liệu đã chia sẻ</h3>
                    <p className="text-xs text-muted-foreground">
                      Tổng cộng {allDocs.length} tệp tài liệu trong cuộc trò chuyện này
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDocumentsModal(false)}
                  className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Search Box */}
              <div className="px-6 py-3 border-b bg-muted/20">
                <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2">
                  <Search className="size-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={docSearchQuery}
                    onChange={(e) => setDocSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm tài liệu theo tên..."
                    className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                    autoFocus
                  />
                  {docSearchQuery && (
                    <button onClick={() => setDocSearchQuery("")} className="text-muted-foreground hover:text-foreground">
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Document List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-2.5 min-h-[220px]">
                {filteredDocs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <FileText className="size-10 mb-2 opacity-30" />
                    <p className="text-sm font-medium">Không tìm thấy tài liệu phù hợp</p>
                    {docSearchQuery && (
                      <p className="mt-1 text-xs text-muted-foreground/80">Thử tìm kiếm với từ khóa khác</p>
                    )}
                  </div>
                ) : (
                  filteredDocs.map((att, idx) => {
                    const fullUrl = att.fileUrl.startsWith('http') || att.fileUrl.startsWith('blob')
                      ? att.fileUrl
                      : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5011'}${att.fileUrl.startsWith('/') ? '' : '/'}${att.fileUrl}`
                    const cleanName = formatCleanFileName(att.fileName || att.fileUrl)
                    return (
                      <div
                        key={att.id || idx}
                        className="group flex items-center justify-between gap-4 p-3 rounded-xl border bg-muted/20 hover:bg-muted/50 hover:border-primary/20 transition duration-150"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card border shadow-2xs">
                            {getDocIcon(cleanName)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <a
                              href={fullUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-xs text-foreground hover:text-primary transition truncate block"
                              title={cleanName}
                            >
                              {cleanName}
                            </a>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                              {att.fileSize ? <span>{formatFileSize(att.fileSize)}</span> : null}
                              {att.fileType ? <span>&bull; {att.fileType}</span> : null}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={fullUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition"
                            title="Mở xem trong tab mới"
                          >
                            <ExternalLink className="size-3.5" />
                            <span className="hidden sm:inline">Xem</span>
                          </a>
                          <a
                            href={fullUrl}
                            download={cleanName}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition"
                            title="Tải tệp về máy"
                          >
                            <Download className="size-3.5" />
                            <span className="hidden sm:inline">Tải về</span>
                          </a>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-3.5 border-t bg-muted/30 text-xs text-muted-foreground">
                <span>Hiển thị {filteredDocs.length} / {allDocs.length} tệp</span>
                <button
                  onClick={() => setShowDocumentsModal(false)}
                  className="px-4 py-1.5 rounded-lg border bg-background hover:bg-muted text-foreground transition font-medium cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
