// Database connection test script
import { db } from '../db/index.js';
import { users, permissions, apis, endpoints } from '../db/schema.js';
import { sql } from 'drizzle-orm';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic query
    const tablesQuery = await db.select({
      name: sql`name`,
    }).from(sql`sqlite_master`)
      .where(sql`type = 'table'`);
    
    console.log('📋 Database tables found:', tablesQuery.map(t => t.name).join(', '));
    
    // Try accessing the users table
    try {
      const usersCount = await db.select({ count: sql`count(*)` }).from(users);
      console.log(`👤 Users table exists with ${usersCount[0]?.count ?? 0} records`);
    } catch (error) {
      console.error('❌ Error accessing users table:', error);
    }
    
    // Check schema tables
    console.log('\n📊 Checking all schema tables:');
    
    const tables = [
      { name: 'users', table: users },
      { name: 'permissions', table: permissions },
      { name: 'apis', table: apis },
      { name: 'endpoints', table: endpoints }
    ];
    
    for (const table of tables) {
      try {
        const count = await db.select({ count: sql`count(*)` }).from(table.table);
        console.log(`✅ ${table.name} table exists with ${count[0]?.count ?? 0} records`);
      } catch (error) {
        console.error(`❌ Error accessing ${table.name} table:`, error);
      }
    }
    
    console.log('\n✅ Database connection test completed');
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
  }
}

// Run the test function
testDatabaseConnection().catch(console.error);
