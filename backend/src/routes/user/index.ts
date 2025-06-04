import { Hono } from 'hono';
import { Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { withReadQuery, withWriteQuery, withTransaction } from '../../db/transactions.js';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { createLogger } from '../../logging/index.js';
import bcrypt from 'bcrypt';
import { NamespaceService } from '../../services/namespace.service.js';

const logger = createLogger('routes:user');

// User schemas for validation
export const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255).optional(),
  password: z.string().min(8).optional(),
  domains: z.array(z.string()).optional(),
  role: z.enum(['admin', 'user']).optional().default('user')
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).optional(),
  password: z.string().min(8).optional(),
  domains: z.array(z.string()).optional(),
  role: z.enum(['admin', 'user']).optional()
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Type for user with domains
export type UserWithDomains = typeof schema.users.$inferSelect & {
  domains?: string[];
};

// Helper function to hash password
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * Creates a user router with CRUD operations and domain binding support
 */
export function createUserRouter() {
  const userRouter = new Hono();
  const namespaceService = new NamespaceService();

  // Get all users
  userRouter.get('/', async (c: Context) => {
    try {
      const users = await withReadQuery(c, 'list users', async () => {
        return await db.select().from(schema.users);
      });

      // Convert to UserWithDomains[] with empty domains array
      const usersWithDomains: UserWithDomains[] = users.map(user => ({
        ...user,
        domains: []
      }));

      // Get domains for each user - batch this in a real implementation
      try {
        for (const user of usersWithDomains) {
          // This should use a proper namespaceService.getDomainsByUserId method
          const domains = await namespaceService.getDomainsByUserId(user.id);
          user.domains = domains || [];
        }
      } catch (error) {
        logger.warn('Failed to load domain data for users', { error });
      }

      return c.json({ success: true, data: usersWithDomains });
    } catch (error) {
      logger.error('Error listing users', { error });
      return c.json({ success: false, error: 'Failed to list users' }, 500);
    }
  });

  // Get a specific user by ID
  userRouter.get('/:id', async (c: Context) => {
    try {
      const id = Number(c.req.param('id'));
      
      if (isNaN(id)) {
        return c.json({ success: false, error: 'Invalid user ID' }, 400);
      }
      
      const user = await withReadQuery(c, 'get user', async () => {
        return await db.query.users.findFirst({
          where: eq(schema.users.id, id)
        });
      });

      if (!user) {
        return c.json({ success: false, error: 'User not found' }, 404);
      }

      // Get domains for the user
      try {
        const userWithDomains: UserWithDomains = {
          ...user,
          domains: []
        };
        
        // This should use a proper namespaceService.getDomainsByUserId method
        const domains = await namespaceService.getDomainsByUserId(user.id);
        userWithDomains.domains = domains || [];
        
        return c.json({ success: true, data: userWithDomains });
      } catch (error) {
        logger.warn('Failed to load domain data for user', { error, userId: id });
        return c.json({ 
          success: true, 
          data: { ...user, domains: [] },
          warning: 'Failed to load domain data' 
        });
      }
    } catch (error) {
      logger.error(`Error getting user ${c.req.param('id')}`, { error });
      return c.json({ success: false, error: 'Failed to get user' }, 500);
    }
  });

  // Create a new user
  userRouter.post('/', zValidator('json', createUserSchema), async (c: Context) => {
    try {
      const input = c.req.valid('json');
      
      // Hash password if provided
      let passwordHash: string | null = null;
      if (input.password) {
        passwordHash = await hashPassword(input.password);
      }

      const result = await withTransaction(c, 'create user with domains', async (tx) => {
        // Insert user
        const [user] = await tx.insert(schema.users).values({
          name: input.name,
          email: input.email,
          passwordHash,
          role: input.role,
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();

        // Associate domains if provided
        const domains = input.domains || [];
        if (domains.length > 0) {
          // This should use a proper namespaceService.associateDomainsWithUser method
          await namespaceService.associateDomainsWithUser(user.id, domains);
        }

        return {
          ...user,
          domains
        };
      });

      logger.info('Created new user', { id: result.id, email: result.email });
      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      logger.error('Error creating user', { error });
      return c.json({ success: false, error: 'Failed to create user' }, 500);
    }
  });

  // Update an existing user
  userRouter.put('/:id', zValidator('json', updateUserSchema), async (c: Context) => {
    try {
      const id = Number(c.req.param('id'));
      const input = c.req.valid('json');
      
      if (isNaN(id)) {
        return c.json({ success: false, error: 'Invalid user ID' }, 400);
      }
      
      if (Object.keys(input).length === 0) {
        return c.json({ success: false, error: 'No fields to update' }, 400);
      }

      // Hash password if provided
      let passwordHash: string | null | undefined = undefined;
      if (input.password) {
        passwordHash = await hashPassword(input.password);
      }

      const result = await withTransaction(c, 'update user with domains', async (tx) => {
        // First check if user exists
        const existingUser = await tx.query.users.findFirst({
          where: eq(schema.users.id, id)
        });
        
        if (!existingUser) {
          throw new Error('User not found');
        }
        
        // Update user
        const [user] = await tx.update(schema.users)
          .set({
            ...(input.name !== undefined && { name: input.name }),
            ...(input.email !== undefined && { email: input.email }),
            ...(passwordHash !== undefined && { passwordHash }),
            ...(input.role !== undefined && { role: input.role }),
            updatedAt: new Date()
          })
          .where(eq(schema.users.id, id))
          .returning();

        // Update domains if provided
        let domains = undefined;
        if (input.domains !== undefined) {
          // This should use proper namespaceService methods
          // First disassociate all existing domains
          await namespaceService.disassociateAllDomainsFromUser(id);
          
          // Then associate new domains
          if (input.domains.length > 0) {
            await namespaceService.associateDomainsWithUser(id, input.domains);
          }
          
          domains = input.domains;
        } else {
          // Get current domains
          domains = await namespaceService.getDomainsByUserId(id);
        }

        return {
          ...user,
          domains: domains || []
        };
      });

      logger.info('Updated user', { id });
      return c.json({ success: true, data: result });
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        return c.json({ success: false, error: 'User not found' }, 404);
      }
      
      logger.error(`Error updating user ${c.req.param('id')}`, { error });
      return c.json({ success: false, error: 'Failed to update user' }, 500);
    }
  });

  // Delete a user
  userRouter.delete('/:id', async (c: Context) => {
    try {
      const id = Number(c.req.param('id'));
      
      if (isNaN(id)) {
        return c.json({ success: false, error: 'Invalid user ID' }, 400);
      }
      
      await withTransaction(c, 'delete user', async (tx) => {
        // First check if user exists
        const user = await tx.query.users.findFirst({
          where: eq(schema.users.id, id)
        });
        
        if (!user) {
          throw new Error('User not found');
        }
        
        // Disassociate all domains before deleting
        await namespaceService.disassociateAllDomainsFromUser(id);
        
        // Delete the user
        await tx.delete(schema.users)
          .where(eq(schema.users.id, id));
      });
      
      logger.info('Deleted user', { id });
      return c.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        return c.json({ success: false, error: 'User not found' }, 404);
      }
      
      logger.error(`Error deleting user ${c.req.param('id')}`, { error });
      return c.json({ success: false, error: 'Failed to delete user' }, 500);
    }
  });

  return userRouter;
}
