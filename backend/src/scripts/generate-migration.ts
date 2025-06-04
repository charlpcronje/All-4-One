import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import * as schema from '../db/schema.ts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { env } from '../env.ts';

// Get the current file's directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate a migration file for database schema changes
 * @param migrationName - Name for the migration file
 */
async function generateMigration(migrationName: string): Promise<void> {
  console.log('🔧 Generating database migration...');

  if (!migrationName) {
    console.error('❌ Migration name is required');
    console.log('Usage: node generate-migration.ts <migration-name>');
    process.exit(1);
  }

  // Parse the DATABASE_URL for SQLite
  const dbPath = env.DATABASE_URL.replace('sqlite:///', '');
  console.log(`📁 Database path: ${dbPath}`);

  // Create a timestamp for migration file name
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const fileName = `${timestamp}_${migrationName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.sql`;

  // Define paths
  const migrationsFolder = path.resolve(__dirname, '../../drizzle');
  const migrationPath = path.join(migrationsFolder, fileName);

  // Ensure the migrations folder exists
  if (!fs.existsSync(migrationsFolder)) {
    console.log(`Creating migrations directory: ${migrationsFolder}`);
    fs.mkdirSync(migrationsFolder, { recursive: true });
  }

  try {
    // Copy the current schema to a temporary database
    const tempDbPath = ':memory:';
    const tempDb = new Database(tempDbPath);
    const db = drizzle(tempDb);

    // Create all tables in the temporary database
    for (const tableName in schema) {
      if (Object.prototype.hasOwnProperty.call(schema, tableName)) {
        const tableSchema = (schema as Record<string, any>)[tableName];
        
        if (tableSchema && typeof tableSchema === 'object' && tableSchema._.name) {
          const createTableSQL = sql.raw(
            `CREATE TABLE IF NOT EXISTS ${tableSchema._.name} (${
              Object.entries(tableSchema)
                .filter(([key]) => key !== '_')
                .map(([key, column]: [string, any]) => {
                  let definition = `${column.name} ${column.dataType}`;
                  if (column.primaryKey) definition += ' PRIMARY KEY';
                  if (column.notNull) definition += ' NOT NULL';
                  if (column.default !== undefined) definition += ` DEFAULT ${column.default}`;
                  if (column.unique) definition += ' UNIQUE';
                  return definition;
                })
                .join(', ')
            })`
          );

          await db.execute(createTableSQL);
        }
      }
    }

    // Generate SQL statements for the migration
    const migrationSQL = `-- Migration: ${migrationName}
-- Generated at: ${new Date().toISOString()}

-- Create tables
${Object.entries(schema)
  .filter(([key]) => key !== '_' && typeof (schema as Record<string, any>)[key] === 'object')
  .map(([tableName, tableSchema]: [string, any]) => {
    if (!tableSchema._.name) return '';
    
    return `-- Table: ${tableSchema._.name}
CREATE TABLE IF NOT EXISTS ${tableSchema._.name} (
  ${Object.entries(tableSchema)
    .filter(([key]) => key !== '_')
    .map(([key, column]: [string, any]) => {
      let definition = `${column.name} ${column.dataType}`;
      if (column.primaryKey) definition += ' PRIMARY KEY';
      if (column.notNull) definition += ' NOT NULL';
      if (column.default !== undefined) {
        if (typeof column.default === 'string' && column.default.includes('CURRENT_TIMESTAMP')) {
          definition += ` DEFAULT CURRENT_TIMESTAMP`;
        } else {
          definition += ` DEFAULT ${column.default}`;
        }
      }
      if (column.unique) definition += ' UNIQUE';
      return definition;
    })
    .join(',\n  ')}
);
`;
  })
  .join('\n')}

-- Add indexes (customize as needed)
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add any additional schema changes below

`;

    // Write the migration file
    fs.writeFileSync(migrationPath, migrationSQL, 'utf-8');
    console.log(`✅ Migration generated at: ${migrationPath}`);
    
    // Close the temporary database
    tempDb.close();
  } catch (error) {
    console.error('❌ Migration generation failed:', error);
    process.exit(1);
  }
}

// Get migration name from command line arguments
const migrationName = process.argv[2];

// Run the migration generator if this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateMigration(migrationName).catch(console.error);
}

// Export for programmatic usage
export { generateMigration };
