/**
 * Core Logger implementation
 */
import { Context } from 'hono';
import { LogLevel, LOG_LEVELS, COLORS } from './constants.js';

// Configuration for the logger
export interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableDatabase: boolean;
  serviceId: string;
  formatOptions?: {
    colors: boolean;
    timestamp: boolean;
  };
}

// Import from env to avoid circular dependency
import { env } from '../env.js';

// Default configuration
const defaultConfig: LoggerConfig = {
  minLevel: (env.LOG_LEVEL as LogLevel) || 'info',
  enableConsole: true,
  enableDatabase: true,
  serviceId: env.SERVICE_ID || 'dcr-backend',
  formatOptions: {
    colors: true,
    timestamp: true
  }
};

/**
 * Main logger class for the DCR application
 */
export class Logger {
  private config: LoggerConfig;
  private source: string;

  /**
   * Create a new logger instance
   * @param source - Component or module name for this logger
   * @param config - Optional custom configuration
   */
  constructor(source: string, config?: Partial<LoggerConfig>) {
    this.source = source;
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Log a debug message
   * @param message - Message to log
   * @param metadata - Optional additional context information
   * @param context - Optional Hono context for request information
   */
  debug(message: string, metadata?: Record<string, unknown>, context?: Context): void {
    this.log('debug', message, metadata, context);
  }

  /**
   * Log an info message
   * @param message - Message to log
   * @param metadata - Optional additional context information
   * @param context - Optional Hono context for request information
   */
  info(message: string, metadata?: Record<string, unknown>, context?: Context): void {
    this.log('info', message, metadata, context);
  }

  /**
   * Log a warning message
   * @param message - Message to log
   * @param metadata - Optional additional context information
   * @param context - Optional Hono context for request information
   */
  warn(message: string, metadata?: Record<string, unknown>, context?: Context): void {
    this.log('warn', message, metadata, context);
  }

  /**
   * Log an error message
   * @param message - Message to log
   * @param metadata - Optional additional context information
   * @param context - Optional Hono context for request information
   */
  error(message: string, metadata?: Record<string, unknown>, context?: Context): void {
    this.log('error', message, metadata, context);
  }

  /**
   * Internal method to handle log entries
   * @param level - Log level
   * @param message - Message to log
   * @param metadata - Optional additional context information
   * @param context - Optional Hono context for request information
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>, context?: Context): void {
    // Check if this log level should be processed
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.minLevel]) {
      return;
    }

    const timestamp = new Date();
    const entry = {
      level,
      message,
      source: this.source,
      timestamp,
      metadata
    };

    // Log to console if enabled
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Log to database if enabled
    if (this.config.enableDatabase) {
      // Handle database logging asynchronously to avoid circular dependencies
      // Using a separate function allows TypeScript to better handle the dynamic import
      this.logToDatabase(entry).catch(error => {
        console.error('Database logging failed:', error);
      });
    }
  }

  /**
   * Send log entry to database asynchronously
   * @param entry - Log entry to send to database
   * @returns Promise that resolves when the log is written or rejects on error
   */
  private async logToDatabase(entry: { level: LogLevel; message: string; source: string; timestamp: Date; metadata?: Record<string, unknown> }): Promise<void> {
    try {
      // Dynamically import the database module to avoid circular dependencies
      const { logToDB } = await import('./database.js');
      await logToDB({
        message: entry.message,
        source: entry.source,
        level: entry.level,
        timestamp: entry.timestamp,
        metadata: entry.metadata
      });
    } catch (error: unknown) {
      // Convert to Error type or string for consistent error handling
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
  
  /**
   * Format and output log entry to console
   * @param entry - Log entry to output
   */
  private logToConsole(entry: { level: LogLevel; message: string; source: string; timestamp: Date; metadata?: Record<string, unknown> }): void {
    const { level, message, source, timestamp, metadata } = entry;
    const { colors, timestamp: showTimestamp } = this.config.formatOptions || {};

    // Format the log message
    let formattedMessage = '';

    // Add timestamp if enabled
    if (showTimestamp) {
      const timeStr = timestamp.toISOString();
      formattedMessage += colors ? `${COLORS.timestamp}${timeStr}${COLORS.reset} ` : `${timeStr} `;
    }

    // Add log level with appropriate color
    const levelUpper = level.toUpperCase();
    formattedMessage += colors
      ? `${COLORS[level]}[${levelUpper}]${COLORS.reset}`
      : `[${levelUpper}]`;

    // Add source
    formattedMessage += ` [${source}]`;

    // Add message
    formattedMessage += ` ${message}`;

    // Output to console
    console[level](formattedMessage);

    // Output metadata as a separate JSON line if present
    if (metadata && Object.keys(metadata).length > 0) {
      console[level](
        colors ? `${COLORS[level]}[${levelUpper}] Metadata:${COLORS.reset}` : `[${levelUpper}] Metadata:`,
        metadata
      );
    }
  }
}

/**
 * Create a new logger for a specific component
 * @param source - Component or module name for the logger
 * @param config - Optional custom configuration
 * @returns A configured logger instance
 */
export function createLogger(source: string, config?: Partial<LoggerConfig>): Logger {
  return new Logger(source, config);
}

// Create a system-wide logger for application-level messages
export const systemLogger = createLogger('system');

// Create pre-configured loggers for common components
export const apiLogger = createLogger('api');
export const dbLogger = createLogger('database');
export const authLogger = createLogger('auth');
