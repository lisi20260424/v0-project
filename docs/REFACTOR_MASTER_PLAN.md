# Refactor Master Plan (Go + PostgreSQL)

## Milestones
- P0 Baseline scaffold and Docker baseline
- P1 Database foundation (migrate + sqlc)
- P2 API foundation
- P3 Auth and user
- P4 Tasks
- P5 Worker
- P6 Payment and billing
- P7 Admin APIs
- P8 Cutover and validation
- P9 Legacy dependency removal
- P10 Self-hosted capability replacement

## P0 Status
- Completed on 2026-05-26

## Linked Plans
- Docker deployment: `deploy/docker/docker-compose.yml`
- Database migrations: `packages/db/migrations`
- Go API: `apps/api`

## Current Priority
- Continue validating the self-hosted Go API, PostgreSQL, Redis, and MinIO runtime.
- Completed auth slices: PostgreSQL schema, DB connection, startup migrations, email OTP registration, real password login, persisted refresh token rotation, `/v1/me` from DB, forgot/reset password, and logged-in change password.
- Completed OTP hardening: 60-second resend cooldown and 5-per-hour email rate limit.
- Completed SMTP provider: local defaults to `MAIL_PROVIDER=log`, production can use `MAIL_PROVIDER=smtp` with `SMTP_*` variables.
- Completed logout refresh-token revocation and frontend sign-out API call.
- Completed in-process IP-level rate limiting for auth-sensitive endpoints.
- Docker smoke validation passed for API health, migrations, auth registration/login/logout flow, public catalog, and key frontend pages.
- Frontend TypeScript baseline now passes in the Docker web container.
- Next slice: Profile/Preferences persistence, then Redis-backed distributed rate limiting if deploying multiple API replicas.

## P1 Scope
- Build sqlc config
- Create migration directory baseline
- Start incremental porting from legacy /scripts SQL

## Legacy SQL Porting Order
1. 001_create_profiles.sql
2. 003_extend_profiles_and_preferences.sql
3. 005_create_admin_tables.sql
4. 006_create_admin_providers.sql
5. 006_create_generation_config.sql
6. 011_add_api_model_id.sql
7. 012_add_api_model_ids.sql
8. 013_create_generation_tasks.sql
9. 014_add_user_management_fields.sql
10. 015_admin_list_users_function.sql
11. 018_fix_vip_tier_constraint.sql
12. 019_create_payment_and_billing.sql
13. 020_add_payment_extra_fields.sql
