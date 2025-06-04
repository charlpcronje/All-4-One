import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.ts';
import * as schema from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { createLogger } from '../logging/index.ts';
import { withReadQuery, withTransaction, withWriteQuery } from '../db/transactions.ts';
import { registerWebhook, WebhookEvent } from '../webhooks/index.ts';

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
      return await db.select().from(schema.webhooks).orderBy(schema.webhooks.createdAt);
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
    
    // Register webhook using the webhook service
    const webhook = await registerWebhook(
      body.url, 
      body.event as WebhookEvent, 
      body.secret
    );
    
    // If description provided, update it
    if (body.description) {
      await withWriteQuery(c, 'update webhook description', async () => {
        await db.update(schema.webhooks)
          .set({ description: body.description })
          .where(eq(schema.webhooks.id, webhook.id));
      });
      
      webhook.description = body.description;
    }
    
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
    
    // Ensure webhook exists
    const exists = await withReadQuery(c, 'check webhook exists', async () => {
      return await db.query.webhooks.findFirst({
        where: eq(schema.webhooks.id, id)
      });
    });
    
    if (!exists) {
      return c.json({
        success: false,
        error: 'Webhook not found'
      }, 404);
    }
    
    // Update webhook
    const [updatedWebhook] = await withWriteQuery(c, 'update webhook', async () => {
      return await db.update(schema.webhooks)
        .set({
          ...(body.url && { url: body.url }),
          ...(body.active !== undefined && { active: body.active }),
          ...(body.secret !== undefined && { secret: body.secret }),
          ...(body.description !== undefined && { description: body.description }),
          updatedAt: new Date()
        })
        .where(eq(schema.webhooks.id, id))
        .returning();
    });
    
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
    
    // Delete webhook with transaction to handle related logs
    await withTransaction(c, 'delete webhook', async (tx) => {
      // First delete related logs
      await tx.delete(schema.webhookLogs)
        .where(eq(schema.webhookLogs.webhookId, id));
      
      // Then delete the webhook
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
    
    // Check if webhook exists
    const webhook = await withReadQuery(c, 'check webhook exists', async () => {
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
    
    // Get logs with pagination
    const limit = Number(c.req.query('limit') || '20');
    const offset = Number(c.req.query('offset') || '0');
    
    const logs = await withReadQuery(c, 'get webhook logs', async () => {
      return await db.select()
        .from(schema.webhookLogs)
        .where(eq(schema.webhookLogs.webhookId, id))
        .orderBy(schema.webhookLogs.timestamp, 'desc')
        .limit(limit)
        .offset(offset);
    });
    
    // Get total count
    const [{ count }] = await withReadQuery(c, 'count webhook logs', async () => {
      return await db.select({
        count: db.fn.count()
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
    
    // Get webhook details
    const webhook = await withReadQuery(c, 'get webhook for test', async () => {
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
    
    if (!webhook.active) {
      return c.json({
        success: false,
        error: 'Cannot test inactive webhook'
      }, 400);
    }
    
    // Import webhook handler directly to avoid circular dependency
    const { deliverWebhook } = await import('../webhooks/index.ts');
    
    // Create test payload
    const payload = {
      event: webhook.event as WebhookEvent,
      timestamp: new Date().toISOString(),
      source: 'webhook.test',
      data: {
        test: true,
        message: 'This is a test webhook',
        id: webhook.id
      }
    };
    
    // Deliver test webhook
    const result = await deliverWebhook(webhook.url, payload, webhook.secret);
    
    // Record test attempt
    await db.insert(schema.webhookLogs).values({
      webhookId: webhook.id,
      event: webhook.event,
      success: result.success,
      statusCode: result.statusCode || null,
      responseData: result.response 
        ? JSON.stringify(result.response).substring(0, 1000) 
        : null,
      errorMessage: result.error || null,
      timestamp: new Date()
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
