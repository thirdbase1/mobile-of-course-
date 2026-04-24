import { sql } from '@vercel/postgres';

async function runMigration() {
  try {
    console.log('[v0] Adding plan_details column to transactions table...');
    
    // Add the plan_details column if it doesn't exist
    await sql`
      ALTER TABLE transactions
      ADD COLUMN IF NOT EXISTS plan_details TEXT;
    `;
    
    console.log('[v0] ✓ Migration completed successfully');
  } catch (err) {
    console.error('[v0] Migration failed:', err);
    throw err;
  }
}

// Run if executed directly
if (process.argv[1].includes('run-migration')) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { runMigration };
