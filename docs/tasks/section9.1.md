## 9. Frontend UI

### 9.1 Core UI & Layout

- [ ] 9.1.4 Implement global state management with React Context/Redux**
    - `frontend/src/main.tsx`**: **Why?** This is the entry point of the React application. The global state provider (Context Provider or Redux Provider) will wrap the `<App />` component here.
    - New Files for State Management (e.g., `frontend/src/context/AuthContext.tsx`, `frontend/src/store/store.ts`, `frontend/src/store/slices/userSlice.ts`)**: **Why?** These files will define the context, reducers, actions, and selectors for the global state.
    - `frontend/src/App.tsx`**: **Why?** May consume some global state, especially for things like authentication status to manage protected routes.
    - `frontend/src/layouts/DashboardLayout.tsx`**: **Why?** Likely to consume user information from global state to display in the user profile section of the sidebar, and potentially dispatch actions (e.g., logout).
    - Various Page Components (`frontend/src/pages/**/*.tsx`)**: **Why?** Any page that needs to access or modify shared application state (e.g., user details, global settings, notifications) will use hooks provided by the chosen state management solution.

