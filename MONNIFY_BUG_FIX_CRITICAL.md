## Monnify Bug Fix Checklist - Critical Diagnostics

### What These Fixes Do

**Fix 1 (Post-Creation Verification):**
- Immediately after `createTransaction()`, queries the DB to verify the row exists
- If the row is NULL: Your DB insert failed (check table permissions, schema, or user context)
- If the row exists: Move to Fix 2 to verify Monnify data persistence

**Fix 2 (Update with Row Return):**
- After calling `updateTransactionWithMonnifyData()`, now returns the updated row
- If `updated` is NULL: The WHERE clause `eq('payment_reference', paymentReference)` matched nothing
- If `updated` exists: All Monnify fields should be populated (not NULL)

---

## Expected Database State After Each Step

### After Step 1 (createTransaction):
```sql
SELECT * FROM monnify_transactions WHERE payment_reference = 'MOZO_...' LIMIT 1;
```
| Field | Value | Why |
|-------|-------|-----|
| `id` | UUID | DB-generated |
| `payment_reference` | `MOZO_...` | Input param |
| `user_id` | UUID | Current user |
| `amount` | Number | Input param |
| `status` | `PENDING` | Default status |
| `transaction_reference` | `NULL` | ✓ Expected (not set yet) |
| `account_number` | `NULL` | ✓ Expected (not set yet) |
| `bank_name` | `NULL` | ✓ Expected (not set yet) |

**If any field is missing or id is NULL: Fix 1 catches this immediately**

---

### After Step 4 (updateTransactionWithMonnifyData):
```sql
SELECT transaction_reference, account_number, bank_name, account_name, ussd_code 
FROM monnify_transactions 
WHERE payment_reference = 'MOZO_...' LIMIT 1;
```
| Field | Value | Why |
|-------|-------|-----|
| `transaction_reference` | `MNFY\|...` | From Monnify `initTransaction()` |
| `account_number` | `1234567890` | From Monnify `initializePayment()` |
| `bank_name` | `Guaranty Trust Bank` | From Monnify `initializePayment()` |
| `account_name` | `User Full Name` | From Monnify `initializePayment()` |
| `ussd_code` | `*737*123#` | From Monnify `initializePayment()` |

**If any field is still NULL after Fix 2: The Monnify API call or update is failing**

---

## Debugging Flow

### Scenario 1: Fix 1 Fails ("Row not found after create")
- **Problem**: `createTransaction()` returned success but row doesn't exist
- **Causes**:
  - Wrong table name in Supabase query
  - User context lost (check `supabase.auth.getUser()`)
  - Column names don't match schema
  - RLS policy blocking insert
- **Next**: Check Supabase table schema and RLS policies for `monnify_transactions`

### Scenario 2: Fix 1 Passes, Fix 2 Fails ("Update matched 0 rows")
- **Problem**: Row exists after creation, but update doesn't find it
- **Causes**:
  - `payment_reference` value changed between create and update
  - Different Supabase client instance (check server context)
  - Case-sensitive mismatch in payment_reference
- **Next**: Log the exact `paymentReference` value being used in both steps

### Scenario 3: Both Fixes Pass, But Fields Are Still NULL
- **Problem**: Update returned the row, but Monnify fields are NULL
- **Causes**:
  - `initTransaction()` failed silently (check logs for `[DEPOSIT_API] Monnify init-transaction failed`)
  - `initializePayment()` failed silently
  - Monnify API returned empty response
- **Next**: Check logs for Monnify errors and verify API credentials

---

## Log Statements To Watch

After making a deposit request, watch for these logs:

```
✅ GOOD - All fields populated:
[DEPOSIT_API] ✅ Created row verified: {...transaction_reference: null...}
[DEPOSIT_API] Monnify transaction reference: MNFY|...
[DEPOSIT_API] Payment initialized successfully
[TRANSACTION_UPDATE] ✅ Successfully updated {...transaction_reference: MNFY|...}

❌ BAD - Fix 1 fails:
[DEPOSIT_API] ❌ Row not found right after create

❌ BAD - Fix 2 fails:
[TRANSACTION_UPDATE] ❌ Update matched 0 rows

❌ BAD - Monnify fails:
[DEPOSIT_API] Monnify init-transaction failed: ...
[DEPOSIT_API] Monnify init-payment failed: ...
```

---

## Quick Test

1. **Make a deposit request**:
   ```bash
   curl -X POST http://localhost:3000/api/deposit/start \
     -H "Content-Type: application/json" \
     -d '{"amount": 100, "description": "Test"}'
   ```

2. **Check logs for Fix 1**:
   - Look for `[DEPOSIT_API] ✅ Created row verified:`
   - If missing: Fix 1 failed (row doesn't exist)

3. **Check logs for Fix 2**:
   - Look for `[TRANSACTION_UPDATE] ✅ Successfully updated`
   - If you see `❌ Update matched 0 rows`: payment_reference mismatch

4. **Verify DB state**:
   ```sql
   SELECT payment_reference, transaction_reference, account_number 
   FROM monnify_transactions 
   ORDER BY created_at DESC LIMIT 1;
   ```
   - All three should have values (not NULL)

---

## Root Cause Summary

The bug was **not** in the code logic (all 4 steps were implemented correctly), but in **invisible failures**:

1. **Silent failures**: Monnify API calls or DB updates failing without proper error returns
2. **Missing validation**: No check that row was actually created/updated
3. **Inadequate logging**: Couldn't tell where the null values were coming from

These fixes make all failures **immediately visible** with descriptive error messages.
