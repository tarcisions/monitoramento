import { useAppStore } from "@/store/useAppStore";

export type LogLevel = 'INFO' | 'ERROR' | 'WARNING' | 'DEBUG';

export interface LogMessage {
  id: string;
  execution_id?: string;
  ts: string;
  nivel: LogLevel;
  mensagem: string;
  dados?: any;
  robot_slug?: string;
}

export interface StatusMessage {
  event: string;
  robot_id?: string;
  execution_id?: string;
  status?: string;
  duration?: number;
  data?: any;
}

export interface NotificationMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

class WebSocketService {
  private logSocket: WebSocket | null = null;
  private statusSocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  private getWebSocketUrl(path: string): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws${path}`;
  }

  connectLogs(robotId?: string, executionId?: string) {
    try {
      let url = this.getWebSocketUrl('/logs');
      const params = new URLSearchParams();
      
      if (robotId) params.append('robot_id', robotId);
      if (executionId) params.append('execution_id', executionId);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      this.logSocket = new WebSocket(url);
      
      this.logSocket.onopen = () => {
        console.log('WebSocket de logs conectado');
        this.reconnectAttempts = 0;
        useAppStore.getState().setWebSocketConnected(true);
      };

      this.logSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'log') {
            useAppStore.getState().addLog(data.data as LogMessage);
          } else if (data.type === 'notification') {
            useAppStore.getState().addNotification(data.data as NotificationMessage);
          }
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      };

      this.logSocket.onclose = () => {
        console.log('WebSocket de logs desconectado');
        useAppStore.getState().setWebSocketConnected(false);
        this.handleReconnect('logs');
      };

      this.logSocket.onerror = (error) => {
        console.error('Erro no WebSocket de logs:', error);
        useAppStore.getState().setWebSocketConnected(false);
      };

    } catch (error) {
      console.error('Erro ao conectar WebSocket de logs:', error);
    }
  }

  connectStatus() {
    try {
      const url = this.getWebSocketUrl('/status');
      this.statusSocket = new WebSocket(url);
      
      this.statusSocket.onopen = () => {
        console.log('WebSocket de status conectado');
      };

      this.statusSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'status') {
            useAppStore.getState().updateRobotStatus(data.data as StatusMessage);
          } else if (data.type === 'notification') {
            useAppStore.getState().addNotification(data.data as NotificationMessage);
          }
        } catch (error) {
          console.error('Erro ao processar mensagem de status:', error);
        }
      };

      this.statusSocket.onclose = () => {
        console.log('WebSocket de status desconectado');
        this.handleReconnect('status');
      };

      this.statusSocket.onerror = (error) => {
        console.error('Erro no WebSocket de status:', error);
      };

    } catch (error) {
      console.error('Erro ao conectar WebSocket de status:', error);
    }
  }

  private handleReconnect(type: 'logs' | 'status') {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        console.log(`Tentando reconectar WebSocket de ${type}... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
        this.reconnectAttempts++;
        
        if (type === 'logs') {
          this.connectLogs();
        } else {
          this.connectStatus();
        }
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
    }
  }

  sendPing() {
    if (this.logSocket?.readyState === WebSocket.OPEN) {
      this.logSocket.send(JSON.stringify({ type: 'ping' }));
    }
    if (this.statusSocket?.readyState === WebSocket.OPEN) {
      this.statusSocket.send(JSON.stringify({ type: 'ping' }));
    }
  }

  disconnect() {
    if (this.logSocket) {
      this.logSocket.close();
      this.logSocket = null;
    }
    if (this.statusSocket) {
      this.statusSocket.close();
      this.statusSocket = null;
    }
    useAppStore.getState().setWebSocketConnected(false);
  }
}

export const webSocketService = new WebSocketService();
