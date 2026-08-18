import api from '@/lib/axios'
import type { AttachmentInput, ConversationResponse, CreateConversationRequest, FileUploadResponse, MessageResponse, UserSummaryResponse } from '@/types/chat'

const fallbackUsers: UserSummaryResponse[] = [
  { id: '1', username: 'minh.nguyen', fullName: 'Minh Nguyễn', departmentName: 'Kỹ thuật', roleName: 'Trưởng nhóm UI/UX' },
  { id: '2', username: 'lan.anh', fullName: 'Lan Anh', departmentName: 'Thiết kế', roleName: 'Senior Designer' },
  { id: '3', username: 'tuan.hoang', fullName: 'Tuấn Hoàng', departmentName: 'Sản phẩm', roleName: 'Product Owner' },
  { id: '4', username: 'duc.pham', fullName: 'Đức Phạm', departmentName: 'Kỹ thuật', roleName: 'Backend Lead' },
  { id: '5', username: 'thuy.le', fullName: 'Thuý Lê', departmentName: 'Vận hành', roleName: 'Trưởng ca trực' },
  { id: '6', username: 'hoa.vu', fullName: 'Hoa Vũ', departmentName: 'Kinh doanh', roleName: 'Account Executive' },
  { id: '7', username: 'nam.tran', fullName: 'Nam Trần', departmentName: 'Kỹ thuật', roleName: 'DevOps Engineer' },
]

