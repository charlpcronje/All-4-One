## 10. Shared Schemas & Type Safety

- [ ] 10.3.1 Use schemas on frontend forms**
    - `frontend/src/pages/auth/LoginPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`**: **Why?** These pages contain forms that should use Zod schemas for validation (e.g., validating email format, password strength, matching passwords).
    - `frontend/src/pages/orchestrator/ApiEditorPage.tsx` (Visual Editor)**: **Why?** If the visual editor is built with forms (e.g., for configuring endpoint details, headers, parameters), these forms will use Zod schemas.
    - `frontend/src/pages/orchestrator/ApiImportPage.tsx`**: **Why?** Form for API name, description, version, etc., before final import.
    - `frontend/src/lib/schemas/api-schema.ts`**: **Why?** Contains frontend-specific or detailed schemas for API configuration forms.
    - `shared/schemas/index.ts`**: **Why?** Provides general Zod schemas (like `userSchema`) that can be used for form validation.
    - `@hookform/resolvers` and `zod`**: **Why?** These dependencies (already in `frontend/package.json`) will be used to integrate Zod schemas with React Hook Form.

- [ ] 10.4 Implement schema-driven form builder (future)**
    - New Frontend Components Directory (e.g., `frontend/src/components/forms`)**: **Why?** This is where generic form-building components would reside (e.g., `SchemaDrivenForm.tsx`, `FormInput.tsx`, `FormSelect.tsx`).
    - `frontend/src/lib/schemas/api-schema.ts` and `shared/schemas/index.ts`**: **Why?** These Zod schemas would be the input to the schema-driven form builder, which would dynamically render form fields based on the schema's structure and types.
    *   Any page that would benefit from dynamically generated forms based on a schema.