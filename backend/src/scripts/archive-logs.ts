/**
 * Log archiving script
 * 
 * This script is meant to be run on a schedule (e.g. daily via cron)
 * to archive logs older than the configured interval (default: 7 days).
 * Logs will be archived to the configured storage location (S3, FTP, or local filesystem).
 */
import { LogManager, logToDB } from '../logging/index.js';
import { env } from '../env.js';
import { LogPhase } from '../logging/types.js';

/**
 * Main function to archive logs
 */
async function archiveLogs() {
  // Log the start of the archiving process
  await logToDB({
    message: 'Starting log archiving process',
    source: 'archive-script',
    level: 'info',
    phase: LogPhase.ARCHIVE,
    metadata: {
      interval: env.LOG_STORAGE_INTERVAL,
      driver: env.LOG_STORAGE_DRIVER,
      zipOption: env.LOG_STORAGE_ZIP_OPTION,
      service: env.SERVICE_ID || 'dcr-backend',
      success: true
    }
  });

  try {
    // Get the log manager instance
    const logManager = LogManager.getInstance();
    
    // Initialize the log manager if not already initialized
    await logManager.initialize();
    
    console.log(`Archiving logs older than ${env.LOG_STORAGE_INTERVAL} days...`);
    
    // Run the archival process
    await logManager.archiveLogs();
    
    // Log successful completion
    await logToDB({
      message: 'Log archiving process completed successfully',
      source: 'archive-script',
      level: 'info',
      phase: LogPhase.ARCHIVE,
      metadata: {
        interval: env.LOG_STORAGE_INTERVAL,
        driver: env.LOG_STORAGE_DRIVER,
        service: env.SERVICE_ID || 'dcr-backend',
        success: true
      }
    });
  } catch (error) {
    console.error('Error archiving logs:', error);
    
    // Log the error
    await logToDB({
      message: 'Error during log archiving process',
      source: 'archive-script',
      level: 'error',
      phase: LogPhase.ARCHIVE,
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        service: env.SERVICE_ID || 'dcr-backend',
        success: false
      }
    });
    
    // Exit with error code
    process.exit(1);
  }
}

// Run the archival process if this script is executed directly
if (require.main === module) {
  archiveLogs().then(() => process.exit(0));
}

// Export for testing or programmatic usage
export { archiveLogs };
