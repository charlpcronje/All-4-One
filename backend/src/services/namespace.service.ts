import { createLogger } from '../logging/index.js';
import { ConfigFileService } from './config-fs.service.js';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';

// Define interfaces for domain mapping
export interface DomainMapping {
  domain: string;       // Domain or subdomain (e.g., api.example.com)
  namespace: string;    // API namespace to route to
  userId?: number;      // Optional user ID to auto-authenticate as
  pathPrefix?: string;  // Optional path prefix to prepend to requests
}

// Interface for users that authenticate by domain
export interface DomainAuthUser {
  id: number;
  email: string | null;
  passwordHash: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  domains?: string[];
}

/**
 * Service for managing namespace and domain mapping operations
 */
export class NamespaceService {
  private logger = createLogger('services:namespace');
  private configService: ConfigFileService;
  
  // In-memory cache of domain mappings
  private domainMappingsCache: Map<string, DomainMapping> = new Map();
  
  constructor(configService?: ConfigFileService) {
    this.configService = configService || new ConfigFileService();
    this.logger.debug('NamespaceService initialized');
  }
  
  /**
   * Resolve a domain to a namespace mapping
   * @param domain The domain to resolve
   * @returns The domain mapping or null if not found
   */
  async getDomainMapping(domain: string): Promise<DomainMapping | null> {
    // Check cache first
    if (this.domainMappingsCache.has(domain)) {
      return this.domainMappingsCache.get(domain) || null;
    }
    
    try {
      this.logger.debug('Looking up domain mapping', { domain });
      
      // In a real implementation, this would query a domain_mappings table
      // For now, we'll simulate with a mock implementation
      
      // TODO: Replace with actual database query when schema is updated
      /*
      const mapping = await db.select()
        .from(schema.domainMappings)
        .where(eq(schema.domainMappings.domain, domain))
        .limit(1);
        
      if (mapping.length > 0) {
        const result = {
          domain: mapping[0].domain,
          namespace: mapping[0].namespace,
          userId: mapping[0].userId,
          pathPrefix: mapping[0].pathPrefix
        };
        this.domainMappingsCache.set(domain, result);
        return result;
      }
      */
      
      // Mock implementation - replace with actual database query
      if (domain === 'api.example.com') {
        const mapping = {
          domain,
          namespace: 'admin-api',
          userId: 1,
          pathPrefix: '/v1'
        };
        this.domainMappingsCache.set(domain, mapping);
        return mapping;
      }
      
      if (domain.startsWith('api-')) {
        const id = parseInt(domain.split('-')[1]?.split('.')[0] || '0');
        if (id > 0) {
          const mapping = {
            domain,
            namespace: `user-${id}-api`,
            userId: id,
            pathPrefix: '/v1'
          };
          this.domainMappingsCache.set(domain, mapping);
          return mapping;
        }
      }
      
      return null;
    } catch (error) {
      this.logger.error('Error finding domain mapping', { error, domain });
      return null;
    }
  }
  
  /**
   * Get a user by domain for domain-based authentication
   * @param domain The domain to look up
   * @returns The user associated with the domain or null
   */
  async getUserByDomain(domain: string): Promise<DomainAuthUser | null> {
    try {
      const mapping = await this.getDomainMapping(domain);
      if (!mapping || !mapping.userId) {
        return null;
      }
      
      this.logger.debug('Looking up user by domain', { domain, userId: mapping.userId });
      
      // In a real implementation, this would query your users table
      // TODO: Replace with actual database query
      /*
      const user = await db.select()
        .from(schema.users)
        .where(eq(schema.users.id, mapping.userId))
        .limit(1);
        
      if (user.length > 0) {
        return {
          ...user[0],
          domains: [domain]
        };
      }
      */
      
      // Mock implementation - replace with actual database query
      if (domain === 'api.example.com') {
        return {
          id: 1,
          email: 'admin@example.com',
          passwordHash: null,
          role: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          domains: [domain]
        };
      }
      
      if (domain.startsWith('api-')) {
        const id = parseInt(domain.split('-')[1]?.split('.')[0] || '0');
        if (id > 0) {
          return {
            id,
            email: null,
            passwordHash: null,
            role: 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            domains: [domain]
          };
        }
      }
      
      return null;
    } catch (error) {
      this.logger.error('Error finding user by domain', { error, domain });
      return null;
    }
  }
  
