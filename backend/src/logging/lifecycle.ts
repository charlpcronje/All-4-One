/**
 * Logging system lifecycle management
 */
import { LogManager } from './manager.js';
import { systemLogger } from './core.js';
import { config } from '../config.js';
import { env } from '../env.js';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Initialize the logging system
 * Sets up all configured log drivers based on environment configuration
 */
export async function initializeLogging(): Promise<void> {
  try {
    systemLogger.info('Initializing logging system', {
      logLevel: config.logLevel,
      logDrivers: config.logDrivers
    });

    // Get a reference to the LogManager singleton
    const logManager = LogManager.getInstance();
    
    // Ensure log directories exist
    if (config.logDrivers.includes('file')) {
      const logDir = path.resolve(process.cwd(), config.logPath || 'logs');
      systemLogger.info(`Ensuring log directory exists: ${logDir}`);
      
      try {
        await fs.mkdir(logDir, { recursive: true });
      } catch (err) {
        systemLogger.error(`Failed to create log directory: ${logDir}`, { error: err });
        throw err;
      }
    }

    // Initialize each enabled driver
    for (const driverType of config.logDrivers) {
      try {
        systemLogger.info(`Initializing log driver: ${driverType}`);
        
        switch (driverType) {
          case 'sqlite':
            const { SqliteLogDriver } = await import('./drivers/sqlite-driver.js');
            logManager.registerDriver(new SqliteLogDriver());
            break;
          
          case 'file':
            const { FileLogDriver } = await import('./drivers/file-driver.js');
            logManager.registerDriver(new FileLogDriver({
              logPath: config.logPath || 'logs',
              logLevel: config.logLevel || 'info'
            }));
            break;
          
          // Additional drivers can be added here
          default:
            systemLogger.warn(`Unknown log driver type: ${driverType}`);
            break;
        }
      } catch (err) {
        systemLogger.error(`Failed to initialize log driver: ${driverType}`, { error: err });
        // Continue with other drivers if one fails
      }
    }
    
    systemLogger.info('Logging system initialization complete', {
      activeDrivers: logManager.getDriverCount()
    });
  } catch (error) {
    systemLogger.error('Failed to initialize logging system', { error });
    throw error;
  }
}

/**
 * Shut down the logging system gracefully
 * Closes all log drivers and performs any necessary cleanup
 */
export async function shutdownLogging(): Promise<void> {
  try {
    systemLogger.info('Shutting down logging system');
    
    // Get a reference to the LogManager singleton
    const logManager = LogManager.getInstance();
    
    // Close all drivers
    await logManager.closeAll();
    
    systemLogger.info('Logging system successfully shut down');
  } catch (error) {
    console.error('Error shutting down logging system:', error);
    throw error;
  }
}
