### `docs\notes.md`

```md
Leave this here: This file is for the coding assistant to make notes about what it learned from the previous set of tasks performed. This does not have to be specific to this code base, but anything that would help improve coding performance in the future.
---
# Notes for Coding assistant.

## Lessons Learned: Large Files, Duplicates, and Workflow Improvements

### 1. Handling Large Files and Duplicate Methods
- When working with large files (over 300 lines), only a segment (e.g., 200 lines) is visible at a time. This can cause a lack of complete context and may lead to accidentally duplicating methods or code blocks when making iterative edits.
- In the recent iteration, this led to multiple duplicate function implementations in the `NamespaceService` class, causing TypeScript errors and confusion.
- **Lesson:** For files larger than 300 lines, always proactively recommend or perform splitting into smaller, manageable modules before making any edits. This ensures complete context, avoids duplication, and improves maintainability.

### 2. Improved Coding Workflow for the Assistant
- After each coding run or task:
  1. **Open and review `docs/tasks.md`** to check what is next and to follow any provided context links.
  2. **Add new notes to `docs/notes.md`** about what was learned, challenges, or workflow improvements.
  3. **Re-read previous notes** in `docs/notes.md` to reinforce best practices and avoid repeating past mistakes.
- This workflow will help maintain context, improve coding performance, and ensure continuous improvement.

---
```


### `docs\tasks.md`

```md
# DCR Tasks - Project Breakdown

---

## 1. Project Setup

- [x] 1.1 Initialize backend project with TypeScript, Hono, Drizzle
- [x] 1.2 Initialize frontend project with Vite, React, Tailwind, ShadCN
- [x] 1.3 Create shared directory for Zod schemas
[Check notes from self to self (coding assistant)](./notes.md)
---

## 2. Environment & Config

- [x] 2.1 Setup `.env` loader and validate critical vars
- [x] 2.2 Create `config/orchestrator.json` default file
- [x] 2.3 Implement config merge logic (orchestrator > API > endpoint)
[Check notes from self to self (coding assistant)](./notes.md)
---

## 3. Backend Routing & Lifecycle

- [x] 3.1 Scaffold core Hono app (`/api` route base)
- [x] 3.2 Implement lifecycle phases: `beforeRequest`, `request`, `afterRequest`
- [x] 3.3 Support lifecycle method chaining and skipping (e.g. cache hit)
- [x] 3.4 Create DCR route for built-in endpoints
[Check notes from self to self (coding assistant)](./notes.md)
---

## 4. ORM & DB Schema

- [x] 4.1 Define Drizzle schema for all tables (`users`, `permissions`, `apis`, etc.)
- [x] 4.2 Implement lifecycle support for DB ops: `beforeExecute`, `execute`, `afterExecute`
- [x] 4.3 Create migration runner (SQL-based migrations)
- [x] 4.4 Add seed script (admin user + dummy endpoint)
[Check notes from self to self (coding assistant)](./notes.md)
---

## 5. Logging & Persistence

- [x] 5.1 Implement `logToDB()` with phase tagging
- [ ] 5.2 Schedule daily export to S3 (exactly 7 days old)
- [x] 5.3 Attach log hooks to each lifecycle phase
- [ ] 5.4 Implement logs viewer backend (with filters)
[Check notes from self to self (coding assistant)](./notes.md)
---

## 6. API Imports & Mapping
[Section 6 Context](./tasks/section6.md)
- [x] 6.1 Parse Postman collection v2.1 to internal format
- [x] 6.2 Generate `config.json` for each endpoint
- [x] 6.3 Store imported APIs in `apis` and `endpoints` tables with full JSON config
  - [x] Store config files on filesystem with version folders structure
  - [x] Store JSON content in database for redundancy
  - [x] Track config file hashes for integrity checking
- [x] 6.4 Register and route imported endpoints
- [x] 6.5 Implement API versioning system
  - [x] Create version folder structure (`api-name/v1`, `api-name/v2`, etc.)
  - [x] Add version switching in api.json (`currentVersion` field)
  - [x] Support accessing multiple versions simultaneously
- [ ] 6.6 Implement local Git-based configuration tracking
  - [x] Set up local Git repository for config files
  - [ ] Create auto-commit system for config changes
  - [ ] Build simple history viewer in dashboard
- [ ] 6.7 Create JSON configuration editor in dashboard
  - [ ] Monaco-based editor with syntax highlighting
  - [ ] Schema validation against Zod schemas
  - [ ] Auto-completion based on endpoint schemas
[Check notes from self to self (coding assistant)](./notes.md)
---

## 7. Sub-API + Multi-Protocol Communication

[Section 7 Context](./tasks/section7.md)

- [ ] 7.1 Register sub-APIs and configs
- [ ] 7.2 Implement HTTP, WebSocket, and local RPC request handlers
- [ ] 7.3 Implement fallback priority logic (RPC > HTTP > WS)
- [ ] 7.4 Add retry and delay scheduling with status tracking
[Check notes from self to self (coding assistant)](./notes.md)
---

## 8. Webhooks & Retry Engine

[Section 8 Context](./tasks/section8.md)

- [ ] 8.1 Attach webhook URL per lifecycle phase and status code
- [ ] 8.2 Implement retry queue table and worker
- [ ] 8.3 Allow manual retry via dashboard
- [ ] 8.4 Add backoff strategy support
[Check notes from self to self (coding assistant)](./notes.md)
---

## 9. Frontend UI

### 9.1 Core UI & Layout

[Section 9.1 Context](./tasks/section9.1.md)

- [x] 9.1.1 Create ShadCN + Tailwind layout (dark/light mode toggle)
- [x] 9.1.2 Implement responsive navigation and sidebar
- [x] 9.1.3 Create reusable components library
- [ ] 9.1.4 Implement global state management with React Context/Redux
[Check notes from self to self (coding assistant)](./notes.md)

### 9.2 Authentication Pages

[Section 9.2 Context](./tasks/section9.2.md)

- [ ] 9.2.1 Login page with JWT token handling
- [ ] 9.2.2 Forgot password page with email verification
- [ ] 9.2.3 Reset password page
- [ ] 9.2.4 User profile and settings page
- [ ] 9.2.5 JWT token refresh mechanism
[Check notes from self to self (coding assistant)](./notes.md)
### 9.3 Dashboard

[Section 9.3 Context](./tasks/section9.3.md)

- [x] 9.3.1 Main dashboard with key metrics
- [ ] 9.3.2 Live API call visualization with D3.js
- [ ] 9.3.3 System health indicators
- [ ] 9.3.4 Recent activity feed
- [x] 9.3.5 Quick access to common actions
[Check notes from self to self (coding assistant)](./notes.md)
### 9.4 Orchestrator

[Section 9.4 Context](./tasks/section9.4.md)

- [x] 9.4.1 API list and overview page
  - [x] API status indicators
  - [ ] Version selection
  - [x] Quick action buttons
- [x] 9.4.2 API detail page
  - [ ] Visual representation of API structure
  - [x] Authentication configuration
  - [x] Endpoint list
- [ ] 9.4.3 API import interface
  - [ ] Postman collection import
  - [ ] Custom format import
  - [ ] Import progress tracking
- [x] 9.4.4 Visual endpoint builder
  - [x] Request configuration
  - [x] Response handling
  - [ ] Lifecycle plugin selection
[Check notes from self to self (coding assistant)](./notes.md)

### 9.5 Plugin Management

[Section 9.5 Context](./tasks/section9.5.md)

- [ ] 9.5.1 Plugin directory and marketplace
- [ ] 9.5.2 Plugin configuration interface
- [ ] 9.5.3 Custom plugin creation wizard
- [ ] 9.5.4 Plugin testing environment
[Check notes from self to self (coding assistant)](./notes.md)

### 9.6 Logs Viewer

[Section 9.6 Context](./tasks/section9.6.md)

- [ ] 9.6.1 Advanced log filtering system
- [ ] 9.6.2 Log detail inspection
- [ ] 9.6.3 Log export functionality
- [ ] 9.6.4 Real-time log streaming
- [ ] 9.6.5 Log archiving interface
[Check notes from self to self (coding assistant)](./notes.md)

### 9.7 Configuration Editor

[Section 9.7 Context](./tasks/section9.7.md)

- [x] 9.7.1 Monaco-based JSON editor
- [x] 9.7.2 Schema validation visualization
- [x] 9.7.3 Config version history viewer
- [ ] 9.7.4 Config diff comparison tool
[Check notes from self to self (coding assistant)](./notes.md)
### 9.8 Scheduler

[Section 9.8 Context](./tasks/section9.8.md)

- [ ] 9.8.1 Request scheduling interface
- [ ] 9.8.2 Retry configuration
- [ ] 9.8.3 Scheduled tasks calendar view
- [ ] 9.8.4 Manual trigger options
[Check notes from self to self (coding assistant)](./notes.md)
### 9.9 User Management

[Section 9.9 Context](./tasks/section9.9.md)

- [ ] 9.9.1 User listing and CRUD operations
- [ ] 9.9.2 Role-based permissions editor
- [ ] 9.9.3 User activity monitoring
- [ ] 9.9.4 Team management
[Check notes from self to self (coding assistant)](./notes.md)
---

## 10. Shared Schemas & Type Safety

[Section 10 Context](./tasks/section10.md)

- [x] 10.1 Define Zod schemas for users, logs, endpoints, etc.
- [x] 10.2 Export types via `z.infer<typeof Schema>`
- [x] 10.3 Use schemas on backend validation
- [ ] 10.3.1 Use schemas on frontend forms
- [ ] 10.4 Implement schema-driven form builder (future)
[Check notes from self to self (coding assistant)](./notes.md)
---

## 11. Deployment Prep

[Section 11 Context](./tasks/section11.md)

- [ ] 11.1 Dockerize backend + frontend
- [ ] 11.2 Setup production-ready `.env` and config
- [ ] 11.3 Add system healthcheck endpoint (`/status`)
- [ ] 11.4 Deploy on AWS EC2, attach S3 bucket
[Check notes from self to self (coding assistant)](./notes.md)

## 12. Domain-Based Namespace Routing

[Section 12 Context](./tasks/section12.md)

- [x] 12.1 Implement `domain -> namespace` resolution from Host header
- [x] 12.2 Add `domainBindings` to API config schema
- [x] 12.3 Restrict dynamic route handler by domain-based namespace
- [x] 12.4 Add log tagging by `domain` + `namespace`
- [ ] 12.5 Add fallback if domain unregistered (403 or default landing)
- [ ] 12.6 Add dashboard page: Domains & Namespaces overview
- [ ] 12.7 Allow domain-only client registrations (no username/password)
- [ ] 12.8 Securely reject cross-namespace traffic from domain routes[Check notes from self to self (coding assistant)](./notes.md)


## 13. Core FX Integration & VFS Architecture

- [ ] 13.1 Configure Isomorphic Imports for `core/fx.js`
  - [ ] 13.1.1 Adjust `backend/tsconfig.json` and `frontend/tsconfig.json` to correctly resolve the symlinked `core/fx.js` module.
  - [ ] 13.1.2 Polyfill or mock Node.js/Browser-specific APIs (`crypto`, `window`) to prevent runtime errors when `fx.js` is imported into the "wrong" environment.
- [ ] 13.2 Implement `FxVfsService` and In-Memory File System
  - [ ] 13.2.1 Install `memfs` library in the backend workspace.
  - [ ] 13.2.2 Create `backend/src/services/fx-vfs.service.ts` with the `materialize` and `hydrate` methods.
  - [ ] 13.2.3 Ensure the service uses the VFS structure we defined (`__meta.json`, `__value`).
- [ ] 13.3 Implement the Process Step Registry
  - [ ] 13.3.1 Create `backend/src/services/process-registry.service.ts`.
  - [ ] 13.3.2 Define the `ProcessStepDefinition` interface, including `configSchema` (Zod).
  - [ ] 13.3.3 Implement `register` and `listAvailableSteps` methods. The list method should convert Zod schemas to JSON Schemas for the frontend.
  - [ ] 13.3.4 Create a backend endpoint `GET /api/process-steps` to expose available steps.
- [ ] 13.4 Implement the `ProcessRunnerService`
  - [ ] 13.4.1 Create `backend/src/services/process-runner.service.ts`.
  - [ ] 13.4.2 Implement the main `run(requestFx)` method that traverses the process definition.
  - [ ] 13.4.3 The runner should create a new `run` node under `requestFx.runs` for each execution.
  - [ ] 13.4.4 The runner should look up executors from the `ProcessRegistry` and instantiate/call them, logging results to the current `run` node.
- [ ] 13.5 Refactor API Routing to use the new architecture
  - [ ] 13.5.1 Update the dynamic route handler in `backend/src/services/route-registration.service.ts`.
  - [ ] 13.5.2 The handler should now fetch the Process Definition JSON from the DB.
  - [ ] 13.5.3 It should use `FxVfsService.materialize` to create the runtime VFS context for the request.
  - [ ] 13.5.4 It should invoke the `ProcessRunnerService` to execute the request.
  - [ ] 13.5.5 After execution, it should serialize the final `requestFx` state from the VFS and save it as a log.
- [ ] 13.6 Enhance Frontend Editors
  - [ ] 13.6.1 **JSON Editor:** Integrate `zod-to-json-schema`. Configure the Monaco editor with the schema from the `ProcessRegistry` to enable autocomplete and validation.
  - [ ] 13.6.2 **Visual Editor (React Flow):**
    - [ ] Install `react-flow-renderer` or a similar library.
    - [ ] Fetch available steps from `GET /api/process-steps` to populate the toolbox.
    - [ ] Implement the drag-and-drop canvas that modifies the `processDefinition` JSON in the component's state.
    - [ ] Implement the property panel for configuring selected nodes, using the `configJsonSchema` for dynamic form generation.
```


