# Section 13: Core FX Integration & VFS Architecture

## 13.0. Introduction & Core Concepts

This section outlines the plan to integrate the `fx.js` object as the central nervous system of the DCR. The goal is to move from a code-defined lifecycle to a **data-defined execution graph**. This means that the flow of an API request will be described by a JSON object (a "Process Definition") rather than by hardcoded logic in services.

### Key Concepts:

*   **Process Definition Graph:** A JSON object that represents the blueprint for an endpoint's execution. It contains a series of nodes (steps) and connections (e.g., `onSuccess`, `onFailure`) that define the flow. This graph is created by the user in the visual/JSON editors.
*   **FX-VFS (Virtual File System):** An in-memory file system (using `memfs`) that acts as a "system bus." We will materialize `fx` node trees onto this VFS as directories and files. This allows different processes or even different programming languages to interact with the system's state by reading and writing files, providing a powerful, language-agnostic IPC mechanism.
*   **Runtime `requestFx` Node:** For every incoming API call, a new root `fx` node is created. This node is the "live data carrier" for that specific request. It holds:
    *   `.definition`: A hydrated, read-only copy of the Process Definition Graph for that endpoint.
    *   `.runs`: An array of execution attempts, where each attempt logs its state, results, and errors.
*   **`materialize()` & `hydrate()`:** The core functions of the `FxVfsService`.
    *   `materialize()`: Takes a JSON object and writes it to the VFS as a directory/file tree.
    *   `hydrate()`: Reads a directory/file tree from the VFS and reconstructs it into a live, in-memory `fx` node.

---

## 13.1. Configure Isomorphic Imports for `core/fx.js`

**Goal:** Ensure the shared `core/fx.js` file, which contains both Node.js and browser-specific code, can be correctly imported and used by both the Vite frontend and the Node.js backend without errors.

*   [ ] **13.1.1 Adjust `tsconfig.json` Files**
    *   **Why?** The symlink structure can confuse TypeScript's module resolver. We need to ensure both projects can find the shared file and its types.
    *   **Files to Edit:** `backend/tsconfig.json`, `frontend/tsconfig.json`.
    *   **Action:** Add or verify path aliases. For example, in `paths`, add ` "@/core/*": ["../core/*"] ` for the backend and ` "@/core/*": ["../core/*"] ` for the frontend, adjusting the relative path as needed. This makes imports cleaner, like `import { fx } from '@/core/fx.js';`.

*   [ ] **13.1.2 Polyfill/Mock Environment-Specific APIs**
    *   **Why?** `fx.js` uses `crypto` and `module` (Node.js) as well as `window` and `XMLHttpRequest` (browser). The build tools for each environment will fail if they encounter APIs they don't support.
    *   **File to Edit:** `frontend/vite.config.ts`.
    *   **Action (Frontend):**
        *   Use Vite's `define` option to prevent errors with server-side globals: `define: { 'process.env.IS_SERVER': 'false' }`.
        *   Alias Node.js built-ins to browser-compatible shims or empty modules. Install `vite-plugin-node-polyfills` or manually add aliases like `resolve: { alias: { crypto: 'crypto-browserify' } }`.
    *   **File to Edit:** `backend/src/index.ts` (or a global setup file).
    *   **Action (Backend):**
        *   Ensure a global polyfill for browser APIs like `window` is available if any client-side logic were to accidentally run. A simple `global.window = undefined;` at the top level can prevent crashes, though the `IS_SERVER` guards in `fx.js` are the primary defense.

---

## 13.2. Implement `FxVfsService` and In-Memory File System

**Goal:** Create the service that manages the translation between abstract `fx` nodes and the concrete in-memory file system.

*   [ ] **13.2.1 Install `memfs`**
    *   **Why?** `memfs` provides an in-memory file system that implements the native Node.js `fs` API, making it perfect for our VFS without touching the actual disk.
    *   **Action:** Run `npm install memfs --workspace=backend`.

*   [ ] **13.2.2 Create `FxVfsService`**
    *   **Why?** This service will encapsulate all VFS logic, providing a clean API for the rest of the application.
    *   **Action:** Create the file `backend/src/services/fx-vfs.service.ts` and implement the `FxVfsService` class as detailed in the previous response.

*   [ ] **13.2.3 Implement `materialize` and `hydrate` Methods**
    *   **Why?** These are the core methods for writing to and reading from the VFS.
    *   **File to Edit:** `backend/src/services/fx-vfs.service.ts`.
    *   **Action (`materialize`):**
        *   Accepts a VFS path and a plain JavaScript object.
        *   Creates a directory at the path.
        *   Creates `__meta.json` with the object's metadata (`__type`, `__proto`, etc.).
        *   Creates a `__value` file with the object's primitive value or stringified JSON.
        *   Recursively calls itself for any sub-nodes in `__nodes`.
    *   **Action (`hydrate`):**
        *   Accepts a VFS path.
        *   Reads `__meta.json` and `__value`.
        *   Creates a new `fx` node, using `fx.expand()` to populate it with the read data, correctly instantiating classes if a `__proto` is defined.
        *   Recursively calls itself for all sub-directories to reconstruct the `__nodes` tree.

---

## 13.3. Implement the Process Step Registry

**Goal:** Create a central, dynamic registry of all available operations (plugins, core functions) that can be used in a process graph.

