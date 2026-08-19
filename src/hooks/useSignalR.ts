import { useEffect, useState, useCallback } from 'react'
import { signalRService } from '@/lib/signalr'
import type { ConversationResponse, MessageRecalledEvent, MessageReactionEvent, MessageResponse, MessagesReadEvent, UserTypingEvent } from '@/types/chat'

export function useSignalR(conversationId?: string | null) {
  const [isConnected, setIsConnected] = useState(false)
  const [incomingMessage, setIncomingMessage] = useState<MessageResponse | null>(null)
  const [incomingConversation, setIncomingConversation] = useState<ConversationResponse | null>(null)
  const [deletedConversationId, setDeletedConversationId] = useState<string | null>(null)
  const [readEvent, setReadEvent] = useState<MessagesReadEvent | null>(null)
  const [recalledEvent, setRecalledEvent] = useState<MessageRecalledEvent | null>(null)
  const [reactionEvent, setReactionEvent] = useState<MessageReactionEvent | null>(null)
  const [typingEvent, setTypingEvent] = useState<UserTypingEvent | null>(null)

  useEffect(() => {
    const connection = signalRService.getConnection()

    const startConnection = async () => {
      try {
        if (connection.state === 'Disconnected') {
          await connection.start()
          setIsConnected(true)
          console.log('SignalR Connected.')
        } else if (connection.state === 'Connected') {
          setIsConnected(true)
        }
      } catch (err) {
        console.warn('SignalR connection error (server might be offline or reconnecting):', err)
      }
    }

    startConnection()

    const handleMessage = (message: MessageResponse) => {
      setIncomingMessage(message)
    }

    const handleNewConversation = (conversation: ConversationResponse) => {
      console.log('SignalR: Received new conversation invite:', conversation)
      setIncomingConversation(conversation)
    }

    const handleConversationDeleted = (convId: string) => {
      console.log('SignalR: Received conversation deleted notification:', convId)
      setDeletedConversationId(convId)
    }

    const handleMessagesRead = (eventData: any) => {
      console.log('SignalR: Received messages read event:', eventData)
      const normalized: MessagesReadEvent = {
        conversationId: eventData.conversationId || eventData.ConversationId,
        readerId: eventData.readerId || eventData.ReaderId,
        readerName: eventData.readerName || eventData.ReaderName,
        messageIds: eventData.messageIds || eventData.MessageIds || [],
        readAt: eventData.readAt || eventData.ReadAt || new Date().toISOString(),
      }
      setReadEvent(normalized)
    }

    const handleMessageRecalled = (eventData: any) => {
      console.log('SignalR: Received message recalled event:', eventData)
      const normalized: MessageRecalledEvent = {
        conversationId: eventData.conversationId || eventData.ConversationId,
        messageId: eventData.messageId || eventData.MessageId,
      }
      setRecalledEvent(normalized)
    }

    const handleMessageReaction = (eventData: any) => {
      console.log('SignalR: Received message reaction event:', eventData)
      const normalized: MessageReactionEvent = {
        conversationId: eventData.conversationId || eventData.ConversationId,
        messageId: eventData.messageId || eventData.MessageId,
        reactions: eventData.reactions || eventData.Reactions || [],
      }
      setReactionEvent(normalized)
    }

    const handleUserTyping = (eventData: any) => {
      const normalized: UserTypingEvent = {
        conversationId: eventData.conversationId || eventData.ConversationId,
        userId: eventData.userId || eventData.UserId,
        userName: eventData.userName || eventData.UserName,
        isTyping: eventData.isTyping ?? eventData.IsTyping ?? false,
      }
      setTypingEvent(normalized)
    }

    connection.on('ReceiveNewMessage', handleMessage)
    connection.on('ReceiveMessage', handleMessage)
    connection.on('ReceiveNewConversation', handleNewConversation)
    connection.on('ReceiveConversationDeleted', handleConversationDeleted)
    connection.on('ReceiveMessagesRead', handleMessagesRead)
    connection.on('ReceiveMessageRecalled', handleMessageRecalled)
    connection.on('ReceiveMessageReaction', handleMessageReaction)
    connection.on('ReceiveUserTyping', handleUserTyping)

    return () => {
      connection.off('ReceiveNewMessage', handleMessage)
      connection.off('ReceiveMessage', handleMessage)
      connection.off('ReceiveNewConversation', handleNewConversation)
      connection.off('ReceiveConversationDeleted', handleConversationDeleted)
      connection.off('ReceiveMessagesRead', handleMessagesRead)
      connection.off('ReceiveMessageRecalled', handleMessageRecalled)
      connection.off('ReceiveMessageReaction', handleMessageReaction)
      connection.off('ReceiveUserTyping', handleUserTyping)
    }
  }, [conversationId])

  // Join / Leave conversation group when connection is active
  useEffect(() => {
    const connection = signalRService.getConnection()
    if (isConnected && conversationId && connection.state === 'Connected') {
      connection.invoke('JoinConversation', conversationId).catch(() => {})
    }
    return () => {
      if (conversationId && connection.state === 'Connected') {
        connection.invoke('LeaveConversation', conversationId).catch(() => {})
      }
    }
  }, [isConnected, conversationId])

  const sendTyping = useCallback(
    (isTyping: boolean, userName?: string) => {
      if (!conversationId) return
      try {
        const connection = signalRService.getConnection()
        if (connection.state === 'Connected') {
          connection.invoke('SendTyping', conversationId, userName || 'Người dùng', isTyping).catch(() => {})
        }
      } catch (err) {
        console.warn('Failed to send typing status:', err)
      }
    },
    [conversationId]
  )

  return { isConnected, incomingMessage, incomingConversation, deletedConversationId, readEvent, recalledEvent, reactionEvent, typingEvent, sendTyping }
}
