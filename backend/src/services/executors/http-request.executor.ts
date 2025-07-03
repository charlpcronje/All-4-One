// Path: backend/src/services/executors/http-request.executor.ts

import { z } from 'zod';
import { IProcessStepExecutor } from '../process-registry.service.js';
import { FxNode } from '@/core/fx.js';
import { apiRequest } from '@/api/client.js'; // Our existing API client

// Helper function to resolve JSONPath-like strings from the fx context.
// A more robust library could be used here in the future.
function resolveFxPath(context: FxNode, path: string): any {
    if (typeof path !== 'string' || !path.startsWith('$.')) {
        return path; // Return the literal value if it's not a path
    }
    const keys = path.substring(2).split('.');
    let currentValue: any = context;
    for (const key of keys) {
        if (currentValue === undefined || currentValue === null) return undefined;
        currentValue = currentValue[key];
    }
    // If the resolved value is an fx node, get its value. Otherwise, return it directly.
    return currentValue && typeof currentValue.val === 'function' ? currentValue.val() : currentValue;
}

// Define the configuration schema for the HTTP Request step.
export const httpRequestStepConfigSchema = z.object({
    // The downstream API record ID from our database. This tells the apiRequest client which base URL and auth to use.
    apiId: z.number().int().positive(),

    // The specific endpoint path to call on the downstream API.
    endpoint: z.string().startsWith('/'),

    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),

    // Mappings to construct the request. Values can be static or resolved from the context.
    // Example: "$.request.body.userId"
    parameters: z.record(z.string()).optional(),
    headers: z.record(z.string()).optional(),
    body: z.any().optional(),
});

type HttpRequestStepConfig = z.infer<typeof httpRequestStepConfigSchema>;

export class HttpRequestExecutor implements IProcessStepExecutor {
    private config: HttpRequestStepConfig;

    constructor(config: any) {
        this.config = httpRequestStepConfigSchema.parse(config);
    }

    /**
     * Executes the outbound HTTP request.
     * @param requestFx The main fx node for the entire request execution.
     * @returns The response data from the downstream API.
     */
    async run(requestFx: FxNode): Promise<any> {
        // 1. Resolve all parameters, headers, and body from the requestFx context.
        const resolvedParams = this.resolveMappings(requestFx, this.config.parameters);
        const resolvedHeaders = this.resolveMappings(requestFx, this.config.headers);
        const resolvedBody = this.resolveMappings(requestFx, this.config.body, true);

        // 2. Construct the final endpoint path, replacing URL parameters like /users/:id
        let finalEndpoint = this.config.endpoint;
        if (resolvedParams) {
            for (const [key, value] of Object.entries(resolvedParams)) {
                if (finalEndpoint.includes(`:${key}`)) {
                    finalEndpoint = finalEndpoint.replace(`:${key}`, encodeURIComponent(String(value)));
                    // Remove from params so it's not added as a query string
                    delete resolvedParams[key];
                }
            }
        }

        // Add remaining params as a query string
        if (resolvedParams && Object.keys(resolvedParams).length > 0) {
            const queryString = new URLSearchParams(resolvedParams as Record<string, string>).toString();
            finalEndpoint += `?${queryString}`;
        }

        // 3. Make the API call using our existing, robust apiRequest client.
        const response = await apiRequest(this.config.apiId, finalEndpoint, {
            method: this.config.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
            headers: resolvedHeaders as Record<string, string>,
            body: resolvedBody,
        });

        // 4. Check for a failed response and throw an error to trigger the 'onFailure' connection.
        if (!response.success) {
            const errorMessage = `Downstream API request failed with status ${response.status}.`;
            console.error(errorMessage, response.data);
            // We throw an error here so the ProcessRunner catches it and follows the onFailure path.
            throw new Error(errorMessage);
        }

        // 5. Return the successful response data. The ProcessRunner will place this in the step's `result` node.
        return response.data;
    }

    /**
     * Helper to resolve a record of static values or fx paths.
     */
    private resolveMappings(context: FxNode, mappings?: Record<string, any> | any, isBody: boolean = false): any {
        if (!mappings) {
            return isBody ? undefined : {};
        }

        // If we're processing the body and it's not an object of paths, resolve it directly.
        if (isBody && (typeof mappings !== 'object' || Array.isArray(mappings))) {
            return resolveFxPath(context, mappings);
        }

        if (typeof mappings !== 'object' || mappings === null) {
            return {};
        }

        const resolved: Record<string, any> = {};
        for (const [key, value] of Object.entries(mappings)) {
            resolved[key] = resolveFxPath(context, value);
        }
        return resolved;
    }
}