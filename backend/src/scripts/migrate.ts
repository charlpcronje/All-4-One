import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { db } from '../db/index.js';
import { env } from '../env.js';

// Get the current file's directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('🔄 Running database migrations...');

  // Parse the DATABASE_URL for SQLite
  const dbPath = env.DATABASE_URL.replace('sqlite:', '');
  console.log(`📁 Database path: ${dbPath}`);

  // Ensure the database directory exists
  const dbDir = path.resolve(process.cwd(), path.dirname(dbPath));
  if (!fs.existsSync(dbDir)) {
    console.log(`Creating database directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  // Get the full database file path
  const fullDbPath = path.resolve(process.cwd(), dbPath);

  try {
    // Connect to SQLite database
    const sqlite = new Database(fullDbPath);
    const db = drizzle(sqlite);

    // Run migrations
    const migrationsFolder = path.resolve(__dirname, '../db/migrations');
    console.log(`👉 Looking for migrations in: ${migrationsFolder}`);
    
    // For SQL file migrations, we need to read and execute them manually
    const migrationFiles = fs.readdirSync(migrationsFolder)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure migrations run in order
      
    console.log(`Found ${migrationFiles.length} migration files to run`);
    
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsFolder, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Split the SQL into statements and execute each one
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        try {
          sqlite.exec(statement);
        } catch (error) {
          console.error(`Error executing statement from ${file}:`, error);
          throw error;
        }
      }
      
      console.log(`✅ Successfully ran migration: ${file}`);
    }
    console.log('✅ Migrations completed successfully');
    
    // Close the database connection
    sqlite.close();
    
    console.log('🚀 Database is ready to use');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Call the migration function if this script is executed directly
// Check if this script is being run directly
// Use import.meta.url for ES modules
const isMainModule = import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMainModule) {
  runMigrations().catch(console.error);
}

// Export for programmatic usage
export { runMigrations };
