import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, uuid, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senha_hash: text("senha_hash").notNull(),
  role: text("role").notNull().default("operador"), // admin, operador, visualizador
  ativo: boolean("ativo").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const telegram_bots = pgTable("telegram_bots", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  token: text("token").notNull(),
  default_chat_id: text("default_chat_id"),
  ativo: boolean("ativo").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const robots = pgTable("robots", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  status: text("status").notNull().default("idle"), // idle, executando, pausado, parado, erro
  ultima_execucao_at: timestamp("ultima_execucao_at"),
  telegram_bot_id: uuid("telegram_bot_id").references(() => telegram_bots.id),
  telegram_chat_id: text("telegram_chat_id"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const executions = pgTable("executions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  robot_id: uuid("robot_id").notNull().references(() => robots.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("em_andamento"), // em_andamento, concluida, falha, cancelada
  started_at: timestamp("started_at").notNull().defaultNow(),
  finished_at: timestamp("finished_at"),
  erro: text("erro"),
  itens_processados: integer("itens_processados").notNull().default(0),
  duracao_segundos: real("duracao_segundos"),
  parametros: jsonb("parametros"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const execution_logs = pgTable("execution_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  execution_id: uuid("execution_id").notNull().references(() => executions.id, { onDelete: "cascade" }),
  ts: timestamp("ts").notNull().defaultNow(),
  nivel: text("nivel").notNull(), // INFO, ERROR, WARNING, DEBUG
  mensagem: text("mensagem").notNull(),
  dados: jsonb("dados"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertTelegramBotSchema = createInsertSchema(telegram_bots).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertRobotSchema = createInsertSchema(robots).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertExecutionSchema = createInsertSchema(executions).omit({
  id: true,
  created_at: true,
});

export const insertExecutionLogSchema = createInsertSchema(execution_logs).omit({
  id: true,
  created_at: true,
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

// Update schemas
export const updateRobotSchema = insertRobotSchema.partial();
export const updateTelegramBotSchema = insertTelegramBotSchema.partial();

// Select types
export type User = typeof users.$inferSelect;
export type TelegramBot = typeof telegram_bots.$inferSelect;
export type Robot = typeof robots.$inferSelect;
export type Execution = typeof executions.$inferSelect;
export type ExecutionLog = typeof execution_logs.$inferSelect;

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTelegramBot = z.infer<typeof insertTelegramBotSchema>;
export type InsertRobot = z.infer<typeof insertRobotSchema>;
export type InsertExecution = z.infer<typeof insertExecutionSchema>;
export type InsertExecutionLog = z.infer<typeof insertExecutionLogSchema>;
export type LoginData = z.infer<typeof loginSchema>;