const fallbackConversations: ConversationResponse[] = [
  {
    id: 'design-team',
    title: 'Nhóm Thiết kế',
    type: 'Group',
    createdAt: new Date().toISOString(),
    participants: [
      { userId: '1', username: 'minh.nguyen', fullName: 'Minh Nguyễn', role: 'Member' },
      { userId: '2', username: 'lan.anh', fullName: 'Lan Anh', role: 'Member' },
      { userId: '3', username: 'you', fullName: 'Bạn', role: 'Admin' },
    ],
    lastMessage: {
      id: 'm1',
      senderName: 'Minh Nguyễn',
      content: 'Mình đã cập nhật bản wireframe mới...',
      sentAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
  },
  {
    id: 'lan-anh',
    title: 'Lan Anh',
    type: 'Direct',
    createdAt: new Date().toISOString(),
    participants: [
      { userId: '2', username: 'lan.anh', fullName: 'Lan Anh', role: 'Member' },
      { userId: '3', username: 'you', fullName: 'Bạn', role: 'Member' },
    ],
    lastMessage: {
      id: 'm2',
      senderName: 'Lan Anh',
      content: 'Cảm ơn bạn nhiều nhé!',
      sentAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
  },
]

const fallbackMessagesMap: Record<string, MessageResponse[]> = {
  'design-team': [
    {
      id: '1',
      conversationId: 'design-team',
      senderId: '1',
      senderName: 'Minh Nguyễn',
      content: 'Mọi người xem giúp mình bản wireframe mới nhé.',
      isRecalled: false,
      sentAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      attachments: [],
      reactions: [],
    },
    {
      id: '2',
      conversationId: 'design-team',
      senderId: '3',
      senderName: 'Tôi',
      content: 'Mình đã xem qua. Phần luồng onboarding trông rõ ràng hơn nhiều rồi.',
      isRecalled: false,
      sentAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      attachments: [],
      reactions: [],
    },
    {
      id: '3',
      conversationId: 'design-team',
      senderId: '2',
      senderName: 'Lan Anh',
      content: 'Đồng ý. Mình sẽ bổ sung thêm trạng thái loading cho màn hình này.',
      isRecalled: false,
      sentAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      attachments: [],
      reactions: [],
    },
    {
      id: '4',
      conversationId: 'design-team',
      senderId: '3',
      senderName: 'Tôi',
      content: 'Tuyệt vời, cảm ơn Lan Anh!',
      isRecalled: false,
      sentAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      attachments: [],
      reactions: [],
    },
  ],
}

export async function getUsers(): Promise<UserSummaryResponse[]> {
  try {
    const response = await api.get<any>('/users')
    const data = response.data?.data
    if (Array.isArray(data) && data.length > 0) {
      return data
    }
    return fallbackUsers
  } catch (error) {
    console.warn('Cannot fetch users from API, using fallback list:', error)
    return fallbackUsers
  }
}

export async function getConversations(): Promise<ConversationResponse[]> {
  try {
    const response = await api.get<any>('/conversations')
    const data = response.data?.data
    if (Array.isArray(data) && data.length > 0) {
      return data
    }
    if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
      return data.items
    }
    return fallbackConversations
  } catch (error) {
    console.warn('Cannot fetch conversations from API, using fallback:', error)
    return fallbackConversations
  }
}

export async function createConversation(payload: CreateConversationRequest): Promise<ConversationResponse | null> {
  try {
    const response = await api.post<any>('/conversations', {
      type: payload.type,
      title: payload.title,
      participantIds: payload.participantIds,
    })
    
    if (response.data?.success && response.data.data) {
      return response.data.data
    }
    return null
  } catch (error) {
    console.error('Failed to create conversation via API:', error)
    const newConv: ConversationResponse = {
      id: `group-${Date.now()}`,
      title: payload.title || 'Nhóm mới',
      type: payload.type,
      createdAt: new Date().toISOString(),
      participants: [
        { userId: 'me', username: 'you', fullName: 'Bạn (Quản trị viên)', role: 'Admin' },
        ...payload.participantIds.map(id => {
          const u = fallbackUsers.find(user => user.id === id)
          return {
            userId: id,
            username: u?.username || 'member',
            fullName: u?.fullName || 'Thành viên',
            role: 'Member'
          }
        })
      ],
      lastMessage: {
        id: `m-init-${Date.now()}`,
        content: 'Nhóm chat đã được tạo thành công.',
        senderName: 'Hệ thống',
        sentAt: new Date().toISOString()
      }
    }
    return newConv
  }
}

export async function addParticipantApi(conversationId: string, userId: string, role = "Member"): Promise<ConversationResponse | null> {
  try {
    const response = await api.post<any>(`/conversations/${conversationId}/participants`, {
      userId,
      role
    })
    if (response.data?.success && response.data.data) {
      return response.data.data
    }
    return null
  } catch (error) {
    console.error(`Failed to add participant to conversation ${conversationId}:`, error)
    return null
  }
}

export async function removeParticipantApi(conversationId: string, userId: string): Promise<ConversationResponse | null> {
  try {
    const response = await api.delete<any>(`/conversations/${conversationId}/participants/${userId}`)
    if (response.data?.success && response.data.data) {
      return response.data.data
    }
    return null
  } catch (error) {
    console.error(`Failed to remove participant from conversation ${conversationId}:`, error)
    return null
  }
}

export async function deleteConversationApi(conversationId: string): Promise<boolean> {
  try {
    const response = await api.delete<any>(`/conversations/${conversationId}`)
    return Boolean(response.data?.success)
  } catch (error) {
    console.error(`Failed to delete/disband conversation ${conversationId}:`, error)
    return false
  }
}

export async function markConversationAsReadApi(conversationId: string): Promise<boolean> {
  try {
    const response = await api.post<any>(`/messages/conversations/${conversationId}/read`)
    return Boolean(response.data?.success)
  } catch (error) {
    console.error(`Failed to mark conversation ${conversationId} as read:`, error)
    return false
  }
}

export async function getMessages(conversationId: string): Promise<MessageResponse[]> {
  try {
    const response = await api.get<any>(`/messages/${conversationId}`)
    const data = response.data?.data
    let list: MessageResponse[] = []

    if (data?.items && Array.isArray(data.items)) {
      list = data.items
    } else if (Array.isArray(data)) {
      list = data
    } else if (fallbackMessagesMap[conversationId]) {
      list = fallbackMessagesMap[conversationId]
    }

    // Always ensure chronological order: oldest at top, newest at bottom
    return list.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
  } catch (error) {
    console.warn(`Cannot fetch messages for ${conversationId}, checking fallback:`, error)
    if (fallbackMessagesMap[conversationId]) {
      return fallbackMessagesMap[conversationId].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
    }
    return []
  }
}

export async function uploadFilesApi(files: File[]): Promise<FileUploadResponse[]> {
  if (!files || files.length === 0) return []
  if (files.length > 30) {
    throw new Error('Bạn chỉ có thể tải lên tối đa 30 tệp mỗi lần gửi.')
  }

  // Validate file sizes (< 25MB)
  for (const file of files) {
    if (file.size > 25 * 1024 * 1024) {
      throw new Error(`Tệp "${file.name}" vượt quá dung lượng tối đa 25MB.`)
    }
  }

  const formData = new FormData()
  for (const file of files) {
    formData.append('files', file)
  }

  const response = await api.post<any>('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  if (response.data?.success && response.data.data) {
    return response.data.data
  }
  return []
}

export async function sendMessageApi(
  conversationId: string,
  content?: string,
  attachments?: AttachmentInput[]
): Promise<MessageResponse | null> {
  try {
    const response = await api.post<any>('/messages', {
      conversationId: conversationId,
      content: content || null,
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
    })
    
    if (response.data?.success && response.data.data) {
      return response.data.data
    }
    return null
  } catch (error) {
    console.error(`Failed to send message to ${conversationId}`, error)
    return null
  }
}

export async function searchUsersApi(q: string, limit = 20): Promise<UserSummaryResponse[]> {
  try {
    const response = await api.get<any>('/users/search', {
      params: { q, limit },
    })
    if (response.data?.success && Array.isArray(response.data.data)) {
      return response.data.data
    }
    return []
  } catch (error) {
    console.error('Failed to search users via API, fallback to local filtering', error)
    const users = await getUsers()
    const query = q.toLowerCase().trim()
    if (!query) return users.slice(0, limit)
    return users
      .filter(
        (u) =>
          u.fullName.toLowerCase().includes(query) ||
          u.username.toLowerCase().includes(query) ||
          (u.departmentName && u.departmentName.toLowerCase().includes(query))
      )
      .slice(0, limit)
  }
}

export async function sendDirectMessageApi(
  payload: import('@/types/chat').SendDirectMessagePayload
): Promise<import('@/types/chat').SendDirectMessageResponse | null> {
  try {
    const response = await api.post<any>('/messages/direct', payload)
    if (response.data?.success && response.data.data) {
      return response.data.data
    }
    return null
  } catch (error) {
    console.error('Failed to send direct message via API', error)
    throw error
  }
}

export async function searchMessagesApi(
  params: import('@/types/chat').SearchMessagesParams
): Promise<import('@/types/chat').MessageSearchPagedResponse> {
  try {
    const response = await api.get<any>('/messages/search', { params })
    if (response.data?.success && response.data.data) {
      return response.data.data
    }
    return { items: [], totalCount: 0, pageNumber: 1, pageSize: 20 }
  } catch (error) {
    console.error('Failed to search messages via API', error)
    return { items: [], totalCount: 0, pageNumber: 1, pageSize: 20 }
  }
}

export async function recallMessageApi(
  messageId: string
): Promise<import('@/types/chat').MessageResponse | null> {
  try {
    const response = await api.post<any>(`/messages/${messageId}/recall`)
    if (response.data?.success && response.data.data) {
      return response.data.data
    }
    return null
  } catch (error) {
    console.error(`Failed to recall message ${messageId}`, error)
    throw error
  }
}

export async function reactMessageApi(
  messageId: string,
  emoji: string
): Promise<import('@/types/chat').ReactionResponse[] | null> {
  try {
    const response = await api.post<any>(`/messages/${messageId}/react`, { emoji })
    if (response.data?.success && response.data.data) {
      return response.data.data
    }
    return null
  } catch (error) {
    console.error(`Failed to react to message ${messageId}`, error)
    throw error
  }
}


