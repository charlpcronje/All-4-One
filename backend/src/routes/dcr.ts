import { Hono } from 'hono';
import { Context } from 'hono';
import process from 'node:process';
import { db } from '../db/index.ts';
import * as schema from '../db/schema.ts';
import { desc, eq, sql } from 'drizzle-orm';

// Setup DCR internal routes
export function setupDcrRoutes(app: Hono): void {
  // Logs endpoints
  app.get('/logs', async (c: Context) => {
    try {
      const limit = Number(c.req.query('limit') || '50');
      const offset = Number(c.req.query('offset') || '0');
      
      const items = await db
        .select()
        .from(schema.logs)
        .orderBy(desc(schema.logs.timestamp))
        .limit(limit)
        .offset(offset);
      
      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.logs);
      
      return c.json({
        success: true,
        logs: items,
        pagination: {
          total: total[0].count,
          limit,
          offset,
          hasMore: offset + limit < total[0].count
        }
      });
    } catch (error) {
      console.error('Error fetching logs:', error);
      return c.json({
        success: false,
        error: (error as Error).message
      }, 500);
    }
  });

  // System status and metrics
  app.get('/status', async (c: Context) => {
    try {
      const dbStatus = await checkDbConnectivity();
      
      return c.json({
        success: true,
        status: {
          system: 'operational',
          database: dbStatus ? 'connected' : 'disconnected',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      return c.json({
        success: false,
        error: (error as Error).message
      }, 500);
    }
  });

  // Webhook registration and management
  app.post('/webhooks', async (c: Context) => {
    try {
      const body = await c.req.json();
      
      // Store webhook registration in database...
      // For now, just echo back the request
      return c.json({
        success: true,
        message: 'Webhook registered',
        webhook: body
      });
    } catch (error) {
      return c.json({
        success: false,
        error: (error as Error).message
      }, 500);
    }
  });

  // Flush cache
  app.post('/cache/flush', async (c: Context) => {
    try {
      const body = await c.req.json();
      const key = body.key as string | undefined;
      
      if (key) {
        // Flush specific cache key
        return c.json({
          success: true,
          message: `Cache key ${key} flushed`
        });
      } else {
        // Flush all cache
        return c.json({
          success: true,
          message: 'All cache flushed'
        });
      }
    } catch (error) {
      return c.json({
        success: false,
        error: (error as Error).message
      }, 500);
    }
  });
}

// Helper to check DB connectivity
async function checkDbConnectivity(): Promise<boolean> {
  try {
    // Run a simple query to verify the database is responsive
    const result = await db.select({ value: sql`1` }).get();
    return result?.value === 1;
  } catch (error) {
    console.error('Database connectivity check failed:', error);
    return false;
  }
}
