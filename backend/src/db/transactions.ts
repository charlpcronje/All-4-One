import { Context } from 'hono';
import { db } from './index.ts';
import { SQLiteTransaction } from 'drizzle-orm/better-sqlite3';
import { executeDbHooks, DbOperation, DbContext } from './lifecycle.ts';

// Type for transaction callback functions
export type TransactionCallback<T> = (tx: SQLiteTransaction<typeof db>) => Promise<T> | T;

/**
 * Execute a database transaction with lifecycle hooks
 * @param c - Hono context or null
 * @param callback - Function to execute within transaction
 * @returns Result of the transaction
 */
export async function withTransaction<T>(
  c: Context | null,
  callback: TransactionCallback<T>
): Promise<T> {
  // Create transaction context
  const txContext: DbContext = {
    table: 'transaction',
    operation: 'select' as DbOperation, // Using select as the closest operation type
    query: 'Transaction started',
    startTime: Date.now()
  };

  // Execute beforeExecute hooks
  const hookContext = await executeDbHooks('beforeExecute', c, txContext);
  
  // If there was an error in beforeExecute, we should abort
  if (hookContext.error) {
    throw hookContext.error;
  }

  try {
    // Execute the transaction
    const result = await db.transaction(async (tx: SQLiteTransaction<typeof db>) => {
      return await callback(tx);
    });
    
    // Update context with result and end time
    hookContext.result = result;
    hookContext.endTime = Date.now();
    
    // Execute afterExecute hooks
    await executeDbHooks('afterExecute', c, hookContext);
    
    return result;
  } catch (error) {
    // Update context with error and end time
    hookContext.error = error as Error;
    hookContext.endTime = Date.now();
    
    // Execute afterExecute hooks even if there was an error
    await executeDbHooks('afterExecute', c, hookContext);
    
    throw error;
  }
}

/**
 * Execute a read-only database query with lifecycle hooks
 * @param c - Hono context or null
 * @param table - Table being queried
 * @param callback - Function to execute
 * @returns Result of the query
 */
export async function withReadQuery<T>(
  c: Context | null,
  table: string,
  callback: () => Promise<T>
): Promise<T> {
  // Create query context
  const queryContext = {
    table,
    operation: 'select' as const,
    query: 'Read query',
    startTime: Date.now()
  };

  // Execute beforeExecute hooks
  const hookContext = await executeDbHooks('beforeExecute', c, queryContext);
  
  // If there was an error in beforeExecute, we should abort
  if (hookContext.error) {
    throw hookContext.error;
  }

  try {
    // Execute the query
    const result = await callback();
    
    // Update context with result and end time
    hookContext.result = result;
    hookContext.endTime = Date.now();
    
    // Execute afterExecute hooks
    await executeDbHooks('afterExecute', c, hookContext);
    
    return result;
  } catch (error) {
    // Update context with error and end time
    hookContext.error = error as Error;
    hookContext.endTime = Date.now();
    
    // Execute afterExecute hooks even if there was an error
    await executeDbHooks('afterExecute', c, hookContext);
    
    throw error;
  }
}

/**
 * Execute a write database query with lifecycle hooks
 * @param c - Hono context or null 
 * @param table - Table being modified
 * @param operation - Type of write operation
 * @param callback - Function to execute
 * @returns Result of the query
 */
export async function withWriteQuery<T>(
  c: Context | null,
  table: string,
  operation: 'insert' | 'update' | 'delete',
  callback: () => Promise<T>
): Promise<T> {
  // Create query context
  const queryContext = {
    table,
    operation,
    query: `${operation.toUpperCase()} query`,
    startTime: Date.now()
  };

  // Execute beforeExecute hooks
  const hookContext = await executeDbHooks('beforeExecute', c, queryContext);
  
  // If there was an error in beforeExecute, we should abort
  if (hookContext.error) {
    throw hookContext.error;
  }

  try {
    // Execute the query
    const result = await callback();
    
    // Update context with result and end time
    hookContext.result = result;
    hookContext.endTime = Date.now();
    
    // Execute afterExecute hooks
    await executeDbHooks('afterExecute', c, hookContext);
    
    return result;
  } catch (error) {
    // Update context with error and end time
    hookContext.error = error as Error;
    hookContext.endTime = Date.now();
    
    // Execute afterExecute hooks even if there was an error
    await executeDbHooks('afterExecute', c, hookContext);
    
    throw error;
  }
}
