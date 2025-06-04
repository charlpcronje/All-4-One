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

