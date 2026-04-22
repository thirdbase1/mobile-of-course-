# ADMIN SYSTEM - COMPLETE CODEBASE INSPECTION REPORT

## PHASE 1 COMPLETE: FULL SYSTEM SCAN

---

## 1. DATABASE SCHEMA (ACTUAL COLUMNS)

### Table: `profiles` (User Profiles)
- `id` (UUID, PRIMARY KEY) - References `auth.users(id)`
- `email` (TEXT) - User email
- `full_name` (TEXT) - Full name
- `username` (TEXT, UNIQUE) - Username for referrals
- `phone_number` (TEXT) - Phone number
- `avatar_url` (TEXT) - Avatar URL
- `date_of_birth` (TEXT) - DOB
- `bvn` (TEXT) - BVN number
- `wallet_balance` (DECIMAL 15,2) - Wallet balance in NGN
- `monnify_account_number` (TEXT) - Monnify DVA number
- `monnify_account_name` (TEXT) - DVA account name
- `monnify_bank_name` (TEXT) - DVA bank name
- `monnify_account_reference` (TEXT) - DVA reference
- `dva_created_at` (TIMESTAMP WITH TIME ZONE) - When DVA was created
- `created_at` (TIMESTAMP WITH TIME ZONE) - Account creation date
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Last update date
- `referred_by` (UUID) - ID of referrer user

### Table: `transactions` (All Transaction History)
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID) - References user who made transaction
- `amount` (DECIMAL)
- `category` (VARCHAR) - AIRTIME, DATA, CABLE, ELECTRICITY, WALLET_FUND, RECHARGE_PIN
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `transaction_id` (VARCHAR) - Unique transaction ID from provider
- `service_id` (VARCHAR) - Service code (e.g., "mtn", "airtel", etc.)
- `service_name` (VARCHAR) - Human-readable service name
- `phone` (VARCHAR) - Phone number (if applicable)
- `status` (VARCHAR) - SUCCESS, FAILED, PENDING
- `description` (VARCHAR) - Transaction description
- `balance_before` (NUMERIC) - Wallet balance before
- `balance_after` (NUMERIC) - Wallet balance after
- `api_response` (TEXT) - Raw JSON API response
- `payment_reference` (VARCHAR) - Monnify payment reference
- `transaction_reference` (VARCHAR) - Monnify transaction reference
- `monnify_account_number` (VARCHAR) - Account number used
- `monnify_bank_name` (VARCHAR) - Bank used
- `monnify_account_name` (VARCHAR) - Account name
- `payment_method` (VARCHAR) - BANK_TRANSFER, etc.
- `expires_at` (TIMESTAMPTZ) - Expiration time

### Table: `monnify_transactions` (Payment Transactions)
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID) - References `auth.users(id)`
- `payment_reference` (VARCHAR 50, UNIQUE) - MOZO_<userId>_<timestamp>_<rand>
- `transaction_reference` (VARCHAR 100) - From Monnify
- `amount` (DECIMAL 15,2)
- `status` (VARCHAR 20) - PENDING, SUCCESS, EXPIRED, CANCELLED
- `account_number` (VARCHAR 20) - Monnify DVA number
- `bank_name` (VARCHAR 100) - DVA bank
- `account_name` (VARCHAR 255) - DVA account name
- `bank_code` (VARCHAR 10) - Bank code
- `ussd_code` (VARCHAR 50) - USSD code
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `expires_at` (TIMESTAMPTZ) - 20 minutes from creation
- `paid_at` (TIMESTAMPTZ) - When payment received
- `monnify_response` (JSONB) - Full Monnify response
- `updated_at` (TIMESTAMPTZ)
- `webhook_received_at` (TIMESTAMPTZ)
- `payment_method` (VARCHAR 20)
- `narration` (TEXT)
- `settled` (BOOLEAN) - Whether funds settled
- `settlement_amount` (DECIMAL 15,2)

### Table: `referrals` (Referral Tracking)
- `id` (UUID, PRIMARY KEY)
- `referrer_id` (UUID) - User who referred
- `referee_id` (UUID) - User who was referred (UNIQUE - one referral per user)
- `referral_code_used` (VARCHAR 8) - Username used as referral code
- `status` (VARCHAR 20) - PENDING, ACTIVATED
- `created_at` (TIMESTAMPTZ)
- `activated_at` (TIMESTAMPTZ)

