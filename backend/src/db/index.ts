import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';
import { env } from '../env.js';
// Node.js process import not needed
// import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';

// Load database path from environment variables
const dbPath = env.DATABASE_URL || 'sqlite:///data/dcr.db';

// Extract file path from connection string
const filePath = dbPath.replace('sqlite:', '');

// Get absolute path resolution
const fullDbPath = path.resolve(process.cwd(), filePath);
const dbDir = path.dirname(fullDbPath);

// Ensure the directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`Created database directory: ${dbDir}`);
}

// Connect to SQLite database
const sqlite = new Database(fullDbPath);
console.log(`Connected to database at: ${fullDbPath}`);

// Create drizzle instance
export const db = drizzle(sqlite, { schema });

// Export schema for migrations and other uses
export { schema };
