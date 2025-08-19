import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Clock, 
  Wifi, 
  WifiOff
} from "lucide-react";

export default function Header() {
  const { isWebSocketConnected, notifications } = useAppStore();
  
  const currentTime = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <header className="bg-white shadow-sm border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
            Dashboard Geral
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Visão geral do monitoramento de robôs RPA
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* WebSocket Status */}
          <div className="flex items-center space-x-2">
            {isWebSocketConnected ? (
              <>
                <div className="w-3 h-3 bg-success rounded-full animate-pulse" data-testid="status-websocket-connected" />
                <span className="text-sm text-gray-600">Conectado</span>
              </>
            ) : (
              <>
                <WifiOff size={16} className="text-destructive" />
                <span className="text-sm text-destructive">Desconectado</span>
              </>
            )}
          </div>
          
          {/* Time Display */}
          <div className="text-sm text-gray-500 flex items-center" data-testid="text-current-time">
            <Clock size={16} className="mr-1" />
            {currentTime}
          </div>
          
          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative p-2"
            data-testid="button-notifications"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs flex items-center justify-center p-0"
                data-testid="badge-notification-count"
              >
                {notifications.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
