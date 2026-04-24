import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[v0] Missing Supabase credentials')
  console.error('[v0] NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET')
  console.error('[v0] SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('[v0] Running migration: add-plan-details-column.sql')
    
    const sqlPath = path.join(process.cwd(), 'scripts', '04-add-plan-details-column.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')
    
    console.log('[v0] SQL to execute:', sql)
    
    const { error } = await supabase.rpc('execute_sql', { sql_text: sql })
    
    if (error) {
      console.error('[v0] Migration failed:', error)
      process.exit(1)
    }
    
    console.log('[v0] Migration completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('[v0] Error running migration:', error)
    process.exit(1)
  }
}

runMigration()