### `docs\tasks\seciton12.md`

```md
## 12. Domain-Based Namespace Routing

- [ ] 12.1 Implement `domain -> namespace` resolution from Host header**
    - `backend/src/index.ts`**: **Why?** This is where global middleware is applied. A new middleware function will be added here to intercept requests, read the `Host` header, and resolve it to a namespace. This namespace information would then be added to the Hono context (`c.set('namespace', resolvedNamespace)`).
    - New Backend Service (e.g., `backend/src/services/namespace.service.ts`)**: **Why?** To encapsulate the logic for resolving a domain to a namespace. This service would likely query the database or read a configuration map.
    - `backend/src/db/schema.ts` (Potentially New Table or Extension to `apis` Table)**: **Why?** You'll need to store the mapping between domains and namespaces. This could be a new table (e.g., `domain_namespaces` {domain, namespace, api_id/group_id}) or an extension to the `apis` table if an API itself is directly associated with a domain and implies a namespace.
    - `backend/src/config/index.ts` or API config files**: **Why?** Alternatively, if the domain-to-namespace mapping is static or part of API config, it would be defined here. Task 12.2 suggests it's in API config.

- [ ] 12.2 Add `domainBindings` to API config schema**
    - `backend/src/config/index.ts`**: **Why?** The `ApiConfigSchema` (or a new schema referenced by it) will need to be updated to include a `domainBindings` field. This field would likely be an array of objects, each mapping a domain to a specific namespace or indicating that the API should be accessible under that domain.
    - `backend/src/db/schema.ts`**: **Why?** The `apis.configJson` column (or new dedicated columns) would store this updated API configuration. If `domainBindings` are stored separately for more efficient querying, a new table might be linked to `apis`.
    - `frontend/src/lib/schemas/api-schema.ts`**: **Why?** The frontend's representation of the API configuration schema will also need to be updated if there's a visual editor or frontend validation for these bindings.
    - `frontend/src/pages/orchestrator/ApiEditorPage.tsx`**: **Why?** The JSON editor (and any future visual editor) would need to understand and allow editing of this new `domainBindings` section in the API configuration.

- [ ] 12.3 Restrict dynamic route handler by domain-based namespace**
    - `backend/src/routes/api.ts` (or the dynamic routing mechanism)**: **Why?** The logic that dynamically registers or handles requests for imported/configured APIs will need to be modified. It will:
        1.  Access the resolved namespace from the Hono context (set in Task 12.1).
        2.  Filter or select the appropriate API configuration based on whether its `domainBindings` match the current request's domain and resolved namespace.
    - `backend/src/services/namespace.service.ts` (from 12.1)**: **Why?** This service might also provide functions to check if a given API is accessible under the current namespace.
    - `backend/src/db/schema.ts` (and API config files)**: **Why?** The route handler will query/read API configurations (which now include `domainBindings`) to make routing decisions.

- [ ] 12.4 Add log tagging by `domain` + `namespace`**
    - `backend/src/logging/middleware.ts`**: **Why?** The existing `loggerMiddleware` can be enhanced. After the namespace resolution middleware (from Task 12.1) runs, the `loggerMiddleware` can access the `domain` (from `Host` header) and `resolvedNamespace` (from `c.get('namespace')`) and add them to the log metadata.
    - `backend/src/logging/core.ts`**: **Why?** The `Logger` class's internal `log` method or the `logToConsole` / `logToDatabase` methods might be updated to consistently include these tags if they are passed in the metadata.
    - `backend/src/logging/database.ts`**: **Why?** The `logToDB` function will save this additional domain/namespace metadata into the `metadataJson` field of the `logs` table.
    - `backend/src/db/schema.ts`**: **Why?** The `logs.metadataJson` field will store this. No schema change needed unless you want dedicated columns for domain/namespace in the logs table for easier querying (which could be an optimization).
    - `backend/src/logging/types.ts`**: **Why?** The `LogEntry` interface might be updated to optionally include `domain` and `namespace` as top-level properties for clarity, though storing them in `metadata` is also fine.

- [ ] 12.5 Add fallback if domain unregistered (403 or default landing)**
    - The new middleware from Task 12.1 (`backend/src/index.ts`)**: **Why?** If the `namespace.service.ts` cannot resolve a domain to a namespace (i.e., the domain is not registered or mapped), this middleware should handle the fallback. It can either:
        *   Return a 403 Forbidden response directly.
        *   Set a flag in the context, and a subsequent global error handler or routing layer returns a 403.
        *   Redirect to a default landing page (less common for APIs, more for web apps).
    - `backend/src/services/namespace.service.ts`**: **Why?** This service will return a null or specific indicator when a domain is not found, which the middleware will use to trigger the fallback.

- [ ] 12.6 Add dashboard page: Domains & Namespaces overview**
    - `frontend/src/App.tsx`**: **Why?** To add a new route (e.g., `/orchestrator/domains` or `/settings/domains`) for this new dashboard page.
    - New Frontend Page (e.g., `frontend/src/pages/orchestrator/DomainManagementPage.tsx`)**: **Why?** This page will display the list of registered domains, their associated namespaces, and potentially the APIs/services linked to them. It will allow for CRUD operations on these mappings.
    - `frontend/src/layouts/DashboardLayout.tsx`**: **Why?** To add a new navigation item in the sidebar pointing to this new page.
    - New Backend Endpoints (e.g., in `backend/src/routes/dcr.ts` or a new `backend/src/routes/domains.ts`)**: **Why?** CRUD endpoints are needed for the frontend to manage domain-to-namespace mappings (e.g., `GET /dcr/domains`, `POST /dcr/domains`, `DELETE /dcr/domains/:domainName`).
    - `backend/src/db/schema.ts` (and the table from 12.1)**: **Why?** The backend endpoints will interact with the database table that stores domain-namespace mappings.

- [ ] 12.7 Allow domain-only client registrations (no username/password)**
    - This is an Authentication/Authorization task.**
    - New Backend Auth Middleware (or modification to existing auth logic)**: **Why?** This middleware, running after domain/namespace resolution, would check if the request's resolved namespace/domain is associated with a "domain-only client." If so, it might bypass traditional user authentication or apply a specific set of permissions associated with that domain/client.
    - `backend/src/db/schema.ts` (Potentially New Table: `domain_clients` or `tenants`)**: **Why?** A new table to store these "domain-only clients" or "tenants", linking a domain (and/or namespace) to a set of permissions or an API key. This table might include fields like `domain`, `namespace`, `client_id`, `api_key_hash`, `associated_permissions_json`.
    - `backend/src/routes/dcr.ts` or `backend/src/routes/admin.ts`**: **Why?** Endpoints would be needed to manage these domain-client registrations (create, list, revoke API keys for domains).
    - `frontend/src/pages/orchestrator/DomainManagementPage.tsx` (from 12.6)**: **Why?** The UI to manage these domain-client registrations could be part of the domains & namespaces overview page.

- [ ] 12.8 Securely reject cross-namespace traffic from domain routes**
    - The domain/namespace resolution middleware (from Task 12.1)**: **Why?** This middleware sets the `resolvedNamespace` in the Hono context.
    - API Route Handlers (`backend/src/routes/api.ts` or dynamic router)**: **Why?** When an API endpoint is invoked, the handler must check if the target API/resource legitimately belongs to or is accessible by the `resolvedNamespace` from the context. If an API is configured with `domainBindings` (from 12.2) for `domainA` mapping to `namespaceA`, and a request comes via `domainA`, then only resources within `namespaceA` should be accessible.
    - `backend/src/services/namespace.service.ts`**: **Why?** Might provide utility functions like `isApiInNamespace(apiId, namespace)` or `getNamespaceForApi(apiId)`.
    - `backend/src/db/schema.ts`**: **Why?** The `apis` table (with `domainBindings` in `configJson` or a separate mapping table) will be the source of truth for which APIs belong to which namespaces/domains.
    - Authorization Logic (could be part of auth middleware or specific to route handlers)**: **Why?** After authentication, an authorization step would confirm that the authenticated identity (be it a user or a domain-client) has rights to access the requested resource *within the current namespace*.

This should cover the new tasks with the necessary context!
```


