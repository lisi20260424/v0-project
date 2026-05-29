# P8 Cutover Checklist (Web -> Go API)

## 0. Environment
- Set `NEXT_PUBLIC_API_BASE_URL=http://localhost/api` in web runtime.
- Ensure docker services are up: nginx, web, api, worker, postgres, redis.

## 1. Auth Flow
- Call `POST /v1/auth/login` and store `accessToken` + `refreshToken`.
- Call `GET /v1/me` with `Authorization: Bearer <accessToken>`.
- Expected: `code=0` and user object.

## 2. Task Flow
- Call `POST /v1/tasks` with `{type, modelId, prompt}`.
- Call `GET /v1/tasks`.
- Expected: create success and list returns task array.

## 3. Payment Flow
- Call `POST /v1/pay/orders`.
- Call `GET /v1/pay/orders/:id`.
- Simulate callback: `POST /v1/pay/notify/shouqianba`.
- Call `GET /v1/pay/billing`.
- Expected: order status updates, billing record appears.

## 4. Admin Flow
- Login with admin-like identity (current scaffold: email starts with `admin@`).
- Verify admin endpoints under `/v1/admin/*` are accessible.
- Verify normal user is rejected with `403`.

## 5. Frontend Migration Order
1. Replace auth calls with `lib/platform-api.ts`.
2. Replace tasks pages/components (`tasks-list`, generators).
3. Replace payment pages/components (`checkout-client`, records).
4. Replace admin pages/components.
5. Remove legacy Next route dependencies under `app/api/*`.

## 6. Exit Criteria
- All primary user flows run through `/v1/*` endpoints.
- No critical frontend call remains pointing to legacy `/api/*` business routes.
- `apps/api` and `apps/worker` pass `go test ./...`.
