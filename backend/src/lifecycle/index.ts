import { Context } from 'hono';
import { config } from '../config/index';

// Lifecycle hook types
export type LifecycleHookType = 'beforeRequest' | 'request' | 'afterRequest';
export type DbLifecycleHookType = 'beforeExecute' | 'execute' | 'afterExecute';

// Hook context containing data that can be modified by hooks
export interface HookContext {
  request?: Request;
  response?: Response;
  error?: Error;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  startTime?: number;
  endTime?: number;
}

// Hook handler function type
export type HookHandler = (
  c: Context,
  hookContext: HookContext
) => Promise<void> | void;

// Registry for lifecycle hooks
const hooks: Record<string, Record<string, HookHandler>> = {
  beforeRequest: {},
  request: {},
  afterRequest: {},
};

// Register a hook for a specific lifecycle stage
export function registerHook(
  type: LifecycleHookType,
  name: string,
  handler: HookHandler
): void {
  if (!hooks[type]) {
    hooks[type] = {};
  }
  
  hooks[type][name] = handler;
}

// Execute hooks for a specific lifecycle stage
export async function executeHooks(
  type: LifecycleHookType,
  c: Context,
  hookContext: HookContext = {}
): Promise<HookContext> {
  const context = { ...hookContext };
  
  // Get the configured hooks for this stage
  const configuredHooks = config.lifecycle[type] || [];
  
  for (const hookName of configuredHooks) {
    const hook = hooks[type][hookName];
    
    if (!hook) {
      console.warn(`Hook ${hookName} for ${type} not found`);
      continue;
    }
    
    try {
      await hook(c, context);
    } catch (error) {
      console.error(`Error executing ${type} hook ${hookName}:`, error);
      context.error = error as Error;
      
      // For beforeRequest hooks, we might want to abort the chain
      if (type === 'beforeRequest') {
        break;
      }
    }
  }
  
  return context;
}

// Middleware to run beforeRequest and afterRequest hooks
export function lifecycleMiddleware() {
  return async (c: Context, next: () => Promise<void>): Promise<void> => {
    const hookContext: HookContext = {
      request: c.req.raw,
      startTime: Date.now(),
      data: {},
      metadata: {},
    };
    
    // Execute beforeRequest hooks
    const beforeContext = await executeHooks('beforeRequest', c, hookContext);
    
    // If there was an error in beforeRequest, we might want to skip the request
    if (beforeContext.error) {
      c.status(500);
      c.header('Content-Type', 'application/json');
      return c.body(JSON.stringify({ error: 'Internal Server Error' }));
    }
    
    // Continue with the request
    await next();
    
    // Set the end time and response
    beforeContext.endTime = Date.now();
    beforeContext.response = c.res;
    
    // Execute afterRequest hooks
    await executeHooks('afterRequest', c, beforeContext);
  };
}

// Helper to run request hooks
export function runRequestHooks(
  c: Context, 
  hookContext: HookContext = {}
): Promise<HookContext> {
  return executeHooks('request', c, hookContext);
}
