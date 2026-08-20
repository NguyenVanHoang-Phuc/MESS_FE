'use client'

import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Clock,
  Flag,
  Loader2,
  MoreHorizontal,
  Trash2,
  UserCheck,
  UserPlus,
} from 'lucide-react'
import { assignTaskApi, deleteTaskApi, updateTaskStatusApi } from '@/services/api/tasks'
import { getCurrentUser } from '@/services/api/auth'
import type { TaskPriority, TaskResponse, TaskStatus } from '@/types/task'
import type { ParticipantResponse } from '@/types/chat'
import { cn } from '@/utils/cn'

interface TaskItemBadgeProps {
  task: TaskResponse
  participants: ParticipantResponse[]
  currentUserId?: string
  onTaskUpdated?: (updated: TaskResponse) => void
  onTaskDeleted?: (taskId: string) => void
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  Todo: {
    label: 'Chưa làm',
    bg: 'bg-slate-500/10 border-slate-500/30',
    text: 'text-slate-400',
    icon: CheckSquare,
  },
  InProgress: {
    label: 'Đang làm',
    bg: 'bg-blue-500/10 border-blue-500/30',
    text: 'text-blue-400',
    icon: Clock,
  },
  Done: {
    label: 'Hoàn thành',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    text: 'text-emerald-400',
    icon: CheckCircle2,
  },
}

