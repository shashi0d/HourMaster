import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // This is a client-side PWA app using IndexedDB
  // Server routes can be added here if needed for future features
  
  const httpServer = createServer(app);

  return httpServer;
}
