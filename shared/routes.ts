import { z } from 'zod';
import { insertTorrentSchema, torrents } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  torrents: {
    list: {
      method: 'GET' as const,
      path: '/api/torrents',
      input: z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        sort: z.enum(['newest', 'oldest']).optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof torrents.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/torrents/:id',
      responses: {
        200: z.custom<typeof torrents.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/torrents',
      input: insertTorrentSchema.omit({ createdById: true }),
      responses: {
        201: z.custom<typeof torrents.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/torrents/:id',
      input: insertTorrentSchema.partial(),
      responses: {
        200: z.custom<typeof torrents.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/torrents/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
};

// ============================================
// REQUIRED: buildUrl helper
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type TorrentInput = z.infer<typeof api.torrents.create.input>;
export type TorrentResponse = z.infer<typeof api.torrents.create.responses[201]>;
export type TorrentUpdateInput = z.infer<typeof api.torrents.update.input>;
