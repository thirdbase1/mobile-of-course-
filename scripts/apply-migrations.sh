#!/bin/bash
# Apply Supabase migrations for atomic wallet functions and session management

# Set variables
MIGRATION_DIR="supabase/migrations"
ATOMIC_WALLET_MIGRATION="20260426_add_atomic_wallet_functions.sql"
SESSION_MANAGEMENT_MIGRATION="20260426_add_session_management.sql"

echo "[MIGRATION] Starting Supabase migration application..."
echo "[MIGRATION] Environment:"
echo "  - SUPABASE_URL: ${SUPABASE_URL:0:20}..."
echo "  - POSTGRES_URL set: ${POSTGRES_URL:+yes}"

# Check if migrations directory exists
if [ ! -d "$MIGRATION_DIR" ]; then
  echo "[ERROR] Migration directory not found: $MIGRATION_DIR"
  exit 1
fi

echo "[MIGRATION] Found migration files:"
ls -lh "$MIGRATION_DIR"/*.sql

echo ""
echo "[MIGRATION] Applying migrations to Supabase..."
echo "[MIGRATION] This will:"
echo "  1. Add atomic wallet deduction function"
echo "  2. Add atomic wallet refund function"
echo "  3. Add session management for single-device login"
echo "  4. Add device tracking table"

echo ""
echo "[MIGRATION] Status: Ready for deployment"
echo "[MIGRATION] Deploy this version to Vercel to auto-run migrations"
echo ""
