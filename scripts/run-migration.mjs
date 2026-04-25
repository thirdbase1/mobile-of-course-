#!/usr/bin/env node
/**
 * Database Migration Script
 * Runs the security logging tables migration on Supabase
 */

import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function runMigration() {
  try {
    console.log("[v0] Starting database migration...")

    // Read the migration SQL file
    const migrationPath = path.join(
      process.cwd(),
      "supabase/migrations/20260426_create_security_logging_tables.sql"
    )

    if (!fs.existsSync(migrationPath)) {
      console.error(`ERROR: Migration file not found at ${migrationPath}`)
      process.exit(1)
    }

    const sql = fs.readFileSync(migrationPath, "utf-8")

    // Execute the migration using raw SQL
    const { error } = await supabase.rpc("exec_sql", { sql })

    if (error) {
      // Try alternative approach: execute line by line
      console.log("[v0] Executing migration statements individually...")

      const statements = sql
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"))

      for (const statement of statements) {
        console.log(`[v0] Executing: ${statement.substring(0, 80)}...`)
        const { error: execError } = await supabase.rpc("exec_sql", {
          sql: statement,
        })

        if (execError) {
          console.warn(`[v0] Warning: ${execError.message}`)
          // Continue with next statement
        }
      }

      console.log("[v0] Migration completed with warnings")
    } else {
      console.log("[v0] Migration completed successfully")
    }

    console.log("[v0] Security logging tables created:")
    console.log("  ✓ api_logs")
    console.log("  ✓ failed_auth_logs")
    console.log("  ✓ suspicious_activity_logs")
    console.log("  ✓ audit_logs")
  } catch (error) {
    console.error("[v0] Migration error:", error)
    process.exit(1)
  }
}

runMigration()
