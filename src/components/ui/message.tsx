import React from 'react'
import { cn } from '@/utils/cn'

// ─── MessageGroup ─────────────────────────────────────────────────────────────
// Wraps a sequence of messages (e.g. from the same conversation turn)
interface MessageGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const MessageGroup = React.forwardRef<HTMLDivElement, MessageGroupProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1', className)} {...props} />
  )
)
MessageGroup.displayName = 'MessageGroup'

// ─── Message ──────────────────────────────────────────────────────────────────
// A single message row; align="start" (assistant) | "end" (user)
interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end'
}

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ className, align = 'start', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex w-full items-end gap-2',
        align === 'end' && 'flex-row-reverse',
        className
      )}
      {...props}
    />
  )
)
Message.displayName = 'Message'

// ─── MessageAvatar ────────────────────────────────────────────────────────────
// Small avatar circle shown next to each message
interface MessageAvatarProps extends React.HTMLAttributes<HTMLDivElement> {}

const MessageAvatar = React.forwardRef<HTMLDivElement, MessageAvatarProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        '[&_svg]:size-4',
        className
      )}
      {...props}
    />
  )
)
MessageAvatar.displayName = 'MessageAvatar'

// ─── MessageContent ───────────────────────────────────────────────────────────
// The bubble wrapper around the message text
interface MessageContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const MessageContent = React.forwardRef<HTMLDivElement, MessageContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-sm', className)}
      {...props}
    />
  )
)
MessageContent.displayName = 'MessageContent'

export { Message, MessageAvatar, MessageContent, MessageGroup }
