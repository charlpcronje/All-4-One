import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { createLogger } from '../logging/index.js';
import { withReadQuery, withTransaction, withWriteQuery } from '../db/transactions.js';
import { registerWebhook, WebhookEvent, deliverWebhook } from '../webhooks/index.js';

// Logger for webhook routes
const logger = createLogger('routes:webhooks');

// Webhook API router
const app = new Hono();

// Schema for webhook creation
const createWebhookSchema = z.object({
  url: z.string().url().max(255),
  event: z.enum([
    'api.request', 
    'api.response', 
    'cache.hit', 
    'cache.miss', 
    'error', 
    'retry', 
    'system'
  ]),
  secret: z.string().max(255).optional(),
  description: z.string().max(500).optional()
});

// Schema for webhook updates
const updateWebhookSchema = z.object({
  url: z.string().url().max(255).optional(),
  active: z.boolean().optional(),
  secret: z.string().max(255).optional().nullable(),
  description: z.string().max(500).optional().nullable()
});

// List all webhooks
app.get('/', async (c) => {
  try {
    const webhooks = await withReadQuery(c, 'list webhooks', async () => {
      return await db.select().from(schema.webhooks).orderBy(desc(schema.webhooks.createdAt));
    });

    return c.json({
      success: true,
      data: webhooks.map(webhook => ({
        ...webhook,
        secret: webhook.secret ? '••••••••' : null // Mask secret in response
      }))
    });
  } catch (error) {
    logger.error('Failed to list webhooks', { error });
    return c.json({
      success: false,
      error: 'Failed to list webhooks'
    }, 500);
  }
});

// Create a new webhook subscription
app.post('/', zValidator('json', createWebhookSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    
    const webhook = await withTransaction(c, 'create webhook', async (tx) => {
      const [newWebhook] = await tx.insert(schema.webhooks)
        .values({
          url: body.url,
          event: body.event,
          secret: body.secret,
          description: body.description,
        })
        .returning();
      return newWebhook;
    });
    
    logger.info('Created new webhook subscription', { 
      id: webhook.id, 
      url: webhook.url, 
      event: webhook.event 
    });
    
    return c.json({
      success: true,
      data: {
        ...webhook,
        secret: webhook.secret ? '••••••••' : null // Mask secret in response
      }
    }, 201);
  } catch (error) {
    logger.error('Failed to create webhook', { error });
    return c.json({
      success: false,
      error: 'Failed to create webhook'
    }, 500);
  }
});

// Get a single webhook by ID
app.get('/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid webhook ID'
      }, 400);
    }
    
    const webhook = await withReadQuery(c, 'get webhook', async () => {
      return await db.query.webhooks.findFirst({
        where: eq(schema.webhooks.id, id)
      });
    });
    
    if (!webhook) {
      return c.json({
        success: false,
        error: 'Webhook not found'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: {
        ...webhook,
        secret: webhook.secret ? '••••••••' : null // Mask secret in response
      }
    });
  } catch (error) {
    logger.error('Failed to get webhook', { error });
    return c.json({
      success: false,
      error: 'Failed to get webhook'
    }, 500);
  }
});

// Update a webhook
app.patch('/:id', zValidator('json', updateWebhookSchema), async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const body = c.req.valid('json');
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid webhook ID'
      }, 400);
    }
    
    const [updatedWebhook] = await withWriteQuery(c, 'webhooks', 'update', async () => {
        const result = await db.update(schema.webhooks)
          .set({
            ...body,
            updatedAt: new Date().toISOString()
          })
          .where(eq(schema.webhooks.id, id))
          .returning();
        return result;
    });

    if (!updatedWebhook) {
      return c.json({ success: false, error: 'Webhook not found' }, 404);
    }
    
    logger.info('Updated webhook', { id });
    
    return c.json({
      success: true,
      data: {
        ...updatedWebhook,
        secret: updatedWebhook.secret ? '••••••••' : null
      }
    });
  } catch (error) {
    logger.error('Failed to update webhook', { error });
    return c.json({
      success: false,
      error: 'Failed to update webhook'
    }, 500);
  }
});

