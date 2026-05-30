# Supabase Capability Replacement Plan

## Goal

Implement the product capabilities that Supabase previously provided so the platform can run independently on:
- Go API
- PostgreSQL
- Redis
- MinIO or S3-compatible object storage
- Docker Compose for local and production deployment

This plan is about rebuilding missing backend capability, not just removing imports. The frontend has been disconnected from Supabase runtime calls, and the Supabase-backed product capabilities have been moved to the Go API, PostgreSQL, Redis, and MinIO stack.

## Current Baseline

Completed:
- Frontend no longer imports or initializes Supabase runtime code.
- Go API has routes for auth, tasks, user points, billing, payment, admin persistence, storage, public catalog, rate limiting, request logging, and audit logs.
- Docker stack includes API, web, PostgreSQL, Redis, MinIO, and Nginx.
- Initial PostgreSQL-backed auth slices are implemented: DB pool, startup migrations, users/profiles/refresh_tokens/email_otps/audit_logs schema, email OTP registration, password login, refresh token rotation, forgot/reset password, change password, and `/v1/me` profile response.
- Profile and preferences persistence is implemented through Go API endpoints and PostgreSQL.
- Account security summary and account soft deletion are implemented through Go API endpoints and PostgreSQL.

Validated completion evidence:
- Runtime Supabase scan is clean outside documentation.
- Docker stack runs API, web, PostgreSQL, Redis, MinIO, worker, and Nginx.
- Auth, profile, preferences, admin catalog/settings/users, tasks, storage, billing, payment, audit logs, and request logging are backed by Go API services.
- API and worker `go test ./...`, web `pnpm exec tsc --noEmit`, page smoke tests, and Docker readiness checks pass.

## Architecture Direction

### Backend Packages

Create these Go packages under `apps/api/internal`:
- `db`: PostgreSQL pool, transaction helpers, migrations integration points.
- `auth`: registration, login, password, OTP, refresh token persistence.
- `mail`: email sender interface and providers.
- `profile`: user profile and preferences.
- `catalog`: providers, models, prompts public/admin services.
- `storage`: MinIO/S3 abstraction for uploads and generated artifacts.
- `ledger`: points, billing records, subscription orders.
- `settings`: gateway, generation, payment, system settings.
- `rbac`: role/status checks and ownership helpers.

### Database Access

Recommended path:
- Use `pgxpool` for PostgreSQL access.
- Use SQL migrations in `packages/db/migrations`.
- Optionally add `sqlc` generated queries after schema stabilizes.

### Deployment

Docker requirements:
- API reads PostgreSQL, Redis, MinIO, SMTP, JWT, and gateway configuration from environment variables.
- Migrations can run as a one-shot container or API startup command in local development.
- No Supabase env vars are required.

## Phase 1: PostgreSQL Foundation

Status: implemented.

### Objective

Create the database schema that replaces Supabase tables and enables all later phases.

### Tables

Core auth/user:
- `users`
- `user_profiles`
- `user_preferences`
- `refresh_tokens`
- `email_otps`
- `password_reset_tokens`
- `audit_logs`

Catalog/admin:
- `admin_providers`
- `admin_models`
- `admin_prompts`
- `admin_gateway_settings`
- `admin_generation_config`
- `admin_payment_settings`

Tasks/storage:
- `generation_tasks`
- `task_artifacts`
- `uploaded_assets`

Billing/payment:
- `subscription_orders`
- `billing_records`
- `user_point_ledger`

### Implementation Tasks

1. Add migrations under `packages/db/migrations`.
2. Add constraints and indexes for email uniqueness, task ownership, order idempotency, and OTP lookup.
3. Add seed data for admin user, demo providers, demo models, and prompts.
4. Add DB config to `apps/api/internal/config`.
5. Add `internal/db` with `pgxpool` initialization and graceful shutdown.

### Acceptance

