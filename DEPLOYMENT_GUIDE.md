## QUICK START - APPLY MIGRATIONS TO SUPABASE

### 🚀 3 STEPS TO DEPLOY

---

### STEP 1: Apply Database Migrations
**TIME: 5 minutes**

**CHOOSE ONE METHOD:**

#### Method A: Supabase Dashboard (Easiest - No Installation)
1. Go to: https://app.supabase.com/project/YOUR_PROJECT_ID/sql/new
2. Copy this entire file content:
   `supabase/migrations/20260426_add_atomic_wallet_functions.sql`
3. Paste into SQL editor → Click "Run" (wait for completion)
4. Copy this entire file content:
   `supabase/migrations/20260426_add_session_management.sql`
5. Paste into SQL editor → Click "Run" (wait for completion)

✅ Done - Both functions and tables created

---

#### Method B: Supabase CLI
```bash
npm install -g supabase
supabase link --project-ref YOUR_PROJECT_ID
supabase db push
```

✅ Done - Migrations applied automatically

---

### STEP 2: Verify Migrations Worked
**TIME: 2 minutes**

Go to Supabase SQL Editor and run:
```sql
-- Check functions exist
SELECT proname FROM pg_proc 
WHERE proname IN ('deduct_wallet_balance', 'refund_wallet_balance');

-- Should show 2 rows: deduct_wallet_balance, refund_wallet_balance

-- Check table exists  
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'device_sessions'
);

-- Should show: true
```

If both show results → ✅ Migrations successful

If error "function not found" → Migrations failed, try Step 1 again

---

### STEP 3: Deploy Code to Vercel
**TIME: 2 minutes**

```bash
# Navigate to project
cd /vercel/share/v0-project

# Build locally to test
pnpm build

# If build succeeds:
git add .
git commit -m "Add atomic transactions & device session management"
git push origin main

# Vercel auto-deploys (or manually):
vercel deploy --prod
```

✅ Done - New code deployed

---

## WHAT THIS FIXES

### Problem 1: Race Condition on Concurrent Purchases
```
User Balance: ₦1,000

Device A clicks: Buy ₦800 data
Device B clicks: Buy ₦800 data
(Both at exact same millisecond)

BEFORE: Both succeed, balance = -₦600 ❌
AFTER: One succeeds (balance = ₦200), one fails ✅
```

### Problem 2: Multiple Devices Active Simultaneously
```
User logs in Laptop → Active
User logs in Phone (hacker with stolen password)

BEFORE: Both can make transactions (compromise) ❌
AFTER: Phone login kicks out Laptop (secure) ✅
```

### Problem 3: Authenticated Users See Marketing Page
```
User logs in, bookmarks site
Returns and lands on /

BEFORE: Shows marketing homepage ❌
AFTER: Auto-redirects to /dashboard ✅
```

---

## TESTING CHECKLIST

After deployment, test these:

### Test 1: Single Device Login (Most Important)
```
1. Open incognito window A → Login email@example.com
2. Open incognito window B → Login email@example.com
3. Back to window A → Should show "Session Ended" popup
4. Window A redirects to login
✅ Success if A is logged out
```

### Test 2: Landing Page Redirect
```
1. Login to dashboard
2. Visit mozosubz.xyz/
3. Auto-redirects to /dashboard
✅ Success if redirected
```

### Test 3: Logout Clears All Sessions
```
1. Login on phone
2. Login on laptop (same account)
3. Click logout on laptop
4. Wait 30 seconds  
5. Refresh phone
6. Phone shows "Session Ended" and redirects to login
✅ Success if phone is logged out
```

---

## ROLLBACK INSTRUCTIONS (If Needed)

⚠️ Cannot rollback migrations without breaking transactions

**Safe approach if something breaks:**
1. Contact support
2. Create new migration to disable features
3. Or keep migrations but disable session checking code

**DO NOT delete:**
- `deduct_wallet_balance()` function (breaks all purchases)
- `device_sessions` table (breaks login tracking)

---

## VERIFICATION SQL

Run these in Supabase SQL Editor to verify everything:

```sql
-- 1. Test atomic wallet function
SELECT deduct_wallet_balance(auth.uid(), 100);
-- Should return: new_balance_number

-- 2. Check device sessions table exists
SELECT COUNT(*) FROM device_sessions;
-- Should return: 0 (no sessions yet) or higher

-- 3. Check RLS policies are in place
SELECT * FROM pg_policies WHERE tablename = 'device_sessions';
-- Should show policies exist

-- 4. Verify transactions still exist
SELECT COUNT(*) FROM transactions;
-- Should return: number_of_transactions
```

---

## TROUBLESHOOTING

### Error: "function deduct_wallet_balance not found"
→ Migrations not applied
→ Go back to STEP 1, rerun SQL file

### Error: "table device_sessions not found"  
→ Second migration failed
→ Rerun: `20260426_add_session_management.sql`

### Dashboard won't load
→ Clear browser cache (Ctrl+Shift+Del / Cmd+Shift+Del)
→ Hard refresh (Ctrl+F5)

### "Session Ended" appears on first login
→ Check Supabase project is same in client and server
→ Check auth.uid() returns correct user
→ Check device_sessions table has rows

---

## SUPPORT

For issues:
1. Check SECURITY_ANALYSIS.md for detailed explanations
2. Check IMPLEMENTATION_CHECKLIST.md for full guide
3. Run verification SQL above
4. Check browser console for errors (F12)

