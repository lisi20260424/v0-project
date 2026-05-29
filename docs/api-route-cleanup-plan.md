# API Route Cleanup Plan

## Scope
- Legacy Next API routes under `app/api/*`
- New backend routes under Go API `/v1/*`

## Completed
- Added Go endpoint: `POST /v1/account/delete`.
- Frontend migrated to new API in `components/settings/delete-account-dialog.tsx`.
- Removed legacy route: `app/api/account/delete/route.ts`.

## Safe To Remove (After Smoke Test)
- `app/api/tasks/route.ts`
- `app/api/tasks/[id]/route.ts`
- `app/api/payment/orders/route.ts`
- `app/api/payment/orders/[id]/route.ts`
- `app/api/user/points/route.ts`
- `app/api/user/consumption/route.ts`
- `app/api/user/billing/route.ts`
- `app/api/user/subscriptions/route.ts`
- `app/api/admin/models/route.ts`
- `app/api/admin/models/[id]/route.ts`
- `app/api/admin/providers/route.ts`
- `app/api/admin/providers/[id]/route.ts`
- `app/api/admin/prompts/route.ts`
- `app/api/admin/prompts/[id]/route.ts`
- `app/api/admin/users/route.ts`
- `app/api/admin/users/[id]/route.ts`
- `app/api/admin/gateway/route.ts`
- `app/api/admin/gateway/test/route.ts`
- `app/api/admin/generation-config/route.ts`
- `app/api/admin/payment/route.ts`
- `app/api/admin/payment/activate/route.ts`
- `app/api/admin/payment/checkin/route.ts`
- `app/api/models/route.ts`
- `app/api/models/grouped/route.ts`
- `app/api/admin/init-generation-config/route.ts`
- `app/api/payment/notify/route.ts`
  - Note: frontend placeholder text already migrated to `/v1/pay/notify/shouqianba`.

## Removal Order
1. Remove all listed safe routes in one PR.
2. Run frontend smoke tests (login, tasks, billing, admin settings, payment callback setting page, delete-account flow).
