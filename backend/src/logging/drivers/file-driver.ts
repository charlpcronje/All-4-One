/**
 * File-based log driver implementation
 */
import { BaseLogDriver } from './base-driver.js';
import { LogDriverConfig, LogEntry, LogType } from '../types.js';
import { mkdir, writeFile, readdir, readFile, stat, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { exists } from '../../utils/fs.js';

export class FileLogDriver extends BaseLogDriver {
  private basePath: string;
  private maxSizeMB: number;
  private maxFiles: number;
  private currentLogFile: string | null = null;
  private currentLogSize = 0;

  constructor(config: LogDriverConfig = {}) {
    super(config);
    this.basePath = config.basePath || './logs';
    this.maxSizeMB = config.maxSizeMB || 10; // Default 10MB
    this.maxFiles = config.maxFiles || 7; // Default 7 files (1 week with daily rotation)
  }

  /**
   * Initialize the file driver
   * Creates log directory if it doesn't exist
   */
  async initialize(): Promise<void> {
    // Create base directory if it doesn't exist
    await mkdir(this.basePath, { recursive: true });
    
    // Determine current log file
    this.currentLogFile = this.generateLogFileName();
    
    // Check if current log file exists and get its size
    if (await exists(this.currentLogFile)) {
      const stats = await stat(this.currentLogFile);
      this.currentLogSize = stats.size;
    }
    
    // Clean up old log files if we exceed maxFiles
    await this.cleanupOldLogs();
    
    await super.initialize();
  }

  /**
   * Write a log entry to a file
   * @param entry The log entry to write
   */
  async write(entry: LogEntry): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const formattedLog = this.formatLogEntry(entry) + '\n';
    
    // Check if we need to rotate the log file
    const logSizeInMB = this.currentLogSize / (1024 * 1024);
    if (logSizeInMB >= this.maxSizeMB) {
      // Rotate the log file
      this.currentLogFile = this.generateLogFileName();
      this.currentLogSize = 0;
      await this.cleanupOldLogs();
    }

    // Append to the current log file
    if (this.currentLogFile) {
      await writeFile(this.currentLogFile, formattedLog, { flag: 'a' });
      this.currentLogSize += Buffer.byteLength(formattedLog);
    }
  }

  /**
   * Generate a log filename based on current date
   * @returns Path to the log file
   */
  private generateLogFileName(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Include log type in filename if specified in config
    const typeSegment = this.config.options?.logType 
      ? `-${this.config.options.logType}` 
      : '';
    
    return join(this.basePath, `dcr${typeSegment}-${dateStr}.log`);
  }

  /**
   * Clean up old log files if we exceed maxFiles
   */
  private async cleanupOldLogs(): Promise<void> {
    try {
      // Get all log files in the directory
      const files = await readdir(this.basePath);
      const logFiles = files.filter(file => file.endsWith('.log'));
      
      // Sort by modification time (oldest first)
      const fileStats = await Promise.all(
        logFiles.map(async file => {
          const filePath = join(this.basePath, file);
          const fileStat = await stat(filePath);
          return { file: filePath, mtime: fileStat.mtime };
        })
      );
      
      fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
      
      // Delete oldest files if we have more than maxFiles
      const filesToDelete = fileStats.slice(0, Math.max(0, fileStats.length - this.maxFiles));
      await Promise.all(filesToDelete.map(file => unlink(file.file)));
    } catch (error) {
      console.error('Error cleaning up old log files:', error);
    }
  }

  /**
   * Archive logs older than specified days
   * @param olderThanDays Archive logs older than this many days
   * @returns Array of archived log file paths
   */
  async archiveLogs(olderThanDays: number): Promise<string[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - olderThanDays);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    
    try {
      // Get all log files in the directory
      const files = await readdir(this.basePath);
      const logFiles = files.filter(file => file.endsWith('.log'));
      
      // Find files from the target day
      const oldFiles: string[] = [];
      
      for (const file of logFiles) {
        const filePath = join(this.basePath, file);
        const fileStat = await stat(filePath);
        
        if (fileStat.mtime >= startDate && fileStat.mtime < endDate) {
          oldFiles.push(filePath);
        }
      }
      
      return oldFiles;
    } catch (error) {
      console.error('Error finding old log files:', error);
      return [];
    }
  }
}