### Table: `referral_earnings` (Commission Tracking)
- `id` (UUID, PRIMARY KEY)
- `referrer_id` (UUID) - Earner
- `referee_id` (UUID) - Transaction source
- `transaction_id` (UUID) - Which transaction earned commission
- `category` (VARCHAR 20) - AIRTIME, DATA, etc.
- `commission` (DECIMAL 10,2) - Amount earned
- `created_at` (TIMESTAMPTZ)
- `paid` (BOOLEAN) - Whether paid out
- `paid_at` (TIMESTAMPTZ)

### Table: `recent_phones` (User's Recent Phone Numbers)
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID) - References `auth.users(id)`
- `phone_number` (TEXT)
- `created_at` (TIMESTAMP WITH TIME ZONE)
- Constraint: UNIQUE(user_id, phone_number)

### Table: `auth.users` (Supabase Auth Users)
- `id` (UUID)
- `email` (TEXT)
- `raw_user_meta_data` (JSONB) - Contains full_name, username, phone
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `updated_at` (TIMESTAMP WITH TIME ZONE)

---

## 2. GSUBZ API FUNCTIONS

**Base URL:** `https://gsubz.com`
**API Key:** From `GSUBZ_API_KEY` environment variable
**All endpoints:** `/api/` path

### Function: `getDataPlans(serviceId: string)`
- **Endpoint:** `GET /api/plans?service={serviceId}`
- **Returns:** PlanResponse object
- **Cached:** Yes (30 minutes cache)
- **Response Structure:**
  ```
  {
    service: string,
    PlanName: string,
    fixedPrice: boolean,
    plans: [{
      displayName: string,
      value: string,
      price: string
    }]
  }
  ```

### Function: `getCablePlans(service: string)`
- **Endpoint:** `GET /api/plans?service={service}`
- **Returns:** PlanResponse with transformed list
- **Cached:** Yes (30 minutes cache)
- **Response Structure:** Same as getDataPlans

### Function: `buyAirtime(data: { serviceID, amount, phone, requestID? })`
- **Endpoint:** `POST /api/pay/`
- **Method:** POST with FormData
- **Fields:**
  - serviceID (mtn, airtel, glo, etisalat)
  - amount (in NGN)
  - phone (recipient number)
  - api (API_KEY)
  - requestID (optional, idempotency key)
- **Response:** ApiResponse
- **Response Structure:**
  ```
  {
    code: 200 | "200" | "000",
    status: "TRANSACTION_SUCCESSFUL" | "success" | "successful",
    description: string,
    transactionID: string,
    content?: any,
    gateway?: any
  }
  ```
- **Success Check:** `code === 200/000 AND status === TRANSACTION_SUCCESSFUL`

### Function: `buyData(data: { serviceID, plan, phone, requestID? })`
- **Endpoint:** `POST /api/pay/`
- **Method:** POST with FormData
- **Fields:**
  - serviceID (mtn, airtel, glo, etisalat)
  - plan (plan value from getDataPlans)
  - phone
  - api (API_KEY)
  - amount (empty string for plans)
  - requestID (optional)
- **Response:** ApiResponse (same structure as buyAirtime)

### Function: `buyCableSubscription(data: { serviceID, plan, phone, customerID, requestID? })`
- **Endpoint:** `POST /api/pay/`
- **Method:** POST with FormData
- **Fields:**
  - serviceID (cable provider code)
  - plan (plan value)
  - phone
  - customerID (cable customer ID)
  - api (API_KEY)
  - amount (empty string)
  - requestID (optional)
- **Response:** ApiResponse

### Function: `buyElectricityToken(data: { serviceID, phone, customerID, amount, variation_code, requestID? })`
- **Endpoint:** `POST /api/pay/`
- **Method:** POST with FormData
- **Fields:**
  - serviceID
  - phone
  - customerID
  - amount (in NGN)
  - variation_code (electricity provider variation)
  - api (API_KEY)
  - requestID (optional)
- **Response:** ApiResponse

### Function: `getWalletBalance()`
- **Endpoint:** `POST /api/balance/`
- **Returns:** `{ balance: string }`
- **Note:** This is GSUBZ merchant wallet balance, NOT user wallet

### Function: `verifyTransaction(requestID: string)`
- **Endpoint:** `POST /api/verify/`
- **Fields:**
  - api (API_KEY)
  - requestID
- **Returns:** ApiResponse with transaction status

### Function: `generateRechargePins(data: { network, value, number })`
- **Endpoint:** `POST /apiV2/generate/`
- **Fields:**
  - network
  - value
  - number
