import { pgTable, text, serial, timestamp, varchar, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users } from "./models/auth";

// Export Auth Models
export * from "./models/auth";

// === TABLE DEFINITIONS ===
export const torrents = pgTable("torrents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  magnetLink: text("magnet_link").notNull(),
  imageUrl: text("image_url"),
  category: text("category").notNull(), // Movies, Games, Music, Software, Anime
  releaseYear: integer("release_year"), // Optional release year
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// NEW: Comments Table (Community Board)
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  torrentId: integer("torrent_id").notNull().references(() => torrents.id, { onDelete: 'cascade' }),
  text: text("text").notNull(),
  emoji: text("emoji").notNull(),     // Stores the random emoji (👻)
  colorClass: text("color_class").notNull(), // Stores the random color
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const torrentsRelations = relations(torrents, ({ one, many }) => ({
  author: one(users, {
    fields: [torrents.createdById],
    references: [users.id],
  }),
  comments: many(comments), // Relation to comments
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  torrent: one(torrents, {
    fields: [comments.torrentId],
    references: [torrents.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  torrents: many(torrents),
}));

// === BASE SCHEMAS ===
export const insertTorrentSchema = createInsertSchema(torrents).omit({
  id: true,
  createdAt: true,
  createdById: true
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true
});

// === EXPLICIT API CONTRACT TYPES ===
export type Torrent = typeof torrents.$inferSelect;
export type InsertTorrent = z.infer<typeof insertTorrentSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type CreateTorrentRequest = InsertTorrent;
export type UpdateTorrentRequest = Partial<InsertTorrent>;

// Response types
// No author info included to maintain uploader anonymity
export type TorrentWithAuthor = Torrent;

export type TorrentsListResponse = TorrentWithAuthor[];

export interface TorrentsQueryParams {
  search?: string;
  category?: string;
  sort?: 'newest' | 'oldest';
}