// Path: backend/src/routes/api.ts

import { Hono, Context } from 'hono';
import { db } from '../db/index.js';
import { createLogger } from '../logging/index.js';

// Import services
import { RouteRegistrationService } from '../services/route-registration.service.js';
import { ImportValidatorService } from '../services/import-validator.service.js';
import { ConfigFileService } from '../services/config-fs.service.js';
import { GitService } from '../services/git.service.js';

// Import routers
import { domainAuthMiddleware } from '../middleware/domain-auth.middleware.js';
import { createUserRouter } from './user/index.js';
import { createDomainMappingRouter } from './domain/index.js';
import { createImportRouter } from './import/index.js';
import { setupApiManagementRoutes } from './apis.js';
import { setupWebhookRoutes } from './webhooks.js';
import { processStepsRouter } from '../controllers/process-steps.controller.js';

const logger = createLogger('routes:api');

export function setupApiRoutes(app: Hono): void {
  const api = new Hono();

  // Instantiate services
  const importValidatorService = new ImportValidatorService();
  const configFileService = new ConfigFileService();
  const gitService = new GitService();
  const routeRegistrar = new RouteRegistrationService(configFileService);

  // ============== MIDDLEWARE ==============
  api.use('*', domainAuthMiddleware);

  // ============== STATIC MANAGEMENT ROUTES ==============
  api.get('/health', async (c: Context) => {
    try {
      await db.query.users.findFirst();
      return c.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
    } catch (error) {
      logger.error('Health check failed', { error });
      return c.json({ success: false, status: 'unhealthy', error: 'Database connection failed' }, 500);
    }
  });

  // Mount all management sub-routers, providing dependencies
  api.route('/users', createUserRouter());
  api.route('/domains', createDomainMappingRouter());
  api.route('/import', createImportRouter(importValidatorService, configFileService, gitService));
  api.route('/management/apis', setupApiManagementRoutes());
  api.route('/management/webhooks', setupWebhookRoutes());
  api.route('/process-steps', processStepsRouter);

  // ============== DYNAMIC ORCHESTRATED ROUTES ==============
  const orchestratedRouter = new Hono();

  // Asynchronously register all routes from the database on startup
  routeRegistrar.registerAllRoutes(orchestratedRouter)
    .then(() => {
      logger.info('🚀 Dynamic API routes registered successfully.');
    })
    .catch(error => {
      logger.error('🚨 Failed to register dynamic API routes.', { error });
    });

  api.route('/', orchestratedRouter);

  // Mount the entire /api router to the main app
  app.route('/api', api);
}