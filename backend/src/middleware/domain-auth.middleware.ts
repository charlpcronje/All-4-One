import { Context } from 'hono';
import { createLogger } from '../logging/index.js';
import { NamespaceService, DomainMapping, DomainAuthUser } from '../services/namespace.service.js';

const logger = createLogger('middleware:domain-auth');

/**
 * Domain authentication middleware
 * This middleware extracts the domain from the Host header,
 * resolves it to a namespace, and sets domain mapping and user context
 */
export async function domainAuthMiddleware(c: Context, next: () => Promise<void>) {
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
    logger.error('Error in domain authentication middleware', { error });
  }
  
  await next();
}

// Type declarations for domain context
declare module 'hono' {
  interface ContextVariableMap {
    domainMapping?: DomainMapping;
    user?: DomainAuthUser;
  }
}
