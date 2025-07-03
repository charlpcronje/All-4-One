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