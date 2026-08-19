'use client'

import React, { createContext, useContext, useEffect, useRef } from 'react'
import { cn } from '@/utils/cn'

// ─── Context ──────────────────────────────────────────────────────────────────
interface MessageScrollerContextValue {
  viewportRef: React.RefObject<HTMLDivElement | null>
  scrollToBottom: () => void
}

const MessageScrollerContext = createContext<MessageScrollerContextValue | null>(null)

function useMessageScroller() {
  const ctx = useContext(MessageScrollerContext)
  if (!ctx) throw new Error('useMessageScroller must be used inside MessageScrollerProvider')
  return ctx
}

// ─── MessageScrollerProvider ──────────────────────────────────────────────────
// Provides scroll context and auto-scrolls to bottom when content changes
interface MessageScrollerProviderProps {
  children: React.ReactNode
}

function MessageScrollerProvider({ children }: MessageScrollerProviderProps) {
  const viewportRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    const el = viewportRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

  return (
    <MessageScrollerContext.Provider value={{ viewportRef, scrollToBottom }}>
      {children}
    </MessageScrollerContext.Provider>
  )
}

// ─── MessageScroller ──────────────────────────────────────────────────────────
// The outer flex container that fills available space
interface MessageScrollerProps extends React.HTMLAttributes<HTMLDivElement> {}

const MessageScroller = React.forwardRef<HTMLDivElement, MessageScrollerProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-1 flex-col overflow-hidden', className)}
      {...props}
    />
  )
)
MessageScroller.displayName = 'MessageScroller'

// ─── MessageScrollerViewport ──────────────────────────────────────────────────
// The actual scrollable area; auto-scrolls to bottom when content changes
interface MessageScrollerViewportProps extends React.HTMLAttributes<HTMLDivElement> {}

const MessageScrollerViewport = React.forwardRef<HTMLDivElement, MessageScrollerViewportProps>(
  ({ className, children, ...props }, ref) => {
    const { viewportRef } = useMessageScroller()

    return (
      <div
        ref={(node) => {
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref && 'current' in ref) {
            ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
          }
          if (viewportRef && 'current' in viewportRef) {
            ;(viewportRef as React.MutableRefObject<HTMLDivElement | null>).current = node
          }
        }}
        className={cn('flex-1 overflow-y-auto', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
MessageScrollerViewport.displayName = 'MessageScrollerViewport'

// ─── MessageScrollerContent ───────────────────────────────────────────────────
// Centres and constrains the message list width
interface MessageScrollerContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const MessageScrollerContent = React.forwardRef<HTMLDivElement, MessageScrollerContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col', className)} {...props} />
  )
)
MessageScrollerContent.displayName = 'MessageScrollerContent'

// ─── MessageScrollerItem ──────────────────────────────────────────────────────
// A single scrollable entry
interface MessageScrollerItemProps extends React.HTMLAttributes<HTMLDivElement> {}

const MessageScrollerItem = React.forwardRef<HTMLDivElement, MessageScrollerItemProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col', className)} {...props} />
  )
)
MessageScrollerItem.displayName = 'MessageScrollerItem'

export {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
}
