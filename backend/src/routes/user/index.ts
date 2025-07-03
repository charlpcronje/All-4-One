import { Hono } from 'hono';
import { Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { withReadQuery, withTransaction } from '../../db/transactions.js';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { createLogger } from '../../logging/index.js';
import bcrypt from 'bcrypt';
import { NamespaceService } from '../../services/namespace.service.js';

const logger = createLogger('routes:user');

// User schemas for validation
export const createUserSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8),
  domains: z.array(z.string()).optional(),
  role: z.enum(['admin', 'user']).optional().default('user')
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
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

      const usersWithDomains: UserWithDomains[] = [];

      for (const user of users) {
          const domains = await namespaceService.getDomainsByUserId(user.id);
          usersWithDomains.push({ ...user, domains: domains || [] });
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
      
      const domains = await namespaceService.getDomainsByUserId(user.id);
      const userWithDomains: UserWithDomains = { ...user, domains: domains || [] };
      
      return c.json({ success: true, data: userWithDomains });

    } catch (error) {
      logger.error(`Error getting user ${c.req.param('id')}`, { error });
      return c.json({ success: false, error: 'Failed to get user' }, 500);
    }
  });

  // Create a new user
  userRouter.post('/', zValidator('json', createUserSchema), async (c: Context) => {
    try {
      const input = c.req.valid('json');
      
      const passwordHash = await hashPassword(input.password);

      const result = await withTransaction(c, 'create user with domains', async (tx) => {
        const [user] = await tx.insert(schema.users).values({
          email: input.email,
          passwordHash,
          role: input.role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }).returning();

        const domains = input.domains || [];
        if (domains.length > 0) {
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

      const result = await withTransaction(c, 'update user with domains', async (tx) => {
        const updateData: Partial<typeof schema.users.$inferInsert> = {
            updatedAt: new Date().toISOString()
        };
        
        if(input.email) updateData.email = input.email;
        if(input.role) updateData.role = input.role;
        if (input.password) {
            updateData.passwordHash = await hashPassword(input.password);
        }

        const [user] = await tx.update(schema.users)
          .set(updateData)
          .where(eq(schema.users.id, id))
          .returning();

        if (!user) {
            throw new Error('User not found');
        }

        let domains = undefined;
        if (input.domains !== undefined) {
          await namespaceService.disassociateAllDomainsFromUser(id);
          if (input.domains.length > 0) {
            await namespaceService.associateDomainsWithUser(id, input.domains);
          }
          domains = input.domains;
        } else {
          domains = await namespaceService.getDomainsByUserId(id);
        }

        return { ...user, domains: domains || [] };
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
        const [user] = await tx.delete(schema.users)
          .where(eq(schema.users.id, id)).returning();
        
        if (!user) {
          throw new Error('User not found');
        }
        
        await namespaceService.disassociateAllDomainsFromUser(id);
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