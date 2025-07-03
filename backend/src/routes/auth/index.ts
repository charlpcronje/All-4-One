import { Hono } from 'hono';
import { Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { createLogger } from '../../logging/index.js';
import bcrypt from 'bcrypt';

const logger = createLogger('routes:auth');

// Schema for login input
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export function createAuthRouter() {
  const authRouter = new Hono();

  authRouter.post('/login', zValidator('json', loginSchema), async (c: Context) => {
    try {
      const { email, password } = c.req.valid('json');

      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(schema.users.email, email),
      });

      if (!user) {
        logger.warn('Login attempt with unknown email', { email });
        return c.json({ success: false, error: 'Invalid credentials' }, 401);
      }

      // Compare password
      const passwordMatch = await bcrypt.compare(password, user.passwordHash);

      if (!passwordMatch) {
        logger.warn('Login attempt with incorrect password', { email });
        return c.json({ success: false, error: 'Invalid credentials' }, 401);
      }

      logger.info('User logged in successfully', { userId: user.id, email: user.email });
      return c.json({ success: true, message: 'Login successful', user: { id: user.id, email: user.email, role: user.role } });

    } catch (error) {
      logger.error('Login error', { error });
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  });

  return authRouter;
}
