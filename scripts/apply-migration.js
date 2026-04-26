#!/usr/bin/env node

/**
 * Migration Runner - Executes SQL migrations to Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Not set');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? '✓ Set' : '✗ Not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function runMigration() {
  try {
    const migrationFile = path.join(__dirname, '../supabase/migrations/20260426_create_security_logging_tables.sql');
    
    if (!fs.existsSync(migrationFile)) {
      console.error(`❌ Migration file not found: ${migrationFile}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationFile, 'utf-8');
    
    console.log('📊 Running database migration...');
    console.log(`📄 File: ${migrationFile}`);
    
    // Execute the migration as a single statement
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('\n📋 Created tables:');
    console.log('  - api_logs');
    console.log('  - failed_auth_logs');
    console.log('  - suspicious_activity_logs');
    console.log('  - audit_logs');
    console.log('\n🔒 All tables have Row-Level Security enabled');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

runMigration();
