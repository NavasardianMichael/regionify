# Plans & Paddle Billing Setup – Step by Step

This doc covers what you need to provide and run to enable **user badges** (observer / explorer / chronographer) and **Paddle one-time payments** (API-created checkouts, webhook for badge upgrade).

---

## 1. Database: `badge` on users

The Prisma schema has the `Badge` enum and `User.badge` field. Apply it to your DB:

```bash
cd server
npx prisma generate
npx prisma db push
```

Existing users get `badge = observer` (free) by default.

---

## 2. Paddle: Create account and products

1. **Sign up / log in** at [Paddle](https://vendors.paddle.com) (production) or [Paddle Sandbox](https://sandbox-vendors.paddle.com) (development/testing).
2. Go to **Catalog → Products → New product**.
   - Create one product (e.g. **Regionify Badge**).
3. Under the product, add **two Prices** — both one-time:
   - **Explorer**: one-time, **$49 USD**.
   - **Chronographer**: one-time, **$149 USD**.
4. Copy the **Price ID** for each (format: `pri_01abc...`). These go into the env vars below.

> **Sandbox vs production:** Price IDs in the sandbox are different from production. Use sandbox credentials in dev and production credentials in prod.

---

## 3. Paddle: Webhook endpoint

1. Go to **Developer Tools → Webhooks → New endpoint**.
2. Set the **URL**:
   - Production: `https://api.regionify.mnavasardian.com/payments/webhook`
   - Dev (local): use a tunnel like ngrok → `https://your-tunnel.ngrok.io/payments/webhook`
3. Subscribe to the **`transaction.completed`** event only.
4. Save and copy the **Signing secret** — this is your `PADDLE_WEBHOOK_SECRET`.

---

## 4. Paddle: API key

1. Go to **Developer Tools → Authentication → API keys**.
2. Create an API key (or use existing). Copy it — this is your `PADDLE_API_KEY`.

---

## 5. Server environment variables

Add to `server/.env.development.local` (dev) or your production env:

```env
# Paddle Billing (one-time checkouts; webhook for transaction.completed)
PADDLE_API_KEY=your_api_key_here
PADDLE_WEBHOOK_SECRET=your_webhook_signing_secret
PADDLE_PRICE_ID_EXPLORER=pri_01abc_explorer
PADDLE_PRICE_ID_CHRONOGRAPHER=pri_01abc_chronographer
PADDLE_SANDBOX=true   # omit or set to "false" in production
```

| Variable                        | Description                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| `PADDLE_API_KEY`                | Paddle API secret key (from Developer Tools → Authentication)                              |
| `PADDLE_WEBHOOK_SECRET`         | Signing secret from your webhook endpoint configuration                                    |
| `PADDLE_PRICE_ID_EXPLORER`      | Price ID for the Explorer badge (`pri_...`)                                                |
| `PADDLE_PRICE_ID_CHRONOGRAPHER` | Price ID for the Chronographer badge (`pri_...`)                                           |
| `PADDLE_SANDBOX`                | Set to `"true"` to use `sandbox-api.paddle.com`; omit or any other value uses the live API |

All payment vars are required for payments to work. If `PADDLE_API_KEY` is missing, create-checkout returns a service error.

---

## 6. Client URL for redirects

After payment Paddle redirects the user to your app. The server builds the return URL from `CLIENT_URL`:

- **Return URL**: `{CLIENT_URL}/payments/return`

Ensure `CLIENT_URL` is the real origin of the client with no trailing slash.

---

## 7. Flow summary

1. **Create checkout (server)**
   User clicks "Upgrade" on Billing.
   Client calls `POST {API_URL}/payments/create-checkout` with `{ badge: 'explorer' | 'chronographer' }`.
   Server creates a Paddle transaction (items with price ID, `custom_data.user_id`), returns `{ checkoutUrl }` from `data.checkout.url`.

2. **Redirect to Paddle**
   Client does `window.location.href = checkoutUrl`. User pays on Paddle's hosted checkout page.

3. **Webhook: transaction.completed**
   Paddle sends `POST {API_URL}/payments/webhook` with a `Paddle-Signature` header.
   Server verifies the signature, then for `transaction.completed` reads `data.custom_data.user_id` and `data.items[0].price.id`, maps the price ID to a badge, and updates `User.badge` in the DB. Idempotent — safe to run multiple times.

4. **Return to your app**
   Paddle redirects to `{CLIENT_URL}/payments/return`. The return page polls `GET {API_URL}/auth/me` until the user's badge is updated (by the webhook), then shows success.

All Paddle API calls and secrets stay on the server; the client only receives the checkout URL.

---

## 8. Badge features

| Badge         | Export formats          | Quality | Historical data import | Animation (GIF/MP4) |
| ------------- | ----------------------- | ------- | ---------------------- | ------------------- |
| Observer      | PNG, JPEG, PDF          | 50% max | No                     | No                  |
| Explorer      | PNG, SVG, JPEG, PDF     | 100%    | No                     | No                  |
| Chronographer | PNG, SVG, JPEG, PDF + … | 100%    | Yes                    | Yes                 |

Paddle integration is **one-time payment** only. No subscriptions.

---

## 9. Testing (sandbox mode)

1. Set `PADDLE_SANDBOX=true` in `server/.env.development.local`.
2. Use your sandbox Price IDs in `PADDLE_PRICE_ID_EXPLORER` and `PADDLE_PRICE_ID_CHRONOGRAPHER`.
3. Complete a test purchase using Paddle sandbox test card:
   - **Card number**: `4242 4242 4242 4242`
   - **Expiry**: any future date
   - **CVC**: any 3 digits
4. After payment, check **Developer Tools → Webhooks → recent deliveries** in the Paddle sandbox dashboard to confirm `transaction.completed` was sent and your server returned 200.
5. To test idempotency, click **Resend** on the webhook delivery — your server should return 200 without making a duplicate DB write.

---

## 10. What you must do outside the repo to make payments work

Everything below is a one-time external setup that is not automated by code. Do the sandbox steps first, verify end-to-end, then repeat with live credentials for production.

### Phase 1 — Sandbox (development & testing)

#### Step 1 — Create a Paddle sandbox account

- Go to [sandbox-vendors.paddle.com](https://sandbox-vendors.paddle.com) and register.
- The sandbox is completely isolated from production — separate account, separate price IDs, separate API keys.

#### Step 2 — Create a product and two prices

1. Log in to the sandbox dashboard.
2. **Catalog → Products → New product.**
   - Name: `Regionify Badge` (or any name — not customer-facing for one-time purchases).
   - Save.
3. On the product page, click **New price** twice:
   - Price 1: type = **One-time**, amount = **$49.00 USD**, internal description = `Explorer`.
   - Price 2: type = **One-time**, amount = **$149.00 USD**, internal description = `Chronographer`.
4. Copy both **Price IDs** (shown as `pri_01...` next to each price). You need these for env vars.

#### Step 3 — Get a sandbox API key

1. **Developer Tools → Authentication → API keys → New API key.**
2. Give it a name (e.g. `regionify-dev`), select any reasonable expiry or no expiry.
3. Copy the key immediately — it is only shown once.
4. This is your `PADDLE_API_KEY` for the dev env.

#### Step 4 — Set up a local webhook tunnel

Paddle cannot reach `localhost` directly. Use a tunnel to expose your local server.

Option A — **ngrok** (recommended):

```bash
ngrok http 9002
```

Copy the `https://xxxx.ngrok-free.app` forwarding URL.

Option B — **Cloudflare Tunnel** (free, no account for quick tunnels):

```bash
cloudflared tunnel --url http://localhost:9002
```

Your tunnel webhook URL will be: `https://<tunnel-host>/payments/webhook`

#### Step 5 — Register the sandbox webhook endpoint

1. **Developer Tools → Webhooks → New endpoint.**
2. URL: your tunnel URL from Step 4 (e.g. `https://xxxx.ngrok-free.app/payments/webhook`).
3. Events: select **`transaction.completed`** only. Deselect everything else.
4. Save. Click the endpoint to open it and copy the **Signing secret** (`pdl_ntfset_...`).
5. This is your `PADDLE_WEBHOOK_SECRET` for the dev env.

#### Step 6 — Fill in `server/.env.development.local`

```env
PADDLE_API_KEY=<sandbox API key from Step 3>
PADDLE_WEBHOOK_SECRET=<signing secret from Step 5>
PADDLE_PRICE_ID_EXPLORER=<Explorer price ID from Step 2>
PADDLE_PRICE_ID_CHRONOGRAPHER=<Chronographer price ID from Step 2>
PADDLE_SANDBOX=true
```

#### Step 7 — Run the full end-to-end test

1. Start the tunnel (keep the terminal open).
2. `pnpm dev` — start client + server.
3. Log in as a test user (observer badge).
4. Go to `/billing`, click **Upgrade to Explorer**.
5. You should be redirected to a Paddle sandbox checkout page.
6. Pay with test card `4242 4242 4242 4242`, any future expiry, any CVC.
7. After payment you land on `/payments/return` — watch it poll and flip to the success screen.
8. In the Paddle sandbox dashboard → **Developer Tools → Webhooks → recent deliveries** — confirm the webhook was delivered and received a **200** response from your server.
9. In Prisma Studio (`npx prisma studio` in `server/`) or psql, confirm the user's `badge` column changed to `explorer`.
10. Resend the webhook from the Paddle dashboard — the server must return 200 again and the badge must not change (idempotency check).

---

### Phase 2 — Production (live payments)

#### Step 1 — Create a Paddle production account

- Go to [vendors.paddle.com](https://vendors.paddle.com) and register or log in.
- Complete **business verification** — Paddle requires company/individual details, tax information, and a payout bank account before you can go live. This can take **1–3 business days**.
- Under **Business → Locations**, confirm Armenia is listed as your business country.

#### Step 2 — Create the same product and prices in production

- Repeat sandbox Step 2 exactly, but in the **production** dashboard.
- The production price IDs (`pri_01...`) will be **different** from sandbox — copy them separately.

#### Step 3 — Get a production API key

- **Developer Tools → Authentication → API keys → New API key.**
- Copy immediately. This is your production `PADDLE_API_KEY`.

#### Step 4 — Register the production webhook endpoint

1. **Developer Tools → Webhooks → New endpoint.**
2. URL: `https://api.regionify.mnavasardian.com/payments/webhook`
   _(This must be the live, TLS-secured API URL — no tunnel needed in production.)_
3. Events: **`transaction.completed`** only.
4. Save and copy the **Signing secret**. This is your production `PADDLE_WEBHOOK_SECRET`.

#### Step 5 — Fill in `server/.env.production.local`

```env
PADDLE_API_KEY=<production API key from Step 3>
PADDLE_WEBHOOK_SECRET=<signing secret from Step 4>
PADDLE_PRICE_ID_EXPLORER=<Explorer price ID from Step 2>
PADDLE_PRICE_ID_CHRONOGRAPHER=<Chronographer price ID from Step 2>
# PADDLE_SANDBOX — omit entirely, or set to anything other than "true"
```

#### Step 6 — Deploy

Standard deploy. The new env vars take effect on next server start — no code changes needed, no DB migration needed.

#### Step 7 — Run a live smoke test

- Paddle allows test transactions on production before full activation. Use a real card with a small amount, then issue a refund from the Paddle dashboard.
- Alternatively, run one real $49 Explorer purchase on a personal account and verify the full flow: checkout → webhook → badge updated → success screen.
- Check **Developer Tools → Webhooks → recent deliveries** in the production dashboard to confirm the webhook was delivered with a **200** response.

#### Step 8 — Go live

Once you have verified a successful real transaction, Paddle will remove any remaining restrictions on your account (if they exist). Payments from real customers will work from this point.

---

### Quick reference: sandbox vs production differences

|                      | Sandbox                    | Production                     |
| -------------------- | -------------------------- | ------------------------------ |
| Dashboard            | sandbox-vendors.paddle.com | vendors.paddle.com             |
| API base             | sandbox-api.paddle.com     | api.paddle.com                 |
| `PADDLE_SANDBOX` env | `true`                     | omit                           |
| Price IDs            | different `pri_...` values | different `pri_...` values     |
| API key              | separate key               | separate key                   |
| Webhook secret       | separate secret            | separate secret                |
| Webhook URL          | ngrok/tunnel               | api.regionify.mnavasardian.com |
| Real money           | no                         | yes                            |
