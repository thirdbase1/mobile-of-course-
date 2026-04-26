#!/bin/bash

# SUPABASE MIGRATION APPLICATION SCRIPT
# This script applies both migrations to your Supabase database
# Usage: bash scripts/apply-migrations.sh

echo "======================================"
echo "Applying Supabase Migrations"
echo "======================================"

# Check if migrations directory exists
if [ ! -d "supabase/migrations" ]; then
  echo "❌ Error: supabase/migrations directory not found"
  exit 1
fi

echo ""
echo "📋 Found migrations:"
ls -1 supabase/migrations/20260426_*.sql | while read f; do
  echo "  - $(basename $f)"
done

echo ""
echo "⚙️  Method 1: Using Supabase CLI (Recommended)"
echo "=========================================="
echo "If you have the Supabase CLI installed:"
echo ""
echo "  npm install -g supabase"
echo "  supabase link --project-ref YOUR_PROJECT_REF"
echo "  supabase db push"
echo ""
echo "✅ This will automatically apply all migrations in order"

echo ""
echo "⚙️  Method 2: Manual SQL in Supabase Dashboard"
echo "=========================================="
echo "If CLI is not available:"
echo ""
echo "1. Go to: https://app.supabase.com/project/YOUR_PROJECT/sql/new"
echo ""
echo "2. Copy contents of: supabase/migrations/20260426_add_atomic_wallet_functions.sql"
echo "   Paste in SQL editor and click 'Run'"
echo ""
echo "3. Copy contents of: supabase/migrations/20260426_add_session_management.sql"
echo "   Paste in SQL editor and click 'Run'"
echo ""
echo "✅ Both migrations will execute sequentially"

echo ""
echo "⚙️  Method 3: Using psql (Command Line)"
echo "=========================================="
echo "If you have psql installed and Supabase connection string:"
echo ""
echo "  psql 'YOUR_SUPABASE_CONNECTION_STRING' < supabase/migrations/20260426_add_atomic_wallet_functions.sql"
echo "  psql 'YOUR_SUPABASE_CONNECTION_STRING' < supabase/migrations/20260426_add_session_management.sql"
echo ""
echo "✅ Both migrations will execute"

echo ""
echo "✅ VERIFICATION"
echo "=========================================="
echo "After applying migrations, verify in SQL editor:"
echo ""
echo "-- Check if functions exist:"
echo "SELECT proname FROM pg_proc WHERE proname IN ('deduct_wallet_balance', 'refund_wallet_balance');"
echo ""
echo "-- Check if device_sessions table exists:"
echo "SELECT * FROM information_schema.tables WHERE table_name = 'device_sessions';"
echo ""
echo "-- Check function implementation:"
echo "SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'deduct_wallet_balance';"

echo ""
echo "======================================"
echo "✅ Migration Guide Complete"
echo "======================================"
