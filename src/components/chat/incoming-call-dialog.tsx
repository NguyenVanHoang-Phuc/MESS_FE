'use client'

import React, { useEffect } from 'react'
import { Phone, PhoneOff, Video } from 'lucide-react'
import { cn } from '@/utils/cn'
import { getInitials } from '@/utils/formatters'
import { playIncomingRingtone, stopCallAudio } from '@/utils/sound'
import type { IncomingCallEvent } from '@/types/chat'

export interface IncomingCallDialogProps {
  call: IncomingCallEvent | null
  onAccept: (call: IncomingCallEvent) => void
  onReject: (call: IncomingCallEvent) => void
}

export function IncomingCallDialog({ call, onAccept, onReject }: IncomingCallDialogProps) {
  useEffect(() => {
    if (call) {
      playIncomingRingtone()
    } else {
      stopCallAudio()
    }
    return () => {
      stopCallAudio()
    }
  }, [call])

  if (!call) return null

  const initials = getInitials(call.callerName || 'Người gọi')

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xs rounded-3xl border border-white/10 bg-neutral-900/90 p-6 text-center shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200 text-white">
        {/* Pulsing Avatar Area */}
        <div className="relative mx-auto mb-4 flex size-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
          <div className="absolute -inset-2 rounded-full bg-emerald-500/10 animate-pulse" />
          <div className="relative flex size-20 items-center justify-center rounded-full bg-linear-to-tr from-primary to-orange-500 text-2xl font-bold text-white shadow-lg">
            {initials}
          </div>
          <div className="absolute bottom-1 right-1 flex size-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md border-2 border-neutral-900">
            {call.isVideo ? <Video className="size-3.5" /> : <Phone className="size-3.5" />}
          </div>
        </div>

        {/* Caller Info */}
        <h3 className="text-lg font-bold text-white tracking-tight truncate px-2">
          {call.callerName || 'Thành viên'}
        </h3>
        <p className="mt-1 text-xs text-neutral-400 font-medium">
          {call.isVideo ? 'Đang gọi video cho bạn...' : 'Đang gọi thoại cho bạn...'}
        </p>

        {/* Action Buttons */}
        <div className="mt-7 flex items-center justify-center gap-6">
          {/* Reject button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                stopCallAudio()
                onReject(call)
              }}
              className="flex size-14 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg hover:bg-rose-600 active:scale-95 transition-all duration-150 cursor-pointer"
              title="Từ chối"
              aria-label="Từ chối cuộc gọi"
            >
              <PhoneOff className="size-6" />
            </button>
            <span className="text-[11px] text-neutral-400 font-medium">Từ chối</span>
          </div>

          {/* Accept button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                stopCallAudio()
                onAccept(call)
              }}
              className="flex size-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 active:scale-95 transition-all duration-150 cursor-pointer animate-bounce"
              title="Trả lời"
              aria-label="Trả lời cuộc gọi"
            >
              {call.isVideo ? <Video className="size-6" /> : <Phone className="size-6" />}
            </button>
            <span className="text-[11px] text-emerald-400 font-semibold">Trả lời</span>
          </div>
        </div>
      </div>
    </div>
  )
}
