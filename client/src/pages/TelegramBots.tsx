import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/useAppStore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Plus, 
  Search, 
  Send, 
  Edit, 
  Trash2, 
  TestTube,
  CheckCircle,
  XCircle
} from "lucide-react";

const telegramBotSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  token: z.string().min(1, "Token é obrigatório"),
  default_chat_id: z.string().optional(),
});

type TelegramBotForm = z.infer<typeof telegramBotSchema>;

export default function TelegramBots() {
  const { user } = useAppStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingBot, setEditingBot] = useState<any>(null);
  const [deletingBot, setDeletingBot] = useState<any>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [testChatId, setTestChatId] = useState("");
  const [testingBotId, setTestingBotId] = useState<string | null>(null);

  const form = useForm<TelegramBotForm>({
    resolver: zodResolver(telegramBotSchema),
    defaultValues: {
      nome: "",
      token: "",
      default_chat_id: "",
    },
  });

  // Fetch telegram bots
  const { data: bots = [], isLoading } = useQuery({
    queryKey: ['/api/telegram-bots'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Filter bots based on search term
  const filteredBots = bots.filter((bot: any) =>
    bot.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bot.token.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create bot mutation
  const createBotMutation = useMutation({
    mutationFn: async (data: TelegramBotForm) => {
      const response = await apiRequest('POST', '/api/telegram-bots', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/telegram-bots'] });
      toast({
        title: "Bot criado com sucesso",
        description: "O bot do Telegram foi adicionado ao sistema",
      });
      form.reset();
      setAddModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar bot",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    },
  });

  // Update bot mutation
  const updateBotMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TelegramBotForm> }) => {
      const response = await apiRequest('PUT', `/api/telegram-bots/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/telegram-bots'] });
      toast({
        title: "Bot atualizado com sucesso",
        description: "As informações do bot foram atualizadas",
      });
      setEditingBot(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar bot",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    },
  });

  // Delete bot mutation
  const deleteBotMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/telegram-bots/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/telegram-bots'] });
      toast({
        title: "Bot removido com sucesso",
        description: "O bot do Telegram foi removido do sistema",
      });
      setDeletingBot(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover bot",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    },
  });

  // Test bot mutation
  const testBotMutation = useMutation({
    mutationFn: async ({ botId, chatId }: { botId: string; chatId: string }) => {
      const response = await apiRequest('POST', `/api/telegram-bots/${botId}/test?chat_id=${encodeURIComponent(chatId)}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Teste bem-sucedido",
        description: "A mensagem de teste foi enviada com sucesso!",
      });
      setTestingBotId(null);
      setTestChatId("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro no teste",
        description: error.message || "Falha ao enviar mensagem de teste",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TelegramBotForm) => {
    if (editingBot) {
      updateBotMutation.mutate({ id: editingBot.id, data });
    } else {
      createBotMutation.mutate(data);
    }
  };

  const handleEdit = (bot: any) => {
    setEditingBot(bot);
    form.reset({
      nome: bot.nome,
      token: bot.token,
      default_chat_id: bot.default_chat_id || "",
    });
    setAddModalOpen(true);
  };

  const handleTest = (botId: string) => {
    setTestingBotId(botId);
    const bot = bots.find((b: any) => b.id === botId);
    setTestChatId(bot?.default_chat_id || "");
  };

  const executeTest = () => {
    if (testingBotId && testChatId) {
      testBotMutation.mutate({ botId: testingBotId, chatId: testChatId });
    }
  };

  const handleCloseModal = () => {
    setAddModalOpen(false);
    setEditingBot(null);
    form.reset();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
            Bots do Telegram
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie os bots do Telegram para receber notificações
          </p>
        </div>
        {user?.role === 'admin' && (
          <Button 
            onClick={() => setAddModalOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-add-bot"
          >
            <Plus size={16} className="mr-2" />
            Adicionar Bot
          </Button>
        )}
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar bots por nome ou token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-bots"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bots Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Send className="mr-2" size={20} />
            Bots do Telegram ({filteredBots.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBots.length === 0 ? (
            <div className="text-center py-12" data-testid="text-no-bots">
              {searchTerm ? (
                <>
                  <Search className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">
                    Nenhum bot encontrado para "{searchTerm}"
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
                  <Send className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600 mb-2">Nenhum bot do Telegram cadastrado</p>
                  <p className="text-gray-500 text-sm mb-4">
                    Cadastre bots do Telegram para receber notificações sobre as execuções dos robôs
                  </p>
                  {user?.role === 'admin' && (
                    <Button 
                      onClick={() => setAddModalOpen(true)}
                      className="mt-4"
                    >
                      Cadastrar primeiro bot
                    </Button>
                  )}
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Chat Padrão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBots.map((bot: any) => (
                  <TableRow key={bot.id} data-testid={`row-bot-${bot.id}`}>
                    <TableCell className="font-medium">
                      {bot.nome}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {`${bot.token.substring(0, 8)}...${bot.token.substring(bot.token.length - 4)}`}
                    </TableCell>
                    <TableCell>
                      {bot.default_chat_id ? (
                        <span className="font-mono text-sm">{bot.default_chat_id}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={bot.ativo 
                        ? "bg-success bg-opacity-10 text-success" 
                        : "bg-gray-100 text-gray-700"
                      }>
                        {bot.ativo ? (
                          <>
                            <CheckCircle size={12} className="mr-1" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <XCircle size={12} className="mr-1" />
                            Inativo
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {format(new Date(bot.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTest(bot.id)}
                          className="text-primary hover:bg-primary hover:bg-opacity-10"
                          data-testid={`button-test-${bot.id}`}
                        >
                          <TestTube size={16} />
                        </Button>
                        {user?.role === 'admin' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(bot)}
                              className="text-gray-600 hover:bg-gray-100"
                              data-testid={`button-edit-${bot.id}`}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingBot(bot)}
                              className="text-destructive hover:bg-destructive hover:bg-opacity-10"
                              data-testid={`button-delete-${bot.id}`}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Bot Modal */}
      <Dialog open={addModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-[425px]" data-testid="modal-bot-form">
          <DialogHeader>
            <DialogTitle>
              {editingBot ? 'Editar Bot do Telegram' : 'Adicionar Bot do Telegram'}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Bot</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Bot Principal"
                        {...field}
                        data-testid="input-bot-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token do Bot</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                        type="password"
                        {...field}
                        data-testid="input-bot-token"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="default_chat_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chat ID Padrão (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: -1001234567890"
                        {...field}
                        data-testid="input-chat-id"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCloseModal}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createBotMutation.isPending || updateBotMutation.isPending}
                  data-testid="button-save"
                >
                  {createBotMutation.isPending || updateBotMutation.isPending 
                    ? 'Salvando...' 
                    : editingBot ? 'Atualizar' : 'Criar Bot'
                  }
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Test Bot Dialog */}
      {testingBotId && (
        <Dialog open={!!testingBotId} onOpenChange={() => setTestingBotId(null)}>
          <DialogContent className="sm:max-w-[425px]" data-testid="modal-test-bot">
            <DialogHeader>
              <DialogTitle>Testar Bot do Telegram</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="test-chat-id">Chat ID para Teste</Label>
                <Input
                  id="test-chat-id"
                  placeholder="Ex: -1001234567890"
                  value={testChatId}
                  onChange={(e) => setTestChatId(e.target.value)}
                  data-testid="input-test-chat-id"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ID do chat ou grupo que receberá a mensagem de teste
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setTestingBotId(null)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={executeTest}
                  disabled={!testChatId || testBotMutation.isPending}
                  data-testid="button-send-test"
                >
                  {testBotMutation.isPending ? 'Enviando...' : 'Enviar Teste'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingBot} onOpenChange={() => setDeletingBot(null)}>
        <AlertDialogContent data-testid="dialog-delete-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Bot do Telegram</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o bot "{deletingBot?.nome}"? 
              Esta ação não pode ser desfeita e os robôs que usam este bot 
              não conseguirão mais enviar notificações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingBot && deleteBotMutation.mutate(deletingBot.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Remover Bot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
