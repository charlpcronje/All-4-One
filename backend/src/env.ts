import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define schema for environment variables
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, { message: 'DATABASE_URL is required' }),
  
  // Server settings
  PORT: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().positive()),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Application info
  APP_VERSION: z.string().default('1.0.0'),
  
  // AWS S3 and other storage credentials
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_STORAGE_PREFIX: z.string().optional(),
  
  // Log Archiving & Storage Configuration
  LOG_STORAGE_DRIVER: z.enum(['s3', 'ftp', 'archive']).default('archive'),
  LOG_STORAGE_INTERVAL: z.coerce.number().default(7), // In days
  LOG_STORAGE_ZIP_OPTION: z.enum(['zipPerLog', 'zipAllTogether', 'none']).default('none'),
  
  // FTP Storage Configuration
  FTP_HOST: z.string().optional(),
  FTP_PORT: z.coerce.number().default(21),
  FTP_USER: z.string().optional(),
  FTP_PASSWORD: z.string().optional(),
  FTP_REMOTE_PATH: z.string().optional(),
  
  // Archive (Local Filesystem) Storage
  LOG_STORAGE_ARCHIVE_PATH: z.string().optional(),
  
  // Application mode
  ORCHESTRATOR_MODE: z.enum(['primary', 'worker', 'standalone', 'test', 'dev', 'prod']).default('dev'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  SERVICE_ID: z.string().default('dcr-backend'),
});

// Process environment variables
function validateEnv() {
  try {
    // Parse and validate environment variables
    const env = envSchema.safeParse(process.env);

    if (!env.success) {
      console.error('❌ Invalid environment variables:');
      const errors = env.error.format();
      console.error(JSON.stringify(errors, null, 2));
      
      // Check for critical errors that should prevent startup
      const criticalVars = ['DATABASE_URL', 'PORT'];
      const hasCriticalErrors = criticalVars.some(
        (varName) => errors[varName as keyof typeof errors]
      );

      if (hasCriticalErrors) {
        throw new Error('Critical environment variables missing or invalid');
      }

      // Return default values for non-critical errors
      return envSchema.parse({
        ...process.env,
        PORT: process.env.PORT || '3000',
        NODE_ENV: process.env.NODE_ENV || 'development',
        ORCHESTRATOR_MODE: process.env.ORCHESTRATOR_MODE || 'dev'
      });
    }

    return env.data;
  } catch (error) {
    console.error('Failed to parse environment variables:', error);
    process.exit(1);
  }
}

// Export validated environment variables
export const env = validateEnv();
