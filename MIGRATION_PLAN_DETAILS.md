# Running the Plan Details Migration

This migration adds the `plan_details` column to the `transactions` table to properly store and display plan information for data and cable purchases.

## Migration Details

**File**: `scripts/04-add-plan-details-column.sql`

This migration:
- Adds a `plan_details` VARCHAR column to store plan/package information (e.g., "2GB 30 days", "Starter")
- Creates an index for faster queries
- Adds comments for table documentation

## Method 1: Automatic Migration (Recommended)

Run the migration script using Node.js with Supabase credentials:

```bash
node scripts/run-migration.mjs
```

This script will:
1. Read the SQL migration file
2. Execute it against your Supabase database
3. Display success/error messages

## Method 2: Manual Migration via Supabase Console

If the automatic method doesn't work:

1. Go to https://app.supabase.com
2. Select your project
3. Navigate to SQL Editor
4. Create a new query
5. Copy and paste the contents of `scripts/04-add-plan-details-column.sql`
6. Click "Run"

## Method 3: Manual Migration via psql

If you have direct database access:

```bash
psql $POSTGRES_URL -f scripts/04-add-plan-details-column.sql
```

## Verification

After running the migration, verify it worked:

```sql
-- Check if the column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name='transactions' AND column_name='plan_details';

-- Check the index
SELECT * FROM pg_indexes WHERE tablename = 'transactions' AND indexname LIKE '%plan_details%';
```

## How It Works

1. **Plan Details Storage**: When a user purchases data/cable, the plan display name is now saved to the `plan_details` column
2. **Receipt Display**: The receipt page now displays the `plan_details` field directly instead of parsing from the description
3. **Email Receipts**: Email receipts include the plan details in the extras section

## Code Changes

- `lib/utils/save-transaction.ts` - Updated to save `plan_details` to the database
- `app/dashboard/transactions/[id]/page.tsx` - Updated Receipt interface and display logic to use `plan_details`
- `scripts/04-add-plan-details-column.sql` - New migration script

## Testing

After migration, create a test transaction:
1. Go to Dashboard → Services → Data (or Cable)
2. Complete a purchase
3. View the receipt
4. Verify the "Plan" field shows the plan details (e.g., "2GB 30 days") instead of a phone number