const PRIORITY_BADGES: Record<string, { label: string; badge: string }> = {
  Low: { label: 'Thấp', badge: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' },
  Medium: { label: 'Trung bình', badge: 'text-amber-400 border-amber-500/20 bg-amber-500/10' },
  High: { label: 'Cao', badge: 'text-orange-400 border-orange-500/20 bg-orange-500/10' },
  Urgent: { label: 'Khẩn cấp', badge: 'text-rose-400 border-rose-500/20 bg-rose-500/10' },
}

export function TaskItemBadge({
  task,
  participants,
  currentUserId,
  onTaskUpdated,
  onTaskDeleted,
}: TaskItemBadgeProps) {
  const [assigning, setAssigning] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showAssignDropdown, setShowAssignDropdown] = useState(false)

  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.Todo
  const StatusIcon = statusCfg.icon
  const priorityCfg = PRIORITY_BADGES[task.priority || 'Medium'] || PRIORITY_BADGES.Medium

  // Format deadline
  let deadlineStr = ''
  let isOverdue = false
  if (task.deadline) {
    const d = new Date(task.deadline)
    if (!isNaN(d.getTime())) {
      const now = new Date()
      isOverdue = d.getTime() < now.getTime() && task.status !== 'Done'
      const hh = d.getHours().toString().padStart(2, '0')
      const mm = d.getMinutes().toString().padStart(2, '0')
      const dd = d.getDate().toString().padStart(2, '0')
      const mo = (d.getMonth() + 1).toString().padStart(2, '0')
      deadlineStr = `${hh}:${mm} ${dd}-${mo}`
    }
  }

  // Quick cycle status
  async function handleCycleStatus() {
    if (updatingStatus) return
    let nextStatus: TaskStatus = 'Todo'
    if (task.status === 'Todo') nextStatus = 'InProgress'
    else if (task.status === 'InProgress') nextStatus = 'Done'
    else if (task.status === 'Done') nextStatus = 'Todo'

    setUpdatingStatus(true)
    try {
      const updated = await updateTaskStatusApi(task.id, nextStatus)
      if (onTaskUpdated) onTaskUpdated(updated)
    } catch (err) {
      console.error('Failed to update task status:', err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Current active assignee IDs list
  const currentAssigneeIds = task.assigneeIds && task.assigneeIds.length > 0
    ? task.assigneeIds
    : task.assigneeId ? [task.assigneeId] : []

  // Direct Assign in chat (MES-010) - Toggle participant in list
  async function handleToggleAssignUser(userId: string) {
    setAssigning(true)
    const exists = currentAssigneeIds.includes(userId)
    const updatedIds = exists
      ? currentAssigneeIds.filter((id: string) => id !== userId)
      : [...currentAssigneeIds, userId]

    try {
      const updated = await assignTaskApi(
        task.id,
        updatedIds.length > 0 ? updatedIds[0] : null,
        updatedIds
      )
      if (onTaskUpdated) onTaskUpdated(updated)
    } catch (err) {
      console.error('Failed to assign task user:', err)
    } finally {
      setAssigning(false)
    }
  }

  async function handleClearAllAssignees() {
    setAssigning(true)
    setShowAssignDropdown(false)
    try {
      const updated = await assignTaskApi(task.id, null, [])
      if (onTaskUpdated) onTaskUpdated(updated)
    } catch (err) {
      console.error('Failed to clear assignees:', err)
    } finally {
      setAssigning(false)
    }
  }

  async function handleDeleteTask() {
    if (deleting) return
    setDeleting(true)
    try {
      await deleteTaskApi(task.id)
      if (onTaskDeleted) onTaskDeleted(task.id)
    } catch (err) {
      console.error('Failed to delete task:', err)
    } finally {
      setDeleting(false)
      setShowConfirmDelete(false)
    }
  }

  // Computed display name for assignees
  const assigneeDisplay = (() => {
    if (task.assignees && task.assignees.length > 0) {
      if (task.assignees.length === 1) return task.assignees[0].fullName
      if (task.assignees.length === 2) return `${task.assignees[0].fullName}, ${task.assignees[1].fullName}`
      return `${task.assignees[0].fullName} (+${task.assignees.length - 1})`
    }
    return task.assigneeName || null
  })()

  const isElevated = showAssignDropdown || showConfirmDelete

  const effectiveUser = getCurrentUser()
  const effectiveUserId = currentUserId || effectiveUser?.userId || ''
  const normalizedCurrentUserId = (effectiveUserId || '').toLowerCase().trim()
  const creatorIdNormalized = (task.creatorId || '').toLowerCase().trim()
  const assigneeIdNormalized = (task.assigneeId || '').toLowerCase().trim()

  const isCreator = Boolean(
    !task.creatorId ||
    (normalizedCurrentUserId && creatorIdNormalized && creatorIdNormalized === normalizedCurrentUserId) ||
    (effectiveUser?.fullName && task.creatorName && task.creatorName.toLowerCase() === effectiveUser.fullName.toLowerCase())
  )

  const isAssignee = Boolean(
    normalizedCurrentUserId &&
      (assigneeIdNormalized === normalizedCurrentUserId ||
        (task.assigneeIds && task.assigneeIds.some((id: string) => (id || '').toLowerCase().trim() === normalizedCurrentUserId)) ||
        (task.assignees && task.assignees.some((a: any) => (a.userId || '').toLowerCase().trim() === normalizedCurrentUserId)) ||
        (effectiveUser?.fullName && task.assignees && task.assignees.some((a: any) => a.fullName?.toLowerCase() === effectiveUser.fullName.toLowerCase())))
  )

  const canChangeStatus = isCreator || isAssignee || !effectiveUserId

  const cleanDescription = (task.description || '').replace(/<!--ASSIGNEES:.*?-->/g, '').trim()

  return (
    <div
      className={cn(
        "mt-2 w-full max-w-sm rounded-xl border border-primary/25 bg-card/95 p-2.5 shadow-sm backdrop-blur-xs text-xs text-foreground animate-in fade-in zoom-in-95 duration-150 transition",
        isElevated ? "relative z-50 ring-1 ring-primary/40 shadow-xl" : "relative z-10"
      )}
    >
      {/* Header Row: Task Title & Status Pill */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={handleCycleStatus}
            disabled={updatingStatus || !canChangeStatus}
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-md border transition",
              canChangeStatus
                ? `hover:scale-110 cursor-pointer ${statusCfg.bg} ${statusCfg.text}`
                : `cursor-not-allowed opacity-60 ${statusCfg.bg} ${statusCfg.text}`
            )}
            title={
              canChangeStatus
                ? `Trạng thái: ${statusCfg.label}. Bấm để chuyển sang bước tiếp theo.`
                : `Trạng thái: ${statusCfg.label}. Chỉ người tạo hoặc người phụ trách mới có quyền đổi trạng thái.`
            }
          >
            {updatingStatus ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <StatusIcon className="size-3" />
            )}
          </button>
          <span className={`font-semibold truncate text-[12px] ${task.status === 'Done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {task.title}
          </span>
        </div>

        {/* Priority Badge & Delete Button */}
        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${priorityCfg.badge}`}
          >
            {priorityCfg.label}
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              disabled={deleting}
              className="size-5 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
              title="Xóa công việc này"
            >
              {deleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
            </button>

            {/* Delete Confirmation Modal (Centralized with Dark Backdrop) */}
            {showConfirmDelete && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
                onClick={() => setShowConfirmDelete(false)}
              >
                <div
                  className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                    <Trash2 className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground">Xóa công việc này?</h3>
                    <p className="text-xs font-semibold text-foreground/90 break-words">
                      "{task.title}"
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Công việc sẽ bị xóa hoàn toàn khỏi cuộc trò chuyện. Thao tác này không thể hoàn tác.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowConfirmDelete(false)}
                      className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteTask}
                      disabled={deleting}
                      className="flex-1 rounded-xl bg-destructive text-destructive-foreground px-4 py-2 text-xs font-semibold hover:bg-destructive/90 transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      {deleting ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description if any */}
      {cleanDescription && (
        <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2 pl-6">
          {cleanDescription}
        </p>
      )}

      {/* Meta Row: Assignee & Deadline */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-1.5 pl-0.5 text-[11px]">
        {/* Assignee button / selector (MES-010) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAssignDropdown((prev) => !prev)}
            disabled={assigning}
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-muted/70 text-muted-foreground hover:text-foreground transition cursor-pointer border border-transparent hover:border-border/60"
            title="Đổi hoặc thêm người phụ trách"
          >
            {assigning ? (
              <Loader2 className="size-3 animate-spin text-primary" />
            ) : assigneeDisplay ? (
              <>
                <UserCheck className="size-3 text-primary" />
                <span className="font-medium text-foreground max-w-[140px] truncate">{assigneeDisplay}</span>
              </>
            ) : (
              <>
                <UserPlus className="size-3 text-muted-foreground" />
                <span className="italic text-muted-foreground">Chưa gán</span>
              </>
            )}
            <ChevronDown className="size-2.5 opacity-60" />
          </button>

          {/* Quick Assign Dropdown with Backdrop */}
          {showAssignDropdown && (
            <>
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setShowAssignDropdown(false)}
              />
              <div className="absolute left-0 top-full z-50 mt-1.5 w-60 rounded-xl border bg-card/98 p-2 shadow-2xl animate-in zoom-in-95 duration-100 ring-1 ring-border/80 backdrop-blur-md">
                <div className="flex items-center justify-between pb-1 mb-1 border-b border-border/60">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Người phụ trách ({currentAssigneeIds.length})
                  </p>
                  {currentAssigneeIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllAssignees}
                      className="text-[10px] text-destructive hover:underline cursor-pointer"
                    >
                      Bỏ tất cả
                    </button>
                  )}
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1">
                  {participants.map((p) => {
                    const isChecked = currentAssigneeIds.includes(p.userId)
                    return (
                      <button
                        key={p.userId}
                        type="button"
                        onClick={() => handleToggleAssignUser(p.userId)}
                        className={`w-full flex items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition cursor-pointer ${
                          isChecked
                            ? 'bg-primary/15 text-primary font-semibold'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div
                            className={`size-3.5 rounded flex items-center justify-center border text-[9px] shrink-0 transition ${
                              isChecked
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'border-muted-foreground/40 bg-background'
                            }`}
                          >
                            {isChecked && '✓'}
                          </div>
                          <span className="truncate">{p.fullName || p.username}</span>
                        </div>
                        {p.userId === currentUserId && (
                          <span className="text-[10px] text-muted-foreground font-normal shrink-0 ml-1">(Tôi)</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Deadline badge */}
        {deadlineStr ? (
          <div
            className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${
              isOverdue
                ? 'border-destructive/40 bg-destructive/10 text-destructive'
                : 'border-border/60 text-muted-foreground bg-muted/30'
            }`}
            title={isOverdue ? 'Đã quá hạn!' : 'Hạn hoàn thành'}
          >
            {isOverdue ? <AlertCircle className="size-3" /> : <Clock className="size-3" />}
            <span>{deadlineStr}</span>
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground">Không có deadline</span>
        )}
      </div>
    </div>
  )
}
