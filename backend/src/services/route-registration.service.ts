import { Hono } from 'hono';
import { Context } from 'hono';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { ConfigFileService } from './config-fs.service.js';
import { createLogger } from '../logging/index.js';
import { eq } from 'drizzle-orm';
import { apiRequest } from '../api/client.js';
// TODO: Implement lifecycle phase execution
// For now we'll create a simple placeholder function 
function executeLifecyclePhase(phase: string, context: any) {
  // This will be replaced with the actual implementation when integrated with the real lifecycle
  logger.debug(`Executing lifecycle phase: ${phase}`);  
  return Promise.resolve({ 
    skip: false,
    response: null // Adding response property to avoid TypeScript errors
  });
}

// Create logger for route registration
const logger = createLogger('services:route-registration');

/**
 * Service for registering and managing dynamic API routes
 */
export class RouteRegistrationService {
  private registeredApis: Map<number, Hono> = new Map();
  private configFileService: ConfigFileService;
  
  constructor(configFileService: ConfigFileService) {
    this.configFileService = configFileService;
  }
  
  /**
   * Register all routes for active APIs and endpoints
   */
  async registerAllRoutes(parentRouter: Hono): Promise<void> {
    try {
      // Get all APIs (filter active ones if the column exists)
      const activeApis = await db.select().from(schema.apis);
      
      logger.info(`Found ${activeApis.length} active APIs to register`);
      
      // Register each API
      for (const api of activeApis) {
        await this.registerApiRoutes(api, parentRouter);
      }
    } catch (error) {
      logger.error('Failed to register all routes', { error });
      throw new Error(`Failed to register routes: ${(error as Error).message}`);
    }
  }
  
  /**
   * Register routes for a specific API
   */
  async registerApiRoutes(api: any, parentRouter: Hono): Promise<void> {
    try {
      // Create a new router for this API
      const apiRouter = new Hono();
      
      // Get all active endpoints for this API
      const apiEndpoints = await db.select().from(schema.endpoints)
        .where(eq(schema.endpoints.apiId, api.id));
      
      logger.info(`Registering ${apiEndpoints.length} endpoints for API ${api.name} (${api.slug})`);
      
      // Register each endpoint
      for (const endpoint of apiEndpoints) {
        this.registerEndpoint(api, endpoint, apiRouter);
      }
      
      // Mount the API router under its slug namespace
      parentRouter.route(`/${api.slug}`, apiRouter);
      
      // Store the router for future reference
      this.registeredApis.set(api.id, apiRouter);
      
      logger.info(`Successfully registered API ${api.name} at /${api.slug}`);
      
    } catch (error) {
      logger.error(`Failed to register routes for API ${api.name}`, { error });
      throw new Error(`Failed to register routes for API ${api.name}: ${(error as Error).message}`);
    }
  }
  
