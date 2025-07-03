// Path: backend/src/services/executors/response.executor.ts

import { z } from 'zod';
import { IProcessStepExecutor } from '../process-registry.service.js';
import { fx, FxNode } from '@/core/fx.js';

// Define the configuration schema for this step using Zod.
// This is what the user will configure in the editor.
export const responseStepConfigSchema = z.object({
    statusCode: z.number().int().min(100).max(599).default(200),
    body: z.any().optional(), // Can be a static value or a JSONPath string like '$.steps.previous.result'
    headers: z.record(z.string()).optional(),
});

// Define a helper type from the Zod schema
type ResponseStepConfig = z.infer<typeof responseStepConfigSchema>;

// The Executor class implements the standard interface.
export class ResponseStepExecutor implements IProcessStepExecutor {
    private config: ResponseStepConfig;

    constructor(config: any) {
        // Validate the provided config against the schema upon instantiation
        this.config = responseStepConfigSchema.parse(config);
    }

    /**
     * The run method for the Response step.
     * Its job is to populate the `response` sub-node on the main requestFx context.
     * @param requestFx The main fx node for the entire request.
     * @returns A final status message.
     */
    async run(requestFx: FxNode): Promise<any> {
        // This step doesn't "return" a value in the traditional sense.
        // Its side-effect is to build the final response on the main context node.

        const finalResponse = fx.createNode();
        finalResponse.statusCode.set(this.config.statusCode);

        // Resolve the body. If it's a JSONPath string, resolve it from the context.
        let body = this.config.body;
        if (typeof body === 'string' && body.startsWith('$.')) {
            // Simple JSONPath-like resolution (can be replaced with a proper library)
            // Example: '$.steps.step-1.result'
            const path = body.substring(2).split('.');
            let resolvedValue = requestFx;
            for (const key of path) {
                resolvedValue = resolvedValue[key];
            }
            body = resolvedValue.val();
        }

        finalResponse.body.set(body);

        if (this.config.headers) {
            finalResponse.headers.set(this.config.headers);
        }

        // Attach the fully formed response to the main request context
        requestFx.response.set(finalResponse.val());

        return { status: 'Response prepared', statusCode: this.config.statusCode };
    }
}