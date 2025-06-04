/**
 * Database logging functionality
 */
import { db } from '../db/index.js';
import { logs } from '../db/schema.js';
import { LogPhase } from './types.js';
import { eq, lt, sql } from 'drizzle-orm';

/**
 * Map from LogPhase enum to database schema phase strings
 */
function mapPhaseToDbPhase(phase: string | undefined): 'beforeRequest' | 'request' | 'afterRequest' | 'beforeExecute' | 'execute' | 'afterExecute' | null {
  if (!phase) return null;
  
  // Convert enum value to database-compatible string
  switch (phase) {
    case LogPhase.BEFORE_REQUEST:
      return 'beforeRequest';
    case LogPhase.REQUEST:
      return 'request';
    case LogPhase.AFTER_REQUEST:
      return 'afterRequest';
    case LogPhase.RESPONSE:
      // Map response to afterRequest as it's closest in the schema
      return 'afterRequest';
    case LogPhase.BEFORE_EXECUTE:
      return 'beforeExecute';
    case LogPhase.EXECUTE:
      return 'execute';
    case LogPhase.AFTER_EXECUTE:
      return 'afterExecute';
    default:
      // For other values, check if they match a DB value directly
      if (['beforeRequest', 'request', 'afterRequest', 'beforeExecute', 'execute', 'afterExecute'].includes(phase)) {
        return phase as any;
      }
      return null;
  }
}

/**
 * Write a log entry to the database
 * @param options - Log entry options
 * @returns Promise resolving when the log is written
 */
export async function logToDB(options: {
  message: string;
  source: string;
  level: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
  phase?: string;
  type?: string;
  endpointId?: number;
}) {
  try {
    // Convert the LogPhase enum value to a database-compatible string
    const dbPhase = mapPhaseToDbPhase(options.phase);
    
    // Success default to true unless specified in metadata
    const success = options.metadata?.success !== undefined 
      ? Boolean(options.metadata.success) 
      : true;
    
    // Store log source, level, and type in the metadata for future reference
    const enhancedMetadata = {
      ...options.metadata || {},
      _source: options.source,
      _level: options.level,
      _type: options.type
    };
    
    await db.insert(logs).values({
      message: options.message,
      phase: dbPhase || 'request', // Default to 'request' if no valid phase
      success: success,
      endpointId: options.endpointId || null,
      metadataJson: JSON.stringify(enhancedMetadata),
      // timestamp is handled by the database default if not specified
      ...(options.timestamp && { timestamp: options.timestamp.toISOString() })
    });
  } catch (error) {
    console.error('❌ Failed to write log to database:', error);
    // Depending on requirements, you might want to re-throw or handle this error differently
    // For now, logging to console to prevent application crash if DB logging fails.
  }
}

/**
 * Find logs older than a specified date
 * @param options - Query options
 * @returns Array of old log entries
 */
export async function findOldLogs(options: {
  olderThan: Date;
  limit?: number;
}) {
  const { olderThan, limit = 1000 } = options;
  
  try {
    // Use proper SQL comparison for timestamps in string format
    const oldLogs = await db.select()
      .from(logs)
      .where(sql`${logs.timestamp} < ${olderThan.toISOString()}`)
      .limit(limit);
    
    // Map the database records to a more usable format
    return oldLogs.map(log => {
      // Extract the source, level, and type from metadata if available
      let metadata = null;
      let source = 'system';
      let level = 'info';
      let type = null;
      
      if (log.metadataJson) {
        try {
          metadata = JSON.parse(log.metadataJson);
          source = metadata._source || source;
          level = metadata._level || level;
          type = metadata._type || type;
          
          // Remove our internal fields from the returned metadata
          if (metadata._source) delete metadata._source;
          if (metadata._level) delete metadata._level;
          if (metadata._type) delete metadata._type;
        } catch (e) {
          console.error('Error parsing log metadata:', e);
        }
      }
      
      return {
        id: log.id,
        message: log.message,
        timestamp: log.timestamp,
        phase: log.phase,
        success: log.success,
        endpointId: log.endpointId,
        metadata,
        source,
        level,
        type
      };
    });
  } catch (error) {
    console.error('Error finding old logs:', error);
    return [];
  }
}
