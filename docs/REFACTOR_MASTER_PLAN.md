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

## P0 Status
- Completed on 2026-05-26

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
