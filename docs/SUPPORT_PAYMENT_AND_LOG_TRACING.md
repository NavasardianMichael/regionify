# Tracing “I paid but Chronographer is not active” (current stack)

Operational playbook: how to investigate payment vs. plan activation with **today’s** logging and payment flow. For Lemon Squeezy setup, see [LEMON_SQUEEZY_AND_PLANS_SETUP.md](./LEMON_SQUEEZY_AND_PLANS_SETUP.md).

## Reality check

- [`server/src/services/paymentService.ts`](../server/src/services/paymentService.ts) does **not** call `logger`. There is no dedicated audit line such as “upgraded user X to chronographer”.
- `handleOrderCreated` can **return HTTP 200** and still **not** change the plan (early returns: missing `user_id` / `variant_id`, unknown variant, user not found, or user already on that plan)—**without** application-level logs for those silent paths.
- **pino-http** logs each request (except `/health`). Use those lines plus **Lemon Squeezy** and the **database** as the main evidence chain.

## 1. Resolve the user

Support usually provides **email**. Look up the user in PostgreSQL (Prisma Studio, SQL, etc.) and note **`user.id`**.

Checkout sends that id as Lemon Squeezy **`checkout_data.custom.user_id`**; the webhook reads **`meta.custom_data.user_id`** (see `createCheckout` and `handleOrderCreated` in `paymentService.ts`).

## 2. Application logs on the VPS (Docker)

```bash
cd "$APP_DIR/server/current" && export REGIONIFY_ENV_FILE="$APP_DIR/server/.env.production"
docker compose -f docker-compose.prod.yml logs server --since 48h 2>&1
```

Or: `docker ps` and `docker logs <server-container-id> --since 48h` (Compose names the server container under project `regionify`, not a fixed `container_name`).

Routes: webhook is **`POST /payments/webhook`** and **`POST /api/payments/webhook`** (mounted in both places).

Interpret **pino-http** (or JSON `req`/`res`) lines for those paths:

| What you see                     | Likely meaning                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **401** on webhook               | Invalid signature (secret mismatch, altered body, wrong signing)                                        |
| **400** “Missing body”           | Raw body missing (unusual if traffic hits the app correctly)                                            |
| **500** plus **`Request error`** | Uncaught error in `handleOrderCreated` (see [`errorHandler`](../server/src/middleware/errorHandler.ts)) |
| **200** on webhook               | Handler finished without throwing — **not** proof the plan was upgraded                                 |

Also check **`POST`** **`/payments/create-checkout`** / **`/api/payments/create-checkout`** around the reported time: **201** means a checkout was created for the **authenticated** session user (not proof of completed payment).

## 3. Lemon Squeezy (source of truth for payment)

In the Lemon Squeezy dashboard, open the order and verify:

- Variant matches **Chronographer** (same numeric ID as `LEMON_SQUEEZY_VARIANT_ID_CHRONOGRAPHER`).
- **Custom data** includes **`user_id`** and it matches the internal user you looked up.

If **`user_id` is missing or wrong**, the server may respond **200** and apply **no** update.

## 4. Confirm activation in the database

Check the user row **`plan`** in PostgreSQL. If it is not `chronographer`, reconcile with webhook HTTP outcome and LS order/custom data.

## Limits of the current setup

- No structured “payment applied” / “skipped reason” log line.
- No **request correlation id** shared across middleware and support tickets; investigation is **time window + path + status + external order data**.
- **Silent success paths** (200, no DB change) are the hardest cases—LS order + `user_id` + variant env alignment is what closes them.

## Possible improvements (optional)

Add **`logger.info`** / **`logger.warn`** in `handleOrderCreated` for: order id, `userId`, `variantId`, resolved plan, and whether the row was updated or skipped (with a **non-sensitive** reason). Optionally add **`genReqId`** in **pino-http** so all lines for one webhook POST share an id.
