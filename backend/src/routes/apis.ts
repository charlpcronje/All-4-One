import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.ts';
import * as schema from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { createLogger } from '../logging/index.ts';
import { withReadQuery, withTransaction, withWriteQuery } from '../db/transactions.ts';
import { apiRequest, invalidateCache } from '../api/client.ts';

// Logger for API routes
const logger = createLogger('routes:apis');

// API router
const app = new Hono();

// Schema for API creation
const createApiSchema = z.object({
  name: z.string().min(1).max(100),
  baseUrl: z.string().url().max(255),
  description: z.string().max(500).optional(),
  authType: z.enum(['none', 'bearer', 'apikey', 'basic']).optional(),
  authToken: z.string().max(500).optional(),
  authHeader: z.string().max(100).optional(),
  headers: z.record(z.string()).optional(),
  timeout: z.number().int().min(1000).max(60000).optional(), // 1s to 60s
  retries: z.number().int().min(0).max(10).optional(),
  active: z.boolean().optional().default(true)
});

// Schema for API updates
const updateApiSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  baseUrl: z.string().url().max(255).optional(),
  description: z.string().max(500).optional().nullable(),
  authType: z.enum(['none', 'bearer', 'apikey', 'basic']).optional(),
  authToken: z.string().max(500).optional().nullable(),
  authHeader: z.string().max(100).optional().nullable(),
  headers: z.record(z.string()).optional().nullable(),
  timeout: z.number().int().min(1000).max(60000).optional(), // 1s to 60s
  retries: z.number().int().min(0).max(10).optional(),
  active: z.boolean().optional()
});

// Schema for testing an API endpoint
const testApiSchema = z.object({
  endpoint: z.string().max(255),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
  timeout: z.number().int().min(1000).max(60000).optional()
});

// Schema for cache invalidation
const invalidateCacheSchema = z.object({
  tags: z.array(z.string()).optional(),
  urls: z.array(z.string()).optional()
});

// List all APIs
app.get('/', async (c) => {
  try {
    const apis = await withReadQuery(c, 'list apis', async () => {
      return await db.select().from(schema.apis).orderBy(schema.apis.name);
    });

    return c.json({
      success: true,
      data: apis.map(api => ({
        ...api,
        authToken: api.authToken ? '••••••••' : null // Mask auth token in response
      }))
    });
  } catch (error) {
    logger.error('Failed to list APIs', { error });
    return c.json({
      success: false,
      error: 'Failed to list APIs'
    }, 500);
  }
});

// Create a new API
app.post('/', zValidator('json', createApiSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    
    const [api] = await withWriteQuery(c, 'create api', async () => {
      return await db.insert(schema.apis)
        .values({
          name: body.name,
          baseUrl: body.baseUrl,
          description: body.description || null,
          authType: body.authType || 'none',
          authToken: body.authToken || null,
          authHeader: body.authHeader || null,
          headers: body.headers ? JSON.stringify(body.headers) : null,
          timeout: body.timeout || 30000,
          retries: body.retries ?? 3,
          active: body.active ?? true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
    });
    
    logger.info('Created new API', { id: api.id, name: api.name });
    
    return c.json({
      success: true,
      data: {
        ...api,
        authToken: api.authToken ? '••••••••' : null // Mask auth token in response
      }
    }, 201);
  } catch (error) {
    logger.error('Failed to create API', { error });
    return c.json({
      success: false,
      error: 'Failed to create API'
    }, 500);
  }
});

// Get a single API by ID
app.get('/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid API ID'
      }, 400);
    }
    
    const api = await withReadQuery(c, 'get api', async () => {
      return await db.query.apis.findFirst({
        where: eq(schema.apis.id, id)
      });
    });
    
    if (!api) {
      return c.json({
        success: false,
        error: 'API not found'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: {
        ...api,
        authToken: api.authToken ? '••••••••' : null // Mask auth token in response
      }
    });
  } catch (error) {
    logger.error('Failed to get API', { error });
    return c.json({
      success: false,
      error: 'Failed to get API'
    }, 500);
  }
});

