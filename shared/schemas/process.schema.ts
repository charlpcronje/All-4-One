// This file is meant to be imported by projects that already have zod installed
// @ts-ignore - Zod is provided by the parent project
import { z } from 'zod';

export const StepConnectionSchema = z.object({
    onSuccess: z.string().nullable().default(null),
    onFailure: z.string().nullable().default(null),
});

export const BaseStepSchema = z.object({
    id: z.string(), // The unique ID of this node instance in the graph
    type: z.string(), // The registered executor ID, e.g., 'core:http_request'
    label: z.string(),
    config: z.record(z.any()).default({}),
    connections: StepConnectionSchema,
});

export const ProcessDefinitionSchema = z.object({
    id: z.string(),
    name: z.string(),
    startNode: z.string(),
    nodes: z.record(BaseStepSchema),
});

export type ProcessDefinition = z.infer<typeof ProcessDefinitionSchema>;
export type ProcessStep = z.infer<typeof BaseStepSchema>;