// Path: backend/src/routes/apis.ts
// FINAL CORRECTED VERSION

import { Hono, Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq, DrizzleError } from 'drizzle-orm';
import { createLogger } from '../logging/index.js';
import { withTransaction } from '../db/transactions.js';
import crypto from 'node:crypto';

const logger = createLogger('routes:management:apis');

// Zod schema for creating a new API.
const createApiSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase with dashes only."),
  description: z.string().optional(),
  type: z.enum(['http', 'websocket', 'rpc']).default('http'),
  config: z.record(z.any()).default({})
});

// Zod schema for updating an API.
const updateApiSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase with dashes only.").optional(),
  description: z.string().optional().nullable(),
  type: z.enum(['http', 'websocket', 'rpc']).optional(),
  config: z.record(z.any()).optional()
});

// Helper to calculate a consistent hash for a JSON object.
const calculateHash = (content: any): string => {
   const stringified = JSON.stringify(content, Object.keys(content).sort());
   return crypto.createHash("sha256").update(stringified).digest("hex");
};

export function setupApiManagementRoutes() {
  const managementApi = new Hono();

  // List all APIs
  managementApi.get('/', async (c: Context) => {
    try {
      const apis = await db.select().from(schema.apis).orderBy(schema.apis.name);
      return c.json({ success: true, data: apis });
    } catch (error) {
        logger.error('Failed to list APIs', { error });
        return c.json({ success: false, error: 'Failed to list APIs' }, 500);
    }
  });

  // Create a new API
  managementApi.post('/', zValidator('json', createApiSchema), async (c: Context) => {
    try {
      const body = c.req.valid('json');
      const configString = JSON.stringify(body.config);
      
      const newApi = await withTransaction(c, 'create api', async (tx) => {
        const insertData = {
          name: body.name,
          slug: body.slug,
          description: body.description,
          type: body.type,
          config: configString,
          configHash: calculateHash(body.config),
        };
        
        const result = await tx.insert(schema.apis)
          .values(insertData)
          .returning();
          
        return result;
      });

      if (!newApi || newApi.length === 0) {
        throw new Error('Failed to create API');
      }

      logger.info('Created new API', { id: newApi[0].id, name: newApi[0].name });
      return c.json({ success: true, data: newApi[0] }, 201);
    } catch (error) {
        if (error instanceof DrizzleError && error.message.includes('UNIQUE constraint failed')) {
            return c.json({ success: false, error: 'An API with that slug already exists.' }, 409);
        }
        logger.error('Failed to create API', { error });
        return c.json({ success: false, error: 'Failed to create API' }, 500);
    }
  });
  
  // Get a single API by ID
  managementApi.get('/:id', async (c: Context) => {
      const id = parseInt(c.req.param('id'), 10);
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);

      const api = await db.query.apis.findFirst({ 
        where: eq(schema.apis.id, id) 
      });

      if (!api) return c.json({ success: false, error: 'API not found' }, 404);
      return c.json({ success: true, data: api });
  });

  // Update an API
  managementApi.patch('/:id', zValidator('json', updateApiSchema), async (c: Context) => {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);
    
    const body = c.req.valid('json');
    
    const [updatedApi] = await withTransaction(c, 'update api', async (tx) => {
      const currentApi = await tx.query.apis.findFirst({ where: eq(schema.apis.id, id) });
      if (!currentApi) return [];

      const currentConfig = JSON.parse(currentApi.config || '{}');
      const newConfig = { ...currentConfig, ...(body.config || {}) };
      
      const updateData: Partial<typeof schema.apis.$inferInsert> = {};
      
      if (body.name !== undefined) updateData.name = body.name;
      if (body.slug !== undefined) updateData.slug = body.slug;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.type !== undefined) updateData.type = body.type;
      
      updateData.config = JSON.stringify(newConfig);
      updateData.configHash = calculateHash(newConfig);
      updateData.updatedAt = new Date().toISOString();
      
      return tx.update(schema.apis)
        .set(updateData)
        .where(eq(schema.apis.id, id))
        .returning();
    });

    if (!updatedApi) return c.json({ success: false, error: 'API not found' }, 404);

    logger.info('Updated API', { id });
    return c.json({ success: true, data: updatedApi });
  });

  // Delete an API
  managementApi.delete('/:id', async (c: Context) => {
      const id = parseInt(c.req.param('id'), 10);
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);

      const result = await withTransaction(c, 'delete api', async (tx) => {
          await tx.delete(schema.endpoints).where(eq(schema.endpoints.apiId, id));
          return tx.delete(schema.apis).where(eq(schema.apis.id, id)).returning();
      });

      if (result.length === 0) {
        return c.json({ success: false, error: 'API not found' }, 404);
      }

      logger.info('Deleted API', { id });
      return c.json({ success: true, message: 'API deleted successfully.' });
  });

  return managementApi;
}