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

