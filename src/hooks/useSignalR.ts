import { useEffect, useState } from 'react'
import { signalRService } from '@/lib/signalr'
import type { ConversationResponse, MessageRecalledEvent, MessageReactionEvent, MessageResponse, MessagesReadEvent } from '@/types/chat'

export function useSignalR(conversationId?: string | null) {
  const [isConnected, setIsConnected] = useState(false)
  const [incomingMessage, setIncomingMessage] = useState<MessageResponse | null>(null)
  const [incomingConversation, setIncomingConversation] = useState<ConversationResponse | null>(null)
  const [deletedConversationId, setDeletedConversationId] = useState<string | null>(null)
  const [readEvent, setReadEvent] = useState<MessagesReadEvent | null>(null)
  const [recalledEvent, setRecalledEvent] = useState<MessageRecalledEvent | null>(null)
  const [reactionEvent, setReactionEvent] = useState<MessageReactionEvent | null>(null)

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
      if (!conversationId || message.conversationId === conversationId) {
        setIncomingMessage(message)
      }
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
      if (!conversationId || normalized.conversationId === conversationId) {
        setReadEvent(normalized)
      }
    }

    const handleMessageRecalled = (eventData: any) => {
      console.log('SignalR: Received message recalled event:', eventData)
      const normalized: MessageRecalledEvent = {
        conversationId: eventData.conversationId || eventData.ConversationId,
        messageId: eventData.messageId || eventData.MessageId,
      }
      if (!conversationId || normalized.conversationId === conversationId) {
        setRecalledEvent(normalized)
      }
    }

    const handleMessageReaction = (eventData: any) => {
      console.log('SignalR: Received message reaction event:', eventData)
      const normalized: MessageReactionEvent = {
        conversationId: eventData.conversationId || eventData.ConversationId,
        messageId: eventData.messageId || eventData.MessageId,
        reactions: eventData.reactions || eventData.Reactions || [],
      }
      if (!conversationId || normalized.conversationId === conversationId) {
        setReactionEvent(normalized)
      }
    }

    connection.on('ReceiveNewMessage', handleMessage)
    connection.on('ReceiveMessage', handleMessage)
    connection.on('ReceiveNewConversation', handleNewConversation)
    connection.on('ReceiveConversationDeleted', handleConversationDeleted)
    connection.on('ReceiveMessagesRead', handleMessagesRead)
    connection.on('ReceiveMessageRecalled', handleMessageRecalled)
    connection.on('ReceiveMessageReaction', handleMessageReaction)

    return () => {
      connection.off('ReceiveNewMessage', handleMessage)
      connection.off('ReceiveMessage', handleMessage)
      connection.off('ReceiveNewConversation', handleNewConversation)
      connection.off('ReceiveConversationDeleted', handleConversationDeleted)
      connection.off('ReceiveMessagesRead', handleMessagesRead)
      connection.off('ReceiveMessageRecalled', handleMessageRecalled)
      connection.off('ReceiveMessageReaction', handleMessageReaction)
    }
  }, [conversationId])

  return { isConnected, incomingMessage, incomingConversation, deletedConversationId, readEvent, recalledEvent, reactionEvent }
}
