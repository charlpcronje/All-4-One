import { db } from '../db/index.js';
import { users, permissions, apis, endpoints } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import process from 'node:process';
import { runMigrations } from './migrate.js';
import { env } from '../env.js';
import { apiInsertSchema, endpointInsertSchema } from '../schemas/api.schema.js';
import crypto from 'node:crypto';

// Simple password hashing function (in prod, use a proper library like bcrypt)
function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

// Helper function to calculate SHA-256 hash
function calculateHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

// Main seed function
async function seed() {
  try {
    // First ensure migrations are up to date
    console.log('🔄 Running migrations before seeding...');
    await runMigrations();
    
    console.log('🌱 Starting database seeding process...');
    console.log('🌱 Seeding database...');
    
    console.log('💾 Verifying database connection...');
    try {
      const testQuery = await db.select({ count: sql`count(*)` }).from(users);
      console.log(`✅ Database connection verified, user count: ${testQuery[0]?.count ?? 0}`);
    } catch (dbError) {
      console.error('❌ Database connection test failed:', dbError);
      throw new Error('Database connection failed, cannot proceed with seeding');
    }
    
    // Continue with seeding

  // Insert or update admin user
  const adminEmail = 'admin@example.com';
  const password = 'admin123'; // Default password, would change in production
  
  console.log(`👤 Checking for admin user: ${adminEmail}`);
  const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail));
  
  if (existingAdmin.length === 0) {
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [adminUser] = await db.insert(users).values({
      email: adminEmail,
      passwordHash: hashedPassword, // Changed from password to passwordHash to match schema
      role: 'admin'
      // Timestamps will be added automatically by SQLite defaults
    }).returning({ id: users.id });
    
    console.log(`✅ Admin user created with ID: ${adminUser.id}`);
  } else {
    console.log('ℹ️ Admin user already exists');
  }

  // Check existing APIs
  const existingApis = await db.select().from(apis);
  let apiId: number;
  
  if (existingApis.length === 0) {
    console.log('🔌 Creating sample API');
    
    try {
      // Create API config object
      const apiConfig = {
        timeout: 5000,
        retryCount: 3,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const configStr = JSON.stringify(apiConfig);
      
      // Validate with Zod schema before insertion
      const apiValues = apiInsertSchema.parse({
        name: 'example',
        slug: 'example',
        baseUrl: 'https://api.example.com',
        type: 'http',
        config: configStr,
        configHash: calculateHash(configStr),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const insertResult = await db.insert(apis).values(apiValues as any).returning({ id: apis.id });
      const insertedApi = insertResult[0];
      
      apiId = insertedApi.id;
      console.log(`✅ Sample API created with ID: ${apiId}`);
    } catch (error) {
      console.log('⚠️ Error creating API, checking if it already exists');
      const checkAgain = await db.select().from(apis).where(eq(apis.name, 'example'));
      if (checkAgain.length > 0) {
        apiId = checkAgain[0].id;
        console.log(`ℹ️ Found existing API with ID: ${apiId}`);
      } else {
        throw new Error('Failed to create or find API');
      }
    }
  } else {
    apiId = existingApis[0].id;
    console.log(`ℹ️ Sample API already exists with ID: ${apiId}`);
  }
  
  // Check for existing endpoints
  const existingEndpoints = await db.select().from(endpoints).where(eq(endpoints.apiId, apiId));
  
  if (existingEndpoints.length === 0) {
    console.log('🔌 Creating sample endpoint');
    
    try {
      // Create endpoint config object
      const endpointConfig = {
        timeout: 3000,
        retryCount: 1,
        headers: {}
      };
      
      const endpointConfigStr = JSON.stringify(endpointConfig);

      // Validate with Zod schema before insertion
      const endpointValues = endpointInsertSchema.parse({
        apiId,
        path: '/hello',
        method: 'GET',
        description: 'Sample endpoint',
        version: 'v1',
        config: endpointConfigStr,
        configHash: calculateHash(endpointConfigStr),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await db.insert(endpoints).values(endpointValues as any);
      
      console.log('✅ Sample endpoint created');
    } catch (error) {
      console.log('⚠️ Error creating endpoint:', error);
    }
  } else {
    console.log(`ℹ️ Sample endpoint already exists: ${existingEndpoints[0].path}`);
  }

  // Create additional test data if in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('💻 Creating test users for development...');
    
    // Create test users with different roles
    const testUsers: Array<{email: string, role: 'admin' | 'user'}> = [
      { email: 'user@example.com', role: 'user' },
      { email: 'admin2@example.com', role: 'admin' }
    ];
    
    for (const user of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await db.select().from(users).where(eq(users.email, user.email));
        
        if (existingUser.length === 0) {
          console.log(`👤 Creating test user: ${user.email} with role: ${user.role}`);
          const hashedPassword = await bcrypt.hash('password123', 10);
          
          try {
            const [newUser] = await db.insert(users).values({
              email: user.email,
              passwordHash: hashedPassword,
              role: user.role
              // Timestamps will be added automatically by SQLite defaults
            }).returning({ id: users.id });
            
            console.log(`✅ Test user created with ID: ${newUser.id}`);
            
            // Add permission for user role
            if (user.role === 'user') {
              try {
                await db.insert(permissions).values({
                  userId: newUser.id,
                  resource: 'api:example',
                  action: 'read'
                });
                
                console.log(`✅ Basic API permissions added for user: ${user.email}`);
              } catch (permError) {
                console.log(`⚠️ Error adding permission for user ${user.email}:`, permError);
              }
            }
          } catch (userInsertError) {
            console.log(`⚠️ Error creating user ${user.email}:`, userInsertError);
          }
        } else {
          console.log(`ℹ️ Test user already exists: ${user.email}`);
          
          // Check if user has permissions if it's a regular user
          if (user.role === 'user') {
            const userId = existingUser[0].id;
            const existingPermissions = await db.select().from(permissions)
              .where(eq(permissions.userId, userId));
              
            if (existingPermissions.length === 0) {
              console.log(`ℹ️ Adding missing permissions for existing user: ${user.email}`);
              
              try {
                await db.insert(permissions).values({
                  userId,
                  resource: 'api:example',
                  action: 'read'
                });
                
                console.log(`✅ Read permission for logs added to existing user: ${user.email}`);
              } catch (permError) {
                console.log(`⚠️ Error adding permission for existing user ${user.email}:`, permError);
              }
            } else {
              console.log(`ℹ️ Permissions already exist for user: ${user.email}`);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error processing test user ${user.email}:`, error);
      }
    }
  }
  
  console.log('🌱 Seed completed successfully');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error; // Re-throw so the calling function can handle it
  }
}

// Run the seed function if this script is executed directly
// Use import.meta.url for ES modules
const isMainModule = import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMainModule) {
  seed().catch((error: unknown) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
}

// Export for programmatic usage
export { seed };
