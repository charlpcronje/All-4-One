// Schema inspector to check what's actually in the database
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function inspectDatabaseSchema() {
  try {
    console.log('🔍 Inspecting database schema...');
    
    // Get all tables
    const tables = await db.select({
      name: sql`name`,
      sql: sql`sql`,
    }).from(sql`sqlite_master`)
      .where(sql`type = 'table' AND name NOT LIKE 'sqlite_%'`);
    
    console.log(`📋 Found ${tables.length} tables:`);
    
    // Print each table and its schema
    for (const table of tables) {
      console.log(`\n🔹 TABLE: ${table.name}`);
      console.log('CREATE STATEMENT:');
      console.log(table.sql);
      
      // Get all columns for this table
      const pragma = await db.select({
        name: sql`name`,
        type: sql`type`,
        pk: sql`pk`,
        notnull: sql`notnull`
      }).from(sql`pragma_table_info(${table.name})`);
      
      console.log('\nCOLUMNS:');
      for (const col of pragma) {
        console.log(`  - ${col.name} (${col.type})${col.pk ? ' PRIMARY KEY' : ''}${col.notnull ? ' NOT NULL' : ''}`);
      }
      
      // Check if there's any data in the table
      const countResult = await db.select({
        count: sql`count(*)`
      }).from(sql`${table.name}`);
      
      console.log(`\nROW COUNT: ${countResult[0].count}`);
    }
    
    console.log('\n✅ Schema inspection complete');
    
  } catch (error) {
    console.error('❌ Error inspecting schema:', error);
  }
}

// Run the inspection
inspectDatabaseSchema().catch(console.error);
