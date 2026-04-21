# Tracing "I paid but badge is not active" (current stack)

Operational playbook: how to investigate payment vs. badge activation with **today's** logging and payment flow. For Paddle setup, see [PADDLE_AND_PLANS_SETUP.md](./PADDLE_AND_PLANS_SETUP.md).

## Reality check

- [`server/src/services/paymentService.ts`](../server/src/services/paymentService.ts) does **not** call `logger`. There is no dedicated audit line such as "upgraded user X to chronographer".
- `handleTransactionCompleted` can **return HTTP 200** and still **not** change the badge (early returns: missing `user_id` / `price_id`, unknown price ID, user not found, or user already on that badge)—**without** application-level logs for those silent paths.
- **pino-http** logs each request (except `/health`). Use those lines plus **Paddle** and the **database** as the main evidence chain.

## 1. Resolve the user

Support usually provides **email**. Look up the user in PostgreSQL (Prisma Studio, SQL, etc.) and note **`user.id`**.

Checkout sends that id as Paddle **`custom_data.user_id`** in the transaction; the webhook reads **`data.custom_data.user_id`** (see `createCheckout` and `handleTransactionCompleted` in `paymentService.ts`).

## 2. Application logs on the VPS (Docker)

```bash
cd "$APP_DIR/server/current" && export REGIONIFY_ENV_FILE="$APP_DIR/server/.env.production"
docker compose -f docker-compose.prod.yml logs server --since 48h 2>&1
```

Or: `docker ps` and `docker logs <server-container-id> --since 48h` (Compose names the server container under project `regionify`, not a fixed `container_name`).

Routes: webhook is **`POST /payments/webhook`** on the API subdomain (`https://api.regionify.mnavasardian.com/payments/webhook`). Express mounts API routes at the root only — there is no `/api` prefix anymore.

Interpret **pino-http** (or JSON `req`/`res`) lines for those paths:

| What you see                     | Likely meaning                                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **401** on webhook               | Invalid signature (secret mismatch, altered body, wrong signing key)                                            |
| **400** "Missing body"           | Raw body missing (unusual if traffic hits the app correctly)                                                    |
| **500** plus **`Request error`** | Uncaught error in `handleTransactionCompleted` (see [`errorHandler`](../server/src/middleware/errorHandler.ts)) |
| **200** on webhook               | Handler finished without throwing — **not** proof the badge was upgraded                                        |

Also check **`POST /payments/create-checkout`** around the reported time: **201** means a checkout was created for the **authenticated** session user (not proof of completed payment).

## 3. Paddle (source of truth for payment)

In the Paddle dashboard → **Transactions**, open the transaction and verify:

- Price ID matches **Chronographer** (same string as `PADDLE_PRICE_ID_CHRONOGRAPHER` in env).
- **Custom data** includes **`user_id`** and it matches the internal user you looked up.
- Transaction status is **`completed`** (not `billed` or `canceled`).

If **`user_id` is missing or wrong**, the server may respond **200** and apply **no** update.

You can also resend the `transaction.completed` webhook from **Developer Tools → Webhooks → recent deliveries** — useful to retry a missed delivery without asking the user to repurchase.

## 4. Confirm activation in the database

Check the user row **`badge`** in PostgreSQL. If it is not `chronographer`, reconcile with webhook HTTP outcome and Paddle transaction / custom data.

## Limits of the current setup

- No structured "payment applied" / "skipped reason" log line.
- No **request correlation id** shared across middleware and support tickets; investigation is **time window + path + status + external transaction data**.
- **Silent success paths** (200, no DB change) are the hardest cases — Paddle transaction + `user_id` + price ID env alignment is what closes them.

## Possible improvements (optional)

Add **`logger.info`** / **`logger.warn`** in `handleTransactionCompleted` for: transaction id, `userId`, `priceId`, resolved badge, and whether the row was updated or skipped (with a **non-sensitive** reason). Optionally add **`genReqId`** in **pino-http** so all lines for one webhook POST share an id.