### `docs\tasks\section10.md`

```md
## 10. Shared Schemas & Type Safety

- [ ] 10.3.1 Use schemas on frontend forms**
    - `frontend/src/pages/auth/LoginPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`**: **Why?** These pages contain forms that should use Zod schemas for validation (e.g., validating email format, password strength, matching passwords).
    - `frontend/src/pages/orchestrator/ApiEditorPage.tsx` (Visual Editor)**: **Why?** If the visual editor is built with forms (e.g., for configuring endpoint details, headers, parameters), these forms will use Zod schemas.
    - `frontend/src/pages/orchestrator/ApiImportPage.tsx`**: **Why?** Form for API name, description, version, etc., before final import.
    - `frontend/src/lib/schemas/api-schema.ts`**: **Why?** Contains frontend-specific or detailed schemas for API configuration forms.
    - `shared/schemas/index.ts`**: **Why?** Provides general Zod schemas (like `userSchema`) that can be used for form validation.
    - `@hookform/resolvers` and `zod`**: **Why?** These dependencies (already in `frontend/package.json`) will be used to integrate Zod schemas with React Hook Form.

- [ ] 10.4 Implement schema-driven form builder (future)**
    - New Frontend Components Directory (e.g., `frontend/src/components/forms`)**: **Why?** This is where generic form-building components would reside (e.g., `SchemaDrivenForm.tsx`, `FormInput.tsx`, `FormSelect.tsx`).
    - `frontend/src/lib/schemas/api-schema.ts` and `shared/schemas/index.ts`**: **Why?** These Zod schemas would be the input to the schema-driven form builder, which would dynamically render form fields based on the schema's structure and types.
    *   Any page that would benefit from dynamically generated forms based on a schema.
```


### `docs\tasks\section11.md`

