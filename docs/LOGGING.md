# Logging

Practical reference for **how logging is structured** in Regionify and **how to read those logs in production**, both via direct Docker commands on the VPS and via Grafana.

For the underlying infrastructure (Loki, Promtail, Grafana setup, retention rules, nginx, SMTP for alerting) see [OBSERVABILITY.md](./OBSERVABILITY.md). For the specific "I paid but my badge didn't update" investigation playbook see [SUPPORT_PAYMENT_AND_LOG_TRACING.md](./SUPPORT_PAYMENT_AND_LOG_TRACING.md).

---

## Architecture at a glance

```
server (node)
  └─ pino logger ─▶ stdout (JSON in prod, pretty-printed in dev)
                       │
                       ▼
              Docker (json-file driver, 10MB rolling buffer)
                       │
                       ▼
              Promtail (Docker SD, parses pino JSON, adds labels)
                       │
                       ▼
                     Loki (30-day default / 1-year for important="true")
                       │
                       ▼
                   Grafana — https://logs.regionify.pro
```

- **Loki** stores everything. Default retention is 30 days; logs labeled `important="true"` are kept for 1 year (see [Important business events](#important-business-events--1-year-retention)).
- **Promtail** does the parsing and labeling. It only scrapes containers in the `regionify` compose project.
- **Grafana** is the UI on top of Loki. Pre-provisioned with a Loki datasource and a Regionify dashboard.

---

## Log format

The server uses [pino](https://github.com/pinojs/pino). Every log line is a single JSON object on stdout:

```json
{
  "level": 30,
  "time": 1747531214123,
  "msg": "paddle webhook: badge update complete",
  "userId": "abc-123",
  "priceId": "pri_01kpv…",
  "transactionId": "txn_01h…",
  "action": "payment_completed"
}
```

| Pino numeric level | String label (set by Promtail) | When we use it                                                                 |
| ------------------ | ------------------------------ | ------------------------------------------------------------------------------ |
| 10                 | `trace`                        | Effectively unused — pino default is below this                                |
| 20                 | `debug`                        | Local-only signal. **Dropped by Promtail in prod** even if `LOG_LEVEL=debug`   |
| 30                 | `info`                         | Normal application progress, business events, request completions              |
| 40                 | `warn`                         | Recoverable problem, validation failure, signature mismatch, unexpected branch |
| 50                 | `error`                        | Uncaught request errors (via `errorHandler`), background-job failures          |
| 60                 | `fatal`                        | Uncaught exception at the process level — server is about to exit              |

### What's logged automatically

- **Every HTTP request** (except `/health`) is logged once when the response completes, by [`pino-http`](https://github.com/pinojs/pino-http). Includes `req.method`, `req.url`, `res.statusCode`, response time, `req.id`, and a per-request `pino` child logger.
- **Every uncaught request error** is logged at `error` level by [`errorHandler`](../server/src/middleware/errorHandler.ts) as `Request error`, with the full `err` object (stack, message, code).
- **Process lifecycle** — startup (`🚀 Server started`), graceful shutdown (`Shutdown signal received` → `Server closed gracefully`), unhandled rejections (`error`), uncaught exceptions (`fatal`). See [`server/src/index.ts`](../server/src/index.ts).

### What we never log

- Passwords, tokens, session secrets, full `Paddle-Signature` headers (we slice to 40 chars), Stripe/Paddle API keys, credit-card data, raw request/response bodies of auth or payment routes.
- If you add new logs, follow this rule.

---

## Structured logging conventions

**Always log with a structured context object first, message second.** Pino's signature is `logger.info(ctx, msg)`. The context becomes top-level JSON fields you can filter on in Loki.

```typescript
logger.info({ userId, action: 'payment_completed' }, 'badge upgraded');
//          └─ becomes searchable JSON fields    └─ free-text message
```

**Do this**, not this:

```typescript
logger.info(`badge upgraded for ${userId}`);
```

The latter buries the user ID inside `msg`, defeating structured search.

### Conventional field names

| Field           | Purpose                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| `userId`        | Internal user UUID. Use this name across the codebase for cross-referencing.                                        |
| `transactionId` | Paddle transaction ID (e.g. `txn_01h…`) — primary key in Paddle dashboard                                           |
| `priceId`       | Paddle price ID — needed to identify which product/tier                                                             |
| `action`        | **Business-event name.** Triggers 1-year retention when in the allowlist (see below)                                |
| `err`           | The Error object — pino's serializer expands it into `err.message`, `err.stack`, `err.code`                         |
| `req.id`        | Per-request UUID set by pino-http. Already attached to every request log; reuse it if logging from inside a handler |

---

## Important business events — 1-year retention

Any log whose JSON has `"action"` matching one of these strings is labeled `important="true"` by Promtail and kept by Loki for **1 year** instead of the default 30 days.

Current allowlist (see [`monitoring/promtail/promtail-prod-config.yml`](../monitoring/promtail/promtail-prod-config.yml)):

- `payment_completed`
- `payment_failed`
- `order_created`
- `subscription_created`
- `subscription_cancelled`

### Where we currently emit these

| File                                                                     | Event               | Level  |
| ------------------------------------------------------------------------ | ------------------- | ------ |
| [`server/src/routes/payments.ts`](../server/src/routes/payments.ts) (×2) | `payment_completed` | `info` |

### Adding a new important event

1. Pick a new `action` string in `snake_case` (e.g. `refund_issued`).
2. Add it to the `or` block in **both** Promtail configs (`promtail-config.yml` and `promtail-prod-config.yml`) — keep them in sync.
3. Restart Promtail: `docker compose -f docker-compose.prod.yml restart promtail`.
4. Use it in code: `logger.info({ userId, action: 'refund_issued' }, '…')`.

See [OBSERVABILITY.md § Extending Important-Event Detection](./OBSERVABILITY.md#extending-important-event-detection) for the exact YAML diff.

---

## Viewing logs in production

You have two ways to read prod logs. Use Grafana for everything except a) emergencies when Loki/Grafana itself is down, b) the brief window after a deploy before Promtail catches up.

### A. Via Grafana (preferred)

1. Open <https://logs.regionify.pro>
2. Sign in (admin credentials live in `server/.env.production.local` as `GF_SECURITY_ADMIN_PASSWORD`).
3. Two starting points:
   - **Dashboards → Regionify** for the at-a-glance dashboard (errors, business events, log volume, request rate, live stream).
   - **Explore → Loki datasource** for ad-hoc LogQL queries (use the examples in the next section).
4. Set the time range in the top-right. Default is "Last 1 hour"; pick "Last 24 hours" or a custom range for older events.

### B. Via SSH + Docker (fallback / quick check)

```bash
# SSH to the VPS, then:
cd "$APP_DIR/server/current"
export REGIONIFY_ENV_FILE="$APP_DIR/server/.env.production"

# Tail server logs live
docker compose -f docker-compose.prod.yml logs -f server

# Last 1000 lines
docker compose -f docker-compose.prod.yml logs --tail 1000 server

# Last 24 hours
docker compose -f docker-compose.prod.yml logs --since 24h server

# Single line per request, including pino-http output
docker compose -f docker-compose.prod.yml logs --since 1h server 2>&1 | grep '"level":30'
```

These tail Docker's own json-file buffer, which holds up to ~30MB rolling per container (3 files × 10MB — see `x-logging` in [`docker-compose.prod.yml`](../docker-compose.prod.yml)). Older lines are gone from disk but still in Loki.

The raw output is single-line JSON. For local readability, pipe it through `jq`:

```bash
docker compose -f docker-compose.prod.yml logs --since 1h server 2>&1 \
  | grep -v 'attaching to' \
  | jq -R 'fromjson? // empty'
```

### Container service names (for `docker compose logs <name>`)

| Compose service | Container name       | What it logs                        |
| --------------- | -------------------- | ----------------------------------- |
| `server`        | (auto-named)         | Node app — the main source          |
| `postgres`      | `regionify-postgres` | DB connection / slow query messages |
| `redis`         | `regionify-redis`    | Connection / persistence events     |
| `loki`          | `regionify-loki`     | Loki itself                         |
| `promtail`      | `regionify-promtail` | Shipping status, target discovery   |
| `grafana`       | `regionify-grafana`  | Grafana web app                     |

---

## Common LogQL queries

Paste these into Grafana **Explore** with the Loki datasource selected. Adjust the time range in the top-right.

### Server activity

```logql
# Everything the server has logged
{service="server"}

# Errors only
{service="server", level="error"}

# Fatal — server-restart territory
{service="server", level="fatal"}

# Warnings and worse
{service="server", level=~"warn|error|fatal"}
```

### HTTP requests (pino-http JSON)

```logql
# All 5xx responses
{service="server"} | json | res_statusCode =~ "5.."

# All 4xx responses (excluding 401/404 noise — adjust as needed)
{service="server"} | json | res_statusCode =~ "4.." | res_statusCode != "401" | res_statusCode != "404"

# Slow requests (>1s)
{service="server"} | json | responseTime > 1000

# Specific route
{service="server"} | json | req_url=~"/payments/.*"
```

### Business events / payments

```logql
# Everything tagged important — kept for 1 year
{important="true"}

# Successful payments only
{important="true"} | json | action="payment_completed"

# A specific user's payment history
{important="true"} |= "abc-123-user-id"

# A specific Paddle transaction
{service="server"} |= "txn_01h…"

# Webhook lifecycle for a transaction (handling → complete)
{service="server"} |= "paddle webhook" |= "txn_01h…"
```

### A specific user's full activity

```logql
{service="server"} |= "user-id-here"
```

### Per-request trace (pino-http req.id)

When `pino-http` assigns a request a `req.id`, you can fetch every log line emitted by that request handler:

```logql
{service="server"} | json | req_id="some-req-id"
```

### Postgres / Redis

```logql
{service="postgres"}
{service="redis"}
```

These don't emit pino JSON, so `level` won't be set — they just appear as raw text lines.

---

## Practical playbooks

### "There's an error spike — what just broke?"

1. Grafana → Regionify dashboard → **Active Errors (5 min)** panel.
2. If it's a spike, **Log Stream** panel below shows the actual error messages with `level="error"` highlighted.
3. Click any line → Loki context view (lines before/after) to see what request triggered it.

### "User says payment didn't activate badge"

See the full step-by-step in [SUPPORT_PAYMENT_AND_LOG_TRACING.md](./SUPPORT_PAYMENT_AND_LOG_TRACING.md). TL;DR:

1. Get user email → look up `users.id` in DB.
2. Grafana: `{important="true"} |= "<user-id>"` → expect a `paddle webhook: badge update complete` line.
3. If absent, check Paddle dashboard for the transaction (`custom_data.user_id`, status, price ID).
4. Compare `priceId` in the log line to `PADDLE_PRICE_ID_*` env vars.

### "Did the last deploy succeed?"

```logql
{service="server"} |= "Server started"
```

Each deploy restarts the container, producing one `🚀 Server started` line.

### "Webhook signature failures"

```logql
{service="server"} |= "invalid signature"
```

Recurring matches mean the `PADDLE_WEBHOOK_SECRET` env var doesn't match the Paddle Notification Destination secret. Rotate or realign.

---

## Style guide for new log calls

When adding logs to a new service or route, follow these rules:

1. **Use structured context.** `logger.info({ key: value, ... }, 'short imperative msg')`.
2. **Choose the right level.** See the level table at the top. When in doubt: `info` for "happened", `warn` for "unusual but recoverable", `error` for "we failed".
3. **Use `action: 'snake_case_event'` for business-critical events** so they survive 1 year in Loki. If introducing a new action, also update the Promtail allowlist (see [Adding a new important event](#adding-a-new-important-event)).
4. **Use consistent field names** (`userId`, `transactionId`, `priceId`, `projectId`, etc.) so logs cross-reference cleanly across services.
5. **Never log secrets.** Slice signatures, redact tokens (`apiKey: '***'`), pass `err` not `err.message + err.stack`.
6. **Don't log inside hot loops.** Aggregate (`logger.info({ count }, '…')`) instead of one line per item.
7. **Keep the message short and stable.** Treat the message as a key — long, parameter-laden strings are hard to filter on. Put variables in the context object.

```typescript
// Good
logger.info({ userId, projectId, action: 'project_created' }, 'project created');

// Bad
logger.info(`Created project ${projectId} for user ${userId} at ${new Date()}`);
```

---

## Configuration reference

| Setting                                              | Dev value               | Prod value                   |
| ---------------------------------------------------- | ----------------------- | ---------------------------- |
| `LOG_LEVEL` (env var, controls pino's minimum level) | `debug`                 | `info`                       |
| pino-pretty                                          | enabled                 | disabled (raw JSON)          |
| Docker log driver                                    | `json-file`             | `json-file`                  |
| Docker log file size                                 | 10 MB × 3 files         | 10 MB × 3 files              |
| Promtail in-prod debug drop                          | disabled                | enabled (extra safety net)   |
| Loki default retention                               | 30 days                 | 30 days                      |
| Loki retention for `{important="true"}`              | 1 year                  | 1 year                       |
| Grafana URL                                          | <http://localhost:8002> | <https://logs.regionify.pro> |
| Grafana anonymous viewer                             | enabled (admin/admin)   | disabled                     |

---

## Limitations & known gaps

- **No cross-service correlation ID.** Within one HTTP request, `pino-http` attaches `req.id`. But that ID is not propagated to Paddle webhooks or external calls — so reconciling "the create-checkout call" with "the webhook that came back 10 minutes later" still requires matching on `userId` + `transactionId` rather than a single trace ID.
- **Webhook silent-skip branches**. `handleTransactionCompleted` in [`paymentService.ts`](../server/src/services/paymentService.ts) can return without updating the DB (user not found, price ID mismatch, already on that badge) without logging anything. The route-level info log fires before the skip, so you'll see "handling transaction.completed" but no "badge update complete" if a skip happens. Future work: log the skip reason at `warn`.
- **No structured `action` on auth events yet.** Logins, registrations, password resets currently log as plain `info` without `action`. Adding e.g. `action: 'user_registered'` (and the matching Promtail entry) would give us 1-year-retained signup history.
