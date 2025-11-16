import 'dotenv/config';
import { readFileSync } from 'fs';
import postgres from 'postgres';

// Parse Supabase URL to get database connection
const supabaseUrl = process.env.SUPABASE_URL;
const projectRef = new URL(supabaseUrl).hostname.split('.')[0];

// Construct direct Postgres connection string
// Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
const dbPassword = process.env.SUPABASE_DB_PASSWORD || 'your-db-password';
const connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

console.log('⚠️  Direct database connection required to apply schema.');
console.log('📋 Please apply the schema manually using one of these methods:\n');
console.log('Method 1: Supabase Dashboard');
console.log('  1. Go to https://supabase.com/dashboard/project/' + projectRef);
console.log('  2. Click "SQL Editor" in the left menu');
console.log('  3. Click "New Query"');
console.log('  4. Copy and paste the contents of supabase-schema.sql');
console.log('  5. Click "Run" or press Ctrl+Enter\n');
console.log('Method 2: psql command line');
console.log('  psql "' + connectionString + '" < supabase-schema.sql\n');
console.log('Method 3: Copy schema below and paste into SQL Editor:\n');
console.log('─'.repeat(80));

const schema = readFileSync('./supabase-schema.sql', 'utf-8');
console.log(schema);
console.log('─'.repeat(80));

console.log('\nPress any key after applying the schema to continue with migration...');
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', () => process.exit(0));