- Implemented: API startup applies migrations from `packages/db/migrations` when `DATABASE_URL` is configured.
- Implemented: Docker Compose starts PostgreSQL and the API applies migrations during startup.
- Implemented: API `/readyz` verifies DB connectivity.
- Implemented: seeded public catalog endpoints return PostgreSQL data, not in-memory data.

## Phase 2: Auth And Email OTP

Status: implemented.

### Objective

Replace Supabase Auth features used by the app.

### Features

- Email/password registration.
- Email OTP registration verification.
- Login with password hash verification.
- JWT access tokens.
- Persisted refresh tokens with rotation.
- Logout invalidates refresh token.
- Forgot password request.
- Reset password with token or OTP.
- Change password for logged-in users.
- User status checks: `active`, `suspended`, `banned`.

### Endpoints

Public:
- `POST /v1/auth/register/request-otp`
- `POST /v1/auth/register/verify-otp`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/password/forgot`
- `POST /v1/auth/password/reset`

Authenticated:
- `POST /v1/auth/logout`
- `POST /v1/auth/password/change`
- `GET /v1/me`

### Security Requirements

- Password hashing with Argon2id or bcrypt.
- OTP hash stored, never plaintext.
- OTP TTL, default 10 minutes.
- OTP max attempts, default 5.
- Resend cooldown, default 60 seconds.
- Rate limit per email and per IP.
- Refresh token stored as hash with expiry and revoked timestamp.
- JWT includes `sub`, `role`, `status`, `typ`, `iat`, `exp`.

### Email Sender

Add `internal/mail` with providers:
- `log` provider for local development.
- `smtp` provider for production.
- Later optional providers: Resend, Aliyun, SES.

### Acceptance

- Implemented: user can register with email OTP and then log in when PostgreSQL is configured.
- Implemented: wrong OTP fails and increments attempts.
- Implemented: expired OTP fails.
- Implemented: login rejects wrong password and disabled users.
- Implemented: refresh rotation stores hashed refresh tokens and revokes the old token.
- Implemented: forgot password sends password reset OTP without account enumeration.
- Implemented: reset password validates OTP, updates password hash, consumes OTP, and revokes refresh sessions.
- Implemented: logged-in change password validates current password, updates hash, and revokes refresh sessions.
- Implemented: OTP resend cooldown defaults to 60 seconds.
- Implemented: OTP per-email rate limit defaults to 5 requests per hour.
- Implemented: SMTP mail provider can be enabled with `MAIL_PROVIDER=smtp` and `SMTP_*` environment variables.
- Implemented: logout can revoke the submitted refresh token, and the frontend sign-out flow calls the Go API before clearing local tokens.
- Implemented: Redis-backed distributed IP-level rate limiting for login, registration OTP, OTP verification, refresh, forgot password, and reset password, with in-process fallback when Redis is unavailable.
- Docker smoke validation passed for API health, migrations, public catalog, email OTP registration, login, `/v1/me`, logout refresh-token revocation, and key frontend pages.
- Frontend TypeScript baseline passes with `pnpm exec tsc --noEmit` inside the Docker web container.

## Phase 3: Profile, Preferences, And Account Settings

Status: implemented for profile, preferences, security summary, and soft-delete account deletion.

### Objective

Restore profile and preferences features that previously read/wrote Supabase tables.

### Endpoints

Authenticated:
- `GET /v1/user/profile`
- `PATCH /v1/user/profile`
- `GET /v1/user/preferences`
- `PUT /v1/user/preferences`
- `GET /v1/user/security`
- `POST /v1/account/delete`

### Data

`user_profiles`:
- `user_id`
- `display_name`
- `avatar_url`
- `bio`
- `location`
- `website`
- `points`
- `vip_tier`
- `vip_expires_at`

`user_preferences`:
- `user_id`
- `default_video_model`
- `default_image_model`
- `default_ratio`
- `language`
- `theme`
- `notify_email`
- `notify_sms`
- `notify_inbox`

### Acceptance

- Settings pages persist changes after refresh.
- Implemented: profile fields persist through `/v1/user/profile`.
- Implemented: preferences persist through `/v1/user/preferences`.
- Implemented: settings profile/preferences forms load and save through `platformAPI`.
- Implemented: `GET /v1/user/security` returns email, status, role, verification state, active sessions, registration time, and last login time.
- Implemented: `POST /v1/account/delete` soft-deletes the user, revokes refresh tokens, writes an audit log, and blocks old access tokens through DB-backed status checks in `RequireAuth`.
- Implemented: settings security page loads through `platformAPI`.
- `/v1/me` returns profile fields used by header/sidebar/dashboard.

## Phase 4: RBAC And Ownership Permissions

Status: implemented for DB-backed user status checks, admin RBAC, active-user checks, task/order/billing ownership, asset ownership, and audit logging.

### Objective

Replace Supabase RLS with explicit Go authorization checks.

### Rules

- Normal users can only access their own tasks, uploads, orders, billing records, preferences, and profile.
- Admin users can access admin endpoints.
- Suspended users can log in but cannot create generation tasks or payment orders.
- Banned/deleted users cannot use authenticated APIs except support-safe endpoints.

### Implementation Tasks

1. Implemented: `RequireAuth` loads user status and role from DB when PostgreSQL is configured.
2. Implemented: `RequireAdmin` uses the DB-backed role populated by `RequireAuth`.
3. Implemented: `RequireActive` blocks suspended users from creating generation tasks and payment orders.
4. Implemented: task `GET /v1/tasks/:id` and `DELETE /v1/tasks/:id` enforce owner-only access.
5. Implemented: persisted upload/asset endpoints enforce owner-only access.
6. Implemented: task/order/billing ownership is enforced by PostgreSQL-backed services.
7. Implemented: audit logs are written for admin writes, auth-sensitive endpoints, and account deletion.

### Acceptance

- Implemented: User A cannot access User B tasks by guessing task IDs.
- Implemented: Admin-only endpoints reject non-admin users through DB-backed role checks.
- Implemented: suspended users can read account state but cannot create tasks or payment orders.
- Implemented: user ownership checks for persisted uploads/assets.
- Implemented: DB-backed task/payment/billing persistence; Docker smoke validation covers these flows.

## Phase 5: Catalog And Admin CRUD Persistence

Status: implemented for providers, models, and prompts.

### Objective

Replace in-memory provider/model/prompt/admin settings with PostgreSQL-backed services.

### Endpoints

Public:
- `GET /v1/providers`
- `GET /v1/models`
- `GET /v1/prompts`

Admin:
- `GET /v1/admin/providers`
- `POST /v1/admin/providers`
- `PATCH /v1/admin/providers/:id`
- `DELETE /v1/admin/providers/:id`
- `GET /v1/admin/models`
- `POST /v1/admin/models`
- `PATCH /v1/admin/models/:id`
- `DELETE /v1/admin/models/:id`
- `GET /v1/admin/prompts`
- `POST /v1/admin/prompts`
- `PATCH /v1/admin/prompts/:id`
- `DELETE /v1/admin/prompts/:id`

### Acceptance

- Implemented: `admin_providers`, `admin_models`, and `admin_prompts` PostgreSQL tables with default seed data.
- Implemented: public provider/model/prompt endpoints read enabled rows from PostgreSQL when `DATABASE_URL` is configured.
- Implemented: admin provider/model/prompt CRUD writes to PostgreSQL when `DATABASE_URL` is configured.
- Implemented: catalog changes survive API restart.
- Implemented: deleted or disabled catalog entries are hidden from public APIs.
- Implemented: `admin_settings` PostgreSQL table stores gateway settings, generation config, and payment settings.
- Implemented: `GET/PUT /v1/admin/gateway` reads and writes PostgreSQL-backed gateway settings.
- Implemented: `GET/PUT /v1/admin/generation-config` reads and writes PostgreSQL-backed generation timeouts.
- Implemented: `GET/PUT /v1/admin/payment`, `/v1/admin/payment/activate`, and `/v1/admin/payment/checkin` read and write PostgreSQL-backed payment settings.
- Implemented: admin user management list/update reads and writes PostgreSQL-backed `users` and `user_profiles`.
- Implemented: gateway, generation, and payment settings pages load persisted PostgreSQL-backed values from the Go API on the client before editing.

## Phase 6: Tasks, Queue, And Artifacts

Status: implemented for PostgreSQL-backed generation task create/list/get/delete, worker status updates, point deduction/refund, and MinIO-backed task artifacts.

### Objective

Persist generation tasks and generated outputs.

### Features

- Create task with model/provider validation.
- Deduct points atomically or reserve points.
- Store queued/running/success/failed status in DB.
- Worker updates task status.
- Generated assets stored in MinIO/S3 and linked through `task_artifacts`.
- Failed task refunds reserved points if needed.

### Endpoints

Authenticated:
- `POST /v1/tasks`
- `GET /v1/tasks`
- `GET /v1/tasks/:id`
- `DELETE /v1/tasks/:id`

Worker/internal:
- Task processing uses DB transaction and storage service.

### Acceptance

- Implemented: tasks survive API restart through PostgreSQL-backed `generation_tasks`.
- Implemented: user task list/get/delete are owner-scoped in PostgreSQL.
- Implemented: worker consumes Redis generation jobs, updates task status, writes artifact objects to MinIO, and persists `task_artifacts` metadata.
- Implemented: generated artifact metadata is linked to storage object keys; user-facing asset download URLs are served through the storage signing endpoint.
- Implemented: task creation deducts model cost from user points and writes billing/ledger records; worker failure path refunds deducted points.

## Phase 7: Storage Replacement

Status: implemented for MinIO/S3-compatible upload signing, completion, owner-scoped metadata lookup, generated artifacts, and avatar upload.

### Objective

Replace Supabase Storage with MinIO/S3-compatible storage.

### Features

- Avatar uploads.
- Reference image uploads.
- Generated image/video/music artifacts.
- Signed upload/download URLs if needed.
- Object metadata persisted in PostgreSQL.

### Endpoints

Authenticated:
- `POST /v1/assets/presign-upload`
- `POST /v1/assets/complete-upload`
- `GET /v1/assets/:id`

### Acceptance

- Local Docker MinIO works.
- Implemented: production can switch to S3-compatible storage with `STORAGE_*` env vars only.
- Implemented: users cannot read private uploaded assets owned by others.
- Implemented: profile avatar upload uses the Go API presign/complete/get flow instead of Supabase Storage.

## Phase 8: Billing, Orders, And Payment Success

Status: implemented for PostgreSQL-backed orders, billing records, points ledger, idempotent payment success, and callback signature verification.

### Objective

Make payment and points ledger fully PostgreSQL-backed.

### Features

- Create order.
- Poll order status.
- Payment callback signature verification.
- Idempotent payment success handling.
- Issue points and membership benefits.
- Write billing ledger records.
- Admin payment settings persistence.

### Endpoints

Authenticated:
- `POST /v1/pay/orders`
- `GET /v1/pay/orders/:id`
- `GET /v1/pay/billing`
- `GET /v1/pay/subscriptions`

Public callback:
- `POST /v1/pay/notify/shouqianba`

Admin:
- `GET /v1/admin/payment`
- `PUT /v1/admin/payment`
- `POST /v1/admin/payment/activate`
- `POST /v1/admin/payment/checkin`

### Acceptance

- Implemented: duplicate payment callback does not double-issue points.
- Implemented: paid order updates user points/member tier and ledger in one transaction.
- Implemented: billing pages show persisted records.
- Implemented: ShouQianBa callback signature verification uses the persisted payment terminal key when configured.

## Phase 9: Frontend Restoration

Status: implemented for auth, settings, admin CRUD, billing, tasks, dashboard live data, and consumption records against the Go API.

### Objective

Restore simplified frontend pages to full behavior using the new Go APIs.

### Pages/Components

Auth:
- `components/auth/sign-up-form.tsx`
- `components/auth/forgot-password-form.tsx`
- `components/auth/reset-password-form.tsx`

Settings:
- `components/settings/profile-form.tsx`
- `components/settings/preferences-form.tsx`
- `components/settings/password-form.tsx`

Admin:
- `components/admin/models-manager.tsx`
- `components/admin/providers-manager.tsx`
- `components/admin/prompts-manager.tsx`
- `components/admin/users-manager.tsx`

Billing/tasks:
- `components/billing/*`
- `components/tasks-list.tsx`
- `components/consumption-records.tsx`

### Acceptance

- Implemented: auth/settings/admin/billing/tasks pages call Go API endpoints instead of Supabase.
- Implemented: dashboard stats/recent activity read task and points data from Go API.
- Implemented: consumption records read persisted billing/task data from Go API.
- Implemented: `pnpm exec tsc --noEmit` passes.
- Implemented: Docker page smoke tests pass.

## Phase 10: Observability, Tests, And Cutover

### Tests

Backend:
- Auth unit tests for password, OTP, refresh rotation.
- Handler tests for auth/profile/catalog/tasks/payment.
- DB integration tests using test PostgreSQL.
- Payment idempotency tests.

Frontend:
- Type-check.
- Smoke tests for auth, dashboard, generator, settings, billing, admin.

Operational:
- Implemented: API responses include `X-Request-ID`, and request logs include request id, method, path, status, latency, and client IP.
- Implemented: successful admin write endpoints write `audit_logs` rows with request id, method, path, and status metadata.
- Implemented: auth-sensitive endpoints write `audit_logs` rows, including login, refresh, register OTP, password reset, change password, and logout attempts.
- Implemented: health/readiness endpoints include DB, Redis, and storage checks.

### Acceptance

- `go test ./...` passes.
- `pnpm exec tsc --noEmit` passes.
- Docker starts from clean state.
- No Supabase references in runtime code, lockfiles, Docker config, or scripts.

## Recommended Execution Order

1. Phase 1: PostgreSQL foundation.
2. Phase 2: Auth and email OTP.
3. Phase 3: Profile/preferences/security settings.
4. Phase 4: RBAC and ownership checks.
5. Phase 5: Catalog/admin CRUD persistence.
6. Phase 6: Tasks and artifacts.
7. Phase 7: Storage.
8. Phase 8: Billing/payment ledger.
9. Phase 9: Restore frontend functionality.
10. Phase 10: tests and cutover.

## First Implementation Slice

Start with Phase 1 and Phase 2 together because auth depends on the user schema.

Concrete first slice:
1. Add DB migrations for `users`, `user_profiles`, `refresh_tokens`, `email_otps`, and `audit_logs`.
2. Add `pgxpool` connection in API startup.
3. Implement `POST /v1/auth/register/request-otp` with log mail provider.
4. Implement `POST /v1/auth/register/verify-otp` to create user/profile and return JWT pair.
5. Implemented: password login verifies stored password hashes.
6. Persist refresh token hashes and rotate on refresh.
7. Update frontend sign-up form to request and verify OTP.

## Risks And Decisions

- Email provider must be chosen before production. Use log provider for local development first.
- Password hash algorithm should be fixed early. Recommended: Argon2id. Bcrypt is simpler but less modern.
- Refresh token rotation requires careful invalidation to avoid token replay.
- Admin bootstrapping must be deterministic. Recommended: seed admin from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in local/dev only, or a one-shot CLI command for production.
- Production deployment should still configure a real SMTP provider, payment provider credentials, and real generation provider credentials before serving external users.
