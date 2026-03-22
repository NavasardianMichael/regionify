# Plans & Lemon Squeezy Setup – Step by Step

This doc covers what you need to provide and run to enable **user plans** (free / explorer / chronographer) and **Lemon Squeezy one-time payments** (API-created checkouts, webhook for plan upgrade).

---

## 1. Database: Add `plan` to users

The Prisma schema already has the `Plan` enum and `User.plan` field. Apply it to your DB:

```bash
cd server
npx prisma generate
npx prisma db push
```

Existing users get `plan = observer` (free) by default.

---

## 2. Lemon Squeezy: Create store and products

1. **Sign up / log in** at [Lemon Squeezy](https://app.lemonsqueezy.com).
2. **Create or select a store** (Settings → Stores). Note your **Store ID** (numeric, e.g. `12345`).
3. **Create a product** for Regionify plans:
   - Go to **Products** → **New product**.
   - Name it e.g. **Regionify Plan** (or use two products: Explorer and Chronographer).
   - Add **two variants** (one for Explorer, one for Chronographer) with the same prices as in the app:
     - **Explorer**: one-time price **$59** (or match `PLAN_DETAILS.explorer.price` in `shared`).
     - **Chronographer**: one-time price **$159** (or match `PLAN_DETAILS.chronographer.price`).
   - Save the product and copy each **Variant ID** from the product/variant dropdown (e.g. **Copy ID**).

---

## 3. Lemon Squeezy: API key and webhook

1. **API key**
   - Go to **Settings** → **API** in Lemon Squeezy.
   - Create an API key (or use existing). Copy the key (starts with a long string).
2. **Webhook**
   - Go to **Settings** → **Webhooks**.
   - **Add webhook**:
     - **Callback URL**: `https://your-api-domain.com/api/payments/webhook` (use your real server URL; for local dev you can use a tunnel like ngrok).
     - **Signing secret**: Generate a random string (6–40 chars) and store it securely.
     - **Events**: Subscribe to **Order created** (`order_created`).
   - Save. You will use the **signing secret** in server env.

---

## 4. Server environment variables

Add to your server env (e.g. `server/.env.development.local` or your deployment env):

```env
# Lemon Squeezy (one-time checkouts; webhook for order_created)
LEMON_SQUEEZY_API_KEY=your_api_key_here
LEMON_SQUEEZY_STORE_ID=your_store_id
LEMON_SQUEEZY_VARIANT_ID_EXPLORER=variant_id_for_explorer
LEMON_SQUEEZY_VARIANT_ID_CHRONOGRAPHER=variant_id_for_chronographer
LEMON_SQUEEZY_WEBHOOK_SECRET=your_webhook_signing_secret
```

- **LEMON_SQUEEZY_API_KEY**: From Settings → API.
- **LEMON_SQUEEZY_STORE_ID**: Your store ID (string, e.g. `"12345"`).
- **LEMON_SQUEEZY_VARIANT_ID_EXPLORER**: Variant ID for the Explorer plan (string).
- **LEMON_SQUEEZY_VARIANT_ID_CHRONOGRAPHER**: Variant ID for the Chronographer plan (string).
- **LEMON_SQUEEZY_WEBHOOK_SECRET**: The signing secret you set when creating the webhook.

All of these are required for payments to work. If any is missing, create-checkout will return a service error.

---

## 5. Client URL for redirects

Lemon Squeezy redirects the user back to your app after payment. The server uses `CLIENT_URL` to build:

- **Redirect URL**: `{CLIENT_URL}/payments/return`

Ensure `CLIENT_URL` in your server env is the real origin of the client (e.g. `https://yourapp.com` or `http://localhost:7002` in dev — same port as Vite in `client/vite.config.ts`). No trailing slash.

---

## 6. Flow summary

1. **Create checkout (server)**  
   User clicks “Buy Explorer” or “Buy Chronographer” on Billing.  
   Client calls `POST /api/payments/create-checkout` with `{ plan: 'explorer' | 'chronographer' }` (with cookies).  
   Server creates a Lemon Squeezy checkout (custom price from `PLAN_DETAILS`, `user_id` in custom data), returns `{ checkoutUrl }`.

2. **Redirect to Lemon Squeezy**  
   Client does `window.location.href = checkoutUrl`. User pays on Lemon Squeezy (card, PayPal, etc.).

3. **Webhook: order_created**  
   Lemon Squeezy sends `POST /api/payments/webhook` with signature. Server verifies `X-Signature`, then for `order_created` reads `meta.custom_data.user_id` and `first_order_item.variant_id`, maps variant to plan, and updates `User.plan` in the DB.

4. **Return to your app**  
   Lemon Squeezy redirects to `{CLIENT_URL}/payments/return`. The return page polls `GET /api/auth/me` until the user’s plan has been updated (by the webhook), then shows success.

5. **Cancel**  
   If the user closes the checkout without paying, they can navigate back to Billing manually. There is no cancel URL required for Lemon Squeezy in this flow.

All Lemon Squeezy API calls and secrets stay on the server; the client only receives the checkout URL.

---

## 7. Plan features (each plan includes all features of the previous)

| Plan          | Export formats     | Quality | Historical data import   | Animation (GIF/MP4) |
| ------------- | ------------------ | ------- | ------------------------ | ------------------- |
| Observer      | PNG only           | 50% max | No                       | No                  |
| Explorer      | PNG, SVG, JPEG     | 100%    | No                       | No                  |
| Chronographer | PNG, SVG, JPEG, …  | 100%    | Yes (same format + time) | Yes                 |

Lemon Squeezy integration is **one-time payment** only. No subscriptions.

---

## 8. Testing (test mode)

Lemon Squeezy supports **test mode**. When creating the checkout you can pass `test_mode: true` in the API request if you want test payments. The server does not set it by default; you can add an env flag (e.g. `LEMON_SQUEEZY_TEST_MODE=true`) and pass it in `paymentService.createCheckout` if needed.

---

## 9. Optional: Prices in shared package

Prices are defined in `shared/src/constants/plans.ts` (`PLAN_DETAILS[plan].price`). The server uses these to set `custom_price` (in cents) when creating the checkout. Keep product prices in Lemon Squeezy aligned with these values, or use custom_price (as we do) to enforce them at checkout.
