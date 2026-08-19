export interface ConversationResponse {
  id: string
  title?: string
  type: 'Direct' | 'Group' | string
  avatarUrl?: string
  createdAt: string
  participants: ParticipantResponse[]
  lastMessage?: MessageSummaryResponse
  unreadCount?: number
  isMuted?: boolean
}

export interface ParticipantResponse {
  userId: string
  username: string
  fullName: string
  role: 'Admin' | 'Member' | string
}

export interface MessageSummaryResponse {
  id: string
  content?: string
  senderId?: string
  senderName: string
  sentAt: string
}

export interface MessageResponse {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  content?: string
  isRecalled: boolean
  sentAt: string
  attachments: AttachmentResponse[]
  reactions: ReactionResponse[]
  reads?: MessageReadResponse[]
}

export interface CursorPaginatedMessagesResponse {
  items: MessageResponse[]
  nextCursor?: string | null
  hasMore: boolean
  totalCount: number
}

export interface MessageReadResponse {
  userId: string
  userName: string
  fullName: string
  avatarUrl?: string
  readAt: string
}

export interface MessagesReadEvent {
  conversationId: string
  readerId: string
  readerName: string
  messageIds: string[]
  readAt: string
}

export interface UserTypingEvent {
  conversationId: string
  userId: string
  userName: string
  isTyping: boolean
}

export interface AttachmentResponse {
  id?: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize?: number
}

export interface AttachmentInput {
  fileUrl: string
  fileType?: string
  fileSize?: number
}

export interface FileUploadResponse {
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
}

export interface ReactionResponse {
  emoji: string
  count: number
  userNames: string[]
  userIds?: string[]
}

export interface MessageRecalledEvent {
  conversationId: string
  messageId: string
}

export interface MessageReactionEvent {
  conversationId: string
  messageId: string
  reactions: ReactionResponse[]
}

export interface UserSummaryResponse {
  id: string
  username: string
  fullName: string
  isActive?: boolean
  departmentName?: string
  roleName?: string
}

export interface CreateConversationRequest {
  title?: string
  type: 'Group' | 'Direct'
  participantIds: string[]
  category?: 'department' | 'shift' | 'project' | 'general'
}

export interface SendDirectMessagePayload {
  recipientId: string
  content?: string
  attachments?: AttachmentInput[]
  clientOperationId?: string
}

export interface SendDirectMessageResponse {
  conversation: ConversationResponse
  message: MessageResponse
  wasConversationCreated: boolean
}

export interface SearchMessagesParams {
  q?: string
  senderId?: string
  conversationId?: string
  fromDate?: string
  toDate?: string
  hasAttachments?: boolean
  fileType?: string
  pageNumber?: number
  pageSize?: number
}

export interface MessageSearchResultItem {
  messageId: string
  conversationId: string
  conversationTitle?: string
  conversationType: string
  senderId: string
  senderName: string
  senderUsername?: string
  content?: string
  sentAt: string
  attachments: AttachmentResponse[]
}

export interface MessageSearchPagedResponse {
  items: MessageSearchResultItem[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