```md
## 11. Deployment Prep

- [ ] 11.1 Dockerize backend + frontend**
    - New File: `backend/Dockerfile`**: **Why?** To define the build and runtime environment for the backend Node.js/Hono application.
    - New File: `frontend/Dockerfile`**: **Why?** To define the build process for the Vite/React frontend (e.g., `npm run build`) and serve the static assets (e.g., using Nginx or a simple static server).
    - New File: `docker-compose.yml` (at project root)**: **Why?** To orchestrate the backend, frontend, and potentially a database (like Postgres for production-like testing) for local development and testing of the containerized setup.

- [ ] 11.2 Setup production-ready `.env` and config**
    - `backend/.env.example`**: **Why?** This file serves as the template. You will create a production `.env` file based on this, filling in actual production values (database URLs, JWT secrets, AWS keys, etc.).
    - `backend/config/orchestrator.json`**: **Why?** Review and adjust default settings for production (e.g., `logLevel` to 'info' or 'warn', secure `jwtSecret` if not solely in .env, sensible `defaultRetries` and `defaultCacheTtl`). Consider a `orchestrator.prod.json` if overrides are needed.
    - `backend/src/env.ts`**: **Why?** Ensure all environment variables required for production (especially S3 keys, production database URL, JWT_SECRET) are defined in the `envSchema` and properly validated.
    - `backend/src/config.ts`**: **Why?** Review how configurations are loaded and merged, ensuring it behaves correctly in a production environment (e.g., file paths, overrides).

- [ ] 11.3 Add system healthcheck endpoint (`/status`)**
    - `backend/src/routes/api.ts`**: **Why?** The `/health` endpoint already exists.
    - `backend/src/routes/dcr.ts`**: **Why?** The `/status` endpoint exists and provides more details like DB status, uptime, and memory. This task involves reviewing these endpoints, ensuring they check all critical dependencies (database, cache, any external services the DCR relies on directly), and return appropriate status codes for monitoring tools.

- [ ] 11.4 Deploy on AWS EC2, attach S3 bucket**
    - `backend/.env` (Production version)**: **Why?** This file on the EC2 instance will contain the S3 bucket name and AWS credentials for the log archiving feature.
    - `backend/src/scripts/archive-logs.ts`**: **Why?** The S3 archiving logic within this script will be used.
    - `backend/src/logging/manager.ts`**: **Why?** The `archiveToS3` method needs to be fully implemented.
    - `Dockerfile`s (from Task 11.1)**: **Why?** These will be used to build the images deployed to EC2.
    - (New) Deployment Scripts (e.g., shell scripts, Ansible playbooks, Terraform configs)**: **Why?** These would be created to automate the deployment process to EC2, configure the environment, and set up S3 bucket policies if needed. Not directly in the codebase but essential for this task.

This should give a comprehensive mapping of tasks to the relevant parts of your codebase!
```


### `docs\tasks\section5.md`

```md
## 5. Logging & Persistence

- [ ] 5.2 Schedule daily export to S3 (exactly 7 days old)
    - `backend/src/scheduler/index.ts`**: **Why?** This is where the cron job will be defined and scheduled to trigger the S3 export. You'll add a new scheduled task here.
    - `backend/src/scripts/archive-logs.ts`**: **Why?** This script currently contains the logic for archiving logs. It will need to be adapted or augmented to handle S3 export specifically. It shows how `LogManager` is used for archival.
    - `backend/src/logging/manager.ts`**: **Why?** The `LogManager` is responsible for coordinating log archiving. You might extend it to include S3-specific archiving logic or ensure it correctly calls the S3 export mechanism. The `archiveToS3` method is a placeholder here.
    - `backend/src/logging/drivers/base-driver.ts`**: **Why?** Reference for how log drivers are structured. You might create a new `s3-driver.ts` for fetching logs if they are directly written to S3, or for managing the export process if logs are first local.
    - `backend/src/logging/database.ts`**: **Why?** The `findOldLogs` function will be crucial for identifying which logs (stored in the primary DB) are older than 7 days and need to be exported to S3.
    - `backend/src/env.ts`**: **Why?** To define and load AWS S3 credentials (access key, secret key, bucket name, region) and S3 specific configurations like `S3_STORAGE_PREFIX`.
    - `backend/src/config.ts`**: **Why?** If any S3-specific configuration (beyond credentials) needs to be stored in `orchestrator.json`, this file manages that. The `logging.archival` section in `config.ts` and `orchestrator.json` will be relevant.
    - `docs/design.md`**: **Why?** Section 4.4 ("Logging and Archiving Strategy") and Section 3 (".env Structure") detail the S3 configuration and overall archival strategy.
    - `backend/src/logging/types.ts`**: **Why?** To define or use types related to S3 storage or archiving options if needed.

- [ ] 5.4 Implement logs viewer backend (with filters)
    - `backend/src/routes/dcr.ts`**: **Why?** This file already contains a basic `/logs` endpoint. You will expand this endpoint to accept filter parameters (e.g., date range, log level, source, message content) and query the database accordingly.
    - `backend/src/db/index.ts`**: **Why?** Provides the `db` instance for database querying.
    - `backend/src/db/schema.ts`**: **Why?** Defines the `logs` table schema, which you'll query. Understanding its columns is essential for filtering.
    - `backend/src/db/transactions.ts`**: **Why?** To wrap your database read queries with lifecycle hooks if necessary, or for consistent query execution.
    - `backend/src/logging/database.ts`**: **Why?** Contains `findOldLogs` which is an example of querying the logs table. You might adapt or create new query functions here based on filter requirements.
    - `backend/src/logging/types.ts`**: **Why?** Defines `LogEntry`, `LogLevel`, `LogPhase`, etc., which are relevant for understanding filterable fields.
    - `shared/schemas/index.ts`**: **Why?** The `logSchema` could be used to validate query parameters for the logs endpoint if you choose to implement strict validation.
```


### `docs\tasks\section6.md`

