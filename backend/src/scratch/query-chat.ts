import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const res = await pool.query(
    'SELECT id, session_id, role, content, tool_name, created_at FROM chat_messages ORDER BY created_at DESC LIMIT 15'
  );
  console.log('Recent Messages:', JSON.stringify(res.rows, null, 2));

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
