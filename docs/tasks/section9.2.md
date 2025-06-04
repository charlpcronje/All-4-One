### 9.2 Authentication Pages

- [ ] 9.2.1 Login page with JWT token handling**
    - `frontend/src/pages/auth/LoginPage.tsx`**: **Why?** This component contains the login form. Its `onSubmit` handler will need to make an API call to the backend, receive a JWT, and store it (e.g., in localStorage and global state).
    - New Backend Auth Route (e.g., `backend/src/routes/auth.ts`)**: **Why?** A backend endpoint (e.g., `/api/auth/login`) is needed to verify credentials and issue JWTs. This is not explicitly in `api.ts` or `dcr.ts` yet for auth.
    - `backend/src/config/index.ts`**: **Why?** The `security.jwtSecret` and `jwtExpiresIn` fields from `ConfigSchema` will be used by the backend to sign JWTs.
    - `shared/schemas/index.ts`**: **Why?** The `userSchema` can be used for the login payload structure (email/password).
    - New Frontend Service (e.g., `frontend/src/services/authService.ts`)**: **Why?** To encapsulate the API call logic for login, token storage, and retrieval.
    - Global State (Task 9.1.4)**: **Why?** To store the authentication status and JWT, making it accessible throughout the app.

- [ ] 9.2.2 Forgot password page with email verification**
    - `frontend/src/pages/auth/ForgotPasswordPage.tsx`**: **Why?** Contains the UI. Its `onSubmit` handler will call a backend endpoint.
    - New Backend Auth Route (e.g., `backend/src/routes/auth.ts`)**: **Why?** An endpoint (e.g., `/api/auth/forgot-password`) to handle the request, generate a reset token, and trigger an email.
    - New Backend Email Service (Not in current files)**: **Why?** A service to send emails with the password reset link. This would integrate with an email provider (e.g., SendGrid, Mailgun).
    - `backend/src/db/schema.ts`**: **Why?** May need a new table to store password reset tokens with expiry.

- [ ] 9.2.3 Reset password page**
    - `frontend/src/pages/auth/ResetPasswordPage.tsx`**: **Why?** Contains the UI. Its `onSubmit` handler will send the new password and reset token to the backend.
    - New Backend Auth Route (e.g., `backend/src/routes/auth.ts`)**: **Why?** An endpoint (e.g., `/api/auth/reset-password`) to validate the token and update the user's password.
    - `backend/src/db/schema.ts`**: **Why?** To update the `users.passwordHash`.

- [ ] 9.2.4 User profile and settings page**
    - New Frontend Page (e.g., `frontend/src/pages/user/ProfilePage.tsx`)**: **Why?** This page will display user information and allow updates (e.g., password change, email update).
    - `frontend/src/layouts/DashboardLayout.tsx`**: **Why?** May need a link in the user menu (sidebar) to navigate to this profile page.
    - `backend/src/routes/api.ts`**: **Why?** The existing user CRUD endpoints (GET `/users/:id`, PATCH `/users/:id`) can be used to fetch and update user profile data.
    - Global State (Task 9.1.4)**: **Why?** To get the current user's ID and details.

- [ ] 9.2.5 JWT token refresh mechanism**
    - New Frontend API Client/Interceptor Utility (e.g., `frontend/src/lib/apiClient.ts`)**: **Why?** This utility would wrap `fetch` or use a library like `axios`. It would intercept API responses, check for 401 (Unauthorized) errors, and if a refresh token is available, attempt to get a new JWT.
    - New Backend Auth Route (e.g., `backend/src/routes/auth.ts`)**: **Why?** An endpoint (e.g., `/api/auth/refresh-token`) that accepts a refresh token and issues a new JWT.
    - Global State (Task 9.1.4)**: **Why?** To store and update the JWT and refresh token.
    - `backend/src/db/schema.ts`**: **Why?** Might need to store refresh tokens in the database associated with users if using long-lived refresh tokens.

