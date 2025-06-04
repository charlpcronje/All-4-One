/**
 * Constants for the logging system
 */

// Log levels in order of severity
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Log level to numeric value for comparison
export const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// ANSI color codes for console output
export const COLORS = {
  reset: '\x1b[0m',
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  timestamp: '\x1b[90m' // Grey
};
