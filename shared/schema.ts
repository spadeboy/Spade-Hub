import { pgTable, text, serial, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
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
  category: text("category").notNull(), // Movies, Games, Music, Software, Other
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const torrentsRelations = relations(torrents, ({ one }) => ({
  author: one(users, {
    fields: [torrents.createdById],
    references: [users.id],
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

// === EXPLICIT API CONTRACT TYPES ===
export type Torrent = typeof torrents.$inferSelect;
export type InsertTorrent = z.infer<typeof insertTorrentSchema>;

export type CreateTorrentRequest = InsertTorrent;
export type UpdateTorrentRequest = Partial<InsertTorrent>;

// Response types
// We often want to include the author info in the list
export type TorrentWithAuthor = Torrent & {
  author?: {
    username: string | null; // users table has firstName/lastName/email, but we might just use first name or email as display
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  }
};

export type TorrentsListResponse = TorrentWithAuthor[];

export interface TorrentsQueryParams {
  search?: string;
  category?: string;
  sort?: 'newest' | 'oldest';
}
