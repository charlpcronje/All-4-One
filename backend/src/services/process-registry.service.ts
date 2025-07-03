// Path: backend/src/services/process-registry.service.ts

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { fx } from '@/core/fx.js';
import { ResponseStepExecutor, responseStepConfigSchema } from './executors/response.executor.js';
import { HttpRequestExecutor, httpRequestStepConfigSchema } from './executors/http-request.executor.js';

// Define the contract that every step's executor class must follow.
export interface IProcessStepExecutor {
    run(requestFx: any): Promise<any>;
}

// backend/src/services/process-registry.service.ts

interface ProcessStepDefinition {
    id: string; // e.g., 'core:http_request', 'plugin:jwt-verify'
    name: string; // 'HTTP Request', 'JWT Verification'
    description: string;
    category: 'Core' | 'Authentication' | 'Transformation' | 'Logic' | 'Communication';
    // Zod schema for the configuration object this step requires
    configSchema: z.ZodObject<any>; 
    // The actual class or function to execute
    executor: any; // e.g., a class to be instantiated
}

class ProcessRegistry {
    private steps = new Map<string, ProcessStepDefinition>();

    /**
     * Registers a new step type, making it available to the system.
     * @param definition The definition of the process step.
     */
    register(definition: ProcessStepDefinition) {
        if (this.steps.has(definition.id)) {
            console.warn(`FX-WARN: Process step "${definition.id}" is being overridden.`);
        }
        this.steps.set(definition.id, definition);

        // Also register the executor class with fx's own registry for instantiation.
        // The `__proto` property in the definition will reference `definition.id`.
        fx.register(definition.executor, definition.id);
    }

    /**
     * Retrieves the full definition for a given step ID.
     * @param id The unique ID of the step.
     * @returns The process step definition or undefined.
     */
    getStep(id: string): z.infer<typeof ProcessStepDefinitionSchema> | undefined {
        return this.steps.get(id);
    }

    /**
     * Lists all available steps in a frontend-friendly format.
     * Converts Zod schemas to JSON Schemas for the UI.
     * @returns An array of available steps for the visual editor toolbox.
     */
    listAvailableSteps() {
        return Array.from(this.steps.values()).map(
            ({ id, name, description, category, configSchema }) => ({
                id,
                name,
                description,
                category,
                // The frontend will use this JSON Schema to dynamically build config forms.
                configJsonSchema: zodToJsonSchema(configSchema, {
                    name: `${id}-config`,
                    target: 'jsonSchema7'
                }),
            })
        );
    }
}

// Export a singleton instance for the application to use.
export const processRegistry = new ProcessRegistry();

// --- Register All Built-in Steps ---

// Register the Response Step
processRegistry.register({
    id: 'core:response',
    name: 'Send Response',
    description: 'Terminates the process and sends an HTTP response back to the original caller.',
    category: 'Core',
    configSchema: responseStepConfigSchema,
    executor: ResponseStepExecutor,
});

// Register the HTTP Request Step
processRegistry.register({
    id: 'core:http_request',
    name: 'HTTP Request',
    description: 'Makes an outbound HTTP request to a configured downstream API.',
    category: 'Communication',
    configSchema: httpRequestStepConfigSchema,
    executor: HttpRequestExecutor,
  });

// --- Example of registering a built-in step (we will build these next) ---
// import { HttpRequestExecutor } from './executors/http-request';
// const httpConfigSchema = z.object({
//   url: z.string().url(),
//   method: z.enum(['GET', 'POST', ...]).default('GET'),
//   headers: z.record(z.string()).optional(),
// });
// 