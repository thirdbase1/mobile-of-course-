# Monnify Payment Flow - Bug Fix Summary

## Problem Identified
DB rows in `monnify_transactions` have NULL values for critical fields:
- `transaction_reference` (Monnify's reference)
- `account_number`, `bank_name`, `account_name`, `ussd_code`
- `monnify_response`

This causes the checkout query endpoint to fail with: "DB transaction not found or no transactionReference"

## Root Cause
**The code was already correct!** All 4 steps were implemented in `/app/api/deposit/start/route.ts`:
1. ✅ `createTransaction()` - Creates DB row
2. ✅ `initTransaction()` - Gets Monnify transactionReference
3. ✅ `initializePayment()` - Gets account details
4. ✅ `updateTransactionWithMonnifyData()` - Should persist everything

**However, there were 2 hidden issues:**

### Issue #1: Silent Failure in Step 4
If `updateTransactionWithMonnifyData()` failed (without returning success:false), the request would still return 200 OK. The DB update error was silently swallowed.

**Fix Applied**: Added error check and return 500 if update fails.

### Issue #2: Missing Credentials
If `MONNIFY_API_KEY` or `MONNIFY_SECRET_KEY` environment variables are missing, `getMonnifyAccessToken()` returns null, causing `initTransaction()` to fail.

**Fix Applied**: Enhanced logging to show which credentials are missing.

### Issue #3: Unclear Error Messages
The checkout client showed generic "payment failed" messages without distinguishing between:
- Credentials missing
- Monnify API unreachable
- DB update failed
- Payment not actually made

**Fix Applied**: Added detailed logs prefixed with ✅/❌ status indicators.

---

## Expected DB Row State After `/api/deposit/start`

After successfully completing the deposit initialization, the `monnify_transactions` row should have:

### MUST NOT BE NULL:
- ✅ `id` (UUID) - Auto-generated
- ✅ `user_id` - From authenticated user
- ✅ `payment_reference` - Generated (e.g., `MOZO_...`)
- ✅ `amount` - From request
- ✅ `status` - Set to `PENDING`
- ✅ `expires_at` - 20 minutes from now
- ✅ `created_at` - Timestamp

### SHOULD NOT BE NULL (set by Step 2-3):
- ✅ `transaction_reference` - From Monnify `initTransaction()`
- ✅ `account_number` - From Monnify `initializePayment()`
- ✅ `bank_name` - From Monnify `initializePayment()`
- ✅ `account_name` - From Monnify `initializePayment()`
- ✅ `bank_code` - From Monnify `initializePayment()`
- ✅ `ussd_code` - From Monnify `initializePayment()`
- ✅ `monnify_response` - Stored for audit trail

### OK TO BE NULL (until payment):
- `webhook_received_at` - Set when webhook fires
- `paid_at` - Set when payment confirmed

---

## Updated Code Changes

### 1. Enhanced Error Handling in `/app/api/deposit/start/route.ts`
```typescript
// Now returns error if updateTransactionWithMonnifyData fails
const updateResult = await updateTransactionWithMonnifyData(...)
if (!updateResult.success) {
  return NextResponse.json({ success: false, error: ... }, { status: 500 })
}
```

### 2. Detailed Logging in `/lib/actions/transactions.ts`
```typescript
console.log('[TRANSACTION_UPDATE] Fields to update:', { ... })
console.log('[TRANSACTION_UPDATE] ✅ Successfully updated', { rows_affected, ... })
```

### 3. Credentials Validation in `/lib/actions/monnify.ts`
```typescript
console.error('[MONNIFY] ❌ Missing API credentials:', {
  hasApiKey: !!API_KEY,
  hasSecretKey: !!SECRET_KEY,
  hasContractCode: !!CONTRACT_CODE,
})
```

---

## Debugging Checklist

Run through these steps to verify the flow:

1. **Check Environment Variables**
   ```
   MONNIFY_API_KEY - Should have value and start with specific prefix
   MONNIFY_SECRET_KEY - Should have value
   MONNIFY_CONTRACT_CODE - Should match your Monnify dashboard
   ```

2. **Test Deposit Endpoint**
   ```bash
   curl -X POST http://localhost:3000/api/deposit/start \
     -H "Content-Type: application/json" \
     -d '{"amount": 100, "description": "Test"}'
   ```
   
   **Look for these in logs**:
   ```
   [DEPOSIT_API] ✅ Monnify transaction reference: MNFY|...
   [TRANSACTION_UPDATE] ✅ Successfully updated { rows_affected: 1, transaction_reference: MNFY|... }
   ```

3. **Query Supabase Directly**
   ```sql
   SELECT id, payment_reference, transaction_reference, account_number, bank_name, status
   FROM monnify_transactions
   ORDER BY created_at DESC
   LIMIT 1;
   ```
   
   **All these should be populated**, not NULL:
   - `transaction_reference` (NOT NULL)
   - `account_number` (NOT NULL)
   - `bank_name` (NOT NULL)

4. **If Any Field is NULL**
   - Check API logs for `[MONNIFY] ❌ Missing API credentials`
   - Check `initTransaction()` or `initializePayment()` failed logs
   - Check `updateTransactionWithMonnifyData()` error logs
   - Verify Monnify credentials are correct in environment variables

---

## Next Steps After Fix

1. **Monitor Logs** during next deposit attempt:
   - Watch for `[TRANSACTION_UPDATE] ✅` message
   - Watch for any `❌` status indicators

2. **Verify Checkout Page** receives correct data:
   - Navigate to checkout URL
   - Should show bank account details for payment
   - Should NOT show "Payment Not Found"

3. **Webhook Verification**:
   - Webhook at `https://your-domain.com/api/monnify/webhook` should receive `TRANSACTION_PAID` event
   - Should update status to `SUCCESS` and credit wallet

4. **Disable Debug Logs** after verification:
   - Remove [v0] prefixed logs from production
   - Keep [DEPOSIT_API], [TRANSACTION_UPDATE], [MONNIFY] prefixed logs for monitoring
