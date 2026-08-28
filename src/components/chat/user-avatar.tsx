"use client"

import React, { useState } from "react"
import { cn } from "@/utils/cn"
import { User } from "lucide-react"

export interface UserAvatarProps {
  src?: string | null
  name?: string | null
  emoji?: string | null
  gradient?: string | null
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"
  isOnline?: boolean
  className?: string
  alt?: string
}

const SIZE_MAP = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
  xl: "size-16 text-xl",
  "2xl": "size-20 text-2xl",
  "3xl": "size-24 text-3xl",
}

const DOT_SIZE_MAP = {
  xs: "size-1.5 -bottom-0.5 -right-0.5",
  sm: "size-2 -bottom-0.5 -right-0.5",
  md: "size-2.5 bottom-0 right-0",
  lg: "size-3 bottom-0.5 right-0.5",
  xl: "size-3.5 bottom-1 right-1",
  "2xl": "size-4 bottom-1.5 right-1.5",
  "3xl": "size-5 bottom-2 right-2",
}

// Preset Gradients
export const AVATAR_GRADIENTS = [
  { id: "blue-cyan", name: "Ocean Wave", class: "bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 text-white" },
  { id: "purple-pink", name: "Sunset Violet", class: "bg-gradient-to-tr from-purple-600 via-pink-500 to-rose-400 text-white" },
  { id: "emerald-teal", name: "Forest Mint", class: "bg-gradient-to-tr from-emerald-600 via-teal-500 to-lime-300 text-white" },
  { id: "amber-orange", name: "Solar Flare", class: "bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-300 text-white" },
  { id: "crimson-rose", name: "Ruby Flame", class: "bg-gradient-to-tr from-rose-700 via-red-500 to-pink-400 text-white" },
  { id: "indigo-violet", name: "Deep Space", class: "bg-gradient-to-tr from-slate-900 via-indigo-800 to-purple-600 text-white" },
  { id: "cyan-blue", name: "Electric Aqua", class: "bg-gradient-to-tr from-cyan-600 via-sky-500 to-blue-400 text-white" },
  { id: "fuchsia-purple", name: "Neon Galaxy", class: "bg-gradient-to-tr from-fuchsia-600 via-purple-600 to-indigo-500 text-white" },
  { id: "lime-emerald", name: "Fresh Spring", class: "bg-gradient-to-tr from-lime-600 via-emerald-500 to-teal-400 text-white" },
  { id: "gold-amber", name: "Golden Aura", class: "bg-gradient-to-tr from-yellow-600 via-amber-500 to-orange-400 text-white" },
  { id: "slate-zinc", name: "Stealth Titanium", class: "bg-gradient-to-tr from-zinc-800 via-slate-700 to-zinc-600 text-white" },
  { id: "primary-default", name: "MES Primary", class: "bg-primary text-primary-foreground" },
]

// Preset 3D Emojis
export const AVATAR_EMOJIS = [
  "👨‍💼", "👩‍💼", "👨‍💻", "👩‍💻", "🧑‍🚀", "🦁", "⚡", "🚀", "💎", "⭐", "🛡️", "🔥"
]

export function UserAvatar({
  src,
  name,
  emoji,
  gradient,
  size = "md",
  isOnline,
  className,
  alt,
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false)

  const initials = (() => {
    if (!name) return "AN"
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  })()

  // Find gradient class or fallback to primary
  const gradientClass = (() => {
    if (!gradient) return "bg-primary text-primary-foreground"
    const match = AVATAR_GRADIENTS.find((g) => g.id === gradient || g.class === gradient)
    return match ? match.class : gradient
  })()

  const hasValidImage = src && !imgError

  return (
    <div className={cn("relative shrink-0 select-none", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-bold overflow-hidden transition-all duration-200 shadow-2xs border border-border/40",
          SIZE_MAP[size],
          hasValidImage ? "bg-muted" : gradientClass
        )}
      >
        {hasValidImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt || name || "User Avatar"}
            onError={() => setImgError(true)}
            className="size-full object-cover"
          />
        ) : emoji ? (
          <span className="leading-none drop-shadow-xs">{emoji}</span>
        ) : (
          <span className="leading-none tracking-tight font-semibold">{initials}</span>
        )}
      </div>

      {isOnline !== undefined && (
        <span
          className={cn(
            "absolute rounded-full border-2 border-background ring-1 ring-background shadow-xs",
            DOT_SIZE_MAP[size],
            isOnline ? "bg-emerald-500" : "bg-muted-foreground/50"
          )}
          title={isOnline ? "Đang trực tuyến" : "Ngoại tuyến"}
        />
      )}
    </div>
  )
}
