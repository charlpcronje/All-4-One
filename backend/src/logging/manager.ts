/**
 * Logging system manager
 * Handles driver initialization, routing log entries to the right driver,
 * and coordinating log archiving
 */
import { LogDriver, LogDriverConfig, LogEntry, LogLevel, LogType, LoggingConfig, LogStorageDriver, LogStorageZipOption } from './types.js';
import { SQLiteLogDriver } from './drivers/sqlite-driver.js';
import { FileLogDriver } from './drivers/file-driver.js';
import { config } from '../config.js';
import { env } from '../env.js';
import { join, basename } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export class LogManager {
  private static instance: LogManager;
  private drivers: Map<string, LogDriver> = new Map();
  private typeToDriverMap: Map<string, string> = new Map();
  private defaultDriverName: string = 'sqlite';
  private defaultLogLevel: LogLevel = LogLevel.INFO;
  private initialized = false;
  private config: LoggingConfig;

  private constructor() {
    // Default minimal config - will be overridden in initialize()
    this.config = {
      defaultDriver: 'sqlite',
      logTypes: {
        [LogType.APPLICATION]: { driver: 'sqlite', level: LogLevel.INFO },
      },
      drivers: {
        sqlite: {},
      }
    };
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): LogManager {
    if (!LogManager.instance) {
      LogManager.instance = new LogManager();
    }
    return LogManager.instance;
  }

  /**
   * Initialize the log manager with configuration
   * @param config Optional config override (otherwise uses orchestrator config)
   */
  public async initialize(configOverride?: LoggingConfig): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Use provided config or try to load from orchestrator config
    try {
      if (configOverride) {
        this.config = configOverride;
      } else if (config?.logging) {
        this.config = config.logging as LoggingConfig;
      }

      // Set defaults from config
      this.defaultDriverName = this.config.defaultDriver || 'sqlite';
      
      // Set up driver for each log type
      for (const [type, typeConfig] of Object.entries(this.config.logTypes)) {
        this.typeToDriverMap.set(type, typeConfig.driver);
      }

      // Initialize each configured driver
      for (const [driverName, driverConfig] of Object.entries(this.config.drivers)) {
        await this.initializeDriver(driverName, driverConfig);
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing LogManager:', error);
      // Fallback to a basic SQLite driver if initialization fails
      if (!this.drivers.has('sqlite')) {
        await this.initializeDriver('sqlite', {});
      }
      this.defaultDriverName = 'sqlite';
      this.initialized = true;
    }
  }

  /**
   * Initialize a specific driver
   * @param driverName Name of the driver
   * @param config Driver configuration
   */
  private async initializeDriver(driverName: string, config: LogDriverConfig): Promise<void> {
    let driver: LogDriver;

    switch (driverName) {
      case 'sqlite':
        driver = new SQLiteLogDriver(config);
        break;
      case 'file':
        driver = new FileLogDriver(config);
        break;
      // Add cases for MySQL and PostgreSQL drivers when implemented
      default:
        console.warn(`Unknown driver type: ${driverName}, falling back to SQLite`);
        driver = new SQLiteLogDriver(config);
    }

    await driver.initialize();
    this.drivers.set(driverName, driver);
  }

  /**
   * Log a message with the appropriate driver based on log type
   * @param entry Log entry to write
   */
  public async log(entry: LogEntry): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const logType = entry.type || LogType.APPLICATION;
    const driverName = this.typeToDriverMap.get(logType.toString()) || this.defaultDriverName;
    const driver = this.drivers.get(driverName);

    if (driver) {
      await driver.write(entry);
    } else {
      console.error(`No driver found for log type: ${logType}`);
      // Fallback to default driver
      const defaultDriver = this.drivers.get(this.defaultDriverName);
      if (defaultDriver) {
        await defaultDriver.write(entry);
      } else {
        console.error('No default driver available, log message lost:', entry.message);
      }
    }
  }

  /**
   * Archive logs from all drivers that are older than the specified interval
   */
  public async archiveLogs(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const interval = env.LOG_STORAGE_INTERVAL;
    const storageDriver = env.LOG_STORAGE_DRIVER;
    const zipOption = env.LOG_STORAGE_ZIP_OPTION;

    // Collect logs to archive from all drivers
    const logsToArchive = new Map<string, string[]>();
    
    for (const [driverName, driver] of this.drivers.entries()) {
      const archivedLogs = await driver.archiveLogs(interval);
      if (archivedLogs.length > 0) {
        logsToArchive.set(driverName, archivedLogs);
      }
    }

    if (logsToArchive.size === 0) {
      console.log('No logs found to archive');
      return;
    }

    // Archive based on the configured storage driver
    switch (storageDriver) {
      case 's3':
        await this.archiveToS3(logsToArchive, zipOption);
        break;
      case 'ftp':
        await this.archiveToFTP(logsToArchive, zipOption);
        break;
      case 'archive':
      default:
        await this.archiveToLocalFilesystem(logsToArchive, zipOption);
        break;
    }
  }

  /**
   * Archive logs to S3
   * This is a placeholder implementation - you'll need to add the actual S3 upload code
   */
  private async archiveToS3(
    logsToArchive: Map<string, string[]>,
    _zipOption: string
  ): Promise<void> {
    if (!env.S3_BUCKET_NAME || !env.S3_REGION) {
      console.error('S3_BUCKET_NAME or S3_REGION not configured. Skipping S3 archival.');
      return;
    }

    const s3 = new S3Client({
      region: env.S3_REGION,
      credentials: env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
        ? { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY }
        : undefined
    });

    const prefix = env.S3_STORAGE_PREFIX || '';

    for (const [, files] of logsToArchive) {
      for (const filePath of files) {
        try {
          const key = `${prefix}${basename(filePath)}`;
          const body = createReadStream(filePath);
          await s3.send(new PutObjectCommand({ Bucket: env.S3_BUCKET_NAME, Key: key, Body: body }));
          console.log(`Uploaded ${filePath} to s3://${env.S3_BUCKET_NAME}/${key}`);
        } catch (error) {
          console.error('Failed to upload log to S3:', filePath, error);
        }
      }
    }
  }

  /**
   * Archive logs to FTP
   * This is a placeholder implementation - you'll need to add the actual FTP upload code
   */
  private async archiveToFTP(
    logsToArchive: Map<string, string[]>, 
    zipOption: string
  ): Promise<void> {
    console.log(`Would archive ${countLogs(logsToArchive)} logs to FTP: ${env.FTP_HOST}:${env.FTP_PORT}`);
    console.log('ZIP option:', zipOption);
    console.log('This is a placeholder. Implement FTP upload logic as needed.');
    
    // In a real implementation, you would:
    // 1. Prepare the logs (possibly compress)
    // 2. Use an FTP client to upload
    // 3. Delete the local copies if appropriate
  }

  /**
   * Archive logs to local filesystem
   */
  private async archiveToLocalFilesystem(
    logsToArchive: Map<string, string[]>, 
    zipOption: string
  ): Promise<void> {
    const archivePath = env.LOG_STORAGE_ARCHIVE_PATH || './archived_logs';
    
    // Create the archive directory if it doesn't exist
    await mkdir(archivePath, { recursive: true });
    
    // Create a timestamp for this archive run
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    
    switch (zipOption) {
      case 'zipPerLog':
        await this.archiveEachLogSeparately(logsToArchive, archivePath, timestamp);
        break;
      case 'zipAllTogether':
        await this.archiveAllLogsTogether(logsToArchive, archivePath, timestamp);
        break;
      case 'none':
      default:
        await this.archiveWithoutCompression(logsToArchive, archivePath, timestamp);
        break;
    }
  }

  /**
   * Archive each log file separately with compression
   */
  private async archiveEachLogSeparately(
    logsToArchive: Map<string, string[]>,
    archivePath: string,
    timestamp: string
  ): Promise<void> {
    // This is a placeholder for file-based log archives
    // For database logs, you'd need to export them to files first
    console.log(`Would archive each log separately to ${archivePath}`);
    
    // In a real implementation:
    // For each log file, you would create a separate .gz file
    // For database logs, export to files and then compress
  }

  /**
   * Archive all logs together with compression
   */
  private async archiveAllLogsTogether(
    logsToArchive: Map<string, string[]>,
    archivePath: string,
    timestamp: string
  ): Promise<void> {
    // This is a placeholder for file-based log archives
    // For database logs, you'd need to export them to files first
    console.log(`Would archive all logs together to ${archivePath}`);
    
    // In a real implementation:
    // Create a single archive containing all logs
    // For database logs, export to files first
  }

  /**
   * Archive logs without compression
   */
  private async archiveWithoutCompression(
    logsToArchive: Map<string, string[]>,
    archivePath: string,
    timestamp: string
  ): Promise<void> {
    // This is a placeholder for file-based log archives
    // For database logs, you'd need to export them to files first
    console.log(`Would archive logs without compression to ${archivePath}`);
    
    // In a real implementation:
    // Copy or move log files to the archive location
    // For database logs, export to files
  }

  /**
   * Shutdown all drivers
   */
  public async shutdown(): Promise<void> {
    for (const driver of this.drivers.values()) {
      await driver.shutdown();
    }
    this.drivers.clear();
    this.initialized = false;
  }
}

/**
 * Helper function to count total logs in the map
 */
function countLogs(logsToArchive: Map<string, string[]>): number {
  let count = 0;
  for (const logs of logsToArchive.values()) {
    count += logs.length;
  }
  return count;
}
