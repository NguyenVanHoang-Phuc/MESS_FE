'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  MonitorUp,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { getInitials } from '@/utils/formatters'
import { playOutgoingDialTone, stopCallAudio } from '@/utils/sound'
import type {
  CallAcceptedEvent,
  ReceiveSignalEvent,
} from '@/types/chat'

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
}

export interface VideoCallModalProps {
  isOpen: boolean
  conversationId: string
  conversationTitle?: string
  isVideo: boolean
  isCaller: boolean
  currentUserId?: string
  currentUserName?: string
  callAcceptedEvent: CallAcceptedEvent | null
  callRejectedEvent: any
  callEndedEvent: any
  receiveSignalEvent: ReceiveSignalEvent | null
  sendSignal: (convId: string, signalData: any) => void
  onEndCall: (duration: number) => void
}

export function VideoCallModal({
  isOpen,
  conversationId,
  conversationTitle,
  isVideo: initialIsVideo,
  isCaller,
  currentUserName,
  callAcceptedEvent,
  callRejectedEvent,
  callEndedEvent,
  receiveSignalEvent,
  sendSignal,
  onEndCall,
}: VideoCallModalProps) {
  const [callStatus, setCallStatus] = useState<'calling' | 'connected' | 'ended'>('calling')
  const [isMicOn, setIsMicOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(initialIsVideo)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const callDurationRef = useRef(0)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([])
  const durationTimerRef = useRef<any>(null)

  // Stable callbacks via refs to prevent useEffect re-executions
  const sendSignalRef = useRef(sendSignal)
  sendSignalRef.current = sendSignal
  const onEndCallRef = useRef(onEndCall)
  onEndCallRef.current = onEndCall

  // Stale event snapshots
  const lastHandledEndRef = useRef<any>(null)
  const lastHandledRejectRef = useRef<any>(null)
  const lastHandledAcceptRef = useRef<any>(null)

  // ── Format Duration (MM:SS) ──────────────────────────────────
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // ── Attach All Tracks from Stream to PeerConnection ───────────────────────
  const ensureTracksOnPeerConnection = useCallback((pc: RTCPeerConnection, stream: MediaStream) => {
    const senders = pc.getSenders()
    stream.getTracks().forEach((track) => {
      const existingSender = senders.find((s) => s.track === track || (s.track && s.track.kind === track.kind))
      if (existingSender) {
        if (existingSender.track !== track) {
          existingSender.replaceTrack(track).catch((err) => console.warn('[WebRTC] replaceTrack error:', err))
        }
      } else {
        try {
          pc.addTrack(track, stream)
        } catch (err) {
          console.warn('[WebRTC] addTrack error:', err)
        }
      }
    })
  }, [])

  // ── Flush Queued ICE Candidates ──────────────────────────────────────────
  const flushPendingCandidates = useCallback(async (pc: RTCPeerConnection) => {
    while (pendingCandidatesRef.current.length > 0) {
      const cand = pendingCandidatesRef.current.shift()
      if (cand) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand))
        } catch (e) {
          console.warn('[WebRTC] Error adding flushed ICE candidate:', e)
        }
      }
    }
  }, [])

  // ── Start Local Media Stream ─────────────────────────────────────────────
  const initLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: initialIsVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
        audio: true,
      })
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      if (peerConnectionRef.current) {
        ensureTracksOnPeerConnection(peerConnectionRef.current, stream)
      }
      return stream
    } catch (err) {
      console.warn('[WebRTC] Could not access camera, attempting audio only:', err)
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        localStreamRef.current = audioStream
        setIsVideoOn(false)
        if (peerConnectionRef.current) {
          ensureTracksOnPeerConnection(peerConnectionRef.current, audioStream)
        }
        return audioStream
      } catch (audioErr) {
        console.error('[WebRTC] Could not access audio device:', audioErr)
        return null
      }
    }
  }, [initialIsVideo, ensureTracksOnPeerConnection])

  // ── Setup WebRTC PeerConnection ──────────────────────────────────────────
  const getOrCreatePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      if (localStreamRef.current) {
        ensureTracksOnPeerConnection(peerConnectionRef.current, localStreamRef.current)
      }
      return peerConnectionRef.current
    }

    const pc = new RTCPeerConnection(RTC_CONFIG)
    peerConnectionRef.current = pc

    if (localStreamRef.current) {
      ensureTracksOnPeerConnection(pc, localStreamRef.current)
    }

    pc.ontrack = (event) => {
      console.log('[WebRTC] ontrack received:', event.track.kind, event.streams)
      const stream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track])
      setRemoteStream(stream)
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream
        remoteVideoRef.current.play().catch(() => {})
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalRef.current(conversationId, {
          type: 'candidate',
          candidate: event.candidate,
        })
      }
    }

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState)
      if (pc.connectionState === 'connected') {
        setCallStatus('connected')
        stopCallAudio()
      }
    }

    return pc
  }, [conversationId, ensureTracksOnPeerConnection])

  // ── Ensure Remote Video Element is populated with stream ──────────────────
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
      remoteVideoRef.current.play().catch(() => {})
    }
  }, [remoteStream, isMinimized])

  // ── Lifecycle: Initiate Call on Modal Mount ──────────────────────────────
  useEffect(() => {
    if (!isOpen) return

    lastHandledEndRef.current = callEndedEvent
    lastHandledRejectRef.current = callRejectedEvent
    lastHandledAcceptRef.current = callAcceptedEvent

    let isCancelled = false
    setCallDuration(0)
    callDurationRef.current = 0
    setRemoteStream(null)
    pendingCandidatesRef.current = []

    async function start() {
      const stream = await initLocalStream()
      if (isCancelled || !stream) return

      if (isCaller) {
        playOutgoingDialTone()
        setCallStatus('calling')
      } else {
        setCallStatus('connected')
        stopCallAudio()
        getOrCreatePeerConnection()
      }
    }

    start()

    return () => {
      isCancelled = true
      stopCallAudio()
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop())
        localStreamRef.current = null
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop())
        screenStreamRef.current = null
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current)
      }
      pendingCandidatesRef.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // ── Caller: Receiver accepted the call ───────────────────────────────────
  useEffect(() => {
    if (!isOpen || !isCaller || !callAcceptedEvent) return
    if (callAcceptedEvent === lastHandledAcceptRef.current) return
    if (callAcceptedEvent.conversationId !== conversationId) return

    lastHandledAcceptRef.current = callAcceptedEvent
    stopCallAudio()
    setCallStatus('connected')

    async function createOffer() {
      const stream = localStreamRef.current || (await initLocalStream())
      const pc = getOrCreatePeerConnection()
      if (stream) {
        ensureTracksOnPeerConnection(pc, stream)
      }

      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        })
        await pc.setLocalDescription(offer)
        sendSignalRef.current(conversationId, {
          type: 'offer',
          sdp: pc.localDescription,
        })
      } catch (err) {
        console.error('[WebRTC] Failed to create offer:', err)
      }
    }

    createOffer()
  }, [isOpen, isCaller, callAcceptedEvent, conversationId, getOrCreatePeerConnection, initLocalStream, ensureTracksOnPeerConnection])

  // ── Handle Incoming Signals (Offer / Answer / Candidate) ─────────────────
  useEffect(() => {
    if (!isOpen || !receiveSignalEvent) return
    if (receiveSignalEvent.conversationId !== conversationId) return

    const { signalData } = receiveSignalEvent
    if (!signalData) return

    async function handleSignal() {
      const pc = getOrCreatePeerConnection()

      if (signalData.type === 'offer' && signalData.sdp) {
        try {
          const stream = localStreamRef.current || (await initLocalStream())
          if (stream) {
            ensureTracksOnPeerConnection(pc, stream)
          }

          await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp))
          await flushPendingCandidates(pc)

          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          sendSignalRef.current(conversationId, {
            type: 'answer',
            sdp: pc.localDescription,
          })
          setCallStatus('connected')
          stopCallAudio()
        } catch (err) {
          console.error('[WebRTC] Failed to handle offer:', err)
        }
      } else if (signalData.type === 'answer' && signalData.sdp) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp))
          await flushPendingCandidates(pc)
        } catch (err) {
          console.error('[WebRTC] Failed to handle answer:', err)
        }
      } else if (signalData.type === 'candidate') {
        if (signalData.candidate) {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate))
            } catch (err) {
              console.warn('[WebRTC] Failed to add ICE candidate:', err)
            }
          } else {
            pendingCandidatesRef.current.push(signalData.candidate)
          }
        }
      }
    }

    handleSignal()
  }, [isOpen, receiveSignalEvent, conversationId, getOrCreatePeerConnection, initLocalStream, ensureTracksOnPeerConnection, flushPendingCandidates])

  // ── Handle Call Rejected / Ended Events ──────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    if (callRejectedEvent && callRejectedEvent !== lastHandledRejectRef.current && callRejectedEvent.conversationId === conversationId) {
      lastHandledRejectRef.current = callRejectedEvent
      stopCallAudio()
      setCallStatus('ended')
      setTimeout(() => onEndCallRef.current(0), 1200)
    }
    if (callEndedEvent && callEndedEvent !== lastHandledEndRef.current && callEndedEvent.conversationId === conversationId) {
      lastHandledEndRef.current = callEndedEvent
      stopCallAudio()
      setCallStatus('ended')
      setTimeout(() => onEndCallRef.current(callDurationRef.current), 800)
    }
  }, [isOpen, callRejectedEvent, callEndedEvent, conversationId])

  // ── Call Duration Timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (callStatus === 'connected') {
      durationTimerRef.current = setInterval(() => {
        setCallDuration((d) => {
          const next = d + 1
          callDurationRef.current = next
          return next
        })
      }, 1000)
    } else {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current)
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current)
    }
  }, [callStatus])

  // ── Toggle Microphone ────────────────────────────────────────────────────
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMicOn(audioTrack.enabled)
      }
    }
  }

  // ── Toggle Camera ────────────────────────────────────────────────────────
  const toggleVideo = async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOn(videoTrack.enabled)
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          })
          const newVideoTrack = stream.getVideoTracks()[0]
          localStreamRef.current.addTrack(newVideoTrack)
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current
          }
          if (peerConnectionRef.current) {
            const pc = peerConnectionRef.current
            const senders = pc.getSenders()
            const videoSender = senders.find((s) => s.track?.kind === 'video')
            if (videoSender) {
              await videoSender.replaceTrack(newVideoTrack)
            } else {
              pc.addTrack(newVideoTrack, localStreamRef.current)
              const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
              await pc.setLocalDescription(offer)
              sendSignalRef.current(conversationId, { type: 'offer', sdp: pc.localDescription })
            }
          }
          setIsVideoOn(true)
        } catch (err) {
          console.error('[WebRTC] Could not activate camera:', err)
        }
      }
    }
  }

  // ── Toggle Speaker (Mute Remote Audio) ───────────────────────────────────
  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = isSpeakerOn
      setIsSpeakerOn(!isSpeakerOn)
    }
  }

  // ── Screen Sharing ───────────────────────────────────────────────────────
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare()
      return
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      })
      screenStreamRef.current = screenStream

      const screenTrack = screenStream.getVideoTracks()[0]

      if (peerConnectionRef.current) {
        const senders = peerConnectionRef.current.getSenders()
        const videoSender = senders.find((s) => s.track?.kind === 'video')
        if (videoSender) {
          videoSender.replaceTrack(screenTrack)
        }
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream
      }

      screenTrack.onended = () => {
        stopScreenShare()
      }

      setIsScreenSharing(true)
    } catch (err) {
      console.warn('Screen share cancelled or failed:', err)
    }
  }

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop())
      screenStreamRef.current = null
    }

    if (localStreamRef.current && peerConnectionRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      const senders = peerConnectionRef.current.getSenders()
      const videoSender = senders.find((s) => s.track?.kind === 'video')
      if (videoSender && videoTrack) {
        videoSender.replaceTrack(videoTrack)
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current
      }
    }
    setIsScreenSharing(false)
  }

  // ── End Call Handler ─────────────────────────────────────────────────────
  const handleHangup = () => {
    stopCallAudio()
    onEndCall(callDurationRef.current)
  }

  if (!isOpen) return null

  // ── Minimized Floating Picture-in-Picture View ────────────────────────────
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-[100] w-72 rounded-2xl border border-white/20 bg-neutral-900/95 shadow-2xl backdrop-blur-md overflow-hidden animate-in slide-in-from-bottom-5 text-white">
        <div className="relative aspect-video bg-black flex items-center justify-center">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="size-full object-cover"
          />
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 text-[10px] text-white font-medium">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {formatDuration(callDuration)}
          </div>
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="absolute top-2 right-2 size-6 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition cursor-pointer"
            title="Mở rộng toàn màn hình"
          >
            <Maximize2 className="size-3" />
          </button>
        </div>

        <div className="flex items-center justify-between px-3 py-2 bg-neutral-900 border-t border-white/10">
          <span className="text-xs font-semibold text-white truncate max-w-[120px]">
            {conversationTitle || 'Cuộc gọi'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMic}
              className={cn(
                'size-7 flex items-center justify-center rounded-full transition cursor-pointer',
                isMicOn ? 'bg-white/10 text-white' : 'bg-rose-500/20 text-rose-400'
              )}
            >
              {isMicOn ? <Mic className="size-3.5" /> : <MicOff className="size-3.5" />}
            </button>
            <button
              type="button"
              onClick={handleHangup}
              className="size-7 flex items-center justify-center rounded-full bg-rose-500 text-white hover:bg-rose-600 transition cursor-pointer"
              title="Gác máy"
            >
              <PhoneOff className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main Full Call Dialog View ───────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative flex flex-col w-full max-w-4xl h-[85vh] max-h-[720px] rounded-3xl border border-white/10 bg-neutral-950 shadow-2xl overflow-hidden text-white">
        {/* Call Top Bar */}
        <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 bg-linear-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white border border-white/15 backdrop-blur-md">
              {getInitials(conversationTitle || currentUserName || 'Cuộc gọi')}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                {conversationTitle || 'Cuộc gọi trực tuyến'}
              </h3>
              <p className="text-xs text-neutral-400 flex items-center gap-1.5">
                {callStatus === 'calling' ? (
                  <span className="text-amber-400 font-medium animate-pulse">Đang kết nối...</span>
                ) : callStatus === 'ended' ? (
                  <span className="text-rose-400 font-medium">Cuộc gọi đã kết thúc</span>
                ) : (
                  <>
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{formatDuration(callDuration)}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer border border-white/10"
            title="Thu nhỏ cửa sổ"
          >
            <Minimize2 className="size-4" />
          </button>
        </div>

        {/* Video Display Area */}
        <div className="relative flex-1 bg-neutral-900 overflow-hidden flex items-center justify-center">
          {/* Remote Video (Main) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={cn(
              'size-full object-cover transition-opacity duration-300',
              callStatus === 'connected' ? 'opacity-100' : 'opacity-0'
            )}
          />

          {/* Placeholder when calling or audio only */}
          {(!remoteStream || callStatus !== 'connected') && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-6 animate-in zoom-in-95 pointer-events-none bg-neutral-900/90">
              <div className="relative flex size-28 items-center justify-center rounded-full bg-linear-to-tr from-primary to-orange-500 text-3xl font-bold text-white shadow-2xl">
                {getInitials(conversationTitle || 'User')}
                {callStatus === 'calling' && (
                  <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" />
                )}
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">
                  {conversationTitle || 'Đang gọi...'}
                </h4>
                <p className="text-xs text-neutral-400 mt-1">
                  {callStatus === 'calling' ? 'Đang đổ chuông tới người nhận...' : 'Đang kết nối video...'}
                </p>
              </div>
            </div>
          )}

          {/* Local Video Stream (Floating PiP) */}
          <div className="absolute bottom-20 right-4 z-20 w-36 sm:w-44 aspect-video rounded-2xl border-2 border-white/20 bg-black/80 shadow-2xl overflow-hidden backdrop-blur-xs">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                'size-full object-cover scale-x-[-1]',
                isVideoOn ? 'block' : 'hidden'
              )}
            />
            {!isVideoOn && (
              <div className="flex size-full flex-col items-center justify-center bg-neutral-800 text-[11px] text-neutral-400 font-medium">
                <VideoOff className="size-4 mb-1 text-neutral-500" />
                <span>Camera tắt</span>
              </div>
            )}
            <div className="absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-[9px] text-white/80 font-medium">
              Bạn
            </div>
          </div>
        </div>

        {/* Bottom Call Action Controls */}
        <div className="z-30 flex items-center justify-center gap-3 sm:gap-4 p-4 bg-linear-to-t from-black/90 via-black/70 to-transparent">
          {/* Toggle Mic */}
          <button
            type="button"
            onClick={toggleMic}
            className={cn(
              'flex size-12 items-center justify-center rounded-full shadow-lg transition-all active:scale-95 cursor-pointer',
              isMicOn
                ? 'bg-white/15 text-white hover:bg-white/25 border border-white/10'
                : 'bg-rose-500 text-white hover:bg-rose-600'
            )}
            title={isMicOn ? 'Tắt Micro' : 'Bật Micro'}
          >
            {isMicOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
          </button>

          {/* Toggle Camera */}
          <button
            type="button"
            onClick={toggleVideo}
            className={cn(
              'flex size-12 items-center justify-center rounded-full shadow-lg transition-all active:scale-95 cursor-pointer',
              isVideoOn
                ? 'bg-white/15 text-white hover:bg-white/25 border border-white/10'
                : 'bg-rose-500 text-white hover:bg-rose-600'
            )}
            title={isVideoOn ? 'Tắt Camera' : 'Bật Camera'}
          >
            {isVideoOn ? <VideoIcon className="size-5" /> : <VideoOff className="size-5" />}
          </button>

          {/* Screen Share */}
          <button
            type="button"
            onClick={toggleScreenShare}
            className={cn(
              'flex size-12 items-center justify-center rounded-full shadow-lg transition-all active:scale-95 cursor-pointer hidden sm:flex',
              isScreenSharing
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-white/15 text-white hover:bg-white/25 border border-white/10'
            )}
            title={isScreenSharing ? 'Dừng chia sẻ màn hình' : 'Chia sẻ màn hình'}
          >
            <MonitorUp className="size-5" />
          </button>

          {/* Speaker Mute/Unmute */}
          <button
            type="button"
            onClick={toggleSpeaker}
            className={cn(
              'flex size-12 items-center justify-center rounded-full shadow-lg transition-all active:scale-95 cursor-pointer',
              isSpeakerOn
                ? 'bg-white/15 text-white hover:bg-white/25 border border-white/10'
                : 'bg-rose-500 text-white hover:bg-rose-600'
            )}
            title={isSpeakerOn ? 'Tắt loa ngoài' : 'Bật loa ngoài'}
          >
            {isSpeakerOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
          </button>

          {/* End Call / Hang up */}
          <button
            type="button"
            onClick={handleHangup}
            className="flex size-12 items-center justify-center rounded-full bg-rose-600 text-white shadow-xl hover:bg-rose-700 active:scale-95 transition-all cursor-pointer"
            title="Kết thúc cuộc gọi"
          >
            <PhoneOff className="size-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
