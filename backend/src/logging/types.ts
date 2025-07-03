import { z } from 'zod';

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
export const LogEntrySchema = z.object({
  message: z.string(),
  timestamp: z.date(),
  source: z.string(),
  metadata: z.record(z.unknown()).or(z.string()).optional(),
  type: z.nativeEnum(LogType).optional(),
  level: z.nativeEnum(LogLevel).optional(),
  phase: z.nativeEnum(LogPhase).or(z.string()).optional(),
});

export type LogEntry = z.infer<typeof LogEntrySchema>;

// Configuration for a log driver
export const LogDriverConfigSchema = z.object({
  connectionString: z.string().optional(),
  basePath: z.string().optional(),
  maxSizeMB: z.number().optional(),
  maxFiles: z.number().optional(),
  options: z.record(z.unknown()).optional(),
});

export type LogDriverConfig = z.infer<typeof LogDriverConfigSchema>;

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
export const LoggingConfigSchema = z.object({
  defaultDriver: z.string(),
  logTypes: z.record(z.object({
    driver: z.string(),
    level: z.nativeEnum(LogLevel),
  })),
  drivers: z.record(LogDriverConfigSchema),
  archival: z.object({
    driver: z.nativeEnum(LogStorageDriver),
    interval: z.number(), // in days
    zipOption: z.nativeEnum(LogStorageZipOption),
  }).optional(),
});

export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;

// Interface that all log drivers must implement
// This is a contract for an implementation, not a data structure, so it remains an interface.
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
