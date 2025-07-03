// Path: core/fx.d.ts

// This tells TypeScript that there's a module at this path.
declare module '@/core/fx.js' {
    // Define the structure of an fx node.
    // We use `any` in many places because fx is highly dynamic.
    // A more advanced implementation could use generics.
    export interface FxNode {
        // --- Private Properties ---
        __id: string;
        __parent_id: string | null;
        __value: Record<string, any>;
        __nodes: Record<string, FxNode>;
        __type: string | null;
        __proto: string | FxNode | null;
        __watchers: Set<(newValue: any, oldValue: any, node: FxNode) => void>;
        __processes: Map<string, (...args: any[]) => Promise<any>>;
        __state: string;

        // --- Core Methods ---
        set(value: any): this;
        val<T>(defaultValue?: T): T;
        type(newType?: string): string | this;
        inherit(protoNode: FxNode | string): this;

        // --- Reactivity ---
        watch(callback: (newValue: any, oldValue: any, node: FxNode) => void): () => void;
        notify(oldValue: any, newValue: any): void;

        // --- Process & Selection ---
        flow(name: string, processFn: (...args: any[]) => Promise<any>): this;
        execute(name: string, ...args: any[]): Promise<any>;
        select(selector: string): FxNode[];

        // --- Serialization / Hydration ---
        wrap(): Record<string, any>;
        expand(data: Record<string, any>): this;

        // --- Dynamic Properties ---
        [key: string]: any;
    }

    // Define the shape of the main `fx` object/proxy.
    export interface Fx {
        // Accessor function
        (path: string, value?: any): FxNode;

        // Static methods
        createNode(parentId?: string | null): FxNode;
        register(classObj: any, name?: string): void;
        select(selector: string): FxNode[];
        query(selector: string): FxNode[];
        classRegistry: Map<string, any>;

        // Top-level node access
        [key: string]: FxNode | any;
    }

    // Define the shape of the DOM selector `$`
    export interface FxDomSelector {
        (selector: string): FxNode | FxNode[] | null;
    }

    // Define the shape of the graph selector `$$$`
    export interface FxGraphSelector {
        (selector: string): FxNode[];
    }

    // Export the globals
    export const fx: Fx;
    export const $$: Fx;
    export const $: FxDomSelector;
    export const $$$: FxGraphSelector;

    // Export the factory function as well
    export function createNode(parentId?: string | null): FxNode;
    export const classRegistry: Map<string, any>;

    export default fx;
}