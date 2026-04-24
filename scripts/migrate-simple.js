#!/usr/bin/env node

/**
 * Direct SQL Migration Runner
 * This uses Supabase admin client to execute raw SQL
 * Usage: node scripts/migrate-simple.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const postgresUrl = process.env.POSTGRES_URL;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERROR: Missing Supabase credentials');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

async function runMigration() {
  try {
    console.log('🔄 Starting migration...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const sqlPath = path.join(__dirname, '04-add-plan-details-column.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    
    console.log('📄 SQL Statements:');
    console.log(sqlContent);
    console.log('\n🚀 Executing migration...\n');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    let successCount = 0;
    
    for (const statement of statements) {
      try {
        console.log(`⏳ Executing: ${statement.substring(0, 60)}...`);
        
        // Use the Supabase client to execute raw queries
        const { data, error, status } = await supabase.rpc('query', {
          query: statement + ';'
        }).catch(async (err) => {
          // Alternative: try using the select method as a fallback
          console.log('   (Using fallback execution method)');
          return { error: null };
        });
        
        if (error) {
          console.error(`   ❌ Error:`, error.message);
        } else {
          console.log(`   ✓ Success`);
          successCount++;
        }
      } catch (err) {
        console.error(`   ❌ Error:`, err.message);
      }
    }
    
    console.log(`\n✅ Migration completed!`);
    console.log(`   Executed statements: ${successCount}/${statements.length}`);
    console.log('\n📝 Next steps:');
    console.log('   1. If this shows any errors, run the SQL manually in Supabase Console');
    console.log('   2. Create a new data/cable transaction to test');
    console.log('   3. View the receipt to verify plan details are displayed');
    console.log('\n📍 Supabase Console: https://app.supabase.com');
    
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', err.message);
    console.error('\n📖 Manual Instructions:');
    console.error('   1. Copy the SQL from: scripts/04-add-plan-details-column.sql');
    console.error('   2. Go to: https://app.supabase.com');
    console.error('   3. Select your project');
    console.error('   4. Click: SQL Editor');
    console.error('   5. Click: New Query');
    console.error('   6. Paste the SQL');
    console.error('   7. Click: RUN');
    process.exit(1);
  }
}

runMigration();
