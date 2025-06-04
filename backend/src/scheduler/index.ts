/**
 * Scheduler for background tasks
 * 
 * This module handles scheduling of periodic tasks such as log archiving,
 * cache cleanup, etc. using node-cron.
 */
import cron from 'node-cron';
import { archiveLogs } from '../scripts/archive-logs.js';
import { LogPhase, logToDb } from '../logging/index.js';
import { env } from '../env.js';

// Task registry to keep track of all scheduled tasks
const scheduledTasks: Map<string, cron.ScheduledTask> = new Map();

/**
 * Schedule log archiving to run daily
 * @param cronExpression Optional cron expression override (default: midnight every day)
 */
export function scheduleLogArchiving(cronExpression = '0 0 * * *'): void {
  // Validate cron expression
  if (!cron.validate(cronExpression)) {
    throw new Error(`Invalid cron expression: ${cronExpression}`);
  }
  
  // Schedule task
  const task = cron.schedule(cronExpression, async () => {
    try {
      await logToDb({
        phase: LogPhase.ARCHIVE,
        message: 'Scheduled log archiving task started',
        success: true,
        metadata: {
          service: env.SERVICE_ID || 'dcr-backend',
          cronExpression
        }
      });
      
      await archiveLogs();
    } catch (error) {
      console.error('Error in scheduled log archiving task:', error);
      
      await logToDb({
        phase: LogPhase.ARCHIVE,
        message: 'Scheduled log archiving task failed',
        success: false,
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          service: env.SERVICE_ID || 'dcr-backend'
        }
      });
    }
  });
  
  // Store reference to task
  scheduledTasks.set('logArchiving', task);
  
  console.log(`Log archiving scheduled with cron expression: ${cronExpression}`);
}

/**
 * Initialize all scheduled tasks
 */
export async function initializeScheduler(): Promise<void> {
  await logToDb({
    phase: LogPhase.INIT,
    message: 'Initializing task scheduler',
    success: true,
    metadata: {
      service: env.SERVICE_ID || 'dcr-backend'
    }
  });
  
  // Schedule log archiving
  scheduleLogArchiving();
  
  // Add more scheduled tasks here as needed
  
  await logToDb({
    phase: LogPhase.INIT,
    message: 'Task scheduler initialized',
    success: true,
    metadata: {
      taskCount: scheduledTasks.size,
      service: env.SERVICE_ID || 'dcr-backend'
    }
  });
}

/**
 * Stop all scheduled tasks
 */
export async function shutdownScheduler(): Promise<void> {
  await logToDb({
    phase: LogPhase.SHUTDOWN,
    message: 'Shutting down task scheduler',
    success: true,
    metadata: {
      taskCount: scheduledTasks.size,
      service: env.SERVICE_ID || 'dcr-backend'
    }
  });
  
  // Stop all scheduled tasks
  for (const [name, task] of scheduledTasks.entries()) {
    task.stop();
    console.log(`Stopped scheduled task: ${name}`);
  }
  
  // Clear the registry
  scheduledTasks.clear();
}