  /**
   * Register a specific endpoint within an API router
   */
  private registerEndpoint(api: any, endpoint: any, apiRouter: Hono): void {
    try {
      // Get the HTTP method and normalized path
      const method = endpoint.method.toLowerCase();
      // Remove leading slash if present for consistent routing
      const path = endpoint.path.startsWith('/') ? endpoint.path : `/${endpoint.path}`;
      
      logger.debug(`Registering ${method.toUpperCase()} ${path} endpoint for ${api.name}`);
      
      // Define the handler function for this endpoint
      const handler = async (c: Context) => {
        try {
          // Load endpoint config from filesystem for most up-to-date version
          const endpointConfig = await this.loadEndpointConfig(api.slug, endpoint.version, endpoint);
          
          // Extract request details
          const params = c.req.param() || {};
          const query = c.req.query();
          const body = await c.req.json().catch(() => undefined);
          const headers = Object.fromEntries(c.req.raw.headers.entries());
          
          // Prepare request context for lifecycle phases
          const requestContext = {
            api,
            endpoint,
            config: endpointConfig,
            request: {
              method: endpoint.method,
              path: endpoint.path,
              params,
              query,
              body,
              headers
            }
          };
          
          // Execute before request phase
          const beforeResult = await executeLifecyclePhase('beforeRequest', requestContext);
          
          // Check if the beforeRequest phase wants to skip the actual request
          if (beforeResult && beforeResult.skip) {
            logger.info(`Skipping request execution for ${method.toUpperCase()} ${path}`);
            return c.json(beforeResult.response);
          }
          
          // Execute the request phase
          const requestResult = await executeLifecyclePhase('request', {
            ...requestContext,
            beforeRequestResult: beforeResult
          });
          
          // If there's a result from the request phase, return it
          if (requestResult && requestResult.response) {
            return c.json(requestResult.response);
          }
          
          // Otherwise, execute the forwarded request
          const apiConfig = JSON.parse(api.config);
          const targetUrl = `${apiConfig.basePath}${path}`;
          
          // Make the actual API request using the api client
          const response = await apiRequest(
            api.id,
            endpoint.path,
            {
              method: endpoint.method.toUpperCase() as any, // Convert to uppercase for API client
              headers: { ...headers, ...(endpointConfig.headers || {}) },
              body,
              timeout: endpoint.timeout || api.timeout || 30000
            }
          );
          
          // Execute after request phase
          const afterResult = await executeLifecyclePhase('afterRequest', {
            ...requestContext,
            beforeRequestResult: beforeResult,
            requestResult: requestResult,
            response
          });
          
          // Return the response, potentially modified by afterRequest
          return c.json(afterResult?.response || response);
        } catch (error) {
          logger.error(`Error handling ${method.toUpperCase()} ${path}`, { error });
          return c.json({ 
            success: false, 
            error: `Error processing request: ${(error as Error).message}` 
          }, 500);
        }
      };
      
      // Register the endpoint with the appropriate HTTP method
      switch (method) {
        case 'get':
          apiRouter.get(path, handler);
          break;
        case 'post':
          apiRouter.post(path, handler);
          break;
        case 'put':
          apiRouter.put(path, handler);
          break;
        case 'patch':
          apiRouter.patch(path, handler);
          break;
        case 'delete':
          apiRouter.delete(path, handler);
          break;
        default:
          logger.warn(`Unsupported HTTP method ${method} for ${path}`);
      }
      
      logger.debug(`Successfully registered ${method.toUpperCase()} ${path}`);
    } catch (error) {
      logger.error(`Failed to register endpoint ${endpoint.method} ${endpoint.path}`, { error });
    }
  }
  
  /**
   * Load endpoint configuration from filesystem
   */
  private async loadEndpointConfig(apiSlug: string, version: string, endpoint: any): Promise<any> {
    try {
      const { config } = await this.configFileService.readEndpointConfig(
        apiSlug, 
        version, 
        { method: endpoint.method, path: endpoint.path }
      );
      return config;
    } catch (error) {
      logger.error(`Failed to load endpoint config for ${endpoint.method} ${endpoint.path}`, { error });
      // Fall back to the config stored in the database
      return JSON.parse(endpoint.config);
    }
  }
  
  /**
   * Re-register all routes (useful after imports or configuration changes)
   */
  async refreshRoutes(parentRouter: Hono): Promise<void> {
    // Clear existing registrations
    this.registeredApis.clear();
    
    // Register all routes again
    await this.registerAllRoutes(parentRouter);
    
    logger.info('Successfully refreshed all API routes');
  }
  
  /**
   * Register a newly imported API
   */
  async registerNewApi(apiId: number, parentRouter: Hono): Promise<void> {
    const api = await db.query.apis.findFirst({
      where: eq(schema.apis.id, apiId)
    });
    
    if (!api) {
      throw new Error(`API with ID ${apiId} not found`);
    }
    
    await this.registerApiRoutes(api, parentRouter);
    logger.info(`Successfully registered newly imported API ${api.name}`);
  }
}
