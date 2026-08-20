import api from '@/lib/axios'
import { TaskResponse, CreateTaskInput, TaskStatus } from '@/types/task'

export async function createTaskApi(input: CreateTaskInput): Promise<TaskResponse> {
  const response = await api.post<any>('/tasks', input)
  if (response.data?.success && response.data.data) {
    return response.data.data
  }
  throw new Error(response.data?.message || 'Không thể tạo task.')
}

export async function getTasksApi(params?: {
  conversationId?: string
  messageId?: string
  assigneeId?: string
  creatorId?: string
  status?: string
}): Promise<TaskResponse[]> {
  const response = await api.get<any>('/tasks', { params })
  if (response.data?.success && response.data.data) {
    return response.data.data
  }
  return []
}

export async function getTaskByIdApi(id: string): Promise<TaskResponse> {
  const response = await api.get<any>(`/tasks/${id}`)
  if (response.data?.success && response.data.data) {
    return response.data.data
  }
  throw new Error(response.data?.message || 'Không tìm thấy công việc.')
}

export async function assignTaskApi(
  taskId: string,
  assigneeId?: string | null,
  assigneeIds?: string[]
): Promise<TaskResponse> {
  const response = await api.put<any>(`/tasks/${taskId}/assign`, { assigneeId, assigneeIds })
  if (response.data?.success && response.data.data) {
    return response.data.data
  }
  throw new Error(response.data?.message || 'Không thể gán người phụ trách.')
}

export async function updateTaskStatusApi(taskId: string, status: TaskStatus): Promise<TaskResponse> {
  const response = await api.put<any>(`/tasks/${taskId}/status`, { status })
  if (response.data?.success && response.data.data) {
    return response.data.data
  }
  throw new Error(response.data?.message || 'Không thể cập nhật trạng thái.')
}

export async function deleteTaskApi(taskId: string): Promise<void> {
  const response = await api.delete<any>(`/tasks/${taskId}`)
  if (response.data?.success) {
    return
  }
  throw new Error(response.data?.message || 'Không thể xóa công việc.')
}
