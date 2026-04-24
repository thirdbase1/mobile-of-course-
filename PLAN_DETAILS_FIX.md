# Plan Details Schema Fix - Complete Guide

## What Was Fixed

The plan details (e.g., "2GB 30 days" for data, "Starter" for cable) are now properly stored in the database and displayed correctly on receipts.

**Before**: Receipt showed phone number in the "Plan" field
**After**: Receipt shows the actual plan details the user purchased

## Database Changes

### Migration File
`scripts/04-add-plan-details-column.sql`

Adds a new `plan_details` column to the transactions table:
```sql
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS plan_details VARCHAR;
```

### Code Changes

1. **`lib/utils/save-transaction.ts`**
   - Updated to save `plan_details` to the database
   - Plan information is now explicitly stored, not just in description

2. **`app/dashboard/transactions/[id]/page.tsx`**
   - Updated `Transaction` interface to include `plan_details` field
   - Updated data receipt to display `plan_details` directly
   - Updated cable receipt to display `plan_details` directly
   - Falls back to parsing description if `plan_details` is not available (for legacy data)

3. **Data Purchase Flow**
   - `app/dashboard/data/page.tsx` - Passes `planDisplayName` to purchaseData
   - `lib/actions/data.ts` - Receives planDisplayName and includes it in both description and planDetails
   - Same for cable: `app/dashboard/cable/page.tsx` and `lib/actions/cable.ts`

## How to Apply the Migration

### Option 1: Automatic (Recommended)

Run one of these commands:

```bash
# Using Node.js (simplest)
node scripts/migrate-simple.js

# Or using pnpm
pnpm node scripts/migrate-simple.js
```

### Option 2: Using Supabase Console (Manual)

1. Go to https://app.supabase.com
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy this SQL and paste it:

```sql
-- Add plan_details column to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS plan_details VARCHAR;

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_plan_details ON transactions(plan_details);
```

6. Click "Run" button

### Option 3: Using psql (Direct Database)

```bash
psql $POSTGRES_URL -f scripts/04-add-plan-details-column.sql
```

## Testing After Migration

1. **Create a test transaction:**
   - Go to Dashboard → Services → Data (or Cable)
   - Select a plan (e.g., "2GB 30 days")
   - Complete the purchase

2. **View the receipt:**
   - Go to Dashboard → History
   - Click on the recent transaction
   - Check the "Plan" field
   
   **Should show**: "2GB 30 days" (or whichever plan was purchased)
   **Should NOT show**: The phone number

3. **Check email:**
   - You should receive a receipt email
   - It should include the plan details in the receipt

## Files Created

- `scripts/04-add-plan-details-column.sql` - Migration SQL
- `scripts/run-migration.mjs` - TypeScript migration runner
- `scripts/migrate.cjs` - CommonJS migration runner
- `scripts/migrate-simple.js` - Simple Node.js migration runner
- `MIGRATION_PLAN_DETAILS.md` - Migration guide

## Verification SQL

To verify the migration worked, run this in Supabase SQL Editor:

```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='transactions' AND column_name='plan_details';

-- Check if index was created
SELECT indexname 
FROM pg_indexes 
WHERE tablename='transactions' AND indexname LIKE '%plan_details%';

-- Check a recent transaction with plan details
SELECT transaction_id, description, plan_details 
FROM transactions 
WHERE plan_details IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 5;
```

## Rollback (If Needed)

If something goes wrong, you can remove the column:

```sql
DROP INDEX IF EXISTS idx_transactions_plan_details;
ALTER TABLE transactions DROP COLUMN IF EXISTS plan_details;
```

## Support

If the migration fails:

1. **Check the error message** - It will tell you what went wrong
2. **Try Manual Option 2** - Use Supabase Console directly
3. **Check environment variables** - Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set

The code will work either way - it will gracefully fall back to parsing the description field if `plan_details` is not available.
