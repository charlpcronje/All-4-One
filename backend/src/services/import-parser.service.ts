// Path: backend/src/services/import-parser.service.ts

import { ParsedCollection, importPostmanSchema } from '../controllers/api-import/schemas.js';
import { ProcessDefinition, BaseStepSchema, ProcessStep } from '../../../shared/schemas/process.schema.js';
import { randomUUID } from 'crypto';

export class ImportParserService {
    
    /**
     * Parses a raw Postman v2.1.0 collection string into a standardized intermediate format.
     */
    async parsePostmanCollection(collectionData: string): Promise<ParsedCollection> {
        const json = JSON.parse(collectionData);

        if (!json.info || !json.item || !json.info.schema.includes('v2.1.0')) {
            throw new Error("Invalid or unsupported Postman collection format. Please use v2.1.0.");
        }

        const parsed: ParsedCollection = {
            name: json.info.name,
            description: json.info.description?.content || json.info.description || '',
            baseUrl: this.getBaseUrl(json.variable),
            endpoints: []
        };
        
        // This recursive function will find all requests inside items/folders
        const findRequests = (items: any[]) => {
            for (const item of items) {
                if (item.request) { // This is an endpoint
                    parsed.endpoints.push({
                        name: item.name,
                        method: item.request.method,
                        path: this.buildPath(item.request.url),
                    });
                } else if (item.item) { // This is a folder, so we recurse
                    findRequests(item.item);
                }
            }
        };

        findRequests(json.item);
        return parsed;
    }
    /**
     * Converts our intermediate ParsedCollection into a full, executable ProcessDefinition graph.
     * This is where the magic happens, turning a list of endpoints into a runnable flow.
     * For now, it creates a simple graph with one HTTP step per endpoint, but this
     * can be expanded to build more complex flows.
     * @param parsedCollection The standardized collection data.
     * @returns A ProcessDefinition object ready to be stored and executed.
     */
    createProcessDefinition(parsedCollection: ParsedCollection): ProcessDefinition {
        const nodes: Record<string, ProcessStep> = {};
        
        // Handle case with no endpoints
        if (parsedCollection.endpoints.length === 0) {
            throw new Error("Cannot create a process definition from a collection with no endpoints.");
        }

        const startNodeId = `http_step_${this.sanitizeForId(parsedCollection.endpoints[0].name)}`;

        // Create a node for each endpoint found in the collection
        parsedCollection.endpoints.forEach((endpoint) => {
            const stepId = `http_step_${this.sanitizeForId(endpoint.name)}`;
            const successNodeId = "response_success";
            const failureNodeId = "response_failure";

            nodes[stepId] = {
                id: stepId,
                type: 'core:http_request', // This ID must match an entry in the ProcessRegistry
                label: `Call: ${endpoint.name}`,
                config: {
                    method: endpoint.method,
                    endpoint: endpoint.path,
                    // The user will need to select the actual downstream API ID in the editor later.
                    // We set a placeholder to make the schema valid.
                    apiId: 1, 
                },
                connections: {
                    onSuccess: successNodeId,
                    onFailure: failureNodeId,
                }
            };
        });

        // Add standard success and failure response nodes to terminate the flow
        nodes["response_success"] = {
            id: "response_success",
            type: "core:response",
            label: "Success Response",
            config: { statusCode: 200, body: "$.result" }, // Default to returning the result of the last successful step
            connections: { onSuccess: null, onFailure: null }
        };
        nodes["response_failure"] = {
            id: "response_failure",
            type: "core:response",
            label: "Failure Response",
            config: { statusCode: 500, body: { error: "$.error" } }, // Default to returning the error
            connections: { onSuccess: null, onFailure: null }
        };

        // This initial version creates a definition where only the first endpoint is reachable.
        // A more advanced import UI would let the user design the flow between all imported endpoints.
        return {
            id: `proc_${randomUUID()}`,
            name: `${parsedCollection.name} - Imported Flow`,
            startNode: startNodeId,
            nodes: nodes
        };
    }

    private getBaseUrl(variables: any[] | undefined): string {
        const baseUrlVar = variables?.find(v => v.key === 'baseUrl' || v.key === 'base_url');
        return baseUrlVar?.value || '';
    }

    private buildPath(url: any): string {
        if (!url) return '/';
        const pathArray = url.path || [];
        return '/' + (Array.isArray(pathArray) ? pathArray.join('/') : pathArray);
    }
    
    private sanitizeForId(name: string): string {
        return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    }
}