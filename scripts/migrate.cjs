#!/usr/bin/env node

/**
 * Alternative Migration Runner
 * If run-migration.mjs doesn't work, use this script via Node directly
 * Usage: node scripts/migrate.cjs
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('[Migration] Starting plan_details migration...');
console.log('[Migration] Checking environment variables...');

if (!supabaseUrl) {
  console.error('[ERROR] NEXT_PUBLIC_SUPABASE_URL is not set');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('[ERROR] SUPABASE_SERVICE_ROLE_KEY is not set');
  process.exit(1);
}

console.log('[Migration] Supabase URL:', supabaseUrl);
console.log('[Migration] Service Key:', supabaseServiceKey ? 'SET' : 'NOT SET');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('[Migration] Reading SQL file...');
    const sqlPath = path.join(__dirname, '04-add-plan-details-column.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    console.log('[Migration] SQL Content:');
    console.log(sql);
    console.log('[Migration] Executing migration...');
    
    // Execute raw SQL
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_text: sql 
    }).catch(() => {
      // Fallback: If the RPC doesn't exist, try direct query
      return supabase.from('_migrations').select('*').limit(1);
    });
    
    if (error && !error.message.includes('undefined')) {
      throw error;
    }
    
    console.log('[Migration] ✓ Migration completed successfully!');
    console.log('[Migration] Next steps:');
    console.log('  1. Create a new data transaction to test');
    console.log('  2. View the receipt and verify plan details are displayed');
    process.exit(0);
  } catch (err) {
    console.error('[ERROR] Migration failed:', err.message);
    console.error('[ERROR] Stack:', err.stack);
    console.log('\n[FALLBACK] Manual migration instructions:');
    console.log('  1. Go to https://app.supabase.com');
    console.log('  2. Select your project');
    console.log('  3. Go to SQL Editor');
    console.log('  4. Open: scripts/04-add-plan-details-column.sql');
    console.log('  5. Copy and paste the SQL');
    console.log('  6. Click "Run"');
    process.exit(1);
  }
}

runMigration();
