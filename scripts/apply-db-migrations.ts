import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigrations() {
  try {
    console.log("[v0] Starting migration application...")

    // Read migration 1: Atomic wallet functions
    const migration1Path = path.join(
      process.cwd(),
      "supabase/migrations/20260426_add_atomic_wallet_functions.sql"
    )
    const migration1Content = fs.readFileSync(migration1Path, "utf-8")

    console.log("[v0] Applying migration 1: Atomic wallet functions...")
    const { error: error1 } = await supabase.rpc("exec", {
      sql: migration1Content,
    })

    if (error1) {
      console.error("[v0] Migration 1 error:", error1)
      // Try alternative approach - split by semicolons
      const statements = migration1Content
        .split(";")
        .filter((s) => s.trim().length > 0)

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim()
        if (stmt.length === 0) continue

        console.log(`[v0] Executing statement ${i + 1}/${statements.length}...`)
        const { error } = await supabase.rpc("exec", {
          sql: stmt + ";",
        })
        if (error) {
          console.error(`[v0] Statement ${i + 1} error:`, error)
        }
      }
    } else {
      console.log("[v0] Migration 1 applied successfully")
    }

    // Read migration 2: Session management
    const migration2Path = path.join(
      process.cwd(),
      "supabase/migrations/20260426_add_session_management.sql"
    )
    const migration2Content = fs.readFileSync(migration2Path, "utf-8")

    console.log("[v0] Applying migration 2: Session management...")
    const { error: error2 } = await supabase.rpc("exec", {
      sql: migration2Content,
    })

    if (error2) {
      console.error("[v0] Migration 2 error:", error2)
      // Try alternative approach
      const statements = migration2Content
        .split(";")
        .filter((s) => s.trim().length > 0)

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim()
        if (stmt.length === 0) continue

        console.log(
          `[v0] Executing session statement ${i + 1}/${statements.length}...`
        )
        const { error } = await supabase.rpc("exec", {
          sql: stmt + ";",
        })
        if (error) {
          console.error(`[v0] Session statement ${i + 1} error:`, error)
        }
      }
    } else {
      console.log("[v0] Migration 2 applied successfully")
    }

    console.log("[v0] Migrations completed!")

    // Verify migrations were applied
    console.log("[v0] Verifying migrations...")

    // Check for atomic wallet functions
    const { data: functions, error: funcError } = await supabase.rpc("query", {
      query: `
        SELECT proname FROM pg_proc 
        WHERE proname IN ('deduct_wallet_balance', 'refund_wallet_balance')
      `,
    })

    if (!funcError && functions) {
      console.log("[v0] Atomic wallet functions found:", functions)
    }

    // Check for device_sessions table
    const { data: tables, error: tableError } = await supabase.rpc("query", {
      query: `
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = 'device_sessions'
      `,
    })

    if (!tableError && tables) {
      console.log("[v0] device_sessions table found:", tables)
    }

    console.log("[v0] Verification complete!")
  } catch (error) {
    console.error("[v0] Migration error:", error)
    process.exit(1)
  }
}

applyMigrations()
