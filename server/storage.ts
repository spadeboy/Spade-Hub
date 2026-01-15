import { 
  torrents, 
  users,
  type Torrent, 
  type InsertTorrent, 
  type UpdateTorrentRequest,
  type TorrentsQueryParams,
  type TorrentWithAuthor
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, and } from "drizzle-orm";

export interface IStorage {
  // Torrents
  getTorrents(params?: TorrentsQueryParams): Promise<TorrentWithAuthor[]>;
  getTorrent(id: number): Promise<TorrentWithAuthor | undefined>;
  createTorrent(torrent: InsertTorrent): Promise<Torrent>;
  updateTorrent(id: number, updates: UpdateTorrentRequest): Promise<Torrent>;
  deleteTorrent(id: number): Promise<void>;
  
  // Helpers
  getUserTorrents(userId: string): Promise<TorrentWithAuthor[]>;
}

export class DatabaseStorage implements IStorage {
  async getTorrents(params?: TorrentsQueryParams): Promise<TorrentWithAuthor[]> {
    let query = db.select({
      id: torrents.id,
      title: torrents.title,
      description: torrents.description,
      magnetLink: torrents.magnetLink,
      imageUrl: torrents.imageUrl,
      category: torrents.category,
      createdById: torrents.createdById,
      createdAt: torrents.createdAt,
    })
    .from(torrents);

    const conditions = [];

    if (params?.search && params.search !== 'undefined' && params.search !== '' && params.search !== 'null') {
      conditions.push(ilike(torrents.title, `%${params.search}%`));
    }

    if (params?.category && params.category !== 'all' && params.category !== 'undefined' && params.category !== 'null') {
      conditions.push(eq(torrents.category, params.category));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Default sort by newest
    if (!params?.sort || params.sort === 'newest') {
      query = query.orderBy(desc(torrents.createdAt)) as any;
    } else if (params.sort === 'oldest') {
      query = query.orderBy(torrents.createdAt) as any;
    }

    const results = await query;
    return results;
  }

  async getTorrent(id: number): Promise<TorrentWithAuthor | undefined> {
    const [torrent] = await db.select({
      id: torrents.id,
      title: torrents.title,
      description: torrents.description,
      magnetLink: torrents.magnetLink,
      imageUrl: torrents.imageUrl,
      category: torrents.category,
      createdById: torrents.createdById,
      createdAt: torrents.createdAt,
    })
    .from(torrents)
    .where(eq(torrents.id, id));
    
    return torrent;
  }

  async createTorrent(insertTorrent: InsertTorrent & { createdById: string }): Promise<Torrent> {
    const [torrent] = await db
      .insert(torrents)
      .values(insertTorrent)
      .returning();
    return torrent;
  }

  async updateTorrent(id: number, updates: UpdateTorrentRequest): Promise<Torrent> {
    const [torrent] = await db
      .update(torrents)
      .set(updates)
      .where(eq(torrents.id, id))
      .returning();
    return torrent;
  }

  async deleteTorrent(id: number): Promise<void> {
    await db.delete(torrents).where(eq(torrents.id, id));
  }

  async getUserTorrents(userId: string): Promise<TorrentWithAuthor[]> {
     return await db.select({
      id: torrents.id,
      title: torrents.title,
      description: torrents.description,
      magnetLink: torrents.magnetLink,
      imageUrl: torrents.imageUrl,
      category: torrents.category,
      createdById: torrents.createdById,
      createdAt: torrents.createdAt,
    })
    .from(torrents)
    .where(eq(torrents.createdById, userId))
    .orderBy(desc(torrents.createdAt));
  }
}

export const storage = new DatabaseStorage();
