import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const robotSchema = z.object({
  slug: z.string().min(1, "Slug é obrigatório").regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  telegram_bot_id: z.string().optional(),
  telegram_chat_id: z.string().optional(),
});

type RobotForm = z.infer<typeof robotSchema>;

interface AddRobotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddRobotModal({ open, onOpenChange }: AddRobotModalProps) {
  const { toast } = useToast();
  
  const form = useForm<RobotForm>({
    resolver: zodResolver(robotSchema),
    defaultValues: {
      slug: "",
      nome: "",
      descricao: "",
      telegram_bot_id: "",
      telegram_chat_id: "",
    },
  });

  // Fetch Telegram bots for selection
  const { data: telegramBots = [] } = useQuery({
    queryKey: ['/api/telegram-bots'],
    enabled: open,
  });

  const createRobotMutation = useMutation({
    mutationFn: async (data: RobotForm) => {
      const response = await apiRequest('POST', '/api/robots', {
        ...data,
        telegram_bot_id: data.telegram_bot_id || undefined,
        telegram_chat_id: data.telegram_chat_id || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/robots'] });
      queryClient.invalidateQueries({ queryKey: ['/api/robots/stats/dashboard'] });
      toast({
        title: "Robô criado com sucesso",
        description: "O robô foi adicionado ao sistema",
        variant: "default",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar robô",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RobotForm) => {
    createRobotMutation.mutate(data);
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Keep only letters, numbers, spaces, and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    
    form.setValue('slug', slug);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" data-testid="modal-add-robot">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Robô</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Robô</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Processador de Faturas"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleNameChange(e.target.value);
                      }}
                      data-testid="input-robot-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (Identificador único)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: processador-faturas"
                      {...field}
                      data-testid="input-robot-slug"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva a função do robô"
                      rows={3}
                      {...field}
                      data-testid="textarea-robot-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telegram_bot_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bot do Telegram (opcional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-telegram-bot">
                        <SelectValue placeholder="Selecione um bot" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {telegramBots.map((bot: any) => (
                        <SelectItem key={bot.id} value={bot.id}>
                          {bot.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telegram_chat_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chat ID do Telegram (opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: -1001234567890"
                      {...field}
                      data-testid="input-telegram-chat-id"
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
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createRobotMutation.isPending}
                data-testid="button-create"
              >
                {createRobotMutation.isPending ? 'Criando...' : 'Criar Robô'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
