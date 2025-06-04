/**
 * Main logging system entry point
 * Re-exports all logging functionality from modular files
 */

// Re-export core types and constants
export { LogLevel, LOG_LEVELS, COLORS } from './constants.js';
export { LogType, LogPhase, LogPhaseEnum, LogEntry, LogDriverConfig, LogDriver } from './types.js';

// Re-export core logger implementation
export { Logger, createLogger, systemLogger } from './core.js';

// Re-export middleware
export { loggerMiddleware, LoggerMiddlewareOptions } from './middleware.js';

// Re-export database functionality
export { logToDB, findOldLogs } from './database.js';

// Re-export lifecycle management
export { initializeLogging, shutdownLogging } from './lifecycle.js';

// Re-export manager
export { LogManager } from './manager.js';

// Re-export drivers
export { SQLiteLogDriver } from './drivers/sqlite-driver.js';
export { FileLogDriver } from './drivers/file-driver.js';

// Export common pre-configured loggers
export { apiLogger, dbLogger, authLogger } from './core.js';