- **Returns:** PinResponse

---

## 3. MONNIFY API FUNCTIONS

**Base URLs:**
- Auth: `https://api.monnify.com/api/v1/auth/login`
- API: `https://api.monnify.com/api/v2`

**Credentials:**
- API_KEY: `MONNIFY_API_KEY`
- SECRET_KEY: `MONNIFY_SECRET_KEY`
- CONTRACT_CODE: `MONNIFY_CONTRACT_CODE`
- Authentication: Basic Auth (API_KEY:SECRET_KEY in base64)

### Function: `getMonnifyAccessToken()`
- **Endpoint:** `POST /api/v1/auth/login`
- **Method:** POST
- **Headers:**
  - Authorization: `Basic ${base64(API_KEY:SECRET_KEY)}`
  - Content-Type: application/json
- **Body:** `{}` (empty)
- **Returns:** `string | null` (access token)
- **Response Structure:**
  ```
  {
    responseBody: {
      accessToken: string,
      ...
    }
  }
  ```

### Function: `initTransaction(amount, description, paymentReference, userId, customerEmail, customerName)`
- **Endpoint:** `POST /api/v2/transactions/init-transaction`
- **Headers:**
  - Authorization: `Bearer ${accessToken}`
  - Content-Type: application/json
- **Body:**
  ```
  {
    amount,
    description,
    paymentReference,
    userId,
    customerEmail,
    customerName,
    contractCode,
    ...
  }
  ```
- **Returns:** Transaction reference and checkout URL

### Function: `initializePayment(...)` (Route Handler)
- **Internal Route:** `POST /api/monnify/init-payment`
- **Purpose:** Initialize payment checkout UI
- **Returns:** Checkout details

---

## 4. INTERNAL API ROUTES

### Authentication
- **GET/POST `/api/auth/signout`** - Logout user
- **GET/POST `/api/auth/check-username`** - Check if username available

### Transactions & Payments
- **GET `/api/checkout/[payment_reference]`** - Get checkout page
- **GET `/api/checkout/[payment_reference]/query`** - Query payment status
- **POST `/api/checkout/[payment_reference]/route`** - Handle checkout

### Wallet & Deposits
- **POST `/api/deposit/start`** - Initiate deposit
- **GET `/api/monnify/init-payment`** - Initialize Monnify payment
- **POST `/api/monnify/init-transaction`** - Create Monnify transaction
- **POST `/api/monnify/webhook`** - Webhook handler for Monnify callbacks

### Debug Routes
- **GET `/api/debug/monnify-credentials`** - Check Monnify credentials (DEV ONLY)
- **GET `/api/debug/test-monnify-auth`** - Test Monnify auth (DEV ONLY)

---

## 5. INTERNAL ACTION FUNCTIONS

### Wallet Functions (`lib/actions/wallet.ts`)
- `getWalletBalance()` - Get user wallet balance from profiles table
- `getTransactions(filters?)` - Get user transactions with optional filters
  - Filters: category, status, search, limit
  - Searches: description, phone, transaction_id

### Auth Functions (`lib/actions/auth.ts`)
- `signOut()` - Sign out user

### Profile Functions (`lib/actions/profile.ts`)
- `updateUserProfile(userId, username)` - Update username

### Transaction Functions (`lib/actions/transactions.ts`)
- `getTransaction(paymentReference)` - Get monnify_transactions by payment_reference
  - Auto-expiries transactions older than 20 mins
  - Returns standardized response
- `createTransaction(...)` - Create new monnify_transaction

### Purchase Functions
- `purchaseAirtime(formData)` - Buy airtime
  - Input: network, phone, amount (FormData)
  - Flow: Check balance → Call GSUBZ → Save transaction → Update wallet
  - Success check: code 200/000 AND TRANSACTION_SUCCESSFUL
  
- `purchaseData(formData)` - Buy data
  - Input: network, phone, plan, amount (FormData)
  
- `purchaseCable(formData)` - Buy cable
  - Input: provider, customerID, phone, plan
  
- `purchaseElectricity(formData)` - Buy electricity
  - Input: provider, amount, phone, customerID, meterNumber

### Referral Functions (`lib/actions/referral.ts`)
- `createReferralOnSignupAction(refereeId, referrerUsername)`
  - Lookup referrer by username
  - Create referral record
  - Update referred_by in profiles

---

## 6. WALLET LOGIC

