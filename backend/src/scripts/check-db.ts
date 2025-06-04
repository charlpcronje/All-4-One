// Simple database check script
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function checkDatabase() {
  try {
    console.log('🔍 Checking database tables and data...');
    
    // List all tables
    const tables = await db.select({ name: sql`name` })
      .from(sql`sqlite_master`)
      .where(sql`type = 'table' AND name NOT LIKE 'sqlite_%'`);
    
    console.log(`\n📋 Found ${tables.length} tables: ${tables.map(t => t.name).join(', ')}`);
    
    // Check users
    const users = await db.select({ id: sql`id`, email: sql`email`, role: sql`role` }).from(sql`users`);
    console.log(`\n👥 Users (${users.length}):`);
    users.forEach(user => console.log(`  - ID ${user.id}: ${user.email} (${user.role})`));
    
    // Check permissions
    const permissions = await db.select({
      id: sql`id`, 
      userId: sql`user_id`, 
      resource: sql`resource`,
      action: sql`action`
    }).from(sql`permissions`);
    console.log(`\n🔑 Permissions (${permissions.length}):`);
    permissions.forEach(perm => console.log(`  - ID ${perm.id}: User ${perm.userId} can ${perm.action} ${perm.resource}`));
    
    // Check APIs
    const apis = await db.select({ id: sql`id`, name: sql`name`, type: sql`type` }).from(sql`apis`);
    console.log(`\n🔌 APIs (${apis.length}):`);
    apis.forEach(api => console.log(`  - ID ${api.id}: ${api.name} (${api.type})`));
    
    // Check endpoints
    const endpoints = await db.select({ 
      id: sql`id`, 
      apiId: sql`api_id`, 
      path: sql`path`,
      method: sql`method`
    }).from(sql`endpoints`);
    console.log(`\n🔗 Endpoints (${endpoints.length}):`);
    endpoints.forEach(endpoint => console.log(`  - ID ${endpoint.id}: ${endpoint.method} ${endpoint.path} (API: ${endpoint.apiId})`));
    
    console.log('\n✅ Database check complete!');
  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

// Run the check
checkDatabase().catch(console.error);
