### 9.7 Configuration Editor

- [ ] 9.7.4 Config diff comparison tool**
    - `frontend/src/components/api/VersionHistoryViewer.tsx`**: **Why?** The dialog that shows the diff when viewing changes for a commit. This component will need to be enhanced to use a proper diff viewer (like Monaco's diff editor).
    - `frontend/src/components/editors/JsonEditor.tsx`**: **Why?** While not directly a diff tool, it's the Monaco editor. You would use Monaco's `createDiffEditor` API instead of the standard `create` API to show differences.
    - `backend/src/controllers/api-import/git.ts`**: **Why?** The `/git/diff/:apiSlug/:commitId` endpoint provides the raw diff text from Git, which the frontend will then render.
    - `backend/src/services/git.service.ts`**: **Why?** Contains the `getDiff` method that fetches the diff from the Git repository.

