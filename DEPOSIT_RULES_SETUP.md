# Deposit Rules System - Implementation Guide

## Overview
A complete fintech-style deposit fee system with admin control and real-time user-facing fee calculations.

## Database Schema
Run this SQL manually in your Supabase dashboard:

```sql
-- File: /scripts/01-deposit-rules-schema.sql
-- Create table, set RLS policies, and seed default values
```

**Table: `deposit_rules`**
- `id` (UUID): Primary key
- `base_fee` (DECIMAL): Flat fee (default ₦50)
- `percentage_fee` (DECIMAL): Percentage fee (default 1.5%)
- `threshold_amount` (DECIMAL): Amount where percentage applies (default ₦2500)
- `max_fee` (DECIMAL): Optional fee cap
- `is_active` (BOOLEAN): Only one active rule exists
- `created_at`, `updated_at`: Timestamps

## Files Created

### 1. Database Migration
**File:** `/scripts/01-deposit-rules-schema.sql`
- Create deposit_rules table with defaults
- Set up RLS policies (users view, admins manage)
- Seed default rule: ₦50 base + 1.5% above ₦2500

### 2. Fee Calculation Utility
**File:** `/lib/utils/deposit-fee.ts`
- `DepositRules` interface: Type-safe rules
- `FeeCalculation` interface: Calculation result
- `calculateDepositFee()`: Core logic
  - If deposit < threshold: apply base_fee only
  - If deposit >= threshold: apply base_fee + (percentage_fee × amount)
  - Apply max_fee cap if set
  - Returns: depositAmount, processingFee, netAmount, breakdown

### 3. Server Actions
**File:** `/lib/actions/deposit-rules.ts`
- `getDepositRules()`: Fetch active rules (users & admins)
- `updateDepositRules()`: Update rules (admins only)
- `getAllDepositRules()`: View history (admins only)
- All include admin role verification

### 4. Admin Page
**File:** `/app/admin/deposit-rules/page.tsx`
- Edit: base_fee, percentage_fee, threshold_amount, max_fee
- Live preview: Shows fees for 5 example amounts (₦1k, ₦2.5k, ₦5k, ₦10k, ₦50k)
- Shows breakdown and what users receive
- Last updated timestamp
- Beautiful card-based layout with gradient background

### 5. User Deposit Page
**File:** `/app/dashboard/deposit/page.tsx` (updated)
- Real-time fee calculation as user types
- Professional display:
  - Deposit Amount
  - Processing Fee (breakdown shown)
  - Arrow separator
  - **You will receive** (highlighted in emerald)
- Quick amount buttons
- Info alert explaining fee deduction timing
- Mobile-responsive fintech design

## Fee Calculation Logic

### Example 1: Below Threshold
- Deposit: ₦1,000
- Threshold: ₦2,500
- Fee: ₦50 (base only)
- User receives: ₦950

### Example 2: Above Threshold
- Deposit: ₦10,000
- Threshold: ₦2,500
- Fee: ₦50 + (10,000 × 1.5%) = ₦50 + ₦150 = ₦200
- User receives: ₦9,800

### Example 3: With Max Fee Cap
- Deposit: ₦100,000
- Max Fee: ₦2,000 (cap)
- Calculated: ₦50 + (100,000 × 1.5%) = ₦1,550
- Fee: ₦1,550 (within cap)
- User receives: ₦98,450

### Example 4: Over Max Fee
- Deposit: ₦200,000
- Max Fee: ₦2,000 (cap)
- Calculated: ₦50 + (200,000 × 1.5%) = ₦3,050
- Fee: ₦2,000 (capped)
- User receives: ₦198,000

## Real-Time Sync

1. **Admin updates rules** at `/admin/deposit-rules`
2. **Changes saved** to `deposit_rules` table
3. **User deposit page** calls `getDepositRules()` on mount
4. **Live calculation** updates as user types amount
5. **Payment API** receives: depositAmount, processingFee, netAmount

## Setup Instructions

1. **Run SQL Migration**
   - Go to Supabase SQL Editor
   - Copy content from `/scripts/01-deposit-rules-schema.sql`
   - Execute to create table and policies

2. **Admin Access**
   - Ensure admin user has `role = 'admin'` in users table
   - Navigate to `/admin/deposit-rules`
   - Update fee configuration as needed

3. **User Experience**
   - Users navigate to `/dashboard/deposit`
   - Enter amount and see instant fee preview
   - Fees explained transparently but not technically
   - After payment, net amount credited to wallet

## UI/UX Features

✓ Fintech-style design with gradients
✓ Mobile-responsive layouts
✓ Real-time calculation (instant feedback)
✓ Professional fee breakdown display
✓ Clear "You will receive" highlighting
✓ Admin preview with multiple examples
✓ No technical jargon ("₦50 + gateway fee" ✗)
✓ Transparent but user-friendly messaging

## Integration Points

- **Admin Page**: Update deposit rules anytime
- **Deposit API** (`/api/deposit/start`): Receives processingFee and netAmount
- **Payment Processing**: Works with existing checkout flow
- **Wallet Credit**: After payment, net amount (not full deposit) credited

## Notes

- Only one active rule exists at a time (enforced by unique index)
- RLS policies control access: users can view, only admins can update
- Fee calculation is consistent between admin preview and user deposit page
- All calculations use 2 decimal places (rounded)
- No hardcoded fees - fully configurable by admin
