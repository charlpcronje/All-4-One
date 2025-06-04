import { db } from './index.ts';
import { config } from '../config/index.ts';
import { Context } from 'hono';

// Types
export type DbOperation = 'select' | 'insert' | 'update' | 'delete';

export interface DbContext {
  table: string;
  operation: DbOperation;
  query: unknown;
  params?: unknown[];
  result?: unknown;
  startTime?: number;
  endTime?: number;
  error?: Error;
}

// Type for DB lifecycle hook handlers
export type DbHookHandler = (
  c: Context | null,
  dbContext: DbContext
) => Promise<void> | void;

// Registry for DB lifecycle hooks
const dbHooks: Record<string, Record<string, DbHookHandler>> = {
  beforeExecute: {},
  execute: {},
  afterExecute: {}
};

// Register a DB hook for a specific lifecycle stage
export function registerDbHook(
  type: string,
  name: string,
  handler: DbHookHandler
): void {
  if (!dbHooks[type]) {
    dbHooks[type] = {};
  }
  
  dbHooks[type][name] = handler;
}

// Execute DB hooks for a specific lifecycle stage
export async function executeDbHooks(
  type: string,
  c: Context | null,
  dbContext: DbContext
): Promise<DbContext> {
  const context = { ...dbContext };
  
  // Get the configured hooks for this stage
  const configuredHooks = config.db.lifecycle[type as keyof typeof config.db.lifecycle] || [];
  
  for (const hookName of configuredHooks) {
    const hook = dbHooks[type][hookName];
    
    if (!hook) {
      console.warn(`DB Hook ${hookName} for ${type} not found`);
      continue;
    }
    
    try {
      await hook(c, context);
    } catch (error) {
      console.error(`Error executing DB ${type} hook ${hookName}:`, error);
      context.error = error as Error;
      
      // For beforeExecute hooks, we might want to abort the chain
      if (type === 'beforeExecute') {
        break;
      }
    }
  }
  
  return context;
}

// Enhanced query executor with lifecycle hooks
export async function executeWithLifecycle<T>(
  c: Context | null,
  table: string,
  operation: DbOperation,
  query: () => Promise<T>
): Promise<T> {
  // Create initial DB context
  const dbContext: DbContext = {
    table,
    operation,
    query,
    startTime: Date.now()
  };
  
  // Execute beforeExecute hooks
  const beforeContext = await executeDbHooks('beforeExecute', c, dbContext);
  
  // If there was an error in beforeExecute, we should abort
  if (beforeContext.error) {
    throw beforeContext.error;
  }
  
  try {
    // Execute the query
    const result = await query();
    
    // Update context with result and end time
    beforeContext.result = result;
    beforeContext.endTime = Date.now();
    
    // Execute afterExecute hooks
    await executeDbHooks('afterExecute', c, beforeContext);
    
    return result;
  } catch (error) {
    // Update context with error and end time
    beforeContext.error = error as Error;
    beforeContext.endTime = Date.now();
    
    // Execute afterExecute hooks even if there was an error
    await executeDbHooks('afterExecute', c, beforeContext);
    
    throw error;
  }
}

// Enhanced DB methods with lifecycle hooks
export const dbWithLifecycle = {
  select: <T>(
    c: Context | null,
    table: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    return executeWithLifecycle(c, table, 'select', fn);
  },
  
  insert: <T>(
    c: Context | null,
    table: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    return executeWithLifecycle(c, table, 'insert', fn);
  },
  
  update: <T>(
    c: Context | null,
    table: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    return executeWithLifecycle(c, table, 'update', fn);
  },
  
  delete: <T>(
    c: Context | null,
    table: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    return executeWithLifecycle(c, table, 'delete', fn);
  }
};

// Example DB hook for validation
registerDbHook('beforeExecute', 'validate', (_c, dbContext) => {
  // Here you would implement validation logic based on operation and table
  console.log(`Validating ${dbContext.operation} on ${dbContext.table}`);
});

// Example DB hook for logging
registerDbHook('afterExecute', 'log', (_c, dbContext) => {
  const duration = (dbContext.endTime || 0) - (dbContext.startTime || 0);
  console.log(`${dbContext.operation.toUpperCase()} on ${dbContext.table} took ${duration}ms`);
  
  // In a real implementation, you would log to your database or external log service
});
