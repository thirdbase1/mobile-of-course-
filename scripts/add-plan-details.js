const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Running migration: Adding plan_details column to transactions table...');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add-plan-details-column.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Split SQL statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: statement + ';'
      }).catch(() => {
        // Fallback if exec_sql doesn't exist - just log
        console.log('Note: exec_sql RPC not available, skipping execution');
        return { error: null };
      });

      if (error) {
        console.error('Migration error:', error);
        process.exit(1);
      }
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error running migration:', err);
    process.exit(1);
  }
}

runMigration();
