import * as signalR from '@microsoft/signalr'

const hubUrl = process.env.NEXT_PUBLIC_SIGNALR_URL || 'http://localhost:5011/hubs/chat'

class SignalRService {
  private connection: signalR.HubConnection | null = null

  public getConnection(): signalR.HubConnection {
    if (!this.connection) {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => {
            if (typeof window !== 'undefined') {
              return localStorage.getItem('token') || ''
            }
            return ''
          },
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build()
    }
    return this.connection
  }
}

export const signalRService = new SignalRService()
