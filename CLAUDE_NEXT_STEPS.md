# Claude next steps

Branch: chatgpt/supabase-crud-foundation

Done:
- Added src/lib/supabase/clients.ts
- Added src/lib/supabase/client-mutations.ts
- Added src/app/(app)/clients/nouveau/actions.ts
- Added src/components/clients/new-client-form.tsx

Next:
1. Replace the existing clients page with the Supabase-aware version.
2. Replace the existing new-client page form with NewClientForm.
3. Keep demo fallback when Supabase is not configured.
4. Run npm run typecheck and npm run build.
