import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import RobotCard from "@/components/robots/RobotCard";
import AddRobotModal from "@/components/modals/AddRobotModal";
import { Plus, Search, Bot } from "lucide-react";

export default function Robots() {
  const { user } = useAppStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [addRobotModalOpen, setAddRobotModalOpen] = useState(false);

  // Fetch robots
  const { data: robots = [], isLoading } = useQuery({
    queryKey: ['/api/robots'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Filter robots based on search term
  const filteredRobots = robots.filter((robot: any) =>
    robot.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    robot.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    robot.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Robot control mutations
  const startRobotMutation = useMutation({
    mutationFn: async (robotId: string) => {
      const response = await apiRequest('POST', `/api/robots/${robotId}/start`);
      return response.json();
    },
    onSuccess: () => {
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
    toast({
      title: "Ver Logs",
      description: "Funcionalidade de logs específicos do robô em desenvolvimento",
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
            Gerenciamento de Robôs
          </h1>
          <p className="text-gray-600 mt-1">
            Visualize e controle todos os robôs RPA do sistema
          </p>
        </div>
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

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar robôs por nome, slug ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-robots"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Robots List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="mr-2" size={20} />
            Robôs ({filteredRobots.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRobots.length === 0 ? (
            <div className="text-center py-12" data-testid="text-no-robots">
              {searchTerm ? (
                <>
                  <Search className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">
                    Nenhum robô encontrado para "{searchTerm}"
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchTerm("")}
                    className="mt-4"
                  >
                    Limpar busca
                  </Button>
                </>
              ) : (
                <>
                  <Bot className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600 mb-2">Nenhum robô cadastrado</p>
                  {user?.role === 'admin' && (
                    <Button 
                      onClick={() => setAddRobotModalOpen(true)}
                      className="mt-4"
                    >
                      Cadastrar primeiro robô
                    </Button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRobots.map((robot) => (
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

      {/* Add Robot Modal */}
      <AddRobotModal 
        open={addRobotModalOpen} 
        onOpenChange={setAddRobotModalOpen}
      />
    </div>
  );
}