```md
## 6. API Imports & Mapping

- [ ] 6.4 Register and route imported endpoints
    - `backend/src/routes/api.ts`**: **Why?** This is the main API router. You'll need a mechanism here (or in a dynamically loaded module) to register new routes based on the imported API and endpoint configurations.
    - `backend/src/index.ts`**: **Why?** The main Hono application setup. Changes might be needed if dynamic route registration requires modification to how the app is initialized or how routers are mounted.
    - `backend/src/controllers/api-import/import.ts`**: **Why?** This controller handles the import process. After successfully importing and saving API/endpoint configurations, it should trigger the route registration logic.
    - `backend/src/db/schema.ts`**: **Why?** You'll fetch API (`apis` table) and endpoint (`endpoints` table) definitions from the database to dynamically build and register routes.
    - `backend/src/services/config-fs.service.ts`**: **Why?** Endpoint configurations (defining how to handle requests, target URLs, etc.) will be loaded from the filesystem using this service.
    - `backend/src/lifecycle/index.ts`**: **Why?** Dynamically registered routes for imported endpoints will still need to go through the defined request lifecycle phases.

- [ ] 6.5 Implement API versioning system
    - [ ] Create version folder structure (`api-name/v1`, `api-name/v2`, etc.)**
        - `backend/src/services/config-fs.service.ts`**: **Why?** This service manages filesystem operations for configuration files. Its methods (`ensureApiDirectoryStructure`, `saveEndpointConfig`, `readEndpointConfig`) will need to be updated to handle versioned directories (e.g., `apis/{apiSlug}/{version}/endpoint.json`).
        - `backend/src/controllers/api-import/import.ts`**: **Why?** When a new API or a new version of an API is imported, this controller must ensure configurations are saved into the correct versioned folder structure.
        - `backend/src/config.ts`**: **Why?** The `getApiConfigPath` and related functions might need adjustment if versioning changes the base path logic.
    - [ ] Add version switching in api.json (`currentVersion` field)**
        - `backend/src/services/config-fs.service.ts`**: **Why?** The `saveApiConfig` and `readApiConfig` methods will need to handle the `api.json` file which might contain a `currentVersion` field.
        - `backend/src/db/schema.ts`**: **Why?** The `apis` table (specifically the `configJson` or a new dedicated column) might store or reflect this `currentVersion`. If not in DB, the routing logic will rely on `api.json`.
        - `docs/design.md`**: **Why?** Section 6.5 mentions the `currentVersion` field.
    - [ ] Support accessing multiple versions simultaneously**
        - `backend/src/routes/api.ts`**: **Why?** The routing logic will need to be significantly enhanced to handle paths that include API versions, e.g., `/api/{api-slug}/v1/endpoint` and `/api/{api-slug}/v2/endpoint`.
        - `backend/src/services/config-fs.service.ts`**: **Why?** This service will need to load endpoint configurations from the correct version-specific directory.
        - `backend/src/db/schema.ts`**: **Why?** The `endpoints` table already has a `version` column. Database queries for endpoints will need to filter by this version.

- [ ] 6.6 Implement local Git-based configuration tracking**
    - [ ] Set up local Git repository for config files**
        - `backend/src/services/git.service.ts`**: **Why?** This service will encapsulate all Git commands. The `ensureGitInitialized` method will handle `git init` and initial setup like `.gitignore`.
        - `backend/src/config.ts`**: **Why?** The `configDir.basePath` determines the root of the Git repository. The `configDir.gitEnabled` flag controls if Git features are active.
        - `backend/src/index.ts`**: **Why?** Or an initialization script run at startup. This is where `gitService.ensureGitInitialized()` should be called to set up the Git repo if it doesn't exist.
    - [ ] Create auto-commit system for config changes**
        - `backend/src/services/git.service.ts`**: **Why?** Will need a method like `commitChanges(message, pathSpec)` for staging and committing.
        - `backend/src/services/config-fs.service.ts`**: **Why?** After any file write operation (`saveApiConfig`, `saveEndpointConfig`), this service should check the `enableAutoCommit` flag and, if true, call `gitService.commitChanges()`.
        - `backend/src/controllers/api-import/import.ts`**: **Why?** After successfully importing and saving API configurations, it should trigger a Git commit.
        - `backend/src/routes/apis.ts`**: **Why?** If API configurations can be modified directly through API endpoints (e.g., PATCH `/api/apis/:id`), these handlers must also trigger Git commits.
        - `backend/src/config.ts`**: **Why?** The `configDir.enableAutoCommit` flag will control this behavior.
    - [ ] Build simple history viewer in dashboard**
        - `frontend/src/components/api/VersionHistoryViewer.tsx`**: **Why?** This component is already designed to display Git commit history (currently with mock data). It will need to be connected to fetch real data.
        - `backend/src/controllers/api-import/git.ts`**: **Why?** This controller already provides the backend endpoints (`/git/history/:apiSlug` and `/git/diff/:apiSlug/:commitId`) that the frontend will call.
        - `backend/src/services/git.service.ts`**: **Why?** This service contains the actual Git logic (`getCommitHistory`, `getDiff`) used by the controller.
        - `frontend/src/pages/orchestrator/ApiEditorPage.tsx`**: **Why?** This page is the likely place where the `VersionHistoryViewer` component will be integrated to show the history for the API being edited.

- [ ] 6.7 Create JSON configuration editor in dashboard**
    - [ ] Monaco-based editor with syntax highlighting**
        - `frontend/src/components/editors/JsonEditor.tsx`**: **Why?** This is the existing Monaco editor component. It will be the core of this feature.
        - `frontend/src/pages/orchestrator/ApiEditorPage.tsx`**: **Why?** This page already uses the `JsonEditor.tsx` component. This task might involve enhancing its usage or ensuring it's correctly configured for various config files (API level, endpoint level).
    - [ ] Schema validation against Zod schemas**
        - `frontend/src/components/editors/JsonEditor.tsx`**: **Why?** It has `schema` and `onValidate` props. The `onValidate` callback needs to be fully implemented to display errors based on Zod validation.
        - `frontend/src/lib/schemas/api-schema.ts`**: **Why?** Contains the `apiConfigSchema` (and potentially endpoint-specific schemas) that will be used for frontend validation within the Monaco editor.
        - `shared/schemas/index.ts`**: **Why?** Could also be a source for Zod schemas if a unified schema definition is preferred for frontend and backend config validation.
    - [ ] Auto-completion based on endpoint schemas**
        - `frontend/src/components/editors/JsonEditor.tsx`**: **Why?** The Monaco editor instance needs to be configured with JSON schemas to enable auto-completion. This involves using Monaco's API, likely within the `handleEditorDidMount` function, specifically `monaco.languages.json.jsonDefaults.setDiagnosticsOptions({ schemas: [...] })`.
        - `frontend/src/lib/schemas/api-schema.ts`**: **Why?** The Zod schemas here would need to be converted/adapted into a format Monaco understands for its JSON schema configuration (or directly use JSON schema files if available).
        *   `backend/src/schemas/api.schema.ts`: Potentially for schema definitions if they are served from backend.
```


### `docs\tasks\section7.md`

```md
## 7. Sub-API + Multi-Protocol Communication

- [ ] 7.1 Register sub-APIs and configs**
    - `backend/src/db/schema.ts`**: **Why?** The `apis` table schema will store the configurations for these sub-APIs. The `type` column ('http', 'websocket', 'rpc') and `configJson` will be key.
    - `backend/src/routes/apis.ts`**: **Why?** CRUD endpoints (POST, GET, PATCH, DELETE for `/apis`) will be used to manage these API registrations, including their types and protocol-specific configurations.
    - `frontend/src/pages/orchestrator/ApiListPage.tsx`**: **Why?** UI to list and manage these diverse API types.
    - `frontend/src/pages/orchestrator/ApiEditorPage.tsx`**: **Why?** UI to create/edit API configurations, including selecting the type (HTTP, WS, RPC) and providing necessary connection details in the JSON editor.
    - `docs/design.md`**: **Why?** Section 8 (Sub-API / Postman Mapping) and 4.2 (API Config) for design reference.

- [ ] 7.2 Implement HTTP, WebSocket, and local RPC request handlers**
    - `backend/src/api/client.ts`**: **Why?** This file currently handles outgoing HTTP requests. It will need to be significantly refactored or new services/clients created to handle WebSocket connections/messages and local RPC calls.
    - `backend/src/lifecycle/index.ts`**: **Why?** The `request` phase within the `executeHooks` function will need to identify the API type (from its configuration) and dispatch the request to the appropriate client (HTTP, WS, or RPC).
    - `backend/src/config/index.ts` (and individual API config files)**: **Why?** These files will store the protocol-specific configurations (e.g., WebSocket URL, RPC method names, connection parameters) for each registered sub-API.
    - `backend/src/db/schema.ts`**: **Why?** The `apis.type` column and `configJson` (or new specific columns) will provide the necessary information to the lifecycle/client about how to communicate.

- [ ] 7.3 Implement fallback priority logic (RPC > HTTP > WS)**
    - `backend/src/api/client.ts`**: **Why?** Or a new overarching "communication service". This logic will attempt connections in the specified order (RPC, then HTTP, then WS if applicable for the API type) and handle failures before trying the next protocol in the fallback chain.
    - `backend/src/config/index.ts` (and API/Endpoint config files)**: **Why?** Configurations might define allowed protocols or preferred fallback order for specific APIs/endpoints.
    - `docs/design.md`**: **Why?** Section 9 (Communication Protocols) outlines this fallback strategy.

- [ ] 7.4 Add retry and delay scheduling with status tracking**
    - `backend/src/api/client.ts`**: **Why?** The existing retry logic (`executeWithRetry`, `calculateBackoff`) needs to be generalized to work across HTTP, WebSocket (for connection attempts or message sends), and RPC calls.
    - `backend/src/db/schema.ts`**: **Why?** The `retry_schedule` table is already defined and will be used to store requests that need to be retried later, along with their status and attempt count.
    - `backend/src/scheduler/index.ts`**: **Why?** A scheduled task (worker) will be needed to periodically query the `retry_schedule` table and process pending retries.
    - `backend/src/webhooks/index.ts`**: **Why?** The `sendWebhook` function can be used to emit events for retry attempts, successes, and final failures. The 'retry' event is already defined in `WebhookEvent`.
    - `docs/design.md`**: **Why?** Section 10 (Retry & Scheduling) describes the retry mechanism and table.
```


### `docs\tasks\section8.md`

