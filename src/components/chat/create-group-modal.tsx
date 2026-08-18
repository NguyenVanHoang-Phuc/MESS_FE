'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2, Plus, Search, ShieldCheck, UserCheck, Users, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { getUsers, createConversation } from '@/services/api/chat'
import { getCurrentUser } from '@/services/api/auth'
import type { ConversationResponse, UserSummaryResponse } from '@/types/chat'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newConversation: ConversationResponse) => void
}

const CATEGORIES = [
  { id: 'project', label: '📁 Dự án', defaultPrefix: 'Dự án ' },
  { id: 'department', label: '🏢 Phòng ban', defaultPrefix: 'Phòng ' },
  { id: 'shift', label: '⏰ Ca trực/kíp', defaultPrefix: 'Ca ' },
  { id: 'general', label: '👥 Nhóm chung', defaultPrefix: 'Nhóm ' },
]

export function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
  const [category, setCategory] = useState('project')
  const [groupName, setGroupName] = useState('')
  const [users, setUsers] = useState<UserSummaryResponse[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDept, setSelectedDept] = useState('all')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setLoadingUsers(true)
      getUsers()
        .then((data) => setUsers(data))
        .finally(() => setLoadingUsers(false))
    } else {
      // Reset form on close
      setGroupName('')
      setSelectedUserIds([])
      setSearchQuery('')
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const currentUser = getCurrentUser()
  const departments = ['all', ...Array.from(new Set(users.map((u) => u.departmentName).filter(Boolean) as string[]))]

  const filteredUsers = users.filter((user) => {
    // Exclude the current creator from the selectable list
    if (currentUser?.userId && user.id === currentUser.userId) return false
    if (currentUser?.username && user.username === currentUser.username) return false

    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.departmentName && user.departmentName.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesDept = selectedDept === 'all' || user.departmentName === selectedDept
    return matchesSearch && matchesDept
  })

  function toggleUser(userId: string) {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!groupName.trim()) {
      setError('Vui lòng nhập tên nhóm chat.')
      return
    }
    if (selectedUserIds.length === 0) {
      setError('Vui lòng chọn ít nhất 1 thành viên cho nhóm.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const result = await createConversation({
        title: groupName.trim(),
        type: 'Group',
        participantIds: selectedUserIds,
        category: category as any,
      })

      if (result) {
        onSuccess(result)
        onClose()
      } else {
        setError('Không thể tạo nhóm chat. Vui lòng thử lại.')
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tạo nhóm.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="flex flex-col w-full max-w-xl max-h-[90vh] bg-card border rounded-2xl shadow-2xl overflow-hidden text-foreground animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b bg-card">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Tạo nhóm chat mới</h2>
              <p className="text-xs text-muted-foreground">Tạo không gian trao đổi theo phòng ban, ca trực hoặc dự án</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreateGroup} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {error && (
              <div className="p-3 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
                {error}
              </div>
            )}

            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Phân loại nhóm
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id)
                      if (!groupName || CATEGORIES.some((c) => groupName.startsWith(c.defaultPrefix))) {
                        setGroupName(cat.defaultPrefix)
                      }
                    }}
                    className={cn(
                      'flex items-center justify-center px-3 py-2.5 rounded-xl border text-xs font-medium transition text-center',
                      category === cat.id
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border bg-background hover:bg-muted text-muted-foreground'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Group Name input */}
            <div>
              <label htmlFor="group-name" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Tên nhóm chat <span className="text-destructive">*</span>
              </label>
              <input
                id="group-name"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ví dụ: Dự án Nexus App, Phòng Kỹ Thuật, Ca trực sáng..."
                required
                className="w-full h-11 px-4 text-sm bg-background border rounded-xl outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Admin Notice */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-primary shrink-0" />
              <span>Bạn là <strong>Quản trị viên (Admin)</strong> của nhóm này và có quyền thêm/xóa thành viên.</span>
            </div>

            {/* Members Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Thành viên tham gia <span className="text-destructive">*</span>
                </label>
                <span className="text-xs font-medium text-primary">
                  Đã chọn: {selectedUserIds.length} người
                </span>
              </div>

              {/* Search & Dept Filters */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-background border rounded-xl">
                  <Search className="size-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm nhân viên theo tên, email, phòng ban..."
                    className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground">
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Department filter pills */}
                {departments.length > 2 && (
                  <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                    {departments.map((dept) => (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => setSelectedDept(dept)}
                        className={cn(
                          'px-2.5 py-1 rounded-lg shrink-0 transition text-[11px]',
                          selectedDept === dept
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                        )}
                      >
                        {dept === 'all' ? 'Tất cả' : dept}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* User List */}
              <div className="border rounded-xl max-h-52 overflow-y-auto divide-y bg-background">
                {loadingUsers ? (
                  <div className="flex items-center justify-center p-6 text-xs text-muted-foreground">
                    <Loader2 className="size-4 animate-spin mr-2" /> Đang tải danh sách nhân viên...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    Không tìm thấy nhân viên phù hợp
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelected = selectedUserIds.includes(user.id)
                    return (
                      <div
                        key={user.id}
                        onClick={() => toggleUser(user.id)}
                        className={cn(
                          'flex items-center justify-between p-3 cursor-pointer transition select-none hover:bg-muted/60',
                          isSelected && 'bg-primary/5'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-semibold">
                            {user.fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{user.fullName}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {user.roleName || user.departmentName || `@${user.username}`}
                            </p>
                          </div>
                        </div>
                        <div
                          className={cn(
                            'flex size-5 shrink-0 items-center justify-center rounded-md border transition',
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-input bg-background'
                          )}
                        >
                          {isSelected && <Check className="size-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-card">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={submitting || !groupName.trim() || selectedUserIds.length === 0}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Đang tạo nhóm...
                </>
              ) : (
                <>
                  <Plus className="size-4" /> Tạo nhóm chat
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
