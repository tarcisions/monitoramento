import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // Proxy API requests to Python backend
  app.use('/api', (req, res) => {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const url = `${backendUrl}${req.originalUrl}`;
    
    res.status(503).json({ 
      message: "Backend não disponível. Configure BACKEND_URL ou inicie o backend Python.",
      url: url
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