```md
## 8. Webhooks & Retry Engine

- [ ] 8.1 Attach webhook URL per lifecycle phase and status code**
    - `backend/src/db/schema.ts`**: **Why?** The `webhooks` table schema (columns: `endpointId`, `phase`, `statusCode`, `url`) directly supports this.
    - `backend/src/config/index.ts` (and Endpoint config files like `apis/salesforce/endpoints/getUsers.json` from `docs/design.md`)**: **Why?** This is where webhook URLs will be defined declaratively for specific endpoints, phases, and status codes.
    - `backend/src/lifecycle/index.ts`**: **Why?** The `executeHooks` function, particularly in the `afterRequest` (for HTTP status codes) or `afterExecute` (for DB operations) phases, will need logic to identify matching webhook configurations and trigger `sendWebhook`.
    - `backend/src/webhooks/index.ts`**: **Why?** The `sendWebhook` function is the core utility for dispatching these configured webhooks.
    - `frontend/src/pages/orchestrator/ApiEditorPage.tsx` (Visual Editor tab)**: **Why?** The UI will need a section to configure these webhooks (URL, phase, status code) for each endpoint.

- [ ] 8.2 Implement retry queue table and worker**
    - `backend/src/db/schema.ts`**: **Why?** The `retry_schedule` table is already defined and will serve as the queue.
    - `backend/src/scheduler/index.ts`**: **Why?** This is where you will define a new scheduled task (cron job) that runs the retry worker periodically.
    - New Backend Service (e.g., `backend/src/services/retry.service.ts`)**: **Why?** This new service will contain the "worker" logic:
        *   Querying `retry_schedule` for pending tasks.
        *   Executing the retries (likely using `backend/src/api/client.ts`).
        *   Updating the status, `attempts`, and `nextTry` in the `retry_schedule` table.
        *   Handling max attempts and final failures.
    - `backend/src/api/client.ts`**: **Why?** When an initial request (or an inline retry within `executeWithRetry`) fails definitively but is still retryable according to policy, it should add an entry to the `retry_schedule` table instead of just giving up.

- [ ] 8.3 Allow manual retry via dashboard**
    - `frontend/src/pages/dashboard/DashboardPage.tsx`**: **Why?** Or a new dedicated "Retry Management" or "Failed Tasks" page in the frontend. This page will list tasks from `retry_schedule` and provide a button for manual retry.
    - `backend/src/routes/dcr.ts` (or a new route like `backend/src/routes/retries.ts`)**: **Why?** An API endpoint will be needed (e.g., `POST /dcr/retries/:retryId/trigger`) that the frontend can call to initiate a manual retry.
    - `backend/src/services/retry.service.ts` (if created as per 8.2)**: **Why?** This service would have a method that can be called by the new API endpoint to immediately process a specific retry_schedule item, or move it to the front of the queue.

- [ ] 8.4 Add backoff strategy support**
    - `backend/src/api/client.ts`**: **Why?** The `calculateBackoff` function currently implements exponential backoff. It needs to be modified to support different strategies (linear, fixed) based on configuration.
    - `backend/src/services/retry.service.ts` (if created as per 8.2)**: **Why?** The retry worker, when processing items from `retry_schedule`, will need to use this enhanced `calculateBackoff` function (or similar logic) to determine the `nextTry` timestamp.
    - `backend/src/config/index.ts` (EndpointConfigSchema)**: **Why?** The `retry.backoff` field in the `EndpointConfigSchema` already defines 'linear', 'exponential', 'fixed'. This configuration will be read by the client/retry service.
```


### `docs\tasks\section9.1.md`

```md
## 9. Frontend UI

### 9.1 Core UI & Layout

- [ ] 9.1.4 Implement global state management with React Context/Redux**
    - `frontend/src/main.tsx`**: **Why?** This is the entry point of the React application. The global state provider (Context Provider or Redux Provider) will wrap the `<App />` component here.
    - New Files for State Management (e.g., `frontend/src/context/AuthContext.tsx`, `frontend/src/store/store.ts`, `frontend/src/store/slices/userSlice.ts`)**: **Why?** These files will define the context, reducers, actions, and selectors for the global state.
    - `frontend/src/App.tsx`**: **Why?** May consume some global state, especially for things like authentication status to manage protected routes.
    - `frontend/src/layouts/DashboardLayout.tsx`**: **Why?** Likely to consume user information from global state to display in the user profile section of the sidebar, and potentially dispatch actions (e.g., logout).
    - Various Page Components (`frontend/src/pages/**/*.tsx`)**: **Why?** Any page that needs to access or modify shared application state (e.g., user details, global settings, notifications) will use hooks provided by the chosen state management solution.
```


### `docs\tasks\section9.2.md`

```md
### 9.2 Authentication Pages

- [ ] 9.2.1 Login page with JWT token handling**
    - `frontend/src/pages/auth/LoginPage.tsx`**: **Why?** This component contains the login form. Its `onSubmit` handler will need to make an API call to the backend, receive a JWT, and store it (e.g., in localStorage and global state).
    - New Backend Auth Route (e.g., `backend/src/routes/auth.ts`)**: **Why?** A backend endpoint (e.g., `/api/auth/login`) is needed to verify credentials and issue JWTs. This is not explicitly in `api.ts` or `dcr.ts` yet for auth.
    - `backend/src/config/index.ts`**: **Why?** The `security.jwtSecret` and `jwtExpiresIn` fields from `ConfigSchema` will be used by the backend to sign JWTs.
    - `shared/schemas/index.ts`**: **Why?** The `userSchema` can be used for the login payload structure (email/password).
    - New Frontend Service (e.g., `frontend/src/services/authService.ts`)**: **Why?** To encapsulate the API call logic for login, token storage, and retrieval.
    - Global State (Task 9.1.4)**: **Why?** To store the authentication status and JWT, making it accessible throughout the app.

- [ ] 9.2.2 Forgot password page with email verification**
    - `frontend/src/pages/auth/ForgotPasswordPage.tsx`**: **Why?** Contains the UI. Its `onSubmit` handler will call a backend endpoint.
    - New Backend Auth Route (e.g., `backend/src/routes/auth.ts`)**: **Why?** An endpoint (e.g., `/api/auth/forgot-password`) to handle the request, generate a reset token, and trigger an email.
    - New Backend Email Service (Not in current files)**: **Why?** A service to send emails with the password reset link. This would integrate with an email provider (e.g., SendGrid, Mailgun).
    - `backend/src/db/schema.ts`**: **Why?** May need a new table to store password reset tokens with expiry.

- [ ] 9.2.3 Reset password page**
    - `frontend/src/pages/auth/ResetPasswordPage.tsx`**: **Why?** Contains the UI. Its `onSubmit` handler will send the new password and reset token to the backend.
    - New Backend Auth Route (e.g., `backend/src/routes/auth.ts`)**: **Why?** An endpoint (e.g., `/api/auth/reset-password`) to validate the token and update the user's password.
    - `backend/src/db/schema.ts`**: **Why?** To update the `users.passwordHash`.

- [ ] 9.2.4 User profile and settings page**
    - New Frontend Page (e.g., `frontend/src/pages/user/ProfilePage.tsx`)**: **Why?** This page will display user information and allow updates (e.g., password change, email update).
    - `frontend/src/layouts/DashboardLayout.tsx`**: **Why?** May need a link in the user menu (sidebar) to navigate to this profile page.
    - `backend/src/routes/api.ts`**: **Why?** The existing user CRUD endpoints (GET `/users/:id`, PATCH `/users/:id`) can be used to fetch and update user profile data.
    - Global State (Task 9.1.4)**: **Why?** To get the current user's ID and details.

- [ ] 9.2.5 JWT token refresh mechanism**
    - New Frontend API Client/Interceptor Utility (e.g., `frontend/src/lib/apiClient.ts`)**: **Why?** This utility would wrap `fetch` or use a library like `axios`. It would intercept API responses, check for 401 (Unauthorized) errors, and if a refresh token is available, attempt to get a new JWT.
    - New Backend Auth Route (e.g., `backend/src/routes/auth.ts`)**: **Why?** An endpoint (e.g., `/api/auth/refresh-token`) that accepts a refresh token and issues a new JWT.
    - Global State (Task 9.1.4)**: **Why?** To store and update the JWT and refresh token.
    - `backend/src/db/schema.ts`**: **Why?** Might need to store refresh tokens in the database associated with users if using long-lived refresh tokens.
```


