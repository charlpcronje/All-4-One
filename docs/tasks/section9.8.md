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

