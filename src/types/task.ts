export type TaskStatus = 'Todo' | 'InProgress' | 'Done'
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent'

export interface TaskAssigneeDto {
  userId: string
  fullName: string
}

export interface TaskResponse {
  id: string
  title: string
  description?: string
  deadline?: string
  status: TaskStatus | string
  priority?: TaskPriority | string
  assigneeId?: string
  assigneeName?: string
  assignees?: TaskAssigneeDto[]
  assigneeIds?: string[]
  creatorId?: string
  creatorName?: string
  sourceMessageId?: string
  conversationId?: string
  createdAt: string
}

export interface CreateTaskInput {
  conversationId?: string
  sourceMessageId?: string
  assigneeId?: string
  assigneeIds?: string[]
  title: string
  description?: string
  deadline?: string
  priority?: TaskPriority
}

export interface AssignTaskInput {
  assigneeId?: string
  assigneeIds?: string[]
}

export interface UpdateTaskStatusInput {
  status: TaskStatus
}

export interface TaskReminderDto {
  taskId: string
  taskTitle: string
  conversationId?: string
  type: 'DueSoon24h' | 'DueSoon1h' | 'Overdue' | string
  deadline: string
  message: string
}
