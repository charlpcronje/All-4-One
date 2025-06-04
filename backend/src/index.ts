import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import process from 'node:process';
import { env } from './env.js';
import { config } from './config.js';
import { setupApiRoutes } from './routes/api.js';
import { setupDcrRoutes } from './routes/dcr.js';
import { lifecycleMiddleware } from './lifecycle/index.js';
import { loggerMiddleware, systemLogger, initializeLogging, shutdownLogging } from './logging/index.js';
import { initializeScheduler, shutdownScheduler } from './scheduler/index.js';
import type { Context } from 'hono';

// Initialize Hono app
const app = new Hono();

// Apply global middleware
app.use('*', loggerMiddleware());
app.use('*', cors());
app.use('*', lifecycleMiddleware());
app.use('/static/*', serveStatic({ root: './' }));

// Setup base routes
app.get('/', (c: Context) => {
  return c.json({
    status: 'ok',
    message: 'Digital Cabinet Relay API',
    version: env.APP_VERSION || '1.0.0',
    environment: env.NODE_ENV
  });
});

// Server health check
app.get('/health', (c: Context) => {
  return c.json({ 
    status: 'up',
    timestamp: new Date().toISOString(),
    config: { 
      logLevel: config.logLevel,
      orchestratorMode: env.ORCHESTRATOR_MODE
    }
  });
});

// Setup API routes with /api base path
const api = new Hono();
const apiRouter = setupApiRoutes();
app.route('/api', apiRouter);

// Setup DCR internal routes with /dcr base path
const dcr = new Hono();
setupDcrRoutes(dcr);
app.route('/dcr', dcr);

// Initialize the scheduler for periodic tasks
initializeScheduler().catch(err => {
  systemLogger.error('Error initializing scheduler', { error: err });
});

// Initialize the logging system
initializeLogging().catch(err => {
  console.error('Error initializing logging system:', err);
});

// Start the server
const port = env.PORT ? parseInt(env.PORT, 10) : 3000;

systemLogger.info(`Starting DCR backend server on port ${port.toString()}`, {
  environment: env.NODE_ENV,
  version: env.SERVICE_ID || '1.0.0'
});

// @hono/node-server expects port as a number
serve({
  fetch: app.fetch,
  port
});

// Setup graceful shutdown handlers
process.on('SIGINT', async () => {
  systemLogger.info('Received SIGINT, shutting down gracefully');
  try {
    await shutdownScheduler();
    systemLogger.info('Scheduler shut down successfully');
    
    await shutdownLogging();
    systemLogger.info('Logging system shut down successfully');
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  systemLogger.info('Received SIGTERM, shutting down gracefully');
  try {
    await shutdownScheduler();
    systemLogger.info('Scheduler shut down successfully');
    
    await shutdownLogging();
    systemLogger.info('Logging system shut down successfully');
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
  }
  process.exit(0);
});

// Global error handlers
process.on('unhandledRejection', (reason: unknown) => {
  systemLogger.error('Unhandled Promise rejection', { reason });
});

process.on('uncaughtException', (error: Error) => {
  systemLogger.error('Uncaught exception', { error });
  // Critical errors should terminate the process for proper restart
  process.exit(1);
});

console.log(`🚀 Server running at http://localhost:${port}`);
console.log(`📋 Environment: ${env.NODE_ENV}`);
console.log(`🔧 Orchestrator mode: ${env.ORCHESTRATOR_MODE}`);
console.log(`🛣️ Routes available:`);

console.log(`   - / (Root)`);
console.log(`   - /health (Health check)`);
console.log(`   - /api/* (API endpoints)`);
console.log(`   - /dcr/* (Internal DCR endpoints)`);