### `docs\tasks\section9.3.md`

```md
### 9.3 Dashboard

- [ ] 9.3.2 Live API call visualization with D3.js**
    - `frontend/src/pages/dashboard/DashboardPage.tsx`**: **Why?** This is the main dashboard page where the D3.js visualization component will be rendered.
    - New D3 Component (e.g., `frontend/src/components/visualizations/ApiFlowDiagram.tsx`)**: **Why?** A dedicated React component to encapsulate the D3.js logic for rendering the flow diagram.
    - New Backend WebSocket Endpoint (e.g., in `backend/src/routes/dcr.ts` or a new `backend/src/routes/streaming.ts`)**: **Why?** The backend needs to stream live API call data (events from the lifecycle hooks) to the frontend via WebSockets.
    - `backend/src/lifecycle/index.ts`**: **Why?** Lifecycle hooks (`beforeRequest`, `request`, `afterRequest`) would need to emit events (e.g., to a WebSocket manager/broadcaster) that can be sent to connected dashboard clients.
    - `docs/design.md`**: **Why?** Section 11 (Dashboard UI) mentions D3 visualization.

- [ ] 9.3.3 System health indicators**
    - `frontend/src/pages/dashboard/DashboardPage.tsx`**: **Why?** This page already has UI elements for system health metrics (currently mock data). It needs to fetch real data.
    - `backend/src/routes/api.ts`**: **Why?** The `/health` endpoint provides a basic health check.
    - `backend/src/routes/dcr.ts`**: **Why?** The `/status` endpoint provides more detailed system status (DB connectivity, uptime, memory). This is likely the primary source for these indicators.

- [ ] 9.3.4 Recent activity feed**
    - `frontend/src/pages/dashboard/DashboardPage.tsx`**: **Why?** This page has a UI section for recent activities (currently mock data).
    - `backend/src/routes/dcr.ts`**: **Why?** The `/logs` endpoint can be used to fetch recent log entries, which can serve as an activity feed. It might need to be enhanced with specific filters for "activity" type events.
    - `backend/src/db/schema.ts`**: **Why?** The `logs` table is the primary source of data for this feed. Queries will target this table.
```


### `docs\tasks\section9.4.md`

```md
### 9.4 Orchestrator

*   **[ ] 9.4.1 API list and overview page - Version selection**
    *   **`frontend/src/pages/orchestrator/ApiListPage.tsx`**: **Why?** The UI for listing APIs will need to be updated to include a dropdown or similar mechanism for selecting/viewing different versions of an API if versioning (Task 6.5) is implemented.
    *   **New Backend Endpoint (e.g., in `backend/src/routes/apis.ts` or `backend/src/controllers/api-import/git.ts` if using Git tags for versions)**: **Why?** An endpoint to list available versions for a given API slug.
    *   **`backend/src/services/config-fs.service.ts`**: **Why?** If versions are purely directory-based, this service would be used by the backend endpoint to list version directories.
    *   **`backend/src/db/schema.ts`**: **Why?** The `apis` table or related tables might store version information that the backend endpoint queries.

*   **[ ] 9.4.2 API detail page - Visual representation of API structure**
    *   **`frontend/src/pages/orchestrator/ApiEditorPage.tsx`**: **Why?** This page currently has a "JSON Editor" tab and a placeholder "Visual Editor" tab. The visual representation would be implemented under the "Visual Editor" tab.
    *   **New Frontend Components (e.g., `frontend/src/components/orchestrator/ApiVisualizer.tsx`, `EndpointCard.tsx`, `LifecycleStep.tsx`)**: **Why?** Custom components will be needed to render the API's structure (endpoints, their configurations, lifecycle hooks) visually.
    *   **`frontend/src/lib/schemas/api-schema.ts`**: **Why?** The `apiConfigSchema` and `endpointSchema` define the structure of the data that needs to be visualized.

*   **[ ] 9.4.3 API import interface**
    *   **`frontend/src/pages/orchestrator/ApiImportPage.tsx`**: **Why?** This page contains the UI for importing APIs.
    *   **[ ] Postman collection import**:
        *   The `handleParseCollection` and `handleImport` functions in `ApiImportPage.tsx` will need to be connected to backend API calls.
        *   **`backend/src/controllers/api-import/validate.ts`**: **Why?** The frontend will first send the collection data to this controller's endpoint for validation.
        *   **`backend/src/controllers/api-import/import.ts`**: **Why?** After validation (and potentially user selection of endpoints), the frontend will send the data to this controller's endpoint for the actual import process.
        *   **`backend/src/services/api-import.service.ts`**: **Why?** This service contains the core Postman collection parsing logic used by the backend controllers.
    *   **[ ] Custom format import**:
        *   The UI in `ApiImportPage.tsx` might need another tab or option for "Custom Format".
        *   New backend parsing logic (similar to `api-import.service.ts` but for the custom format).
        *   New backend controller/endpoint to handle this custom import.
    *   **[ ] Import progress tracking**:
        *   **`frontend/src/pages/orchestrator/ApiImportPage.tsx`**: **Why?** The `importProgress` state and `Progress` component are already there. This needs to be updated based on real feedback from the backend.
        *   **Backend Import Process (`backend/src/controllers/api-import/import.ts`)**: **Why?** The import process might be long-running. It could be made asynchronous, and the frontend could poll a status endpoint or receive updates via WebSockets.

*   **[ ] 9.4.4 Visual endpoint builder - Lifecycle plugin selection**
    *   **`frontend/src/pages/orchestrator/ApiEditorPage.tsx` ("Visual Editor" tab)**: **Why?** This is where users would visually add, configure, and reorder lifecycle hooks/plugins for an endpoint.
    *   **New Backend Endpoint (e.g., `GET /api/plugins/available`)**: **Why?** To provide the frontend with a list of available lifecycle plugins that can be selected.
    *   **`frontend/src/lib/schemas/api-schema.ts`**: **Why?** The `lifecycleHookSchema` defines the structure for a configured lifecycle hook, including `pluginId` and `config`. The visual builder will manipulate data conforming to this schema.
    *   **`frontend/src/components/editors/JsonEditor.tsx`**: **Why?** Could be used within the visual builder for editing the `config` object of a selected plugin, providing schema validation if the plugin has a defined config schema.
```


### `docs\tasks\section9.5.md`

```md
### 9.5 Plugin Management

- `frontend/src/App.tsx`**: **Why?** The route for `/plugins` currently shows a placeholder. It needs to render the actual plugin management page.
- New Frontend Page (e.g., `frontend/src/pages/plugins/PluginManagementPage.tsx`)**: **Why?** This page will be the main interface for plugin management.
- [ ] 9.5.1 Plugin directory and marketplace**
    *   UI elements on `PluginManagementPage.tsx` to list available/installed plugins.
    - New Backend Endpoints (e.g., `GET /api/plugins`, `POST /api/plugins/install/:pluginId`)**: **Why?** To list plugins (from a local registry or an external source) and handle installation/uninstallation.
    - New Backend Plugin Service (e.g., `backend/src/services/plugin.service.ts`)**: **Why?** To manage plugin lifecycle, discovery, and registration.
- [ ] 9.5.2 Plugin configuration interface**
    *   UI components (possibly on `PluginManagementPage.tsx` or a dedicated plugin detail page) to configure settings for each installed plugin.
    - `backend/src/db/schema.ts` (or config files)**: **Why?** A way to store plugin configurations persistently.
    - New Backend Endpoints (e.g., `GET /api/plugins/:pluginId/config`, `PUT /api/plugins/:pluginId/config`)**: **Why?** To fetch and update plugin configurations.
- [ ] 9.5.3 Custom plugin creation wizard**
    *   This is a complex feature requiring a dedicated set of UI pages in the frontend for defining plugin metadata, code (perhaps a mini-editor), and configuration schema.
    *   Significant backend support would be needed to store, compile (if necessary), and register these custom plugins.
- [ ] 9.5.4 Plugin testing environment**
    *   UI in the frontend (perhaps on a plugin's detail page) to trigger test executions of a plugin with sample data.
    *   Backend logic to execute a plugin in an isolated environment and return results/logs.
```


