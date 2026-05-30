# Frontend Remove Supabase Plan

## Goal

Remove runtime Supabase usage from the frontend so the app can run against the Go API and PostgreSQL stack only.

The final state must not require:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `@supabase/ssr`
- `@supabase/supabase-js`

## Current Status

P1, P2, P3, P4, P5, and P6 runtime cleanup are complete:
- Home, dashboard, video, image, and music pages render in Docker without contacting Supabase.
- Public catalog data is served by the Go API through `/v1/models`, `/v1/providers`, and `/v1/prompts`.
- Server-side frontend catalog reads are centralized in `lib/public-catalog.ts`.
- Dashboard settings, billing, admin settings, shared payment/points/provider helpers no longer import Supabase.
- `lib/supabase/*`, Supabase dependencies, Docker placeholder env vars, and Supabase migration/seed scripts have been removed.

Current validation gap:
- Go tests pass.
- Full frontend type-check is currently blocked because local `node_modules` is incomplete and Docker Desktop is not reachable from the CLI.

## P1: App Shell And Session

Scope:
- `middleware.ts`
- `components/user-provider.tsx`
- `app/layout.tsx`
- `app/auth/sign-out/route.ts`
- `lib/supabase/proxy.ts`
- `lib/supabase/get-user.ts`
- `lib/supabase/require-admin.ts`

Work:
- Replace Supabase session middleware with token-based frontend session handling.
- Make `UserProvider` read `accessToken` / `refreshToken` and call `platformAPI.me`.
- Replace `getCurrentUser` and admin checks with Go API backed helpers or client-side guards.
- Replace sign-out route with local token cleanup and `/v1/auth/logout`.

Backend gaps:
- Ensure `/v1/me` returns enough user profile fields for the current UI.
- Ensure role/admin information is available without Supabase.

Acceptance:
- Visiting `/` no longer initializes Supabase.
- Visiting dashboard pages does not require Supabase env vars.
- Login/logout flow works with Go `/v1/auth/*`.

## P2: Auth Pages

Scope:
- `components/auth/login-form.tsx`
- `components/auth/forgot-password-form.tsx`
- `components/auth/reset-password-form.tsx`
- `components/auth/oauth-buttons.tsx`
- `app/auth/callback/route.ts`

Work:
- Replace password login with `platformAPI.login`.
- Store `accessToken` and `refreshToken` consistently.
- Auth forms use Go API email/password and OTP endpoints.
- Disable unsupported auth modes until Go backend supports them.

Backend gaps:
- Optional: add forgot/reset password endpoints later.
- Optional: add OAuth endpoints later.

Acceptance:
- Email/password login works without Supabase.
- Unsupported auth modes are hidden or return clear unavailable states.
- No auth page imports `@/lib/supabase/*`.

## P3: Server Page Data

Scope:
- `components/site-header-server.tsx`
- `components/tools-grid-server.tsx`
- `components/video-generator-server.tsx`
- `app/(dashboard)/**/page.tsx`
- `app/(dashboard)/**/layout.tsx`

Work:
- Replace server Supabase reads with Go API calls or client-side platform API calls.
- Convert pages that require browser tokens to client components where practical.
- Keep server components only where data can be fetched without user token.

Backend gaps:
- Add `/v1/models` and `/v1/models/grouped` public endpoints if needed.
- Add `/v1/prompts` endpoint if prompts are needed outside admin.
- Expand `/v1/user/profile`, `/v1/user/preferences`, `/v1/user/security` as needed.

Acceptance:
- Dashboard, settings, billing, and generator pages render without Supabase env vars.
- No `app/(dashboard)` file imports `@/lib/supabase/*`.

Progress:
- Done: `components/site-header-server.tsx`, `components/tools-grid-server.tsx`, `components/video-generator-server.tsx`, `components/image-generator-server.tsx`, `components/music-generator-server.tsx`.
- Done: `app/(dashboard)/layout.tsx` and `app/(dashboard)/dashboard/page.tsx` no longer use Supabase.
- Done: `components/category-page-shell.tsx` no longer uses Supabase.
- Done: `lib/get-models.ts`, `lib/get-prompts.ts`, and `lib/display-tools.ts` now read through the public catalog adapter.
- Done: dashboard billing/settings/admin subpages no longer import Supabase.

## Completion Notes

The frontend has been fully disconnected from Supabase at runtime. Complex pages now use the independent Go API route with PostgreSQL persistence and admin CRUD implemented behind the Go API.

## P4: Shared Lib Migration

Scope:
- `lib/get-models.ts`
- `lib/get-prompts.ts`
- `lib/points.ts`
- `lib/payment/config.ts`
- `lib/payment/success.ts`
- `lib/ai-provider.ts`
- `lib/display-tools.ts`

Work:
- Replace Supabase table reads with Go API endpoints.
- Move provider/model/prompt/payment configuration reads behind `platformAPI`.
- Remove or rewrite server-only Supabase admin helpers.

Backend gaps:
- Make admin/model/provider/prompt/payment endpoints return all fields used by UI.
- Add public model/tool listing endpoint if the home page requires it.

Acceptance:
- No `lib/*.ts` outside `lib/supabase` imports Supabase.
- Existing generator, billing, admin settings pages still render.

## P5: Admin Pages

Scope:
- `app/(dashboard)/admin-settings/**`
- `components/admin/**`

Work:
- Ensure all admin pages use `/v1/admin/*`.
- Replace server-side `requireAdmin` layouts with token-aware client guard or Go-backed server route pattern.
- Remove direct `createAdminClient` usage.

Backend gaps:
- Admin endpoints use persisted PostgreSQL data.

Acceptance:
- Admin pages load without Supabase env vars.
- Existing admin CRUD calls go through Go API.

## P6: Cleanup

Scope:
- `lib/supabase/*`
- `package.json`
- lockfiles
- Docker env
- legacy docs/scripts

Work:
- Delete `lib/supabase`.
- Remove `@supabase/ssr` and `@supabase/supabase-js`.
- Remove Supabase env vars from Docker compose.
- Archive or delete Supabase-only scripts and docs.

Acceptance:
- `rg "supabase|@supabase|NEXT_PUBLIC_SUPABASE|SUPABASE_"` returns no runtime code references.
- `pnpm install --frozen-lockfile` works.
- Docker deployment works without Supabase placeholder variables.

## Execution Order

1. P1 app shell and session.
2. P2 auth pages.
3. P3 server page data.
4. P4 shared libs.
5. P5 admin pages.
6. P6 cleanup.

## Validation Commands

```powershell
cd D:\PersonWorkspace\v0-project
rg -n "supabase|@supabase|NEXT_PUBLIC_SUPABASE|SUPABASE_" app components lib middleware.ts package.json
cd .\apps\api
go test ./...
cd ..\..\deploy\docker
docker compose up -d --force-recreate
curl http://localhost/api/v1/healthz
curl http://localhost
```

