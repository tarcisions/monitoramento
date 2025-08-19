import { Robot } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  Bot, 
  Play, 
  Pause, 
  Square, 
  FileText,
  Clock
} from "lucide-react";

interface RobotCardProps {
  robot: Robot;
  onStart: (robotId: string) => void;
  onPause: (robotId: string) => void;
  onResume: (robotId: string) => void;
  onStop: (robotId: string) => void;
  onViewLogs: (robotId: string) => void;
}

export default function RobotCard({ 
  robot, 
  onStart, 
  onPause, 
  onResume, 
  onStop, 
  onViewLogs 
}: RobotCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'executando':
        return 'bg-success bg-opacity-10 text-success';
      case 'pausado':
        return 'bg-warning bg-opacity-10 text-warning';
      case 'erro':
        return 'bg-destructive bg-opacity-10 text-destructive';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'executando':
        return 'Executando';
      case 'pausado':
        return 'Pausado';
      case 'parado':
        return 'Parado';
      case 'erro':
        return 'Erro';
      default:
        return 'Idle';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executando':
        return <div className="w-1.5 h-1.5 bg-success rounded-full mr-1" />;
      case 'pausado':
        return <div className="w-1.5 h-1.5 bg-warning rounded-full mr-1" />;
      case 'erro':
        return <div className="w-1.5 h-1.5 bg-destructive rounded-full mr-1" />;
      default:
        return <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1" />;
    }
  };

  const getLastExecutionText = (lastExecution?: string) => {
    if (!lastExecution) return 'Nunca executado';
    
    const date = new Date(lastExecution);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };

  const getIconForStatus = (status: string) => {
    const iconClass = cn(
      "w-10 h-10 rounded-full flex items-center justify-center",
      status === 'executando' ? 'bg-success bg-opacity-10' :
      status === 'pausado' ? 'bg-warning bg-opacity-10' :
      status === 'erro' ? 'bg-destructive bg-opacity-10' :
      'bg-gray-200'
    );
    
    const iconColor = 
      status === 'executando' ? 'text-success' :
      status === 'pausado' ? 'text-warning' :
      status === 'erro' ? 'text-destructive' :
      'text-gray-500';

    return (
      <div className={iconClass}>
        <Bot className={iconColor} size={20} />
      </div>
    );
  };

  return (
    <Card className="hover:bg-gray-50 transition-colors" data-testid={`card-robot-${robot.slug}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {getIconForStatus(robot.status)}
            <div>
              <h4 className="font-medium text-gray-900" data-testid={`text-robot-name-${robot.id}`}>
                {robot.nome}
              </h4>
              <p className="text-sm text-gray-600" data-testid={`text-robot-description-${robot.id}`}>
                {robot.descricao || 'Sem descrição'}
              </p>
              <div className="flex items-center space-x-4 mt-1">
                <Badge className={cn("inline-flex items-center text-xs font-medium", getStatusColor(robot.status))}>
                  {getStatusIcon(robot.status)}
                  {getStatusText(robot.status)}
                </Badge>
                <span className="text-xs text-gray-500 flex items-center">
                  <Clock size={12} className="mr-1" />
                  Última: {getLastExecutionText(robot.ultima_execucao_at)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewLogs(robot.id)}
              title="Ver Logs"
              data-testid={`button-view-logs-${robot.id}`}
            >
              <FileText size={16} />
            </Button>
            
            {robot.status === 'idle' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStart(robot.id)}
                className="text-success hover:bg-success hover:bg-opacity-10"
                title="Iniciar"
                data-testid={`button-start-${robot.id}`}
              >
                <Play size={16} />
              </Button>
            )}
            
            {robot.status === 'executando' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPause(robot.id)}
                  className="text-warning hover:bg-warning hover:bg-opacity-10"
                  title="Pausar"
                  data-testid={`button-pause-${robot.id}`}
                >
                  <Pause size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onStop(robot.id)}
                  className="text-destructive hover:bg-destructive hover:bg-opacity-10"
                  title="Parar"
                  data-testid={`button-stop-${robot.id}`}
                >
                  <Square size={16} />
                </Button>
              </>
            )}
            
            {robot.status === 'pausado' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onResume(robot.id)}
                  className="text-success hover:bg-success hover:bg-opacity-10"
                  title="Continuar"
                  data-testid={`button-resume-${robot.id}`}
                >
                  <Play size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onStop(robot.id)}
                  className="text-destructive hover:bg-destructive hover:bg-opacity-10"
                  title="Parar"
                  data-testid={`button-stop-${robot.id}`}
                >
                  <Square size={16} />
                </Button>
              </>
            )}
            
            {robot.status === 'parado' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStart(robot.id)}
                className="text-success hover:bg-success hover:bg-opacity-10"
                title="Iniciar"
                data-testid={`button-start-${robot.id}`}
              >
                <Play size={16} />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
