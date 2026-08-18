import { useEffect, useState } from 'react'
import { signalRService } from '@/lib/signalr'
import type { ConversationResponse, MessageResponse } from '@/types/chat'

export function useSignalR(conversationId?: string | null) {
  const [isConnected, setIsConnected] = useState(false)
  const [incomingMessage, setIncomingMessage] = useState<MessageResponse | null>(null)
  const [incomingConversation, setIncomingConversation] = useState<ConversationResponse | null>(null)
  const [deletedConversationId, setDeletedConversationId] = useState<string | null>(null)

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

    connection.on('ReceiveNewMessage', handleMessage)
    connection.on('ReceiveMessage', handleMessage)
    connection.on('ReceiveNewConversation', handleNewConversation)
    connection.on('ReceiveConversationDeleted', handleConversationDeleted)

    return () => {
      connection.off('ReceiveNewMessage', handleMessage)
      connection.off('ReceiveMessage', handleMessage)
      connection.off('ReceiveNewConversation', handleNewConversation)
      connection.off('ReceiveConversationDeleted', handleConversationDeleted)
    }
  }, [conversationId])

  return { isConnected, incomingMessage, incomingConversation, deletedConversationId }
}
