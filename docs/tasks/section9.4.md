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

