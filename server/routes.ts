import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./replit_integrations/auth";
import { registerAuthRoutes } from "./replit_integrations/auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up Replit Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // === TORRENTS API ===

  // List all torrents
  app.get(api.torrents.list.path, async (req, res) => {
    try {
      const { search, category, sort } = req.query;
      const params = {
        search: search as string,
        category: category as string,
        sort: sort as 'newest' | 'oldest'
      };
      
      const torrents = await storage.getTorrents(params);
      res.json(torrents);
    } catch (error) {
      console.error('List torrents error:', error);
      res.status(500).json({ message: "Failed to list torrents" });
    }
  });

  // Get specific torrent
  app.get(api.torrents.get.path, async (req, res) => {
    try {
      const torrent = await storage.getTorrent(Number(req.params.id));
      if (!torrent) {
        return res.status(404).json({ message: "Torrent not found" });
      }
      res.json(torrent);
    } catch (error) {
      console.error('Get torrent error:', error);
      res.status(500).json({ message: "Failed to get torrent" });
    }
  });

  // Create torrent (Protected)
  app.post(api.torrents.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.torrents.create.input.parse(req.body);
      
      // Add current user as creator
      const user = req.user as any;
      const torrentData = {
        ...input,
        createdById: user.claims.sub
      };

      const torrent = await storage.createTorrent(torrentData);
      res.status(201).json(torrent);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Create torrent error:', err);
      res.status(500).json({ message: "Failed to create torrent" });
    }
  });

  // Update torrent (Protected & Owner only)
  app.put(api.torrents.update.path, isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getTorrent(id);
      
      if (!existing) {
        return res.status(404).json({ message: "Torrent not found" });
      }

      // Check ownership
      const user = req.user as any;
      if (existing.createdById !== user.claims.sub) {
        return res.status(403).json({ message: "You can only edit your own torrents" });
      }

      const input = api.torrents.update.input.parse(req.body);
      const updated = await storage.updateTorrent(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Update torrent error:', err);
      res.status(500).json({ message: "Failed to update torrent" });
    }
  });

  // Delete torrent (Protected & Owner only)
  app.delete(api.torrents.delete.path, isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getTorrent(id);
      
      if (!existing) {
        return res.status(404).json({ message: "Torrent not found" });
      }

      // Check ownership
      const user = req.user as any;
      if (existing.createdById !== user.claims.sub) {
        return res.status(403).json({ message: "You can only delete your own torrents" });
      }

      await storage.deleteTorrent(id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete torrent error:', error);
      res.status(500).json({ message: "Failed to delete torrent" });
    }
  });

  // Seed Data Endpoint (for testing/demo)
  // In production this would be removed or protected
  app.post("/api/seed", async (req, res) => {
    try {
      // Check if data exists
      const existing = await storage.getTorrents();
      if (existing.length > 0) {
         return res.json({ message: "Database already seeded" });
      }

      // We need a user to attribute these to.
      // If no user exists, we can't seed properly with FK constraint.
      // So we'll skip seeding if no user is found, or we could insert a dummy user?
      // Since we use Replit Auth, we can't easily fake a user ID that corresponds to a real login.
      // BUT, we can insert a dummy user into the 'users' table since we have access to it via drizzle.
      
      // Let's rely on manual creation for now to avoid FK issues with auth table
      // Or we can just create a dummy user.
      
      res.json({ message: "Please create an account and post a torrent to seed!" });
      
    } catch (error) {
      console.error('Seed error:', error);
      res.status(500).json({ message: "Seed failed" });
    }
  });

  return httpServer;
}