  /**
   * Check if a given API namespace is accessible from a specific domain
   * @param apiNamespace The API namespace to check
   * @param domain The domain to check from
   * @returns True if accessible, false otherwise
   */
  async isApiAccessibleFromDomain(apiNamespace: string, domain: string): Promise<boolean> {
    try {
      const mapping = await this.getDomainMapping(domain);
      if (!mapping) {
        return false;
      }
      
      // In a real implementation, this would have more complex rules
      // For now, we'll just check if the namespaces match
      return mapping.namespace === apiNamespace;
    } catch (error) {
      this.logger.error('Error checking API accessibility', { error, apiNamespace, domain });
      return false;
    }
  }

  /**
   * Get all domain mappings
   * @returns Array of domain mappings
   */
  async getAllDomainMappings(): Promise<DomainMapping[]> {
    try {
      // In a real implementation, this would query a domain_mappings table
      // TODO: Replace with actual database query when schema is updated
      /*
      const mappings = await db.select()
        .from(schema.domainMappings);
        
      return mappings.map(mapping => ({
        domain: mapping.domain,
        namespace: mapping.namespace,
        userId: mapping.userId,
        pathPrefix: mapping.pathPrefix
      }));
      */
      
      // Mock implementation - replace with actual database query
      // This could also iterate over this.domainMappingsCache.values()
      const mockMappings: DomainMapping[] = [
        {
          domain: 'api.example.com',
          namespace: 'admin-api',
          userId: 1,
          pathPrefix: '/v1'
        },
        {
          domain: 'api-1.example.com',
          namespace: 'user-1-api',
          userId: 1,
          pathPrefix: '/v1'
        },
        {
          domain: 'api-2.example.com',
          namespace: 'user-2-api',
          userId: 2,
          pathPrefix: '/v1'
        }
      ];
      // To make this more dynamic with the cache for mock:
      // return Array.from(this.domainMappingsCache.values());
      // For now, using the provided mock data:
      return mockMappings;
    } catch (error) {
      this.logger.error('Error getting all domain mappings', { error });
      return [];
    }
  }
  
