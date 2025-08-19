import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiRequest } from '@/lib/queryClient';
import type { LogMessage, StatusMessage, NotificationMessage } from '@/lib/websocket';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Robot {
  id: string;
  slug: string;
  nome: string;
  descricao?: string;
  status: 'idle' | 'executando' | 'pausado' | 'parado' | 'erro';
  ultima_execucao_at?: string;
  telegram_bot_id?: string;
  telegram_chat_id?: string;
  created_at: string;
  updated_at: string;
  telegram_bot?: any;
}

export interface Execution {
  id: string;
  robot_id: string;
  status: 'em_andamento' | 'concluida' | 'falha' | 'cancelada';
  started_at: string;
  finished_at?: string;
  erro?: string;
  itens_processados: number;
  duracao_segundos?: number;
  parametros?: any;
  created_at: string;
  robot?: Robot;
}

export interface TelegramBot {
  id: string;
  nome: string;
  token: string;
  default_chat_id?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  robots_online: number;
  executions_today: number;
  success_rate: number;
  failures_today: number;
  robots_change: string;
  executions_change: string;
  success_change: string;
  failures_change: string;
}

interface AppState {
  // Authentication
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  
  // WebSocket
  isWebSocketConnected: boolean;
  logs: LogMessage[];
  
  // UI State
  sidebarCollapsed: boolean;
  notifications: NotificationMessage[];
  
  // Cache
  robots: Robot[];
  dashboardStats: DashboardStats | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setWebSocketConnected: (connected: boolean) => void;
  addLog: (log: LogMessage) => void;
  clearLogs: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  addNotification: (notification: NotificationMessage) => void;
  removeNotification: (index: number) => void;
  updateRobotStatus: (status: StatusMessage) => void;
  setRobots: (robots: Robot[]) => void;
  setDashboardStats: (stats: DashboardStats) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      token: null,
      isWebSocketConnected: false,
      logs: [],
      sidebarCollapsed: false,
      notifications: [],
      robots: [],
      dashboardStats: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setToken: (token) => set({ token }),
      
      setWebSocketConnected: (connected) => set({ isWebSocketConnected: connected }),
      
      addLog: (log) => set((state) => ({ 
        logs: [...state.logs.slice(-999), log] // Keep last 1000 logs
      })),
      
      clearLogs: () => set({ logs: [] }),
      
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      addNotification: (notification) => set((state) => ({
        notifications: [...state.notifications, notification]
      })),
      
      removeNotification: (index) => set((state) => ({
        notifications: state.notifications.filter((_, i) => i !== index)
      })),
      
      updateRobotStatus: (status) => set((state) => ({
        robots: state.robots.map((robot) => 
          robot.id === status.robot_id 
            ? { ...robot, status: status.status || robot.status }
            : robot
        )
      })),
      
      setRobots: (robots) => set({ robots }),
      
      setDashboardStats: (stats) => set({ dashboardStats: stats }),

      login: async (email, password) => {
        try {
          const response = await apiRequest('POST', '/api/auth/login', {
            email,
            senha: password
          });
          
          const data = await response.json();
          
          set({ 
            token: data.access_token,
            isAuthenticated: true 
          });

          // Get user info
          const userResponse = await apiRequest('GET', '/api/auth/me');
          const userData = await userResponse.json();
          
          set({ user: userData });
          
        } catch (error) {
          console.error('Login failed:', error);
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          token: null,
          logs: [],
          notifications: []
        });
      },

      checkAuth: async () => {
        const token = get().token;
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        try {
          const response = await apiRequest('GET', '/api/auth/me');
          const userData = await response.json();
          
          set({ 
            user: userData, 
            isAuthenticated: true 
          });
        } catch (error) {
          console.error('Auth check failed:', error);
          set({ 
            user: null, 
            isAuthenticated: false, 
            token: null 
          });
        }
      }
    }),
    {
      name: 'rpa-monitor-storage',
      partialize: (state) => ({ 
        token: state.token,
        sidebarCollapsed: state.sidebarCollapsed
      }),
    }
  )
);
