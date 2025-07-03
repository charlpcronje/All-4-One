// Path: backend/src/db/transactions.ts
// FINAL CORRECTED VERSION

import { Context } from 'hono';
import { db } from './index.js';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { executeDbHooks, DbOperation, DbContext } from './lifecycle.js';

// Get the correct transaction type from Drizzle's inference for use in callbacks.
type Transaction = BetterSQLite3Database<typeof schema>;

export type TransactionCallback<T> = (tx: Transaction) => Promise<T> | T;

/**
 * Execute a database transaction with lifecycle hooks.
 * @param c Hono context or null.
 * @param _description A descriptive name for the transaction, for logging.
 * @param callback The function to execute within the transaction.
 * @returns The result of the transaction callback.
 */
export async function withTransaction<T>(
  c: Context | null,
  _description: string, // Keep for compatibility, but can be removed later
  callback: TransactionCallback<T>
): Promise<T> {
  // 1. Create the initial context for the 'transaction' operation.
  const txContext: DbContext = {
    table: 'transaction', // Special name for a transaction block
    operation: 'execute', // 'execute' is a good fit for a transaction block
    query: _description || 'Transaction Block', // A descriptive name
    startTime: Date.now(),
  };

  // 2. Run 'beforeExecute' hooks.
  const hookContext = await executeDbHooks('beforeExecute', c, txContext);
  if (hookContext.error) {
    throw hookContext.error;
  }

  try {
    // 3. Execute the actual database transaction.
    const result = await db.transaction(async (tx) => {
      // The `tx` object passed to the callback is correctly typed as our Transaction type.
      return await callback(tx as Transaction);
    });

    // 4. Update context with the result and run 'afterExecute' hooks.
    hookContext.result = result;
    hookContext.endTime = Date.now();
    await executeDbHooks('afterExecute', c, hookContext);

    return result;

  } catch (error) {
    // 5. If an error occurs, update the context and run 'afterExecute' hooks before re-throwing.
    hookContext.error = error as Error;
    hookContext.endTime = Date.now();
    await executeDbHooks('afterExecute', c, hookContext);
    throw error;
  }
}

/**
 * Wraps a single read query with lifecycle hooks.
 */
export async function withReadQuery<T>(
  c: Context | null,
  _description: string, // Keep for compatibility
  callback: () => Promise<T>
): Promise<T> {
  const queryContext: DbContext = {
    table: _description.split(' ')[1] || 'unknown', // Best guess for table name
    operation: 'select',
    query: _description || 'Read Query',
    startTime: Date.now(),
  };

  const hookContext = await executeDbHooks('beforeExecute', c, queryContext);
  if (hookContext.error) throw hookContext.error;

  try {
    const result = await callback();
    hookContext.result = result;
    hookContext.endTime = Date.now();
    await executeDbHooks('afterExecute', c, hookContext);
    return result;
  } catch (error) {
    hookContext.error = error as Error;
    hookContext.endTime = Date.now();
    await executeDbHooks('afterExecute', c, hookContext);
    throw error;
  }
}

/**
 * Wraps a single write query with lifecycle hooks.
 */
export async function withWriteQuery<T>(
  c: Context | null,
  table: string,
  operation: DbOperation,
  callback: () => Promise<T>
): Promise<T> {
  const queryContext: DbContext = {
    table,
    operation,
    query: `${operation.charAt(0).toUpperCase() + operation.slice(1)} Query`,
    startTime: Date.now(),
  };

  const hookContext = await executeDbHooks('beforeExecute', c, queryContext);
  if (hookContext.error) throw hookContext.error;

  try {
    const result = await callback();
    hookContext.result = result;
    hookContext.endTime = Date.now();
    await executeDbHooks('afterExecute', c, hookContext);
    return result;
  } catch (error) {
    hookContext.error = error as Error;
    hookContext.endTime = Date.now();
    await executeDbHooks('afterExecute', c, hookContext);
    throw error;
  }
}