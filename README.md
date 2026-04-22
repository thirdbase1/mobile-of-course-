# Mozosubz - VTU Platform

A comprehensive Virtual Top-Up (VTU) platform for purchasing airtime, data bundles, cable TV subscriptions, electricity tokens, and recharge pins.

## Features

- 🔐 **Authentication** - Secure user registration and login with Supabase
- 💰 **Wallet System** - Manage your wallet balance and transactions
- 📱 **Airtime Purchase** - Buy airtime for all Nigerian networks
- 📶 **Data Bundles** - Purchase data plans from MTN, Airtel, Glo, and 9mobile
- 📺 **Cable TV** - Subscribe to DSTV, GOTV, and Startimes
- ⚡ **Electricity** - Buy prepaid and postpaid electricity tokens
- 🎫 **Recharge Pins** - Generate recharge pins for printing
- 📊 **Transaction History** - Track all your transactions

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **API Integration**: GSUBZ API (with Mozosubz branding)

## Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`env
# GSUBZ API
GSUBZ_API_KEY=your_gsubz_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
\`\`\`

## Getting Started

1. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

2. **Set up Supabase**:
   - Run the SQL script in `scripts/001_create_profiles_and_wallets.sql` in your Supabase SQL editor
   - This creates the necessary tables and triggers

3. **Configure environment variables**:
   - Add your GSUBZ API key from [GSUBZ Dashboard](https://gsubz.com/dashboard/key.php)
   - Add your Supabase credentials

4. **Run the development server**:
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## GSUBZ API Endpoints

### Data Plans
- **GET** `https://api.gsubz.com/api/plans?service={serviceID}`
- Services: `mtn_sme`, `mtn_datashare`, `mtn_gifting`, `airtel_gifting`, `airtel_sme`, `glo_data`, `glo_sme`, `etisalat_data`

### Buy Data
- **POST** `https://gsubz.com/api/pay/`
- Body: `serviceID`, `plan`, `api`, `amount` (empty), `phone`, `requestID` (optional)

### Buy Airtime
- **POST** `https://gsubz.com/api/pay/`
- Body: `serviceID` (mtn, airtel, glo, etisalat), `api`, `amount`, `phone`

### Cable TV Plans
- **GET** `https://api.gsubz.com/api/plans?service={service}`
- Services: `gotv`, `dstv`, `startimes`

### Buy Cable Subscription
- **POST** `https://gsubz.com/api/pay/`
- Body: `serviceID`, `api`, `plan`, `phone`, `amount` (empty), `customerID`

### Buy Electricity Token
- **POST** `https://gsubz.com/api/pay/`
- Body: `serviceID`, `api`, `phone`, `amount`, `customerID`, `variation_code` (prepaid/postpaid)
- Services: `abuja-electric`, `eko-electric`, `ibadan-electric`, `ikeja-electric`, `jos-electic`, `kaduna-electric`, `kano-electric`, `portharcourt-electric`, `aba-electric`, `yola-electric`, `benin-electric`, `enugu-electric`

### Generate Recharge Pins
- **POST** `https://gsubz.com/apiV2/generate/`
- Body: `network` (mtn, airtel, glo, 9mobile), `value` (100, 200, 400, 500), `number` (quantity)

### Wallet Balance
- **POST** `https://gsubz.com/api/balance/`
- Body: `api`

### Verify Transaction
- **POST** `https://gsubz.com/api/verify/`
- Body: `api`, `requestID`

## API Response Codes

- `200` - TRANSACTION_SUCCESSFUL
- `204` - REQUIRED_CONTENT_NOT_SENT
- `206` - INVALID_CONTENT
- `401` - INVALID_PLAN
- `402` - INSUFFICIENT_BALANCE
- `404` - CONTENT_NOT_FOUND
- `405` - REQUEST_METHOD_NOT_IN_POST
- `406` - SERVICE_DISABLED
- `502` - GATEWAY_ERROR

## Database Schema

### profiles
- `id` (uuid, primary key)
- `email` (text)
- `full_name` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### wallets
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `balance` (numeric)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### transactions
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `reference` (text)
- `amount` (numeric)
- `service_type` (text)
- `description` (text)
- `status` (text: pending, completed, failed)
- `api_response` (jsonb)
- `created_at` (timestamp)

## Project Structure

\`\`\`
├── app/
│   ├── dashboard/          # Dashboard pages
│   │   ├── data/          # Data purchase page
│   │   ├── airtime/       # Airtime purchase page
│   │   ├── cable/         # Cable TV subscription page
│   │   ├── electricity/   # Electricity payment page
│   │   ├── recharge-pins/ # Recharge pins generation page
│   │   └── transactions/  # Transaction history
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   └── forgot-password/   # Password reset page
├── lib/
│   ├── api/
│   │   └── gsubz.ts       # GSUBZ API client
│   ├── actions/           # Server actions
│   │   ├── data.ts
│   │   ├── airtime.ts
│   │   ├── cable.ts
│   │   ├── electricity.ts
│   │   ├── recharge-pins.ts
│   │   └── wallet.ts
│   └── supabase/          # Supabase client utilities
│       ├── client.ts
│       ├── server.ts
│       └── middleware.ts
├── components/            # Reusable UI components
├── proxy.ts               # Next.js 16 request middleware (replaces middleware.ts)
└── scripts/              # Database migration scripts
\`\`\`

## License

MIT
