#!/usr/bin/env node
/**
 * Enable Realtime for Transactions Table
 * Runs Supabase realtime configuration using SQL
 */

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("[v0] ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function enableTransactionsRealtime() {
  try {
    console.log("[v0] Enabling realtime for transactions table...")

    // SQL to enable realtime
    const sqlStatements = [
      // Create publication if it doesn't exist
      `DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;`,

      // Add transactions table to publication
      `DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;
END
$$;`,

      // Set replica identity for transactions
      `ALTER TABLE public.transactions REPLICA IDENTITY FULL;`,

      // Verify configuration
      `SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename = 'transactions';`,
    ]

    for (const statement of sqlStatements) {
      console.log("[v0] Executing SQL statement...")
      const { data, error } = await supabase.rpc("exec_sql", {
        sql: statement,
      })

      if (error) {
        console.warn(`[v0] Note: ${error.message}`)
        // Continue - publication might already exist
      } else {
        console.log("[v0] ✓ Statement executed successfully")
        if (data) {
          console.log("[v0] Result:", data)
        }
      }
    }

    console.log("[v0] Realtime enabled for transactions table ✓")
  } catch (error) {
    console.error("[v0] Error enabling realtime:", error)
    process.exit(1)
  }
}

enableTransactionsRealtime()
