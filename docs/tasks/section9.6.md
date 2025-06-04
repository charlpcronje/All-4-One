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

