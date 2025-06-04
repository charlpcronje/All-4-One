/**
 * SQLite log driver implementation
 */
import { BaseLogDriver } from './base-driver.js';
import { LogDriver, LogEntry, LogDriverConfig, LogPhase, LogLevel } from '../types.js';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { withReadQuery, withTransaction, withWriteQuery } from '../../db/transactions.js';
import { eq, lt, sql } from 'drizzle-orm';
import { dirname } from 'path';
import { mkdir } from 'fs/promises';

export class SQLiteLogDriver extends BaseLogDriver {
  constructor(config: LogDriverConfig = {}) {
    super(config);
  }
  
  /**
   * Initialize the SQLite driver
   * Makes sure the database directory exists
   */
  async initialize(): Promise<void> {
    // If we have a custom connection string, we would connect to it here
    // For now, we use the main application database
    
    // If a custom db path is specified, ensure its directory exists
    if (this.config.connectionString?.startsWith('sqlite:///')) {
      const dbPath = this.config.connectionString.replace('sqlite:///', '');
      const dbDir = dirname(dbPath);
      await mkdir(dbDir, { recursive: true });
    }
    
    await super.initialize();
  }
  
  /**
   * Write a log entry to the SQLite database
   * @param entry The log entry to write
   */
  async write(entry: LogEntry): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Map the log entry to our logs table structure
    // For now, we'll map application/general logs to phase-specific logs
    // In a future implementation, we might create a separate table
    const { message, timestamp, source, metadata, phase, level } = entry;
    
    // Default phase to a level-based value if not provided
    // Get appropriate phase, then map it to a database-compatible value
    const initialPhase = phase || this.mapLevelToPhase(entry.level);
    const dbCompatiblePhase = this.mapPhaseToDbPhase(initialPhase);
    
    await withWriteQuery(null, 'logs', 'insert', async () => {
      await db.insert(schema.logs).values({
        message: message.substring(0, 1000), // Limit message length
        timestamp: timestamp.toISOString(),
        // Use a type assertion to handle the phase enum restriction
        phase: dbCompatiblePhase as 'beforeRequest' | 'request' | 'afterRequest' | 'beforeExecute' | 'execute' | 'afterExecute',
        success: true, // Default to success for general logs
        metadataJson: metadata ? JSON.stringify(metadata) : null,
      });
    });
  }
  
  /**
   * Map log level to a phase for database storage
   * @param level LogLevel
   * @returns string representing a phase
   */
  private mapLevelToPhase(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'beforeRequest'; // Use as a placeholder for debug
      case LogLevel.INFO:
        return 'request'; // Use as a placeholder for info
      case LogLevel.WARN:
        return 'afterRequest'; // Use as a placeholder for warn
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return 'execute'; // Use as a placeholder for errors
      default:
        return 'request';
    }
  }

  /**
   * Map LogPhase enum to a database-compatible phase string
   * @param phase LogPhase enum value
   * @returns Database-compatible phase string
   */
  private mapPhaseToDbPhase(phase: LogPhase | string): string {
    // Direct mapping for phases that already match the database schema
    if (['beforeRequest', 'request', 'afterRequest', 'beforeExecute', 'execute', 'afterExecute'].includes(phase)) {
      return phase;
    }
    
    // Map other phases to their closest equivalents
    switch (phase) {
      case LogPhase.INIT:
      case LogPhase.CONFIGURE:
      case LogPhase.EXPORT:
        return 'beforeExecute'; // System initialization activities
      
      case LogPhase.WEBHOOK:
        return 'afterRequest'; // Webhook is a post-request activity
      
      case LogPhase.ARCHIVE:
        return 'afterExecute'; // Archiving is a post-execution activity
      
      case LogPhase.SHUTDOWN:
        return 'afterExecute'; // Shutdown is a concluding activity
      
      default:
        return 'request'; // Default fallback
    }
  }
  
  /**
   * Archive logs older than specified days
   * @param olderThanDays Archive logs older than this many days
   * @returns Array of archived log record IDs
   */
  async archiveLogs(olderThanDays: number): Promise<string[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - olderThanDays);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();
    
    // Use a query to find logs older than the cutoff date
    const oldLogs = await withReadQuery(null, 'logs', async () => {
      return await db.select().from(schema.logs)
        .where(sql`${schema.logs.timestamp} >= ${startStr} AND ${schema.logs.timestamp} < ${endStr}`);
    });
    
    // Type assertion for oldLogs and add type for log parameter
    return (oldLogs as { id: number }[]).map((log: { id: number }) => log.id.toString());
  }
}
