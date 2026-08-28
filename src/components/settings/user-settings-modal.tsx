"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  X,
  User,
  Palette,
  Upload,
  Camera,
  Trash2,
  Check,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  Shield,
  Building,
  Mail,
  Loader2,
  Sliders,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCurrentUser, updateCurrentUser } from "@/services/api/auth"
import { uploadFilesApi } from "@/services/api/chat"
import { useTheme, ACCENT_COLORS, ThemeMode, AccentColor } from "@/context/theme-context"
import { UserAvatar, AVATAR_GRADIENTS, AVATAR_EMOJIS } from "@/components/chat/user-avatar"
import type { UserProfile } from "@/types/auth"
import { cn } from "@/utils/cn"

interface UserSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: "avatar" | "theme"
}

export function UserSettingsModal({
  isOpen,
  onClose,
  initialTab = "avatar",
}: UserSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"avatar" | "theme">(initialTab)
  const [user, setUser] = useState<UserProfile | null>(null)

  // Avatar states
  const [selectedGradient, setSelectedGradient] = useState<string>("primary-default")
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [fullName, setFullName] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { theme, setTheme, accentColor, setAccentColor } = useTheme()

  // Load user data on open
  useEffect(() => {
    if (isOpen) {
      const current = getCurrentUser()
      if (current) {
        setUser(current)
        setFullName(current.fullName || "")
        setAvatarUrl(current.avatarUrl || null)
        setSelectedGradient(current.avatarBg || "primary-default")
        setSelectedEmoji(current.avatarEmoji || null)
      }
      setActiveTab(initialTab)
      setSaveSuccess(false)
    }
  }, [isOpen, initialTab])

  if (!isOpen) return null

  // Handle local avatar file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // 1. Try uploading to Cloudinary / backend storage
      const uploaded = await uploadFilesApi([file])
      if (uploaded && uploaded.length > 0 && uploaded[0].fileUrl) {
        setAvatarUrl(uploaded[0].fileUrl)
        setSelectedEmoji(null)
      } else {
        // Fallback to local Data URL
        const reader = new FileReader()
        reader.onload = (event) => {
          setAvatarUrl(event.target?.result as string)
          setSelectedEmoji(null)
        }
        reader.readAsDataURL(file)
      }
    } catch {
      // Local Data URL fallback
      const reader = new FileReader()
      reader.onload = (event) => {
        setAvatarUrl(event.target?.result as string)
        setSelectedEmoji(null)
      }
      reader.readAsDataURL(file)
    } finally {
      setIsUploading(false)
      if (e.target) e.target.value = ""
    }
  }

  // Handle saving profile changes
  const handleSaveProfile = () => {
    setIsSaving(true)
    try {
      const updated = updateCurrentUser({
        fullName: fullName.trim() || user?.fullName || "Người dùng",
        avatarUrl: avatarUrl || undefined,
        avatarBg: selectedGradient || undefined,
        avatarEmoji: selectedEmoji || undefined,
      })
      if (updated) {
        setUser(updated)
        setSaveSuccess(true)
        setTimeout(() => {
          setSaveSuccess(false)
        }, 2500)
      }
    } catch (err) {
      console.error("Failed to save user settings:", err)
    } finally {
      setIsSaving(false)
    }
  }

  // Reset avatar to standard initials
  const handleResetToDefault = () => {
    setAvatarUrl(null)
    setSelectedEmoji(null)
    setSelectedGradient("primary-default")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border bg-card shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 shrink-0 bg-card">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <Sliders className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                Cài đặt & Tùy chỉnh
              </h2>
              <p className="text-xs text-muted-foreground">
                Tùy chỉnh ảnh đại diện, hồ sơ và giao diện hệ thống MES
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b px-6 pt-3 bg-muted/20 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("avatar")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition -mb-px cursor-pointer",
              activeTab === "avatar"
                ? "border-primary text-primary bg-background/80 rounded-t-lg shadow-2xs"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-t-lg"
            )}
          >
            <User className="size-3.5" />
            <span>Ảnh đại diện & Hồ sơ</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("theme")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition -mb-px cursor-pointer",
              activeTab === "theme"
                ? "border-primary text-primary bg-background/80 rounded-t-lg shadow-2xs"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-t-lg"
            )}
          >
            <Palette className="size-3.5" />
            <span>Giao diện & Tông màu</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6 custom-scrollbar">
          {saveSuccess && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="size-4 shrink-0" />
              <span className="font-semibold">Đã lưu cài đặt và cập nhật ảnh đại diện thành công!</span>
            </div>
          )}

          {/* TAB 1: AVATAR & PROFILE */}
          {activeTab === "avatar" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Profile Preview Card */}
              <div className="rounded-2xl border bg-gradient-to-br from-card via-muted/20 to-card p-5 shadow-xs flex flex-col sm:flex-row items-center gap-5">
                <div className="relative group">
                  <UserAvatar
                    src={avatarUrl}
                    name={fullName || user?.fullName}
                    emoji={selectedEmoji}
                    gradient={selectedGradient}
                    size="2xl"
                    isOnline={true}
                    className="ring-4 ring-primary/20 shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-semibold transition backdrop-blur-2xs cursor-pointer"
                    title="Đổi ảnh đại diện"
                  >
                    <Camera className="size-5 mb-0.5" />
                    <span>Đổi ảnh</span>
                  </button>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-base font-bold text-foreground truncate">{fullName || user?.fullName || "Người dùng"}</h3>
                    <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      <Shield className="size-3" />
                      {user?.roleName || "Nhân viên"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 truncate">
                    <Building className="size-3 text-muted-foreground" />
                    <span>{user?.departmentName || "Phòng ban cơ cấu MES"}</span>
                    <span className="opacity-40">·</span>
                    <span className="font-mono text-[11px]">@{user?.username || "user"}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground pt-1">
                    Ảnh đại diện sẽ hiển thị trên tất cả tin nhắn chat, danh bạ nhân sự và bảng điều khiển quản trị.
                  </p>
                </div>
              </div>

              {/* Action: Upload Image */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Tải ảnh từ máy tính</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Hỗ trợ JPG, PNG, WebP (Tối đa 5MB)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-xs gap-1.5 rounded-xl cursor-pointer hover:bg-muted/80 shadow-2xs"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Đang xử lý ảnh...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="size-3.5 text-primary" />
                        <span>Tải ảnh lên...</span>
                      </>
                    )}
                  </Button>

                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAvatarUrl(null)}
                      className="text-xs text-destructive hover:bg-destructive/10 gap-1.5 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Xóa ảnh đã tải</span>
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetToDefault}
                    className="text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-xl cursor-pointer ml-auto"
                  >
                    <span>Đặt lại mặc định</span>
                  </Button>
                </div>
              </div>

              {/* Action: Preset Gradients */}
              <div className="space-y-2.5 pt-2">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-amber-500" />
                  <span>Bộ sưu tập Avatar Màu sắc Gradient</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {AVATAR_GRADIENTS.map((g) => {
                    const isSelected = selectedGradient === g.id && !avatarUrl && !selectedEmoji
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setSelectedGradient(g.id)
                          setSelectedEmoji(null)
                          setAvatarUrl(null)
                        }}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-2 rounded-xl border transition cursor-pointer relative group",
                          isSelected
                            ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-xs"
                            : "border-border/60 hover:bg-muted/50"
                        )}
                      >
                        <div
                          className={cn(
                            "size-9 rounded-full flex items-center justify-center text-xs font-bold shadow-xs transition group-hover:scale-105",
                            g.class
                          )}
                        >
                          {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : "AN"}
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate w-full text-center font-medium">
                          {g.name}
                        </span>
                        {isSelected && (
                          <div className="absolute top-1 right-1 size-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[8px] font-bold shadow-2xs">
                            ✓
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Action: Preset Emojis */}
              <div className="space-y-2.5 pt-2">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>🎭 Biểu tượng 3D Emoji cá tính</span>
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                  {AVATAR_EMOJIS.map((emoji) => {
                    const isSelected = selectedEmoji === emoji && !avatarUrl
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setSelectedEmoji(emoji)
                          setAvatarUrl(null)
                        }}
                        className={cn(
                          "size-10 rounded-xl flex items-center justify-center text-lg border transition cursor-pointer hover:scale-110",
                          isSelected
                            ? "border-primary bg-primary/15 ring-2 ring-primary/40 shadow-xs"
                            : "border-border/60 bg-muted/20 hover:bg-muted"
                        )}
                      >
                        <span>{emoji}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Full Name Edit */}
              <div className="space-y-1.5 pt-2 border-t">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Họ và tên hiển thị</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên hiển thị..."
                  className="w-full h-9 px-3 rounded-lg border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* TAB 2: THEME & COLOR */}
          {activeTab === "theme" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Theme Mode Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>Chế độ hiển thị (Theme Mode)</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Light */}
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-2xl border text-center transition cursor-pointer relative",
                      theme === "light"
                        ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-xs"
                        : "border-border/80 bg-muted/20 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-2xs">
                      <Sun className="size-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Chế độ Sáng</p>
                      <p className="text-[10px] text-muted-foreground">Nền sáng rõ nét, dễ đọc ban ngày</p>
                    </div>
                    {theme === "light" && (
                      <div className="absolute top-2.5 right-2.5 size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shadow-xs">
                        ✓
                      </div>
                    )}
                  </button>

                  {/* Dark */}
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-2xl border text-center transition cursor-pointer relative",
                      theme === "dark"
                        ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-xs"
                        : "border-border/80 bg-muted/20 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-2xs">
                      <Moon className="size-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Chế độ Tối</p>
                      <p className="text-[10px] text-muted-foreground">Giao diện bóng đêm dịu mắt</p>
                    </div>
                    {theme === "dark" && (
                      <div className="absolute top-2.5 right-2.5 size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shadow-xs">
                        ✓
                      </div>
                    )}
                  </button>

                  {/* System */}
                  <button
                    type="button"
                    onClick={() => setTheme("system")}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-2xl border text-center transition cursor-pointer relative",
                      theme === "system"
                        ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-xs"
                        : "border-border/80 bg-muted/20 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="flex size-11 items-center justify-center rounded-xl bg-slate-500/10 text-slate-400 border border-slate-500/20 shadow-2xs">
                      <Laptop className="size-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Hệ thống</p>
                      <p className="text-[10px] text-muted-foreground">Tự động đồng bộ theo thiết bị</p>
                    </div>
                    {theme === "system" && (
                      <div className="absolute top-2.5 right-2.5 size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shadow-xs">
                        ✓
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Accent Color Palette */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Tông màu chủ đạo (Accent Color)</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Áp dụng cho nút, nhãn và điểm nhấn</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {ACCENT_COLORS.map((accent) => {
                    const isSelected = accentColor === accent.id
                    return (
                      <button
                        key={accent.id}
                        type="button"
                        onClick={() => setAccentColor(accent.id)}
                        className={cn(
                          "flex items-center gap-2.5 p-2.5 rounded-xl border transition cursor-pointer",
                          isSelected
                            ? "border-primary bg-primary/10 ring-2 ring-primary/30 font-bold shadow-xs"
                            : "border-border/80 bg-muted/20 hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div
                          className="size-4 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: accent.hex }}
                        />
                        <span className="text-xs truncate">{accent.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Live Preview Widget */}
              <div className="space-y-2 pt-2 border-t">
                <label className="text-xs font-bold text-foreground">Xem trước giao diện thời gian thực</label>
                <div className="rounded-2xl border p-4 bg-card shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      src={avatarUrl}
                      name={fullName || user?.fullName}
                      emoji={selectedEmoji}
                      gradient={selectedGradient}
                      size="sm"
                      isOnline={true}
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-foreground">{fullName || user?.fullName || "Bạn"}</span>
                      <span className="text-[10px] text-muted-foreground ml-1.5">vừa xong</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl rounded-tl-sm bg-primary text-primary-foreground text-xs font-medium max-w-[85%] shadow-xs">
                    Xin chào! Đây là bản xem trước giao diện với màu sắc bạn vừa chọn.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-3.5 border-t bg-muted/15 shrink-0">
          <p className="text-[11px] text-muted-foreground hidden sm:block">
            Nhấn <strong className="text-foreground">Lưu thay đổi</strong> để áp dụng ngay lập tức.
          </p>
          <div className="flex items-center gap-2.5 ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs cursor-pointer"
            >
              Đóng
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="text-xs gap-1.5 shadow-sm cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Check className="size-3.5" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
