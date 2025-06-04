import { Hono } from 'hono';
import type { Context } from 'hono';
import { db } from '../db/index.js';
import { createLogger } from '../logging/index.js';
import { domainAuthMiddleware } from '../middleware/domain-auth.middleware.js';
import { createUserRouter } from './user/index.js';
import { createDomainMappingRouter } from './domain/index.js';
import { createImportRouter } from './import/index.js';
import { setupWebhookRoutes } from './webhooks.js';
import { setupApiRoutes as setupApisManagementRoutes } from './apis.js';

const logger = createLogger('routes:api');

export function setupApiRoutes() {
  const api = new Hono();

  api.use('/*', domainAuthMiddleware);

  api.get('/health', async (c: Context) => {
    try {
      await db.execute(db.sql`SELECT 1`);
      return c.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Health check failed', { error });
      return c.json(
        {
          success: false,
          status: 'unhealthy',
          error: 'Database connection failed',
          timestamp: new Date().toISOString()
        },
        500
      );
    }
  });

  api.route('/users', createUserRouter());
  api.route('/domains', createDomainMappingRouter());
  api.route('/import', createImportRouter());
  api.route('/webhooks', setupWebhookRoutes());
  api.route('/apis', setupApisManagementRoutes());

  return api;
}
