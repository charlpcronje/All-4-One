// Database Migration Runner
import { runMigrations } from './migrate.js';
import process from 'node:process';

// Run migrations when this script is executed directly
console.log('🔄 DCR Database Migration Runner');
console.log('--------------------------------');

runMigrations()
  .then(() => {
    console.log('✅ Migrations completed successfully');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
