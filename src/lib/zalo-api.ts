const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5011/api'

export interface CustomerRecipient {
  id: string
  fullName: string
  username: string
  phoneNumber: string
  departmentName: string
  positionTitle: string
  totalNotificationsReceived: number
  lastNotifiedAt?: string
}

export interface SendZaloSchedulePayload {
  customerIds: string[]
  courseName: string
  shiftName?: string
  shiftTime: string
  roomUrl: string
  teacherName?: string
  customNote?: string
  bannerUrl?: string
}

export interface ZaloNotificationLogItem {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  courseName: string
  shiftTime: string
  roomUrl: string
  teacherName: string
  customNote: string
  sentByUserId: string
  sentByUserName: string
  status: string
  channel: string
  messageId: string
  sentAt: string
}

export interface ZaloSendBatchResult {
  success: boolean
  message: string
  totalSent: number
  successCount: number
  failCount: number
  results: ZaloNotificationLogItem[]
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getZaloRecipients(): Promise<CustomerRecipient[]> {
  try {
    const res = await fetch(`${API_BASE}/notifications/zalo/recipients`, {
      headers: { ...getAuthHeader() },
    })
    if (!res.ok) throw new Error('Không thể tải danh sách khách hàng.')
    const data = await res.json()
    return data.data || []
  } catch (err) {
    console.error('getZaloRecipients error:', err)
    return []
  }
}

export async function sendZaloScheduleNotification(
  payload: SendZaloSchedulePayload
): Promise<ZaloSendBatchResult> {
  const res = await fetch(`${API_BASE}/notifications/zalo/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.message || 'Lỗi khi gửi thông báo Zalo.')
  }

  return await res.json()
}

export async function getZaloHistory(limit: number = 50): Promise<ZaloNotificationLogItem[]> {
  try {
    const res = await fetch(`${API_BASE}/notifications/zalo/history?limit=${limit}`, {
      headers: { ...getAuthHeader() },
    })
    if (!res.ok) throw new Error('Không thể tải lịch sử thông báo Zalo.')
    const data = await res.json()
    return data.data || []
  } catch (err) {
    console.error('getZaloHistory error:', err)
    return []
  }
}

export async function getCustomerZaloInbox(
  customerId: string
): Promise<ZaloNotificationLogItem[]> {
  try {
    const res = await fetch(`${API_BASE}/notifications/zalo/customer/${customerId}/inbox`, {
      headers: { ...getAuthHeader() },
    })
    if (!res.ok) throw new Error('Không thể tải hộp thư Zalo của khách hàng.')
    const data = await res.json()
    return data.data || []
  } catch (err) {
    console.error('getCustomerZaloInbox error:', err)
    return []
  }
}
