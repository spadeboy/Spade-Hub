import type { Express } from "express";
import type { Server } from "http";
import { setupAuth } from "./hub_integrations/auth";
import { registerAuthRoutes } from "./hub_integrations/auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerObjectStorageRoutes } from "./hub_integrations/object_storage";
import { db } from "./db";
import { users, torrents } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // --- FIX: AUTO-CREATE ADMIN USER ---
  // The database requires the ID to be a STRING (Text).
  try {
    const adminUser = await db.query.users.findFirst({
      where: eq(users.id, "1"), // <--- FIXED: "1" (String)
    });

    if (!adminUser) {
      console.log("⚠️ Admin User not found. Creating him now...");
      await db.insert(users).values({
        id: "1", // <--- FIXED: "1" (String)
        email: "ashiksa88@gmail.com",
        username: "ashiksa88",
        displayName: "Spade Admin",
      });
      console.log("✅ Admin User created successfully!");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
  // -----------------------------------

  // --- FORCE ADMIN LOGIN MIDDLEWARE ---
  app.use((req, res, next) => {
    // @ts-ignore
    req.isAuthenticated = () => true; 
    // @ts-ignore
    req.user = {
      id: "1", // <--- FIXED: "1" (String)
      username: "ashiksa88",
      displayName: "Spade Admin",
      email: "ashiksa88@gmail.com"
    };
    next();
  });

  registerObjectStorageRoutes(app);

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

  // Create torrent
  app.post(api.torrents.create.path, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.email !== "ashiksa88@gmail.com") {
        return res.status(403).json({ message: "Only ashiksa88@gmail.com can upload torrents" });
      }

      const input = api.torrents.create.input.parse(req.body);
      
      const torrent = await storage.createTorrent({
        ...input,
        createdById: user.id // This is now "1" (String)
      });
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

  // Update torrent
  app.put(api.torrents.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getTorrent(id);
      
      if (!existing) {
        return res.status(404).json({ message: "Torrent not found" });
      }

      const user = req.user as any;
      if (user.email !== "ashiksa88@gmail.com") {
        return res.status(403).json({ message: "Only ashiksa88@gmail.com can edit torrents" });
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

  // Delete torrent
  app.delete(api.torrents.delete.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getTorrent(id);
      
      if (!existing) {
        return res.status(404).json({ message: "Torrent not found" });
      }

      const user = req.user as any;
      if (user.email !== "ashiksa88@gmail.com") {
        return res.status(403).json({ message: "Only ashiksa88@gmail.com can delete torrents" });
      }

      await storage.deleteTorrent(id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete torrent error:', error);
      res.status(500).json({ message: "Failed to delete torrent" });
    }
  });

  return httpServer;
}