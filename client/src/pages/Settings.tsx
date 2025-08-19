import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Database,
  Wifi,
  LogOut,
  Save
} from "lucide-react";

export default function Settings() {
  const { user, logout, isWebSocketConnected } = useAppStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Local state for settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30);
  const [logRetentionDays, setLogRetentionDays] = useState(30);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configurações salvas",
        description: "Suas preferências foram atualizadas com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do sistema",
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center" data-testid="text-page-title">
          <SettingsIcon className="mr-2" size={24} />
          Configurações
        </h1>
        <p className="text-gray-600 mt-1">
          Gerencie suas preferências e configurações do sistema
        </p>
      </div>

      <div className="space-y-6">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2" size={20} />
              Informações da Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input 
                  value={user?.nome || ''} 
                  disabled 
                  className="bg-gray-50"
                  data-testid="input-user-name"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input 
                  value={user?.email || ''} 
                  disabled 
                  className="bg-gray-50"
                  data-testid="input-user-email"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div>
                <Label>Função</Label>
                <div className="mt-1">
                  <Badge className="bg-primary bg-opacity-10 text-primary">
                    {user?.role === 'admin' ? 'Administrador' : 
                     user?.role === 'operador' ? 'Operador' : 'Visualizador'}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <div className="mt-1">
                  <Badge className={user?.ativo 
                    ? "bg-success bg-opacity-10 text-success" 
                    : "bg-destructive bg-opacity-10 text-destructive"
                  }>
                    {user?.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2" size={20} />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Wifi className={`mx-auto mb-2 ${isWebSocketConnected ? 'text-success' : 'text-destructive'}`} size={32} />
                <p className="font-medium text-sm">WebSocket</p>
                <Badge className={isWebSocketConnected 
                  ? "bg-success bg-opacity-10 text-success" 
                  : "bg-destructive bg-opacity-10 text-destructive"
                }>
                  {isWebSocketConnected ? 'Conectado' : 'Desconectado'}
                </Badge>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Database className="mx-auto mb-2 text-success" size={32} />
                <p className="font-medium text-sm">Banco de Dados</p>
                <Badge className="bg-success bg-opacity-10 text-success">
                  Conectado
                </Badge>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Shield className="mx-auto mb-2 text-success" size={32} />
                <p className="font-medium text-sm">Segurança</p>
                <Badge className="bg-success bg-opacity-10 text-success">
                  Ativo
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2" size={20} />
              Configurações de Notificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Notificações no Navegador</Label>
                <p className="text-sm text-gray-600">Receber notificações push do sistema</p>
              </div>
              <Button
                variant={notificationsEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                data-testid="button-toggle-notifications"
              >
                {notificationsEnabled ? 'Ativado' : 'Desativado'}
              </Button>
            </div>
            
            <Separator />
            
            <div>
              <Label>Intervalo de Atualização Automática (segundos)</Label>
              <div className="flex items-center space-x-4 mt-2">
                <Input
                  type="number"
                  min="5"
                  max="300"
                  value={autoRefreshInterval}
                  onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                  className="w-24"
                  data-testid="input-refresh-interval"
                />
                <span className="text-sm text-gray-600">
                  Frequência de atualização dos dados em tempo real
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2" size={20} />
              Configurações de Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Retenção de Logs (dias)</Label>
              <div className="flex items-center space-x-4 mt-2">
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={logRetentionDays}
                  onChange={(e) => setLogRetentionDays(Number(e.target.value))}
                  className="w-24"
                  data-testid="input-log-retention"
                />
                <span className="text-sm text-gray-600">
                  Tempo de armazenamento dos logs no sistema
                </span>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Informação sobre Retenção de Dados
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Logs mais antigos que o período especificado serão automaticamente 
                      removidos para otimizar o desempenho do sistema.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            data-testid="button-logout"
          >
            <LogOut className="mr-2" size={16} />
            Sair do Sistema
          </Button>

          <Button
            onClick={handleSaveSettings}
            disabled={isLoading}
            data-testid="button-save-settings"
          >
            {isLoading ? (
              'Salvando...'
            ) : (
              <>
                <Save className="mr-2" size={16} />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Versão do Sistema:</span>
                  <span className="font-mono">v1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ambiente:</span>
                  <Badge variant="outline">Produção</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Última Atualização:</span>
                  <span>{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Backend API:</span>
                  <Badge className="bg-success bg-opacity-10 text-success">Online</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monitoramento:</span>
                  <Badge className="bg-success bg-opacity-10 text-success">Ativo</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Backup:</span>
                  <Badge className="bg-success bg-opacity-10 text-success">Configurado</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
