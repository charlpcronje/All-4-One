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

