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