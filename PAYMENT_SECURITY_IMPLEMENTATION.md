# Payment Security Implementation

## Problem Fixed
Previously, when a user clicked "I Have Paid", the system immediately marked the payment as successful WITHOUT verifying with Monnify. This allowed users to claim deposits without actually paying.

## Solution: Two-Layer Verification

### Layer 1: Real-Time User Verification (When "I Have Paid" is clicked)
**Endpoint**: `POST /api/payments/verify`

Process:
1. User clicks "I Have Paid" button
2. Client calls `/api/payments/verify` with `paymentReference`
3. Endpoint verifies:
   - ✅ User owns this transaction (auth check)
   - ✅ Transaction exists in DB
   - ✅ Queries Monnify API directly for payment status
   - ✅ **Only shows SUCCESS if Monnify says paymentStatus === 'PAID'**
4. If confirmed, calls `verifyAndCreditPayment()` which:
   - Immediately marks transaction as SUCCESS (prevents duplicate processing)
   - Credits wallet with amount
5. If NOT confirmed, shows error with actual Monnify status

Key Security Features:
- **Direct Monnify Query**: Doesn't trust client claims - queries Monnify's API directly
- **User Ownership Verification**: Verifies logged-in user owns the transaction
- **Idempotent**: Marks SUCCESS immediately to prevent double-crediting if called multiple times

### Layer 2: Webhook Verification (Monnify confirms payment)
**Endpoint**: `POST /api/monnify/webhook`

Process:
1. Monnify sends webhook when payment completes
2. Endpoint verifies:
   - ✅ **Signature validation**: HMAC-SHA512(SECRET_KEY + body) matches monnify-signature header
   - ✅ **Event type check**: Only processes SUCCESSFUL_TRANSACTION events
   - ✅ **Duplicate detection**: Checks if transaction already has status=SUCCESS, skips if so
   - ✅ **Payment status**: Ensures paymentStatus === 'PAID'
3. Credits wallet via `verifyAndCreditPayment()` (idempotent)
4. Records `webhook_received_at` timestamp for debugging

Key Security Features:
- **Signature Validation**: Per Monnify docs, validates HMAC-SHA512 hash
- **Duplicate Prevention**: Won't double-credit if webhook is resent
- **Fail-Safe**: Always returns 200 HTTP to Monnify to prevent retry loops, errors logged for manual review
- **Idempotent**: Uses transaction status = SUCCESS to prevent double-processing

## Secure Hash Verification (Webhook)

The webhook signature is computed as:
```
HMAC-SHA512(MONNIFY_SECRET_KEY, stringified_request_body)
```

Example verification in Node.js:
```javascript
const crypto = require('crypto')
const hash = crypto
  .createHmac('sha512', SECRET_KEY)
  .update(body)
  .digest('hex')

const isValid = hash === receivedSignature
```

## Prevention of Attack Vectors

| Attack | Prevention |
|--------|-----------|
| User clicks "I Have Paid" without paying | ✅ `/api/payments/verify` queries Monnify - can't fake |
| Fake webhook from unauthorized IP | ✅ Signature validation fails - webhook rejected |
| Duplicate webhook processing | ✅ Check `status = SUCCESS` - skip if already processed |
| Webhook from different Monnify event type | ✅ Only process SUCCESSFUL_TRANSACTION events |
| Man-in-the-middle webhook | ✅ HMAC-SHA512 signature validation |
| User owns transaction check bypass | ✅ User ownership verified before crediting |

## Flow Diagrams

### Happy Path: User Pays Then Clicks "I Have Paid"
```
User clicks "Pay Now"
  ↓
Monnify modal opens
  ↓
User pays via bank transfer
  ↓
Monnify receives payment
  ↓
[WEBHOOK FLOW]
Monnify sends webhook (signature-validated)
  ↓
System credits wallet immediately
  ↓
[MEANWHILE - POLLING]
User sees "Processing..." and can click "I Have Paid"
  ↓
[USER VERIFY FLOW]
/api/payments/verify queries Monnify
  ↓
Monnify confirms PAID status
  ↓
System shows "Payment Successful"
  ↓
Wallet balance updated (wallet update happened in webhook)
```

### Attack Attempt: User Clicks "I Have Paid" Without Paying
```
User clicks "I Have Paid" WITHOUT sending money
  ↓
/api/payments/verify called
  ↓
Endpoint queries Monnify API
  ↓
Monnify says paymentStatus = PENDING (or FAILED)
  ↓
System returns error: "Payment not yet confirmed by Monnify"
  ↓
No wallet credit occurs
  ✅ Attack prevented
```

### Webhook Attack: Fake Signature
```
Attacker sends fake webhook with
monnify-signature: wrong_hash_value
  ↓
Endpoint computes hash
  ↓
hash !== monnify-signature
  ↓
Webhook rejected
  ↓
No wallet credit occurs
  ✅ Attack prevented
```

## Database State Tracking

After a successful payment:

```sql
SELECT
  id,
  payment_reference,
  transaction_reference,
  user_id,
  amount,
  status,
  paid_at,
  webhook_received_at,
  account_number,
  bank_name
FROM monnify_transactions
WHERE payment_reference = 'MOZO_xxxxx'
```

Expected values:
- `status` = 'SUCCESS' (marked immediately on first confirmation)
- `paid_at` = timestamp of wallet credit
- `webhook_received_at` = timestamp webhook was processed
- `account_number` = populated (from Monnify)
- `transaction_reference` = Monnify's internal ref (e.g., MNFY|67|...)

## Configuration Requirements

Environment variables required:
- `MONNIFY_API_KEY` - Merchant API key
- `MONNIFY_SECRET_KEY` - Merchant secret key (used for signature validation)
- `MONNIFY_CONTRACT_CODE` - Contract code

Webhook URL to configure in Monnify Dashboard:
```
https://your-domain.com/api/monnify/webhook
```

Event types to enable:
- ✅ Successful Collection (SUCCESSFUL_TRANSACTION)

IP Whitelist (per Monnify docs):
- ✅ 35.242.133.146

## Testing Checklist

- [ ] Try clicking "I Have Paid" WITHOUT sending money → should fail with "not confirmed" error
- [ ] Send money via transfer → webhook processes automatically
- [ ] Click "I Have Paid" after sending money → confirms and shows success
- [ ] Resend webhook multiple times → only credits once (idempotent)
- [ ] Check logs for signature validation success
- [ ] Verify wallet balance increased by correct amount
- [ ] Check `paid_at` and `webhook_received_at` timestamps in DB