*   [ ] **13.3.1 Create `ProcessRegistry` Service**
    *   **Why?** To provide a single source of truth for what "steps" are available to the visual editor and the process runner.
    *   **Action:** Create `backend/src/services/process-registry.service.ts` and implement the `ProcessRegistry` class.

*   [ ] **13.3.2 Define `ProcessStepDefinition` Interface**
    *   **Why?** To establish a standard contract for all registered steps.
    *   **File to Edit:** `backend/src/services/process-registry.service.ts`.
    *   **Action:** Define the interface including `id`, `name`, `description`, `category`, a `configSchema` (Zod), and the `executor` class.

*   [ ] **13.3.3 Implement `register` and `listAvailableSteps`**
    *   **Why?** To populate the registry and expose its contents to the frontend.
    *   **File to Edit:** `backend/src/services/process-registry.service.ts`.
    *   **Action (`register`):** Adds a step definition to the internal map and also calls `fx.register()` to make the executor class available to the `fx` runtime.
    *   **Action (`listAvailableSteps`):** Returns a frontend-friendly list, converting the Zod `configSchema` for each step into a standard JSON Schema using `zod-to-json-schema`. Install this library: `npm install zod-to-json-schema --workspace=backend`.

*   [ ] **13.3.4 Create Backend Endpoint for Steps**
    *   **Why?** For the frontend's visual editor to dynamically build its toolbox of draggable nodes.
    *   **File to Edit:** `backend/src/routes/api.ts` or a new `backend/src/routes/dcr.ts`.
    *   **Action:** Add a new endpoint `GET /api/process-steps` that calls `processRegistry.listAvailableSteps()` and returns the JSON array.

---

## 13.4. Implement the `ProcessRunnerService`

**Goal:** Build the engine that reads a process definition from the VFS and executes it step-by-step.

*   [ ] **13.4.1 Create `ProcessRunnerService`**
    *   **Why?** This service contains the core execution logic, keeping it separate from routing and other concerns.
    *   **Action:** Create `backend/src/services/process-runner.service.ts`.

*   [ ] **13.4.2 Implement the Main `run(requestFx)` Method**
    *   **Why?** This is the entry point for executing a request.
    *   **File to Edit:** `backend/src/services/process-runner.service.ts`.
    *   **Action:**
        *   It receives the main `requestFx` node.
        *   It creates a new `run` node and adds it to the `requestFx.runs` array.
        *   It starts a `while` loop, beginning with the `startNode` from `requestFx.definition`.
        *   In each loop, it looks up the step's executor class from the `ProcessRegistry` via the `__proto` property.
        *   It instantiates the class and calls its `.run()` method.
        *   It logs results or errors to the corresponding step node under the current `run`.
        *   It determines the next step ID from the `connections` (`onSuccess` or `onFailure`).
        *   The loop terminates when there is no next step.

---

## 13.5. Refactor API Routing to Use the New Architecture

**Goal:** Replace the current placeholder API handlers with the new VFS-based process runner.

*   [ ] **13.5.1 Update the Dynamic Route Handler**
    *   **Why?** To connect incoming HTTP requests to our new execution engine.
    *   **File to Edit:** `backend/src/services/route-registration.service.ts`.
    *   **Action:**
        1.  In the `handler` function, fetch the `ProcessDefinition` JSON string from the database for the matched endpoint.
        2.  Create the main `requestFx` node.
        3.  Use the `FxVfsService` to `materialize` the definition onto the VFS under a unique request path (e.g., `/fx/runtime/requests/{uuid}`).
        4.  Invoke `processRunnerService.run(pathToRequestContext)`.
        5.  Once complete, use the VFS service to `wrap` the entire request context directory into a JSON string and save it as a log.
        6.  Send the final response that was written to the VFS by a `response` step.

---

## 13.6. Enhance Frontend Editors

**Goal:** Make the frontend editors powerful tools for creating and editing the `ProcessDefinition` graphs.

*   [ ] **13.6.1 Enhance JSON Editor**
    *   **Why?** To provide developers with intelligent feedback directly in the editor.
    *   **File to Edit:** `frontend/src/components/editors/JsonEditor.tsx`.
    *   **Action:**
        *   Install `zod-to-json-schema`: `npm install zod-to-json-schema --workspace=frontend`.
        *   Create a shared schema file `shared/schemas/process.schema.ts`.
        *   In the editor component, import the Zod schema, convert it to JSON Schema, and configure the Monaco editor instance with it.

*   [ ] **13.6.2 Build Visual Editor with React Flow**
    *   **Why?** To provide a user-friendly, no-code way to build complex API flows.
    *   **File to Edit:** `frontend/src/pages/orchestrator/ApiEditorPage.tsx` (and new components).
    *   **Action:**
        *   Install React Flow: `npm install reactflow --workspace=frontend`.
        *   Fetch the list of available steps from the new `GET /api/process-steps` endpoint.
        *   Create a toolbox/sidebar component that lists these steps.
        *   Implement the main `ReactFlow` canvas.
        *   Use component state (`useState`) to hold the `processDefinition` object. The `nodes` and `edges` props for React Flow will be derived from this state.
        *   Use React Flow's event handlers (`onNodesChange`, `onConnect`, etc.) to update the `processDefinition` state, ensuring the UI and the data are always synchronized.
        *   Create a property panel that appears when a node is selected, allowing its `config` to be edited.