# Email System Implementation Summary

## ✅ What Was Built

A complete **UnoSend-powered transactional email system** with unsubscribe management, deep-linked receipts, and 3 email types (transaction receipts, welcome, login alerts).

---

## 📧 Email Types & Triggers

### 1. **Transaction Receipts** (Fire-and-forget after purchase)
- **Airtime** — Phone number, network, amount, balance
- **Data** — Plan name, phone, amount, balance
- **Cable** — Provider, smartcard, bouquet, amount, balance
- **Electricity** — Token inside email, meter, DISCO, amount, balance
- **Recharge Pins** — Count, network, denomination, PDF link
- **Wallet Funding (Deposits)** — Bank details, amount, new balance

**Trigger Points:**
- Every purchase action calls `saveTransaction()` → fires `sendTransactionEmail()` on SUCCESS
- Monnify webhook calls `verifyAndCreditPayment()` → fires email after wallet update (inside idempotency guard so no duplicates)

### 2. **Welcome Email**
- **Trigger:** Right after signup (register page) posts to `/api/email/welcome`
- Shows Mozosubz value proposition + CTA to fund wallet

### 3. **Login Alert Email**
- **Trigger:** After successful sign-in on login page
- Shows device (browser + OS), IP address, login time
- "Secure my account" CTA links to password change page

---

## 🔗 Email Links

All transaction receipt CTAs ("View Transaction") deep-link directly to:
```
https://mozosubz.com/dashboard/transactions/<transaction-id>
```

This is the specific transaction detail page where users see the full receipt.

---

## 🚫 Unsubscribe System

### How It Works

1. **Every email footer** contains an "Unsubscribe" link:
   ```
   https://mozosubz.com/unsubscribe?t=<signed-token>
   ```

2. **Token format:** Base64(`userId:category:HMAC-SHA256(userId:category, UNSUBSCRIBE_SECRET)`)
   - **Not reversible** — can't forge a link for another user
   - **No login required** — link works for anyone

3. **User clicks → `/unsubscribe` page shows:**
   - Who's unsubscribing (recovered from token)
   - Three options:
     - "Unsubscribe from marketing"
     - "Unsubscribe from all"
     - "Resubscribe"

4. **Database:** `email_preferences` table (user_id PK, transactional_enabled, marketing_enabled, RLS)

### What Gets Blocked?

- **Transactional emails (receipts, welcome, login alerts):** ✅ **ALWAYS SEND** — legal/UX requirement
- **Marketing emails:** 🚫 Blocked if user unsubscribed (not currently sent, but infrastructure ready)

If user disables transactional, the unsubscribe page shows a warning: "This will stop important account emails."

---

## 📁 Files Created

### Library Code
```
lib/email/
  ├── client.ts                    # UnoSend HTTP wrapper, respects preferences
  ├── unsubscribe.ts               # HMAC signing/verification for links
  ├── send-transaction-email.ts    # Main helper (calls resolveRecipient + template + client)
  └── templates/
      ├── shell.ts                 # Shared brand wrapper (header + footer)
      ├── transaction.ts           # Receipt template (data-driven for all services)
      ├── welcome.ts               # Welcome template
      └── login-alert.ts           # Login alert template
```

### API Routes
```
app/api/email/
  ├── welcome/route.ts             # POST /api/email/welcome
  ├── login-alert/route.ts         # POST /api/email/login-alert
  └── unsubscribe/route.ts         # POST /api/email/unsubscribe (verifies token, updates prefs)
```

### Unsubscribe UI
```
app/unsubscribe/
  ├── page.tsx                      # Unsubscribe confirmation page
  └── unsubscribe-form.tsx          # Form with 3 action buttons
```

### Integrations
- `lib/actions/transactions.ts` — Added email hook after wallet credit (deposits)
- `lib/utils/save-transaction.ts` — Added email hook for all service purchases
- `app/register/page.tsx` — Added welcome email after signup
- `app/login/page.tsx` — Added login alert after sign-in

---

## 🗄️ Database Migrations Applied

| Migration | Purpose |
|-----------|---------|
| `fix-profile-system-v1.sql` | Create `profiles` table + auto-create trigger |
| `add-admin-columns` | Add `is_admin`, `admin_role` columns |
| `fix-profile-trigger-v2` | Update trigger to include admin fields |
| `backfill-profile-data` | Backfill nulls, create `is_profile_complete()` |
| `create-transactions-tables` | Create `transactions` + `monnify_transactions` |
| `add-transaction-columns` | Add `transaction_id`, `service_id`, `description` |
| `add-deposit-fee-columns` | Add `processing_fee`, `net_amount` to monnify_txns |
| `deposit-rules-schema` | Create `deposit_rules` table |
| `create-pricing-rules` | Create canonical `pricing_rules` table |
| `create-admin-logs` | Audit trail for admin actions |
| `create-recent-phones` | Recent phone numbers for quick-select UX |
| `0001-email-preferences` | Email opt-in table (RLS per user) |

---

## 🔑 Environment Variables Required

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` — Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Service role (server-only)

### UnoSend (Email)
- `UNOSEND_API_KEY` — API key (starts with `un_`)
- `UNOSEND_FROM_EMAIL` — Verified sender (e.g. `no-reply@mozosubz.com`)
- `UNOSEND_FROM_NAME` — Display name (e.g. `Mozosubz`)
- `UNSUBSCRIBE_SECRET` — Generate: `openssl rand -base64 32`

### App URLs
- `NEXT_PUBLIC_APP_URL` — Public URL (e.g. `https://mozosubz.com`)
- `NEXT_PUBLIC_SITE_URL` — Site URL
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` — Dev redirect

### Monnify (Deposits)
- `MONNIFY_API_KEY` — API key
- `MONNIFY_SECRET_KEY` — Secret key
- `MONNIFY_CONTRACT_CODE` — Contract code

### GSubz (Services)
- `GSUBZ_API_KEY` — API key for airtime/data/cable/electricity/pins

---

## 🎯 Design & Brand

Email templates use your custom brand design:
- Blue gradient hero header (1a56db → 3b82f6)
- Transaction summary table with service, method, date, status
- Reference details (ref + tx ID)
- Branded footer with unsubscribe
- Responsive (works on mobile)

All emails are plain HTML with inline CSS — no external dependencies, renders everywhere.

---

## ⚠️ Pre-Existing Type Errors

The following files have TypeScript errors **unrelated to the email system** (GSubz API response shapes):
- `lib/actions/airtime.ts`
- `lib/actions/cable.ts`
- `lib/actions/data.ts`
- `lib/actions/electricity.ts`

Email system has **zero type errors**.

---

## 🚀 Next Steps

1. **Test the system:**
   - Sign up → check welcome email
   - Sign in → check login alert email
   - Buy airtime/data/etc → check receipt email
   - Fund wallet → check deposit receipt email
   - Click unsubscribe link in any email → verify page works

2. **Configure UnoSend domain:**
   - Verify `UNOSEND_FROM_EMAIL` domain on UnoSend dashboard (SPF/DKIM/DMARC)
   - Without verification, emails may be blocked

3. **Monitor:**
   - Check UnoSend dashboard for delivery stats
   - Check email_preferences table for opt-outs
   - Monitor logs for any `[email]` errors

---

## 📋 Webhook URL

For Monnify webhook configuration:
```
https://mozosubz.xyz/api/monnify/webhook
```

This receives payment status updates and triggers the deposit receipt email.
