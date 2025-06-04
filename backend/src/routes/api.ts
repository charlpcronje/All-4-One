import { Hono } from 'hono';
import { Context } from 'hono';
import { db } from '../db/index.js';
import { createLogger } from '../logging/index.js';
import { setupWebhookRoutes } from './webhooks.js';
import { setupApiRoutes as setupApisManagementRoutes } from './apis.js';
import { RouteRegistrationService } from '../services/route-registration.service.js';
import { ConfigFileService } from '../services/config-fs.service.js';
import { NamespaceService } from '../services/namespace.service.js';
import { ImportValidatorService } from '../services/import-validator.service.js';
import { GitService } from '../services/git.service.js';
import { domainAuthMiddleware } from '../middleware/domain-auth.middleware.js';
import { createUserRouter } from './user/index.js';
import { createDomainMappingRouter } from './domain/index.js';
import { createImportRouter } from './import/index.js';

// Create logger for API routes
const logger = createLogger('routes:api');
  const host = c.req.header('host');
  if (!host) {
    logger.warn('No host header found in request');
    return next();
  }
  
  // Extract domain from host
  const domain = host.split(':')[0]; // Remove port if present
  
  try {
    // Create a new NamespaceService instance
    const namespaceService = new NamespaceService();
    
    // Resolve domain to namespace and user
    // Note: Method name should match actual NamespaceService implementation
    const domainMapping = await namespaceService.getDomainMapping(domain);
    if (domainMapping) {
      // Set domain mapping in context for downstream handlers
      c.set('domainMapping', domainMapping);
      
      // Get user associated with domain if available
      const user = await namespaceService.getUserByDomain(domain);
      if (user) {
        // Set authenticated user in context
        c.set('user', user);
      }
      
      // Rewrite path if path prefix is configured
      if (domainMapping.pathPrefix) {
        const path = c.req.path;
        if (path.startsWith(domainMapping.pathPrefix)) {
          // Remove path prefix for downstream handlers
          const newPath = path.substring(domainMapping.pathPrefix.length);
          c.req.path = newPath;
        }
      }
      
      logger.info(`Domain ${domain} resolved to namespace ${domainMapping.namespace}`);
    } else {
      logger.warn(`Domain ${domain} not found in namespace mappings`);
    }
  } catch (error) {
    logger.error(`Error in domain authentication: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  await next();

/**
 * Setup the API routes
 */
export function setupApiRoutes() {
  const api = new Hono();

  // Apply domain authentication middleware to all API routes
  api.use('/*', domainAuthMiddleware);

  // Health check endpoint
  api.get('/health', async (c: Context) => {
    try {
      // Check database connection
      await db.execute(db.sql`SELECT 1`);
      
      return c.json({ 
        success: true, 
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Health check failed', { error });
      return c.json({ 
        success: false, 
        status: 'unhealthy',
        error: 'Database connection failed',
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  // Mount user routes
  api.route('/users', createUserRouter());

  // Mount domain routes
  api.route('/domains', createDomainMappingRouter());
    await db.select({ count: db.fn.count() }).from(schema.users);
    
    return c.json({ 
      success: true, 
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    return c.json({ 
      success: false, 
      status: 'unhealthy',
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// User endpoints
api.get('/users', async (c: Context) => {
  try {
    const users = await withReadQuery(c, 'list users', async () => {
      return await db.select().from(schema.users);
    });
      });
    } catch (error: any) {
      logger.error('Failed to fetch user domains', { error: error.message });
      return c.json({ success: false, error: error.message || 'Failed to fetch user domains' }, 500);
    }
  });
});

api.post('/users', zValidator('json', z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  role: z.enum(['admin', 'user']).optional().default('user')
})), async (c: Context) => {
  try {
    const data = c.req.valid('json');
    
    const result = await withWriteQuery(c, 'create user', async () => {
      const [user] = await db.insert(schema.users).values({
        name: data.name,
        email: data.email,
        role: data.role,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return user;
    });

    logger.info('Created new user', { id: result.id, email: result.email });
    return c.json({ success: true, data: result }, 201);
  } catch (error) {
    logger.error('Error creating user', { error });
    return c.json({ success: false, error: 'Failed to create user' }, 500);
  }
});

api.patch('/users/:id', zValidator('json', z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).optional(),
  role: z.enum(['admin', 'user']).optional()
})), async (c: Context) => {
  try {
    const id = Number(c.req.param('id'));
    const data = c.req.valid('json');
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid user ID' }, 400);
    }
    
    if (Object.keys(data).length === 0) {
      return c.json({ success: false, error: 'No fields to update' }, 400);
    }

    const result = await withWriteQuery(c, 'update user', async () => {
      const [user] = await db.update(schema.users)
        .set({
          ...(data.name !== undefined && { name: data.name }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.role !== undefined && { role: data.role }),
          updatedAt: new Date()
        })
        .where(eq(schema.users.id, id))
        .returning();
      return user;
    });

    if (!result) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    logger.info('Updated user', { id });
    return c.json({ success: true, data: result });
  } catch (error) {
    logger.error(`Error updating user ${c.req.param('id')}`, { error });
    return c.json({ success: false, error: 'Failed to update user' }, 500);
  }
});

api.delete('/users/:id', async (c: Context) => {
  try {
    const id = Number(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid user ID' }, 400);
    }
    
    await withTransaction(c, 'delete user', async (tx) => {
      // First check if user exists
      const user = await tx.query.users.findFirst({
        where: eq(schema.users.id, id)
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Delete the user
      await tx.delete(schema.users)
        .where(eq(schema.users.id, id));
    });
    
    logger.info('Deleted user', { id });
    return c.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      return c.json({ success: false, error: 'User not found' }, 404);
    }
    
    logger.error(`Error deleting user ${c.req.param('id')}`, { error });
    return c.json({ success: false, error: 'Failed to delete user' }, 500);
  }
});

export function setupApiRoutes() {
  return api;
}
