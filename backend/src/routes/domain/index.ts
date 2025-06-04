import { Hono } from 'hono';
import { Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { withReadQuery, withTransaction } from '../../db/transactions.js';
import { createLogger } from '../../logging/index.js';
import { NamespaceService } from '../../services/namespace.service.js';

const logger = createLogger('routes:domain');

// Domain mapping schema for validation
export const domainMappingSchema = z.object({
  domain: z.string().min(1),
  namespace: z.string().min(1),
  userId: z.number().optional(),
  pathPrefix: z.string().optional()
});

export type DomainMappingInput = z.infer<typeof domainMappingSchema>;

/**
 * Creates domain mapping router for managing domain-to-namespace mappings
 */
export function createDomainMappingRouter() {
  const domainRouter = new Hono();
  const namespaceService = new NamespaceService();

  // Get all domain mappings
  domainRouter.get('/', async (c: Context) => {
    try {
      const domainMappings = await withReadQuery(c, 'list domain mappings', async () => {
        return await namespaceService.getAllDomainMappings();
      });

      return c.json({ success: true, data: domainMappings });
    } catch (error) {
      logger.error('Error listing domain mappings', { error });
      return c.json({ success: false, error: 'Failed to list domain mappings' }, 500);
    }
  });

  // Create a new domain mapping
  domainRouter.post('/', zValidator('json', domainMappingSchema), async (c: Context) => {
    try {
      const input = c.req.valid('json');
      
      // Check if domain already exists
      const existingMapping = await namespaceService.getDomainMapping(input.domain);
      if (existingMapping) {
        return c.json({ 
          success: false, 
          error: `Domain ${input.domain} is already mapped to namespace ${existingMapping.namespace}` 
        }, 409);
      }

      const result = await withTransaction(c, 'create domain mapping', async () => {
        // Create the domain mapping
        const mapping = await namespaceService.createDomainMapping(
          input.domain,
          input.namespace,
          input.userId,
          input.pathPrefix
        );

        return mapping;
      });

      logger.info('Created new domain mapping', { 
        domain: input.domain, 
        namespace: input.namespace 
      });
      
      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      logger.error('Error creating domain mapping', { error });
      return c.json({ success: false, error: 'Failed to create domain mapping' }, 500);
    }
  });

  // Delete a domain mapping
  domainRouter.delete('/:domain', async (c: Context) => {
    try {
      const domain = c.req.param('domain');
      
      if (!domain) {
        return c.json({ success: false, error: 'Domain parameter is required' }, 400);
      }
      
      // Check if domain exists
      const existingMapping = await namespaceService.getDomainMapping(domain);
      if (!existingMapping) {
        return c.json({ success: false, error: `Domain ${domain} not found` }, 404);
      }

      await withTransaction(c, 'delete domain mapping', async () => {
        await namespaceService.deleteDomainMapping(domain);
      });
      
      logger.info('Deleted domain mapping', { domain });
      return c.json({ success: true, message: 'Domain mapping deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting domain mapping ${c.req.param('domain')}`, { error });
      return c.json({ success: false, error: 'Failed to delete domain mapping' }, 500);
    }
  });

  return domainRouter;
}
