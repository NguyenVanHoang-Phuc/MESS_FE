import { useEffect, useState, useCallback } from 'react'
import { signalRService } from '@/lib/signalr'
import type { ConversationResponse, MessageRecalledEvent, MessageReactionEvent, MessageResponse, MessagesReadEvent, UserTypingEvent } from '@/types/chat'
import type { TaskResponse } from '@/types/task'

export function useSignalR(conversationId?: string | null) {
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([])
  const [incomingMessage, setIncomingMessage] = useState<MessageResponse | null>(null)
  const [incomingConversation, setIncomingConversation] = useState<ConversationResponse | null>(null)
  const [deletedConversationId, setDeletedConversationId] = useState<string | null>(null)
  const [readEvent, setReadEvent] = useState<MessagesReadEvent | null>(null)
  const [recalledEvent, setRecalledEvent] = useState<MessageRecalledEvent | null>(null)
  const [reactionEvent, setReactionEvent] = useState<MessageReactionEvent | null>(null)
  const [typingEvent, setTypingEvent] = useState<UserTypingEvent | null>(null)
  const [incomingTask, setIncomingTask] = useState<TaskResponse | null>(null)
  const [taskUpdatedEvent, setTaskUpdatedEvent] = useState<TaskResponse | null>(null)
  const [taskDeletedEvent, setTaskDeletedEvent] = useState<{ taskId: string; conversationId?: string } | null>(null)
  const [taskReminderEvent, setTaskReminderEvent] = useState<any | null>(null)

  useEffect(() => {
    const connection = signalRService.getConnection()

    const startConnection = async () => {
      try {
        if (connection.state === 'Disconnected') {
          await connection.start()
          setIsConnected(true)
          console.log('SignalR Connected.')
          connection.invoke('GetOnlineUsers').then((users: string[]) => {
            if (Array.isArray(users)) setOnlineUserIds(users)
          }).catch(() => {})
        } else if (connection.state === 'Connected') {
          setIsConnected(true)
          connection.invoke('GetOnlineUsers').then((users: string[]) => {
            if (Array.isArray(users)) setOnlineUserIds(users)
          }).catch(() => {})
        }
      } catch (err) {
        console.warn('SignalR connection error (server might be offline or reconnecting):', err)
      }
    }

    startConnection()

    const handleOnlineUsers = (userIds: string[]) => {
      console.log('SignalR: Received online users list:', userIds)
      if (Array.isArray(userIds)) {
        setOnlineUserIds(userIds)
      }
    }

    const handleUserStatusChanged = (userId: string, isOnline: boolean) => {
      console.log('SignalR: UserStatusChanged:', userId, isOnline)
      setOnlineUserIds((prev) => {
        if (isOnline) {
          return prev.includes(userId) ? prev : [...prev, userId]
        } else {
          return prev.filter((id) => id !== userId)
        }
      })
    }

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

    const handleNewTask = (task: any) => {
      console.log('SignalR: Received new task:', task)
      setIncomingTask(task)
    }

    const handleTaskUpdated = (task: any) => {
      console.log('SignalR: Received task updated:', task)
      setTaskUpdatedEvent(task)
    }

    const handleTaskDeleted = (eventData: any) => {
      console.log('SignalR: Received task deleted:', eventData)
      setTaskDeletedEvent({
        taskId: eventData.taskId || eventData.TaskId,
        conversationId: eventData.conversationId || eventData.ConversationId,
      })
    }

    const handleTaskReminder = (reminder: any) => {
      console.log('SignalR: Received task reminder:', reminder)
      setTaskReminderEvent({
        taskId: reminder.taskId || reminder.TaskId,
        taskTitle: reminder.taskTitle || reminder.TaskTitle,
        conversationId: reminder.conversationId || reminder.ConversationId,
        type: reminder.type || reminder.Type,
        deadline: reminder.deadline || reminder.Deadline,
        message: reminder.message || reminder.Message,
      })
    }

    connection.on('ReceiveOnlineUsers', handleOnlineUsers)
    connection.on('UserStatusChanged', handleUserStatusChanged)
    connection.on('ReceiveNewMessage', handleMessage)
    connection.on('ReceiveMessage', handleMessage)
    connection.on('ReceiveNewConversation', handleNewConversation)
    connection.on('ReceiveConversationDeleted', handleConversationDeleted)
    connection.on('ReceiveMessagesRead', handleMessagesRead)
    connection.on('ReceiveMessageRecalled', handleMessageRecalled)
    connection.on('ReceiveMessageReaction', handleMessageReaction)
    connection.on('ReceiveUserTyping', handleUserTyping)
    connection.on('ReceiveNewTask', handleNewTask)
    connection.on('ReceiveTaskUpdated', handleTaskUpdated)
    connection.on('ReceiveTaskDeleted', handleTaskDeleted)
    connection.on('ReceiveTaskReminder', handleTaskReminder)

    return () => {
      connection.off('ReceiveOnlineUsers', handleOnlineUsers)
      connection.off('UserStatusChanged', handleUserStatusChanged)
      connection.off('ReceiveNewMessage', handleMessage)
      connection.off('ReceiveMessage', handleMessage)
      connection.off('ReceiveNewConversation', handleNewConversation)
      connection.off('ReceiveConversationDeleted', handleConversationDeleted)
      connection.off('ReceiveMessagesRead', handleMessagesRead)
      connection.off('ReceiveMessageRecalled', handleMessageRecalled)
      connection.off('ReceiveMessageReaction', handleMessageReaction)
      connection.off('ReceiveUserTyping', handleUserTyping)
      connection.off('ReceiveNewTask', handleNewTask)
      connection.off('ReceiveTaskUpdated', handleTaskUpdated)
      connection.off('ReceiveTaskDeleted', handleTaskDeleted)
      connection.off('ReceiveTaskReminder', handleTaskReminder)
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
    (isTyping: boolean, userName: string) => {
      if (!conversationId) return
      const connection = signalRService.getConnection()
      if (connection.state === 'Connected') {
        connection.invoke('SendTyping', conversationId, userName, isTyping).catch((err) => {
          console.warn('SendTyping error:', err)
        })
      }
    },
    [conversationId]
  )

  return {
    isConnected,
    onlineUserIds,
    incomingMessage,
    incomingConversation,
    deletedConversationId,
    readEvent,
    recalledEvent,
    reactionEvent,
    typingEvent,
    incomingTask,
    taskUpdatedEvent,
    taskDeletedEvent,
    taskReminderEvent,
    sendTyping,
  }
}
