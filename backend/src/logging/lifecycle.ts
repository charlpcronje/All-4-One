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
      logDrivers: config.logging?.drivers ? Object.keys(config.logging.drivers) : []
    });

    // Get a reference to the LogManager singleton
    const logManager = LogManager.getInstance();
    
    // Ensure log directories exist
    if (config.logging?.drivers?.file) {
      const logDir = path.resolve(process.cwd(), config.logging?.drivers?.file?.basePath || 'logs');
      systemLogger.info(`Ensuring log directory exists: ${logDir}`);
      
      try {
        await fs.mkdir(logDir, { recursive: true });
      } catch (err) {
        systemLogger.error(`Failed to create log directory: ${logDir}`, { error: err });
        throw err;
      }
    }

    // Initialize each enabled driver
    for (const driverType of config.logging?.drivers ? Object.keys(config.logging.drivers) : []) {
      try {
        systemLogger.info(`Initializing log driver: ${driverType}`);
        
        switch (driverType) {
          case 'sqlite':
            const { SQLiteLogDriver } = await import('./drivers/sqlite-driver.js');
            logManager.registerDriver('sqlite', new SQLiteLogDriver());
            break;
          
          case 'file':
            const { FileLogDriver } = await import('./drivers/file-driver.js');
            logManager.registerDriver('file', new FileLogDriver({
              basePath: config.logging?.drivers?.file?.basePath || 'logs',
              options: {
                logLevel: config.logLevel || 'info',
                maxSizeMB: config.logging?.drivers?.file?.maxSizeMB || 10,
                maxFiles: config.logging?.drivers?.file?.maxFiles || 7,
              }
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
    await logManager.shutdown();
    
    systemLogger.info('Logging system successfully shut down');
  } catch (error) {
    console.error('Error shutting down logging system:', error);
    throw error;
  }
}