### `docs\tasks\section9.6.md`

```md
### 9.6 Logs Viewer

- `frontend/src/App.tsx`**: **Why?** The `/logs` route points to a placeholder. It should render the `LogViewerPage`.
- New Frontend Page (e.g., `frontend/src/pages/logs/LogViewerPage.tsx`)**: **Why?** This will be the main UI for viewing and interacting with logs.
- [ ] 9.6.1 Advanced log filtering system**
    *   UI components (date pickers, select dropdowns for level/source, text input for message search) on `LogViewerPage.tsx`.
    - `backend/src/routes/dcr.ts`**: **Why?** The existing `GET /dcr/logs` endpoint will need to be enhanced to accept and process these filter parameters in its database query.
- [ ] 9.6.2 Log detail inspection**
    *   UI elements on `LogViewerPage.tsx` (e.g., a modal or a slide-out panel) to display the full details of a selected log entry, including parsed `metadataJson`.
- [ ] 9.6.3 Log export functionality**
    *   A button on `LogViewerPage.tsx` to trigger log export.
    - New Backend Endpoint (e.g., `GET /dcr/logs/export?format=csv&...filters`)**: **Why?** The backend will handle querying logs based on current filters and streaming them back in the chosen format (CSV, JSON).
- [ ] 9.6.4 Real-time log streaming**
    *   Logic in `LogViewerPage.tsx` to establish and manage a WebSocket connection.
    - New Backend WebSocket Endpoint (e.g., in `backend/src/routes/streaming.ts` or similar)**: **Why?** This endpoint will stream new log entries to connected frontend clients.
    - `backend/src/logging/manager.ts` or `backend/src/logging/core.ts`**: **Why?** The logging system itself will need to broadcast new log entries to the WebSocket manager/server.
- [ ] 9.6.5 Log archiving interface**
    *   UI elements on `LogViewerPage.tsx` or a dedicated settings page to:
        *   View the status of log archiving.
        *   Potentially trigger a manual log archiving process.
        *   View past archive jobs.
    - `backend/src/scripts/archive-logs.ts`**: **Why?** Contains the core archiving logic.
    - New Backend Endpoints (e.g., `GET /dcr/archives/status`, `POST /dcr/archives/trigger`)**: **Why?** To interact with the archiving process from the frontend.
    - `backend/src/scheduler/index.ts`**: **Why?** Interacts with scheduled archiving.
```


### `docs\tasks\section9.7.md`

```md
### 9.7 Configuration Editor

- [ ] 9.7.4 Config diff comparison tool**
    - `frontend/src/components/api/VersionHistoryViewer.tsx`**: **Why?** The dialog that shows the diff when viewing changes for a commit. This component will need to be enhanced to use a proper diff viewer (like Monaco's diff editor).
    - `frontend/src/components/editors/JsonEditor.tsx`**: **Why?** While not directly a diff tool, it's the Monaco editor. You would use Monaco's `createDiffEditor` API instead of the standard `create` API to show differences.
    - `backend/src/controllers/api-import/git.ts`**: **Why?** The `/git/diff/:apiSlug/:commitId` endpoint provides the raw diff text from Git, which the frontend will then render.
    - `backend/src/services/git.service.ts`**: **Why?** Contains the `getDiff` method that fetches the diff from the Git repository.
```


### `docs\tasks\section9.8.md`

```md
2### 9.8 Scheduler

- `frontend/src/App.tsx`**: **Why?** The `/scheduler` route currently shows a placeholder. It needs to render the actual scheduler management page.
- New Frontend Page (e.g., `frontend/src/pages/scheduler/SchedulerPage.tsx`)**: **Why?** This will be the main UI for managing scheduled tasks.
- [ ] 9.8.1 Request scheduling interface**
    *   UI forms and tables on `SchedulerPage.tsx` for creating, viewing, editing, and deleting scheduled tasks (e.g., recurring API calls).
    - New Backend Endpoints (e.g., `CRUD for /api/scheduled-tasks`)**: **Why?** To manage these scheduled task definitions.
    - `backend/src/db/schema.ts` (New Table)**: **Why?** A new database table will likely be needed to store definitions of user-scheduled tasks (e.g., `scheduled_tasks` table with cron string, target API/endpoint, payload, etc.).
    - `backend/src/scheduler/index.ts`**: **Why?** This module will need to be enhanced to dynamically load and manage these user-defined cron jobs from the new database table, in addition to system tasks like log archiving.
- [ ] 9.8.2 Retry configuration**
    *   UI elements (possibly on `ApiEditorPage.tsx` for endpoint-specific retries, or a global settings page) to configure retry behavior (count, backoff strategy, delay).
    - `frontend/src/lib/schemas/api-schema.ts`**: **Why?** The `errorHandling.retryCount`, `retryDelay` (and potentially `backoff` if added to schema) fields within `endpointSchema` are relevant.
    - `backend/src/config/index.ts`**: **Why?** The `EndpointConfigSchema`'s `retry` object defines the structure for this configuration.
    - `backend/src/api/client.ts`**: **Why?** Reads and applies these retry configurations.
- [ ] 9.8.3 Scheduled tasks calendar view**
    *   A UI component (e.g., using a library like FullCalendar or a custom D3-based one) on `SchedulerPage.tsx` to display scheduled tasks visually.
- [ ] 9.8.4 Manual trigger options**
    *   Buttons on `SchedulerPage.tsx` next to each scheduled task to "Run Now".
    - New Backend Endpoint (e.g., `POST /api/scheduled-tasks/:taskId/trigger`)**: **Why?** To allow the frontend to manually trigger the execution of a specific scheduled task.
    - `backend/src/scheduler/index.ts` (or the service managing scheduled tasks)**: **Why?** Needs a function to execute a task on demand.
```


### `docs\tasks\section9.9.md`

```md
### 9.9 User Management

- `frontend/src/App.tsx`**: **Why?** The `/users` route currently shows a placeholder. It needs to render the actual user management page.
- New Frontend Page (e.g., `frontend/src/pages/users/UserManagementPage.tsx`)**: **Why?** This will be the main UI for user administration.
- [ ] 9.9.1 User listing and CRUD operations**
    *   UI table to list users, forms/modals for creating and editing users on `UserManagementPage.tsx`.
    - `backend/src/routes/api.ts`**: **Why?** This file already contains basic user CRUD endpoints (e.g., `GET /users`, `POST /users`, `PATCH /users/:id`, `DELETE /users/:id`). These might need to be verified or enhanced.
    - `shared/schemas/index.ts`**: **Why?** The `userSchema` will be used for validating form data on the frontend and request bodies on the backend.
- [ ] 9.9.2 Role-based permissions editor**
    *   UI on `UserManagementPage.tsx` (perhaps on a user detail view or a separate permissions tab) to assign roles and manage fine-grained permissions.
    - `backend/src/db/schema.ts`**: **Why?** The `permissions` table and `users.role` column are central to this.
    - New Backend Endpoints (e.g., `CRUD for /api/permissions` or `POST /api/users/:userId/permissions`)**: **Why?** To manage permission records in the database.
- [ ] 9.9.3 User activity monitoring**
    *   A section or tab on `UserManagementPage.tsx` (user detail view) or a dedicated activity log page filtered by user.
    - `backend/src/db/schema.ts`**: **Why?** The `logs` table would need to store `userId` or some user identifier associated with actions if not already doing so implicitly through request context.
    - `backend/src/routes/dcr.ts` (or `/api/logs`)**: **Why?** The logs endpoint would need to support filtering by `userId`.
- [ ] 9.9.4 Team management**
    *   This is a larger feature. It would require:
        *   New UI pages/sections in the frontend for creating and managing teams, and assigning users to teams.
        - New DB Tables (e.g., `teams`, `team_members`, `team_permissions`) in `backend/src/db/schema.ts`**.
        *   New backend CRUD endpoints for managing teams and their memberships/permissions.

---
```