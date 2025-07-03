
export { LOG_LEVELS, COLORS } from './constants.js';
export { LogType, LogPhase, LogPhaseEnum } from './types.js';
export type { LogEntry, LogDriverConfig, LogDriver } from './types.js';

// Re-export core logger implementation
export { Logger, createLogger, systemLogger } from './core.js';

// Re-export middleware
export { loggerMiddleware, LoggerMiddlewareOptionsSchema } from './middleware.js';

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
