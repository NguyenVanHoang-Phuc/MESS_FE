export interface ConversationResponse {
  id: string
  title?: string
  type: 'Direct' | 'Group' | string
  avatarUrl?: string
  createdAt: string
  participants: ParticipantResponse[]
  lastMessage?: MessageSummaryResponse
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
}

export interface AttachmentResponse {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
}

export interface ReactionResponse {
  emoji: string
  count: number
  userNames: string[]
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
