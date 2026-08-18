'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2, Search, UserPlus, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addParticipantApi, getUsers } from '@/services/api/chat'
import type { ConversationResponse, ParticipantResponse, UserSummaryResponse } from '@/types/chat'

interface AddMembersModalProps {
  isOpen: boolean
  onClose: () => void
  conversation: ConversationResponse | null
  onSuccess: (updatedConversation: ConversationResponse) => void
}

export function AddMembersModal({
  isOpen,
  onClose,
  conversation,
  onSuccess,
}: AddMembersModalProps) {
  const [availableUsers, setAvailableUsers] = useState<UserSummaryResponse[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setSelectedUserIds([])
      setSearch('')
      setError(null)
      loadUsers()
    }
  }, [isOpen])

  async function loadUsers() {
    setLoadingUsers(true)
    try {
      const data = await getUsers()
      setAvailableUsers(data)
    } catch (err) {
      console.error('Failed to load users', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  if (!isOpen || !conversation) return null

  const existingParticipantIds = new Set(
    conversation.participants?.map((p) => p.userId) || []
  )

  const filteredUsers = availableUsers.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.departmentName && u.departmentName.toLowerCase().includes(search.toLowerCase()))
    return matchesSearch
  })

  function toggleSelect(userId: string) {
    if (existingParticipantIds.has(userId)) return
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedUserIds.length === 0) {
      setError('Vui lòng chọn ít nhất 1 thành viên để thêm vào nhóm.')
      return
    }

    if (!conversation) return

    setSubmitting(true)
    setError(null)

    try {
      let currentConv: ConversationResponse = conversation
      for (const userId of selectedUserIds) {
        const res = await addParticipantApi(conversation.id, userId, 'Member')
        if (res) {
          currentConv = res
        } else {
          // Fallback optimistic update
          const userObj = availableUsers.find((u) => u.id === userId)
          if (userObj && currentConv) {
            const newParticipant: ParticipantResponse = {
              userId: userObj.id,
              username: userObj.username,
              fullName: userObj.fullName,
              role: 'Member',
            }
            currentConv = {
              ...currentConv,
              participants: [...(currentConv.participants || []), newParticipant],
            }
          }
        }
      }

      onSuccess(currentConv)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi thêm thành viên.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-lg bg-card border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserPlus className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Thêm thành viên</h3>
              <p className="text-xs text-muted-foreground">
                Vào nhóm: <span className="font-medium text-foreground">{conversation.title || 'Nhóm chat'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* Search box */}
          <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên nhân viên, phòng ban..."
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* User selection list */}
          <div className="flex flex-col flex-1 overflow-y-auto min-h-[220px] max-h-[280px] border rounded-xl divide-y divide-border/60">
            {loadingUsers && (
              <div className="flex flex-1 items-center justify-center p-8 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin mr-2" /> Đang tải danh sách nhân viên...
              </div>
            )}

            {!loadingUsers && filteredUsers.length === 0 && (
              <div className="flex flex-1 items-center justify-center p-8 text-xs text-muted-foreground">
                Không tìm thấy nhân viên phù hợp
              </div>
            )}

            {!loadingUsers &&
              filteredUsers.map((user) => {
                const isAlreadyIn = existingParticipantIds.has(user.id)
                const isSelected = selectedUserIds.includes(user.id)

                return (
                  <div
                    key={user.id}
                    onClick={() => toggleSelect(user.id)}
                    className={`flex items-center justify-between p-3 transition ${
                      isAlreadyIn
                        ? 'opacity-50 cursor-not-allowed bg-muted/30'
                        : 'cursor-pointer hover:bg-accent/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                        {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'NV'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{user.fullName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {user.departmentName || user.roleName || user.username}
                        </p>
                      </div>
                    </div>

                    {isAlreadyIn ? (
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        Đã trong nhóm
                      </span>
                    ) : (
                      <div
                        className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition ${
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/30 bg-background'
                        }`}
                      >
                        {isSelected && <Check className="size-3.5" />}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              Đã chọn: <strong className="text-foreground">{selectedUserIds.length}</strong> người
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || selectedUserIds.length === 0}
                className="gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Đang thêm...
                  </>
                ) : (
                  <>
                    <UserPlus className="size-3.5" /> Thêm vào nhóm
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