  /**
   * Create a new domain mapping
   * @param mapping The domain mapping to create
   * @returns The created mapping or null if failed
   */
  async createDomainMapping(mapping: DomainMapping): Promise<DomainMapping | null> {
    try {
      this.logger.debug('Creating domain mapping', { mapping });
      
      // In a real implementation, this would insert into your domain_mappings table
      // TODO: Replace with actual database insert
      /*
      const [result] = await db.insert(schema.domainMappings)
        .values({
          domain: mapping.domain,
          namespace: mapping.namespace,
          userId: mapping.userId,
          pathPrefix: mapping.pathPrefix
        })
        .returning();
      
      if (result) {
        // Ensure the returned result is mapped to DomainMapping if necessary
        const newMapping = {
            domain: result.domain,
            namespace: result.namespace,
            userId: result.userId,
            pathPrefix: result.pathPrefix
        };
        this.domainMappingsCache.set(newMapping.domain, newMapping);
        return newMapping;
      }
      return null; // Or handle DB error if result is not as expected
      */
      
      // Mock implementation
      this.domainMappingsCache.set(mapping.domain, mapping);
      return mapping;
    } catch (error) {
      this.logger.error('Error creating domain mapping', { error, mapping });
      // Optionally re-throw if it's an unexpected error, or just return null
      // throw new Error(`Failed to create domain mapping: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }
  
  /**
   * Delete a domain mapping
   * @param domain The domain to delete mapping for
   * @returns True if successful, false otherwise
   */
  async deleteDomainMapping(domain: string): Promise<boolean> {
    try {
      this.logger.debug('Deleting domain mapping', { domain });
      
      // In a real implementation, this would delete from your domain_mappings table
      // TODO: Replace with actual database delete
      /*
      const result = await db.delete(schema.domainMappings)
        .where(eq(schema.domainMappings.domain, domain));
      // Check result to determine success, e.g., result.rowCount > 0
      if (result.rowCount > 0) {
          this.domainMappingsCache.delete(domain);
          return true;
      }
      return false;
      */
      
      // Mock implementation
      if (this.domainMappingsCache.has(domain)) {
        this.domainMappingsCache.delete(domain);
        return true;
      }
      return false; // Domain not found in cache
    } catch (error) {
      this.logger.error('Error deleting domain mapping', { error, domain });
      // Optionally re-throw for unexpected errors
      // throw new Error(`Failed to delete domain mapping: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  /**
   * Get domains associated with a user
   * @param userId The user ID to get domains for
   * @returns Array of domain strings
   */
  async getDomainsByUserId(userId: number): Promise<string[]> {
    try {
      this.logger.debug('Getting domains for user', { userId });
      
      // In a real implementation, this would query a domain_mappings table
      // TODO: Replace with actual database query when schema is updated
      /*
      const mappings = await db.select({ domain: schema.domainMappings.domain })
        .from(schema.domainMappings)
        .where(eq(schema.domainMappings.userId, userId));
        
      return mappings.map(mapping => mapping.domain);
      */
      
      // Mock implementation based on cache
      const domains: string[] = [];
      for (const [domain, mapping] of this.domainMappingsCache.entries()) {
        if (mapping.userId === userId) {
          domains.push(domain);
        }
      }
      
      // Add some mock data if cache is empty (for testing, can be removed)
      if (domains.length === 0) { // Simplified mock data addition
          if (userId === 1) {
            // Let's assume api.example.com and api-1.example.com are created if not in cache
            // For robust testing, these should be pre-populated or created via createDomainMapping
            // For now, we'll just return what's in the cache or the original mock
            const user1Domains = ['api.example.com', 'api-1.example.com'];
            const existingUser1Domains = user1Domains.filter(d => {
                const cachedMapping = this.domainMappingsCache.get(d);
                return cachedMapping && cachedMapping.userId === userId;
            });
            if(existingUser1Domains.length > 0) return existingUser1Domains; // return from cache if present

            // If relying purely on mock, you might add them back if they fit this test case
            // For this cleanup, we'll prioritize cache.
            // If cache is empty and matches mock user ID, return mock.
            if (userId === 1) return ['api.example.com', 'api-1.example.com'];
            if (userId === 2) return ['api-2.example.com'];

          } else if (userId === 2) {
            const user2Domains = ['api-2.example.com'];
             const existingUser2Domains = user2Domains.filter(d => {
                const cachedMapping = this.domainMappingsCache.get(d);
                return cachedMapping && cachedMapping.userId === userId;
            });
            if(existingUser2Domains.length > 0) return existingUser2Domains;
            if (userId === 2) return ['api-2.example.com'];
          }
      }
      
      return domains;
    } catch (error) {
      this.logger.error('Error getting domains for user', { error, userId });
      return [];
    }
  }

  /**
   * Associate domains with a user
   * @param userId The user ID to associate domains with
   * @param domains Array of domains to associate
   */
  async associateDomainsWithUser(userId: number, domains: string[]): Promise<void> {
    try {
      this.logger.debug('Associating domains with user', { userId, domains });
      
      // In a real implementation, this would update a domain_mappings table
      // TODO: Replace with actual database query when schema is updated
      /*
      // This might involve multiple updates or a more complex transaction
      // For each domain, check if it exists, then update its userId.
      // If a domain mapping doesn't exist, you might choose to create it or error.
      for (const domain of domains) {
        // Option 1: Update if exists, ignore if not
        await db.update(schema.domainMappings)
          .set({ userId })
          .where(eq(schema.domainMappings.domain, domain));
        
        // Option 2: Upsert (create if not exists, update if exists)
        // This depends on your DB and Drizzle syntax for upsert
        // await db.insert(schema.domainMappings)
        //   .values({ domain, namespace: 'default', userId }) // Potentially need a default namespace
        //   .onConflict(schema.domainMappings.domain)
        //   .doUpdateSet({ userId });
      }
      */
      
      // Update cache
      for (const domain of domains) {
        const mapping = this.domainMappingsCache.get(domain);
        if (mapping) {
          mapping.userId = userId;
          this.domainMappingsCache.set(domain, mapping);
        } else {
          // Behavior for non-existent domain: either ignore, error, or create.
          // For this mock, we'll assume it only updates existing ones.
          this.logger.warn('Domain not found in cache, cannot associate with user', { domain, userId });
        }
      }
    } catch (error) {
      this.logger.error('Error associating domains with user', { error, userId, domains });
      throw new Error(`Failed to associate domains with user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove all domain associations for a user
   * @param userId The user ID to remove associations for
   */
  async disassociateAllDomainsFromUser(userId: number): Promise<void> {
    try {
      this.logger.debug('Removing all domain associations for user', { userId });
      
      // In a real implementation, this would update a domain_mappings table
      // TODO: Replace with actual database query when schema is updated
      /*
      await db.update(schema.domainMappings)
        .set({ userId: null }) // Set userId to null or undefined
        .where(eq(schema.domainMappings.userId, userId));
      */
      
      // Update cache
      for (const [domain, mapping] of this.domainMappingsCache.entries()) {
        if (mapping.userId === userId) {
          // Create a new mapping object to ensure cache update detection if Map values are mutable objects
          const updatedMapping = { ...mapping, userId: undefined };
          this.domainMappingsCache.set(domain, updatedMapping);
        }
      }
    } catch (error) {
      this.logger.error('Error removing domain associations for user', { error, userId });
      throw new Error(`Failed to remove domain associations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}