// Path: backend/src/controllers/process-steps.controller.ts

import { Hono } from 'hono';
import { processRegistry } from '@/services/process-registry.service.js';

const router = new Hono();

/**
 * GET /api/process-steps
 * Returns a list of all available process steps with their JSON schemas for the frontend editor.
 */
router.get('/', (c) => {
  try {
    const availableSteps = processRegistry.listAvailableSteps();
    return c.json({
      success: true,
      data: availableSteps,
    });
  } catch (error) {
    console.error('Error listing process steps:', error);
    return c.json({
        success: false,
        error: 'Failed to retrieve process steps',
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : JSON.stringify(error))
          : undefined
      },
      500
    );
  }
});

export { router as processStepsRouter };