// Update an API
app.patch('/:id', zValidator('json', updateApiSchema), async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const body = c.req.valid('json');
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid API ID'
      }, 400);
    }
    
    // Ensure API exists
    const exists = await withReadQuery(c, 'check api exists', async () => {
      return await db.query.apis.findFirst({
        where: eq(schema.apis.id, id)
      });
    });
    
    if (!exists) {
      return c.json({
        success: false,
        error: 'API not found'
      }, 404);
    }
    
    // Process headers if provided
    let headers = undefined;
    if (body.headers !== undefined) {
      headers = body.headers ? JSON.stringify(body.headers) : null;
    }
    
    // Update API
    const [updatedApi] = await withWriteQuery(c, 'update api', async () => {
      return await db.update(schema.apis)
        .set({
          ...(body.name !== undefined && { name: body.name }),
          ...(body.baseUrl !== undefined && { baseUrl: body.baseUrl }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.authType !== undefined && { authType: body.authType }),
          ...(body.authToken !== undefined && { authToken: body.authToken }),
          ...(body.authHeader !== undefined && { authHeader: body.authHeader }),
          ...(headers !== undefined && { headers }),
          ...(body.timeout !== undefined && { timeout: body.timeout }),
          ...(body.retries !== undefined && { retries: body.retries }),
          ...(body.active !== undefined && { active: body.active }),
          updatedAt: new Date()
        })
        .where(eq(schema.apis.id, id))
        .returning();
    });
    
    logger.info('Updated API', { id });
    
    return c.json({
      success: true,
      data: {
        ...updatedApi,
        authToken: updatedApi.authToken ? '••••••••' : null
      }
    });
  } catch (error) {
    logger.error('Failed to update API', { error });
    return c.json({
      success: false,
      error: 'Failed to update API'
    }, 500);
  }
});

// Delete an API
app.delete('/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid API ID'
      }, 400);
    }
    
    // Delete API with transaction to handle related data
    await withTransaction(c, 'delete api', async (tx) => {
      // First check if API exists
      const api = await tx.query.apis.findFirst({
        where: eq(schema.apis.id, id)
      });
      
      if (!api) {
        throw new Error('API not found');
      }
      
      // Delete endpoints related to this API
      await tx.delete(schema.endpoints)
        .where(eq(schema.endpoints.apiId, id));
      
      // Delete retry schedule entries for this API
      await tx.delete(schema.retrySchedule)
        .where(eq(schema.retrySchedule.apiId, id));
      
      // Then delete the API
      await tx.delete(schema.apis)
        .where(eq(schema.apis.id, id));
    });
    
    logger.info('Deleted API', { id });
    
    return c.json({
      success: true,
      message: 'API deleted successfully'
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'API not found') {
      return c.json({
        success: false,
        error: 'API not found'
      }, 404);
    }
    
    logger.error('Failed to delete API', { error });
    return c.json({
      success: false,
      error: 'Failed to delete API'
    }, 500);
  }
});

// Test an API endpoint
app.post('/:id/test', zValidator('json', testApiSchema), async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const body = c.req.valid('json');
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid API ID'
      }, 400);
    }
    
    // Check if API exists
    const api = await withReadQuery(c, 'check api exists for test', async () => {
      return await db.query.apis.findFirst({
        where: eq(schema.apis.id, id)
      });
    });
    
    if (!api) {
      return c.json({
        success: false,
        error: 'API not found'
      }, 404);
    }
    
    if (!api.active) {
      return c.json({
        success: false,
        error: 'Cannot test inactive API'
      }, 400);
    }
    
    // Make the API request
    const response = await apiRequest(
      id,
      body.endpoint,
      {
        method: body.method,
        headers: body.headers,
        body: body.body,
        timeout: body.timeout,
        useCache: false // Don't use cache for test requests
      }
    );
    
    logger.info('Tested API endpoint', { 
      id, 
      endpoint: body.endpoint, 
      status: response.status,
      success: response.success
    });
    
    return c.json({
      success: true,
      data: response
    });
  } catch (error) {
    logger.error('Failed to test API endpoint', { error });
    return c.json({
      success: false,
      error: 'Failed to test API endpoint'
    }, 500);
  }
});

