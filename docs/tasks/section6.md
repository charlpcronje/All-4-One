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

