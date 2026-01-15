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

  // Create torrent (Protected - Admin Only)
  app.post(api.torrents.create.path, isAuthenticated, async (req, res) => {
    try {
      // Check if user is admin (specific email)
      const user = req.user as any;
      if (user.claims.email !== "ashiksa88@gmail.com") {
        return res.status(403).json({ message: "Only the site owner can upload torrents" });
      }

      const input = api.torrents.create.input.parse(req.body);
      
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
      if (existing.createdById !== user.claims.sub && user.claims.email !== "ashiksa88@gmail.com") {
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
      if (existing.createdById !== user.claims.sub && user.claims.email !== "ashiksa88@gmail.com") {
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

      // We'll attribute these to the admin user
      const adminEmail = "ashiksa88@gmail.com";
      const usersList = await db.select().from(users).where(eq(users.email, adminEmail));
      
      let adminId: string;
      if (usersList.length === 0) {
        // If user not found, create a placeholder so seeds are visible
        // The user will naturally take over this data when they log in
        adminId = "placeholder-admin-id";
        await db.insert(users).values({
          id: adminId,
          email: adminEmail,
          firstName: "Spade",
        });
      } else {
        adminId = usersList[0].id;
      }
      
      // Seed some data
      await storage.createTorrent({
        title: "Inception (2010)",
        description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
        magnetLink: "magnet:?xt=urn:btih:EXAMPLE_HASH_1&dn=Inception",
        imageUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1",
        category: "Movies",
        createdById: adminId
      });

      await storage.createTorrent({
        title: "Cyberpunk 2077",
        description: "An open-world, action-adventure story set in Night City, a megalopolis obsessed with power, glamour and body modification.",
        magnetLink: "magnet:?xt=urn:btih:EXAMPLE_HASH_2&dn=Cyberpunk2077",
        imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e",
        category: "Games",
        createdById: adminId
      });
      
      res.json({ message: "Database seeded with example torrents!" });
      
    } catch (error) {
      console.error('Seed error:', error);
      res.status(500).json({ message: "Seed failed" });
    }
  });

  return httpServer;
}