// List all endpoints for an API
app.get('/:id/endpoints', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid API ID'
      }, 400);
    }
    
    // Check if API exists
    const api = await withReadQuery(c, 'check api exists', async () => {
      return await db.query.apis.findFirst({
        where: eq(schema.apis.id, id)
      });
    });
    
    if (!api) {
      return c.json({
        success: false,
        error: 'API not found'
      }, 404);
    }
    
    // Get endpoints
    const endpoints = await withReadQuery(c, 'list api endpoints', async () => {
      return await db.select()
        .from(schema.endpoints)
        .where(eq(schema.endpoints.apiId, id))
        .orderBy(schema.endpoints.path);
    });
    
    return c.json({
      success: true,
      data: endpoints
    });
  } catch (error) {
    logger.error('Failed to list API endpoints', { error });
    return c.json({
      success: false,
      error: 'Failed to list API endpoints'
    }, 500);
  }
});

// Create a new endpoint for an API
app.post('/:id/endpoints', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid API ID'
      }, 400);
    }
    
    // Validate required fields
    if (!body.path || !body.method) {
      return c.json({
        success: false,
        error: 'Path and method are required'
      }, 400);
    }
    
    // Ensure API exists
    const api = await withReadQuery(c, 'check api exists', async () => {
      return await db.query.apis.findFirst({
        where: eq(schema.apis.id, id)
      });
    });
    
    if (!api) {
      return c.json({
        success: false,
        error: 'API not found'
      }, 404);
    }
    
    // Create endpoint
    const [endpoint] = await withWriteQuery(c, 'create endpoint', async () => {
      return await db.insert(schema.endpoints)
        .values({
          apiId: id,
          path: body.path,
          method: body.method,
          description: body.description || null,
          parameters: body.parameters ? JSON.stringify(body.parameters) : null,
          headers: body.headers ? JSON.stringify(body.headers) : null,
          body: body.body ? JSON.stringify(body.body) : null,
          cacheTtl: body.cacheTtl || 300,
          timeout: body.timeout || api.timeout || 30000,
          retries: body.retries ?? api.retries ?? 3,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
    });
    
    logger.info('Created new endpoint', { 
      apiId: id, 
      path: endpoint.path, 
      method: endpoint.method 
    });
    
    return c.json({
      success: true,
      data: endpoint
    }, 201);
  } catch (error) {
    logger.error('Failed to create endpoint', { error });
    return c.json({
      success: false,
      error: 'Failed to create endpoint'
    }, 500);
  }
});

// Invalidate cache
app.post('/cache/invalidate', zValidator('json', invalidateCacheSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    
    if ((!body.tags || body.tags.length === 0) && (!body.urls || body.urls.length === 0)) {
      return c.json({
        success: false,
        error: 'Either tags or urls must be provided'
      }, 400);
    }
    
    const invalidated = await invalidateCache({
      tags: body.tags,
      urls: body.urls
    });
    
    logger.info('Invalidated cache entries', { 
      count: invalidated,
      tags: body.tags,
      urls: body.urls 
    });
    
    return c.json({
      success: true,
      data: {
        invalidated
      }
    });
  } catch (error) {
    logger.error('Failed to invalidate cache', { error });
    return c.json({
      success: false,
      error: 'Failed to invalidate cache'
    }, 500);
  }
});

export function setupApiRoutes() {
  return app;
}
