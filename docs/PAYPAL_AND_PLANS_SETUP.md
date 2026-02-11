# Plans & PayPal Setup – Step by Step

This doc covers what you need to provide and run to enable **user plans** (free / explorer / atlas) and **PayPal one-time payments** (backend-only, no client tokens, **not subscriptions**).

---

## 1. Database: Add `plan` to users

The Prisma schema already has the `Plan` enum and `User.plan` field. Apply it to your DB:

```bash
cd server
npx prisma generate
npx prisma db push
```

If you use migrations instead of `db push`:

```bash
npx prisma migrate dev --name add_user_plan
```

Existing users get `plan = free` by default.

---

## 2. PayPal: Get API credentials

1. **Sandbox (testing)**
   - Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/).
   - Log in (or create a developer account).
   - **Apps & Credentials** → **Sandbox** tab → **Create App** (or use default).
   - Open the app → **Client ID** and **Secret**. Copy both.

2. **Production (live)**
   - Same dashboard → **Apps & Credentials** → **Live** tab.
   - Create app (or use existing) → copy **Client ID** and **Secret**.

Never commit these. Use env vars only (see below).

---

## 3. Server environment variables

Add to your server env (e.g. `server/.env.development.local` or your deployment env):

```env
# PayPal (backend-only; no frontend tokens)
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_secret_here
```

Optional:

```env
# Sandbox (default if omitted)
PAYPAL_API_BASE_URL=https://api-m.sandbox.paypal.com

# Production
# PAYPAL_API_BASE_URL=https://api-m.paypal.com
```

- Omit `PAYPAL_API_BASE_URL` for sandbox.
- For production, set `PAYPAL_API_BASE_URL=https://api-m.paypal.com` and use **Live** Client ID and Secret.

`PAYPAL_WEBHOOK_ID` is reserved for future webhook verification; you can leave it unset.

---

## 4. Client URL for PayPal redirects

PayPal redirects the user back to your app after payment. The server uses `CLIENT_URL` to build:

- Return URL: `{CLIENT_URL}/payments/return`
- Cancel URL: `{CLIENT_URL}/payments/cancel`

Ensure `CLIENT_URL` in your server env is the real origin of the client (e.g. `https://yourapp.com` or `http://localhost:5173` in dev). No trailing slash.

---

## 5. Flow summary

1. **Create order (server)**  
   User clicks “Upgrade to Explorer” or “Upgrade to Atlas” on Billing.  
   Client calls `POST /api/payments/create-order` with `{ plan: 'explorer' | 'chronographer' }` (with cookies).  
   Server creates a PayPal order (no SDK), returns `{ orderId, approvalUrl }`.

2. **Redirect to PayPal**  
   Client does `window.location.href = approvalUrl`. User pays on PayPal.

3. **Return to your app**  
   PayPal redirects to `{CLIENT_URL}/payments/return?token={orderId}`.  
   Client calls `POST /api/payments/capture` with `{ orderId: token }` (with cookies).  
   Server captures the order, updates `User.plan` in the DB, returns the new plan.  
   Client refreshes auth (e.g. `/auth/status`) and shows success.

4. **Cancel**  
   If user cancels on PayPal, they are sent to `{CLIENT_URL}/payments/cancel`.  
   No capture; no plan change.

All PayPal API calls and secrets stay on the server; the client only gets the approval URL and order ID.

---

## 6. Plan features (each plan includes all features of the previous)

| Plan     | Export formats | Quality | Historical data import   | Animation (GIF) |
| -------- | -------------- | ------- | ------------------------ | --------------- |
| Free     | PNG only       | 50% max | No                       | No              |
| Explorer | PNG, SVG, JPEG | 100%    | No                       | No              |
| Atlas    | PNG, SVG, JPEG | 100%    | Yes (same format + time) | Yes             |

- **Free:** Download only PNG with max 50% quality.
- **Explorer:** Download all formats (PNG, SVG, JPEG) at 100% quality.
- **Atlas:** Explorer features + import historical data (CSV/Excel with optional year column) + generate animated GIF from that data.

PayPal integration is **one-time payment** only (Orders v2 create/capture). No subscriptions.

---

## 7. Optional: Webhook (future)

For extra safety you can verify captures via PayPal webhooks (e.g. `PAYMENT.CAPTURE.COMPLETED`).  
That would require:

1. In PayPal Developer Dashboard: create a webhook, set URL to `https://your-api.com/api/payments/webhook`.
2. Set `PAYPAL_WEBHOOK_ID` in server env.
3. Implement webhook handler that verifies signature and updates `User.plan` (idempotent).

Current implementation relies on the capture API and session; webhook is not required for the flow above.
