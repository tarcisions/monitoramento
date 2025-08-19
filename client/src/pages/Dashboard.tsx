import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import RobotCard from "@/components/robots/RobotCard";
import LiveLogs from "@/components/logs/LiveLogs";
import ExecutionsChart from "@/components/charts/ExecutionsChart";
import StatusChart from "@/components/charts/StatusChart";
import AddRobotModal from "@/components/modals/AddRobotModal";
import { 
  Bot, 
  Play, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Plus
} from "lucide-react";

export default function Dashboard() {
  const { setRobots, setDashboardStats, user } = useAppStore();
  const { toast } = useToast();
  const [addRobotModalOpen, setAddRobotModalOpen] = useState(false);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/robots/stats/dashboard'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch robots
  const { data: robots = [], isLoading: robotsLoading } = useQuery({
    queryKey: ['/api/robots'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Update store when data changes
  useEffect(() => {
    if (stats) {
      setDashboardStats(stats);
    }
  }, [stats, setDashboardStats]);

  useEffect(() => {
    if (robots) {
      setRobots(robots);
    }
  }, [robots, setRobots]);

  // Robot control mutations
  const startRobotMutation = useMutation({
    mutationFn: async (robotId: string) => {
      const response = await apiRequest('POST', `/api/robots/${robotId}/start`);
      return response.json();
    },
    onSuccess: (data, robotId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/robots'] });
      toast({
        title: "Robô iniciado",
        description: "O robô foi iniciado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao iniciar robô",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    },
  });

  const pauseRobotMutation = useMutation({
    mutationFn: async (robotId: string) => {
      const response = await apiRequest('POST', `/api/robots/${robotId}/pause`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/robots'] });
      toast({
        title: "Robô pausado",
        description: "O robô foi pausado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao pausar robô",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    },
  });

  const resumeRobotMutation = useMutation({
    mutationFn: async (robotId: string) => {
      const response = await apiRequest('POST', `/api/robots/${robotId}/resume`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/robots'] });
      toast({
        title: "Robô retomado",
        description: "O robô foi retomado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao retomar robô",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    },
  });

  const stopRobotMutation = useMutation({
    mutationFn: async (robotId: string) => {
      const response = await apiRequest('POST', `/api/robots/${robotId}/stop`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/robots'] });
      toast({
        title: "Robô parado",
        description: "O robô foi parado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao parar robô",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    },
  });

  const handleViewLogs = (robotId: string) => {
    // For now, just show a toast. In a real app, this might open a modal or navigate to a logs page
    toast({
      title: "Ver Logs",
      description: "Funcionalidade de logs específicos do robô em desenvolvimento",
    });
  };

  if (statsLoading || robotsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Robôs Online</p>
                <p className="text-3xl font-bold text-gray-900 mt-2" data-testid="stat-robots-online">
                  {stats?.robots_online || 0}
                </p>
                <p className="text-sm text-success mt-1 flex items-center">
                  <TrendingUp size={12} className="mr-1" />
                  {stats?.robots_change || '+0 hoje'}
                </p>
              </div>
              <div className="w-12 h-12 bg-success bg-opacity-10 rounded-lg flex items-center justify-center">
                <Bot className="text-success" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Execuções Hoje</p>
                <p className="text-3xl font-bold text-gray-900 mt-2" data-testid="stat-executions-today">
                  {stats?.executions_today || 0}
                </p>
                <p className="text-sm text-success mt-1 flex items-center">
                  <TrendingUp size={12} className="mr-1" />
                  {stats?.executions_change || '+0%'}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                <Play className="text-primary" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
                <p className="text-3xl font-bold text-gray-900 mt-2" data-testid="stat-success-rate">
                  {stats?.success_rate || 0}%
                </p>
                <p className="text-sm text-success mt-1 flex items-center">
                  <TrendingUp size={12} className="mr-1" />
                  {stats?.success_change || '+0%'}
                </p>
              </div>
              <div className="w-12 h-12 bg-success bg-opacity-10 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-success" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Falhas</p>
                <p className="text-3xl font-bold text-gray-900 mt-2" data-testid="stat-failures-today">
                  {stats?.failures_today || 0}
                </p>
                <p className="text-sm text-destructive mt-1">
                  {stats?.failures_change || '0 vs ontem'}
                </p>
              </div>
              <div className="w-12 h-12 bg-destructive bg-opacity-10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-destructive" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ExecutionsChart />
        <StatusChart />
      </div>

      {/* Active Robots and Live Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Robots */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Robôs Ativos
                </CardTitle>
                {user?.role === 'admin' && (
                  <Button 
                    onClick={() => setAddRobotModalOpen(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-add-robot"
                  >
                    <Plus size={16} className="mr-2" />
                    Adicionar Robô
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {robots.length === 0 ? (
                <div className="text-center py-8" data-testid="text-no-robots">
                  <Bot className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">Nenhum robô cadastrado</p>
                  {user?.role === 'admin' && (
                    <Button 
                      variant="outline" 
                      onClick={() => setAddRobotModalOpen(true)}
                      className="mt-4"
                    >
                      Cadastrar primeiro robô
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {robots.slice(0, 10).map((robot) => (
                    <RobotCard
                      key={robot.id}
                      robot={robot}
                      onStart={(id) => startRobotMutation.mutate(id)}
                      onPause={(id) => pauseRobotMutation.mutate(id)}
                      onResume={(id) => resumeRobotMutation.mutate(id)}
                      onStop={(id) => stopRobotMutation.mutate(id)}
                      onViewLogs={handleViewLogs}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Logs */}
        <LiveLogs />
      </div>

      {/* Add Robot Modal */}
      <AddRobotModal 
        open={addRobotModalOpen} 
        onOpenChange={setAddRobotModalOpen}
      />
    </div>
  );
}
