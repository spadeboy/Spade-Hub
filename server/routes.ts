import type { Express } from "express";
import type { Server } from "http";
import { setupAuth, registerAuthRoutes } from "./hub_integrations/auth";
import { registerObjectStorageRoutes } from "./hub_integrations/object_storage";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { db } from "./db";
import { users, torrents, insertCommentSchema } from "@shared/schema"; // Added insertCommentSchema
import { eq } from "drizzle-orm";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // --- FIX: AUTO-CREATE ADMIN USER ---
  try {
    const adminUser = await db.query.users.findFirst({
      where: eq(users.id, "1"), 
    });

    if (!adminUser) {
      console.log("⚠️ Admin User not found. Creating him now...");
      await db.insert(users).values({
        id: "1",
        email: "ashiksa88@gmail.com",
        username: "ashiksa88",
        displayName: "Spade Admin",
      });
      console.log("✅ Admin User created successfully!");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }

  // --- FORCE ADMIN LOGIN MIDDLEWARE ---
  app.use((req, res, next) => {
    // @ts-ignore
    req.isAuthenticated = () => true; 
    // @ts-ignore
    req.user = {
      id: "1", 
      username: "ashiksa88",
      displayName: "Spade Admin",
      email: "ashiksa88@gmail.com"
    };
    next();
  });

  registerAuthRoutes(app);
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
      // FIX: Cast req to any to access .user safely
      const user = (req as any).user;
      
      if (user.email !== "ashiksa88@gmail.com") {
        return res.status(403).json({ message: "Only ashiksa88@gmail.com can upload torrents" });
      }

      const input = api.torrents.create.input.parse(req.body);
      
      const torrent = await storage.createTorrent({
        ...input,
        createdById: user.id
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

      // FIX: Cast req to any
      const user = (req as any).user;
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

      // FIX: Cast req to any
      const user = (req as any).user;
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

  // --- NEW COMMENT ROUTES ---
  
  // Get Comments for a Torrent
  app.get("/api/torrents/:id/comments", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const comments = await storage.getComments(id);
      res.json(comments);
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ message: "Failed to get comments" });
    }
  });

  // Post a Comment
  app.post("/api/torrents/:id/comments", async (req, res) => {
    try {
      const torrentId = parseInt(req.params.id);
      // Validate body using schema (ensure torrentId is passed correctly)
      const data = insertCommentSchema.parse({ ...req.body, torrentId });
      
      const comment = await storage.createComment(data);
      res.status(201).json(comment);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Create comment error:', error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  return httpServer;
}