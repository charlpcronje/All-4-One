/**
 * Base implementation for all log drivers
 */
import { LogDriver, LogDriverConfig, LogEntry } from '../types.js';

export abstract class BaseLogDriver implements LogDriver {
  protected config: LogDriverConfig;
  protected initialized = false;

  constructor(config: LogDriverConfig = {}) {
    this.config = config;
  }

  /**
   * Write a log entry to the destination
   * @param entry The log entry to write
   */
  abstract write(entry: LogEntry): Promise<void>;

  /**
   * Initialize the driver
   */
  async initialize(): Promise<void> {
    // Base implementation just marks as initialized
    // Specific drivers should override and call super.initialize()
    this.initialized = true;
  }

  /**
   * Shutdown the driver, closing connections etc.
   */
  async shutdown(): Promise<void> {
    // Base implementation just marks as not initialized
    // Specific drivers should override and call super.shutdown()
    this.initialized = false;
  }

  /**
   * Archive logs older than specified days
   * @param olderThanDays Archive logs older than this many days
   * @returns Array of archived log identifiers
   */
  async archiveLogs(olderThanDays: number): Promise<string[]> {
    // Base implementation does nothing
    // Specific drivers should override this
    return [];
  }

  /**
   * Check if the driver is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Format a log entry as a string
   * @param entry The log entry to format
   * @returns Formatted log string
   */
  protected formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, source, message, metadata, type, phase } = entry;
    
    // Create a basic formatted string
    let formattedLog = `[${timestamp.toISOString()}] [${level.toUpperCase()}]`;
    
    if (type) {
      formattedLog += ` [${type}]`;
    }
    
    if (phase) {
      formattedLog += ` [${phase}]`;
    }
    
    formattedLog += ` [${source}] ${message}`;
    
    if (metadata) {
      formattedLog += ` ${JSON.stringify(metadata)}`;
    }
    
    return formattedLog;
  }
}