// Delete a webhook
app.delete('/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid webhook ID'
      }, 400);
    }
    
    await withTransaction(c, 'delete webhook', async (tx) => {
      await tx.delete(schema.webhookLogs)
        .where(eq(schema.webhookLogs.webhookId, id));
      
      const deleted = await tx.delete(schema.webhooks)
        .where(eq(schema.webhooks.id, id))
        .returning();
      
      if (deleted.length === 0) {
        throw new Error('Webhook not found');
      }
    });
    
    logger.info('Deleted webhook', { id });
    
    return c.json({
      success: true,
      message: 'Webhook deleted successfully'
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Webhook not found') {
      return c.json({
        success: false,
        error: 'Webhook not found'
      }, 404);
    }
    
    logger.error('Failed to delete webhook', { error });
    return c.json({
      success: false,
      error: 'Failed to delete webhook'
    }, 500);
  }
});

// Get webhook delivery logs
app.get('/:id/logs', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid webhook ID'
      }, 400);
    }
    
    const webhook = await withReadQuery(c, 'check webhook exists', async () => {
      return await db.query.webhooks.findFirst({
        where: eq(schema.webhooks.id, id)
      });
    });
    
    if (!webhook) {
      return c.json({ success: false, error: 'Webhook not found' }, 404);
    }
    
    const limit = Number(c.req.query('limit') || '20');
    const offset = Number(c.req.query('offset') || '0');
    
    const logs = await withReadQuery(c, 'get webhook logs', async () => {
      return await db.select()
        .from(schema.webhookLogs)
        .where(eq(schema.webhookLogs.webhookId, id))
        .orderBy(desc(schema.webhookLogs.timestamp))
        .limit(limit)
        .offset(offset);
    });
    
    const [{ count }] = await withReadQuery(c, 'count webhook logs', async () => {
      return await db.select({
        count: sql<number>`count(*)`
      })
      .from(schema.webhookLogs)
      .where(eq(schema.webhookLogs.webhookId, id));
    });
    
    return c.json({
      success: true,
      data: logs,
      pagination: {
        total: Number(count),
        limit,
        offset,
        hasMore: Number(count) > offset + logs.length
      }
    });
  } catch (error) {
    logger.error('Failed to get webhook logs', { error });
    return c.json({
      success: false,
      error: 'Failed to get webhook logs'
    }, 500);
  }
});

// Trigger a test webhook
app.post('/:id/test', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid webhook ID'
      }, 400);
    }
    
    const webhook = await withReadQuery(c, 'get webhook for test', async () => {
      return await db.query.webhooks.findFirst({
        where: eq(schema.webhooks.id, id)
      });
    });
    
    if (!webhook) {
      return c.json({ success: false, error: 'Webhook not found' }, 404);
    }
    
    if (!webhook.active) {
      return c.json({ success: false, error: 'Cannot test inactive webhook' }, 400);
    }
    
    const payload: WebhookPayload = {
      event: webhook.event,
      timestamp: new Date().toISOString(),
      source: 'webhook.test',
      data: {
        test: true,
        message: 'This is a test webhook',
        id: webhook.id
      }
    };
    
    const result = await deliverWebhook(webhook.url, payload, webhook.secret);
    
    await db.insert(schema.webhookLogs).values({
      webhookId: webhook.id,
      event: webhook.event,
      success: result.success,
      statusCode: result.statusCode ?? null,
      responseData: result.response 
        ? JSON.stringify(result.response).substring(0, 1000) 
        : null,
      errorMessage: result.error ?? null,
      timestamp: new Date().toISOString(),
    });
    
    logger.info('Sent test webhook', { 
      id: webhook.id, 
      success: result.success,
      statusCode: result.statusCode
    });
    
    return c.json({
      success: true,
      data: {
        result,
        webhook: {
          ...webhook,
          secret: webhook.secret ? '••••••••' : null
        }
      }
    });
  } catch (error) {
    logger.error('Failed to test webhook', { error });
    return c.json({
      success: false,
      error: 'Failed to test webhook'
    }, 500);
  }
});

export function setupWebhookRoutes() {
  return app;
}