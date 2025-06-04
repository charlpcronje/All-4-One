/**
 * Logging system types and interfaces
 */

// Types of logs in the system
export enum LogType {
  APPLICATION = 'application',
  SECURITY = 'security',
  REQUEST_LIFECYCLE = 'request_lifecycle',
  DATABASE_QUERY = 'database_query',
  EXTERNAL_API_CALL = 'external_api_call',
}

// Log levels - standard severity levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

// Existing LogPhase enum from previous implementation
export enum LogPhase {
  INIT = 'init',
  CONFIGURE = 'configure',
  BEFORE_REQUEST = 'beforeRequest',
  REQUEST = 'request',
  AFTER_REQUEST = 'afterRequest',
  RESPONSE = 'response',
  BEFORE_EXECUTE = 'beforeExecute',
  EXECUTE = 'execute',
  AFTER_EXECUTE = 'afterExecute',
  WEBHOOK = 'webhook',
  EXPORT = 'export',
  ARCHIVE = 'archive',
  SHUTDOWN = 'shutdown',
}

// Re-export LogPhase as LogPhaseEnum for backwards compatibility
export const LogPhaseEnum = LogPhase;

// Core log entry structure
export interface LogEntry {
  message: string;
  timestamp: Date;
  source: string;
  metadata?: Record<string, unknown> | string;
  type?: LogType;
  level?: LogLevel;
  phase?: LogPhase | string;
}

// Configuration for a log driver
export interface LogDriverConfig {
  // Connection string or path for the driver
  connectionString?: string;
  
  // For file drivers - path configuration
  basePath?: string;
  maxSizeMB?: number;
  maxFiles?: number;
  
  // Driver-specific additional config
  options?: Record<string, unknown>;
}

// Storage options for log archiving
export enum LogStorageDriver {
  S3 = 's3',
  FTP = 'ftp',
  ARCHIVE = 'archive',
}

export enum LogStorageZipOption {
  ZIP_PER_LOG = 'zipPerLog',
  ZIP_ALL_TOGETHER = 'zipAllTogether',
  NONE = 'none',
}

// Configuration for the main logging system
export interface LoggingConfig {
  // Default driver to use if not specified for a log type
  defaultDriver: string;
  
  // Configuration for each log type
  logTypes: Record<string, {
    driver: string;
    level: LogLevel;
  }>;
  
  // Configuration for each driver
  drivers: Record<string, LogDriverConfig>;
  
  // Archival configuration
  archival?: {
    driver: LogStorageDriver;
    interval: number; // in days
    zipOption: LogStorageZipOption;
    // Driver-specific config will come from env variables
  };
}

// Interface that all log drivers must implement
export interface LogDriver {
  // Write a log entry to the driver's destination
  write(entry: LogEntry): Promise<void>;
  
  // Initialize the driver (create files, connect to DB, etc.)
  initialize(): Promise<void>;
  
  // Close connections, file handles, etc.
  shutdown(): Promise<void>;
  
  // Archive logs older than specified days
  archiveLogs(olderThanDays: number): Promise<string[]>;
}
