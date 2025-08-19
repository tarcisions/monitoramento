import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { webSocketService } from "@/lib/websocket";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Trash2, Download, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";

interface LiveLogsProps {
  robotFilter?: string;
  executionFilter?: string;
}

export default function LiveLogs({ robotFilter, executionFilter }: LiveLogsProps) {
  const { logs, isWebSocketConnected, robots, clearLogs } = useAppStore();
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [selectedRobot, setSelectedRobot] = useState<string>(robotFilter || "");
  
  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Connect to WebSocket when component mounts
  useEffect(() => {
    webSocketService.connectLogs(selectedRobot || undefined, executionFilter);
    webSocketService.connectStatus();

    return () => {
      if (!robotFilter && !executionFilter) {
        // Only disconnect if this is the main log viewer
        webSocketService.disconnect();
      }
    };
  }, [selectedRobot, executionFilter, robotFilter]);

  // Filter logs based on selected robot
  const filteredLogs = selectedRobot 
    ? logs.filter(log => log.robot_slug === selectedRobot)
    : logs;

  const getLogLevelColor = (nivel: string) => {
    switch (nivel.toUpperCase()) {
      case 'INFO':
        return 'text-blue-300';
      case 'SUCCESS':
        return 'text-green-400';
      case 'WARNING':
        return 'text-yellow-300';
      case 'ERROR':
        return 'text-red-400';
      case 'DEBUG':
        return 'text-purple-300';
      default:
        return 'text-gray-300';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const downloadLogs = () => {
    const logText = filteredLogs.map(log => 
      `${formatTimestamp(log.ts)} [${log.nivel}] [${log.robot_slug || 'unknown'}] ${log.mensagem}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Logs ao Vivo
          </CardTitle>
          <div className="flex items-center space-x-2">
            {isWebSocketConnected ? (
              <>
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" data-testid="status-websocket-live" />
                <span className="text-xs text-gray-600">Conectado via WebSocket</span>
              </>
            ) : (
              <>
                <WifiOff size={12} className="text-destructive" />
                <span className="text-xs text-destructive">Desconectado</span>
              </>
            )}
          </div>
        </div>
        
        {/* Robot Filter */}
        <Select value={selectedRobot} onValueChange={setSelectedRobot}>
          <SelectTrigger className="w-full text-sm" data-testid="select-robot-filter">
            <SelectValue placeholder="Todos os robôs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os robôs</SelectItem>
            {robots.map((robot) => (
              <SelectItem key={robot.id} value={robot.slug}>
                {robot.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Live Logs Container */}
        <div className="flex-1 bg-gray-900 mx-6 mb-4 rounded-lg overflow-hidden">
          <div className="h-96 overflow-y-auto custom-scrollbar p-4 font-mono text-sm log-terminal">
            {filteredLogs.length === 0 ? (
              <div className="text-gray-500 text-center py-8" data-testid="text-no-logs">
                {isWebSocketConnected ? 'Aguardando logs...' : 'Conectando...'}
              </div>
            ) : (
              <div className="space-y-1" data-testid="container-logs">
                {filteredLogs.map((log, index) => (
                  <div key={`${log.id}-${index}`} className="log-entry">
                    <span className="log-timestamp text-gray-400">
                      {formatTimestamp(log.ts)}
                    </span>
                    <span className={cn("ml-2", getLogLevelColor(log.nivel))}>
                      [{log.nivel}]
                    </span>
                    {log.robot_slug && (
                      <span className="log-robot text-yellow-300 ml-2">
                        [{log.robot_slug}]
                      </span>
                    )}
                    <span className="text-green-400 ml-2">
                      {log.mensagem}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Log Actions */}
        <div className="flex items-center justify-between px-6 pb-6">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" data-testid="badge-log-count">
              {filteredLogs.length} logs
            </Badge>
            {selectedRobot && (
              <Badge variant="outline">
                Filtro: {robots.find(r => r.slug === selectedRobot)?.nome || selectedRobot}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLogs}
              className="text-gray-600 hover:text-gray-900"
              data-testid="button-clear-logs"
            >
              <Trash2 size={16} className="mr-1" />
              Limpar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadLogs}
              className="text-gray-600 hover:text-gray-900"
              disabled={filteredLogs.length === 0}
              data-testid="button-download-logs"
            >
              <Download size={16} className="mr-1" />
              Baixar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