### How Wallet Works
1. **Wallet stored in:** `profiles.wallet_balance` (DECIMAL 15,2 in NGN)
2. **Initial balance:** 0 (or set via deposit)
3. **Deposit flow:**
   - Create monnify_transaction
   - User transfers to DVA
   - Monnify webhook confirms
   - `saveTransaction` updates profiles.wallet_balance (+ amount)
4. **Spending flow:**
   - Check `profiles.wallet_balance >= amount`
   - Call GSUBZ API
   - If success, `saveTransaction` updates balance (- amount)
   - Transaction saved to `transactions` table

### Wallet Update Function (`lib/utils/save-transaction.ts`)
```
updateWalletBalance(userId, balanceAfter)
  - Updates profiles.wallet_balance to balanceAfter
  - Saves transaction to transactions table
```

---

## 7. TRANSACTION FLOW EXAMPLE (AIRTIME)

1. **User input:** network=MTN, phone=08123456789, amount=1000
2. **Check wallet:** `profiles.wallet_balance >= 1000` ✓
3. **Call GSUBZ:**
   ```
   buyAirtime({
     serviceID: "mtn",
     amount: "1000",
     phone: "08123456789",
     requestID: "TXN{timestamp}{random}"
   })
   ```
4. **GSUBZ responds:**
   ```
   {
     code: 200,
     status: "TRANSACTION_SUCCESSFUL",
     transactionID: "12345"
   }
   ```
5. **Save transaction:**
   ```
   saveTransaction({
     userId: user.id,
     transactionId: "12345",
     category: "AIRTIME",
     amount: 1000,
     phone: "08123456789",
     status: "SUCCESS",
     balanceBefore: 5000,
     balanceAfter: 4000,
     apiResponse: {...}
   })
   ```
6. **Update wallet:** `profiles.wallet_balance = 4000`
7. **Return success to user**

---

## 8. API ERROR HANDLING

### GSUBZ Success Codes
- code: 200 OR "200" OR "000"
- status: "TRANSACTION_SUCCESSFUL" OR "success" OR "successful"
- description: "TRANSACTION_SUCCESSFUL"

### Monnify Status Codes
- PENDING - Payment not yet received
- SUCCESS - Payment confirmed via webhook
- EXPIRED - 20 minutes passed without payment
- CANCELLED - User cancelled

---

## 9. INCONSISTENCIES FOUND

❌ **Issue 1:** Database schema not live in Supabase
   - GetOrRequestIntegration shows "0 tables found"
   - But SQL migration files exist (migrations not executed)
   - **Solution:** Run migrations via SystemAction before building admin

❌ **Issue 2:** Transaction table columns inconsistent
   - Some transactions use `category` (AIRTIME, DATA, etc.)
   - Monnify transactions use `status` field
   - **Solution:** Use actual column names in queries

✓ **Issue 3:** Referral system exists but not fully integrated
   - Tables exist: referrals, referral_earnings
   - Functions exist: createReferralOnSignupAction
   - Works correctly for user signups

---

## 10. ENVIRONMENT VARIABLES REQUIRED

### GSUBZ
- `GSUBZ_API_KEY` - Required for all purchases

### Monnify
- `MONNIFY_API_KEY` - For authentication
- `MONNIFY_SECRET_KEY` - For authentication
- `MONNIFY_CONTRACT_CODE` - For initialization

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `POSTGRES_URL`
- `SUPABASE_JWT_SECRET`

---

## 11. READY FOR ADMIN SYSTEM BUILD

### What the Admin Can Manage:
1. **Users** - View all users, profiles, wallet balances, referrals
2. **Transactions** - View all transactions, verify GSUBZ responses, check status
3. **Wallet Deposits** - View pending transfers, track Monnify payments
4. **Referral System** - Monitor referrals, payouts, earnings
5. **Services** - Monitor GSUBZ API health, success rates
6. **Revenue** - Commission tracking, payout history

### Required Permissions Table (NEW)
- Need to create: `admin_roles` table
- Fields: user_id, role (SUPER_ADMIN, MODERATOR, SUPPORT)
- Or: Add `is_admin` flag to profiles table

### Recommended Admin Features:
1. Dashboard with KPIs
2. User search and management
3. Transaction logs with filtering
4. Wallet balance auditing
5. Referral commission tracking
6. API health monitoring
7. Audit logs for admin actions

---

**INSPECTION COMPLETE - READY FOR PHASE 2**
