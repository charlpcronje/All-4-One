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