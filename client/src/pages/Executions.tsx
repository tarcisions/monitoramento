import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Play, 
  Search, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Pause
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Executions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch executions
  const { data: executions = [], isLoading } = useQuery({
    queryKey: ['/api/executions'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch robots for the select
  const { data: robots = [] } = useQuery({
    queryKey: ['/api/robots'],
  });

  // Filter executions
  const filteredExecutions = executions.filter((execution: any) => {
    const matchesSearch = 
      execution.robot?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      execution.robot?.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      execution.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || execution.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluida':
        return <CheckCircle className="text-success" size={16} />;
      case 'falha':
        return <XCircle className="text-destructive" size={16} />;
      case 'em_andamento':
        return <Play className="text-primary" size={16} />;
      case 'cancelada':
        return <Pause className="text-warning" size={16} />;
      default:
        return <AlertCircle className="text-gray-500" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida':
        return 'bg-success bg-opacity-10 text-success';
      case 'falha':
        return 'bg-destructive bg-opacity-10 text-destructive';
      case 'em_andamento':
        return 'bg-primary bg-opacity-10 text-primary';
      case 'cancelada':
        return 'bg-warning bg-opacity-10 text-warning';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'concluida':
        return 'Concluída';
      case 'falha':
        return 'Falha';
      case 'em_andamento':
        return 'Em Andamento';
      case 'cancelada':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg p-6">
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
          Histórico de Execuções
        </h1>
        <p className="text-gray-600 mt-1">
          Visualize e acompanhe todas as execuções dos robôs RPA
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por robô ou ID da execução..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-executions"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="falha">Falha</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Executions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Play className="mr-2" size={20} />
            Execuções ({filteredExecutions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExecutions.length === 0 ? (
            <div className="text-center py-12" data-testid="text-no-executions">
              {searchTerm || statusFilter ? (
                <>
                  <Search className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">
                    Nenhuma execução encontrada com os filtros aplicados
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("");
                    }}
                    className="mt-4"
                  >
                    Limpar filtros
                  </Button>
                </>
              ) : (
                <>
                  <Play className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">Nenhuma execução encontrada</p>
                  <p className="text-gray-500 text-sm mt-2">
                    As execuções aparecerão aqui quando os robôs começarem a executar
                  </p>
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Robô</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Iniciado em</TableHead>
                  <TableHead>Finalizado em</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExecutions.map((execution: any) => (
                  <TableRow key={execution.id} data-testid={`row-execution-${execution.id}`}>
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-medium">{execution.robot?.nome || 'Robô Desconhecido'}</p>
                        <p className="text-sm text-gray-500">{execution.robot?.slug || execution.robot_id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("inline-flex items-center gap-1", getStatusColor(execution.status))}>
                        {getStatusIcon(execution.status)}
                        {getStatusText(execution.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock size={14} className="mr-1" />
                        {format(new Date(execution.started_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {execution.finished_at ? (
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock size={14} className="mr-1" />
                          {format(new Date(execution.finished_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatDuration(execution.duracao_segundos)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {execution.itens_processados?.toLocaleString() || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-gray-900"
                        data-testid={`button-view-logs-${execution.id}`}
                      >
                        <FileText size={16} className="mr-1" />
                        Ver Logs
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
